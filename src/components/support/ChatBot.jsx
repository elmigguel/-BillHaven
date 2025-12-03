/**
 * ChatBot - Live support chat widget
 * Floating chat button in bottom-right corner
 * Like Intercom/Zendesk style
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  Minimize2,
  ExternalLink
} from 'lucide-react';

// Pre-defined quick responses for common questions
const quickResponses = [
  {
    trigger: ['hello', 'hi', 'hey', 'hallo'],
    response: 'Hello! Welcome to BillHaven support. How can I help you today?'
  },
  {
    trigger: ['fee', 'fees', 'cost', 'price', 'pricing'],
    response: 'Our platform fees range from 0.8% to 4.4% depending on transaction volume. High-volume users enjoy the lowest fees. Check our Fee Structure page for details!'
  },
  {
    trigger: ['escrow', 'safe', 'secure', 'security'],
    response: 'BillHaven uses smart contract escrow to protect both parties. Your crypto is locked until fiat payment is verified. Our contracts are audited by OpenZeppelin!'
  },
  {
    trigger: ['chain', 'network', 'blockchain'],
    response: 'We support 11 blockchain networks: Ethereum, Polygon, BSC, Arbitrum, Optimism, Base, Solana, TON, Tron, Bitcoin, and Lightning Network!'
  },
  {
    trigger: ['time', 'long', 'how long', 'duration'],
    response: 'Transaction times depend on the payment method. Crypto is instant (after confirmations). iDEAL is instant, SEPA takes 1-3 days, bank transfers 3-5 days.'
  },
  {
    trigger: ['dispute', 'problem', 'issue', 'help', 'support'],
    response: 'For disputes or issues, please submit a support ticket from the Support page. Our team typically responds within 24 hours. For urgent issues, include "URGENT" in your subject line.'
  },
  {
    trigger: ['referral', 'affiliate', 'discount'],
    response: 'Our referral program gives you up to 50% off fees! Share your referral code and earn discounts when friends complete transactions. Check the Referral page for details!'
  }
];

// Get automated response based on keywords
const getAutoResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  for (const qr of quickResponses) {
    if (qr.trigger.some(word => lowerMessage.includes(word))) {
      return qr.response;
    }
  }

  return "Thanks for your message! For detailed assistance, please submit a support ticket from our Support page. Our team will respond within 24 hours. Is there anything else I can help you with?";
};

export default function ChatBot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hi! I\'m BillBot, your support assistant. Ask me about fees, escrow, supported chains, or anything else!',
      time: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      time: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate typing
    setIsTyping(true);

    // Bot response after delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: getAutoResponse(inputValue),
        time: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-brand-blue to-brand-purple shadow-2xl shadow-brand-purple/30 flex items-center justify-center z-50 group"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-brand-purple animate-ping opacity-20" />
            {/* Tooltip */}
            <span className="absolute right-full mr-3 px-3 py-1 bg-dark-card text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Need help?
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-blue to-brand-purple p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">BillHaven Support</h3>
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Online 24/7
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-primary">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'user'
                          ? 'bg-brand-purple'
                          : 'bg-dark-card border border-dark-border'
                      }`}>
                        {msg.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-brand-purple" />
                        )}
                      </div>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-brand-purple text-white rounded-br-md'
                          : 'bg-dark-card border border-dark-border text-gray-200 rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <span className="text-[10px] opacity-50 mt-1 block">
                          {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center">
                        <Bot className="w-4 h-4 text-brand-purple" />
                      </div>
                      <div className="bg-dark-card border border-dark-border px-4 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 border-t border-dark-border bg-dark-card/50">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['Fees', 'Escrow', 'Chains', 'Support'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setInputValue(topic);
                          setTimeout(() => handleSend(), 100);
                        }}
                        className="px-3 py-1 text-xs bg-dark-secondary border border-dark-border rounded-full text-gray-300 hover:border-brand-purple/50 hover:text-brand-purple transition-colors whitespace-nowrap"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-dark-border bg-dark-card">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-dark-secondary border border-dark-border rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-purple/50 text-sm"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                      className="px-4 py-3 bg-gradient-to-r from-brand-blue to-brand-purple rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-center">
                    <a
                      href="/support"
                      className="text-xs text-gray-500 hover:text-brand-purple transition-colors inline-flex items-center gap-1"
                    >
                      Need more help? Submit a ticket
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
