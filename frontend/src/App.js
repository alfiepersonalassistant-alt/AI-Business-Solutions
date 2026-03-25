import { useState, useEffect, useRef } from 'react';
import '@/App.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [sessionId] = useState(() => uuidv4());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStage, setCurrentStage] = useState('intro'); // intro, chatting, contact, complete
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [recommendations, setRecommendations] = useState(null);
  const messagesEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Initial greeting
    const initialMessage = {
      role: 'assistant',
      content: "👋 Welcome! I'm here to help you discover how AI can transform your business. Let's start by learning about what you do. What type of business or industry are you in?"
    };
    setMessages([initialMessage]);
  }, []);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: inputValue,
        conversation_history: messages
      });

      setIsTyping(false);
      
      const aiMessage = {
        role: 'assistant',
        content: response.data.response
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Check if we should move to contact stage (after ~5-6 exchanges)
      if (messages.length >= 8 && currentStage === 'intro') {
        setTimeout(() => {
          setCurrentStage('contact');
          const contactMessage = {
            role: 'assistant',
            content: "Great! I have a clear picture of your needs. Let me provide you with personalized recommendations and pricing. Please share your contact information below, and I'll send you a detailed implementation plan."
          };
          setMessages(prev => [...prev, contactMessage]);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      const errorMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing that. Could you try again?"
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitContact = async () => {
    if (!contactInfo.name || !contactInfo.email) {
      alert('Please provide your name and email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/leads`, {
        session_id: sessionId,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        conversation_history: messages
      });

      setRecommendations(response.data);
      setCurrentStage('complete');
      setIsLoading(false);

    } catch (error) {
      console.error('Lead submission error:', error);
      setIsLoading(false);
      alert('There was an error submitting your information. Please try again.');
    }
  };

  return (
    <div className="App">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="grid-overlay"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/20"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" strokeWidth={1.5} />
              <h1 className="text-xl font-light" style={{ fontFamily: "'Outfit', sans-serif" }}>
                AI Business Solutions
              </h1>
            </div>
          </div>
        </motion.header>

        {/* Main Section */}
        <div className="pt-24 pb-12 px-6 md:px-12 lg:px-24">
          <div className="max-w-5xl mx-auto">
            
            {/* Hero Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 
                className="text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Discover How AI Can{' '}
                <span className="italic">Transform</span>{' '}
                Your Business
              </h2>
              <p className="text-base leading-relaxed text-zinc-300 max-w-2xl mx-auto">
                Get personalized recommendations and pricing for AI automation solutions tailored to your business
              </p>
            </motion.div>

            {/* Chat Container */}
            {currentStage !== 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-container rounded-2xl p-8 mb-8"
                data-testid="chat-container"
              >
                {/* Messages */}
                <div className="h-[500px] overflow-y-auto mb-6 pr-2 space-y-4" data-testid="messages-container">
                  <AnimatePresence>
                    {messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${msg.role}-${index}`}
                      >
                        <div className={`message-bubble message-${msg.role}`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                      data-testid="typing-indicator"
                    >
                      <div className="message-bubble message-assistant">
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area or Contact Form */}
                {currentStage === 'contact' ? (
                  <div className="space-y-4" data-testid="contact-form">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                      className="input-field"
                      data-testid="contact-name-input"
                    />
                    <input
                      type="email"
                      placeholder="Your Email *"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="input-field"
                      data-testid="contact-email-input"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (Optional)"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="input-field"
                      data-testid="contact-phone-input"
                    />
                    <button
                      onClick={submitContact}
                      disabled={isLoading}
                      className="glow-button w-full bg-white text-black font-medium py-3 px-6 rounded-lg mt-4 disabled:opacity-50"
                      data-testid="submit-contact-button"
                    >
                      {isLoading ? 'Generating Recommendations...' : 'Get My Custom Plan'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3" data-testid="chat-input-container">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="input-field flex-1"
                      disabled={isTyping}
                      data-testid="chat-input"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isTyping || !inputValue.trim()}
                      className="glow-button bg-white text-black p-3 rounded-lg disabled:opacity-50"
                      data-testid="send-message-button"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Success/Recommendations View */}
            {currentStage === 'complete' && recommendations && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-container rounded-2xl p-8"
                data-testid="recommendations-container"
              >
                <div className="text-center mb-8">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-white" strokeWidth={1.5} />
                  <h3 className="text-2xl sm:text-3xl font-medium mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Thank You, {recommendations.name}!
                  </h3>
                  <p className="text-zinc-300">
                    We've sent your personalized AI implementation plan to <strong>{recommendations.email}</strong>
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-3 text-white">Your Recommendations:</h4>
                    <div className="text-zinc-300 whitespace-pre-line">
                      {recommendations.recommendations}
                    </div>
                  </div>

                  {recommendations.pricing_estimate && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h4 className="text-lg font-semibold mb-3 text-white">Pricing Estimate:</h4>
                      <div className="text-zinc-300 whitespace-pre-line">
                        {recommendations.pricing_estimate}
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <p className="text-sm text-zinc-400">
                      We'll be in touch shortly to discuss implementation details.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-zinc-500">
          <p>© 2026 AI Business Solutions. Transforming businesses with intelligent automation.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;