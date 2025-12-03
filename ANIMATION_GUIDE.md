# BillHaven Animation System Guide

Complete guide to Framer Motion animations in BillHaven.

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Components](#components)
- [Hooks](#hooks)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Accessibility](#accessibility)

---

## Overview

BillHaven uses **Framer Motion 12.23.25** for smooth, performant animations throughout the application. Our animation system is:

- **Accessible**: Respects `prefers-reduced-motion`
- **Performant**: 60fps on all devices
- **Consistent**: Unified timing and easing
- **Mobile-friendly**: Optimized for touch devices

---

## Installation

Framer Motion is already installed in the project:

```bash
npm install framer-motion@^12.23.25
```

---

## Quick Start

### Import Components

```jsx
import {
  AnimatedCard,
  AnimatedButton,
  AnimatedNumber,
  Spinner,
  SuccessAnimation,
} from '@/components/animated';

import {
  useCountUp,
  useScrollAnimation,
} from '@/hooks';
```

### Basic Usage

```jsx
// Animated Card
<AnimatedCard index={0} withHoverLift>
  <div className="p-6">
    <h3>Total Revenue</h3>
    <AnimatedNumber value={12345.67} format="currency" />
  </div>
</AnimatedCard>

// Animated Button
<AnimatedButton isLoading={loading}>
  Submit Payment
</AnimatedButton>

// Success Animation
<SuccessAnimation
  show={showSuccess}
  message="Payment Complete!"
/>
```

---

## Components

### 1. AnimatedCard

Enhanced card component with entry animations and hover effects.

**Props:**
- `index` (number): Stagger delay index (default: 0)
- `withGlow` (boolean): Enable glow on hover (default: false)
- `withHoverLift` (boolean): Enable lift effect (default: true)
- `className` (string): Additional CSS classes

**Example:**
```jsx
<AnimatedCard index={0} withHoverLift withGlow>
  <CardContent>
    <h3>Active Bills</h3>
    <p className="text-3xl font-bold">24</p>
  </CardContent>
</AnimatedCard>
```

**Sub-components:**
- `AnimatedCardHeader`
- `AnimatedCardContent`
- `AnimatedCardFooter`

---

### 2. AnimatedButton

Button with hover/tap animations and loading states.

**Props:**
- `isLoading` (boolean): Show loading spinner
- `success` (boolean): Show success state
- `error` (boolean): Trigger error shake
- `loadingText` (string): Loading state text

**Variants:**
- `AnimatedButton` - Standard button
- `PulseButton` - Continuous pulse effect
- `GlowButton` - Glow on hover
- `MagneticButton` - Follows cursor

**Example:**
```jsx
<AnimatedButton
  isLoading={submitting}
  loadingText="Processing..."
  onClick={handleSubmit}
>
  Pay Bill
</AnimatedButton>

<PulseButton>
  Connect Wallet
</PulseButton>

<GlowButton glowColor="green">
  Confirm Payment
</GlowButton>
```

---

### 3. AnimatedNumber

Smooth number animations with formatting.

**Props:**
- `value` (number): Target number
- `format` (string): 'number' | 'currency' | 'percent'
- `currency` (string): Currency code (default: 'USD')
- `decimals` (number): Decimal places (default: 2)
- `duration` (number): Animation duration in seconds

**Variants:**
- `AnimatedNumber` - Basic number animation
- `CountUp` - Simple count-up
- `BalanceChange` - Shows balance difference
- `ProgressNumber` - Progress towards goal
- `FlipNumber` - Flip animation

**Example:**
```jsx
// Currency
<AnimatedNumber
  value={1234.56}
  format="currency"
  currency="USD"
  decimals={2}
/>

// Balance change
<BalanceChange
  oldValue={1000}
  newValue={1500}
  currency="USD"
/>

// Progress
<ProgressNumber
  current={7500}
  goal={10000}
  format="currency"
/>
```

---

### 4. PageTransition

Page-level route transition wrapper.

**Props:**
- `variant` (string): 'fade' | 'slide' | 'slideUp' | 'scale'
- `className` (string): Additional CSS classes

**Variants:**
- `PageTransition` - Configurable page transitions
- `RouteTransition` - Route-based transitions
- `FadeTransition` - Simple fade
- `SlideTransition` - Directional slide
- `CollapseTransition` - Expand/collapse
- `ModalTransition` - Modal with backdrop

**Example:**
```jsx
// In App.jsx
<Routes>
  <Route
    path="/dashboard"
    element={
      <PageTransition variant="slideUp">
        <Dashboard />
      </PageTransition>
    }
  />
</Routes>

// Conditional content
<FadeTransition show={showDetails}>
  <BillDetails bill={selectedBill} />
</FadeTransition>

// Expandable section
<CollapseTransition show={expanded}>
  <AdvancedOptions />
</CollapseTransition>
```

---

### 5. Loading States

**Components:**
- `Spinner` - Rotating spinner
- `DotsLoader` - Bouncing dots
- `PulseLoader` - Pulsing circle
- `ProgressBar` - Linear progress
- `CircularProgress` - Circular progress
- `SkeletonLoader` - Content placeholder
- `SkeletonCard` - Card skeleton
- `ShimmerLoader` - Shimmer effect
- `LoadingOverlay` - Full-screen overlay
- `InlineLoader` - Small inline loader

**Example:**
```jsx
// Spinner
<Spinner size="lg" color="text-blue-500" />

// Progress bar
<ProgressBar
  progress={uploadProgress}
  showPercentage
  color="bg-green-500"
/>

// Circular progress
<CircularProgress
  progress={75}
  size={120}
  color="#3b82f6"
/>

// Skeleton
<SkeletonCard />

// Loading overlay
<LoadingOverlay
  show={isProcessing}
  message="Processing payment..."
/>
```

---

### 6. Special Effects

**Components:**
- `SuccessAnimation` - Animated checkmark
- `ErrorAnimation` - Animated error X
- `Confetti` - Celebration confetti
- `PaymentSuccessAnimation` - Complete payment success flow
- `WalletConnectionCelebration` - Wallet connection celebration
- `CelebrationBurst` - Particle burst
- `FloatingIcons` - Floating background icons

**Example:**
```jsx
// Success animation
<SuccessAnimation
  show={paymentSuccess}
  message="Payment Complete!"
  onComplete={() => navigate('/bills')}
/>

// Payment success with confetti
<PaymentSuccessAnimation
  show={showPaymentSuccess}
  amount={250.50}
  currency="USD"
  onComplete={handleComplete}
/>

// Wallet connection
<WalletConnectionCelebration
  show={walletConnected}
  walletName="MetaMask"
/>

// Confetti
<Confetti show={celebrate} duration={3000} />
```

---

## Hooks

### 1. useReducedMotion

Detects if user prefers reduced motion.

```jsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={{ x: prefersReducedMotion ? 0 : 100 }}
/>
```

---

### 2. useCountUp

Animates number counting.

**Props:**
- `end` (number): Target number
- `start` (number): Starting number (default: 0)
- `duration` (number): Duration in seconds (default: 2)
- `decimals` (number): Decimal places (default: 0)
- `easing` (string): 'linear' | 'easeOut' | 'easeIn' | 'easeInOut'
- `autoStart` (boolean): Auto-start (default: true)

**Returns:**
- `count` (number): Current count
- `start()` (function): Start animation
- `reset()` (function): Reset to start
- `pause()` (function): Pause animation
- `resume()` (function): Resume animation
- `isAnimating` (boolean): Animation state

**Example:**
```jsx
const { count, start, reset } = useCountUp(1000, {
  duration: 2,
  decimals: 0,
  easing: 'easeOut',
});

<span>{count}</span>
<button onClick={start}>Start</button>
<button onClick={reset}>Reset</button>
```

---

### 3. useScrollAnimation

Trigger animations on scroll into view.

**Props:**
- `threshold` (number): Visibility threshold 0-1 (default: 0.1)
- `triggerOnce` (boolean): Trigger once (default: true)
- `rootMargin` (string): Root margin (default: '0px')

**Returns:**
- `ref` (ref): Element ref
- `isVisible` (boolean): Visibility state

**Example:**
```jsx
const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
>
  Content appears on scroll
</motion.div>
```

**Related Hooks:**
- `useScrollProgress()` - Track scroll progress (0-1)
- `useParallax(speed)` - Parallax scrolling effect
- `useScrollDirection(threshold)` - Detect scroll direction
- `useScrollLock(locked)` - Lock/unlock body scroll

---

### 4. useTypingEffect

Simulates typing animation.

**Props:**
- `text` (string): Text to type
- `speed` (number): Typing speed in ms (default: 50)
- `autoStart` (boolean): Auto-start (default: true)

**Returns:**
- `displayText` (string): Current text
- `isTyping` (boolean): Typing state
- `start()` (function): Start typing
- `reset()` (function): Reset

**Example:**
```jsx
const { displayText } = useTypingEffect(
  'Welcome to BillHaven!',
  { speed: 50 }
);

<h1>{displayText}</h1>
```

---

### 5. useCountdown

Countdown timer hook.

**Props:**
- `initialTime` (number): Starting time in seconds
- `autoStart` (boolean): Auto-start (default: false)
- `onComplete` (function): Completion callback

**Returns:**
- `time` (number): Current time
- `start()` (function): Start countdown
- `pause()` (function): Pause countdown
- `reset()` (function): Reset countdown
- `isRunning` (boolean): Running state

**Example:**
```jsx
const { time, start, pause, reset } = useCountdown(60, {
  onComplete: () => alert('Time up!'),
});

<div>{time}s remaining</div>
<button onClick={start}>Start</button>
```

---

## Configuration

### Animation Timing

Defined in `/src/config/animations.js`:

```js
export const timing = {
  fast: 150,      // Micro-interactions
  normal: 300,    // Component transitions
  slow: 500,      // Page transitions
  verySlow: 700,  // Celebrations
};
```

### Easing Functions

```js
export const easing = {
  easeOut: [0.16, 1, 0.3, 1],      // Entry (fast start, slow end)
  easeIn: [0.7, 0, 0.84, 0],       // Exit (slow start, fast end)
  easeInOut: [0.65, 0, 0.35, 1],   // Both directions
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  softSpring: { type: 'spring', stiffness: 200, damping: 25 },
  snapSpring: { type: 'spring', stiffness: 400, damping: 25 },
};
```

### Preset Variants

```js
import {
  fadeIn,
  slideUp,
  scaleIn,
  staggerContainer,
  cardHover,
} from '@/config/animations';
```

---

## Best Practices

### 1. Use Semantic Animations

Match animation to action:
- **Entry**: `slideUp`, `fadeIn` for appearing content
- **Exit**: `slideDown`, `fadeOut` for disappearing content
- **Success**: `celebration`, `popIn` for positive feedback
- **Error**: `shake` for error states

### 2. Respect User Preferences

Always use `useReducedMotion()`:

```jsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={{
    x: prefersReducedMotion ? 0 : 100,
    transition: { duration: prefersReducedMotion ? 0 : 0.3 }
  }}
/>
```

### 3. Optimize Performance

- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Limit simultaneous animations

**Good:**
```jsx
<motion.div animate={{ x: 100, opacity: 1 }} />
```

**Bad:**
```jsx
<motion.div animate={{ left: '100px', width: '200px' }} />
```

### 4. Stagger List Items

For lists, use stagger animations:

```jsx
<motion.div variants={staggerContainer} initial="hidden" animate="visible">
  {items.map((item, i) => (
    <motion.div key={i} variants={staggerItem}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

### 5. Keep It Subtle

- Don't overdo animations
- Faster is usually better (150-300ms)
- Use animations to guide attention, not distract

---

## Accessibility

### Reduced Motion

All components respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations disabled or simplified */
}
```

### Focus Management

Ensure animations don't interfere with keyboard navigation:

```jsx
<AnimatedButton
  onFocus={handleFocus}
  onBlur={handleBlur}
>
  Accessible Button
</AnimatedButton>
```

### Screen Readers

Use `aria-live` for dynamic content:

```jsx
<motion.div
  aria-live="polite"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  {statusMessage}
</motion.div>
```

---

## Examples

### Dashboard Stats

```jsx
import { AnimatedCard, AnimatedNumber } from '@/components/animated';

function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((stat, i) => (
        <AnimatedCard key={i} index={i} withHoverLift>
          <div className="p-6">
            <h3 className="text-sm text-gray-600">{stat.label}</h3>
            <AnimatedNumber
              value={stat.value}
              format="currency"
              className="text-3xl font-bold"
            />
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
}
```

### Payment Flow

```jsx
import { AnimatedButton, PaymentSuccessAnimation } from '@/components/animated';

function PaymentPage() {
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    await processPayment();
    setProcessing(false);
    setSuccess(true);
  };

  return (
    <>
      <AnimatedButton
        isLoading={processing}
        loadingText="Processing..."
        onClick={handlePayment}
      >
        Submit Payment
      </AnimatedButton>

      <PaymentSuccessAnimation
        show={success}
        amount={250.50}
        currency="USD"
        onComplete={() => navigate('/dashboard')}
      />
    </>
  );
}
```

### Scroll Reveal

```jsx
import { useScrollAnimation } from '@/hooks';

function Features() {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
    >
      <h2>Amazing Features</h2>
      <p>Revealed on scroll!</p>
    </motion.div>
  );
}
```

---

## Demo Page

View all animations in action:

**Route:** `/animation-showcase`

**File:** `/src/pages/AnimationShowcase.jsx`

This page demonstrates every animation component and hook with interactive examples.

---

## Support

For questions or issues with animations:
1. Check this guide
2. View `/src/pages/AnimationShowcase.jsx` for examples
3. Refer to [Framer Motion docs](https://www.framer.com/motion/)

---

## File Structure

```
src/
├── components/
│   └── animated/
│       ├── index.js                    # Centralized exports
│       ├── AnimatedCard.jsx            # Card components
│       ├── AnimatedButton.jsx          # Button variants
│       ├── AnimatedNumber.jsx          # Number animations
│       ├── PageTransition.jsx          # Route transitions
│       ├── LoadingStates.jsx           # Loading components
│       └── SpecialEffects.jsx          # Celebrations & effects
├── hooks/
│   ├── index.js                        # Hook exports
│   ├── useReducedMotion.js             # Accessibility
│   ├── useCountUp.js                   # Number animations
│   └── useScrollAnimation.js           # Scroll-based animations
├── config/
│   └── animations.js                   # Timing & variants
└── utils/
    └── animationVariants.js            # Reusable variants
```

---

**Happy Animating! 🎨✨**
