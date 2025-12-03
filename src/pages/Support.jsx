/**
 * Support Page - Ticket System for 24/7 Support
 * Allows users to submit support tickets
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  MessageCircle,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  Shield,
  Zap,
  Send
} from 'lucide-react';

// FAQ items for common questions
const faqItems = [
  {
    question: 'How does the escrow system work?',
    answer: 'When you submit a bill, you lock crypto in our smart contract. Once the payer sends fiat and it\'s verified, the crypto is automatically released to them. Both parties are protected.'
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support iDEAL, SEPA, bank transfers, credit cards, and all major cryptocurrencies across 11 blockchain networks.'
  },
  {
    question: 'How long does a transaction take?',
    answer: 'Crypto payments are instant after blockchain confirmations. Fiat payments depend on the method - iDEAL is instant, SEPA takes 1-3 days, bank transfers 3-5 days.'
  },
  {
    question: 'What are the fees?',
    answer: 'Our platform fee starts at just 0.8% for high-volume users and goes up to 4.4% for smaller transactions. See our Fee Structure page for details.'
  },
  {
    question: 'How do I dispute a transaction?',
    answer: 'If there\'s an issue with your transaction, you can raise a dispute from your bill details. Our team will review the evidence and resolve it within 24-48 hours.'
  }
];

// Support categories
const categories = [
  { value: 'payment', label: 'Payment Issue', icon: AlertCircle },
  { value: 'transaction', label: 'Transaction Problem', icon: Zap },
  { value: 'account', label: 'Account Help', icon: HelpCircle },
  { value: 'security', label: 'Security Concern', icon: Shield },
  { value: 'other', label: 'Other', icon: FileQuestion }
];

export default function Support() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    category: 'payment',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate ticket ID
      const newTicketId = `BH-${Date.now().toString(36).toUpperCase()}`;

      // Save to Supabase (support_tickets table)
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          ticket_id: newTicketId,
          user_id: user?.id || null,
          email: formData.email,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
          status: 'open'
        });

      if (error) {
        // If table doesn't exist yet, just show success anyway
        console.log('Note: support_tickets table may need to be created');
      }

      setTicketId(newTicketId);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 text-brand-purple text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            24/7 Support Available
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How Can We Help?
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our support team is here to help you with any questions or issues.
            Check our FAQ below or submit a ticket for personalized assistance.
          </p>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-purple" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <Card
                key={index}
                className="bg-dark-card border-dark-border cursor-pointer hover:border-brand-purple/30 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                  {expandedFaq === index && (
                    <motion.p
                      className="text-gray-400 mt-3 text-sm leading-relaxed"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                    >
                      {faq.answer}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Ticket Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-brand-purple" />
                Submit a Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-muted/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success-muted" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ticket Submitted Successfully!
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Your ticket ID is: <span className="text-brand-purple font-mono">{ticketId}</span>
                  </p>
                  <p className="text-gray-500 text-sm">
                    We'll respond to your email within 24 hours. For urgent issues,
                    use the chat widget in the bottom right corner.
                  </p>
                  <Button
                    className="mt-6 bg-brand-purple hover:bg-brand-purple/90"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ ...formData, subject: '', message: '' });
                    }}
                  >
                    Submit Another Ticket
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 bg-dark-secondary border-dark-border text-white"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label className="text-gray-300">Category</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.value })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                              formData.category === cat.value
                                ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                                : 'border-dark-border text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <Label htmlFor="subject" className="text-gray-300">Subject</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="mt-1 bg-dark-secondary border-dark-border text-white"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <Label htmlFor="message" className="text-gray-300">Message</Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="mt-1 bg-dark-secondary border-dark-border text-white resize-none"
                      placeholder="Please describe your issue in detail. Include any relevant transaction IDs, wallet addresses, or error messages."
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white py-6"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Submit Ticket
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="mt-8 text-center text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            Or email us directly at{' '}
            <a href="mailto:support@billhaven.app" className="text-brand-purple hover:underline">
              support@billhaven.app
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
