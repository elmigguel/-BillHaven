# BillHaven Design System
## World-Class Crypto Platform Visual Identity

**Version:** 1.0
**Last Updated:** 2025-12-03
**Inspired By:** Uniswap, Aave, Phantom, Revolut, Coinbase

---

## Executive Summary

This design system combines the best visual elements from the world's leading crypto and fintech platforms to create a trustworthy, modern, and professional user experience for BillHaven. The system emphasizes:

- **Trust & Security** (Coinbase-inspired blues)
- **Modern Innovation** (Phantom-inspired gradients)
- **Professional Fintech Feel** (Revolut-inspired clean UX)
- **DeFi Excellence** (Uniswap-inspired simplicity)
- **Accessibility** (Aave-inspired clear hierarchy)

---

## 1. Color Palette

### Primary Colors

#### Deep Ocean Blue (Primary Brand Color)
- **Hex:** `#0052FF`
- **RGB:** `0, 82, 255`
- **HSL:** `221, 100%, 50%`
- **Usage:** Primary actions, links, brand elements
- **Inspiration:** Coinbase's trust-building blue

#### Vibrant Purple (Accent)
- **Hex:** `#7F84F6`
- **RGB:** `127, 132, 246`
- **HSL:** `238, 87%, 73%`
- **Usage:** Secondary CTAs, highlights, energy
- **Inspiration:** Phantom's signature purple + Revolut's cornflower blue

#### Neon Pink (Highlight)
- **Hex:** `#FF007A`
- **RGB:** `255, 0, 122`
- **HSL:** `331, 100%, 50%`
- **Usage:** Special promotions, urgent actions, innovation markers
- **Inspiration:** Uniswap's energetic pink

### Dark Mode Colors (Primary Theme)

#### Background Layers
- **Primary Background:** `#0A0B0D` (Woodsmoke - Coinbase)
- **Secondary Background:** `#191C1F` (Shark - Revolut)
- **Card Background:** `#1A1D21` (Slightly lighter for depth)
- **Elevated Surface:** `#22252A` (For modals, dropdowns)

#### Text Colors
- **Primary Text:** `#FFFFFF` (Pure white for headings)
- **Secondary Text:** `#B4BDC6` (Muted gray for body)
- **Tertiary Text:** `#7F868C` (Subtle text, labels)
- **Disabled Text:** `#4D4D4D` (Low contrast for inactive states)

### Success, Warning, Error Colors

#### Success Green
- **Hex:** `#00FF90` (Neon green - modern crypto aesthetic)
- **RGB:** `0, 255, 144`
- **Usage:** Successful transactions, positive gains, confirmations
- **Alternative:** `#1DB954` (Spotify/Revolut green for subtler success)

#### Warning Amber
- **Hex:** `#F7931A` (Bitcoin orange)
- **RGB:** `247, 147, 26`
- **Usage:** Caution alerts, pending states

#### Error Red
- **Hex:** `#F08389` (Soft red from Revolut palette)
- **RGB:** `240, 131, 137`
- **Usage:** Errors, destructive actions, losses

### Gradient System

#### Primary Gradient (Hero Sections)
```css
background: linear-gradient(135deg, #0052FF 0%, #7F84F6 100%);
```
- **From:** Deep Ocean Blue
- **To:** Vibrant Purple
- **Usage:** Hero backgrounds, primary cards, premium features

#### Accent Gradient (Highlights)
```css
background: linear-gradient(135deg, #7F84F6 0%, #FF007A 100%);
```
- **From:** Vibrant Purple
- **To:** Neon Pink
- **Usage:** CTAs, special buttons, promotions

#### Success Gradient
```css
background: linear-gradient(135deg, #00FF90 0%, #1DB954 100%);
```
- **Usage:** Positive balance cards, profit indicators

#### Dark Gradient (Subtle Depth)
```css
background: linear-gradient(180deg, #191C1F 0%, #0A0B0D 100%);
```
- **Usage:** Background variations, section separators

### Tailwind Color Configuration

```javascript
colors: {
  // Brand Colors
  'brand-blue': '#0052FF',
  'brand-purple': '#7F84F6',
  'brand-pink': '#FF007A',

  // Dark Mode Backgrounds
  'dark-primary': '#0A0B0D',
  'dark-secondary': '#191C1F',
  'dark-card': '#1A1D21',
  'dark-elevated': '#22252A',

  // Text Colors
  'text-primary': '#FFFFFF',
  'text-secondary': '#B4BDC6',
  'text-tertiary': '#7F868C',
  'text-disabled': '#4D4D4D',

  // Status Colors
  'success-bright': '#00FF90',
  'success-soft': '#1DB954',
  'warning': '#F7931A',
  'error': '#F08389',

  // Fintech Blues (Additional palette)
  'fintech-blue': {
    50: '#E8F4FF',
    100: '#D4E9FF',
    200: '#B0D7FF',
    300: '#7ABAFF',
    400: '#3D95FF',
    500: '#048CFC', // Main
    600: '#0052FF', // Brand
    700: '#0043CC',
    800: '#00339E',
    900: '#002770',
  },
}
```

---

## 2. Typography System

### Font Families

#### Primary: Inter (Google Fonts)
- **Usage:** All UI elements, body text, headings
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Why Inter:** Designed specifically for screens, excellent readability, variable font support
- **Source:** `https://fonts.google.com/specimen/Inter`

#### Monospace: JetBrains Mono (for numbers/addresses)
- **Usage:** Wallet addresses, transaction hashes, numerical data
- **Weights:** 400 (Regular), 500 (Medium), 700 (Bold)
- **Why:** Clear distinction between characters (0/O, 1/l/I), professional developer feel
- **Source:** `https://fonts.google.com/specimen/JetBrains+Mono`

### Font Scale (Responsive)

#### Desktop (16px base)
```css
/* Display */
.text-display-2xl { font-size: 72px; line-height: 90px; } /* Hero headlines */
.text-display-xl  { font-size: 60px; line-height: 72px; }
.text-display-lg  { font-size: 48px; line-height: 60px; }

/* Headings */
.text-h1 { font-size: 36px; line-height: 44px; font-weight: 700; }
.text-h2 { font-size: 30px; line-height: 38px; font-weight: 700; }
.text-h3 { font-size: 24px; line-height: 32px; font-weight: 600; }
.text-h4 { font-size: 20px; line-height: 28px; font-weight: 600; }
.text-h5 { font-size: 18px; line-height: 26px; font-weight: 600; }
.text-h6 { font-size: 16px; line-height: 24px; font-weight: 600; }

/* Body */
.text-xl  { font-size: 20px; line-height: 30px; } /* Large body */
.text-lg  { font-size: 18px; line-height: 28px; } /* Lead paragraphs */
.text-base { font-size: 16px; line-height: 24px; } /* Default body */
.text-sm  { font-size: 14px; line-height: 20px; } /* Small text */
.text-xs  { font-size: 12px; line-height: 16px; } /* Captions */
.text-2xs { font-size: 10px; line-height: 14px; } /* Tiny labels */
```

#### Mobile (14px base)
```css
/* Headings */
.text-h1 { font-size: 32px; line-height: 40px; }
.text-h2 { font-size: 28px; line-height: 36px; }
.text-h3 { font-size: 22px; line-height: 30px; }
.text-h4 { font-size: 18px; line-height: 26px; }

/* Body */
.text-base { font-size: 14px; line-height: 22px; }
.text-sm  { font-size: 13px; line-height: 18px; }
```

### Tailwind Font Configuration

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Monaco', 'Courier New', 'monospace'],
},
fontSize: {
  '2xs': ['10px', '14px'],
  'xs': ['12px', '16px'],
  'sm': ['14px', '20px'],
  'base': ['16px', '24px'],
  'lg': ['18px', '28px'],
  'xl': ['20px', '30px'],
  '2xl': ['24px', '32px'],
  '3xl': ['30px', '38px'],
  '4xl': ['36px', '44px'],
  '5xl': ['48px', '60px'],
  '6xl': ['60px', '72px'],
  '7xl': ['72px', '90px'],
},
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}
```

---

## 3. Spacing System

### Tailwind Spacing Scale (8px base)

Use Tailwind's default spacing scale based on 4px increments:

```javascript
spacing: {
  px: '1px',
  0: '0',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
}
```

### Component Spacing Guidelines

#### Buttons
- **Padding:** `px-6 py-3` (24px horizontal, 12px vertical)
- **Large:** `px-8 py-4` (32px horizontal, 16px vertical)
- **Small:** `px-4 py-2` (16px horizontal, 8px vertical)

#### Cards
- **Padding:** `p-6` (24px all sides)
- **Large Cards:** `p-8` (32px all sides)
- **Compact Cards:** `p-4` (16px all sides)

#### Sections
- **Vertical Spacing:** `py-16` desktop, `py-12` mobile (64px/48px)
- **Between Elements:** `space-y-8` (32px) for major sections
- **Between Related Items:** `space-y-4` (16px)

#### Container
- **Max Width:** `max-w-7xl` (1280px)
- **Padding:** `px-6` mobile, `px-8` desktop

---

## 4. Visual Effects

### Border Radius

```javascript
borderRadius: {
  none: '0',
  sm: '4px',
  DEFAULT: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  full: '9999px',
}
```

#### Usage Guidelines
- **Buttons:** `rounded-lg` (16px)
- **Cards:** `rounded-xl` (20px) or `rounded-2xl` (24px)
- **Input Fields:** `rounded-lg` (16px)
- **Modals:** `rounded-2xl` (24px)
- **Pills/Tags:** `rounded-full`
- **Small Elements:** `rounded-md` (12px)

### Shadow System

```javascript
boxShadow: {
  // Subtle shadows for cards
  'card-sm': '0 2px 8px rgba(0, 0, 0, 0.12)',
  'card': '0 4px 16px rgba(0, 0, 0, 0.16)',
  'card-lg': '0 8px 24px rgba(0, 0, 0, 0.20)',

  // Colored shadows for brand elements
  'brand-blue': '0 8px 32px rgba(0, 82, 255, 0.24)',
  'brand-purple': '0 8px 32px rgba(127, 132, 246, 0.24)',
  'brand-pink': '0 8px 32px rgba(255, 0, 122, 0.24)',

  // Success/Error shadows
  'success': '0 4px 16px rgba(0, 255, 144, 0.16)',
  'error': '0 4px 16px rgba(240, 131, 137, 0.16)',

  // Glow effects
  'glow-sm': '0 0 16px rgba(0, 82, 255, 0.4)',
  'glow': '0 0 24px rgba(0, 82, 255, 0.5)',
  'glow-lg': '0 0 32px rgba(0, 82, 255, 0.6)',

  // Inner shadows
  'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
}
```

### Glassmorphism Effects

Perfect for modern crypto UI (inspired by Phantom, Aave):

```css
/* Glass Card - Standard */
.glass-card {
  background: rgba(26, 29, 33, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
}

/* Glass Card - Strong */
.glass-card-strong {
  background: rgba(26, 29, 33, 0.8);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Glass Card - Subtle */
.glass-card-subtle {
  background: rgba(26, 29, 33, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Glass with gradient border */
.glass-gradient-border {
  background: rgba(26, 29, 33, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid transparent;
  background-clip: padding-box;
  position: relative;
}

.glass-gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(0, 82, 255, 0.5), rgba(127, 132, 246, 0.5));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

#### Tailwind Glassmorphism Classes

```javascript
// Add to tailwind.config.js
backdropBlur: {
  xs: '4px',
  sm: '8px',
  DEFAULT: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
}
```

Usage:
```html
<div class="bg-dark-card/60 backdrop-blur-xl border border-white/10 rounded-2xl">
  <!-- Glass morphism card content -->
</div>
```

### Gradient Text

```css
/* Gradient text utility */
.gradient-text {
  background: linear-gradient(135deg, #0052FF 0%, #7F84F6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-text-accent {
  background: linear-gradient(135deg, #7F84F6 0%, #FF007A 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 5. Complete Tailwind Configuration

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // COLORS
      colors: {
        // Brand Colors
        'brand-blue': '#0052FF',
        'brand-purple': '#7F84F6',
        'brand-pink': '#FF007A',

        // Dark Mode Backgrounds
        'dark-primary': '#0A0B0D',
        'dark-secondary': '#191C1F',
        'dark-card': '#1A1D21',
        'dark-elevated': '#22252A',

        // Text Colors
        'text-primary': '#FFFFFF',
        'text-secondary': '#B4BDC6',
        'text-tertiary': '#7F868C',
        'text-disabled': '#4D4D4D',

        // Status Colors
        'success-bright': '#00FF90',
        'success-soft': '#1DB954',
        'warning': '#F7931A',
        'error': '#F08389',

        // Fintech Blues
        'fintech-blue': {
          50: '#E8F4FF',
          100: '#D4E9FF',
          200: '#B0D7FF',
          300: '#7ABAFF',
          400: '#3D95FF',
          500: '#048CFC',
          600: '#0052FF',
          700: '#0043CC',
          800: '#00339E',
          900: '#002770',
        },

        // Shadcn/UI compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },

      // TYPOGRAPHY
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '60px' }],
        '6xl': ['60px', { lineHeight: '72px' }],
        '7xl': ['72px', { lineHeight: '90px' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      // BORDER RADIUS
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },

      // SHADOWS
      boxShadow: {
        // Card shadows
        'card-sm': '0 2px 8px rgba(0, 0, 0, 0.12)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.16)',
        'card-lg': '0 8px 24px rgba(0, 0, 0, 0.20)',

        // Colored shadows
        'brand-blue': '0 8px 32px rgba(0, 82, 255, 0.24)',
        'brand-purple': '0 8px 32px rgba(127, 132, 246, 0.24)',
        'brand-pink': '0 8px 32px rgba(255, 0, 122, 0.24)',

        // Status shadows
        'success': '0 4px 16px rgba(0, 255, 144, 0.16)',
        'error': '0 4px 16px rgba(240, 131, 137, 0.16)',

        // Glow effects
        'glow-sm': '0 0 16px rgba(0, 82, 255, 0.4)',
        'glow': '0 0 24px rgba(0, 82, 255, 0.5)',
        'glow-lg': '0 0 32px rgba(0, 82, 255, 0.6)',

        // Inner shadow
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
      },

      // BACKDROP BLUR
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },

      // BACKGROUND GRADIENTS
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0052FF 0%, #7F84F6 100%)',
        'gradient-accent': 'linear-gradient(135deg, #7F84F6 0%, #FF007A 100%)',
        'gradient-success': 'linear-gradient(135deg, #00FF90 0%, #1DB954 100%)',
        'gradient-dark': 'linear-gradient(180deg, #191C1F 0%, #0A0B0D 100%)',
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },

      // ANIMATIONS
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 16px rgba(0, 82, 255, 0.4)' },
          '100%': { boxShadow: '0 0 32px rgba(0, 82, 255, 0.8)' },
        },
      },

      // CONTAINER
      container: {
        center: true,
        padding: {
          DEFAULT: '1.5rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1440px',
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
```

---

## 6. CSS Custom Properties

Add these to your main CSS file (e.g., `index.css` or `App.css`):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Dark Theme Variables */
    --background: 210 11% 5%; /* #0A0B0D */
    --foreground: 0 0% 100%; /* #FFFFFF */

    --card: 213 10% 11%; /* #1A1D21 */
    --card-foreground: 0 0% 100%;

    --popover: 213 10% 11%;
    --popover-foreground: 0 0% 100%;

    --primary: 221 100% 50%; /* #0052FF */
    --primary-foreground: 0 0% 100%;

    --secondary: 238 87% 73%; /* #7F84F6 */
    --secondary-foreground: 0 0% 100%;

    --muted: 215 10% 49%; /* #7F868C */
    --muted-foreground: 207 26% 71%; /* #B4BDC6 */

    --accent: 331 100% 50%; /* #FF007A */
    --accent-foreground: 0 0% 100%;

    --destructive: 5 69% 73%; /* #F08389 */
    --destructive-foreground: 0 0% 100%;

    --border: 213 10% 15%; /* Slightly lighter than card */
    --input: 213 10% 15%;
    --ring: 221 100% 50%;

    --radius: 16px; /* Default border radius */

    --chart-1: 221 100% 50%; /* Blue */
    --chart-2: 238 87% 73%; /* Purple */
    --chart-3: 331 100% 50%; /* Pink */
    --chart-4: 148 100% 50%; /* Green */
    --chart-5: 29 93% 53%; /* Orange */
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-dark-primary text-text-primary;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-semibold;
  }
}

@layer utilities {
  /* Gradient Text Utilities */
  .gradient-text-primary {
    background: linear-gradient(135deg, #0052FF 0%, #7F84F6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gradient-text-accent {
    background: linear-gradient(135deg, #7F84F6 0%, #FF007A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Glassmorphism Utilities */
  .glass-card {
    background: rgba(26, 29, 33, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
  }

  .glass-card-strong {
    background: rgba(26, 29, 33, 0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .glass-card-subtle {
    background: rgba(26, 29, 33, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* Smooth transitions */
  .transition-smooth {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Hover glow effect */
  .hover-glow {
    transition: box-shadow 0.3s ease;
  }

  .hover-glow:hover {
    box-shadow: 0 0 24px rgba(0, 82, 255, 0.5);
  }
}
```

---

## 7. Component Examples

### Primary Button

```jsx
<button className="
  px-6 py-3
  bg-gradient-primary
  text-white font-semibold
  rounded-lg
  shadow-brand-blue
  hover:shadow-glow
  transition-smooth
  hover:scale-105
">
  Connect Wallet
</button>
```

### Glass Card

```jsx
<div className="
  glass-card
  rounded-2xl
  p-6
  hover:border-white/20
  transition-smooth
">
  <h3 className="text-xl font-semibold mb-2">Total Balance</h3>
  <p className="text-4xl font-bold gradient-text-primary">$12,450.00</p>
</div>
```

### Success Alert

```jsx
<div className="
  bg-success-soft/10
  border border-success-soft/30
  rounded-lg
  p-4
  flex items-center gap-3
">
  <CheckIcon className="w-5 h-5 text-success-bright" />
  <p className="text-sm text-text-secondary">
    Transaction completed successfully
  </p>
</div>
```

### Gradient Heading

```jsx
<h1 className="
  text-5xl
  font-bold
  gradient-text-primary
  mb-4
">
  Welcome to BillHaven
</h1>
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
  transition-smooth
">
  <p className="text-sm text-text-tertiary mb-2">Total Value Locked</p>
  <p className="text-3xl font-bold text-text-primary font-mono">
    $2.4M
  </p>
  <p className="text-sm text-success-bright mt-2">↑ 12.5%</p>
</div>
```

---

## 8. Accessibility Guidelines

### Color Contrast
- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Primary text on dark background: White (#FFFFFF) provides excellent contrast
- Interactive elements use bright colors (#0052FF, #00FF90) for visibility

### Focus States
```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 focus:ring-offset-dark-primary;
}
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use `tabindex` appropriately
- Visible focus indicators on all focusable elements

### Screen Readers
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Provide `aria-label` for icon-only buttons
- Use `alt` text for images

---

## 9. Responsive Design Breakpoints

```javascript
screens: {
  'xs': '475px',
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1440px',
}
```

### Mobile-First Approach
- Design for mobile first, then scale up
- Use `sm:`, `md:`, `lg:` prefixes for responsive utilities
- Ensure touch targets are at least 44x44px on mobile

---

## 10. Animation Guidelines

### Performance
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, or layout properties
- Use `will-change` sparingly

### Duration
- **Fast:** 150ms (hover states, small transitions)
- **Medium:** 300ms (most UI transitions)
- **Slow:** 500ms (page transitions, complex animations)

### Easing
- **Default:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Entrance:** `cubic-bezier(0, 0, 0.2, 1)` (ease-out)
- **Exit:** `cubic-bezier(0.4, 0, 1, 1)` (ease-in)

---

## Research Sources

This design system was built by analyzing:

1. **Uniswap** - [Brand Colors](https://brandpalettes.com/uniswap-colors/) | [Mobbin](https://mobbin.com/colors/brand/uniswap-labs)
2. **Aave** - [2024 Rebrand Analysis](https://medium.com/@mariesiegrist/aaves-2024-rebrand-from-defi-dark-mode-to-a-playful-minimalism-7d6ad5173ac8)
3. **Phantom** - [Brand Identity Launch](https://phantom.com/learn/blog/introducing-phantom-s-new-brand-identity) | [Press Kit](https://brandfetch.com/phantom.app)
4. **Revolut** - [Brand Evolution](https://www.arushidesign.com/post/revolut-brand-evolution) | [Colors](https://mobbin.com/colors/brand/revolut)
5. **Coinbase** - [Open Source Design System](https://cds.coinbase.com/) | [Colors](https://mobbin.com/colors/brand/coinbase)

**Additional Resources:**
- [Fintech UI Colors](https://octet.design/colors/user-interfaces/fintech-ui-design/)
- [Dark Mode Crypto Palettes](https://colorswall.com/palette/135062)
- [Glassmorphism with Tailwind](https://gradienty.codes/tailwind-glassmorphism-generator)
- [Typography for Fintech](https://medium.com/@tamannasamantaray00/typography-selection-for-fintech-product-design-system-series-62ba0ba7c4bf)
- [Inter Font Specimen](https://fonts.google.com/specimen/Inter)

---

## Next Steps

1. **Install Fonts:** Add Inter and JetBrains Mono to your project
2. **Update Tailwind Config:** Replace current config with the provided one
3. **Add CSS Custom Properties:** Update your main CSS file
4. **Build Components:** Start implementing the design system in your components
5. **Test Accessibility:** Run accessibility audits with tools like axe or Lighthouse
6. **Iterate:** Gather feedback and refine based on user testing

---

**Version History:**
- v1.0 (2025-12-03): Initial design system based on top 5 crypto platforms

**Maintained by:** BillHaven Design Team
