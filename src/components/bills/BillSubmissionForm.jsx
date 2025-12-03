import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaymentMethodSelector from "@/components/ui/PaymentMethodSelector";
import ChainSelector, { ChainLogos, CHAINS } from "@/components/ui/ChainSelector";
import { Upload, Send, Loader2, Wallet, AlertCircle, CheckCircle, ExternalLink, Coins, Diamond, Sparkles } from 'lucide-react';
import { billsApi } from '../../api/billsApi';
import { storageApi } from '../../api/storageApi';
import { calculateFee, FeeBreakdown } from './FeeCalculator';
import { useWallet } from '../../contexts/WalletContext';
import { escrowService } from '../../services/escrowService';
import { TokenSelector } from '../wallet/TokenSelector';
import { getNetwork } from '../../config/contracts';
import {
  sanitizeText,
  sanitizeFileName,
  sanitizeWalletAddress,
  validateBillSubmission,
  debounce
} from '../../utils/sanitize';

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'food', label: 'Food & Groceries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transport', label: 'Transport' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' }
];

export default function BillSubmissionForm({ onSuccess }) {
  // FIX: Safe destructuring with defaults to prevent crashes
  const wallet = useWallet() || {};
  const {
    isConnected = false,
    signer = null,
    chainId = null,
    connectWallet = () => {},
    isCorrectNetwork = () => false,
    getExplorerUrl = () => '#',
    walletAddress = '',
    provider = null
  } = wallet;

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other',
    description: '',
    payment_instructions: '',
    maker_ton_address: '', // TON address for receiving TON payments
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [escrowTxHash, setEscrowTxHash] = useState(null);
  const [approvalTxHash, setApprovalTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Rate limiting: Prevent multiple rapid submissions
  const lastSubmitTime = useRef(0);
  const SUBMIT_COOLDOWN = 3000; // 3 seconds between submissions

  // V2: Token selection state - FIX: Safe access to network config
  const networkConfig = chainId ? getNetwork(chainId) : null;
  const defaultSymbol = networkConfig?.nativeCurrency?.symbol || 'POL';

  const [selectedToken, setSelectedToken] = useState({
    type: 'NATIVE',
    address: null,
    symbol: defaultSymbol,
    decimals: 18,
    isNative: true
  });

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security: Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, and PDF files are allowed.');
        return;
      }

      // Security: Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File too large. Maximum size is 10MB.');
        return;
      }

      // Security: Sanitize filename
      const sanitizedName = sanitizeFileName(file.name);
      const sanitizedFile = new File([file], sanitizedName, { type: file.type });

      setImageFile(sanitizedFile);
      setError(null);
    }
  };

  // Security: Debounced validation on input change
  const validateField = useCallback(
    debounce((field, value) => {
      const errors = { ...validationErrors };

      switch (field) {
        case 'title':
          if (value.length > 0 && value.length < 3) {
            errors.title = 'Title must be at least 3 characters';
          } else if (value.length > 200) {
            errors.title = 'Title must be less than 200 characters';
          } else {
            delete errors.title;
          }
          break;

        case 'amount':
          const num = parseFloat(value);
          if (value && (isNaN(num) || num < 1 || num > 1000000)) {
            errors.amount = 'Amount must be between $1 and $1,000,000';
          } else {
            delete errors.amount;
          }
          break;

        case 'maker_ton_address':
          if (value && value.trim()) {
            const validation = sanitizeWalletAddress(value, 'ton');
            if (!validation.isValid) {
              errors.maker_ton_address = 'Invalid TON wallet address';
            } else {
              delete errors.maker_ton_address;
            }
          } else {
            delete errors.maker_ton_address;
          }
          break;

        default:
          break;
      }

      setValidationErrors(errors);
    }, 500),
    [validationErrors]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEscrowTxHash(null);
    setValidationErrors({});

    // Security: Rate limiting - prevent spam submissions
    const now = Date.now();
    if (now - lastSubmitTime.current < SUBMIT_COOLDOWN) {
      const remaining = Math.ceil((SUBMIT_COOLDOWN - (now - lastSubmitTime.current)) / 1000);
      setError(`Please wait ${remaining} seconds before submitting again`);
      return;
    }

    // Security: Comprehensive input validation
    const validation = validateBillSubmission(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setError('Please fix the validation errors below');
      return;
    }

    // Use sanitized data from validation
    const sanitizedData = validation.sanitized;

    // Check wallet connection
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork()) {
      setError('Please switch to Polygon Amoy or Polygon Mainnet');
      return;
    }

    if (!signer) {
      setError('Wallet signer not available. Please reconnect your wallet.');
      return;
    }

    setIsSubmitting(true);
    lastSubmitTime.current = now;

    try {
      let proofImageUrl = '';

      // Step 1: Upload receipt image
      if (imageFile) {
        setUploadProgress('Uploading receipt...');
        const uploadResult = await storageApi.uploadFile(imageFile);
        proofImageUrl = uploadResult.url;
      }

      // Step 2: Calculate fees
      const fee = escrowService.calculateFee(formData.amount);
      const totalToLock = parseFloat(fee.totalToLock);
      const platformFee = parseFloat(fee.feeAmount);

      setUploadProgress('Creating bill in database...');

      // Step 3: Create bill in database (status: pending_approval) - USING SANITIZED DATA
      const bill = await billsApi.create({
        title: sanitizedData.title,
        amount: sanitizedData.amount,
        category: sanitizedData.category,
        description: sanitizedData.description || '',
        payment_instructions: sanitizedData.payment_instructions,
        payout_wallet: walletAddress, // Use connected wallet
        crypto_currency: selectedToken.symbol, // V2: Use selected token symbol
        payment_token: selectedToken.address || 'NATIVE', // V2: Store token address
        payment_network: chainId === 137 ? 'polygon' : 'polygon_amoy',
        fee_percentage: fee.feePercentage,
        fee_amount: platformFee,
        payout_amount: parseFloat(fee.payoutAmount),
        proof_image_url: proofImageUrl,
        maker_ton_address: sanitizedData.maker_ton_address || null // TON address for direct payments
      });

      // Step 4: Lock crypto in escrow contract (V2: supports both native and ERC20)
      let escrowResult;

      if (selectedToken.isNative) {
        // Native token flow (original V1)
        setUploadProgress('Locking crypto in escrow (confirm in wallet)...');
        escrowResult = await escrowService.createBill(
          signer,
          totalToLock.toString(),
          platformFee.toString()
        );
      } else {
        // ERC20 token flow (V2)
        setUploadProgress(`Approving ${selectedToken.symbol} (confirm in wallet)...`);
        escrowResult = await escrowService.createBillWithToken(
          signer,
          selectedToken.address,
          totalToLock.toString(),
          platformFee.toString()
        );

        // Store approval tx if it happened
        if (escrowResult.approvalTxHash) {
          setApprovalTxHash(escrowResult.approvalTxHash);
        }
      }

      setEscrowTxHash(escrowResult.txHash);

      // Step 5: Update database with escrow info
      setUploadProgress('Finalizing...');

      await billsApi.updateWithEscrow(
        bill.id,
        escrowResult.billId,
        escrowResult.txHash
      );

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: 'other',
        description: '',
        payment_instructions: '',
        maker_ton_address: '',
      });
      setImageFile(null);
      setUploadProgress('');
      setApprovalTxHash(null);

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting bill:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        setError('Transaction rejected in wallet');
      } else if (error.message?.includes('insufficient funds')) {
        setError(`Insufficient ${selectedToken.symbol} balance for this transaction`);
      } else if (error.message?.includes('allowance')) {
        setError(`Token approval failed. Please try again.`);
      } else if (error.message?.includes('transfer amount exceeds balance')) {
        setError(`Insufficient ${selectedToken.symbol} balance`);
      } else {
        setError(error.message || 'Failed to submit bill. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate fee preview
  const fee = formData.amount ? escrowService.calculateFee(formData.amount) : null;

  return (
    <Card className="border border-dark-border shadow-2xl bg-dark-card/80 backdrop-blur-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-brand-purple/10 via-dark-card to-dark-card border-b border-dark-border p-6">
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple">
            <Send className="w-6 h-6 text-white" />
          </div>
          Submit New Bill
        </CardTitle>
        <p className="text-sm text-gray-400 mt-2 ml-14">
          Lock your crypto in escrow and receive fiat payment from bill payers
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Wallet Connection Status */}
        {!isConnected ? (
          <div className="mb-6 p-4 bg-yellow-950 rounded-lg border border-yellow-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div className="flex-1">
                <p className="text-yellow-300 font-medium">Wallet Not Connected</p>
                <p className="text-yellow-400 text-sm">Connect your wallet to create a bill with escrow protection</p>
              </div>
              <Button onClick={connectWallet} className="bg-yellow-600 hover:bg-yellow-700">
                <Wallet className="w-4 h-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
        ) : !isCorrectNetwork() ? (
          <div className="mb-6 p-4 bg-red-950 rounded-lg border border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-300 font-medium">Wrong Network</p>
                <p className="text-red-400 text-sm">Please switch to Polygon Amoy (testnet) or Polygon Mainnet</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-emerald-950 rounded-lg border border-emerald-800">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-emerald-300 font-medium">Wallet Connected</p>
                <p className="text-emerald-400 text-sm font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 rounded-lg border border-red-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Success Display */}
        {escrowTxHash && (
          <div className="mb-6 p-4 bg-emerald-950 rounded-lg border border-emerald-800">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <p className="text-emerald-300 font-medium">Escrow Created!</p>
                <a
                  href={getExplorerUrl('tx', escrowTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 text-sm flex items-center gap-1 hover:underline"
                >
                  View on Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Bill Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Monthly Rent Payment"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                validateField('title', e.target.value);
              }}
              required
              className={`bg-gray-900 border-gray-600 text-gray-100 ${validationErrors.title ? 'border-red-500' : ''}`}
            />
            {validationErrors.title && (
              <p className="text-xs text-red-400">{validationErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                max="1000000"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value });
                  validateField('amount', e.target.value);
                }}
                required
                className={`bg-gray-900 border-gray-600 text-gray-100 ${validationErrors.amount ? 'border-red-500' : ''}`}
              />
              {validationErrors.amount && (
                <p className="text-xs text-red-400">{validationErrors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-300">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value} className="text-gray-100 focus:bg-gray-700">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* V2: Token Selection */}
          {isConnected && isCorrectNetwork() && (
            <TokenSelector
              chainId={chainId}
              provider={provider}
              userAddress={walletAddress}
              selectedToken={selectedToken.type}
              onTokenSelect={handleTokenSelect}
              disabled={isSubmitting}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="bg-gray-900 border-gray-600 text-gray-100"
            />
          </div>

          {/* Payment Instructions - Premium Card Selection */}
          <motion.div
            className="p-5 rounded-2xl border border-success-muted/30 bg-gradient-to-br from-success-muted/5 to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold text-white flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-success-muted/20">
                <Sparkles className="w-5 h-5 text-success-muted" />
              </div>
              How should the payer pay your bill?
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Select your preferred payment method. The payer will use this to send you fiat payment.
            </p>
            <PaymentMethodSelector
              value={formData.payment_instructions}
              onChange={(value) => setFormData({ ...formData, payment_instructions: value })}
            />
          </motion.div>

          {/* Multi-Chain Crypto Receiving - All Networks */}
          <motion.div
            className="p-5 rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/5 to-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-brand-purple/20">
                <Coins className="w-5 h-5 text-brand-purple" />
              </div>
              Receive Crypto Payments
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              Your connected EVM wallet will receive payments. Add optional addresses for other networks.
            </p>

            {/* Supported Networks Display */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {['ethereum', 'polygon', 'arbitrum', 'base', 'optimism', 'bsc'].map((chain) => {
                const Logo = ChainLogos[chain];
                const chainData = CHAINS[chain];
                return (
                  <div
                    key={chain}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-dark-card/50 border border-dark-border hover:border-brand-purple/30 transition-colors"
                  >
                    <div className="w-8 h-8">
                      {Logo && <Logo />}
                    </div>
                    <span className="text-[10px] text-gray-400 text-center">{chainData?.name}</span>
                  </div>
                );
              })}
            </div>

            {/* TON Address (Optional) */}
            <div className="p-4 rounded-xl bg-dark-card/50 border border-dark-border space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6">
                  {ChainLogos.ton && <ChainLogos.ton />}
                </div>
                <span className="font-medium text-white text-sm">TON Network (Optional)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-success-muted/20 text-success-muted rounded">ULTRA LOW FEE</span>
              </div>
              <Input
                id="maker_ton_address"
                placeholder="EQ... or UQ... (your TON address)"
                value={formData.maker_ton_address}
                onChange={(e) => {
                  setFormData({ ...formData, maker_ton_address: e.target.value });
                  validateField('maker_ton_address', e.target.value);
                }}
                className={`bg-dark-primary border-dark-border text-white font-mono text-sm ${validationErrors.maker_ton_address ? 'border-red-500' : ''}`}
              />
              {validationErrors.maker_ton_address && (
                <p className="text-xs text-red-400">{validationErrors.maker_ton_address}</p>
              )}
              <p className="text-xs text-gray-500">
                ~$0.025 per transaction • 5 second finality
              </p>
            </div>

            {/* Other Networks Info */}
            <div className="mt-3 flex flex-wrap gap-2">
              {['solana', 'bitcoin', 'lightning'].map((chain) => {
                const Logo = ChainLogos[chain];
                return (
                  <div
                    key={chain}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-card/30 border border-dark-border text-xs text-gray-500"
                  >
                    <div className="w-4 h-4">
                      {Logo && <Logo />}
                    </div>
                    <span>Coming soon</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Fee & Escrow Info */}
          {fee && (
            <div className="p-4 bg-purple-950 rounded-lg border border-purple-800 space-y-3">
              <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Escrow Summary ({selectedToken.symbol})
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Amount to payer:</div>
                <div className="text-gray-100 font-mono">{fee.payoutAmount} {selectedToken.symbol}</div>
                <div className="text-gray-400">Platform fee ({fee.feePercentage}%):</div>
                <div className="text-gray-100 font-mono">{fee.feeAmount} {selectedToken.symbol}</div>
                <div className="text-gray-400 font-semibold border-t border-purple-800 pt-2">Total to lock:</div>
                <div className="text-purple-300 font-mono font-semibold border-t border-purple-800 pt-2">{fee.totalToLock} {selectedToken.symbol}</div>
              </div>
              <p className="text-xs text-purple-400 mt-2">
                This amount will be locked in the smart contract until the payer pays your bill
              </p>
              {!selectedToken.isNative && (
                <p className="text-xs text-amber-400 mt-1">
                  Using ERC20 token requires 2 transactions: approve + lock
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-gray-300">Receipt / Proof (Optional)</Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors bg-gray-900">
              <input
                type="file"
                id="receipt"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receipt" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-300">
                  {imageFile ? imageFile.name : 'Click to upload receipt or bill'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG or PDF</p>
              </label>
              {imageFile && imageFile.type?.startsWith('image/') && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="max-h-40 rounded-lg border border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 h-14 text-base font-semibold shadow-xl shadow-brand-purple/20 rounded-xl"
              disabled={isSubmitting || !isConnected || !isCorrectNetwork()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadProgress || 'Processing...'}
                </>
              ) : !isConnected ? (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet to Submit
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Create Bill & Lock Escrow
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}
