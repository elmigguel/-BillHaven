#!/bin/bash

# BillHaven Animation System Installation Script
# Run this script to set up the complete animation system

set -e  # Exit on error

echo "============================================"
echo "BillHaven Animation System Installer"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Please run this script from the BillHaven root directory."
  exit 1
fi

# Step 1: Install Framer Motion
echo "Step 1/4: Installing Framer Motion..."
npm install framer-motion
echo "✓ Framer Motion installed"
echo ""

# Step 2: Update Tailwind Config
echo "Step 2/4: Updating Tailwind config..."
echo "⚠️  Manual step required:"
echo "   Open tailwind.config.js and add the custom animations"
echo "   See: docs/ANIMATION_QUICK_START.md - Step 2"
echo ""
read -p "Press Enter when you've updated tailwind.config.js..."

# Step 3: Create test component
echo "Step 3/4: Creating test component..."
mkdir -p src/test

cat > src/test/AnimationTest.jsx << 'EOF'
import { motion } from 'framer-motion';
import { fadeIn, slideUp, buttonTap } from '@/config/animations';
import { CheckCircle2 } from 'lucide-react';

export default function AnimationTest() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Animation System Test</h1>

        {/* Test 1: Fade In */}
        <motion.div
          {...fadeIn}
          className="p-6 bg-purple-600 text-white rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-2">1. Fade In Animation</h2>
          <p>Using Framer Motion variants from config</p>
        </motion.div>

        {/* Test 2: Slide Up */}
        <motion.div
          {...slideUp}
          className="p-6 bg-green-600 text-white rounded-lg"
        >
          <h2 className="text-xl font-semibold mb-2">2. Slide Up Animation</h2>
          <p>Smooth entry with easeOut timing</p>
        </motion.div>

        {/* Test 3: CSS Animation */}
        <div className="p-6 bg-blue-600 text-white rounded-lg animate-breathe">
          <h2 className="text-xl font-semibold mb-2">3. CSS Breathe Animation</h2>
          <p>Tailwind-based animation (no JS)</p>
        </div>

        {/* Test 4: Hover Effects */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            className="px-6 py-4 bg-purple-600 text-white rounded-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Hover & Click Me
          </motion.button>

          <motion.div
            className="p-4 bg-gray-800 text-white rounded-lg text-center"
            whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
          >
            <h3 className="font-semibold">Card Hover Lift</h3>
          </motion.div>
        </div>

        {/* Test 5: Success Animation */}
        <motion.div
          className="p-6 bg-gray-800 text-white rounded-lg text-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.7 }}
            className="inline-block"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-xl font-semibold">5. Success Animation</h2>
          <p className="text-gray-400">Spring-based celebration</p>
        </motion.div>

        {/* Test 6: Shimmer Loading */}
        <div className="p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">6. Shimmer Loading</h2>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>

        {/* Success Message */}
        <div className="p-4 bg-green-950 border border-green-800 rounded-lg text-green-300">
          <p className="font-semibold">✓ All animations working correctly!</p>
          <p className="text-sm mt-1">Open DevTools → Performance to check 60fps</p>
        </div>
      </div>
    </div>
  );
}
EOF

echo "✓ Test component created: src/test/AnimationTest.jsx"
echo ""

# Step 4: Instructions
echo "Step 4/4: Next steps"
echo "============================================"
echo ""
echo "✓ Installation complete!"
echo ""
echo "Next steps:"
echo "  1. Add test route to App.jsx:"
echo "     import AnimationTest from './test/AnimationTest';"
echo "     <Route path=\"/animation-test\" element={<AnimationTest />} />"
echo ""
echo "  2. Start dev server:"
echo "     npm run dev"
echo ""
echo "  3. Visit: http://localhost:5173/animation-test"
echo ""
echo "  4. Check all 6 animations work correctly"
echo ""
echo "  5. Read the guides:"
echo "     - docs/ANIMATION_QUICK_START.md (30 min guide)"
echo "     - docs/ANIMATION_SYSTEM_GUIDE.md (complete reference)"
echo ""
echo "  6. Start implementing:"
echo "     - Begin with Quick Wins (buttons, hovers)"
echo "     - Add page transitions"
echo "     - Implement financial animations"
echo ""
echo "Need help? See docs/ANIMATION_QUICK_START.md"
echo "============================================"
