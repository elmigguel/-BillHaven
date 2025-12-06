/**
 * Premium Page - Subscription tiers and upgrade
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Wallet, Bitcoin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import PremiumTiers from '@/components/premium/PremiumTiers'
import { createSubscription, PREMIUM_TIERS } from '@/services/premiumService'

export default function Premium() {
  const { user } = useAuth()
  const { walletAddress, isConnected } = useWallet()
  const [selectedTier, setSelectedTier] = useState(null)
  const [isYearly, setIsYearly] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSelectTier = (tier) => {
    if (tier.id === 'free') return
    setSelectedTier(tier)
  }

  const handleUpgrade = async (paymentMethod) => {
    if (!user?.id || !selectedTier) return

    setProcessing(true)

    try {
      // For now, create subscription directly (in production, integrate payment)
      await createSubscription(
        user.id,
        selectedTier.id,
        isYearly ? 12 : 1
      )

      setSuccess(true)
      setTimeout(() => {
        setSelectedTier(null)
        setSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Subscription failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-dark-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PremiumTiers onSelectTier={handleSelectTier} />
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {selectedTier && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTier(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {success ? (
                // Success State
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <CheckCircle className="w-16 h-16 text-success-muted mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Welcome to {selectedTier.name}!
                  </h3>
                  <p className="text-gray-400">
                    Your subscription is now active. Enjoy lower fees!
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl">{selectedTier.icon}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Upgrade to {selectedTier.name}
                      </h3>
                      <p className="text-gray-400">
                        {selectedTier.platformFee}% platform fee
                      </p>
                    </div>
                  </div>

                  {/* Billing Period */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setIsYearly(false)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                        !isYearly
                          ? 'bg-brand-purple text-white'
                          : 'bg-dark-elevated text-gray-400'
                      }`}
                    >
                      Monthly
                      <div className="text-xs opacity-70">
                        €{selectedTier.priceMonthly}/mo
                      </div>
                    </button>
                    <button
                      onClick={() => setIsYearly(true)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isYearly
                          ? 'bg-brand-purple text-white'
                          : 'bg-dark-elevated text-gray-400'
                      }`}
                    >
                      Yearly
                      <div className="text-xs opacity-70">
                        €{(selectedTier.priceYearly / 12).toFixed(0)}/mo
                      </div>
                    </button>
                  </div>

                  {/* Total */}
                  <div className="p-4 rounded-xl bg-dark-elevated mb-6">
                    <div className="flex justify-between text-gray-400 mb-2">
                      <span>{selectedTier.name} {isYearly ? 'Yearly' : 'Monthly'}</span>
                      <span>
                        €{isYearly ? selectedTier.priceYearly : selectedTier.priceMonthly}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-dark-border">
                      <span>Total</span>
                      <span>
                        €{isYearly ? selectedTier.priceYearly : selectedTier.priceMonthly}
                      </span>
                    </div>
                  </div>

                  {/* Payment Options */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleUpgrade('crypto')}
                      disabled={processing || !isConnected}
                      className="w-full bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90"
                    >
                      {processing ? (
                        <span className="animate-pulse">Processing...</span>
                      ) : (
                        <>
                          <Bitcoin className="w-5 h-5 mr-2" />
                          Pay with Crypto
                        </>
                      )}
                    </Button>

                    {!isConnected && (
                      <p className="text-center text-sm text-gray-500">
                        Connect your wallet to pay with crypto
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
