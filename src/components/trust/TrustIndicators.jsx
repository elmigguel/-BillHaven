import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Users,
  TrendingUp,
  FileCheck,
  ExternalLink,
  Lock,
  Zap,
  Globe
} from 'lucide-react';

// Platform statistics - these could be fetched from an API
const platformStats = [
  {
    value: '11',
    label: 'Blockchains',
    icon: Globe,
    color: 'text-brand-blue',
    bgColor: 'bg-brand-blue/10',
    description: 'Multi-chain support'
  },
  {
    value: '100%',
    label: 'Escrow Protected',
    icon: Lock,
    color: 'text-success-muted',
    bgColor: 'bg-success-muted/10',
    description: 'Smart contract security'
  },
  {
    value: '0.8%',
    label: 'Minimum Fee',
    icon: TrendingUp,
    color: 'text-brand-purple',
    bgColor: 'bg-brand-purple/10',
    description: 'For high volume'
  },
  {
    value: '60/60',
    label: 'Tests Passing',
    icon: FileCheck,
    color: 'text-success-soft',
    bgColor: 'bg-success-soft/10',
    description: 'Contract verified'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

export default function TrustIndicators() {
  return (
    <div className="py-16 bg-dark-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Trusted by Traders Worldwide
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Enterprise-grade security with multi-chain support
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {platformStats.map((stat, index) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <Card className="bg-dark-card/50 border-dark-border/50 backdrop-blur-sm p-4 sm:p-6 hover:border-brand-purple/30 transition-colors duration-300 group">
                <div className="flex items-start gap-3">
                  <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-300 truncate">{stat.label}</p>
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stat.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Contract Verified Badge */}
          <a
            href="https://polygonscan.com/address/0x8beED27aA6d28FE42a9e792d81046DD1337a8240"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-muted/10 border border-success-muted/20 hover:border-success-muted/40 transition-colors group"
          >
            <Shield className="w-4 h-4 text-success-muted" />
            <span className="text-sm text-success-muted font-medium">Verified Contract</span>
            <ExternalLink className="w-3 h-3 text-success-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* Polygon Network Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-purple/10 border border-brand-purple/20">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />
            <span className="text-sm text-brand-purple font-medium">Polygon Mainnet</span>
          </div>

          {/* Security Audit Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20">
            <FileCheck className="w-4 h-4 text-brand-blue" />
            <span className="text-sm text-brand-blue font-medium">OpenZeppelin Standards</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
