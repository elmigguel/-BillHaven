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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Wallet,
  Clock,
  Loader2,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { escrowService } from '../services/escrowService';
import { ethers } from 'ethers';

export default function DisputeAdmin() {
  const { user, profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState(null);

  // Get all disputed bills
  const { data: disputedBills = [], isLoading } = useQuery({
    queryKey: ['disputedBills'],
    queryFn: async () => {
      const allBills = await billsApi.list();
      return allBills.filter(b => b.disputed === true);
    },
    enabled: isAdmin()
  });

  // Resolve dispute mutation (database update)
  const resolveDbMutation = useMutation({
    mutationFn: async ({ billId, releaseToPayer }) => {
      const newStatus = releaseToPayer ? 'completed' : 'approved';
      await billsApi.update(billId, {
        disputed: false,
        status: newStatus,
        dispute_resolved_at: new Date().toISOString(),
        dispute_resolution: releaseToPayer ? 'released_to_payer' : 'refunded_to_maker'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['disputedBills']);
      toast.success('Dispute opgelost!');
      setResolvingId(null);
    },
    onError: (error) => {
      toast.error('Fout: ' + error.message);
      setResolvingId(null);
    }
  });

  // Resolve via smart contract (if escrow_bill_id exists)
  const handleResolve = async (bill, releaseToPayer) => {
    setResolvingId(bill.id);

    try {
      // If bill has escrow on-chain, resolve via contract
      if (bill.escrow_bill_id && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        await escrowService.resolveDispute(signer, bill.escrow_bill_id, releaseToPayer);
        toast.success('On-chain dispute resolved!');
      }

      // Update database
      await resolveDbMutation.mutateAsync({ billId: bill.id, releaseToPayer });
    } catch (error) {
      toast.error('Fout bij resolve: ' + error.message);
      setResolvingId(null);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="border-red-700 bg-red-950/30">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Geen Toegang</h2>
            <p className="text-gray-400">Deze pagina is alleen voor admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Dispute Admin</h1>
              <p className="text-gray-400">Beheer en los disputes op</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-amber-950/30 border-amber-700">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{disputedBills.length}</p>
                <p className="text-sm text-gray-400">Open Disputes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : disputedBills.length > 0 ? (
          <div className="space-y-6">
            {disputedBills.map(bill => (
              <Card key={bill.id} className="border-amber-700 bg-amber-950/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      {bill.title}
                    </CardTitle>
                    <Badge className="bg-amber-600 text-white">
                      DISPUTE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bill Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 block">Bedrag:</span>
                      <span className="text-white font-mono">${bill.amount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Payout:</span>
                      <span className="text-emerald-400 font-mono">${bill.payout_amount?.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Created:</span>
                      <span className="text-white">{format(new Date(bill.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Status:</span>
                      <span className="text-amber-400">{bill.status}</span>
                    </div>
                  </div>

                  {/* Partijen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Bill Maker (krijgt fiat):</p>
                      <code className="text-xs text-purple-400 break-all">
                        {bill.payout_wallet || 'N/A'}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Payer (krijgt crypto):</p>
                      <code className="text-xs text-emerald-400 break-all">
                        {bill.payer_wallet_address || 'N/A'}
                      </code>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {bill.fiat_payment_proof_url && (
                    <div className="p-3 bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-300 mb-2">Bewijs van Fiat Betaling:</p>
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

                  {/* Dispute Reason */}
                  {bill.dispute_reason && (
                    <div className="p-3 bg-red-950 rounded-lg">
                      <p className="text-sm text-red-300 mb-1">Dispute Reden:</p>
                      <p className="text-sm text-white">{bill.dispute_reason}</p>
                    </div>
                  )}

                  {/* On-chain info */}
                  {bill.escrow_bill_id && (
                    <div className="p-3 bg-purple-950 rounded-lg">
                      <p className="text-xs text-purple-300">
                        <Shield className="w-3 h-3 inline mr-1" />
                        On-chain Escrow Bill ID: #{bill.escrow_bill_id}
                      </p>
                    </div>
                  )}

                  {/* Resolution Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-700">
                    <Button
                      onClick={() => handleResolve(bill, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      disabled={resolvingId === bill.id}
                    >
                      {resolvingId === bill.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Release naar Payer
                    </Button>
                    <Button
                      onClick={() => handleResolve(bill, false)}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-400 hover:bg-red-950"
                      disabled={resolvingId === bill.id}
                    >
                      {resolvingId === bill.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Refund naar Bill Maker
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Geen Open Disputes</h3>
            <p className="text-gray-400">Alle disputes zijn opgelost!</p>
          </div>
        )}
      </div>
    </div>
  );
}
