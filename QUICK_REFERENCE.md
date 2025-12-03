# BillHaven Premium Components - Quick Reference

## Component Cheat Sheet

### 1. EnhancedHero
```jsx
import EnhancedHero from '@/components/sections/EnhancedHero';

<EnhancedHero />
```
**When to use**: Homepage hero section
**What you get**: Animated gradients, chain badges, stats, CTAs

---

### 2. PremiumBillCard
```jsx
import PremiumBillCard from '@/components/bills/PremiumBillCard';

<PremiumBillCard
  bill={billData}
  index={0}
  onViewDetails={handleView}
  showActions={false}
/>
```
**When to use**: Bill lists, grids, dashboards
**What you get**: Glassmorphism, status animations, chain indicators

---

### 3. PremiumWalletButton
```jsx
import PremiumWalletButton from '@/components/wallet/PremiumWalletButton';

<PremiumWalletButton
  address={wallet?.address}
  balance={wallet?.balance}
  network="ethereum"
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
  onCopyAddress={handleCopy}
  onChangeNetwork={handleNetworkChange}
/>
```
**When to use**: Navigation, header
**What you get**: Multi-wallet support, network switcher, balance display

---

### 4. PaymentSteps
```jsx
import PaymentSteps from '@/components/payment/PaymentSteps';

const steps = [
  { title: 'Connect', description: 'Link wallet' },
  { title: 'Review', description: 'Confirm details' },
  { title: 'Pay', description: 'Send funds' },
  { title: 'Verify', description: 'Wait for confirmation' },
  { title: 'Complete', description: 'Success!' }
];

<PaymentSteps
  steps={steps}
  currentStep={2}
  error={errorMsg}
/>
```
**When to use**: Payment flows, multi-step forms
**What you get**: Progress bar, step indicators, animations

---

### 5. PremiumStatsCard
```jsx
import PremiumStatsCard from '@/components/dashboard/PremiumStatsCard';
import { DollarSign } from 'lucide-react';

<PremiumStatsCard
  title="Total Earned"
  value={12547.89}
  prefix="$"
  decimals={2}
  trend="up"
  trendValue="+12.5%"
  icon={DollarSign}
  iconColor="from-emerald-400 to-teal-400"
  sparklineData={[30, 45, 35, 50, 60, 70]}
  sparklineColor="emerald"
  index={0}
/>
```
**When to use**: Dashboards, analytics
**What you get**: Animated numbers, trends, sparklines

---

### 6. PremiumNavbar
```jsx
import PremiumNavbar from '@/components/navigation/PremiumNavbar';

<PremiumNavbar
  walletAddress={wallet?.address}
  walletBalance={wallet?.balance}
  walletNetwork={wallet?.network}
  onWalletConnect={handleConnect}
  onWalletDisconnect={handleDisconnect}
  onCopyAddress={handleCopy}
  onChangeNetwork={handleNetworkChange}
/>
```
**When to use**: Main app navigation
**What you get**: Sticky header, mobile menu, active indicators

---

### 7. Loading States
```jsx
import { SkeletonCard, PageLoader } from '@/components/loading/SkeletonCard';

// Skeleton for bill lists
{isLoading && (
  <>
    {[...Array(6)].map((_, i) => <SkeletonCard key={i} index={i} />)}
  </>
)}

// Full page loader
{isInitializing && <PageLoader />}
```
**When to use**: Loading states everywhere
**What you get**: Shimmer effects, smooth transitions

---

## Quick Props Reference

### PremiumBillCard Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| bill | Object | ✅ | - | Bill data object |
| index | Number | ❌ | 0 | For stagger animation |
| onViewDetails | Function | ❌ | - | View callback |
| showActions | Boolean | ❌ | false | Show approve/reject |
| onApprove | Function | ❌ | - | Approve callback |
| onReject | Function | ❌ | - | Reject callback |
| onMarkPaid | Function | ❌ | - | Mark paid callback |

### PremiumStatsCard Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| title | String | ✅ | - | Card title |
| value | Number/String | ✅ | - | Main value |
| prefix | String | ❌ | '' | Value prefix ($, #) |
| suffix | String | ❌ | '' | Value suffix (%, K) |
| decimals | Number | ❌ | 0 | Decimal places |
| trend | String | ❌ | 'neutral' | up/down/neutral |
| trendValue | String | ❌ | - | Trend text (+12%) |
| icon | Component | ❌ | - | Lucide icon |
| iconColor | String | ❌ | - | Gradient classes |
| sparklineData | Array | ❌ | [] | Chart data points |
| sparklineColor | String | ❌ | 'emerald' | Chart color |
| index | Number | ❌ | 0 | For stagger |

### PaymentSteps Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| steps | Array | ✅ | - | Step objects |
| currentStep | Number | ✅ | 0 | Active step index |
| error | String | ❌ | null | Error message |

**Step Object**:
```typescript
{
  title: string;        // Required
  description?: string; // Optional
}
```

---

## Color Palette Quick Copy

### Gradients
```jsx
// Indigo-Purple (Primary)
className="bg-gradient-to-r from-indigo-600 to-purple-600"

// Emerald-Teal (Success)
className="bg-gradient-to-r from-emerald-400 to-teal-400"

// Purple-Blue (Ethereum)
className="bg-gradient-to-r from-purple-400 to-blue-400"

// Green-Cyan (Solana)
className="bg-gradient-to-r from-green-400 to-cyan-400"

// Orange-Yellow (Bitcoin)
className="bg-gradient-to-r from-orange-400 to-yellow-400"

// Amber-Orange (Warning)
className="bg-gradient-to-r from-amber-500 to-orange-500"

// Red-Pink (Error)
className="bg-gradient-to-r from-red-500 to-pink-500"
```

### Glassmorphism Pattern
```jsx
<div className="relative overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl" />

  {/* Border */}
  <div className="absolute inset-0 border border-white/10 rounded-lg" />

  {/* Content */}
  <div className="relative z-10 p-6">
    {/* Your content */}
  </div>
</div>
```

---

## Animation Snippets

### Card Entrance
```jsx
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
/>
```

### Hover Lift
```jsx
<motion.div
  whileHover={{ y: -8, scale: 1.02 }}
  transition={{ duration: 0.2 }}
/>
```

### Button Interaction
```jsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  <Button>Click Me</Button>
</motion.div>
```

### Staggered List
```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    {item.content}
  </motion.div>
))}
```

### Infinite Pulse
```jsx
<motion.div
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
```

### Rotating Loader
```jsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'linear'
  }}
/>
```

---

## Responsive Grid Patterns

### Bill Cards Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {bills.map((bill, i) => <PremiumBillCard key={bill.id} bill={bill} index={i} />)}
</div>
```

### Stats Cards Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {stats.map((stat, i) => <PremiumStatsCard key={stat.title} {...stat} index={i} />)}
</div>
```

### Two Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

---

## Icon Reference

### Common Icons from Lucide
```jsx
import {
  // Actions
  Check, X, Plus, Minus, Edit, Trash, Download, Upload, Share,

  // Navigation
  Home, Settings, User, Bell, Menu, X, ArrowLeft, ArrowRight,

  // Crypto
  Wallet, Coins, TrendingUp, TrendingDown, DollarSign, Zap,

  // Status
  Clock, CheckCircle2, XCircle, AlertCircle, Info,

  // UI
  Search, Filter, Eye, EyeOff, Copy, ExternalLink, ChevronDown,

  // Business
  Receipt, FileText, Calendar, Globe, Shield, Users, Sparkles
} from 'lucide-react';
```

### Usage
```jsx
<TrendingUp className="w-5 h-5 text-emerald-400" />
<Wallet className="w-4 h-4 mr-2" />
```

---

## Common Patterns

### Status Badge
```jsx
const statusConfig = {
  pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  approved: { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  paid: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/30' }
};

<Badge className={`${statusConfig[status].color} border`}>
  {status}
</Badge>
```

### Truncated Address
```jsx
const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

<span className="font-mono">{formatAddress(walletAddress)}</span>
```

### Number Formatting
```jsx
const formatCurrency = (amount, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

<span>{formatCurrency(1234.56)}</span> // $1,234.56
```

### Conditional Rendering with AnimatePresence
```jsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      Content
    </motion.div>
  )}
</AnimatePresence>
```

---

## Troubleshooting

### Issue: "forwardRef" error with motion components
```jsx
// ❌ Wrong
<motion.div>
  <Button>Click</Button>
</motion.div>

// ✅ Correct
<motion.div>
  <Button asChild>Click</Button>
</motion.div>

// Or wrap the Button
<motion.div whileHover={{ scale: 1.05 }}>
  <Button>Click</Button>
</motion.div>
```

### Issue: Animations not smooth on mobile
```jsx
// Add will-change for GPU acceleration
<motion.div
  className="will-change-transform"
  whileHover={{ y: -8 }}
/>
```

### Issue: Layout shift on load
```jsx
// Use aspect ratios or min-height
<div className="min-h-[200px]">
  {isLoading ? <SkeletonCard /> : <PremiumBillCard />}
</div>
```

---

## File Locations

```
/home/elmigguel/BillHaven/
├── COMPONENT_DESIGN_SPECS.md          # Components 1-3 full code
├── COMPONENT_DESIGN_SPECS_PART2.md    # Components 4-7 full code
├── COMPONENT_IMPLEMENTATION_GUIDE.md  # Setup & migration guide
├── DESIGN_SYSTEM_SUMMARY.md           # Visual reference & specs
└── QUICK_REFERENCE.md                 # This file
```

---

## Next Steps

1. **Read**: COMPONENT_IMPLEMENTATION_GUIDE.md for setup
2. **Copy**: Component code from COMPONENT_DESIGN_SPECS.md
3. **Test**: Start with EnhancedHero on homepage
4. **Iterate**: Add components one at a time
5. **Customize**: Adjust colors/animations to your taste

---

**Need help?** All components are documented with:
- Full TypeScript-style prop descriptions
- Example usage snippets
- Common patterns
- Troubleshooting tips

**Start simple**: Replace just the hero, see how it looks, then add more!
