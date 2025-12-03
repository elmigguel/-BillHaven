import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  Globe,
  ArrowRight,
  Shield,
  Users,
  TrendingUp,
  Sparkles,
  Zap,
  Lock
} from 'lucide-react';

// Supported blockchain chains with colors
const chainLogos = [
  { name: 'Ethereum', color: 'from-purple-400 to-blue-400', icon: 'ETH' },
  { name: 'Polygon', color: 'from-purple-500 to-indigo-500', icon: 'MATIC' },
  { name: 'Solana', color: 'from-green-400 to-cyan-400', icon: 'SOL' },
  { name: 'Bitcoin', color: 'from-orange-400 to-yellow-400', icon: 'BTC' },
  { name: 'TON', color: 'from-blue-400 to-sky-400', icon: 'TON' },
  { name: 'Lightning', color: 'from-yellow-400 to-orange-400', icon: 'LN' },
];

// Platform statistics
const stats = [
  { value: '11', label: 'Chains Supported', icon: Globe },
  { value: '0.8%', label: 'Min Fees', icon: TrendingUp },
  { value: '100%', label: 'Secure Escrow', icon: Shield },
];

export default function EnhancedHero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-primary">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient blob */}
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-blue/20 via-brand-purple/15 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 45, 0],
            x: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        {/* Secondary gradient blob */}
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-success-muted/15 via-brand-cyan/10 to-transparent blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [45, 0, 45],
            x: [50, 0, 50],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        {/* Accent blob */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-brand-pink/10 to-transparent blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 text-center">
        {/* Floating chain badges */}
        <motion.div
          className="flex justify-center gap-2 sm:gap-3 mb-8 flex-wrap"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {chainLogos.map((chain, index) => (
            <motion.div
              key={chain.name}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-colors cursor-default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.08,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              whileHover={{
                scale: 1.05,
                y: -2,
                transition: { duration: 0.2 }
              }}
            >
              <span className={`text-xs sm:text-sm font-medium bg-gradient-to-r ${chain.color} bg-clip-text text-transparent`}>
                {chain.icon}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block text-white">Pay Bills,</span>
          <span className="block bg-gradient-to-r from-brand-blue via-brand-purple to-success-muted bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
            Earn Crypto
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          The first <span className="text-brand-purple font-semibold">P2P escrow platform</span> where paying someone else's bills
          <span className="text-success-muted font-semibold"> earns you cryptocurrency</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to={createPageUrl('PublicBills')}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-xl shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/50 transition-all duration-300 group font-medium"
              >
                <Globe className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Explore Bills
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
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
                className="w-full sm:w-auto border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30 text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 rounded-xl shadow-lg transition-all duration-300 group font-medium"
              >
                <Lock className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Submit Bill
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Trust indicators / Stats */}
        <motion.div
          className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center px-4 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-colors min-w-[120px]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.6 + index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-success-muted" />
                <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-xs sm:text-sm text-gray-400">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Security badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-muted/10 border border-success-muted/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Shield className="w-4 h-4 text-success-muted" />
          <span className="text-sm text-success-muted font-medium">Audited Smart Contracts</span>
          <Zap className="w-4 h-4 text-success-muted" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-white/60 rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
