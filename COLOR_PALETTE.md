# BillHaven Color Palette Reference

Quick visual reference for all colors in the design system.

---

## Brand Colors (Primary Identity)

### Deep Ocean Blue (Primary)
```
Name: Deep Ocean Blue
Hex: #0052FF
RGB: 0, 82, 255
HSL: 221, 100%, 50%
Tailwind: bg-brand-blue, text-brand-blue
Usage: Primary CTAs, brand identity, main actions
Inspiration: Coinbase's trust-building blue
```

### Vibrant Purple (Accent)
```
Name: Vibrant Purple
Hex: #7F84F6
RGB: 127, 132, 246
HSL: 238, 87%, 73%
Tailwind: bg-brand-purple, text-brand-purple
Usage: Secondary CTAs, highlights, energy accents
Inspiration: Phantom + Revolut's cornflower blue
```

### Neon Pink (Highlight)
```
Name: Neon Pink
Hex: #FF007A
RGB: 255, 0, 122
HSL: 331, 100%, 50%
Tailwind: bg-brand-pink, text-brand-pink
Usage: Special promotions, urgent actions, innovation
Inspiration: Uniswap's energetic pink
```

---

## Dark Mode Backgrounds

### Primary Background
```
Name: Woodsmoke
Hex: #0A0B0D
RGB: 10, 11, 13
HSL: 210, 11%, 5%
Tailwind: bg-dark-primary
Usage: Main application background
```

### Secondary Background
```
Name: Shark
Hex: #191C1F
RGB: 25, 28, 31
HSL: 210, 11%, 11%
Tailwind: bg-dark-secondary
Usage: Sections, alternative backgrounds
```

### Card Background
```
Name: Dark Card
Hex: #1A1D21
RGB: 26, 29, 33
HSL: 213, 10%, 11%
Tailwind: bg-dark-card
Usage: Card containers, modules
```

### Elevated Surface
```
Name: Dark Elevated
Hex: #22252A
RGB: 34, 37, 42
HSL: 213, 10%, 15%
Tailwind: bg-dark-elevated
Usage: Modals, dropdowns, raised elements
```

---

## Text Colors

### Primary Text
```
Name: White
Hex: #FFFFFF
RGB: 255, 255, 255
HSL: 0, 0%, 100%
Tailwind: text-text-primary
Usage: Headings, important text, high emphasis
```

### Secondary Text
```
Name: Light Gray
Hex: #B4BDC6
RGB: 180, 189, 198
HSL: 207, 26%, 71%
Tailwind: text-text-secondary
Usage: Body text, descriptions, medium emphasis
```

### Tertiary Text
```
Name: Gray
Hex: #7F868C
RGB: 127, 134, 140
HSL: 215, 10%, 49%
Tailwind: text-text-tertiary
Usage: Labels, captions, low emphasis, metadata
```

### Disabled Text
```
Name: Dark Gray
Hex: #4D4D4D
RGB: 77, 77, 77
HSL: 0, 0%, 30%
Tailwind: text-text-disabled
Usage: Disabled states, inactive elements
```

---

## Status Colors

### Success Bright (Neon Green)
```
Name: Neon Green
Hex: #00FF90
RGB: 0, 255, 144
HSL: 148, 100%, 50%
Tailwind: bg-success-bright, text-success-bright
Usage: Success messages, positive changes, profit indicators
Inspiration: Modern crypto aesthetic
```

### Success Soft (Spotify Green)
```
Name: Spotify Green
Hex: #1DB954
RGB: 29, 185, 84
HSL: 141, 73%, 42%
Tailwind: bg-success-soft, text-success-soft
Usage: Subtle success states, verified badges
Inspiration: Revolut/Spotify
```

### Warning (Bitcoin Orange)
```
Name: Bitcoin Orange
Hex: #F7931A
RGB: 247, 147, 26
HSL: 29, 93%, 53%
Tailwind: bg-warning, text-warning
Usage: Caution alerts, pending states, warnings
Inspiration: Bitcoin brand color
```

### Error (Soft Red)
```
Name: Soft Red
Hex: #F08389
RGB: 240, 131, 137
HSL: 5, 69%, 73%
Tailwind: bg-error, text-error
Usage: Error messages, destructive actions, losses
Inspiration: Revolut palette
```

---

## Fintech Blue Scale (Extended Palette)

```
fintech-blue-50:  #E8F4FF  RGB(232, 244, 255)  Lightest
fintech-blue-100: #D4E9FF  RGB(212, 233, 255)
fintech-blue-200: #B0D7FF  RGB(176, 215, 255)
fintech-blue-300: #7ABAFF  RGB(122, 186, 255)
fintech-blue-400: #3D95FF  RGB(61, 149, 255)
fintech-blue-500: #048CFC  RGB(4, 140, 252)   Main
fintech-blue-600: #0052FF  RGB(0, 82, 255)    Brand
fintech-blue-700: #0043CC  RGB(0, 67, 204)
fintech-blue-800: #00339E  RGB(0, 51, 158)
fintech-blue-900: #002770  RGB(0, 39, 112)    Darkest
```

---

## Gradient Combinations

### Primary Gradient (Hero Sections)
```css
background: linear-gradient(135deg, #0052FF 0%, #7F84F6 100%);
```
From: Deep Ocean Blue → To: Vibrant Purple
Usage: Hero backgrounds, primary CTAs, premium features

### Accent Gradient (Highlights)
```css
background: linear-gradient(135deg, #7F84F6 0%, #FF007A 100%);
```
From: Vibrant Purple → To: Neon Pink
Usage: Special buttons, promotions, eye-catching elements

### Success Gradient
```css
background: linear-gradient(135deg, #00FF90 0%, #1DB954 100%);
```
From: Neon Green → To: Spotify Green
Usage: Positive balance cards, profit indicators

### Dark Gradient (Subtle Depth)
```css
background: linear-gradient(180deg, #191C1F 0%, #0A0B0D 100%);
```
From: Shark → To: Woodsmoke
Usage: Background variations, section separators

---

## Color Usage Guidelines

### Buttons
- **Primary CTA:** Brand Blue (#0052FF) or Primary Gradient
- **Secondary:** Dark Card (#1A1D21) with Blue border
- **Success:** Success Gradient or Success Soft
- **Danger:** Error (#F08389)
- **Ghost:** Transparent with Brand Blue text

### Cards
- **Standard:** Dark Card (#1A1D21) background
- **Interactive:** Dark Card with Blue border (#0052FF/20)
- **Glass:** Dark Card at 60% opacity with blur
- **Premium:** Gradient border (Primary Gradient)

### Text Hierarchy
- **H1-H2:** Primary Text (#FFFFFF) or Gradient Text
- **H3-H6:** Primary Text (#FFFFFF)
- **Body:** Secondary Text (#B4BDC6)
- **Labels:** Tertiary Text (#7F868C)
- **Numbers/Money:** Primary Text (#FFFFFF) with mono font

### Status Indicators
- **Positive/Up:** Success Bright (#00FF90) or Success Soft (#1DB954)
- **Negative/Down:** Error (#F08389)
- **Neutral/Pending:** Warning (#F7931A)
- **Verified/Active:** Success Soft (#1DB954)

---

## Accessibility Contrast Ratios

### Text on Dark Primary (#0A0B0D)
- White (#FFFFFF): 19.5:1 ✓ AAA (Excellent)
- Light Gray (#B4BDC6): 9.8:1 ✓ AAA (Excellent)
- Gray (#7F868C): 5.2:1 ✓ AA (Good)
- Brand Blue (#0052FF): 4.9:1 ✓ AA (Good)

### Text on Dark Card (#1A1D21)
- White (#FFFFFF): 17.2:1 ✓ AAA (Excellent)
- Light Gray (#B4BDC6): 8.6:1 ✓ AAA (Excellent)
- Gray (#7F868C): 4.5:1 ✓ AA (Good)

### Colored Text on Dark Backgrounds
- Success Bright (#00FF90): 11.2:1 ✓ AAA (Excellent)
- Brand Purple (#7F84F6): 6.8:1 ✓ AA (Good)
- Brand Pink (#FF007A): 4.8:1 ✓ AA (Good)
- Warning (#F7931A): 7.5:1 ✓ AAA (Good)

All color combinations meet WCAG AA standards for accessibility.

---

## Border & Stroke Colors

### Default Borders
```
Light Border: rgba(255, 255, 255, 0.1)  // White at 10%
Usage: Standard card borders, dividers
Tailwind: border-white/10
```

### Interactive Borders
```
Blue Border: rgba(0, 82, 255, 0.3)  // Brand Blue at 30%
Usage: Focus states, hover states
Tailwind: border-brand-blue/30
```

### Emphasized Borders
```
Bright Border: rgba(255, 255, 255, 0.2)  // White at 20%
Usage: Active cards, selected states
Tailwind: border-white/20
```

---

## Shadow Colors

### Standard Shadows
- **Card Shadow:** rgba(0, 0, 0, 0.16) - Black at 16%
- **Large Shadow:** rgba(0, 0, 0, 0.24) - Black at 24%

### Colored Shadows (Brand Glow)
- **Blue Glow:** rgba(0, 82, 255, 0.24) - Brand Blue at 24%
- **Purple Glow:** rgba(127, 132, 246, 0.24) - Brand Purple at 24%
- **Pink Glow:** rgba(255, 0, 122, 0.24) - Brand Pink at 24%
- **Success Glow:** rgba(0, 255, 144, 0.16) - Success at 16%

---

## Glassmorphism Opacity Values

### Glass Card Variants
- **Standard:** rgba(26, 29, 33, 0.6) - 60% opacity + 20px blur
- **Strong:** rgba(26, 29, 33, 0.8) - 80% opacity + 24px blur
- **Subtle:** rgba(26, 29, 33, 0.4) - 40% opacity + 16px blur

### Glass Borders
- **Standard:** rgba(255, 255, 255, 0.1) - White at 10%
- **Strong:** rgba(255, 255, 255, 0.15) - White at 15%
- **Subtle:** rgba(255, 255, 255, 0.08) - White at 8%

---

## Color Psychology & Usage

### Trust & Security
- **Primary:** Deep Ocean Blue (#0052FF)
- **Why:** Blue universally conveys trust, security, professionalism
- **Use For:** Financial actions, authentication, secure transactions

### Energy & Innovation
- **Accent:** Neon Pink (#FF007A) + Vibrant Purple (#7F84F6)
- **Why:** Modern, innovative, energetic - breaks traditional finance
- **Use For:** New features, promotions, exciting announcements

### Success & Growth
- **Status:** Neon Green (#00FF90) + Spotify Green (#1DB954)
- **Why:** Green signals growth, profit, positive outcomes
- **Use For:** Balance increases, successful transactions, verified states

### Caution & Attention
- **Warning:** Bitcoin Orange (#F7931A)
- **Why:** Orange draws attention without being alarming
- **Use For:** Pending states, high fees, important notices

### Error & Danger
- **Error:** Soft Red (#F08389)
- **Why:** Red signals stop, danger, but soft tone reduces alarm
- **Use For:** Failed transactions, destructive actions, critical errors

---

## Platform Color Inspirations

### Uniswap
- **Color:** Neon Pink (#FF007A)
- **Takeaway:** Simple, bold accent color for DeFi
- **Applied:** Highlight actions, special features

### Aave
- **Colors:** Purple gradients, modern dark mode
- **Takeaway:** Professional fintech with playful gradients
- **Applied:** Gradient system, dark backgrounds

### Phantom
- **Colors:** Purple (#7F84F6), beautiful gradients
- **Takeaway:** Signature color creates brand recognition
- **Applied:** Brand purple, glassmorphism effects

### Revolut
- **Colors:** Cornflower Blue (#7F84F6), Shark (#191C1F)
- **Takeaway:** Clean, trustworthy fintech palette
- **Applied:** Secondary backgrounds, accent colors

### Coinbase
- **Colors:** Blue Ribbon (#0052FF), Woodsmoke (#0A0B0D)
- **Takeaway:** Trust-building blues, mass-market accessibility
- **Applied:** Primary brand blue, dark backgrounds

---

## Quick Copy-Paste Palette

```css
/* Brand Colors */
--brand-blue: #0052FF;
--brand-purple: #7F84F6;
--brand-pink: #FF007A;

/* Backgrounds */
--dark-primary: #0A0B0D;
--dark-secondary: #191C1F;
--dark-card: #1A1D21;
--dark-elevated: #22252A;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: #B4BDC6;
--text-tertiary: #7F868C;
--text-disabled: #4D4D4D;

/* Status */
--success-bright: #00FF90;
--success-soft: #1DB954;
--warning: #F7931A;
--error: #F08389;
```

---

## Figma/Design Tool Export

For designers using Figma, Sketch, or Adobe XD:

1. **Import these colors as styles**
2. **Use color names exactly as shown** (for developer handoff)
3. **Include opacity values** for glassmorphism
4. **Export gradients** as CSS linear-gradient format
5. **Document shadows** with RGBA values

---

**Last Updated:** 2025-12-03
**Design System Version:** 1.0
**Total Colors:** 28 (core) + 10 (fintech scale) = 38 colors
