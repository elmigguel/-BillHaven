// BillHaven - Tailwind Animation Configuration Snippet
// Copy this into your tailwind.config.js

// ADD TO: theme.extend.animation
animation: {
  // Existing (keep these)
  'spin': 'spin 1s linear infinite',
  'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

  // NEW: Financial & interaction animations
  'shimmer': 'shimmer 2s linear infinite',
  'breathe': 'breathe 2s ease-in-out infinite',
  'count-up': 'count-up 0.5s ease-out',
  'bounce-soft': 'bounce-soft 0.6s ease-out',
  'slide-in-right': 'slide-in-right 0.3s ease-out',
  'slide-in-left': 'slide-in-left 0.3s ease-out',
  'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
  'success-pop': 'success-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'ping-once': 'ping 0.8s ease-out',
},

// ADD TO: theme.extend.keyframes
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
  breathe: {
    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
    '50%': { opacity: '0.8', transform: 'scale(1.05)' },
  },
  'count-up': {
    '0%': { transform: 'translateY(20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  'bounce-soft': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  'slide-in-right': {
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  'slide-in-left': {
    '0%': { transform: 'translateX(-100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
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
  ping: {
    '0%': { transform: 'scale(1)', opacity: '1' },
    '75%, 100%': { transform: 'scale(1.5)', opacity: '0' },
  },
},

// EXAMPLE USAGE:
// <div className="animate-breathe">Pending transaction...</div>
// <div className="animate-shake">Error: Invalid input</div>
// <div className="animate-success-pop">✓ Payment complete!</div>
// <div className="animate-slide-in-right">Toast notification</div>
