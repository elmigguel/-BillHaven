import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/billsApi';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BillCard from '../components/bills/BillCard';
import {
  ArrowLeft,
  PlusCircle,
  Receipt,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Send,
  Loader2,
  Clock,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

export default function MyBills() {
  const [activeTab, setActiveTab] = useState('all');
  const [txHashInputs, setTxHashInputs] = useState({});
  const queryClient = useQueryClient();

  // Mijn bills ophalen
  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['myBills'],
    queryFn: () => billsApi.getMyBills()
  });

  // Bills die wachten op mijn verificatie (als bill maker)
  const { data: awaitingVerification = [] } = useQuery({
    queryKey: ['awaitingVerification'],
    queryFn: () => billsApi.getBillsAwaitingVerification()
  });

  // Confirm crypto sent mutation
  const confirmCryptoMutation = useMutation({
    mutationFn: async ({ billId, txHash }) => {
      await billsApi.confirmCryptoSent(billId, txHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myBills']);
      queryClient.invalidateQueries(['awaitingVerification']);
      toast.success('Crypto verzending bevestigd!');
    },
    onError: (error) => {
      toast.error('Fout: ' + error.message);
    }
  });

  const handleConfirmCrypto = (billId) => {
    const txHash = txHashInputs[billId];
    if (!txHash || txHash.length < 10) {
      toast.error('Voer een geldige transaction hash in');
      return;
    }
    confirmCryptoMutation.mutate({ billId, txHash });
  };

  const filteredBills = activeTab === 'all'
    ? bills
    : bills.filter(b => b.status === activeTab);

  const statusColors = {
    approved: 'bg-emerald-100 text-emerald-700',
    claimed: 'bg-amber-100 text-amber-700',
    fiat_paid: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    pending_approval: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700'
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" className="mb-2 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-100">Mijn Bills</h1>
          </div>
          <Link to={createPageUrl('SubmitBill')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nieuwe Bill
            </Button>
          </Link>
        </div>

        {/* ============ VERIFICATIE SECTIE ============ */}
        {awaitingVerification.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-amber-400">
                Actie Vereist: {awaitingVerification.length} bill(s) wachten op crypto
              </h2>
            </div>

            <div className="space-y-4">
              {awaitingVerification.map(bill => (
                <Card key={bill.id} className="border-amber-700 bg-amber-950/30">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-100">{bill.title}</CardTitle>
                      <Badge className="bg-blue-600 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        Fiat Betaald
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Bedrag:</span>
                        <span className="text-white ml-2">${bill.amount?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Te sturen:</span>
                        <span className="text-emerald-400 ml-2">${bill.payout_amount?.toFixed(2)} {bill.crypto_currency}</span>
                      </div>
                    </div>

                    {/* Payer info */}
                    <div className="p-3 bg-gray-900 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Wallet className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-400">Payer wallet:</span>
                      </div>
                      <code className="text-xs text-purple-300 break-all">{bill.payer_wallet_address}</code>
                    </div>

                    {/* Betaalbewijs */}
                    {bill.fiat_payment_proof_url && (
                      <div className="p-3 bg-blue-950 rounded-lg">
                        <p className="text-sm text-blue-300 mb-2">Bewijs van fiat betaling:</p>
                        <a
                          href={bill.fiat_payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Bekijk betaalbewijs
                        </a>
                      </div>
                    )}

                    {/* TX Hash input */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">
                        Stuur ${bill.payout_amount?.toFixed(2)} {bill.crypto_currency} naar bovenstaand adres, plak TX hash:
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="0x... of txid..."
                          value={txHashInputs[bill.id] || ''}
                          onChange={(e) => setTxHashInputs({
                            ...txHashInputs,
                            [bill.id]: e.target.value
                          })}
                          className="font-mono text-sm bg-gray-900 border-gray-600 text-gray-100 flex-1"
                        />
                        <Button
                          onClick={() => handleConfirmCrypto(bill.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                          disabled={confirmCryptoMutation.isPending}
                        >
                          {confirmCryptoMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Bevestig
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ============ ALLE BILLS ============ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="approved">Beschikbaar</TabsTrigger>
            <TabsTrigger value="claimed">Geclaimd</TabsTrigger>
            <TabsTrigger value="fiat_paid">Fiat Betaald</TabsTrigger>
            <TabsTrigger value="completed">Afgerond</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map(bill => (
              <Card key={bill.id} className="border border-gray-700 bg-gray-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100">{bill.title}</CardTitle>
                    <Badge className={statusColors[bill.status] || 'bg-gray-100 text-gray-700'}>
                      {bill.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Bedrag:</span>
                    <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payout:</span>
                    <span className="text-emerald-400 font-mono">${bill.payout_amount?.toFixed(2)} {bill.crypto_currency}</span>
                  </div>
                  {bill.payer_wallet_address && (
                    <div className="text-xs text-gray-500">
                      Payer: {bill.payer_wallet_address?.slice(0, 8)}...{bill.payer_wallet_address?.slice(-6)}
                    </div>
                  )}
                  {bill.crypto_tx_to_payer && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Crypto verstuurd
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
            <Receipt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              Geen {activeTab !== 'all' ? activeTab : ''} bills gevonden
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'all'
                ? 'Begin met je eerste bill'
                : `Je hebt nog geen ${activeTab} bills`}
            </p>
            <Link to={createPageUrl('SubmitBill')}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Nieuwe Bill
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
