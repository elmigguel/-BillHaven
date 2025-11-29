import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/billsApi';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Receipt,
  Wallet,
  Clock,
  CheckCircle2,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PaymentFlow from '../components/bills/PaymentFlow';
import { useWallet } from '../contexts/WalletContext';

const categoryColors = {
  rent: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
  utilities: 'bg-cyan-100 text-cyan-700',
  transport: 'bg-indigo-100 text-indigo-700',
  healthcare: 'bg-pink-100 text-pink-700',
  entertainment: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function PublicBills() {
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const queryClient = useQueryClient();
  const { isConnected, walletAddress } = useWallet();
  const { user } = useAuth();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['publicBills'],
    queryFn: () => billsApi.getPublicBills()
  });

  const cancelClaimMutation = useMutation({
    mutationFn: async (billId) => {
      await billsApi.update(billId, {
        status: 'approved',
        claimed_by: null,
        claimed_at: null,
        payer_wallet_address: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicBills'] });
      toast.success('Claim geannuleerd');
    },
    onError: (error) => {
      console.error('Cancel claim error:', error);
      toast.error('Kon claim niet annuleren: ' + error.message);
    }
  });

  // Nieuwe flow: Claim bill met wallet adres
  const claimBillMutation = useMutation({
    mutationFn: async ({ billId, payerWalletAddress }) => {
      await billsApi.claimWithWallet(billId, payerWalletAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicBills'] });
      toast.success('Bill succesvol geclaimd!');
    },
    onError: (error) => {
      console.error('Claim bill error:', error);
      toast.error('Kon bill niet claimen: ' + error.message);
    }
  });

  // Nieuwe flow: Submit bewijs van fiat betaling
  const submitProofMutation = useMutation({
    mutationFn: async ({ billId, proofUrl }) => {
      await billsApi.submitPaymentProof(billId, proofUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publicBills'] });
      setSelectedBill(null);
      setShowPaymentFlow(false);
      toast.success('Betaalbewijs succesvol ingediend!');
    },
    onError: (error) => {
      console.error('Submit proof error:', error);
      toast.error('Kon bewijs niet uploaden: ' + error.message);
    }
  });

  // Alleen approved bills tonen (niet claimed)
  const availableBills = bills;

  const handleStartPayment = (bill) => {
    setSelectedBill(bill);
    setShowPaymentFlow(true);
  };

  // Handler voor claim
  const handleClaimBill = async (billId, payerWalletAddress) => {
    await claimBillMutation.mutateAsync({ billId, payerWalletAddress });
  };

  // Handler voor bewijs upload
  const handleSubmitProof = async (billId, proofUrl) => {
    await submitProofMutation.mutateAsync({ billId, proofUrl });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-2 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">Beschikbare Bills</h1>
          <p className="text-gray-400 mt-1">
            Kies een bill om te betalen en ontvang crypto terug
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : availableBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableBills.map(bill => (
              <Card key={bill.id} className="border border-gray-700 bg-gray-800 hover:shadow-xl transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <CardTitle className="text-lg text-gray-100">{bill.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${categoryColors[bill.category]} border`}>
                          {bill.category}
                        </Badge>
                        {bill.status === 'claimed' ? (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Geclaimd
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Beschikbaar
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        ${bill.amount?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {bill.payout_amount && (
                    <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-lg">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-emerald-300">Je ontvangt:</span>
                        <span className="text-emerald-400 font-mono">${bill.payout_amount?.toFixed(2)} {bill.crypto_currency}</span>
                      </div>
                    </div>
                  )}

                  {bill.description && (
                    <p className="text-sm text-gray-300 line-clamp-2">{bill.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(bill.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {bill.crypto_currency || 'USDT'}
                    </div>
                  </div>

                  {bill.proof_image_url && (
                    <a 
                      href={bill.proof_image_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Bekijk bewijs
                    </a>
                  )}

                  <Button
                    onClick={() => handleStartPayment(bill)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Deze Bill Betalen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
            <Receipt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Geen beschikbare bills</h3>
            <p className="text-gray-400">Er zijn momenteel geen bills om te betalen</p>
          </div>
        )}

      </div>

      {/* Payment Flow - Nieuwe Fiat→Crypto flow */}
      <PaymentFlow
        bill={selectedBill}
        isOpen={showPaymentFlow}
        onClose={() => {
          setShowPaymentFlow(false);
          setSelectedBill(null);
        }}
        onClaimBill={handleClaimBill}
        onSubmitProof={handleSubmitProof}
      />
    </div>
  );
}