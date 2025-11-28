import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Send, Loader2 } from 'lucide-react';
import { billsApi } from '../../api/billsApi';
import { storageApi } from '../../api/storageApi';
import { calculateFee, FeeBreakdown } from './FeeCalculator';

const CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'food', label: 'Food & Groceries' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transport', label: 'Transport' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' }
];

const CRYPTO_CURRENCIES = [
  { value: 'USDT', label: 'USDT (Tether)' },
  { value: 'USDC', label: 'USDC (USD Coin)' },
  { value: 'BTC', label: 'BTC (Bitcoin)' },
  { value: 'ETH', label: 'ETH (Ethereum)' },
  { value: 'LTC', label: 'LTC (Litecoin)' },
  { value: 'SOL', label: 'SOL (Solana)' }
];

export default function BillSubmissionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other',
    description: '',
    payment_instructions: '',  // IBAN, Tikkie, etc - hoe payer moet betalen
    crypto_wallet_address: '', // Bill maker's wallet - waar crypto VANDAAN komt
    crypto_currency: 'USDT'
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let proofImageUrl = '';

      if (imageFile) {
        setUploadProgress('Uploading receipt...');
        const uploadResult = await storageApi.uploadFile(imageFile);
        proofImageUrl = uploadResult.url;
      }

      setUploadProgress('Submitting bill...');

      const fee = calculateFee(formData.amount);

      await billsApi.create({
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        payment_instructions: formData.payment_instructions, // Hoe payer moet betalen (IBAN/Tikkie)
        payout_wallet: formData.crypto_wallet_address,       // Jouw wallet (crypto bron)
        crypto_currency: formData.crypto_currency,
        fee_percentage: fee.feePercentage,
        fee_amount: fee.feeAmount,
        payout_amount: fee.payoutAmount,
        proof_image_url: proofImageUrl
      });

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: 'other',
        description: '',
        payment_instructions: '',
        crypto_wallet_address: '',
        crypto_currency: 'USDT'
      });
      setImageFile(null);
      setUploadProgress('');

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting bill:', error);
      alert('Failed to submit bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-gray-700 shadow-xl bg-gray-800">
      <CardHeader className="bg-gradient-to-br from-purple-950 to-gray-900 border-b border-gray-700">
        <CardTitle className="text-2xl text-gray-100">Submit New Bill</CardTitle>
        <p className="text-sm text-gray-400 mt-1">
          Upload your bill and receive crypto reimbursement
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">Bill Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Monthly Rent Payment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-gray-900 border-gray-600 text-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-300">Amount (USD) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="bg-gray-900 border-gray-600 text-gray-100"
              />
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

          {/* NIEUW: Betaalinstructies - hoe payer je rekening moet betalen */}
          <div className="p-4 bg-emerald-950 rounded-lg border border-emerald-800 space-y-4">
            <h4 className="font-semibold text-emerald-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"/>
              </svg>
              Hoe kan de payer je rekening betalen?
            </h4>
            <div className="space-y-2">
              <Label htmlFor="payment_instructions" className="text-gray-300">Betaalinstructies *</Label>
              <Textarea
                id="payment_instructions"
                placeholder="Bijv: IBAN NL12ABCD0123456789 t.n.v. Jan Jansen&#10;Of: Tikkie link: tikkie.me/pay/abc123&#10;Of: PayPal: jan@email.com"
                value={formData.payment_instructions}
                onChange={(e) => setFormData({ ...formData, payment_instructions: e.target.value })}
                rows={3}
                required
                className="bg-gray-900 border-gray-600 text-gray-100"
              />
              <p className="text-xs text-emerald-400">
                De payer ziet dit en betaalt je rekening via deze methode
              </p>
            </div>
          </div>

          <FeeBreakdown amount={formData.amount} />

          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-gray-300">Receipt / Proof</Label>
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
              {/* Image Preview */}
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

          <div className="p-4 bg-purple-950 rounded-lg border border-purple-800 space-y-4">
            <h4 className="font-semibold text-purple-300 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z"/>
              </svg>
              Jouw Crypto - Wat je terug betaalt
            </h4>

            <div className="space-y-2">
              <Label htmlFor="crypto_currency" className="text-gray-300">Welke crypto betaal je terug?</Label>
              <Select 
                value={formData.crypto_currency} 
                onValueChange={(value) => setFormData({ ...formData, crypto_currency: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {CRYPTO_CURRENCIES.map(crypto => (
                    <SelectItem key={crypto.value} value={crypto.value} className="text-gray-100 focus:bg-gray-700">
                      {crypto.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet" className="text-gray-300">Jouw Wallet Adres *</Label>
              <Input
                id="wallet"
                placeholder="0x..."
                value={formData.crypto_wallet_address}
                onChange={(e) => setFormData({ ...formData, crypto_wallet_address: e.target.value })}
                required
                className="font-mono text-sm bg-gray-900 border-gray-600 text-gray-100"
              />
              <p className="text-xs text-purple-400">
                Vanaf dit adres stuur je {formData.crypto_currency} naar de payer
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-12 text-base shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {uploadProgress || 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Bill for Reimbursement
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}