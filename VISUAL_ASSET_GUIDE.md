# BillHaven Visual Asset Guide
**Complete Design System for Multi-Chain P2P Escrow Platform**

> Created by: World-Class Crypto Visual Design Expert
> Last Updated: 2025-12-01
> Version: 1.0

---

## Table of Contents
1. [Cryptocurrency Logo Standards](#1-cryptocurrency-logo-standards)
2. [Token Icons](#2-token-icons)
3. [Payment Method Icons](#3-payment-method-icons)
4. [Icon Library Recommendations](#4-icon-library-recommendations)
5. [Chain Selector Design](#5-chain-selector-design)
6. [Transaction Status Visuals](#6-transaction-status-visuals)
7. [Wallet Connection UI](#7-wallet-connection-ui)
8. [Code Implementation](#8-code-implementation)
9. [Complete Component Library](#9-complete-component-library)

---

## 1. Cryptocurrency Logo Standards

### 1.1 Polygon (MATIC)

**Official Sources:**
- Official Brand Kit: https://polygon.technology/brand-resources
- Logo CDN: https://cryptologos.cc/logos/polygon-matic-logo.svg
- React Icons: Use `@web3icons/react` or custom SVG

**Brand Colors:**
- Primary: `#8247E5` (Purple)
- Secondary: `#7B3FE4`
- Dark Mode: Keep vibrant `#8247E5`
- Background: `#F5F3FF` (light) / `#1A0B2E` (dark)

**Recommended Sizes:**
- List item: 24px × 24px
- Card header: 32px × 32px
- Chain selector: 40px × 40px
- Hero/feature: 64px × 64px

**DO's:**
- Use official purple gradient logo
- Maintain aspect ratio (1:1)
- Add subtle drop shadow for depth
- Pair with "Polygon" text for clarity

**DON'Ts:**
- Don't alter the purple color
- Don't rotate or skew
- Don't use old "Matic Network" branding
- Don't place on purple backgrounds (low contrast)

---

### 1.2 Ethereum (ETH)

**Official Sources:**
- Ethereum Foundation: https://ethereum.org/en/assets/
- Logo SVG: https://cryptologos.cc/logos/ethereum-eth-logo.svg
- CDN: https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png

**Brand Colors:**
- Primary: `#627EEA` (Blue/Purple)
- Alternative: `#B8B8B8` (Gray for monochrome)
- Dark Mode: Brighten to `#7C98FF`
- Glow Effect: `rgba(98, 126, 234, 0.2)`

**Recommended Sizes:**
- List: 24px × 24px
- Selector: 40px × 40px
- Feature: 64px × 64px

**DO's:**
- Use diamond/gem shape logo
- Add subtle glow in dark mode
- Use monochrome gray for inactive states
- Show "ETH" ticker alongside logo

**DON'Ts:**
- Don't use old "Ether" text logo
- Don't alter diamond proportions
- Don't use black outline version (outdated)
- Don't compress vertically

---

### 1.3 Arbitrum (ARB)

**Official Sources:**
- Brand Assets: https://arbitrum.io/media-kit
- Logo: https://cryptologos.cc/logos/arbitrum-arb-logo.svg
- GitHub: https://github.com/OffchainLabs/arbitrum/tree/master/media

**Brand Colors:**
- Primary: `#28A0F0` (Bright Blue)
- Secondary: `#2D374B` (Dark Navy)
- Dark Mode: Keep `#28A0F0` (already optimized)
- Background: `#E8F4FD`

**Recommended Sizes:**
- Standard: 24px, 32px, 40px, 64px

**DO's:**
- Use circular blue logo
- Maintain bright, optimistic blue
- Show "Arbitrum One" for mainnet
- Use "Arbitrum Nova" for alternate chain

**DON'Ts:**
- Don't darken the blue
- Don't use without proper spacing
- Don't confuse with Optimism (similar colors)

---

### 1.4 Optimism (OP)

**Official Sources:**
- Brand Kit: https://www.optimism.io/brand-kit
- Logo: https://cryptologos.cc/logos/optimism-ethereum-op-logo.svg
- Assets: https://github.com/ethereum-optimism/brand-kit

**Brand Colors:**
- Primary: `#FF0420` (Red)
- Secondary: `#000000` (Black)
- Dark Mode: Slightly desaturate to `#FF1A35`
- Accent: `#FFFFFF`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px (circular logo)

**DO's:**
- Use bold red circular logo
- Embrace the distinctive red
- Show "OP Mainnet" label
- Use high contrast placement

**DON'Ts:**
- Don't mute the red color
- Don't use on red backgrounds
- Don't confuse with old "OΞ" logo

---

### 1.5 Base (Coinbase L2)

**Official Sources:**
- Base Brand: https://base.org/brand
- Logo: https://avatars.githubusercontent.com/u/108554348
- Assets: https://github.com/base-org/brand-kit

**Brand Colors:**
- Primary: `#0052FF` (Coinbase Blue)
- Secondary: `#E8F4FD` (Light Blue)
- Dark Mode: Slightly brighten to `#1A6AFF`
- Accent: `#FFFFFF`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use clean, modern circular logo
- Associate with "Built on Base" branding
- Show Coinbase connection for trust
- Use flat design (no gradients)

**DON'Ts:**
- Don't add effects (keep minimal)
- Don't use old beta branding
- Don't confuse with Coinbase main brand

---

### 1.6 BSC / BNB Chain

**Official Sources:**
- BNB Chain: https://www.bnbchain.org/en/brand
- Logo: https://cryptologos.cc/logos/bnb-bnb-logo.svg
- Assets: https://github.com/bnb-chain/brand-assets

**Brand Colors:**
- Primary: `#F3BA2F` (Gold/Yellow)
- Secondary: `#000000` (Black)
- Dark Mode: Keep gold `#F3BA2F`
- Background: `#FFF9E6`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use distinctive gold color
- Show "BNB Chain" (modern naming)
- Use diamond/coin shape logo
- Maintain high contrast

**DON'Ts:**
- Don't call it "Binance Smart Chain" (outdated)
- Don't darken the gold
- Don't use on yellow backgrounds

---

### 1.7 Bitcoin (BTC)

**Official Sources:**
- Bitcoin Wiki: https://bitcoin.org/en/media
- Logo: https://cryptologos.cc/logos/bitcoin-btc-logo.svg
- Community Assets: https://github.com/bitcoin-dot-org/bitcoin.org/tree/master/img

**Brand Colors:**
- Primary: `#F7931A` (Orange)
- Secondary: `#4D4D4D` (Gray)
- Dark Mode: Keep `#F7931A`
- Monochrome: `#000000`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use classic orange "₿" symbol
- Respect the original design
- Use tilted "B" with strokes
- Show "Bitcoin" text for clarity

**DON'Ts:**
- Don't alter the orange
- Don't remove the strokes from B
- Don't use cryptocurrency.com variations
- Don't over-stylize (keep classic)

---

### 1.8 Lightning Network

**Official Sources:**
- Lightning Network: https://lightning.network/assets/
- Logo: https://github.com/lightningnetwork/lnd/blob/master/logo.png
- Community: https://www.lightningdesign.com/

**Brand Colors:**
- Primary: `#792EE5` (Purple)
- Secondary: `#FDB833` (Gold - bitcoin accent)
- Dark Mode: Keep purple `#792EE5`
- Glow: `rgba(121, 46, 229, 0.3)`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use lightning bolt symbol
- Add subtle glow effect
- Show "Lightning Network" text
- Emphasize speed/instant settlement

**DON'Ts:**
- Don't use generic lightning bolt
- Don't confuse with other layer-2s
- Don't over-animate (keep subtle)

---

### 1.9 Solana (SOL)

**Official Sources:**
- Solana Foundation: https://solana.com/branding
- Logo: https://cryptologos.cc/logos/solana-sol-logo.svg
- GitHub: https://github.com/solana-labs/token-list/blob/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png

**Brand Colors:**
- Primary: `#14F195` (Gradient start - cyan/green)
- Secondary: `#9945FF` (Gradient end - purple)
- Gradient: `linear-gradient(135deg, #14F195 0%, #9945FF 100%)`
- Dark Mode: Keep vibrant gradient

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use official gradient logo
- Show gradient direction (diagonal)
- Embrace vibrant, modern aesthetic
- Use "Solana" wordmark when space allows

**DON'Ts:**
- Don't use single-color version
- Don't reverse gradient direction
- Don't dull the colors
- Don't stretch logo

---

### 1.10 TON (The Open Network)

**Official Sources:**
- TON Foundation: https://ton.org/brand-assets
- Logo: https://ton.org/download/ton_symbol.svg
- GitHub: https://github.com/ton-blockchain/assets

**Brand Colors:**
- Primary: `#0088CC` (Blue)
- Secondary: `#229ED9` (Light Blue)
- Dark Mode: Brighten to `#00A0E9`
- Background: `#E8F7FC`

**Recommended Sizes:**
- 24px, 32px, 40px, 64px

**DO's:**
- Use diamond/crystal shape logo
- Show "TON" clearly
- Associate with Telegram integration
- Use clean, modern presentation

**DON'Ts:**
- Don't confuse with old "Telegram Open Network"
- Don't alter the blue shade
- Don't use outdated branding

---

## 2. Token Icons

### 2.1 Stablecoins

#### USDT (Tether)

**Official Sources:**
- Tether: https://tether.to/en/media-kit
- Logo: https://cryptologos.cc/logos/tether-usdt-logo.svg

**Brand Colors:**
- Primary: `#26A17B` (Green)
- Secondary: `#FFFFFF`
- Dark Mode: Keep green `#26A17B`

**Chain Variants:**
- USDT-Polygon (ERC-20 on Polygon)
- USDT-Ethereum (ERC-20)
- USDT-Arbitrum
- USDT-Optimism
- USDT-Base
- USDT-BSC (BEP-20)
- USDT-Solana (SPL)
- USDT-TON

**Display Pattern:**
```
[USDT Logo] USDT on Polygon
[USDT Logo] USDT on Ethereum
```

---

#### USDC (Circle)

**Official Sources:**
- Circle: https://www.circle.com/en/brand
- Logo: https://cryptologos.cc/logos/usd-coin-usdc-logo.svg

**Brand Colors:**
- Primary: `#2775CA` (Blue)
- Secondary: `#FFFFFF`
- Dark Mode: Brighten to `#3D8EE0`

**Chain Variants:**
- USDC-Polygon (native)
- USDC-Ethereum (native)
- USDC-Arbitrum
- USDC-Optimism
- USDC-Base
- USDC-Solana (native)

**Display Pattern:**
```
[USDC Logo] USDC
Show chain logo as badge overlay (bottom-right)
```

---

#### DAI (MakerDAO)

**Official Sources:**
- MakerDAO: https://makerdao.com/en/brand
- Logo: https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg

**Brand Colors:**
- Primary: `#F5AC37` (Gold)
- Secondary: `#FFFFFF`

**Chains:**
- DAI-Ethereum (primary)
- DAI-Polygon
- DAI-Arbitrum
- DAI-Optimism
- DAI-Base

---

### 2.2 Wrapped Assets

#### WBTC (Wrapped Bitcoin)

**Official Sources:**
- WBTC: https://wbtc.network/
- Logo: https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg

**Brand Colors:**
- Primary: `#F09242` (Orange - Bitcoin derivative)
- Secondary: `#282138` (Dark purple)

**Chains:**
- WBTC-Ethereum
- WBTC-Polygon
- WBTC-Arbitrum
- WBTC-Optimism

---

### 2.3 Native Gas Tokens

| Token | Chain | Color | Logo |
|-------|-------|-------|------|
| ETH | Ethereum | `#627EEA` | Diamond shape |
| MATIC | Polygon | `#8247E5` | Purple polygon |
| ARB | Arbitrum | `#28A0F0` | Blue circle |
| OP | Optimism | `#FF0420` | Red circle |
| ETH | Base | `#0052FF` | Diamond (blue) |
| BNB | BSC | `#F3BA2F` | Gold diamond |
| BTC | Bitcoin | `#F7931A` | Orange B |
| SOL | Solana | Gradient | Gradient symbol |
| TON | TON | `#0088CC` | Blue diamond |

---

## 3. Payment Method Icons

### 3.1 European Payment Methods

#### iDEAL (Netherlands)

**Official Sources:**
- Currence: https://www.ideal.nl/en/businesses/logo-and-house-style/
- Logo: Official pink/fuchsia branding

**Brand Colors:**
- Primary: `#CC0066` (Fuchsia/Pink)
- Text: `#000000`

**Legal Requirements:**
- Must use official logo
- Cannot be modified
- Requires licensing for commercial use
- Size minimum: 44px height

**Display:**
```html
<!-- Official iDEAL badge -->
<img src="ideal-logo.svg" alt="iDEAL" height="44" />
```

---

#### SEPA (Single Euro Payments Area)

**Official Sources:**
- European Payments Council: https://www.europeanpaymentscouncil.eu/
- Logo: Blue/yellow EU-themed

**Brand Colors:**
- Primary: `#003399` (EU Blue)
- Secondary: `#FFCC00` (EU Yellow)

**Display:**
```
"SEPA Bank Transfer" text with EU flag icon
```

---

#### Bancontact (Belgium)

**Official Sources:**
- Bancontact: https://www.bancontact.com/en/merchants
- Logo: Blue and white branding

**Brand Colors:**
- Primary: `#005498` (Blue)
- Secondary: `#FFFFFF`

**Legal:**
- Official logo required
- Minimum size: 40px height

---

#### SOFORT / Klarna

**Official Sources:**
- Klarna: https://www.klarna.com/international/press/brand-assets/
- Note: SOFORT rebranded to Klarna in 2022

**Brand Colors:**
- Primary: `#FFB3C7` (Pink - Klarna)
- Secondary: `#000000`

**Display:**
- Use "Pay with Klarna" or legacy "SOFORT" logo
- Follow Klarna brand guidelines

---

### 3.2 Card Networks

#### Visa

**Brand Colors:**
- Primary: `#1434CB` (Blue)
- Gold: `#F7B600`

**Requirements:**
- Use official Visa logo
- Minimum size: 32px height
- Cannot alter colors

---

#### Mastercard

**Brand Colors:**
- Red: `#EB001B`
- Yellow: `#F79E1B`
- Overlap: `#FF5F00`

**Requirements:**
- Use interlocking circles logo
- Maintain exact color ratios
- Minimum size: 32px

---

#### American Express

**Brand Colors:**
- Primary: `#006FCF` (Blue)

**Requirements:**
- Use official Amex logo or "AMEX" text
- Blue on white or white on blue only

---

### 3.3 Digital Wallets

#### Apple Pay

**Official Sources:**
- Apple: https://developer.apple.com/apple-pay/marketing/

**Brand Colors:**
- Black logo on white: `#000000`
- White logo on black: `#FFFFFF`

**Requirements:**
- Use official Apple Pay buttons
- Follow HIG (Human Interface Guidelines)
- Use "Buy with Apple Pay" or "Donate with Apple Pay"
- Cannot create custom buttons

**Code Example:**
```html
<apple-pay-button buttonstyle="black" type="plain" locale="en"></apple-pay-button>
```

---

#### Google Pay

**Official Sources:**
- Google: https://developers.google.com/pay/api/web/guides/brand-guidelines

**Brand Colors:**
- Standard button uses Google's multi-color scheme
- Black or white variants available

**Requirements:**
- Use official Google Pay button
- Follow brand guidelines strictly
- Available types: "buy", "donate", "plain"

**Code Example:**
```html
<button class="gpay-button" aria-label="Pay with Google Pay"></button>
```

---

## 4. Icon Library Recommendations

### 4.1 Best Icon Libraries for Crypto (2025)

#### Option 1: **cryptocurrency-icons** (Recommended)
```bash
npm install cryptocurrency-icons
```

**Features:**
- 500+ cryptocurrency SVG icons
- Multiple sizes (32px, 128px)
- Color and monochrome versions
- Free and open source
- Regular updates

**Usage:**
```javascript
import btc from 'cryptocurrency-icons/svg/color/btc.svg';
```

**CDN:**
```html
<img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg" alt="Bitcoin" />
```

---

#### Option 2: **@web3icons/react**
```bash
npm install @web3icons/react
```

**Features:**
- React components for Web3
- Chains + tokens + protocols
- TypeScript support
- Tree-shakeable
- Dark mode variants

**Usage:**
```tsx
import { EthereumLogo, PolygonLogo } from '@web3icons/react';

<EthereumLogo size={32} variant="branded" />
```

---

#### Option 3: **simple-icons**
```bash
npm install simple-icons
```

**Features:**
- 2,900+ brand icons
- Includes major crypto brands
- Official brand colors in metadata
- SVG format
- Regular updates

**Usage:**
```javascript
import { siEthereum } from 'simple-icons/icons';
```

---

#### Option 4: **Custom SVG Library** (BillHaven Specific)

Create `/src/assets/icons/chains/` with:
- `polygon.svg`
- `ethereum.svg`
- `arbitrum.svg`
- `optimism.svg`
- `base.svg`
- `bsc.svg`
- `bitcoin.svg`
- `lightning.svg`
- `solana.svg`
- `ton.svg`

Create `/src/assets/icons/payments/` with:
- `ideal.svg`
- `sepa.svg`
- `bancontact.svg`
- `visa.svg`
- `mastercard.svg`
- `amex.svg`

---

### 4.2 Recommended CDN Sources

**For Crypto Logos:**
```
https://cryptologos.cc/logos/{coin}-{ticker}-logo.svg
https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/svg/color/{ticker}.svg
```

**For Payment Logos:**
```
https://cdn.worldvectorlogo.com/logos/{brand}.svg
```

**For Web3:**
```
https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg
https://walletconnect.com/images/walletconnect-logo.svg
```

---

### 4.3 React Component Libraries

#### **RainbowKit** (Recommended for Ethereum)
```bash
npm install @rainbow-me/rainbowkit wagmi viem
```

**Features:**
- Beautiful wallet connection UI
- 100+ wallet connectors
- Chain switching built-in
- Customizable themes
- Best-in-class UX

**Usage:**
```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

<ConnectButton />
```

---

#### **Web3Modal** (Multi-chain)
```bash
npm install @web3modal/react
```

**Features:**
- Supports Ethereum + Solana + more
- WalletConnect integration
- Email login option
- Customizable

---

#### **Solana Wallet Adapter**
```bash
npm install @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

**Features:**
- Official Solana library
- Phantom, Solflare, etc.
- UI components included

---

#### **TON Connect UI**
```bash
npm install @tonconnect/ui-react
```

**Features:**
- Official TON wallet connector
- Telegram wallet integration
- QR code support

---

## 5. Chain Selector Design

### 5.1 Design Patterns

#### Pattern A: Dropdown (Simple)

**Best for:** 3-7 chains
**Use case:** Primary chain selection

```
┌─────────────────────────────┐
│ [🟣] Polygon          [▼]   │
└─────────────────────────────┘
     ↓ (opens)
┌─────────────────────────────┐
│ [🟣] Polygon          [✓]   │
│ [🔷] Ethereum               │
│ [🔵] Arbitrum               │
│ [🔴] Optimism               │
│ [🔵] Base                   │
│ [🟡] BSC                    │
└─────────────────────────────┘
```

---

#### Pattern B: Modal (Advanced)

**Best for:** 8+ chains (BillHaven case)
**Use case:** Complex multi-chain selection

```
Select Network
─────────────────────────────────

🔍 Search networks...

ETHEREUM & LAYER 2
┌────────────────────────────┐
│ [🔷] Ethereum Mainnet      │
│      Gas: 15 gwei          │
└────────────────────────────┘
┌────────────────────────────┐
│ [🟣] Polygon               │
│      Gas: 50 gwei          │
└────────────────────────────┘
┌────────────────────────────┐
│ [🔵] Arbitrum One          │
│      Gas: 0.1 gwei         │
└────────────────────────────┘

BITCOIN
┌────────────────────────────┐
│ [🟠] Bitcoin               │
│      Fee: ~$2.50           │
└────────────────────────────┘
┌────────────────────────────┐
│ [⚡] Lightning Network     │
│      Fee: <$0.01           │
└────────────────────────────┘

OTHER CHAINS
┌────────────────────────────┐
│ [🌈] Solana                │
│      Fee: ~$0.0001         │
└────────────────────────────┘
```

---

#### Pattern C: Chip/Tag Grid (Modern)

**Best for:** Visual browsing
**Use case:** Feature pages, marketing

```
Select your preferred network:

[ 🟣 Polygon ]  [ 🔷 Ethereum ]  [ 🔵 Arbitrum ]
[ 🔴 Optimism ] [ 🔵 Base ]      [ 🟡 BSC ]
[ 🟠 Bitcoin ]  [ ⚡ Lightning ] [ 🌈 Solana ]
[ 💎 TON ]
```

---

### 5.2 Network Status Indicators

```
Connected: [✓] Polygon Mainnet
Wrong Network: [⚠️] Please switch to Polygon
Testnet: [🧪] Polygon Mumbai (Testnet)
Loading: [⏳] Connecting to Ethereum...
```

---

### 5.3 Gas Fee Display Patterns

```
Network Fee: ~$0.50 (25 gwei)
Total Cost: $100.50 (amount) + $0.50 (network fee)

┌──────────────────────────────┐
│ Estimated Gas                │
│ ────────────────────────────│
│ Slow:    $0.25  (~2 min)     │
│ Normal:  $0.50  (~1 min) [✓] │
│ Fast:    $1.00  (~30 sec)    │
└──────────────────────────────┘
```

---

## 6. Transaction Status Visuals

### 6.1 Transaction States

#### Pending (Animated)

```tsx
<div className="tx-status pending">
  <div className="spinner"></div>
  <span>Transaction Pending...</span>
  <p className="tx-hash">0x1234...5678</p>
</div>
```

**Animation:**
- Spinning circle or dots
- Pulsing effect
- Color: `#FFA500` (Orange)

---

#### Confirming (Block Count)

```tsx
<div className="tx-status confirming">
  <div className="progress-ring">
    <svg><!-- Circular progress --></svg>
    <span className="count">3/12</span>
  </div>
  <span>Confirming...</span>
  <p>Block 3 of 12 confirmations</p>
</div>
```

**Visual:**
- Progress ring/bar
- Block count: "3/12"
- Estimated time: "~2 minutes remaining"
- Color: `#3B82F6` (Blue)

---

#### Completed (Success)

```tsx
<div className="tx-status success">
  <div className="checkmark-animation">
    ✓
  </div>
  <span>Transaction Successful!</span>
  <a href="https://polygonscan.com/tx/0x123...">View on Explorer →</a>
</div>
```

**Animation:**
- Checkmark draw-in animation
- Confetti (optional)
- Green glow effect
- Color: `#10B981` (Green)

---

#### Failed (Error)

```tsx
<div className="tx-status failed">
  <div className="error-icon">✕</div>
  <span>Transaction Failed</span>
  <p className="error-msg">Insufficient gas fee</p>
  <button>Try Again</button>
</div>
```

**Visual:**
- X icon with shake animation
- Error message
- Retry button
- Color: `#EF4444` (Red)

---

### 6.2 Timeline Progress

```
Escrow Timeline
─────────────────────────────────
[✓] Created        2024-12-01 10:00
[✓] Funded         2024-12-01 10:05
[⏳] Awaiting      Expected: 2024-12-02
[ ] Released       (Auto-release in 23h)
```

---

### 6.3 Animation Libraries

**Recommended:**

1. **Lottie** (JSON animations)
```bash
npm install lottie-react
```
- Use LottieFiles marketplace
- Success, loading, error animations

2. **Framer Motion** (React)
```bash
npm install framer-motion
```
- Smooth transitions
- Spring animations
- Gesture support

3. **CSS Animations** (Lightweight)
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 7. Wallet Connection UI

### 7.1 Connect Wallet Button (Disconnected State)

```tsx
<button className="connect-wallet">
  <WalletIcon />
  <span>Connect Wallet</span>
</button>
```

**Design Specs:**
- Height: 44px (mobile) / 40px (desktop)
- Padding: 12px 24px
- Border Radius: 12px
- Font: 600 weight, 16px
- Colors:
  - Background: `#6366F1` (Indigo)
  - Hover: `#4F46E5`
  - Text: `#FFFFFF`

---

### 7.2 Connected State

```tsx
<div className="wallet-connected">
  <div className="wallet-info">
    <div className="avatar">
      <Jazzicon diameter={32} seed={/* address */} />
    </div>
    <div className="details">
      <span className="address">0x1234...5678</span>
      <span className="balance">1.25 ETH</span>
    </div>
  </div>
  <button className="disconnect">Disconnect</button>
</div>
```

**Address Truncation:**
```javascript
const truncateAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
// becomes: 0x742d...bEb
```

**Alternative Formats:**
- Short: `0x1234...5678` (4 chars each side)
- Medium: `0x1234ab...cd5678` (6 chars each side)
- Long: `0x1234abcd...ef5678` (8 chars each side)

---

### 7.3 Network Mismatch Warning

```tsx
<div className="network-mismatch">
  <div className="warning-icon">⚠️</div>
  <div className="message">
    <h4>Wrong Network</h4>
    <p>Please switch to Polygon Mainnet</p>
  </div>
  <button className="switch-network">
    Switch Network
  </button>
</div>
```

**Colors:**
- Background: `#FEF3C7` (Yellow light)
- Border: `#F59E0B` (Amber)
- Icon: `#D97706`

---

### 7.4 Wallet Provider Logos

**MetaMask:**
- Logo: Fox icon
- Color: `#F6851B` (Orange)
- CDN: https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg

**WalletConnect:**
- Logo: Blue bridge icon
- Color: `#3B99FC` (Blue)
- CDN: https://walletconnect.com/images/walletconnect-logo.svg

**Coinbase Wallet:**
- Logo: Blue circle
- Color: `#0052FF`

**Phantom (Solana):**
- Logo: Purple ghost
- Color: `#AB9FF2` (Purple)

**Tonkeeper (TON):**
- Logo: Blue gem
- Color: `#0098EA`

---

### 7.5 Multi-Wallet Selector

```tsx
<div className="wallet-selector">
  <h3>Connect Wallet</h3>

  <button className="wallet-option">
    <img src={metamask} alt="MetaMask" />
    <span>MetaMask</span>
    <span className="badge">Popular</span>
  </button>

  <button className="wallet-option">
    <img src={walletconnect} alt="WalletConnect" />
    <span>WalletConnect</span>
  </button>

  <button className="wallet-option">
    <img src={coinbase} alt="Coinbase Wallet" />
    <span>Coinbase Wallet</span>
  </button>

  <button className="wallet-option">
    <img src={phantom} alt="Phantom" />
    <span>Phantom</span>
    <span className="badge solana">Solana</span>
  </button>
</div>
```

---

## 8. Code Implementation

### 8.1 Chain Logo Component (React)

```tsx
// src/components/ChainLogo.tsx
import React from 'react';
import { chainConfig } from '../config/chains';

interface ChainLogoProps {
  chainId: number;
  size?: number;
  showName?: boolean;
  className?: string;
}

export const ChainLogo: React.FC<ChainLogoProps> = ({
  chainId,
  size = 32,
  showName = false,
  className = ''
}) => {
  const chain = chainConfig[chainId];

  if (!chain) return null;

  return (
    <div className={`chain-logo ${className}`}>
      <img
        src={chain.logo}
        alt={chain.name}
        width={size}
        height={size}
        className="chain-logo-img"
      />
      {showName && (
        <span className="chain-name">{chain.name}</span>
      )}
    </div>
  );
};

// Usage:
<ChainLogo chainId={137} size={40} showName />
```

---

### 8.2 Chain Configuration

```typescript
// src/config/chains.ts
export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  logo: string;
  color: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const chainConfig: Record<number, ChainConfig> = {
  // Polygon
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'Polygon',
    logo: '/assets/chains/polygon.svg',
    color: '#8247E5',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    }
  },

  // Ethereum
  1: {
    id: 1,
    name: 'Ethereum',
    shortName: 'Ethereum',
    logo: '/assets/chains/ethereum.svg',
    color: '#627EEA',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  // Arbitrum One
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    logo: '/assets/chains/arbitrum.svg',
    color: '#28A0F0',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    logo: '/assets/chains/optimism.svg',
    color: '#FF0420',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  // Base
  8453: {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    logo: '/assets/chains/base.svg',
    color: '#0052FF',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },

  // BSC
  56: {
    id: 56,
    name: 'BNB Chain',
    shortName: 'BSC',
    logo: '/assets/chains/bsc.svg',
    color: '#F3BA2F',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

// Bitcoin & Lightning (non-EVM)
export const btcConfig = {
  bitcoin: {
    name: 'Bitcoin',
    logo: '/assets/chains/bitcoin.svg',
    color: '#F7931A'
  },
  lightning: {
    name: 'Lightning Network',
    logo: '/assets/chains/lightning.svg',
    color: '#792EE5'
  }
};

// Solana
export const solanaConfig = {
  name: 'Solana',
  logo: '/assets/chains/solana.svg',
  color: '#14F195',
  gradientColor: '#9945FF'
};

// TON
export const tonConfig = {
  name: 'TON',
  logo: '/assets/chains/ton.svg',
  color: '#0088CC'
};
```

---

### 8.3 Token Selector Dropdown

```tsx
// src/components/TokenSelector.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  logo: string;
  address: string;
  decimals: number;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token;
  onSelect: (token: Token) => void;
  chainId: number;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelect,
  chainId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(search.toLowerCase()) ||
    token.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="token-selector">
      <button
        className="token-selector-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="token-info">
          <img
            src={selectedToken.logo}
            alt={selectedToken.symbol}
            className="token-logo"
            width={32}
            height={32}
          />
          <div className="token-details">
            <span className="token-symbol">{selectedToken.symbol}</span>
            <span className="token-name">{selectedToken.name}</span>
          </div>
        </div>
        <ChevronDown className="chevron" />
      </button>

      {isOpen && (
        <div className="token-dropdown">
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="token-search"
          />

          <div className="token-list">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                className={`token-option ${
                  token.address === selectedToken.address ? 'selected' : ''
                }`}
                onClick={() => {
                  onSelect(token);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <img
                  src={token.logo}
                  alt={token.symbol}
                  width={32}
                  height={32}
                />
                <div className="token-info">
                  <span className="symbol">{token.symbol}</span>
                  <span className="name">{token.name}</span>
                </div>
                {token.address === selectedToken.address && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**CSS:**
```css
/* src/components/TokenSelector.css */
.token-selector {
  position: relative;
  width: 100%;
}

.token-selector-button {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
}

.token-selector-button:hover {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.token-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.token-logo {
  border-radius: 50%;
}

.token-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.token-symbol {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.token-name {
  font-size: 13px;
  color: #6b7280;
}

.token-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
}

.token-search {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  outline: none;
}

.token-search:focus {
  border-bottom-color: #6366f1;
}

.token-list {
  max-height: 320px;
  overflow-y: auto;
}

.token-option {
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: white;
  cursor: pointer;
  transition: background 0.2s;
}

.token-option:hover {
  background: #f9fafb;
}

.token-option.selected {
  background: #eff6ff;
}

.token-option .checkmark {
  margin-left: auto;
  color: #6366f1;
  font-weight: bold;
}
```

---

### 8.4 Network Switcher Component

```tsx
// src/components/NetworkSwitcher.tsx
import React, { useState } from 'react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { ChainLogo } from './ChainLogo';
import { chainConfig } from '../config/chains';

export const NetworkSwitcher: React.FC = () => {
  const { chain } = useNetwork();
  const { chains, switchNetwork } = useSwitchNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const currentChain = chain ? chainConfig[chain.id] : null;

  return (
    <div className="network-switcher">
      <button
        className="network-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentChain ? (
          <>
            <ChainLogo chainId={chain.id} size={24} />
            <span>{currentChain.shortName}</span>
          </>
        ) : (
          <span>Select Network</span>
        )}
      </button>

      {isOpen && (
        <div className="network-dropdown">
          <div className="network-header">
            <h4>Select Network</h4>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="network-list">
            <div className="network-group">
              <span className="group-label">Ethereum & L2s</span>
              {[1, 137, 42161, 10, 8453].map((chainId) => {
                const chainInfo = chainConfig[chainId];
                const isSupported = chains.some(c => c.id === chainId);

                return (
                  <button
                    key={chainId}
                    className={`network-option ${
                      chain?.id === chainId ? 'active' : ''
                    } ${!isSupported ? 'disabled' : ''}`}
                    onClick={() => {
                      if (switchNetwork && isSupported) {
                        switchNetwork(chainId);
                        setIsOpen(false);
                      }
                    }}
                    disabled={!isSupported}
                  >
                    <div className="network-info">
                      <ChainLogo chainId={chainId} size={32} />
                      <div className="network-details">
                        <span className="network-name">{chainInfo.name}</span>
                        <span className="network-status">
                          {chain?.id === chainId ? 'Connected' : 'Available'}
                        </span>
                      </div>
                    </div>
                    {chain?.id === chainId && (
                      <span className="checkmark">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="network-group">
              <span className="group-label">BSC</span>
              <button
                className={`network-option ${
                  chain?.id === 56 ? 'active' : ''
                }`}
                onClick={() => {
                  if (switchNetwork) {
                    switchNetwork(56);
                    setIsOpen(false);
                  }
                }}
              >
                <div className="network-info">
                  <ChainLogo chainId={56} size={32} />
                  <div className="network-details">
                    <span className="network-name">BNB Chain</span>
                    <span className="network-status">
                      {chain?.id === 56 ? 'Connected' : 'Available'}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

### 8.5 Transaction Status Component

```tsx
// src/components/TransactionStatus.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface TransactionStatusProps {
  status: 'pending' | 'confirming' | 'success' | 'failed';
  txHash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  errorMessage?: string;
  explorerUrl?: string;
}

export const TransactionStatus: React.FC<TransactionStatusProps> = ({
  status,
  txHash,
  confirmations = 0,
  requiredConfirmations = 12,
  errorMessage,
  explorerUrl
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader className="animate-spin" />,
          title: 'Transaction Pending',
          description: 'Waiting for confirmation...',
          color: 'text-orange-500'
        };
      case 'confirming':
        return {
          icon: <Loader className="animate-spin" />,
          title: 'Confirming',
          description: `Block ${confirmations} of ${requiredConfirmations} confirmations`,
          color: 'text-blue-500',
          progress: (confirmations / requiredConfirmations) * 100
        };
      case 'success':
        return {
          icon: <CheckCircle />,
          title: 'Transaction Successful!',
          description: 'Your transaction has been confirmed',
          color: 'text-green-500'
        };
      case 'failed':
        return {
          icon: <XCircle />,
          title: 'Transaction Failed',
          description: errorMessage || 'An error occurred',
          color: 'text-red-500'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      className="transaction-status"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`status-icon ${config.color}`}>
        {config.icon}
      </div>

      <h3 className="status-title">{config.title}</h3>
      <p className="status-description">{config.description}</p>

      {status === 'confirming' && config.progress !== undefined && (
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${config.progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {txHash && (
        <div className="tx-hash">
          <code>{txHash.slice(0, 10)}...{txHash.slice(-8)}</code>
        </div>
      )}

      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="explorer-link"
        >
          View on Explorer <ExternalLink size={16} />
        </a>
      )}
    </motion.div>
  );
};
```

**CSS:**
```css
/* src/components/TransactionStatus.css */
.transaction-status {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 0 auto;
}

.status-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon svg {
  width: 48px;
  height: 48px;
}

.status-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #111827;
}

.status-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin: 16px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.tx-hash {
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.tx-hash code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #4b5563;
}

.explorer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: color 0.2s;
}

.explorer-link:hover {
  color: #4f46e5;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## 9. Complete Component Library

### 9.1 Project Structure

```
src/
├── assets/
│   └── icons/
│       ├── chains/
│       │   ├── polygon.svg
│       │   ├── ethereum.svg
│       │   ├── arbitrum.svg
│       │   ├── optimism.svg
│       │   ├── base.svg
│       │   ├── bsc.svg
│       │   ├── bitcoin.svg
│       │   ├── lightning.svg
│       │   ├── solana.svg
│       │   └── ton.svg
│       ├── tokens/
│       │   ├── usdt.svg
│       │   ├── usdc.svg
│       │   ├── dai.svg
│       │   └── wbtc.svg
│       └── payments/
│           ├── ideal.svg
│           ├── sepa.svg
│           ├── bancontact.svg
│           ├── visa.svg
│           ├── mastercard.svg
│           └── amex.svg
├── components/
│   ├── ChainLogo.tsx
│   ├── TokenSelector.tsx
│   ├── NetworkSwitcher.tsx
│   ├── TransactionStatus.tsx
│   ├── WalletConnect.tsx
│   └── PaymentMethodSelector.tsx
├── config/
│   ├── chains.ts
│   ├── tokens.ts
│   └── payments.ts
└── styles/
    ├── chains.css
    ├── tokens.css
    └── transactions.css
```

---

### 9.2 Payment Method Selector

```tsx
// src/components/PaymentMethodSelector.tsx
import React, { useState } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  logo: string;
  fees: string;
  processingTime: string;
  limits: {
    min: number;
    max: number;
  };
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'ideal',
    name: 'iDEAL',
    logo: '/assets/payments/ideal.svg',
    fees: '€0.29',
    processingTime: 'Instant',
    limits: { min: 1, max: 50000 }
  },
  {
    id: 'sepa',
    name: 'SEPA Transfer',
    logo: '/assets/payments/sepa.svg',
    fees: 'Free',
    processingTime: '1-2 business days',
    limits: { min: 1, max: 1000000 }
  },
  {
    id: 'bancontact',
    name: 'Bancontact',
    logo: '/assets/payments/bancontact.svg',
    fees: '€0.29',
    processingTime: 'Instant',
    limits: { min: 1, max: 50000 }
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    logo: '/assets/payments/visa.svg', // Show multiple
    fees: '2.9% + €0.30',
    processingTime: 'Instant',
    limits: { min: 1, max: 100000 }
  }
];

export const PaymentMethodSelector: React.FC = () => {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <div className="payment-method-selector">
      <h3>Select Payment Method</h3>

      <div className="payment-grid">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            className={`payment-card ${
              selected?.id === method.id ? 'selected' : ''
            }`}
            onClick={() => setSelected(method)}
          >
            <div className="payment-header">
              <img
                src={method.logo}
                alt={method.name}
                className="payment-logo"
              />
              <span className="payment-name">{method.name}</span>
            </div>

            <div className="payment-details">
              <div className="detail-row">
                <span className="label">Fee:</span>
                <span className="value">{method.fees}</span>
              </div>
              <div className="detail-row">
                <span className="label">Time:</span>
                <span className="value">{method.processingTime}</span>
              </div>
              <div className="detail-row">
                <span className="label">Limits:</span>
                <span className="value">
                  €{method.limits.min} - €{method.limits.max.toLocaleString()}
                </span>
              </div>
            </div>

            {selected?.id === method.id && (
              <div className="selected-badge">✓</div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="payment-summary">
          <p>You selected <strong>{selected.name}</strong></p>
          <button className="continue-button">Continue</button>
        </div>
      )}
    </div>
  );
};
```

---

### 9.3 Wallet Connection with RainbowKit

```tsx
// src/components/WalletConnect.tsx
import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export const WalletConnect: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="connect-wallet-button"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="wrong-network-button"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="wallet-connected">
                  <button
                    onClick={openChainModal}
                    className="chain-button"
                  >
                    <img
                      src={chain.iconUrl}
                      alt={chain.name}
                      width={24}
                      height={24}
                    />
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="account-button"
                  >
                    {account.displayName}
                    {account.displayBalance && (
                      <span> ({account.displayBalance})</span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
```

---

### 9.4 Complete Wagmi + RainbowKit Setup

```tsx
// src/config/wagmi.ts
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

export const { chains, publicClient } = configureChains(
  [mainnet, polygon, arbitrum, optimism, base, bsc],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'BillHaven',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});
```

```tsx
// src/main.tsx or src/App.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig, chains } from './config/wagmi';
import '@rainbow-me/rainbowkit/styles.css';
import './index.css';

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider
        chains={chains}
        theme={darkTheme({
          accentColor: '#6366f1',
          accentColorForeground: 'white',
          borderRadius: 'medium',
        })}
      >
        {/* Your app components */}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

### 9.5 Tailwind CSS Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Chain colors
        polygon: '#8247E5',
        ethereum: '#627EEA',
        arbitrum: '#28A0F0',
        optimism: '#FF0420',
        base: '#0052FF',
        bsc: '#F3BA2F',
        bitcoin: '#F7931A',
        lightning: '#792EE5',
        solana: '#14F195',
        ton: '#0088CC',

        // Token colors
        usdt: '#26A17B',
        usdc: '#2775CA',
        dai: '#F5AC37',
        wbtc: '#F09242',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.4)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

---

## Summary & Best Practices

### Key Takeaways

1. **Logo Sources:**
   - Always use official brand assets
   - Respect brand guidelines (colors, sizes, spacing)
   - Use SVG format for scalability

2. **Color Consistency:**
   - Define chain/token colors in config
   - Use CSS variables for dark mode
   - Maintain accessibility (WCAG AA minimum)

3. **Component Architecture:**
   - Create reusable components (ChainLogo, TokenSelector, etc.)
   - Centralize configuration (chains.ts, tokens.ts)
   - Use TypeScript for type safety

4. **User Experience:**
   - Show clear transaction states
   - Provide estimated times & fees
   - Handle errors gracefully
   - Mobile-first design

5. **Web3 Integration:**
   - Use RainbowKit for best UX
   - Support multiple wallets
   - Handle network switching
   - Show clear connection states

6. **Performance:**
   - Lazy load heavy components
   - Optimize images (SVG preferred)
   - Use CDN for external assets
   - Implement proper caching

---

### Implementation Checklist

- [ ] Install required dependencies
  - [ ] `@rainbow-me/rainbowkit`
  - [ ] `wagmi`
  - [ ] `viem`
  - [ ] `framer-motion`
  - [ ] `lucide-react`

- [ ] Download/create logo assets
  - [ ] All 10 chain logos
  - [ ] Token logos (USDT, USDC, DAI, WBTC)
  - [ ] Payment method logos

- [ ] Create configuration files
  - [ ] `chains.ts`
  - [ ] `tokens.ts`
  - [ ] `payments.ts`
  - [ ] `wagmi.ts`

- [ ] Build core components
  - [ ] ChainLogo
  - [ ] TokenSelector
  - [ ] NetworkSwitcher
  - [ ] TransactionStatus
  - [ ] WalletConnect
  - [ ] PaymentMethodSelector

- [ ] Set up providers
  - [ ] WagmiConfig
  - [ ] RainbowKitProvider
  - [ ] Theme configuration

- [ ] Test across chains
  - [ ] Ethereum
  - [ ] Polygon
  - [ ] Arbitrum
  - [ ] Optimism
  - [ ] Base
  - [ ] BSC

- [ ] Mobile optimization
  - [ ] Responsive breakpoints
  - [ ] Touch-friendly buttons (44px minimum)
  - [ ] Bottom sheet modals

- [ ] Accessibility
  - [ ] ARIA labels
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast (WCAG AA)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-01
**Created For:** BillHaven P2P Escrow Platform
**Author:** World-Class Crypto Visual Design Expert

---

*This guide provides production-ready visual standards and code implementations for BillHaven's multi-chain escrow platform. All components follow industry best practices and official brand guidelines.*
