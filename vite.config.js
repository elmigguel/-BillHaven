import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }

          // UI libraries - Radix
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor';
          }

          // Lucide icons
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }

          // Framer Motion - separate chunk for animations
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }

          // Blockchain - EVM (ethers + viem)
          if (id.includes('node_modules/viem') ||
              id.includes('node_modules/ethers')) {
            return 'evm-vendor';
          }

          // Blockchain - Solana (split into smaller chunks)
          if (id.includes('node_modules/@solana/web3.js')) {
            return 'solana-core';
          }
          if (id.includes('node_modules/@solana/wallet-adapter')) {
            return 'solana-wallet';
          }
          if (id.includes('node_modules/@solana/spl-token')) {
            return 'solana-token';
          }

          // Blockchain - TON (lazy load - 789KB chunk)
          // Split TON into multiple smaller chunks
          if (id.includes('node_modules/@tonconnect/ui-react')) {
            return 'ton-ui';
          }
          if (id.includes('node_modules/@ton/ton')) {
            return 'ton-sdk';
          }
          if (id.includes('node_modules/@ton/core') ||
              id.includes('node_modules/@ton/crypto')) {
            return 'ton-core';
          }

          // Bitcoin
          if (id.includes('node_modules/bitcoinjs-lib') ||
              id.includes('node_modules/bip39') ||
              id.includes('node_modules/ecpair')) {
            return 'bitcoin-vendor';
          }

          // Stripe payments
          if (id.includes('node_modules/@stripe')) {
            return 'stripe-vendor';
          }

          // Data fetching
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor';
          }

          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }

          // WalletConnect
          if (id.includes('node_modules/@walletconnect') ||
              id.includes('node_modules/@reown')) {
            return 'wallet-vendor';
          }

          // TronWeb
          if (id.includes('node_modules/tronweb')) {
            return 'tron-vendor';
          }

          // Sentry
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor';
          }

          // Anchor (Solana)
          if (id.includes('node_modules/@coral-xyz/anchor')) {
            return 'anchor-vendor';
          }
        }
      }
    },
    // Reduce chunk size warning limit to catch large bundles
    chunkSizeWarningLimit: 600,
    // Enable source maps for production debugging (can disable for smaller builds)
    sourcemap: process.env.NODE_ENV !== 'production',
    // Minify for production (esbuild is faster and built-in)
    minify: 'esbuild',
    // Target modern browsers for smaller bundle size
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'viem'
    ],
    // Exclude large blockchain libs from optimization (load on-demand)
    exclude: [
      '@ton/ton',
      '@tonconnect/ui-react',
      'tronweb'
    ]
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: false
  },
  // Dev server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true
  }
})
