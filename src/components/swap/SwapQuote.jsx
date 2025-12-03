/**
 * SwapQuote Component - Display swap quote details
 * Shows fees breakdown: Platform fee (0.80%) + Network fee + Bridge fee
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getSwapQuote, formatQuoteForDisplay, LIFI_CONFIG } from '@/services/lifiService';

/**
 * Fee breakdown display component
 */
function FeeBreakdown({ quote, showDetails, setShowDetails }) {
  if (!quote) return null;

  const totalFee = (
    parseFloat(quote.platformFee || 0) +
    parseFloat(quote.gasCost || 0) +
    parseFloat(quote.bridgeFee || 0)
  ).toFixed(2);

  return (
    <div className="space-y-2">
      {/* Total Fee Summary */}
      <div
        className="flex items-center justify-between p-3 bg-dark-secondary rounded-lg cursor-pointer hover:bg-dark-secondary/80 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="text-gray-300 font-medium">Total Fees</span>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">${totalFee}</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Fee Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {/* Platform Fee */}
            <div className="flex items-center justify-between px-3 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-purple" />
                <span className="text-gray-300 text-sm">Platform Fee ({quote.platformFeePercent}%)</span>
              </div>
              <span className="text-white text-sm">${quote.platformFee}</span>
            </div>

            {/* Network/Gas Fee */}
            <div className="flex items-center justify-between px-3 py-2 bg-dark-secondary/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-400 text-sm">Network Gas ({quote.gasCostToken})</span>
              </div>
              <span className="text-gray-300 text-sm">${quote.gasCost}</span>
            </div>

            {/* Bridge Fee (if cross-chain) */}
            {parseFloat(quote.bridgeFee) > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-dark-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-gray-400 text-sm">Bridge Fee</span>
                </div>
                <span className="text-gray-300 text-sm">${quote.bridgeFee}</span>
              </div>
            )}

            {/* Slippage */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-gray-500 text-xs">Max Slippage</span>
              <span className="text-gray-400 text-xs">{(quote.slippage * 100).toFixed(1)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main SwapQuote Component
 */
export default function SwapQuote({
  fromChainId,
  toChainId,
  fromToken,
  toToken,
  fromAmount,
  fromAddress,
  onQuoteReady,
  onExecute,
  className = ''
}) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  // Fetch quote when params change
  useEffect(() => {
    if (fromChainId && toChainId && fromToken && toToken && fromAmount && fromAddress) {
      fetchQuote();
    }
  }, [fromChainId, toChainId, fromToken, toToken, fromAmount, fromAddress]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const rawQuote = await getSwapQuote({
        fromChainId,
        toChainId,
        fromToken,
        toToken,
        fromAmount,
        fromAddress
      });

      const formattedQuote = formatQuoteForDisplay(rawQuote);
      setQuote(formattedQuote);

      if (onQuoteReady) {
        onQuoteReady(formattedQuote);
      }
    } catch (err) {
      setError(err.message || 'Failed to get swap quote');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className={`bg-dark-card border-dark-border ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
            <p className="text-gray-400">Finding best route...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={`bg-dark-card border-red-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Quote Error</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
          <Button
            onClick={fetchQuote}
            variant="outline"
            className="mt-4 w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No quote yet
  if (!quote) {
    return (
      <Card className={`bg-dark-card border-dark-border ${className}`}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p>Enter swap details to get a quote</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quote display
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`bg-dark-card border-dark-border overflow-hidden ${className}`}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 p-4 border-b border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-muted" />
                <span className="text-white font-medium">Best Route Found</span>
              </div>
              <button
                onClick={fetchQuote}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                title="Refresh quote"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Swap Summary */}
            <div className="flex items-center justify-between p-4 bg-dark-secondary rounded-xl">
              {/* From */}
              <div className="text-center">
                {quote.fromToken?.logoURI && (
                  <img
                    src={quote.fromToken.logoURI}
                    alt={quote.fromToken.symbol}
                    className="w-10 h-10 rounded-full mx-auto mb-2"
                  />
                )}
                <p className="text-white font-semibold">
                  {parseFloat(quote.fromAmount / Math.pow(10, quote.fromToken?.decimals || 18)).toFixed(6)}
                </p>
                <p className="text-gray-400 text-sm">{quote.fromToken?.symbol}</p>
                <p className="text-gray-500 text-xs">${quote.fromAmountUSD}</p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-6 h-6 text-brand-purple" />
                <span className="text-xs text-gray-500">via {quote.tool}</span>
              </div>

              {/* To */}
              <div className="text-center">
                {quote.toToken?.logoURI && (
                  <img
                    src={quote.toToken.logoURI}
                    alt={quote.toToken.symbol}
                    className="w-10 h-10 rounded-full mx-auto mb-2"
                  />
                )}
                <p className="text-white font-semibold">
                  {parseFloat(quote.toAmount / Math.pow(10, quote.toToken?.decimals || 18)).toFixed(6)}
                </p>
                <p className="text-gray-400 text-sm">{quote.toToken?.symbol}</p>
                <p className="text-success-muted text-xs">${quote.toAmountUSD}</p>
              </div>
            </div>

            {/* Execution Time */}
            {quote.executionDuration && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Estimated Time</span>
                </div>
                <span className="text-white">
                  {quote.executionDuration < 60
                    ? `~${quote.executionDuration}s`
                    : `~${Math.ceil(quote.executionDuration / 60)} min`}
                </span>
              </div>
            )}

            {/* Fee Breakdown */}
            <FeeBreakdown
              quote={quote}
              showDetails={showFeeDetails}
              setShowDetails={setShowFeeDetails}
            />

            {/* Execute Button */}
            {onExecute && (
              <Button
                onClick={() => onExecute(quote)}
                className="w-full bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white py-6"
              >
                <Zap className="w-5 h-5 mr-2" />
                Execute Swap
              </Button>
            )}

            {/* Powered By */}
            <div className="text-center">
              <span className="text-xs text-gray-500">
                Powered by{' '}
                <a
                  href="https://li.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-purple hover:underline"
                >
                  LI.FI
                </a>
                {' '}• {LIFI_CONFIG.platformFeePercent}% BillHaven fee
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Mini quote display for inline use
 */
export function SwapQuoteMini({ fromToken, toToken, rate, fee }) {
  return (
    <div className="flex items-center justify-between p-3 bg-dark-secondary rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Rate:</span>
        <span className="text-white">
          1 {fromToken} = {rate} {toToken}
        </span>
      </div>
      <div className="text-gray-400">
        Fee: <span className="text-brand-purple">{fee}%</span>
      </div>
    </div>
  );
}
