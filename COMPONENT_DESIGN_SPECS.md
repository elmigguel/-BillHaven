# BillHaven Component Design Specifications

Production-ready React components with Tailwind CSS, Framer Motion, and shadcn/ui.

## Design Philosophy

Based on 2025 crypto platform trends:
- **Glassmorphism**: Backdrop blur with transparency for modern depth
- **Micro-interactions**: Subtle animations that enhance UX
- **Dark-first design**: Premium dark mode with vibrant accents
- **Trust indicators**: Clear security and status signals
- **Mobile-responsive**: Touch-friendly interactions

## Color System

```css
/* Trust Blue Primary - #6366F1 (Indigo 500) */
--primary: 239 84% 67%;

/* Success/Crypto Green - #10B981 (Emerald 500) */
--success: 160 84% 39%;

/* Warning/Pending - #F59E0B (Amber 500) */
--warning: 43 96% 56%;

/* Dark Mode Base */
--background: 222 47% 6%;      /* Deep navy */
--card: 222 47% 8%;             /* Slightly lighter navy */
--border: 222 47% 16%;          /* Subtle borders */
```

## Animation Principles

1. **Ease curves**: Use `[0.16, 1, 0.3, 1]` for smooth, professional motion
2. **Spring animations**: For interactive elements (stiffness: 200, damping: 20)
3. **Stagger delays**: 50-100ms between list items
4. **Hover states**: Subtle lift (y: -8px) with shadow enhancement
5. **Loading states**: Skeleton screens with shimmer effect

---

## Component Library

### 1. Enhanced Hero Section

Modern hero with gradient mesh background and trust indicators.

```jsx
// /home/elmigguel/BillHaven/src/components/sections/EnhancedHero.jsx
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
  Sparkles
} from 'lucide-react';

const chainLogos = [
  { name: 'Ethereum', color: 'from-purple-400 to-blue-400' },
  { name: 'Solana', color: 'from-green-400 to-cyan-400' },
  { name: 'Bitcoin', color: 'from-orange-400 to-yellow-400' },
  { name: 'TON', color: 'from-blue-400 to-indigo-400' }
];

const stats = [
  { value: '15K+', label: 'Bills Paid', icon: TrendingUp },
  { value: '$2.5M', label: 'Total Volume', icon: Sparkles },
  { value: '8K+', label: 'Active Users', icon: Users }
];

export default function EnhancedHero() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
        {/* Floating chain badges */}
        <motion.div
          className="flex justify-center gap-3 mb-8 flex-wrap"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {chainLogos.map((chain, index) => (
            <motion.div
              key={chain.name}
              className="px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
              whileHover={{ scale: 1.05, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <span className={`text-sm font-medium bg-gradient-to-r ${chain.color} bg-clip-text text-transparent`}>
                {chain.name}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Main headline */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="block">Pay Bills,</span>
          <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Earn Crypto
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          The first P2P escrow platform where paying someone else's bills
          <span className="text-emerald-400 font-semibold"> earns you cryptocurrency</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link to={createPageUrl('PublicBills')}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg px-10 py-7 rounded-xl shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all duration-300 group"
              >
                <Globe className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Explore Bills
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </motion.div>
          </Link>
          <Link to={createPageUrl('Dashboard')}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/30 text-lg px-10 py-7 rounded-xl shadow-lg transition-all duration-300 group"
              >
                <Shield className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Submit Bill
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Trust indicators / Stats */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 md:gap-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.6 + index * 0.1,
                duration: 0.4,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-5 h-5 text-emerald-400" />
                <span className="text-3xl font-bold text-white">{stat.value}</span>
              </div>
              <span className="text-sm text-gray-400">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            className="w-1.5 h-1.5 bg-white rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
```

---

### 2. Premium Bill Card

Advanced card with glassmorphism, status animations, and chain indicators.

```jsx
// /home/elmigguel/BillHaven/src/components/bills/PremiumBillCard.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Receipt,
  Calendar,
  Wallet,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { formatBillDate } from '../../utils/dateUtils';

// Chain/Network indicators with colors
const chainConfig = {
  ethereum: { color: 'from-purple-400 to-blue-400', icon: '⟠' },
  solana: { color: 'from-green-400 to-cyan-400', icon: '◎' },
  bitcoin: { color: 'from-orange-400 to-yellow-400', icon: '₿' },
  ton: { color: 'from-blue-400 to-indigo-400', icon: '💎' },
  usdt: { color: 'from-emerald-400 to-teal-400', icon: '₮' }
};

// Status configurations with enhanced animations
const statusConfig = {
  pending: {
    gradient: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: Clock,
    pulse: true
  },
  approved: {
    gradient: 'from-indigo-500/20 to-purple-500/20',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    icon: CheckCircle2,
    pulse: false
  },
  paid: {
    gradient: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    icon: Coins,
    pulse: false
  },
  rejected: {
    gradient: 'from-red-500/20 to-pink-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: XCircle,
    pulse: false
  }
};

const categoryIcons = {
  rent: '🏠',
  food: '🍕',
  utilities: '⚡',
  transport: '🚗',
  healthcare: '🏥',
  entertainment: '🎬',
  other: '📦'
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  hover: {
    y: -12,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const glowVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export default function PremiumBillCard({
  bill,
  onViewDetails,
  showActions = false,
  onApprove,
  onReject,
  onMarkPaid,
  index = 0
}) {
  const status = statusConfig[bill.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const chain = chainConfig[bill.crypto_currency?.toLowerCase()] || chainConfig.usdt;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl h-full group">
        {/* Glassmorphic overlay with gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${status.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        {/* Animated border glow */}
        <motion.div
          className={`absolute inset-0 rounded-lg border-2 ${status.borderColor}`}
          variants={status.pulse ? glowVariants : {}}
          initial="initial"
          animate={status.pulse ? "animate" : "initial"}
        />

        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${status.gradient}`} />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Title & Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{categoryIcons[bill.category] || '📦'}</span>
                <h3 className="font-semibold text-gray-100 text-lg truncate">
                  {bill.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status badge with icon */}
                <Badge className={`${status.bgColor} ${status.borderColor} ${status.textColor} border-2 backdrop-blur-sm`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {bill.status}
                </Badge>

                {/* Chain badge */}
                <Badge className="bg-white/5 backdrop-blur-xl border border-white/10">
                  <span className={`text-sm bg-gradient-to-r ${chain.color} bg-clip-text text-transparent font-bold`}>
                    {chain.icon} {bill.crypto_currency || 'USDT'}
                  </span>
                </Badge>

                {/* Payout multiplier badge */}
                {bill.payout_amount && bill.amount && (
                  <Badge className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{(((bill.payout_amount / bill.amount) - 1) * 100).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Right side - Amount display */}
            <motion.div
              className="text-right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.2 + index * 0.05,
                duration: 0.5,
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
            >
              <div className="text-3xl font-bold bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                ${bill.amount?.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Bill Amount
              </div>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 relative z-10">
          {/* Payout breakdown */}
          <AnimatePresence>
            {bill.payout_amount && (
              <motion.div
                className="relative overflow-hidden rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glassmorphic background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 backdrop-blur-sm" />
                <div className="absolute inset-0 border border-purple-500/20 rounded-lg" />

                <div className="relative p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-purple-300 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Platform Fee ({bill.fee_percentage}%)
                    </span>
                    <span className="text-purple-300 font-mono">
                      ${bill.fee_amount?.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      Your Payout
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-mono">
                      ${bill.payout_amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description */}
          {bill.description && (
            <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {bill.description}
            </p>
          )}

          {/* Meta information */}
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatBillDate(bill)}
            </div>
            {bill.crypto_wallet_address && (
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-mono truncate max-w-[100px]">
                  {bill.crypto_wallet_address.slice(0, 6)}...{bill.crypto_wallet_address.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Proof image link */}
          {bill.proof_image_url && (
            <motion.a
              href={bill.proof_image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors group/link"
              whileHover={{ x: 2 }}
            >
              <ExternalLink className="w-3.5 h-3.5 group-hover/link:rotate-12 transition-transform" />
              View Receipt
            </motion.a>
          )}

          {/* Transaction hash */}
          {bill.transaction_hash && (
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10" />
              <div className="absolute inset-0 border border-emerald-500/20 rounded-lg" />
              <div className="relative p-2.5">
                <p className="text-xs text-emerald-300 font-mono truncate flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  TX: {bill.transaction_hash}
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <AnimatePresence>
            {showActions && bill.status === 'pending' && (
              <motion.div
                className="flex gap-2 pt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => onApprove?.(bill)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Approve
                  </Button>
                </motion.div>
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => onReject?.(bill)}
                    variant="outline"
                    className="w-full border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {showActions && bill.status === 'approved' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onMarkPaid?.(bill)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
                  size="sm"
                >
                  <Coins className="w-4 h-4 mr-1.5" />
                  Mark as Paid
                </Button>
              </motion.div>
            )}

            {!showActions && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => onViewDetails?.(bill)}
                  variant="outline"
                  className="w-full mt-2 border-white/10 bg-white/5 backdrop-blur-sm text-gray-300 hover:bg-white/10 hover:border-white/20"
                  size="sm"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
```

---

### 3. Multi-Wallet Connection Button

Advanced wallet button with RainbowKit-inspired design.

```jsx
// /home/elmigguel/BillHaven/src/components/wallet/PremiumWalletButton.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Wallet,
  ChevronDown,
  Copy,
  ExternalLink,
  LogOut,
  Check,
  Zap,
  Shield
} from 'lucide-react';

// Wallet provider configurations
const walletProviders = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    color: 'from-orange-400 to-amber-400',
    chains: ['ethereum', 'polygon', 'bsc']
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    color: 'from-purple-400 to-indigo-400',
    chains: ['solana']
  },
  {
    id: 'tonkeeper',
    name: 'Tonkeeper',
    icon: '💎',
    color: 'from-blue-400 to-cyan-400',
    chains: ['ton']
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    color: 'from-blue-400 to-indigo-400',
    chains: ['ethereum', 'polygon', 'bsc']
  }
];

// Chain/Network selector
const networkConfig = {
  ethereum: { name: 'Ethereum', icon: '⟠', color: 'from-purple-400 to-blue-400' },
  solana: { name: 'Solana', icon: '◎', color: 'from-green-400 to-cyan-400' },
  polygon: { name: 'Polygon', icon: '⬡', color: 'from-purple-400 to-indigo-400' },
  bsc: { name: 'BSC', icon: '🟡', color: 'from-yellow-400 to-orange-400' },
  ton: { name: 'TON', icon: '💎', color: 'from-blue-400 to-cyan-400' }
};

export default function PremiumWalletButton({
  address,
  balance,
  network = 'ethereum',
  onConnect,
  onDisconnect,
  onCopyAddress,
  onChangeNetwork
}) {
  const [copied, setCopied] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  const currentNetwork = networkConfig[network] || networkConfig.ethereum;

  const handleCopy = () => {
    onCopyAddress?.(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal) => {
    if (!bal) return '0.00';
    return parseFloat(bal).toFixed(4);
  };

  // Not connected state
  if (!address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300"
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Connect Wallet
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-80 bg-gray-900/95 backdrop-blur-xl border-white/10 p-2"
        >
          <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wider px-3 py-2">
            Select Wallet
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <div className="space-y-1 p-1">
            {walletProviders.map((wallet, index) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <DropdownMenuItem
                  onClick={() => onConnect?.(wallet.id)}
                  className="cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-2xl">{wallet.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-indigo-400 group-hover:to-purple-400 transition-all">
                        {wallet.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {wallet.chains.join(', ')}
                      </div>
                    </div>
                    <Zap className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Connected state
  return (
    <div className="flex items-center gap-2">
      {/* Network selector */}
      <DropdownMenu open={isNetworkOpen} onOpenChange={setIsNetworkOpen}>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <span className={`bg-gradient-to-r ${currentNetwork.color} bg-clip-text text-transparent font-semibold`}>
                {currentNetwork.icon}
              </span>
              <ChevronDown className="w-3 h-3 ml-1 text-gray-400" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-gray-900/95 backdrop-blur-xl border-white/10"
        >
          <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wider">
            Switch Network
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          {Object.entries(networkConfig).map(([key, net]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChangeNetwork?.(key)}
              className="cursor-pointer hover:bg-white/5"
            >
              <span className={`mr-2 bg-gradient-to-r ${net.color} bg-clip-text text-transparent font-semibold`}>
                {net.icon}
              </span>
              <span className="text-white">{net.name}</span>
              {network === key && <Check className="w-4 h-4 ml-auto text-emerald-400" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Wallet info dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              size="lg"
              className="relative overflow-hidden border-0 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 shadow-lg transition-all duration-300"
            >
              {/* Glassmorphic overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
              <div className="absolute inset-0 border border-white/10 rounded-lg" />

              <span className="relative flex items-center gap-3">
                {/* Balance */}
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400">Balance</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">
                    {formatBalance(balance)} {currentNetwork.icon}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-mono text-sm text-gray-200">
                    {formatAddress(address)}
                  </span>
                </div>

                <ChevronDown className="w-4 h-4 text-gray-400" />
              </span>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 bg-gray-900/95 backdrop-blur-xl border-white/10 p-2"
        >
          {/* Wallet header */}
          <div className="px-3 py-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Connected Wallet
              </span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400 font-semibold">Active</span>
              </div>
            </div>

            {/* Balance display */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <div className="text-xs text-gray-400 mb-1">Total Balance</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-mono">
                {formatBalance(balance)}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                {currentNetwork.icon}
                <span className={`bg-gradient-to-r ${currentNetwork.color} bg-clip-text text-transparent font-semibold`}>
                  {currentNetwork.name}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-white/10" />

          {/* Actions */}
          <div className="space-y-1 p-1">
            <DropdownMenuItem
              onClick={handleCopy}
              className="cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="copied"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-3 w-full"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-3 w-full"
                  >
                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-white group-hover:text-indigo-400 transition-colors">
                      Copy Address
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
              className="cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors mr-3" />
              <span className="text-white group-hover:text-indigo-400 transition-colors">
                View on Explorer
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/10 my-2" />

            <DropdownMenuItem
              onClick={onDisconnect}
              className="cursor-pointer p-3 rounded-lg hover:bg-red-500/10 transition-colors group"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors mr-3" />
              <span className="text-white group-hover:text-red-400 transition-colors">
                Disconnect
              </span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

Continuing with more components...
