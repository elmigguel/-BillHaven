# BillHaven Component Design Specifications - Part 2

Continuation of premium component designs for BillHaven.

---

### 4. Payment Flow Steps Component

Multi-step progress indicator with animations.

```jsx
// /home/elmigguel/BillHaven/src/components/payment/PaymentSteps.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';

const stepStates = {
  completed: {
    icon: Check,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-400'
  },
  active: {
    icon: Loader2,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-500',
    borderColor: 'border-indigo-500',
    textColor: 'text-indigo-400'
  },
  pending: {
    icon: Circle,
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-700',
    borderColor: 'border-gray-600',
    textColor: 'text-gray-500'
  },
  error: {
    icon: Circle,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500',
    textColor: 'text-red-400'
  }
};

export default function PaymentSteps({ steps, currentStep, error = null }) {
  const getStepState = (index) => {
    if (error && index === currentStep) return 'error';
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* Progress line background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-700" />

        {/* Animated progress line */}
        <motion.div
          className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const state = getStepState(index);
            const config = stepStates[state];
            const Icon = config.icon;
            const isActive = state === 'active';
            const isCompleted = state === 'completed';
            const isError = state === 'error';

            return (
              <div key={index} className="flex flex-col items-center flex-1">
                {/* Step circle */}
                <motion.div
                  className={`relative w-12 h-12 rounded-full border-4 ${config.borderColor} ${config.bgColor} flex items-center justify-center z-10 mb-3`}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20
                  }}
                >
                  {/* Glow effect for active step */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.color} opacity-50 blur-lg`}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}

                  {/* Icon */}
                  <Icon
                    className={`w-6 h-6 text-white ${isActive ? 'animate-spin' : ''}`}
                    strokeWidth={2.5}
                  />

                  {/* Checkmark animation */}
                  {isCompleted && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-emerald-500"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </motion.div>

                {/* Step label */}
                <motion.div
                  className="text-center max-w-[120px]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
                >
                  <div className={`text-sm font-semibold mb-1 ${config.textColor}`}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  )}

                  {/* Error message */}
                  {isError && error && (
                    <motion.div
                      className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Example usage:
/*
const paymentSteps = [
  { title: 'Connect Wallet', description: 'Link your crypto wallet' },
  { title: 'Review Details', description: 'Confirm bill information' },
  { title: 'Send Payment', description: 'Transfer funds' },
  { title: 'Verification', description: 'Wait for confirmation' },
  { title: 'Complete', description: 'Payment successful' }
];

<PaymentSteps steps={paymentSteps} currentStep={2} />
*/
```

---

### 5. Dashboard Stats Cards

Animated statistics cards with sparklines and trend indicators.

```jsx
// /home/elmigguel/BillHaven/src/components/dashboard/PremiumStatsCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendConfig = {
  up: {
    icon: TrendingUp,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  down: {
    icon: TrendingDown,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  neutral: {
    icon: Minus,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30'
  }
};

// Simple sparkline generator
const Sparkline = ({ data = [], color = 'emerald' }) => {
  if (data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `gradient-${color}-${Math.random()}`;

  return (
    <svg
      viewBox="0 0 100 40"
      className="w-full h-12"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" className={`text-${color}-400`} stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" className={`text-${color}-400`} stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area under line */}
      <motion.polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      />

      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`text-${color}-400`}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Dots */}
      {data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return (
          <motion.circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            className={`text-${color}-400`}
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2 + index * 0.05,
              duration: 0.3,
              type: 'spring',
              stiffness: 300
            }}
          />
        );
      })}
    </svg>
  );
};

// Animated number counter
const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {typeof value === 'number' ? value.toFixed(decimals) : value}
      </motion.span>
      {suffix}
    </motion.span>
  );
};

export default function PremiumStatsCard({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend = 'neutral', // 'up', 'down', 'neutral'
  trendValue,
  icon: Icon,
  iconColor = 'from-indigo-400 to-purple-400',
  sparklineData = [],
  sparklineColor = 'emerald',
  index = 0
}) {
  const trendStyle = trendConfig[trend];
  const TrendIcon = trendStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.2 }
      }}
      className="h-full"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl h-full group">
        {/* Glassmorphic overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Border glow */}
        <div className="absolute inset-0 rounded-lg border border-white/10 group-hover:border-white/20 transition-colors duration-500" />

        {/* Top accent bar */}
        <motion.div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${iconColor}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
        />

        <CardContent className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-2">{title}</div>
              <div className="text-3xl font-bold text-white">
                <AnimatedNumber
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                />
              </div>
            </div>

            {/* Icon */}
            {Icon && (
              <motion.div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center shadow-lg`}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: index * 0.1 + 0.3,
                  duration: 0.5,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 12,
                  transition: { duration: 0.2 }
                }}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </div>

          {/* Trend indicator */}
          {trendValue && (
            <motion.div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${trendStyle.bgColor} border ${trendStyle.borderColor} mb-4`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.4, duration: 0.4 }}
            >
              <TrendIcon className={`w-3.5 h-3.5 ${trendStyle.color}`} />
              <span className={`text-xs font-semibold ${trendStyle.color}`}>
                {trendValue}
              </span>
            </motion.div>
          )}

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
            >
              <Sparkline data={sparklineData} color={sparklineColor} />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Example usage:
/*
<PremiumStatsCard
  title="Total Volume"
  value={2547893}
  prefix="$"
  decimals={0}
  trend="up"
  trendValue="+12.5%"
  icon={TrendingUp}
  iconColor="from-emerald-400 to-teal-400"
  sparklineData={[30, 45, 35, 50, 49, 60, 70, 91, 85, 78, 92, 105]}
  sparklineColor="emerald"
  index={0}
/>
*/
```

---

### 6. Premium Navigation Bar

Sticky header with glassmorphism and mobile menu.

```jsx
// /home/elmigguel/BillHaven/src/components/navigation/PremiumNavbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import PremiumWalletButton from '../wallet/PremiumWalletButton';
import {
  Menu,
  X,
  Home,
  FileText,
  LayoutDashboard,
  Settings,
  Globe,
  Sparkles
} from 'lucide-react';

const navLinks = [
  { name: 'Home', path: 'Home', icon: Home },
  { name: 'Browse Bills', path: 'PublicBills', icon: Globe },
  { name: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard },
  { name: 'My Bills', path: 'MyBills', icon: FileText },
  { name: 'Settings', path: 'Settings', icon: Settings }
];

export default function PremiumNavbar({
  walletAddress,
  walletBalance,
  walletNetwork,
  onWalletConnect,
  onWalletDisconnect,
  onCopyAddress,
  onChangeNetwork
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActivePath = (path) => {
    return location.pathname === createPageUrl(path) || location.pathname === `/${path}`;
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-gray-900/50'
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')}>
              <motion.div
                className="flex items-center gap-3 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                    BillHaven
                  </div>
                  <div className="text-xs text-gray-400 -mt-1">P2P Escrow</div>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, index) => {
                const isActive = isActivePath(link.path);
                const LinkIcon = link.icon;

                return (
                  <Link key={link.path} to={createPageUrl(link.path)}>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        className={`relative px-4 py-2 text-sm transition-all duration-300 ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <>
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-lg"
                              layoutId="navActive"
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            />
                            <motion.div
                              className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                              layoutId="navUnderline"
                              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </>
                        )}
                        <span className="relative flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          {link.name}
                        </span>
                      </Button>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Wallet & Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Wallet button - desktop */}
              <div className="hidden md:block">
                <PremiumWalletButton
                  address={walletAddress}
                  balance={walletBalance}
                  network={walletNetwork}
                  onConnect={onWalletConnect}
                  onDisconnect={onWalletDisconnect}
                  onCopyAddress={onCopyAddress}
                  onChangeNetwork={onChangeNetwork}
                />
              </div>

              {/* Mobile menu toggle */}
              <motion.div
                className="md:hidden"
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white"
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-6 h-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu panel */}
            <motion.div
              className="fixed top-20 right-4 left-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 md:hidden overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Wallet section */}
              <div className="p-4 border-b border-white/10">
                <PremiumWalletButton
                  address={walletAddress}
                  balance={walletBalance}
                  network={walletNetwork}
                  onConnect={onWalletConnect}
                  onDisconnect={onWalletDisconnect}
                  onCopyAddress={onCopyAddress}
                  onChangeNetwork={onChangeNetwork}
                />
              </div>

              {/* Navigation links */}
              <div className="p-2">
                {navLinks.map((link, index) => {
                  const isActive = isActivePath(link.path);
                  const LinkIcon = link.icon;

                  return (
                    <Link key={link.path} to={createPageUrl(link.path)}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-base mb-1 ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <LinkIcon className="w-5 h-5 mr-3" />
                          {link.name}
                          {isActive && (
                            <motion.div
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400"
                              layoutId="mobileActive"
                            />
                          )}
                        </Button>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

### 7. Loading States & Skeletons

Premium loading animations with glassmorphism.

```jsx
// /home/elmigguel/BillHaven/src/components/loading/SkeletonCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonCard({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl">
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        <div className="absolute inset-0 border border-white/10 rounded-lg" />

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="h-5 bg-white/10 rounded-lg w-3/4 animate-pulse" />

              {/* Badges skeleton */}
              <div className="flex gap-2">
                <div className="h-6 bg-white/10 rounded-full w-20 animate-pulse" />
                <div className="h-6 bg-white/10 rounded-full w-24 animate-pulse" />
              </div>
            </div>

            {/* Amount skeleton */}
            <div className="h-8 bg-white/10 rounded-lg w-24 animate-pulse" />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Payout box skeleton */}
          <div className="h-20 bg-white/5 border border-white/10 rounded-lg animate-pulse" />

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-white/10 rounded w-full animate-pulse" />
            <div className="h-3 bg-white/10 rounded w-5/6 animate-pulse" />
          </div>

          {/* Meta skeleton */}
          <div className="flex gap-4">
            <div className="h-3 bg-white/10 rounded w-24 animate-pulse" />
            <div className="h-3 bg-white/10 rounded w-20 animate-pulse" />
          </div>

          {/* Button skeleton */}
          <div className="h-9 bg-white/10 rounded-lg w-full animate-pulse" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Full page loading with logo animation
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 to-purple-950/50" />

      <div className="relative text-center">
        {/* Animated logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-6"
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          {/* Inner circle */}
          <div className="absolute inset-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full blur-2xl opacity-50" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            BillHaven
          </div>
          <div className="text-sm text-gray-400">Loading...</div>
        </motion.div>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-indigo-500 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Usage Guidelines

### Implementing Components

1. **Copy components to your project**:
   ```bash
   # Create component directories if needed
   mkdir -p src/components/sections
   mkdir -p src/components/payment
   mkdir -p src/components/navigation
   mkdir -p src/components/loading
   ```

2. **Install any missing dependencies**:
   ```bash
   npm install framer-motion lucide-react
   ```

3. **Import and use**:
   ```jsx
   import EnhancedHero from '@/components/sections/EnhancedHero';
   import PremiumBillCard from '@/components/bills/PremiumBillCard';
   import PremiumWalletButton from '@/components/wallet/PremiumWalletButton';

   function App() {
     return (
       <>
         <EnhancedHero />
         <PremiumBillCard bill={billData} />
       </>
     );
   }
   ```

### Customization

All components support:
- **Color theming**: Modify gradient classes
- **Animation timing**: Adjust transition durations
- **Size variants**: Add size props
- **Custom icons**: Replace Lucide icons with your own

### Performance Tips

1. Use `whileInView` for animations only when elements enter viewport
2. Set `viewport={{ once: true }}` to prevent re-triggering
3. Use `layout` prop sparingly (only for smooth transitions)
4. Lazy load heavy components with React.lazy()

---

## Design Tokens Reference

```css
/* Spacing Scale */
gap-1  /* 0.25rem - 4px */
gap-2  /* 0.5rem - 8px */
gap-3  /* 0.75rem - 12px */
gap-4  /* 1rem - 16px */
gap-6  /* 1.5rem - 24px */
gap-8  /* 2rem - 32px */

/* Border Radius */
rounded-lg    /* 0.5rem - 8px */
rounded-xl    /* 0.75rem - 12px */
rounded-2xl   /* 1rem - 16px */
rounded-full  /* 9999px */

/* Shadows */
shadow-lg     /* Large shadow */
shadow-xl     /* Extra large shadow */
shadow-2xl    /* 2X large shadow */
shadow-{color}-500/20  /* Colored shadow with 20% opacity */

/* Blur */
backdrop-blur-sm   /* 4px */
backdrop-blur-xl   /* 24px */
blur-lg            /* 16px */
blur-2xl           /* 40px */

/* Opacity */
bg-white/5     /* 5% white */
bg-white/10    /* 10% white */
border-white/20   /* 20% white border */
```
