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
  Wallet,
  Shield,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '../contexts/WalletContext';
import { escrowService } from '../services/escrowService';

export default function MyBills() {
  const [activeTab, setActiveTab] = useState('all');
  const [txHashInputs, setTxHashInputs] = useState({});
  const [isReleasingEscrow, setIsReleasingEscrow] = useState({});
  const queryClient = useQueryClient();

  // FIX: Safe destructuring with defaults
  const wallet = useWallet() || {};
  const {
    signer = null,
    isConnected = false,
    isCorrectNetwork = () => false,
    getExplorerUrl = () => '#',
    chainId = null
  } = wallet;

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
      queryClient.invalidateQueries({ queryKey: ['myBills'] });
      queryClient.invalidateQueries({ queryKey: ['awaitingVerification'] });
      toast.success('Crypto transfer confirmed!');
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    }
  });

  const handleConfirmCrypto = (billId) => {
    const txHash = txHashInputs[billId];
    if (!txHash || txHash.length < 10) {
      toast.error('Enter a valid transaction hash');
      return;
    }
    confirmCryptoMutation.mutate({ billId, txHash });
  };

  // Release escrow on-chain (confirm fiat payment received)
  const handleReleaseEscrow = async (bill) => {
    if (!isConnected) {
      toast.error('Connect your wallet first');
      return;
    }

    if (!isCorrectNetwork()) {
      toast.error('Switch to Polygon Amoy or Polygon Mainnet');
      return;
    }

    if (!bill.escrow_bill_id) {
      toast.error('No escrow ID found for this bill');
      return;
    }

    setIsReleasingEscrow(prev => ({ ...prev, [bill.id]: true }));

    try {
      toast.info('Confirm the transaction in your wallet...');

      // Call escrow contract to confirm fiat payment and release crypto
      const result = await escrowService.confirmFiatPayment(signer, bill.escrow_bill_id);

      // Update database
      await billsApi.confirmCryptoSent(bill.id, result.txHash);

      queryClient.invalidateQueries({ queryKey: ['myBills'] });
      queryClient.invalidateQueries({ queryKey: ['awaitingVerification'] });

      toast.success('Escrow released! Crypto has been sent to the payer.');
    } catch (error) {
      console.error('Error releasing escrow:', error);

      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('Transaction rejected in wallet');
      } else if (error.message?.includes('not claimed')) {
        toast.error('Bill has not been claimed yet');
      } else {
        toast.error('Error releasing escrow: ' + error.message);
      }
    } finally {
      setIsReleasingEscrow(prev => ({ ...prev, [bill.id]: false }));
    }
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
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-100">My Bills</h1>
          </div>
          <Link to={createPageUrl('SubmitBill')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Bill
            </Button>
          </Link>
        </div>

        {/* ============ VERIFICATIE SECTIE ============ */}
        {awaitingVerification.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-amber-400">
                Action Required: {awaitingVerification.length} bill(s) waiting for crypto
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
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white ml-2">${bill.amount?.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">To send:</span>
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

                    {/* Payment Proof */}
                    {bill.fiat_payment_proof_url && (
                      <div className="p-3 bg-blue-950 rounded-lg">
                        <p className="text-sm text-blue-300 mb-2">Proof of fiat payment:</p>
                        <a
                          href={bill.fiat_payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View payment proof
                        </a>
                      </div>
                    )}

                    {/* Escrow Release Button (if bill has escrow) */}
                    {bill.escrow_bill_id ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-950 rounded-lg border border-purple-700">
                          <div className="flex items-center gap-2 text-sm text-purple-300 mb-2">
                            <Shield className="w-4 h-4" />
                            Escrow Contract Active
                          </div>
                          <div className="text-xs text-purple-400 space-y-1">
                            <div>Escrow ID: #{bill.escrow_bill_id}</div>
                            {bill.escrow_tx_hash && (
                              <a
                                href={getExplorerUrl('tx', bill.escrow_tx_hash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                              >
                                <LinkIcon className="w-3 h-3" />
                                View escrow transaction
                              </a>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleReleaseEscrow(bill)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          disabled={isReleasingEscrow[bill.id] || !isConnected || !isCorrectNetwork()}
                        >
                          {isReleasingEscrow[bill.id] ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Releasing escrow...</>
                          ) : !isConnected ? (
                            'Connect Wallet to Release Escrow'
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Fiat Received - Release Escrow
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          This releases ${bill.payout_amount?.toFixed(2)} {bill.crypto_currency} to the payer
                        </p>
                      </div>
                    ) : (
                      /* Legacy: Manual TX Hash input (for bills without escrow) */
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">
                          Send ${bill.payout_amount?.toFixed(2)} {bill.crypto_currency} to the above address, paste TX hash:
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
                                Confirm
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ============ ALLE BILLS ============ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="approved">Available</TabsTrigger>
            <TabsTrigger value="claimed">Claimed</TabsTrigger>
            <TabsTrigger value="fiat_paid">Fiat Paid</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
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
                    <div className="flex items-center gap-2">
                      {bill.escrow_bill_id && (
                        <Badge className="bg-purple-600 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Escrow
                        </Badge>
                      )}
                      <Badge className={statusColors[bill.status] || 'bg-gray-100 text-gray-700'}>
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Payout:</span>
                    <span className="text-emerald-400 font-mono">${bill.payout_amount?.toFixed(2)} {bill.crypto_currency}</span>
                  </div>
                  {/* Escrow Info */}
                  {bill.escrow_bill_id && (
                    <div className="p-2 bg-purple-950/50 rounded border border-purple-800/50 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-400">Escrow ID:</span>
                        <span className="text-purple-300 font-mono">#{bill.escrow_bill_id}</span>
                      </div>
                      {bill.escrow_tx_hash && (
                        <a
                          href={getExplorerUrl('tx', bill.escrow_tx_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View transaction
                        </a>
                      )}
                    </div>
                  )}
                  {bill.payer_wallet_address && (
                    <div className="text-xs text-gray-500">
                      Payer: {bill.payer_wallet_address?.slice(0, 8)}...{bill.payer_wallet_address?.slice(-6)}
                    </div>
                  )}
                  {bill.crypto_tx_to_payer && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Crypto sent
                      <a
                        href={getExplorerUrl('tx', bill.crypto_tx_to_payer)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
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
              No {activeTab !== 'all' ? activeTab : ''} bills found
            </h3>
            <p className="text-gray-400 mb-4">
              {activeTab === 'all'
                ? 'Start with your first bill'
                : `You don't have any ${activeTab} bills yet`}
            </p>
            <Link to={createPageUrl('SubmitBill')}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Bill
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
