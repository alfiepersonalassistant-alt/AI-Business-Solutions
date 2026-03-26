import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, CheckCircle2, Mail, Database, MessageCircle, Calendar, FileText, Search, ArrowRight, Zap } from 'lucide-react';
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
  const [hasUserSent, setHasUserSent] = useState(false);
  const [generatingText, setGeneratingText] = useState('');
  const [faqOpen, setFaqOpen] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    // Force scroll to top before paint
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Force scroll to top on page load
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    
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
    setHasUserSent(true);
    setIsTyping(true);
    
    // Animated generating text
    const texts = ['Working on it', 'Thinking', 'Generating response', 'Processing'];
    let index = 0;
    const interval = setInterval(() => {
      setGeneratingText(texts[index % texts.length]);
      index++;
    }, 1500);
    
    setTimeout(() => clearInterval(interval), 500);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage.content,
        conversation_history: messages
      });

      setIsTyping(false);
      setGeneratingText('');
      
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
      setGeneratingText('');
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

  const handleContactFormSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Here you could add an API endpoint to handle contact form submissions
      // For now, we'll just show success message
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', message: '' });
      
      setTimeout(() => {
        setContactSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Contact form error:', error);
      alert('There was an error submitting your message. Please try again.');
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
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  height: hasUserSent ? '95vh' : 'auto'
                }}
                transition={{ delay: 0.4, height: { duration: 0.5 } }}
                className="glass-container rounded-2xl p-8 mb-8"
                data-testid="chat-container"
              >
                {/* Messages */}
                <div 
                  className={`overflow-y-auto mb-6 pr-2 space-y-4 ${hasUserSent ? 'h-[calc(95vh-200px)]' : 'h-[300px]'}`}
                  data-testid="messages-container"
                >
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
                      className="flex justify-start items-center gap-3"
                      data-testid="typing-indicator"
                    >
                      <div className="message-bubble message-assistant">
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                      {generatingText && (
                        <span className="text-sm text-zinc-500 italic">{generatingText}...</span>
                      )}
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

        {/* Additional Sections - Only show when chat is not expanded */}
        {!hasUserSent && currentStage !== 'complete' && (
          <>
            {/* How It Works Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    How It Works
                  </h3>
                  <p className="text-zinc-400">Simple, efficient, and tailored to your needs</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    { step: '01', title: 'Tell Us About Your Business', desc: 'Share your industry, role, and daily challenges through our AI chat' },
                    { step: '02', title: 'AI Analyzes Your Needs', desc: 'Our system identifies automation opportunities and efficiency gains' },
                    { step: '03', title: 'Get Custom Solutions', desc: 'Receive tailored recommendations and pricing for implementation' }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-container p-6 rounded-2xl hover:border-white/20 transition-all"
                      data-testid={`how-it-works-step-${idx}`}
                    >
                      <div className="text-5xl font-light mb-4 text-white/20" style={{ fontFamily: "'Outfit', sans-serif" }}>{item.step}</div>
                      <h4 className="text-xl font-medium mb-3">{item.title}</h4>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Use Cases Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Popular Use Cases
                  </h3>
                  <p className="text-zinc-400">See how businesses like yours benefit from AI automation</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Email Automation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-0"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Mail className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Mail className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Email Automation</h4>
                    <p className="text-zinc-400 text-sm">Auto-sort, prioritize, and respond to emails using AI agents</p>
                  </motion.div>

                  {/* Data Processing */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-1"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Search className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Database className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Data Processing</h4>
                    <p className="text-zinc-400 text-sm">Extract insights from reports and spreadsheets instantly</p>
                  </motion.div>

                  {/* Customer Support */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-2"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Customer Support</h4>
                    <p className="text-zinc-400 text-sm">24/7 AI chatbots handling common customer queries</p>
                  </motion.div>

                  {/* Scheduling */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-3"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Mail className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Calendar className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Scheduling & Calendar</h4>
                    <p className="text-zinc-400 text-sm">Smart meeting coordination and appointment booking</p>
                  </motion.div>

                  {/* Content Generation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-4"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <FileText className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Content Generation</h4>
                    <p className="text-zinc-400 text-sm">Create marketing copy, reports, and documentation</p>
                  </motion.div>

                  {/* Research & Analysis */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ y: -5 }}
                    className="glass-container p-6 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    data-testid="use-case-5"
                  >
                    <div className="flex items-center justify-center gap-3 mb-4 h-16">
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Search className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <Zap className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                      </motion.div>
                      <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center bg-white/5">
                        <FileText className="w-5 h-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">Research & Analysis</h4>
                    <p className="text-zinc-400 text-sm">Automated market research and competitive analysis</p>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Service Features Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Why Choose Us
                  </h3>
                  <p className="text-zinc-400">Comprehensive AI solutions designed for your success</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    { title: 'Custom AI Strategy', desc: 'Tailored solutions based on your specific business needs and goals' },
                    { title: 'Expert Implementation', desc: 'Professional setup and integration with your existing systems' },
                    { title: 'Ongoing Support', desc: '24/7 technical support and continuous optimization' },
                    { title: 'Proven ROI', desc: 'Measurable time and cost savings within the first month' }
                  ].map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="flex gap-4 items-start"
                      data-testid={`feature-${idx}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                        <p className="text-zinc-400 text-sm">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQs Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Frequently Asked Questions
                  </h3>
                </motion.div>

                <div className="space-y-4">
                  {[
                    { q: 'How long does implementation take?', a: 'Most implementations are completed within 2-4 weeks, depending on complexity and scope.' },
                    { q: 'Do I need technical expertise?', a: 'Not at all. We handle all technical aspects and provide training for your team.' },
                    { q: 'What if AI doesn\'t work for my business?', a: 'We offer a free consultation to assess fit before any commitment. Our success rate is 95%+.' },
                    { q: 'How much can I save?', a: 'Average clients save 15-30 hours per week and reduce operational costs by 20-40%.' },
                    { q: 'Is my data secure?', a: 'Yes. We use enterprise-grade encryption and comply with all data protection regulations.' }
                  ].map((faq, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="glass-container rounded-xl overflow-hidden"
                      data-testid={`faq-${idx}`}
                    >
                      <button
                        onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        className="w-full text-left p-6 flex justify-between items-center hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium">{faq.q}</span>
                        <motion.span
                          animate={{ rotate: faqOpen === idx ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          ▼
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {faqOpen === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-6 pb-6"
                          >
                            <p className="text-zinc-400 text-sm">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/5">
              <div className="max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Get In Touch
                  </h3>
                  <p className="text-zinc-400">Have questions? Send us a message or start a chat above</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="glass-container rounded-2xl p-8"
                >
                  {contactSubmitted ? (
                    <div className="text-center py-8" data-testid="contact-success-message">
                      <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-white" strokeWidth={1.5} />
                      <h4 className="text-xl font-semibold mb-2">Message Sent!</h4>
                      <p className="text-zinc-400">We'll get back to you as soon as possible.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactFormSubmit} className="space-y-6" data-testid="contact-form-section">
                      <div>
                        <input
                          type="text"
                          placeholder="Your Name *"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="input-field w-full"
                          required
                          data-testid="contact-form-name"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Your Email *"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="input-field w-full"
                          required
                          data-testid="contact-form-email"
                        />
                      </div>
                      <div>
                        <textarea
                          placeholder="Your Message *"
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          className="input-field w-full min-h-[120px] resize-none"
                          required
                          data-testid="contact-form-message"
                        />
                      </div>
                      <button
                        type="submit"
                        className="glow-button w-full bg-white text-black font-medium py-3 px-8 rounded-lg"
                        data-testid="contact-form-submit"
                      >
                        Send Message
                      </button>
                    </form>
                  )}
                  
                  <div className="text-center mt-8 pt-8 border-t border-white/10">
                    <p className="text-sm text-zinc-500 mb-4">Or start a conversation now</p>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-white hover:text-zinc-300 transition-colors font-medium"
                      data-testid="scroll-to-chat-button"
                    >
                      Start Chat →
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-zinc-500">
          <p>© 2026 AI Business Solutions. Transforming businesses with intelligent automation.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;