import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EnhancedHero from '@/components/sections/EnhancedHero';
import TrustIndicators from '@/components/trust/TrustIndicators';
import AnimatedMarquee from '@/components/ui/AnimatedMarquee';
import LiveCounter from '@/components/ui/LiveCounter';
import { ChainLogos } from '@/components/ui/ChainSelector';
import BillHavenLogo from '@/components/ui/BillHavenLogo';
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
  Coins,
  X,
  Check,
  TrendingUp,
  Clock,
  Lock,
  Sparkles
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
    icon: Receipt,
    color: 'text-brand-cyan',
    bgColor: 'bg-brand-cyan/10',
    title: 'Professional Records',
    desc: 'Detailed documentation for your accountant',
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

      {/* Live Stats Counter */}
      <LiveCounter className="bg-dark-secondary/30 border-y border-dark-border/20" />

      {/* Animated Chain Marquee */}
      <div className="py-8 border-b border-dark-border/30 bg-dark-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            className="text-center text-gray-400 text-sm mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Trade across 12 blockchain networks
          </motion.p>
        </div>
        <AnimatedMarquee speed={40} />
      </div>

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
            A simple three-step process to exchange fiat for crypto securely
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

      {/* Platform Comparison Section */}
      <div className="py-20 sm:py-24 bg-dark-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why BillHaven is Different
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Compare us to traditional methods and see why crypto-native users choose BillHaven
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="p-4"></div>
                <div className="p-4 rounded-t-2xl bg-gradient-to-b from-brand-purple/20 to-transparent border border-brand-purple/30 border-b-0 text-center">
                  <BillHavenLogo size="sm" showText={false} className="justify-center mb-2" />
                  <span className="font-bold text-white">BillHaven</span>
                </div>
                <div className="p-4 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">P2P</div>
                  <span className="font-medium text-gray-400">LocalBitcoins</span>
                </div>
                <div className="p-4 text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">🏦</div>
                  <span className="font-medium text-gray-400">Traditional</span>
                </div>
              </div>

              {/* Rows */}
              {[
                { feature: 'Smart Contract Escrow', billhaven: true, p2p: false, traditional: false },
                { feature: 'Multi-Chain Support', billhaven: '12 Networks', p2p: '2-3 Networks', traditional: false },
                { feature: 'Platform Fees', billhaven: '0.8-2%', p2p: '1-5%', traditional: '3-5%' },
                { feature: 'Settlement Time', billhaven: 'Instant', p2p: '15-60 min', traditional: '1-3 days' },
                { feature: 'No KYC Required', billhaven: true, p2p: false, traditional: false },
                { feature: 'Audited Security', billhaven: true, p2p: false, traditional: true },
                { feature: 'Dispute Resolution', billhaven: 'Automated', p2p: 'Manual', traditional: 'Manual' },
              ].map((row, index) => (
                <motion.div
                  key={row.feature}
                  className="grid grid-cols-4 gap-4 border-t border-dark-border"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="p-4 text-gray-300 font-medium flex items-center">
                    {row.feature}
                  </div>
                  <div className="p-4 bg-brand-purple/5 border-x border-brand-purple/30 flex items-center justify-center">
                    {typeof row.billhaven === 'boolean' ? (
                      row.billhaven ? (
                        <Check className="w-5 h-5 text-success-muted" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600" />
                      )
                    ) : (
                      <span className="text-success-muted font-semibold">{row.billhaven}</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    {typeof row.p2p === 'boolean' ? (
                      row.p2p ? (
                        <Check className="w-5 h-5 text-gray-400" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600" />
                      )
                    ) : (
                      <span className="text-gray-400">{row.p2p}</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    {typeof row.traditional === 'boolean' ? (
                      row.traditional ? (
                        <Check className="w-5 h-5 text-gray-400" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600" />
                      )
                    ) : (
                      <span className="text-gray-400">{row.traditional}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Supported Chains Section */}
      <div className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Supported Blockchains
            </h3>
            <p className="text-gray-400">
              Trade across 12 networks with real-time settlements
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche', 'solana', 'ton', 'bitcoin', 'lightning', 'zcash'].map((chain, index) => {
              const Logo = ChainLogos[chain];
              return (
                <motion.div
                  key={chain}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-card/50 border border-dark-border hover:border-brand-purple/30 transition-all duration-300 group"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="w-10 h-10 group-hover:scale-110 transition-transform">
                    {Logo && <Logo />}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{chain === 'bsc' ? 'BSC' : chain}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* About BillHaven Section */}
      <div className="py-20 sm:py-24 bg-gradient-to-b from-dark-secondary/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                The Future of P2P<br />
                <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
                  Bill Payments
                </span>
              </h2>
              <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                BillHaven bridges the gap between traditional finance and cryptocurrency. Pay fiat for someone's bill and receive crypto directly to your wallet - secured by smart contract escrow. Professional documentation for every transaction.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'Non-custodial escrow - you control your funds' },
                  { icon: Sparkles, text: 'OpenZeppelin audited smart contracts' },
                  { icon: Receipt, text: 'Invoice factoring with comprehensive paperwork' },
                  { icon: Clock, text: 'Detailed records for your accountant' },
                ].map((item, index) => (
                  <motion.div
                    key={item.text}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="p-2 rounded-lg bg-brand-purple/10">
                      <item.icon className="w-5 h-5 text-brand-purple" />
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative p-8 rounded-2xl bg-dark-card border border-dark-border overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-brand-purple/5 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-purple/10 rounded-full blur-3xl" />

                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Contract Status</span>
                    <span className="px-3 py-1 rounded-full bg-success-muted/10 text-success-muted text-sm font-medium">
                      Verified ✓
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Network</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5">
                          {ChainLogos.polygon && <ChainLogos.polygon />}
                        </div>
                        <span className="text-white">Polygon Mainnet</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Security</span>
                      <span className="text-white">OpenZeppelin</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Test Coverage</span>
                      <span className="text-success-muted">60/60 Passing</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Chains</span>
                      <span className="text-white">12 Networks</span>
                    </div>
                  </div>

                  <a
                    href="https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 text-center rounded-xl bg-brand-purple/10 border border-brand-purple/30 text-brand-purple font-medium hover:bg-brand-purple/20 transition-colors"
                  >
                    View on PolygonScan →
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
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
              Ready to Get Started?
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto">
              Convert your fiat to crypto securely. Pay bills for others and receive cryptocurrency
              directly to your wallet through our protected escrow system.
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
              <Link to={createPageUrl('SubmitBill')}>
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
                    Submit Your Bill
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
              <Link to="/support" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                24/7 Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
