# Animation Integration Examples for BillHaven

Practical examples showing how to integrate animations into existing BillHaven components.

---

## 1. Dashboard.jsx Integration

### Before:
```jsx
// Plain static cards
export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Card>
        <CardContent>
          <h3>Total Bills</h3>
          <p>{stats.totalBills}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### After:
```jsx
import { AnimatedCard, AnimatedNumber } from '@/components/animated';
import { useCountUp } from '@/hooks';

export default function Dashboard() {
  const { count: totalBills } = useCountUp(stats.totalBills, { duration: 1.5 });

  return (
    <div className="grid grid-cols-3 gap-6">
      <AnimatedCard index={0} withHoverLift>
        <CardContent className="p-6">
          <h3 className="text-sm text-gray-600">Total Bills</h3>
          <AnimatedNumber
            value={stats.totalBills}
            format="number"
            decimals={0}
            className="text-3xl font-bold text-gray-900"
          />
        </CardContent>
      </AnimatedCard>

      <AnimatedCard index={1} withHoverLift>
        <CardContent className="p-6">
          <h3 className="text-sm text-gray-600">Total Revenue</h3>
          <AnimatedNumber
            value={stats.totalRevenue}
            format="currency"
            currency="USD"
            className="text-3xl font-bold text-green-600"
          />
        </CardContent>
      </AnimatedCard>

      <AnimatedCard index={2} withHoverLift>
        <CardContent className="p-6">
          <h3 className="text-sm text-gray-600">Pending Payments</h3>
          <AnimatedNumber
            value={stats.pendingPayments}
            format="number"
            decimals={0}
            className="text-3xl font-bold text-yellow-600"
          />
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
```

**Benefits:**
- Staggered entrance (cards appear one by one)
- Hover lift effect
- Numbers count up on load
- Smooth, professional feel

---

## 2. BillCard.jsx Integration

### Before:
```jsx
export default function BillCard({ bill }) {
  return (
    <Card>
      <CardContent>
        <h3>{bill.title}</h3>
        <p>${bill.amount}</p>
        <button>Pay Now</button>
      </CardContent>
    </Card>
  );
}
```

### After:
```jsx
import { AnimatedCard, AnimatedButton } from '@/components/animated';
import { CollapseTransition } from '@/components/animated';

export default function BillCard({ bill, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    await processPay payment(bill.id);
    setPaying(false);
  };

  return (
    <AnimatedCard index={index} withHoverLift>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">{bill.title}</h3>
            <p className="text-sm text-gray-500">{bill.category}</p>
          </div>
          <AnimatedNumber
            value={bill.amount}
            format="currency"
            currency="USD"
            className="text-xl font-bold text-gray-900"
          />
        </div>

        <div className="flex gap-2">
          <AnimatedButton
            onClick={() => setExpanded(!expanded)}
            className="flex-1"
          >
            {expanded ? 'Hide Details' : 'View Details'}
          </AnimatedButton>

          <AnimatedButton
            onClick={handlePay}
            isLoading={paying}
            loadingText="Processing..."
            className="flex-1 bg-blue-600 text-white"
          >
            Pay Now
          </AnimatedButton>
        </div>

        <CollapseTransition show={expanded}>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">Due: {bill.dueDate}</p>
            <p className="text-sm text-gray-600">Status: {bill.status}</p>
          </div>
        </CollapseTransition>
      </CardContent>
    </AnimatedCard>
  );
}
```

**Benefits:**
- Smooth card entrance with stagger
- Hover effect
- Loading button state
- Smooth expand/collapse details
- Animated amount display

---

## 3. PaymentFlow.jsx Integration

### Before:
```jsx
export default function PaymentFlow() {
  const [status, setStatus] = useState('idle');

  return (
    <div>
      {status === 'processing' && <p>Processing...</p>}
      {status === 'success' && <p>Success!</p>}
      <button onClick={handlePay}>Pay</button>
    </div>
  );
}
```

### After:
```jsx
import {
  AnimatedButton,
  PaymentSuccessAnimation,
  LoadingOverlay,
  ErrorAnimation,
} from '@/components/animated';

export default function PaymentFlow({ bill }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const handlePay = async () => {
    setStatus('processing');
    try {
      await processPayment(bill.id);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <>
      <div className="p-6 bg-white rounded-xl">
        <h2 className="text-2xl font-bold mb-6">Payment Summary</h2>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span>Amount:</span>
            <AnimatedNumber
              value={bill.amount}
              format="currency"
              className="font-bold"
            />
          </div>
          <div className="flex justify-between">
            <span>Fee:</span>
            <AnimatedNumber
              value={bill.fee}
              format="currency"
              className="text-gray-600"
            />
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Total:</span>
            <AnimatedNumber
              value={bill.amount + bill.fee}
              format="currency"
            />
          </div>
        </div>

        <GlowButton
          onClick={handlePay}
          disabled={status !== 'idle'}
          glowColor="blue"
          className="w-full bg-blue-600 text-white py-3 text-lg"
        >
          Confirm Payment
        </GlowButton>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        show={status === 'processing'}
        message="Processing your payment..."
      />

      {/* Success Animation */}
      <PaymentSuccessAnimation
        show={status === 'success'}
        amount={bill.amount + bill.fee}
        currency="USD"
        onComplete={() => navigate('/dashboard')}
      />

      {/* Error Animation */}
      <ErrorAnimation
        show={status === 'error'}
        message={error || 'Payment failed'}
        onComplete={() => setStatus('idle')}
      />
    </>
  );
}
```

**Benefits:**
- Professional loading overlay
- Celebration on success with confetti
- Clear error indication
- Animated numbers for amounts
- Glow button for CTA

---

## 4. MyBills.jsx Integration

### Before:
```jsx
export default function MyBills() {
  return (
    <div>
      {bills.map(bill => (
        <BillCard key={bill.id} bill={bill} />
      ))}
    </div>
  );
}
```

### After:
```jsx
import { AnimatedCard, SkeletonCard } from '@/components/animated';
import { useScrollAnimation } from '@/hooks';

export default function MyBills() {
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    fetchBills().then(data => {
      setBills(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-3xl font-bold">My Bills</h1>
        <AnimatedNumber
          value={bills.length}
          format="number"
          decimals={0}
          className="text-2xl font-bold text-blue-600"
        />
      </motion.div>

      {bills.map((bill, index) => (
        <BillCard
          key={bill.id}
          bill={bill}
          index={index}
        />
      ))}

      {/* Load more trigger */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
      >
        {isVisible && <LoadMoreButton />}
      </motion.div>
    </div>
  );
}
```

**Benefits:**
- Skeleton loading states
- Staggered bill card entrance
- Scroll-triggered load more
- Animated bill count
- Smooth page header

---

## 5. ConnectWalletButton.jsx Integration

### Before:
```jsx
export default function ConnectWalletButton() {
  const { connect } = useWallet();

  return (
    <button onClick={connect}>
      Connect Wallet
    </button>
  );
}
```

### After:
```jsx
import {
  PulseButton,
  WalletConnectionCelebration,
  Spinner,
} from '@/components/animated';

export default function ConnectWalletButton() {
  const { connect, connected } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
      setConnecting(false);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error) {
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg"
      >
        <Check className="w-5 h-5" />
        <span>Wallet Connected</span>
      </motion.div>
    );
  }

  return (
    <>
      <PulseButton
        onClick={handleConnect}
        disabled={connecting}
        className="bg-blue-600 text-white px-6 py-3"
      >
        {connecting ? (
          <span className="flex items-center gap-2">
            <Spinner size="sm" color="text-white" />
            Connecting...
          </span>
        ) : (
          <>
            <Wallet className="w-5 h-5 inline mr-2" />
            Connect Wallet
          </>
        )}
      </PulseButton>

      <WalletConnectionCelebration
        show={showCelebration}
        walletName="MetaMask"
      />
    </>
  );
}
```

**Benefits:**
- Pulsing CTA to attract attention
- Loading state with spinner
- Celebration on successful connection
- Smooth transition to connected state

---

## 6. Settings.jsx Integration

### Before:
```jsx
export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveSettings();
    setSaved(true);
  };

  return (
    <div>
      <input name="email" />
      <button onClick={handleSave}>Save</button>
      {saved && <p>Saved!</p>}
    </div>
  );
}
```

### After:
```jsx
import {
  AnimatedButton,
  SuccessAnimation,
  FadeTransition,
} from '@/components/animated';
import { motion } from 'framer-motion';

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await saveSettings(data);
      setSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setSaving(false);
      setErrors({ general: error.message });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="email"
            className="w-full px-4 py-2 border rounded-lg"
          />

          <FadeTransition show={!!errors.email}>
            <motion.p
              animate={{ x: [-10, 10, -10, 10, 0] }}
              className="text-red-500 text-sm mt-1"
            >
              {errors.email}
            </motion.p>
          </FadeTransition>
        </div>

        <AnimatedButton
          type="submit"
          isLoading={saving}
          loadingText="Saving changes..."
          success={showSuccess}
          className="bg-blue-600 text-white px-8 py-3"
        >
          Save Changes
        </AnimatedButton>
      </form>

      <SuccessAnimation
        show={showSuccess}
        message="Settings saved successfully!"
      />
    </motion.div>
  );
}
```

**Benefits:**
- Smooth page entrance
- Input focus animation
- Error shake animation
- Loading button state
- Success celebration

---

## 7. PublicBills.jsx Integration

### Before:
```jsx
export default function PublicBills() {
  return (
    <div>
      <h1>Public Bills</h1>
      {bills.map(bill => <BillCard bill={bill} />)}
    </div>
  );
}
```

### After:
```jsx
import { AnimatedCard, ProgressBar, InlineLoader } from '@/components/animated';
import { useScrollAnimation, useScrollProgress } from '@/hooks';

export default function PublicBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollProgress = useScrollProgress();
  const { ref: loadMoreRef, isVisible: shouldLoadMore } = useScrollAnimation({
    threshold: 0.5,
  });

  useEffect(() => {
    fetchBills().then(data => {
      setBills(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (shouldLoadMore && !loadingMore) {
      setLoadingMore(true);
      loadMoreBills().then(newBills => {
        setBills(prev => [...prev, ...newBills]);
        setLoadingMore(false);
      });
    }
  }, [shouldLoadMore]);

  return (
    <div className="relative">
      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
        style={{ scaleX: scrollProgress }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto p-6"
      >
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8"
        >
          Public Bills
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map((bill, index) => (
            <AnimatedCard
              key={bill.id}
              index={index}
              withHoverLift
              withGlow
            >
              <BillPreview bill={bill} />
            </AnimatedCard>
          ))}
        </div>

        {/* Load more trigger */}
        <div ref={loadMoreRef} className="mt-8 flex justify-center">
          {loadingMore && (
            <InlineLoader text="Loading more bills..." />
          )}
        </div>
      </motion.div>
    </div>
  );
}
```

**Benefits:**
- Scroll progress bar at top
- Staggered grid appearance
- Infinite scroll with loading
- Smooth page transitions

---

## 8. App.jsx Route Integration

### Before:
```jsx
function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bills" element={<MyBills />} />
    </Routes>
  );
}
```

### After:
```jsx
import { RouteTransition } from '@/components/animated';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/dashboard"
          element={
            <RouteTransition>
              <Dashboard />
            </RouteTransition>
          }
        />
        <Route
          path="/bills"
          element={
            <RouteTransition>
              <MyBills />
            </RouteTransition>
          }
        />
        <Route
          path="/animation-showcase"
          element={
            <RouteTransition>
              <AnimationShowcase />
            </RouteTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
```

**Benefits:**
- Smooth page transitions
- Exit animations
- Consistent routing experience

---

## Quick Integration Checklist

### Phase 1: Foundation (Quick Wins)
- [ ] Replace static cards with `AnimatedCard` in Dashboard
- [ ] Add `AnimatedButton` to primary CTAs
- [ ] Add `LoadingOverlay` to async operations
- [ ] Replace hardcoded numbers with `AnimatedNumber`

### Phase 2: Engagement
- [ ] Add `PaymentSuccessAnimation` to payment flows
- [ ] Add `WalletConnectionCelebration` to wallet connections
- [ ] Add `SkeletonCard` for loading states
- [ ] Implement `ProgressBar` for uploads/processes

### Phase 3: Polish
- [ ] Add `PageTransition` to all routes
- [ ] Implement `useScrollAnimation` for content reveals
- [ ] Add `CollapseTransition` for expandable sections
- [ ] Use `useCountUp` for statistics

### Phase 4: Advanced
- [ ] Add scroll progress indicator
- [ ] Implement parallax effects
- [ ] Add floating background effects
- [ ] Create custom celebration animations

---

## Performance Tips

1. **Lazy Load Heavy Animations**
```jsx
const Confetti = lazy(() => import('@/components/animated').then(m => ({ default: m.Confetti })));
```

2. **Limit Simultaneous Animations**
```jsx
// Good: Stagger with delay
<AnimatedCard index={0} /> // 0ms
<AnimatedCard index={1} /> // 80ms
<AnimatedCard index={2} /> // 160ms

// Bad: All at once
{cards.map(card => <AnimatedCard index={0} />)}
```

3. **Use `will-change` Sparingly**
```jsx
// Only for frequently animated elements
<motion.div style={{ willChange: 'transform' }} />
```

4. **Prefer GPU-Accelerated Properties**
```jsx
// Good
animate={{ x: 100, opacity: 1 }}

// Bad
animate={{ left: '100px', width: '200px' }}
```

---

## Testing Checklist

- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Test on mobile devices
- [ ] Test on slow network (3G)
- [ ] Test with keyboard navigation
- [ ] Test with screen reader
- [ ] Test on low-end devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

**Ready to integrate! Start with Phase 1 for immediate impact.**
