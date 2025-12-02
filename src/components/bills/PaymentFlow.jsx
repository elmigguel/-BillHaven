import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, Copy, Upload, Clock, Wallet, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { storageApi } from '../../api/storageApi';
import { useWallet } from '../../contexts/WalletContext';
import { escrowService } from '../../services/escrowService';

/**
 * NIEUWE FLOW (Fiat → Crypto):
 *
 * PAYER (Jantje) wil crypto kopen door iemands rekening te betalen
 *
 * Stap 1: CLAIM - Voer je wallet adres in (waar je crypto wilt ontvangen)
 * Stap 2: BETAAL FIAT - Zie betaalinstructies, betaal, upload bewijs
 * Stap 3: WACHT - Bill maker verifieert en stuurt crypto
 * Stap 4: KLAAR - Je ontvangt crypto!
 */

export default function PaymentFlow({
  bill,
  isOpen,
  onClose,
  onClaimBill,      // Stap 1: Claim met wallet adres (database update)
  onSubmitProof,    // Stap 2: Upload bewijs
}) {
  // FIX: Safe destructuring with defaults to prevent crashes
  const wallet = useWallet() || {};
  const {
    isConnected = false,
    signer = null,
    walletAddress = '',
    isCorrectNetwork = () => false,
    connectWallet = () => {},
    getExplorerUrl = () => '#',
    chainId = null
  } = wallet;

  const [step, setStep] = useState(1);
  const [payerWalletAddress, setPayerWalletAddress] = useState(walletAddress || '');
  const [proofFile, setProofFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [escrowClaimTxHash, setEscrowClaimTxHash] = useState(null);
  const [escrowError, setEscrowError] = useState(null);

  // FIX: Sync payerWalletAddress when wallet changes (prevents stale address issue)
  useEffect(() => {
    if (walletAddress && !payerWalletAddress) {
      setPayerWalletAddress(walletAddress);
    }
  }, [walletAddress, payerWalletAddress]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
    }
  };

  // Stap 1: Claim de bill met je wallet adres EN op de blockchain
  const handleClaim = async () => {
    setEscrowError(null);
    setEscrowClaimTxHash(null);

    // Validate wallet connection
    if (!isConnected) {
      setEscrowError('Connect your wallet first');
      return;
    }

    if (!isCorrectNetwork()) {
      setEscrowError('Switch to Polygon Amoy or Polygon Mainnet');
      return;
    }

    if (!signer) {
      setEscrowError('Wallet signer not available. Reconnect your wallet.');
      return;
    }

    // Check if bill has escrow
    if (!bill.escrow_bill_id) {
      setEscrowError('This bill has no escrow. Contact support.');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Claim on-chain via escrow contract
      toast.info('Confirm the transaction in your wallet...');
      const escrowResult = await escrowService.claimBill(signer, bill.escrow_bill_id);
      setEscrowClaimTxHash(escrowResult.txHash);

      // Step 2: Update database with claim info
      await onClaimBill(bill.id, walletAddress);

      setStep(2);
      toast.success('Bill claimed on blockchain! Now pay.');
    } catch (error) {
      console.error('Error claiming bill:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setEscrowError('Transaction rejected in wallet');
      } else if (error.message?.includes('already claimed')) {
        setEscrowError('This bill has already been claimed');
      } else if (error.message?.includes('Bill does not exist')) {
        setEscrowError('Escrow bill not found on blockchain');
      } else {
        setEscrowError(error.message || 'Could not claim bill');
      }
      toast.error('Claim failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stap 2: Upload bewijs van fiat betaling
  const handleSubmitProof = async () => {
    if (!proofFile) {
      toast.error('Upload a screenshot of your payment');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload screenshot
      const uploadResult = await storageApi.uploadFile(proofFile, 'payment-proofs');

      // Update bill met bewijs
      await onSubmitProof(bill.id, uploadResult.url);

      setStep(3);
      toast.success('Proof uploaded! Wait for crypto.');
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setPayerWalletAddress(walletAddress || '');
    setProofFile(null);
    setEscrowClaimTxHash(null);
    setEscrowError(null);
    setIsProcessing(false); // FIX: Reset processing state to prevent stuck UI
    onClose();
  };

  if (!bill) return null;

  // Bereken wat payer ontvangt (na fee)
  const payerReceives = bill.payout_amount || (bill.amount * 0.956); // 4.4% fee default

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-100">
            {step === 1 && 'Step 1: Claim this Bill'}
            {step === 2 && 'Step 2: Pay with Bank Transfer'}
            {step === 3 && 'Step 3: Wait for Crypto'}
            {step === 4 && 'Payment Complete!'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* ============ STAP 1: CLAIM ============ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Wallet Connection Status */}
              {!isConnected ? (
                <div className="p-4 bg-yellow-950 rounded-lg border border-yellow-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-yellow-300 font-medium">Wallet Not Connected</p>
                      <p className="text-yellow-400 text-sm">Connect your wallet to claim this bill</p>
                    </div>
                    <Button onClick={connectWallet} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </div>
              ) : !isCorrectNetwork() ? (
                <div className="p-4 bg-red-950 rounded-lg border border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-red-300 font-medium">Wrong Network</p>
                      <p className="text-red-400 text-sm">Switch to Polygon Amoy (testnet) or Polygon Mainnet</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950 rounded-lg border border-emerald-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-emerald-300 font-medium">Wallet Connected</p>
                      <p className="text-emerald-400 text-sm font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Escrow Error Display */}
              {escrowError && (
                <div className="p-4 bg-red-950 rounded-lg border border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-300">{escrowError}</p>
                  </div>
                </div>
              )}

              {/* Bill info */}
              <div className="p-4 bg-gray-900 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bill:</span>
                  <span className="text-white font-semibold">{bill.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To pay (fiat):</span>
                  <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    ${payerReceives?.toFixed(2)} {bill.crypto_currency}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  (Bill maker betaalt {bill.fee_percentage || 4.4}% platform fee)
                </p>
                {bill.escrow_bill_id && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Escrow ID:</span>
                    <span className="text-purple-400 font-mono">#{bill.escrow_bill_id}</span>
                  </div>
                )}
              </div>

              {/* Wallet address display (auto-filled from connected wallet) */}
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Your Wallet Address (for crypto receipt)
                </Label>
                <Input
                  placeholder="0x..."
                  value={payerWalletAddress || walletAddress || ''}
                  onChange={(e) => setPayerWalletAddress(e.target.value)}
                  className="font-mono text-sm bg-gray-900 border-gray-600 text-gray-100"
                  disabled={!isConnected}
                />
                <p className="text-xs text-gray-400">
                  Here you will receive ${payerReceives?.toFixed(2)} {bill.crypto_currency} after confirmation
                </p>
              </div>

              {isConnected && walletAddress && !payerWalletAddress && (
                <Button
                  variant="outline"
                  onClick={() => setPayerWalletAddress(walletAddress)}
                  className="w-full border-gray-600 text-gray-300"
                >
                  Use connected wallet ({walletAddress?.slice(0,6)}...{walletAddress?.slice(-4)})
                </Button>
              )}

              <Button
                onClick={handleClaim}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!isConnected || !isCorrectNetwork() || isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming on blockchain...</>
                ) : !isConnected ? (
                  'Connect Wallet to Claim'
                ) : (
                  'Claim Bill & Go to Payment'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                This action registers your claim on the blockchain via the escrow contract
              </p>
            </div>
          )}

          {/* ============ STAP 2: BETAAL FIAT ============ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Success message with escrow tx */}
              <div className="p-3 bg-emerald-950 border border-emerald-700 rounded-lg space-y-2">
                <p className="text-sm text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Bill claimed on blockchain! Now pay using the instructions below.
                </p>
                {escrowClaimTxHash && (
                  <a
                    href={getExplorerUrl('tx', escrowClaimTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    View transaction <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Payment Instructions */}
              <div className="p-4 bg-blue-950 border border-blue-700 rounded-lg space-y-3">
                <p className="text-sm text-blue-300 font-semibold">
                  Pay ${bill.amount?.toFixed(2)} via:
                </p>
                <div className="p-3 bg-gray-900 rounded text-sm text-gray-100 whitespace-pre-wrap">
                  {bill.payment_instructions || 'No payment instructions provided'}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(bill.payment_instructions)}
                  className="text-blue-300 border-blue-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy instructions
                </Button>
              </div>

              {/* Proof upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Upload proof of payment *</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors bg-gray-900">
                  <input
                    type="file"
                    id="proof-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-300">
                      {proofFile ? proofFile.name : 'Click to upload screenshot'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Screenshot of your payment</p>
                  </label>
                  {/* Image Preview */}
                  {proofFile && proofFile.type?.startsWith('image/') && (
                    <div className="mt-4 flex justify-center">
                      <img
                        src={URL.createObjectURL(proofFile)}
                        alt="Preview"
                        className="max-h-40 rounded-lg border border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmitProof}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!proofFile || isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  'Upload Proof & Confirm'
                )}
              </Button>
            </div>
          )}

          {/* ============ STAP 3: WACHT OP CRYPTO ============ */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-white animate-pulse" />
              </div>

              <h3 className="text-xl font-bold text-white">Wait for Bill Maker</h3>

              <p className="text-gray-400">
                The bill maker is now verifying your payment and will send you crypto.
              </p>

              <div className="p-4 bg-gray-900 rounded-lg space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You paid:</span>
                  <span className="text-white">${bill.amount?.toFixed(2)} (fiat)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">You receive:</span>
                  <span className="text-emerald-400">${payerReceives?.toFixed(2)} {bill.crypto_currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">To wallet:</span>
                  <span className="text-purple-400 font-mono text-xs">{payerWalletAddress?.slice(0,10)}...{payerWalletAddress?.slice(-6)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                You will receive a notification when the crypto has been sent.
              </p>

              <Button onClick={resetAndClose} variant="outline" className="border-gray-600 text-gray-300">
                Close (you can check status in My Bills)
              </Button>
            </div>
          )}

          {/* ============ STAP 4: KLAAR ============ */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Crypto Received!</h3>
              <p className="text-gray-400">
                ${payerReceives?.toFixed(2)} {bill.crypto_currency} has been sent to your wallet.
              </p>
              <Button onClick={resetAndClose} className="bg-indigo-600 hover:bg-indigo-700">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
