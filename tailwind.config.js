/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		// Font Families - Professional Fintech Typography
  		fontFamily: {
  			sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  			mono: ['JetBrains Mono', 'Consolas', 'monospace'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'2xl': '1rem',
  			'3xl': '1.5rem',
  		},
  		colors: {
  			// Shadcn/UI base colors
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
  			},

  			// BillHaven Brand Colors (Coinbase + Phantom inspired)
  			'brand': {
  				blue: '#0052FF',      // Coinbase trust blue
  				purple: '#7F84F6',    // Phantom purple
  				pink: '#FF007A',      // Uniswap pink
  				cyan: '#00D4FF',      // Modern accent
  			},

  			// Dark Mode Backgrounds
  			'dark': {
  				primary: '#0A0B0D',     // Deepest background
  				secondary: '#191C1F',   // Card background
  				card: '#1A1D21',        // Elevated cards
  				elevated: '#22252A',    // Modals, dropdowns
  				border: '#2E3338',      // Subtle borders
  			},

  			// Status Colors (Crypto aesthetic)
  			'success': {
  				DEFAULT: '#00FF90',     // Neon green
  				soft: '#1DB954',        // Spotify green
  				muted: '#10B981',       // Tailwind emerald
  			},
  			'warning': {
  				DEFAULT: '#F7931A',     // Bitcoin orange
  				soft: '#F59E0B',        // Amber
  			},
  			'error': {
  				DEFAULT: '#F08389',     // Soft red
  				bright: '#EF4444',      // Tailwind red
  			},

  			// Fintech Blue Scale
  			'fintech': {
  				50: '#E8F4FF',
  				100: '#D4E9FF',
  				200: '#B0D7FF',
  				300: '#7ABAFF',
  				400: '#3D95FF',
  				500: '#048CFC',
  				600: '#0052FF',    // Brand primary
  				700: '#0043CC',
  				800: '#00339E',
  				900: '#002770',
  			},
  		},

  		// Background Images & Gradients
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'hero-gradient': 'linear-gradient(135deg, #0052FF 0%, #7F84F6 100%)',
  			'accent-gradient': 'linear-gradient(135deg, #7F84F6 0%, #FF007A 100%)',
  			'success-gradient': 'linear-gradient(135deg, #00FF90 0%, #1DB954 100%)',
  			'dark-gradient': 'linear-gradient(180deg, #191C1F 0%, #0A0B0D 100%)',
  			'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(238, 87%, 73%, 0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 50%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(240, 100%, 50%, 0.2) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(280, 70%, 50%, 0.2) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(160, 100%, 50%, 0.2) 0px, transparent 50%)',
  		},

  		// Box Shadows (Glassmorphism + Glows)
  		boxShadow: {
  			'glow-sm': '0 0 10px rgba(99, 102, 241, 0.3)',
  			'glow-md': '0 0 20px rgba(99, 102, 241, 0.4)',
  			'glow-lg': '0 0 30px rgba(99, 102, 241, 0.5)',
  			'glow-xl': '0 0 50px rgba(99, 102, 241, 0.6)',
  			'glow-success': '0 0 20px rgba(0, 255, 144, 0.4)',
  			'glow-warning': '0 0 20px rgba(247, 147, 26, 0.4)',
  			'glow-error': '0 0 20px rgba(240, 131, 137, 0.4)',
  			'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
  			'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  			'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
  		},

  		// Backdrop Blur for Glassmorphism
  		backdropBlur: {
  			xs: '2px',
  			sm: '4px',
  			md: '12px',
  			lg: '24px',
  			xl: '40px',
  			'2xl': '64px',
  		},

  		// Animation Keyframes
  		keyframes: {
  			'shimmer': {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' },
  			},
  			'pulse-glow': {
  				'0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' },
  				'50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' },
  			},
  			'gradient-shift': {
  				'0%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  				'100%': { backgroundPosition: '0% 50%' },
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'scale-in': {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  			'slide-up': {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			'bounce-soft': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-5px)' },
  			},
  		},

  		// Animation Utilities
  		animation: {
  			'shimmer': 'shimmer 2s infinite',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'gradient-shift': 'gradient-shift 3s ease infinite',
  			'fade-in': 'fade-in 0.5s ease-out',
  			'scale-in': 'scale-in 0.3s ease-out',
  			'slide-up': 'slide-up 0.5s ease-out',
  			'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
  		},

  		// Transition Timing Functions
  		transitionTimingFunction: {
  			'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
