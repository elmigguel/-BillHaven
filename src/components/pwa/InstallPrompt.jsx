/**
 * PWA Install Prompt Component
 * Enhanced with iOS support, smart timing, and better UX
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Zap, Bell, Shield } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(iOS)

    // Listen for install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after delay
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        const lastShown = localStorage.getItem('pwa-prompt-last-shown')
        const daysSinceShown = lastShown
          ? (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24)
          : 999

        if (!dismissed && daysSinceShown > 3) {
          setShowPrompt(true)
          localStorage.setItem('pwa-prompt-last-shown', Date.now().toString())
        }
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Show iOS prompt after delay
    if (iOS && !standalone) {
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed')
        if (!dismissed) {
          setShowPrompt(true)
        }
      }, 10000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`PWA install ${outcome}`)
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed
  if (isStandalone) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-4 bg-gradient-to-r from-brand-blue to-brand-purple">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Install BillHaven</h3>
                  <p className="text-sm text-white/80">Get the full app experience</p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-green-500/20">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-gray-300">Faster access from home screen</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Bell className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-gray-300">Push notifications for payments</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="p-1.5 rounded-lg bg-purple-500/20">
                  <Shield className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-gray-300">Works offline with cached data</span>
              </div>
            </div>

            {/* Action */}
            <div className="p-4 pt-0">
              {isIOS ? (
                <div className="p-3 rounded-lg bg-dark-elevated text-sm text-gray-400">
                  <p className="mb-2">To install on iOS:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-500">
                    <li>Tap the Share button <span className="text-blue-400">(box with arrow)</span></li>
                    <li>Scroll down and tap <span className="font-medium text-white">"Add to Home Screen"</span></li>
                    <li>Tap <span className="font-medium text-white">"Add"</span></li>
                  </ol>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Download className="w-5 h-5" />
                  Install App
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              <button
                onClick={handleDismiss}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mini install button for header/footer
export function PWAInstallButton({ className = '' }) {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Hide if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setCanInstall(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setCanInstall(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (!canInstall) return null

  return (
    <button
      onClick={handleInstall}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 transition-colors ${className}`}
    >
      <Download className="w-4 h-4" />
      <span className="text-sm font-medium">Install</span>
    </button>
  )
}
