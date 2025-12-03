import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AnimatedCard,
  AnimatedButton,
  PulseButton,
  GlowButton,
  MagneticButton,
  AnimatedNumber,
  BalanceChange,
  ProgressNumber,
  FlipNumber,
  Spinner,
  DotsLoader,
  PulseLoader,
  ProgressBar,
  CircularProgress,
  SkeletonCard,
  ShimmerLoader,
  SuccessAnimation,
  ErrorAnimation,
  Confetti,
  PaymentSuccessAnimation,
  WalletConnectionCelebration,
  CelebrationBurst,
} from '@/components/animated';

import {
  useCountUp,
  useScrollAnimation,
  useTypingEffect,
  useCountdown,
} from '@/hooks';

import { Play, RefreshCw, Wallet, CreditCard, TrendingUp, Users, DollarSign } from 'lucide-react';

/**
 * AnimationShowcase - Comprehensive demo of all BillHaven animations
 *
 * This page demonstrates all available animation components and hooks.
 * Use this as a reference for implementing animations in your pages.
 */
export default function AnimationShowcase() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showWalletConnection, setShowWalletConnection] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [progress, setProgress] = useState(0);
  const [balance, setBalance] = useState(1000);

  const { count: countUp } = useCountUp(5000, { duration: 2 });
  const { displayText } = useTypingEffect('BillHaven - Seamless crypto bill payments');
  const { time: countdown, start: startCountdown, reset: resetCountdown } = useCountdown(10);
  const { ref: scrollRef, isVisible } = useScrollAnimation();

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const triggerError = () => {
    setShowError(true);
    setTimeout(() => setShowError(false), 2500);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const triggerPaymentSuccess = () => {
    setShowPaymentSuccess(true);
    setTimeout(() => setShowPaymentSuccess(false), 4000);
  };

  const triggerWalletConnection = () => {
    setShowWalletConnection(true);
    setTimeout(() => setShowWalletConnection(false), 3000);
  };

  const triggerBurst = () => {
    setShowBurst(true);
    setTimeout(() => setShowBurst(false), 2000);
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const increaseBalance = () => {
    setBalance((prev) => prev + 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BillHaven Animation Showcase
          </h1>
          <p className="text-lg text-gray-600 font-mono">{displayText}</p>
        </motion.div>

        {/* Stats Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Animated Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard index={0} withHoverLift withGlow>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Bills</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <AnimatedNumber value={countUp} decimals={0} className="text-3xl font-bold text-gray-900" />
                <p className="text-xs text-gray-500 mt-2">+12% from last month</p>
              </div>
            </AnimatedCard>

            <AnimatedCard index={1} withHoverLift>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <AnimatedNumber value={2345} decimals={0} className="text-3xl font-bold text-gray-900" />
                <p className="text-xs text-gray-500 mt-2">+8% from last month</p>
              </div>
            </AnimatedCard>

            <AnimatedCard index={2} withHoverLift>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Current Balance</h3>
                  <DollarSign className="w-5 h-5 text-purple-500" />
                </div>
                <BalanceChange oldValue={balance - 500} newValue={balance} />
                <button
                  onClick={increaseBalance}
                  className="text-xs text-blue-600 mt-2 hover:underline"
                >
                  Add +$500
                </button>
              </div>
            </AnimatedCard>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Animated Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <AnimatedButton>Standard Button</AnimatedButton>
            <PulseButton>Pulse Button</PulseButton>
            <GlowButton glowColor="blue">Glow Button</GlowButton>
            <MagneticButton>Magnetic Button</MagneticButton>
            <AnimatedButton isLoading loadingText="Processing...">
              Loading Button
            </AnimatedButton>
            <AnimatedButton success>Success Button</AnimatedButton>
            <AnimatedButton error>Error Button</AnimatedButton>
          </div>
        </section>

        {/* Numbers */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Animated Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Count Up</h3>
              <AnimatedNumber value={12345.67} format="number" decimals={2} className="text-4xl font-bold text-gray-900" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Currency</h3>
              <AnimatedNumber value={9876.54} format="currency" decimals={2} className="text-4xl font-bold text-green-600" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Flip Number</h3>
              <FlipNumber value={Math.floor(Date.now() / 1000) % 100} className="text-4xl font-bold text-blue-600" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Progress to Goal</h3>
              <ProgressNumber current={7500} goal={10000} format="currency" />
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-4">
              <h3 className="text-sm font-medium text-gray-600">Spinner</h3>
              <Spinner size="lg" />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-4">
              <h3 className="text-sm font-medium text-gray-600">Dots Loader</h3>
              <DotsLoader />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-4">
              <h3 className="text-sm font-medium text-gray-600">Pulse Loader</h3>
              <PulseLoader />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm col-span-full">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Progress Bar</h3>
              <ProgressBar progress={progress} showPercentage />
              <button
                onClick={simulateProgress}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Simulate Progress
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-4">
              <h3 className="text-sm font-medium text-gray-600">Circular Progress</h3>
              <CircularProgress progress={75} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm col-span-2">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Skeleton Card</h3>
              <SkeletonCard />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm col-span-full">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Shimmer Loader</h3>
              <ShimmerLoader className="h-32 bg-gray-200 rounded-lg">
                <div className="h-full flex items-center justify-center text-gray-400">
                  Hover to see shimmer effect
                </div>
              </ShimmerLoader>
            </div>
          </div>
        </section>

        {/* Special Effects */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Special Effects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={triggerSuccess}
              className="p-6 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex flex-col items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Success Animation
            </button>

            <button
              onClick={triggerError}
              className="p-6 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex flex-col items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Error Animation
            </button>

            <button
              onClick={triggerConfetti}
              className="p-6 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex flex-col items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Confetti
            </button>

            <button
              onClick={triggerPaymentSuccess}
              className="p-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex flex-col items-center gap-2"
            >
              <CreditCard className="w-6 h-6" />
              Payment Success
            </button>

            <button
              onClick={triggerWalletConnection}
              className="p-6 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors flex flex-col items-center gap-2"
            >
              <Wallet className="w-6 h-6" />
              Wallet Connected
            </button>

            <button
              onClick={triggerBurst}
              className="p-6 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors flex flex-col items-center gap-2"
            >
              <Play className="w-6 h-6" />
              Celebration Burst
            </button>
          </div>
        </section>

        {/* Hooks Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Animation Hooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 mb-4">useCountdown</h3>
              <div className="text-6xl font-bold text-center text-blue-600 mb-4">
                {countdown}s
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startCountdown}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Start
                </button>
                <button
                  onClick={resetCountdown}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="bg-white p-6 rounded-xl shadow-sm"
            >
              <h3 className="text-sm font-medium text-gray-600 mb-4">useScrollAnimation</h3>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              >
                {isVisible ? 'Visible!' : 'Scroll to reveal'}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Usage Guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Start Guide</h2>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Import Components</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto mb-6">
{`import {
  AnimatedCard,
  AnimatedButton,
  AnimatedNumber,
  Spinner,
  SuccessAnimation,
} from '@/components/animated';

import {
  useCountUp,
  useScrollAnimation,
} from '@/hooks';`}
            </pre>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Usage</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
{`// Animated Card with hover lift
<AnimatedCard index={0} withHoverLift>
  <div className="p-6">
    <h3>Card Title</h3>
    <AnimatedNumber value={1000} format="currency" />
  </div>
</AnimatedCard>

// Count up hook
const { count } = useCountUp(1000, { duration: 2 });
<span>{count}</span>

// Success animation
<SuccessAnimation
  show={showSuccess}
  message="Payment Complete!"
/>`}
            </pre>
          </div>
        </section>
      </div>

      {/* Effect Components */}
      <SuccessAnimation show={showSuccess} message="Operation successful!" />
      <ErrorAnimation show={showError} message="Something went wrong!" />
      <Confetti show={showConfetti} />
      <PaymentSuccessAnimation
        show={showPaymentSuccess}
        amount={250.50}
        currency="USD"
      />
      <WalletConnectionCelebration
        show={showWalletConnection}
        walletName="MetaMask"
      />
      <CelebrationBurst show={showBurst} />
    </div>
  );
}
