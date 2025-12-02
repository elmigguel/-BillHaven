# BILLHAVEN UI/UX DESIGN GUIDE
**Date:** 2025-12-01
**Status:** Implementation Ready

---

## DESIGN PHILOSOPHY

**Goal:** Transform BillHaven from "functional" to "WORLD-CLASS"

**Inspiration Sources:**
- Coinbase (simplicity, trust)
- Phantom (Web3 beauty)
- Cash App (boldness)
- Stripe (developer elegance)
- Revolut (smoothness)

---

## DESIGN SYSTEM

### Colors

```javascript
// tailwind.config.js theme extension
colors: {
  // Primary (Trust & Action)
  primary: {
    DEFAULT: '#6366f1',
    hover: '#4f46e5',
    light: '#818cf8',
  },

  // Success (Transactions)
  success: {
    DEFAULT: '#4ade80',
    dark: '#22c55e',
  },

  // Warning & Errors
  warning: '#fbbf24',
  error: '#ef4444',

  // Dark Mode Foundation
  background: '#0f0f23',
  surface: '#1a1a2e',
  'surface-elevated': '#252540',
  border: '#333333',

  // Text
  'text-primary': '#ffffff',
  'text-secondary': '#888888',

  // Crypto Brand Colors
  bitcoin: '#f7931a',
  ethereum: '#627eea',
  solana: '#14f195',
  lightning: '#ffd700',
  ton: '#0098ea',
}
```

### Typography

```css
/* Headings */
font-family: 'Poppins', sans-serif;
font-weight: 600;

/* Body */
font-family: 'Source Sans Pro', sans-serif;
font-weight: 400;
line-height: 1.5;

/* Monospace (addresses, amounts) */
font-family: 'Roboto Mono', monospace;
```

### Type Scale
```css
--text-xs: 12px;   /* Captions */
--text-sm: 14px;   /* Labels */
--text-base: 16px; /* Body */
--text-lg: 18px;   /* Emphasized */
--text-xl: 20px;   /* Card titles */
--text-2xl: 24px;  /* Section headings */
--text-3xl: 30px;  /* Page titles */
--text-4xl: 36px;  /* Hero */
```

### Spacing (8px Grid)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
--space-16: 64px;
```

### Border Radius
```css
--radius-sm: 8px;   /* Inputs */
--radius-md: 12px;  /* Buttons, cards */
--radius-lg: 16px;  /* Large cards */
--radius-xl: 20px;  /* Modals */
--radius-full: 9999px; /* Pills */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-glass: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
```

---

## GLASSMORPHISM IMPLEMENTATION

```css
/* Base glassmorphism card */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
}

/* Hover state */
.glass-card:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
}
```

### Tailwind Utility Classes
```javascript
// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        glass: '10px',
      },
    },
  },
}
```

---

## COMPONENT SPECIFICATIONS

### Button Component

```jsx
// Primary button
<Button
  variant="primary"
  size="lg"
  className="
    bg-primary hover:bg-primary-hover
    text-white font-semibold
    h-[52px] px-8
    rounded-xl
    shadow-md hover:shadow-lg
    transition-all duration-200
    hover:-translate-y-0.5
  "
>
  Pay Now →
</Button>

// Ghost button
<Button
  variant="ghost"
  className="
    border-2 border-gray-600
    text-gray-300 hover:text-white
    hover:bg-white/10
    h-[52px] px-6
    rounded-xl
  "
>
  See Demo
</Button>
```

### Card Component

```jsx
<Card className="
  glass-card
  p-6
  transition-all duration-300
  hover:shadow-glass
  hover:-translate-y-1
">
  <CardHeader>
    <CardTitle className="text-xl font-semibold text-white">
      Payment Details
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Content */}
  </CardContent>
</Card>
```

### Input Component

```jsx
<div className="space-y-2">
  <Label htmlFor="amount" className="text-sm text-gray-400">
    Amount (USD)
  </Label>
  <Input
    id="amount"
    type="number"
    placeholder="0.00"
    className="
      h-12 px-4
      bg-surface-elevated
      border border-border
      rounded-lg
      text-white placeholder:text-gray-500
      focus:border-primary focus:ring-2 focus:ring-primary/20
      transition-all
    "
  />
</div>
```

### Badge Component

```jsx
// Trust badge
<Badge className="
  inline-flex items-center gap-1.5
  px-3 py-1.5
  bg-success/10 border border-success/30
  text-success text-sm font-medium
  rounded-full
">
  <Shield className="w-4 h-4" />
  Verified User
</Badge>

// Status badge
<Badge variant="warning" className="
  bg-warning/10 border border-warning/30
  text-warning
">
  <Clock className="w-4 h-4" />
  Hold Period: 7 days
</Badge>
```

---

## ANIMATION PATTERNS

### Framer Motion Setup

```bash
npm install framer-motion
```

### Success Celebration

```jsx
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function PaymentSuccess() {
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="text-center p-8"
    >
      <CheckCircle className="w-24 h-24 text-success mx-auto" />
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold mt-4"
      >
        Payment Complete!
      </motion.h2>
    </motion.div>
  );
}
```

### Button Hover Animation

```jsx
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400 }}
  className="btn-primary"
>
  Pay Now
</motion.button>
```

### Skeleton Loader

```jsx
function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-surface rounded-xl">
      <div className="h-6 bg-surface-elevated rounded w-3/4" />
      <div className="h-4 bg-surface-elevated rounded w-1/2" />
      <div className="h-10 bg-surface-elevated rounded w-full" />
    </div>
  );
}
```

### Page Transition

```jsx
import { AnimatePresence, motion } from 'framer-motion';

function PageWrapper({ children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## TRUST ELEMENTS

### Security Badge Bar

```jsx
<div className="flex items-center justify-center gap-8 py-4 bg-surface/50">
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <Shield className="w-5 h-5 text-success" />
    <span>Smart Contract Audited</span>
  </div>
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <Lock className="w-5 h-5 text-success" />
    <span>256-bit Encryption</span>
  </div>
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <CreditCard className="w-5 h-5 text-success" />
    <span>3D Secure Protected</span>
  </div>
</div>
```

### Transaction Stats

```jsx
<div className="grid grid-cols-3 gap-8 py-12 text-center">
  <div>
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="text-4xl font-bold text-white"
    >
      $2.4M+
    </motion.div>
    <div className="text-gray-400 mt-2">Bills Paid</div>
  </div>
  <div>
    <div className="text-4xl font-bold text-white">1,247</div>
    <div className="text-gray-400 mt-2">Active Users</div>
  </div>
  <div>
    <div className="text-4xl font-bold text-white">10,834</div>
    <div className="text-gray-400 mt-2">Transactions</div>
  </div>
</div>
```

### Trust Score Display

```jsx
function TrustScoreBadge({ score, level }) {
  const colors = {
    NEW_USER: 'text-gray-400',
    VERIFIED: 'text-blue-400',
    TRUSTED: 'text-purple-400',
    POWER_USER: 'text-success',
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32" cy="32" r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-surface-elevated"
          />
          <motion.circle
            cx="32" cy="32" r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className={colors[level]}
            initial={{ strokeDasharray: "0 176" }}
            animate={{ strokeDasharray: `${(score / 1000) * 176} 176` }}
            transition={{ duration: 1.5 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${colors[level]}`}>{score}</span>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400">Trust Score</div>
        <div className={`font-semibold ${colors[level]}`}>{level.replace('_', ' ')}</div>
      </div>
    </div>
  );
}
```

---

## MOBILE RESPONSIVENESS

### Breakpoints
```javascript
screens: {
  'xs': '320px',  // iPhone SE
  'sm': '640px',  // Small tablets
  'md': '768px',  // Tablets
  'lg': '1024px', // Desktop
  'xl': '1280px', // Large desktop
}
```

### Responsive Patterns

```jsx
// Full-width on mobile, auto on desktop
<Button className="w-full sm:w-auto">
  Pay Now
</Button>

// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">
  <Input />
  <Button />
</div>

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>
```

### Mobile Touch Targets
- Minimum: 44x44px (Apple)
- Recommended: 48x48px
- Button height: 52px on mobile

---

## ACCESSIBILITY (WCAG 2.2)

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Focus States
```jsx
<Button className="
  focus:outline-none
  focus:ring-2
  focus:ring-primary
  focus:ring-offset-2
  focus:ring-offset-background
">
```

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for dropdown navigation

### Screen Reader
```jsx
<button aria-label="Pay $125.50 with credit card">
  Pay Now
</button>

<div role="alert" aria-live="assertive">
  {error}
</div>
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## IMPLEMENTATION CHECKLIST

### Week 1
- [ ] Install Framer Motion
- [ ] Generate shadcn components
- [ ] Create design tokens
- [ ] Button component upgrade
- [ ] Card component upgrade
- [ ] Input component upgrade

### Week 2
- [ ] Glassmorphism cards
- [ ] Skeleton loaders
- [ ] Success animations
- [ ] Error animations
- [ ] Progress indicators

### Week 3
- [ ] Trust badges
- [ ] Fee calculator
- [ ] Security badges
- [ ] Social proof section
- [ ] Tooltips

### Week 4
- [ ] Confetti celebration
- [ ] Live crypto prices
- [ ] Animated QR codes
- [ ] Page transitions
- [ ] Haptic feedback

### Week 5
- [ ] WCAG audit
- [ ] Keyboard navigation
- [ ] Screen reader test
- [ ] Lighthouse 95+
- [ ] Performance audit

---

**Document Version:** 1.0
**Last Updated:** 2025-12-01
