from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
BUSINESS_EMAIL = os.environ.get('BUSINESS_EMAIL')

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    message: str
    role: str  # 'user' or 'assistant'
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    session_id: str

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    lead_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    business_type: Optional[str] = None
    role: Optional[str] = None
    pain_points: Optional[str] = None
    conversation_summary: Optional[str] = None
    recommendations: Optional[str] = None
    pricing_estimate: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadSubmission(BaseModel):
    session_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    conversation_history: List[dict]

# Chat endpoint
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Validate inputs
    if not request.session_id or not request.session_id.strip():
        raise HTTPException(status_code=422, detail="session_id is required")
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=422, detail="message is required")
    
    try:
        # Initialize Gemini chat
        chat_client = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=request.session_id,
            system_message="""You are an AI business automation consultant helping business owners and employees discover how AI and AI agents can improve their operations. 

Your conversation flow:
1. Ask about their business type and industry
2. Learn about their role and daily tasks  
3. Identify pain points and repetitive tasks
4. After gathering enough information (usually 3-4 exchanges), SUMMARIZE what you learned in 1-2 sentences
5. Ask: "Does this accurately capture what you're looking for?" or "Is this correct?"
6. Wait for their confirmation (yes/correct/that's right/etc)
7. ONLY after they confirm, say: "Perfect! Let me prepare a customized solution for you. Please provide your contact details below so I can send you personalized recommendations and pricing."

IMPORTANT: 
- Ask ONE question at a time
- Keep responses concise (2-3 sentences max)
- Be conversational and professional
- DO NOT rush to ask for contact info
- ALWAYS confirm understanding before requesting contact details"""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        response = await chat_client.send_message(user_message)
        
        # Save messages to database
        user_msg = ChatMessage(
            session_id=request.session_id,
            message=request.message,
            role="user"
        )
        assistant_msg = ChatMessage(
            session_id=request.session_id,
            message=response,
            role="assistant"
        )
        
        # Store in MongoDB
        user_dict = user_msg.model_dump()
        user_dict['timestamp'] = user_dict['timestamp'].isoformat()
        assistant_dict = assistant_msg.model_dump()
        assistant_dict['timestamp'] = assistant_dict['timestamp'].isoformat()
        
        await db.chat_messages.insert_one(user_dict)
        await db.chat_messages.insert_one(assistant_dict)
        
        return ChatResponse(response=response, session_id=request.session_id)
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Lead submission endpoint
@api_router.post("/leads", response_model=Lead)
async def submit_lead(submission: LeadSubmission):
    # Validate inputs
    if not submission.session_id or not submission.session_id.strip():
        raise HTTPException(status_code=422, detail="session_id is required")
    if not submission.name or not submission.name.strip():
        raise HTTPException(status_code=422, detail="name is required")
    if not submission.email or not submission.email.strip():
        raise HTTPException(status_code=422, detail="email is required")
    
    try:
        # Extract conversation context
        conversation_text = "\n".join([
            f"{msg.get('role', 'user')}: {msg.get('content', '')}"
            for msg in submission.conversation_history
        ])
        
        # Generate recommendations and pricing using AI
        recommendations_chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"{submission.session_id}_recommendations",
            system_message="""You are an AI implementation specialist. Based on the conversation, provide:
1. 3-5 specific AI implementation recommendations tailored to their business
2. A custom pricing estimate for implementing these solutions

Be specific, actionable, and realistic. Format as:

RECOMMENDATIONS:
- [Specific recommendation with expected impact]

PRICING:
- Setup: $[amount]
- Monthly: $[amount]
- Timeline: [timeframe]"""
        ).with_model("gemini", "gemini-3-flash-preview")
        
        analysis_prompt = f"""Based on this conversation with a potential client, provide tailored AI implementation recommendations and pricing:

{conversation_text}

Client: {submission.name}
Email: {submission.email}
Phone: {submission.phone or 'Not provided'}"""
        
        recommendations_response = await recommendations_chat.send_message(
            UserMessage(text=analysis_prompt)
        )
        
        # Parse recommendations and pricing
        rec_text = recommendations_response
        pricing_text = ""
        
        if "PRICING:" in rec_text:
            parts = rec_text.split("PRICING:")
            recommendations_only = parts[0].replace("RECOMMENDATIONS:", "").strip()
            pricing_text = parts[1].strip()
        else:
            recommendations_only = rec_text.replace("RECOMMENDATIONS:", "").strip()
        
        # Create lead object
        lead = Lead(
            session_id=submission.session_id,
            name=submission.name,
            email=submission.email,
            phone=submission.phone,
            conversation_summary=conversation_text[:500],
            recommendations=recommendations_only,
            pricing_estimate=pricing_text if pricing_text else "Custom quote - contact for details"
        )
        
        # Save to database
        lead_dict = lead.model_dump()
        lead_dict['timestamp'] = lead_dict['timestamp'].isoformat()
        await db.leads.insert_one(lead_dict)
        
        # Send email notification
        try:
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #050505; color: white; padding: 20px; text-align: center; }}
        .content {{ background: #f9f9f9; padding: 20px; }}
        .section {{ margin-bottom: 20px; }}
        .label {{ font-weight: bold; color: #050505; }}
        .recommendations {{ background: white; padding: 15px; border-left: 4px solid #050505; margin: 10px 0; }}
        .pricing {{ background: #e8e8e8; padding: 15px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New AI Consultation Lead</h1>
        </div>
        <div class="content">
            <div class="section">
                <p class="label">Contact Information:</p>
                <p><strong>Name:</strong> {submission.name}</p>
                <p><strong>Email:</strong> {submission.email}</p>
                <p><strong>Phone:</strong> {submission.phone or 'Not provided'}</p>
            </div>
            
            <div class="section">
                <p class="label">Conversation Summary:</p>
                <p>{conversation_text[:500]}...</p>
            </div>
            
            <div class="section">
                <p class="label">AI-Generated Recommendations:</p>
                <div class="recommendations">
                    {recommendations_only.replace(chr(10), '<br>')}
                </div>
            </div>
            
            <div class="section">
                <p class="label">Pricing Estimate:</p>
                <div class="pricing">
                    {pricing_text.replace(chr(10), '<br>') if pricing_text else 'Custom quote - contact for details'}
                </div>
            </div>
            
            <div class="section">
                <p class="label">Lead ID:</p>
                <p>{lead.lead_id}</p>
            </div>
        </div>
    </div>
</body>
</html>"""
            
            email_params = {
                "from": SENDER_EMAIL,
                "to": [BUSINESS_EMAIL],
                "subject": f"New AI Consultation Lead: {submission.name}",
                "html": html_content
            }
            
            await asyncio.to_thread(resend.Emails.send, email_params)
            logger.info(f"Email sent for lead {lead.lead_id}")
            
        except Exception as email_error:
            logger.error(f"Failed to send email: {str(email_error)}")
            # Don't fail the request if email fails
        
        return lead
        
    except Exception as e:
        logger.error(f"Lead submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Lead submission error: {str(e)}")

# Health check
@api_router.get("/")
async def root():
    return {"message": "AI Business Automation Discovery API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()