import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedHero from '@/components/sections/EnhancedHero';
import TrustIndicators from '@/components/trust/TrustIndicators';
import {
  Receipt,
  Wallet,
  Shield,
  Zap,
  ArrowRight,
  DollarSign,
  Users,
  Globe,
  CheckCircle2,
  CreditCard,
  Bitcoin,
  Coins
} from 'lucide-react';

// Animation variants for consistent animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
};

// How it works steps
const howItWorksSteps = [
  {
    icon: Receipt,
    bg: 'bg-gradient-to-br from-brand-blue to-brand-purple',
    shadow: 'shadow-brand-blue/30',
    title: '1. Submit a Bill',
    description: 'Upload your bill and specify how much crypto you want to receive. Lock funds in escrow.',
  },
  {
    icon: Users,
    bg: 'bg-gradient-to-br from-success-muted to-success-soft',
    shadow: 'shadow-success-muted/30',
    title: '2. Someone Pays',
    description: 'A payer claims your bill and sends fiat payment. Smart contract protects both parties.',
  },
  {
    icon: Wallet,
    bg: 'bg-gradient-to-br from-brand-purple to-brand-pink',
    shadow: 'shadow-brand-purple/30',
    title: '3. Receive Crypto',
    description: 'After verification, crypto is automatically released from escrow to the payer.',
  },
];

// Features list
const features = [
  {
    icon: Shield,
    color: 'text-brand-blue',
    bgColor: 'bg-brand-blue/10',
    title: 'Escrow Protected',
    desc: 'Funds locked in audited smart contracts',
  },
  {
    icon: Zap,
    color: 'text-success-muted',
    bgColor: 'bg-success-muted/10',
    title: 'Instant Settlement',
    desc: 'Auto-release after verification',
  },
  {
    icon: DollarSign,
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
    title: 'Low Fees',
    desc: 'Starting from just 0.8%',
  },
  {
    icon: Globe,
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
    title: '11 Blockchains',
    desc: 'Multi-chain support worldwide',
  },
];

// Payment methods
const paymentMethods = [
  { name: 'Credit Card', icon: CreditCard },
  { name: 'Bitcoin', icon: Bitcoin },
  { name: 'Bank Transfer', icon: Wallet },
  { name: 'Crypto', icon: Coins },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Hero Section - New Premium Component */}
      <EnhancedHero />

      {/* Trust Indicators Section */}
      <TrustIndicators />

      {/* How it Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A simple three-step process to earn crypto by paying bills
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {howItWorksSteps.map((step, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="bg-dark-card border-dark-border h-full hover:border-brand-purple/30 hover:shadow-lg hover:shadow-brand-purple/5 transition-all duration-300 group overflow-hidden">
                <CardContent className="p-6 sm:p-8 text-center relative">
                  {/* Step number background */}
                  <div className="absolute -top-4 -right-4 text-8xl font-bold text-white/5 select-none">
                    {index + 1}
                  </div>

                  <motion.div
                    className={`w-16 h-16 sm:w-20 sm:h-20 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${step.shadow} group-hover:scale-110 transition-transform duration-300`}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1 + 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20
                    }}
                  >
                    <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </motion.div>

                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-dark-secondary/50 py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose BillHaven?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Built for security, speed, and simplicity
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center p-6 sm:p-8 rounded-2xl bg-dark-card/50 border border-dark-border/50 hover:border-brand-purple/20 transition-all duration-300 group"
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <motion.div
                  className={`w-14 h-14 sm:w-16 sm:h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 200
                  }}
                >
                  <feature.icon className={`w-7 h-7 sm:w-8 sm:h-8 ${feature.color}`} />
                </motion.div>
                <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
            Accepted Payment Methods
          </h3>
          <p className="text-gray-400">
            Flexible payment options for everyone
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.name}
              className="flex items-center gap-2 px-4 sm:px-6 py-3 rounded-full bg-dark-card border border-dark-border hover:border-brand-purple/30 transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <method.icon className="w-5 h-5 text-brand-purple" />
              <span className="text-sm text-gray-300 font-medium">{method.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-brand-purple/5 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto">
              Join thousands of users already earning cryptocurrency by paying bills.
              Get started in minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('PublicBills')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white text-lg px-10 py-7 rounded-xl shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/50 transition-all duration-300 font-medium"
                  >
                    Browse Available Bills
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
              <Link to={createPageUrl('FeeStructure')}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30 text-lg px-10 py-7 rounded-xl shadow-lg transition-all duration-300 font-medium"
                  >
                    View Fee Structure
                  </Button>
                </motion.div>
              </Link>
            </div>

            {/* Trust items */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {[
                'Audited Smart Contracts',
                'Multi-Chain Support',
                '24/7 Escrow Protection',
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-2 text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-success-muted" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-border py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 BillHaven. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to={createPageUrl('FeeStructure')} className="text-sm text-gray-400 hover:text-white transition-colors">
                Fees
              </Link>
              <Link to={createPageUrl('Referral')} className="text-sm text-gray-400 hover:text-white transition-colors">
                Referral Program
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
