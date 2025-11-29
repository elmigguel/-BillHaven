import React, { useState } from 'react';
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
  const { isConnected, signer, walletAddress, isCorrectNetwork, connectWallet, getExplorerUrl, chainId } = useWallet();

  const [step, setStep] = useState(1);
  const [payerWalletAddress, setPayerWalletAddress] = useState(walletAddress || '');
  const [proofFile, setProofFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [escrowClaimTxHash, setEscrowClaimTxHash] = useState(null);
  const [escrowError, setEscrowError] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Gekopieerd!');
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
      setEscrowError('Verbind eerst je wallet');
      return;
    }

    if (!isCorrectNetwork()) {
      setEscrowError('Switch naar Polygon Amoy of Polygon Mainnet');
      return;
    }

    if (!signer) {
      setEscrowError('Wallet signer niet beschikbaar. Herverbind je wallet.');
      return;
    }

    // Check if bill has escrow
    if (!bill.escrow_bill_id) {
      setEscrowError('Deze bill heeft geen escrow. Neem contact op met support.');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Claim on-chain via escrow contract
      toast.info('Bevestig de transactie in je wallet...');
      const escrowResult = await escrowService.claimBill(signer, bill.escrow_bill_id);
      setEscrowClaimTxHash(escrowResult.txHash);

      // Step 2: Update database with claim info
      await onClaimBill(bill.id, walletAddress);

      setStep(2);
      toast.success('Bill geclaimed op de blockchain! Nu betalen.');
    } catch (error) {
      console.error('Error claiming bill:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setEscrowError('Transactie geweigerd in wallet');
      } else if (error.message?.includes('already claimed')) {
        setEscrowError('Deze bill is al geclaimed');
      } else if (error.message?.includes('Bill does not exist')) {
        setEscrowError('Escrow bill niet gevonden op de blockchain');
      } else {
        setEscrowError(error.message || 'Kon bill niet claimen');
      }
      toast.error('Claimen mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stap 2: Upload bewijs van fiat betaling
  const handleSubmitProof = async () => {
    if (!proofFile) {
      toast.error('Upload een screenshot van je betaling');
      return;
    }

    setIsProcessing(true);
    try {
      // Upload screenshot
      const uploadResult = await storageApi.uploadFile(proofFile, 'payment-proofs');

      // Update bill met bewijs
      await onSubmitProof(bill.id, uploadResult.url);

      setStep(3);
      toast.success('Bewijs geupload! Wacht op crypto.');
    } catch (error) {
      toast.error('Upload mislukt: ' + error.message);
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
            {step === 1 && 'Stap 1: Claim deze Bill'}
            {step === 2 && 'Stap 2: Betaal met Bank/Tikkie'}
            {step === 3 && 'Stap 3: Wacht op Crypto'}
            {step === 4 && 'Betaling Voltooid!'}
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
                      <p className="text-yellow-300 font-medium">Wallet Niet Verbonden</p>
                      <p className="text-yellow-400 text-sm">Verbind je wallet om deze bill te claimen</p>
                    </div>
                    <Button onClick={connectWallet} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      <Wallet className="w-4 h-4 mr-2" />
                      Verbind
                    </Button>
                  </div>
                </div>
              ) : !isCorrectNetwork() ? (
                <div className="p-4 bg-red-950 rounded-lg border border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-red-300 font-medium">Verkeerd Netwerk</p>
                      <p className="text-red-400 text-sm">Switch naar Polygon Amoy (testnet) of Polygon Mainnet</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950 rounded-lg border border-emerald-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-emerald-300 font-medium">Wallet Verbonden</p>
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
                  <span className="text-gray-400">Te betalen (fiat):</span>
                  <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                </div>
                <hr className="border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-400">Jij ontvangt:</span>
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
                  Jouw Wallet Adres (voor crypto ontvangst)
                </Label>
                <Input
                  placeholder="0x..."
                  value={payerWalletAddress || walletAddress || ''}
                  onChange={(e) => setPayerWalletAddress(e.target.value)}
                  className="font-mono text-sm bg-gray-900 border-gray-600 text-gray-100"
                  disabled={!isConnected}
                />
                <p className="text-xs text-gray-400">
                  Hier ontvang je ${payerReceives?.toFixed(2)} {bill.crypto_currency} na bevestiging
                </p>
              </div>

              {isConnected && walletAddress && !payerWalletAddress && (
                <Button
                  variant="outline"
                  onClick={() => setPayerWalletAddress(walletAddress)}
                  className="w-full border-gray-600 text-gray-300"
                >
                  Gebruik verbonden wallet ({walletAddress?.slice(0,6)}...{walletAddress?.slice(-4)})
                </Button>
              )}

              <Button
                onClick={handleClaim}
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!isConnected || !isCorrectNetwork() || isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claimen op blockchain...</>
                ) : !isConnected ? (
                  'Verbind Wallet om te Claimen'
                ) : (
                  'Claim Bill & Ga naar Betaling'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Deze actie registreert je claim op de blockchain via het escrow contract
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
                  Bill geclaimed op de blockchain! Nu betalen via onderstaande instructies.
                </p>
                {escrowClaimTxHash && (
                  <a
                    href={getExplorerUrl('tx', escrowClaimTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    Bekijk transactie <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Betaalinstructies */}
              <div className="p-4 bg-blue-950 border border-blue-700 rounded-lg space-y-3">
                <p className="text-sm text-blue-300 font-semibold">
                  Betaal ${bill.amount?.toFixed(2)} via:
                </p>
                <div className="p-3 bg-gray-900 rounded text-sm text-gray-100 whitespace-pre-wrap">
                  {bill.payment_instructions || 'Geen betaalinstructies opgegeven'}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(bill.payment_instructions)}
                  className="text-blue-300 border-blue-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Kopieer instructies
                </Button>
              </div>

              {/* Bewijs upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Upload bewijs van betaling *</Label>
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
                      {proofFile ? proofFile.name : 'Klik om screenshot te uploaden'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Screenshot van je betaling</p>
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
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploaden...</>
                ) : (
                  'Bewijs Uploaden & Bevestigen'
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

              <h3 className="text-xl font-bold text-white">Wacht op Bill Maker</h3>

              <p className="text-gray-400">
                De bill maker verifieert nu je betaling en stuurt je crypto.
              </p>

              <div className="p-4 bg-gray-900 rounded-lg space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Je betaalde:</span>
                  <span className="text-white">${bill.amount?.toFixed(2)} (fiat)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Je ontvangt:</span>
                  <span className="text-emerald-400">${payerReceives?.toFixed(2)} {bill.crypto_currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Naar wallet:</span>
                  <span className="text-purple-400 font-mono text-xs">{payerWalletAddress?.slice(0,10)}...{payerWalletAddress?.slice(-6)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Je krijgt een notificatie zodra de crypto is verstuurd.
              </p>

              <Button onClick={resetAndClose} variant="outline" className="border-gray-600 text-gray-300">
                Sluiten (je kunt status checken in My Bills)
              </Button>
            </div>
          )}

          {/* ============ STAP 4: KLAAR ============ */}
          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Crypto Ontvangen!</h3>
              <p className="text-gray-400">
                ${payerReceives?.toFixed(2)} {bill.crypto_currency} is naar je wallet gestuurd.
              </p>
              <Button onClick={resetAndClose} className="bg-purple-600 hover:bg-purple-700">
                Sluiten
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
