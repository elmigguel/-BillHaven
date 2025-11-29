/**
 * TonPaymentFlow - TON Network Payment Flow Component
 *
 * Handles TON-specific bill payments with TonConnect integration.
 * Supports: Native TON and USDT (Jetton) payments.
 *
 * Ultra-low fees: ~$0.025/transaction (4x cheaper than Polygon!)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, CheckCircle2, Copy, Upload, Clock, Wallet,
  AlertCircle, ExternalLink, Diamond, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useTonWalletContext } from '../../contexts/TonWalletContext';
import { storageApi } from '../../api/storageApi';
import {
  getTonBalance,
  getUSDTBalance,
  buildTonTransfer,
  buildUSDTTransfer,
  getJettonWalletAddress,
  getEstimatedFee,
  isValidTonAddress,
  formatTonAmount,
  formatUSDTAmount
} from '../../services/tonPayment';
import { getTonUSDT } from '../../config/tonNetworks';

/**
 * TON Payment Flow for Bill Payments
 *
 * Flow: Connect TON Wallet -> View Bill -> Pay with TON/USDT -> Confirm
 */
export default function TonPaymentFlow({
  bill,
  isOpen,
  onClose,
  onPaymentComplete,
  onSubmitProof,
}) {
  // TON Wallet Context
  const tonWallet = useTonWalletContext();
  const {
    walletAddress = '',
    isConnected = false,
    isConnecting = false,
    error: walletError = null,
    connectWallet = () => {},
    disconnect = () => {},
    sendTon = () => Promise.reject('Not connected'),
    sendUSDT = () => Promise.reject('Not connected'),
    formatAddress = (addr) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : '',
    getExplorerUrl = () => '#',
    network = 'mainnet',
    tonConnectUI = null
  } = tonWallet || {};

  // Component State
  const [step, setStep] = useState(1);
  const [selectedToken, setSelectedToken] = useState('TON'); // 'TON' or 'USDT'
  const [tonBalance, setTonBalance] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [proofFile, setProofFile] = useState(null);

  // Load balances when connected
  useEffect(() => {
    if (isConnected && walletAddress) {
      loadBalances();
    }
  }, [isConnected, walletAddress, network]);

  const loadBalances = async () => {
    try {
      const isTestnet = network === 'testnet';
      const [ton, usdt] = await Promise.all([
        getTonBalance(walletAddress, isTestnet),
        getUSDTBalance(walletAddress, isTestnet)
      ]);
      setTonBalance(ton);
      setUsdtBalance(usdt);
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // File upload handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
    }
  };

  // Pay with TON (Step 2 -> Step 3)
  const handlePayWithTon = async () => {
    if (!isConnected || !tonConnectUI) {
      setError('Please connect your TON wallet first');
      return;
    }

    if (!bill.maker_ton_address || !isValidTonAddress(bill.maker_ton_address)) {
      setError('Invalid recipient TON address');
      return;
    }

    const amount = parseFloat(bill.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid payment amount');
      return;
    }

    // Check balance
    if (tonBalance !== null && tonBalance < amount + 0.1) {
      setError(`Insufficient TON balance. You have ${formatTonAmount(tonBalance)} TON`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      toast.info('Confirm transaction in your TON wallet...');

      // Build and send TON transfer
      const transaction = buildTonTransfer(bill.maker_ton_address, amount);
      const result = await tonConnectUI.sendTransaction(transaction);

      setTxHash(result.boc); // TON uses BOC instead of tx hash
      setStep(3);
      toast.success('Payment sent! Waiting for confirmation...');

      // Notify parent
      if (onPaymentComplete) {
        onPaymentComplete({
          billId: bill.id,
          txHash: result.boc,
          token: 'TON',
          amount,
          network: 'ton',
          payerAddress: walletAddress
        });
      }
    } catch (err) {
      console.error('TON payment error:', err);

      if (err.message?.includes('Rejected')) {
        setError('Transaction rejected in wallet');
      } else {
        setError(err.message || 'Payment failed');
      }
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay with USDT (Jetton)
  const handlePayWithUSDT = async () => {
    if (!isConnected || !tonConnectUI) {
      setError('Please connect your TON wallet first');
      return;
    }

    if (!bill.maker_ton_address || !isValidTonAddress(bill.maker_ton_address)) {
      setError('Invalid recipient TON address');
      return;
    }

    const amount = parseFloat(bill.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid payment amount');
      return;
    }

    // Check USDT balance
    if (usdtBalance !== null && usdtBalance < amount) {
      setError(`Insufficient USDT balance. You have ${formatUSDTAmount(usdtBalance)} USDT`);
      return;
    }

    // Check TON for gas
    if (tonBalance !== null && tonBalance < 0.2) {
      setError('Insufficient TON for gas fees. Need at least 0.2 TON');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      toast.info('Confirm transaction in your TON wallet...');

      const isTestnet = network === 'testnet';
      const usdtConfig = getTonUSDT(isTestnet);

      // Get user's Jetton wallet address
      const jettonWalletAddress = await getJettonWalletAddress(
        walletAddress,
        usdtConfig.masterAddress,
        isTestnet
      );

      // Build and send USDT transfer
      const transaction = buildUSDTTransfer(
        jettonWalletAddress,
        bill.maker_ton_address,
        amount,
        walletAddress,
        isTestnet
      );

      const result = await tonConnectUI.sendTransaction(transaction);

      setTxHash(result.boc);
      setStep(3);
      toast.success('USDT payment sent!');

      // Notify parent
      if (onPaymentComplete) {
        onPaymentComplete({
          billId: bill.id,
          txHash: result.boc,
          token: 'USDT',
          amount,
          network: 'ton',
          payerAddress: walletAddress
        });
      }
    } catch (err) {
      console.error('USDT payment error:', err);

      if (err.message?.includes('Rejected')) {
        setError('Transaction rejected in wallet');
      } else {
        setError(err.message || 'Payment failed');
      }
      toast.error('Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit payment proof
  const handleSubmitProof = async () => {
    if (!proofFile) {
      toast.error('Please upload payment proof');
      return;
    }

    setIsProcessing(true);
    try {
      const uploadResult = await storageApi.uploadFile(proofFile, 'payment-proofs');

      if (onSubmitProof) {
        await onSubmitProof(bill.id, uploadResult.url);
      }

      setStep(4);
      toast.success('Proof uploaded! Awaiting confirmation.');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset and close
  const resetAndClose = () => {
    setStep(1);
    setSelectedToken('TON');
    setTxHash(null);
    setError(null);
    setProofFile(null);
    setIsProcessing(false);
    onClose();
  };

  if (!bill) return null;

  // Calculate fees and amounts
  const feeEstimate = getEstimatedFee(selectedToken);
  const payerReceives = bill.payout_amount || (bill.amount * 0.956);

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-100 flex items-center gap-2">
            <Diamond className="w-5 h-5 text-sky-400" />
            {step === 1 && 'Step 1: Connect TON Wallet'}
            {step === 2 && 'Step 2: Pay with TON'}
            {step === 3 && 'Step 3: Payment Sent'}
            {step === 4 && 'Payment Complete!'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* ============ STEP 1: CONNECT WALLET ============ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* TON Network Badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-sky-500 text-white">
                  <Diamond className="w-3 h-3 mr-1" />
                  TON Network
                </Badge>
                <Badge variant="outline" className="text-sky-400 border-sky-400">
                  <Zap className="w-3 h-3 mr-1" />
                  ~$0.025 fees
                </Badge>
              </div>

              {/* Wallet Connection */}
              {!isConnected ? (
                <div className="p-4 bg-sky-950 rounded-lg border border-sky-800 text-center space-y-3">
                  <Diamond className="w-12 h-12 mx-auto text-sky-400" />
                  <p className="text-sky-300 font-medium">Connect your TON Wallet</p>
                  <p className="text-sky-400 text-sm">Use Tonkeeper, MyTonWallet, or OpenMask</p>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="bg-sky-600 hover:bg-sky-700 w-full"
                  >
                    {isConnecting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                    ) : (
                      <><Wallet className="w-4 h-4 mr-2" /> Connect TON Wallet</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950 rounded-lg border border-emerald-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div className="flex-1">
                      <p className="text-emerald-300 font-medium">Wallet Connected</p>
                      <p className="text-emerald-400 text-sm font-mono">
                        {formatAddress(walletAddress)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(walletAddress)}
                      className="text-emerald-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Balances */}
                  <div className="mt-3 pt-3 border-t border-emerald-800 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">TON:</span>
                      <span className="text-white ml-2 font-mono">
                        {tonBalance !== null ? formatTonAmount(tonBalance) : '...'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">USDT:</span>
                      <span className="text-white ml-2 font-mono">
                        {usdtBalance !== null ? formatUSDTAmount(usdtBalance) : '...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Info */}
              <div className="p-4 bg-gray-900 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bill:</span>
                  <span className="text-white font-semibold">{bill.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    ${payerReceives?.toFixed(2)} {bill.crypto_currency}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Network fee:</span>
                  <span className="text-sky-400">~{feeEstimate.fee} TON (~${feeEstimate.feeUSD})</span>
                </div>
              </div>

              {/* Error Display */}
              {(error || walletError) && (
                <div className="p-3 bg-red-950 rounded-lg border border-red-800">
                  <p className="text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error || walletError}
                  </p>
                </div>
              )}

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-sky-600 hover:bg-sky-700"
                disabled={!isConnected}
              >
                Continue to Payment
              </Button>
            </div>
          )}

          {/* ============ STEP 2: PAY ============ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Token Selection */}
              <div className="space-y-2">
                <Label className="text-gray-300">Select Payment Token</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedToken === 'TON' ? 'default' : 'outline'}
                    onClick={() => setSelectedToken('TON')}
                    className={selectedToken === 'TON'
                      ? 'bg-sky-600 hover:bg-sky-700'
                      : 'border-gray-600 text-gray-300'
                    }
                  >
                    <Diamond className="w-4 h-4 mr-2" />
                    TON
                    {tonBalance !== null && (
                      <span className="ml-2 text-xs opacity-75">
                        ({formatTonAmount(tonBalance)})
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={selectedToken === 'USDT' ? 'default' : 'outline'}
                    onClick={() => setSelectedToken('USDT')}
                    className={selectedToken === 'USDT'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'border-gray-600 text-gray-300'
                    }
                  >
                    $ USDT
                    {usdtBalance !== null && (
                      <span className="ml-2 text-xs opacity-75">
                        ({formatUSDTAmount(usdtBalance)})
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-4 bg-gray-900 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sending:</span>
                  <span className="text-white font-bold font-mono">
                    {bill.amount?.toFixed(selectedToken === 'USDT' ? 2 : 4)} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">To:</span>
                  <span className="text-purple-400 font-mono text-xs">
                    {formatAddress(bill.maker_ton_address)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network Fee:</span>
                  <span className="text-sky-400">
                    ~{getEstimatedFee(selectedToken).fee} TON
                  </span>
                </div>
              </div>

              {/* Warning about sufficient balance */}
              {selectedToken === 'USDT' && tonBalance !== null && tonBalance < 0.2 && (
                <div className="p-3 bg-yellow-950 rounded-lg border border-yellow-800">
                  <p className="text-yellow-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    You need at least 0.2 TON for gas fees
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-950 rounded-lg border border-red-800">
                  <p className="text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-gray-600 text-gray-300"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={selectedToken === 'TON' ? handlePayWithTon : handlePayWithUSDT}
                  className="flex-1 bg-sky-600 hover:bg-sky-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <>Pay {bill.amount?.toFixed(2)} {selectedToken}</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: PAYMENT SENT ============ */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-emerald-950 rounded-lg border border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                <p className="text-emerald-300 font-medium">Payment Sent!</p>
                <p className="text-emerald-400 text-sm">
                  Transaction is being processed on TON blockchain
                </p>
                {txHash && (
                  <a
                    href={getExplorerUrl('tx', txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 text-sm hover:underline"
                  >
                    View on TONScan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Upload Proof */}
              <div className="space-y-2">
                <Label className="text-gray-300">Upload Payment Proof (Optional)</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-sky-500 transition-colors bg-gray-900">
                  <input
                    type="file"
                    id="ton-proof-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="ton-proof-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-300">
                      {proofFile ? proofFile.name : 'Click to upload screenshot'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                {proofFile && (
                  <Button
                    onClick={handleSubmitProof}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      'Submit Proof'
                    )}
                  </Button>
                )}
                <Button
                  onClick={resetAndClose}
                  variant="outline"
                  className={`${proofFile ? 'flex-1' : 'w-full'} border-gray-600 text-gray-300`}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* ============ STEP 4: COMPLETE ============ */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Complete!</h3>
              <p className="text-gray-400">
                Your {selectedToken} payment has been confirmed on the TON blockchain.
              </p>
              <div className="p-4 bg-gray-900 rounded-lg space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{bill.amount} {selectedToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network:</span>
                  <span className="text-sky-400">TON</span>
                </div>
                {txHash && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tx:</span>
                    <a
                      href={getExplorerUrl('tx', txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
              <Button onClick={resetAndClose} className="bg-sky-600 hover:bg-sky-700">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
