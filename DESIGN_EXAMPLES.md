# BillHaven Design System - Component Examples

Visual reference guide for implementing the BillHaven design system.

---

## Quick Reference: Color Palette

```
BRAND COLORS:
#0052FF - Deep Ocean Blue (Primary)
#7F84F6 - Vibrant Purple (Accent)
#FF007A - Neon Pink (Highlight)

BACKGROUNDS:
#0A0B0D - Primary Background
#191C1F - Secondary Background
#1A1D21 - Card Background
#22252A - Elevated Surface

TEXT:
#FFFFFF - Primary Text
#B4BDC6 - Secondary Text
#7F868C - Tertiary Text

STATUS:
#00FF90 - Success Bright
#1DB954 - Success Soft
#F7931A - Warning
#F08389 - Error
```

---

## 1. Buttons

### Primary Button (CTA)
```jsx
<button className="
  px-6 py-3
  bg-gradient-to-r from-brand-blue to-brand-purple
  text-white font-semibold text-base
  rounded-lg
  shadow-brand-blue
  hover:shadow-glow
  hover:scale-105
  transition-all duration-300
  active:scale-95
">
  Connect Wallet
</button>
```

### Secondary Button
```jsx
<button className="
  px-6 py-3
  bg-dark-card
  text-text-primary font-semibold text-base
  rounded-lg
  border border-brand-blue/30
  hover:border-brand-blue
  hover:bg-dark-elevated
  transition-all duration-300
">
  Learn More
</button>
```

### Ghost Button
```jsx
<button className="
  px-6 py-3
  bg-transparent
  text-brand-blue font-semibold text-base
  rounded-lg
  border border-transparent
  hover:bg-brand-blue/10
  transition-all duration-300
">
  View Details
</button>
```

### Success Button
```jsx
<button className="
  px-6 py-3
  bg-gradient-to-r from-success-bright to-success-soft
  text-dark-primary font-semibold text-base
  rounded-lg
  shadow-success
  hover:shadow-glow-lg
  transition-all duration-300
">
  Confirm Transaction
</button>
```

### Danger Button
```jsx
<button className="
  px-6 py-3
  bg-error
  text-white font-semibold text-base
  rounded-lg
  hover:bg-error/80
  transition-all duration-300
">
  Disconnect
</button>
```

---

## 2. Cards

### Standard Card
```jsx
<div className="
  bg-dark-card
  rounded-2xl
  p-6
  border border-white/10
  shadow-card
  hover:border-brand-blue/30
  transition-all duration-300
">
  <h3 className="text-xl font-semibold text-text-primary mb-2">
    Card Title
  </h3>
  <p className="text-sm text-text-secondary">
    Card description goes here
  </p>
</div>
```

### Glass Card
```jsx
<div className="
  glass-card
  rounded-2xl
  p-6
  hover:border-white/20
  transition-all duration-300
">
  <h3 className="text-xl font-semibold text-text-primary mb-2">
    Glass Card
  </h3>
  <p className="text-sm text-text-secondary">
    Beautiful frosted glass effect
  </p>
</div>
```

### Gradient Border Card
```jsx
<div className="
  relative
  bg-dark-card
  rounded-2xl
  p-6
  overflow-hidden
">
  {/* Gradient border */}
  <div className="
    absolute inset-0
    rounded-2xl
    p-[1px]
    bg-gradient-to-r from-brand-blue to-brand-purple
    -z-10
  ">
    <div className="
      w-full h-full
      bg-dark-card
      rounded-2xl
    "></div>
  </div>

  <h3 className="text-xl font-semibold text-text-primary mb-2">
    Premium Feature
  </h3>
  <p className="text-sm text-text-secondary">
    Highlighted with gradient border
  </p>
</div>
```

### Stat Card with Glow
```jsx
<div className="
  bg-dark-card
  rounded-xl
  p-6
  border border-brand-blue/20
  shadow-brand-blue
  hover:shadow-glow
  transition-all duration-300
  cursor-pointer
">
  <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
    Total Value Locked
  </p>
  <p className="text-3xl font-bold text-text-primary font-mono mb-2">
    $2,450,000
  </p>
  <div className="flex items-center gap-2">
    <span className="text-success-bright text-sm">↑ 12.5%</span>
    <span className="text-text-tertiary text-xs">vs last month</span>
  </div>
</div>
```

---

## 3. Input Fields

### Text Input
```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-text-secondary">
    Wallet Address
  </label>
  <input
    type="text"
    placeholder="0x..."
    className="
      w-full
      px-4 py-3
      bg-dark-elevated
      border border-white/10
      rounded-lg
      text-text-primary
      placeholder:text-text-tertiary
      focus:outline-none
      focus:ring-2
      focus:ring-brand-blue
      focus:border-transparent
      transition-all duration-300
      font-mono
    "
  />
</div>
```

### Amount Input with Max Button
```jsx
<div className="space-y-2">
  <label className="text-sm font-medium text-text-secondary">
    Amount
  </label>
  <div className="relative">
    <input
      type="number"
      placeholder="0.00"
      className="
        w-full
        px-4 py-3 pr-20
        bg-dark-elevated
        border border-white/10
        rounded-lg
        text-text-primary text-lg font-mono
        placeholder:text-text-tertiary
        focus:outline-none
        focus:ring-2
        focus:ring-brand-blue
        focus:border-transparent
        transition-all duration-300
      "
    />
    <button className="
      absolute right-2 top-1/2 -translate-y-1/2
      px-3 py-1.5
      bg-brand-blue/20
      text-brand-blue text-xs font-semibold
      rounded-md
      hover:bg-brand-blue/30
      transition-all duration-300
    ">
      MAX
    </button>
  </div>
  <p className="text-xs text-text-tertiary">
    Balance: 1,234.56 USDC
  </p>
</div>
```

### Search Input
```jsx
<div className="relative">
  <input
    type="search"
    placeholder="Search tokens..."
    className="
      w-full
      pl-10 pr-4 py-3
      bg-dark-elevated
      border border-white/10
      rounded-lg
      text-text-primary
      placeholder:text-text-tertiary
      focus:outline-none
      focus:ring-2
      focus:ring-brand-blue
      focus:border-transparent
      transition-all duration-300
    "
  />
  <svg className="
    absolute left-3 top-1/2 -translate-y-1/2
    w-5 h-5
    text-text-tertiary
  " fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
</div>
```

---

## 4. Alerts & Notifications

### Success Alert
```jsx
<div className="
  bg-success-soft/10
  border border-success-soft/30
  rounded-lg
  p-4
  flex items-start gap-3
">
  <svg className="w-5 h-5 text-success-bright mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
  <div className="flex-1">
    <p className="text-sm font-semibold text-text-primary mb-1">
      Transaction Successful
    </p>
    <p className="text-xs text-text-secondary">
      Your transaction has been confirmed on the blockchain
    </p>
  </div>
</div>
```

### Error Alert
```jsx
<div className="
  bg-error/10
  border border-error/30
  rounded-lg
  p-4
  flex items-start gap-3
">
  <svg className="w-5 h-5 text-error mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
  <div className="flex-1">
    <p className="text-sm font-semibold text-text-primary mb-1">
      Transaction Failed
    </p>
    <p className="text-xs text-text-secondary">
      Insufficient funds in your wallet
    </p>
  </div>
</div>
```

### Warning Alert
```jsx
<div className="
  bg-warning/10
  border border-warning/30
  rounded-lg
  p-4
  flex items-start gap-3
">
  <svg className="w-5 h-5 text-warning mt-0.5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
  <div className="flex-1">
    <p className="text-sm font-semibold text-text-primary mb-1">
      High Network Fees
    </p>
    <p className="text-xs text-text-secondary">
      Gas prices are currently high. Consider waiting for lower fees.
    </p>
  </div>
</div>
```

---

## 5. Typography Examples

### Hero Heading
```jsx
<h1 className="
  text-5xl md:text-7xl
  font-bold
  bg-gradient-to-r from-brand-blue to-brand-purple
  bg-clip-text text-transparent
  mb-6
">
  The Future of Bill Splitting
</h1>
```

### Section Heading
```jsx
<h2 className="
  text-3xl md:text-4xl
  font-bold
  text-text-primary
  mb-4
">
  How It Works
</h2>
```

### Gradient Accent Text
```jsx
<p className="
  text-xl
  bg-gradient-to-r from-brand-purple to-brand-pink
  bg-clip-text text-transparent
  font-semibold
">
  Split bills instantly with crypto
</p>
```

### Body Text
```jsx
<p className="
  text-base
  text-text-secondary
  leading-relaxed
  max-w-2xl
">
  BillHaven makes it easy to split bills with friends using cryptocurrency.
  No more awkward IOUs or waiting for bank transfers.
</p>
```

### Monospace Numbers (for amounts)
```jsx
<p className="
  text-2xl
  font-mono font-bold
  text-text-primary
">
  $1,234.56
</p>
```

---

## 6. Badges & Tags

### Primary Badge
```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  bg-brand-blue/20
  text-brand-blue
  text-xs font-semibold
  rounded-full
  border border-brand-blue/30
">
  New
</span>
```

### Success Badge
```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  bg-success-soft/20
  text-success-bright
  text-xs font-semibold
  rounded-full
  border border-success-soft/30
">
  Verified
</span>
```

### Gradient Badge
```jsx
<span className="
  inline-flex items-center
  px-3 py-1
  bg-gradient-to-r from-brand-blue to-brand-purple
  text-white
  text-xs font-semibold
  rounded-full
  shadow-brand-blue
">
  Premium
</span>
```

---

## 7. Navigation

### Top Navigation
```jsx
<nav className="
  fixed top-0 left-0 right-0
  z-50
  backdrop-blur-xl
  bg-dark-primary/80
  border-b border-white/10
">
  <div className="container mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg"></div>
        <span className="text-xl font-bold text-text-primary">BillHaven</span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          Features
        </a>
        <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          How It Works
        </a>
        <a href="#" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          Pricing
        </a>
      </div>

      {/* CTA Button */}
      <button className="
        px-6 py-2.5
        bg-gradient-to-r from-brand-blue to-brand-purple
        text-white font-semibold text-sm
        rounded-lg
        hover:shadow-glow
        transition-all duration-300
      ">
        Connect Wallet
      </button>
    </div>
  </div>
</nav>
```

### Sidebar Navigation
```jsx
<aside className="
  fixed left-0 top-0 bottom-0
  w-64
  bg-dark-secondary
  border-r border-white/10
  p-6
">
  <div className="flex flex-col h-full">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-8">
      <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg"></div>
      <span className="text-xl font-bold text-text-primary">BillHaven</span>
    </div>

    {/* Nav Items */}
    <nav className="flex-1 space-y-2">
      <a href="#" className="
        flex items-center gap-3
        px-4 py-3
        bg-brand-blue/10
        text-brand-blue
        rounded-lg
        transition-colors
      ">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <span className="font-medium">Dashboard</span>
      </a>

      <a href="#" className="
        flex items-center gap-3
        px-4 py-3
        text-text-secondary
        hover:bg-dark-elevated
        rounded-lg
        transition-colors
      ">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Transactions</span>
      </a>
    </nav>
  </div>
</aside>
```

---

## 8. Modals

### Standard Modal
```jsx
<div className="
  fixed inset-0
  bg-black/60
  backdrop-blur-sm
  flex items-center justify-center
  z-50
  p-6
">
  <div className="
    glass-card-strong
    rounded-2xl
    p-8
    max-w-md
    w-full
    animate-slide-up
  ">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-text-primary">
        Confirm Transaction
      </h3>
      <button className="
        text-text-tertiary
        hover:text-text-primary
        transition-colors
      ">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="space-y-4 mb-8">
      <div className="flex justify-between">
        <span className="text-sm text-text-secondary">Amount</span>
        <span className="text-sm font-mono font-semibold text-text-primary">$250.00</span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-text-secondary">Network Fee</span>
        <span className="text-sm font-mono text-text-primary">$2.50</span>
      </div>
      <div className="h-px bg-white/10"></div>
      <div className="flex justify-between">
        <span className="text-base font-semibold text-text-primary">Total</span>
        <span className="text-base font-mono font-bold text-text-primary">$252.50</span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex gap-3">
      <button className="
        flex-1
        px-6 py-3
        bg-dark-elevated
        text-text-primary font-semibold
        rounded-lg
        hover:bg-dark-card
        transition-all duration-300
      ">
        Cancel
      </button>
      <button className="
        flex-1
        px-6 py-3
        bg-gradient-to-r from-brand-blue to-brand-purple
        text-white font-semibold
        rounded-lg
        shadow-brand-blue
        hover:shadow-glow
        transition-all duration-300
      ">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## 9. Loading States

### Spinner
```jsx
<div className="
  inline-block
  w-8 h-8
  border-4 border-brand-blue/20
  border-t-brand-blue
  rounded-full
  animate-spin
"></div>
```

### Skeleton Card
```jsx
<div className="
  bg-dark-card
  rounded-2xl
  p-6
  border border-white/10
  animate-pulse
">
  <div className="h-4 w-20 bg-text-tertiary/20 rounded mb-4"></div>
  <div className="h-8 w-32 bg-text-tertiary/20 rounded mb-2"></div>
  <div className="h-3 w-16 bg-text-tertiary/20 rounded"></div>
</div>
```

### Progress Bar
```jsx
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span className="text-text-secondary">Processing...</span>
    <span className="text-text-primary font-semibold">75%</span>
  </div>
  <div className="
    w-full h-2
    bg-dark-elevated
    rounded-full
    overflow-hidden
  ">
    <div className="
      h-full w-3/4
      bg-gradient-to-r from-brand-blue to-brand-purple
      transition-all duration-300
    "></div>
  </div>
</div>
```

---

## 10. Complete Page Example

```jsx
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="
        sticky top-0 z-50
        backdrop-blur-xl bg-dark-primary/80
        border-b border-white/10
      ">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-purple rounded-lg"></div>
              <span className="text-xl font-bold">BillHaven</span>
            </div>
            <button className="
              px-6 py-2.5
              bg-gradient-to-r from-brand-blue to-brand-purple
              text-white font-semibold text-sm
              rounded-lg
              hover:shadow-glow
              transition-all duration-300
            ">
              0x1234...5678
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="mb-16">
          <h1 className="
            text-5xl md:text-7xl
            font-bold
            bg-gradient-to-r from-brand-blue to-brand-purple
            bg-clip-text text-transparent
            mb-6
          ">
            Welcome Back
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            Manage your shared expenses and split bills effortlessly
          </p>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="
            bg-dark-card
            rounded-xl
            p-6
            border border-brand-blue/20
            shadow-brand-blue
            hover:shadow-glow
            transition-all duration-300
          ">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
              Total Balance
            </p>
            <p className="text-3xl font-bold text-text-primary font-mono mb-2">
              $2,450.00
            </p>
            <p className="text-success-bright text-sm">↑ 12.5%</p>
          </div>

          <div className="
            glass-card
            rounded-xl
            p-6
            hover:border-white/20
            transition-all duration-300
          ">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
              Active Bills
            </p>
            <p className="text-3xl font-bold text-text-primary font-mono mb-2">
              8
            </p>
            <p className="text-text-secondary text-sm">3 pending</p>
          </div>

          <div className="
            bg-dark-card
            rounded-xl
            p-6
            border border-brand-purple/20
            hover:border-brand-purple
            transition-all duration-300
          ">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">
              Friends
            </p>
            <p className="text-3xl font-bold text-text-primary font-mono mb-2">
              24
            </p>
            <p className="text-text-secondary text-sm">12 active</p>
          </div>
        </div>

        {/* Recent Transactions */}
        <section>
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Recent Transactions
          </h2>
          <div className="space-y-4">
            <div className="
              glass-card
              rounded-xl
              p-4
              flex items-center justify-between
              hover:border-white/20
              transition-all duration-300
            ">
              <div className="flex items-center gap-4">
                <div className="
                  w-10 h-10
                  bg-success-soft/20
                  rounded-full
                  flex items-center justify-center
                ">
                  <svg className="w-5 h-5 text-success-bright" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Dinner Split</p>
                  <p className="text-sm text-text-tertiary">with Alice, Bob, Charlie</p>
                </div>
              </div>
              <p className="font-mono font-bold text-success-bright">+$45.00</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

---

## Implementation Checklist

- [ ] Install Inter and JetBrains Mono fonts
- [ ] Update `tailwind.config.js` with new theme
- [ ] Add CSS custom properties to main CSS file
- [ ] Create reusable component library
- [ ] Test dark mode across all components
- [ ] Verify accessibility (focus states, contrast, keyboard nav)
- [ ] Test responsive behavior on mobile/tablet/desktop
- [ ] Optimize for performance (lazy loading, code splitting)

---

**Design Inspiration:**
- Uniswap: Simple, pink accent, clean DeFi UX
- Aave: Professional fintech, modern gradient aesthetics
- Phantom: Beautiful purple gradients, smooth glassmorphism
- Revolut: Clean UX, trustworthy blue palette
- Coinbase: Mass-market accessibility, security-focused design
