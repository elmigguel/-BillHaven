# Animation System - Quick Start Guide

**Time to implement:** 30 minutes
**Difficulty:** Easy

## Step 1: Install Framer Motion (2 minutes)

```bash
cd /home/elmigguel/BillHaven
npm install framer-motion
```

## Step 2: Update Tailwind Config (5 minutes)

Add the custom animations to your `/tailwind.config.js`:

```javascript
// Add to theme.extend.animation:
animation: {
  // Existing
  'spin': 'spin 1s linear infinite',
  'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

  // NEW Financial animations
  'shimmer': 'shimmer 2s linear infinite',
  'breathe': 'breathe 2s ease-in-out infinite',
  'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
  'success-pop': 'success-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
},

// Add to theme.extend.keyframes:
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
  breathe: {
    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
    '50%': { opacity: '0.8', transform: 'scale(1.05)' },
  },
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
  },
  'success-pop': {
    '0%': { transform: 'scale(0)', opacity: '0' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
},
```

## Step 3: Test Installation (3 minutes)

Create a test component to verify everything works:

**File:** `/src/test/AnimationTest.jsx`

```jsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp } from '@/config/animations';

export default function AnimationTest() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Animation Test</h1>

      {/* Test 1: Fade in */}
      <motion.div
        {...fadeIn}
        className="p-4 bg-purple-600 text-white rounded-lg"
      >
        Fade In Animation
      </motion.div>

      {/* Test 2: Slide up */}
      <motion.div
        {...slideUp}
        className="p-4 bg-green-600 text-white rounded-lg"
      >
        Slide Up Animation
      </motion.div>

      {/* Test 3: Tailwind animation */}
      <div className="p-4 bg-blue-600 text-white rounded-lg animate-breathe">
        CSS Breathe Animation
      </div>

      {/* Test 4: Hover effect */}
      <motion.button
        className="px-6 py-3 bg-purple-600 text-white rounded-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Hover & Click Me
      </motion.button>
    </div>
  );
}
```

Add to your routes temporarily:

```jsx
import AnimationTest from './test/AnimationTest';

<Route path="/animation-test" element={<AnimationTest />} />
```

Visit: `http://localhost:5173/animation-test`

## Step 4: Add to Existing Components (20 minutes)

### 4.1 Enhance Your Buttons (5 min)

**Before:**
```jsx
<Button onClick={handleSubmit}>Submit</Button>
```

**After:**
```jsx
import { motion } from 'framer-motion';

<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
  <Button onClick={handleSubmit}>Submit</Button>
</motion.div>
```

### 4.2 Add Page Transitions (5 min)

Wrap one page (e.g., Dashboard):

```jsx
import { motion } from 'framer-motion';
import { pageTransition } from '@/config/animations';

export default function Dashboard() {
  return (
    <motion.div {...pageTransition}>
      {/* existing content */}
    </motion.div>
  );
}
```

### 4.3 Animate Transaction Status (10 min)

In your `PaymentFlow.jsx`, add status animations:

```jsx
import { motion, AnimatePresence } from 'framer-motion';

// Success state
<AnimatePresence>
  {step === 4 && (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="text-center"
    >
      <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
      <h3>Success!</h3>
    </motion.div>
  )}
</AnimatePresence>
```

## Step 5: Test Performance (5 minutes)

1. Open DevTools → Performance tab
2. Record while navigating and interacting
3. Check for 60fps (green bars in frame chart)
4. Look for layout thrashing (red bars)

**Good:**
- Green bars (painting/compositing)
- Smooth 60fps line

**Bad:**
- Red bars (layout recalculation)
- Dropped frames (gaps in timeline)

## Quick Wins (Easiest Animations)

### 1. Button Hover (30 seconds)

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</motion.button>
```

### 2. Card Hover Lift (1 minute)

```jsx
<motion.div
  className="p-6 bg-gray-800 rounded-lg"
  whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
>
  Card content
</motion.div>
```

### 3. Loading Spinner (1 minute)

```jsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
>
  <Loader2 className="w-6 h-6" />
</motion.div>
```

### 4. Toast Slide In (CSS only - 0 minutes)

Already works! Just add class:

```jsx
toast.success('Payment complete', {
  className: 'animate-slide-in-right'
});
```

### 5. Success Checkmark (2 minutes)

```jsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  <CheckCircle2 className="w-12 h-12 text-green-500" />
</motion.div>
```

## Troubleshooting

### Animation not working?

1. Check Framer Motion is installed: `npm list framer-motion`
2. Verify import: `import { motion } from 'framer-motion';`
3. Check console for errors
4. Ensure component is wrapped in `<motion.div>` not `<div>`

### Animation is janky?

1. Only animate `transform` and `opacity`
2. Avoid animating `width`, `height`, `top`, `left`
3. Use `will-change` CSS property sparingly
4. Test on mobile/low-end devices

### Too many animations?

Less is more! Follow this hierarchy:

1. **Critical:** Button feedback, form validation (always animate)
2. **Important:** Page transitions, modal open/close (animate)
3. **Nice-to-have:** Card hovers, decorative effects (optional)
4. **Mobile:** Reduce or disable complex animations

## Next Steps

Once basics are working:

1. Read full guide: `/docs/ANIMATION_SYSTEM_GUIDE.md`
2. Implement AnimatedButton component
3. Add TransactionStatus animations
4. Create SuccessCelebration component
5. Add page transitions to all routes

## Performance Checklist

- [ ] Animations run at 60fps
- [ ] Bundle size increase < 10% (check with `npm run build`)
- [ ] Works on mobile (test on real device if possible)
- [ ] Respects `prefers-reduced-motion` (test in settings)
- [ ] No layout thrashing (check DevTools Performance)

## Resources

- **Full Guide:** `/docs/ANIMATION_SYSTEM_GUIDE.md`
- **Config File:** `/src/config/animations.js`
- **Hooks:** `/src/hooks/useReducedMotion.js`, `/src/hooks/useMediaQuery.js`
- **Framer Motion Docs:** https://www.framer.com/motion/
- **Examples:** See guide section 9 for production-ready components

---

**Questions?** Start with the Quick Wins above, then gradually add more complex animations. Test on mobile frequently!
