import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import '@/App.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, CheckCircle2, Mail, Database, MessageCircle, Calendar, FileText, Globe, Bot, Moon, Sun, Lightbulb, Wrench, HeadphonesIcon, TrendingUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import ThreeBackground from '@/components/ThreeBackground';
import WorkflowAnimation from '@/components/WorkflowAnimation';

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
  const [theme, setTheme] = useState('dark');

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
    // Set body class for theme
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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
    <div className={`App ${theme}`}>
      {/* 3D Animated Background for Hero */}
      {!hasUserSent && <ThreeBackground />}
      
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
          className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl ${
            theme === 'dark' 
              ? 'border-white/10 bg-black/20' 
              : 'border-gray-200 bg-white/80'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" strokeWidth={1.5} />
              <h1 className={`text-xl font-light ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: "Outfit, sans-serif" }}>
                AI Business Solutions
              </h1>
            </div>

            {/* Navigation - Center (Hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-sm font-medium hover:text-purple-500 transition-colors ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                How It Works
              </button>
              <button 
                onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-sm font-medium hover:text-purple-500 transition-colors ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Use Cases
              </button>
              <button 
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-sm font-medium hover:text-purple-500 transition-colors ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-sm font-medium hover:text-purple-500 transition-colors ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                FAQ
              </button>
              <button 
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-sm font-medium hover:text-purple-500 transition-colors ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Contact
              </button>
            </nav>

            {/* Theme Toggle - Right */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-purple-500/10 transition-all hover:scale-110"
              data-testid="theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-purple-400" strokeWidth={1.5} />
              ) : (
                <Moon className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </motion.header>

        {/* Main Section */}
        <div className="pt-24 pb-12 px-6 md:px-12 lg:px-24">
          <div className="max-w-5xl mx-auto">
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-12"
            >
              <h2 
                className={`text-4xl sm:text-5xl lg:text-6xl tracking-tighter font-light mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                Discover How AI Can{' '}
                <span className="italic text-purple-500">Transform</span>{' '}
                Your Business
              </h2>
              <p className={`text-base leading-relaxed max-w-2xl mx-auto ${
                theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
              }`}>
                Get personalized recommendations and pricing for AI automation solutions tailored to your business
              </p>
            </motion.div>

            {/* Chat Container */}
            {currentStage !== 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1
                }}
                transition={{ delay: 0.4 }}
                className={`rounded-2xl p-8 mb-8 ${
                  theme === 'dark' 
                    ? 'glass-container' 
                    : 'bg-white/80 backdrop-blur-xl border border-gray-200 shadow-xl'
                }`}
                data-testid="chat-container"
              >
                {/* Messages */}
                <div 
                  className={`overflow-y-auto mb-6 pr-2 space-y-4`}
                  style={{ 
                    minHeight: '200px',
                    maxHeight: hasUserSent ? '60vh' : '200px',
                    height: 'auto'
                  }}
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
                        <div className={`message-bubble ${
                          msg.role === 'user' 
                            ? `${theme === 'dark' ? 'message-user' : 'bg-purple-500 text-white'}` 
                            : `${theme === 'dark' ? 'message-assistant' : 'bg-gray-100 text-gray-900 border border-gray-200'}`
                        }`}>
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
                      className={`glow-button w-full font-medium py-3 px-6 rounded-lg mt-4 disabled:opacity-50 ${
                        theme === 'dark' 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
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
                      className={`glow-button p-3 rounded-lg disabled:opacity-50 transition-all ${
                        theme === 'dark' 
                          ? 'bg-white text-black hover:bg-gray-100' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
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

        {/* Additional Sections - Always show */}
        <>
          {/* How It Works Section */}
          <section id="how-it-works" className={`py-24 px-6 md:px-12 lg:px-24 border-t ${
            theme === 'dark' ? 'border-white/5' : 'border-gray-200'
          }`}>
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className={`text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: "Outfit, sans-serif" }}>
                    How It Works
                  </h3>
                  <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>Simple, efficient, and tailored to your needs</p>
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
                      className={`p-6 rounded-2xl hover:border-purple-500/20 transition-all ${
                        theme === 'dark' 
                          ? 'glass-container' 
                          : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                      }`}
                      data-testid={`how-it-works-step-${idx}`}
                    >
                      <div className={`text-5xl font-light mb-4 ${
                        theme === 'dark' ? 'text-white/20' : 'text-gray-200'
                      }`} style={{ fontFamily: "Outfit, sans-serif" }}>{item.step}</div>
                      <h4 className={`text-xl font-medium mb-3 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{item.title}</h4>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                      }`}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Use Cases Section */}
            <section id="use-cases" className={`py-24 px-6 md:px-12 lg:px-24 border-t ${
              theme === 'dark' ? 'border-white/5' : 'border-gray-200'
            }`}>
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className={`text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: "Outfit, sans-serif" }}>
                    Popular Use Cases
                  </h3>
                  <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>See how businesses like yours benefit from AI automation</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Email Automation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-0"
                  >
                    <WorkflowAnimation StartIcon={Mail} EndIcon={Mail} />
                    <h4 className={`text-lg font-semibold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Email Automation</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                    }`}>Auto-sort, prioritize, and respond to emails using AI agents</p>
                  </motion.div>

                  {/* Data Processing */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-1"
                  >
                    <WorkflowAnimation StartIcon={Globe} EndIcon={Database} />
                    <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Data Processing</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Extract insights from reports and spreadsheets instantly</p>
                  </motion.div>

                  {/* Customer Support */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-2"
                  >
                    <WorkflowAnimation StartIcon={MessageCircle} EndIcon={MessageCircle} />
                    <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Customer Support</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>24/7 AI chatbots handling common customer queries</p>
                  </motion.div>

                  {/* Scheduling */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-3"
                  >
                    <WorkflowAnimation StartIcon={Mail} EndIcon={Calendar} />
                    <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Scheduling & Calendar</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Smart meeting coordination and appointment booking</p>
                  </motion.div>

                  {/* Content Generation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-4"
                  >
                    <WorkflowAnimation StartIcon={MessageCircle} EndIcon={FileText} />
                    <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Content Generation</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Create marketing copy, reports, and documentation</p>
                  </motion.div>

                  {/* Research & Analysis */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ y: -5, borderColor: 'rgba(147, 51, 234, 0.3)' }}
                    className={`p-6 rounded-xl cursor-pointer hover:border-purple-500/20 transition-all ${
                      theme === 'dark' 
                        ? 'glass-container' 
                        : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                    data-testid="use-case-5"
                  >
                    <WorkflowAnimation StartIcon={Globe} EndIcon={FileText} />
                    <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Research & Analysis</h4>
                    <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Automated market research and competitive analysis</p>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Service Features Section */}
            <section id="features" className={`py-24 px-6 md:px-12 lg:px-24 border-t ${
              theme === 'dark' ? 'border-white/5' : 'border-gray-200'
            }`}>
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h3 className={`text-2xl sm:text-3xl lg:text-4xl tracking-tight font-medium mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`} style={{ fontFamily: "Outfit, sans-serif" }}>
                    Why Choose Us
                  </h3>
                  <p className={theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}>Comprehensive AI solutions designed for your success</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { icon: Lightbulb, title: 'Custom AI Strategy', desc: 'Tailored solutions based on your specific business needs and goals' },
                    { icon: Wrench, title: 'Expert Implementation', desc: 'Professional setup and integration with your existing systems' },
                    { icon: HeadphonesIcon, title: 'Ongoing Support', desc: '24/7 technical support and continuous optimization' },
                    { icon: TrendingUp, title: 'Proven ROI', desc: 'Measurable time and cost savings within the first month' }
                  ].map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -5 }}
                        className={`p-6 rounded-xl hover:border-purple-500/20 transition-all ${
                          theme === 'dark' 
                            ? 'glass-container' 
                            : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                        }`}
                        data-testid={`feature-${idx}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-purple-500/10' 
                              : 'bg-purple-100'
                          }`}>
                            <Icon className="w-6 h-6 text-purple-500" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h4>
                            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{feature.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* FAQs Section */}
            <section id="faq" className={`py-24 px-6 md:px-12 lg:px-24 border-t ${
              theme === 'dark' ? 'border-white/5' : 'border-gray-200'
            }`}>
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
                            <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Form Section */}
            <section id="contact" className={`py-24 px-6 md:px-12 lg:px-24 border-t ${
              theme === 'dark' ? 'border-white/5' : 'border-gray-200'
            }`}>
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
                        className={`glow-button w-full font-medium py-3 px-8 rounded-lg ${
                          theme === 'dark' 
                            ? 'bg-white text-black hover:bg-gray-100' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
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

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-zinc-500">
          <p>© 2026 AI Business Solutions. Transforming businesses with intelligent automation.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;