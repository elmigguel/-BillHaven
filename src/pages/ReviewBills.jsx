import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billsApi } from '../api/billsApi';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import BillCard from '../components/bills/BillCard';
import { ArrowLeft, Receipt } from 'lucide-react';

export default function ReviewBills() {
  const [activeTab, setActiveTab] = useState('pending_approval');
  const [selectedBill, setSelectedBill] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [notes, setNotes] = useState('');
  const [transactionHash, setTransactionHash] = useState('');

  const queryClient = useQueryClient();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['allBills'],
    queryFn: () => billsApi.list()
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, updates }) => billsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBills'] });
      setSelectedBill(null);
      setActionType(null);
      setNotes('');
      setTransactionHash('');
    }
  });

  const handleApprove = (bill) => {
    setSelectedBill(bill);
    setActionType('approve');
  };

  const handleReject = (bill) => {
    setSelectedBill(bill);
    setActionType('reject');
  };

  const handleMarkPaid = (bill) => {
    setSelectedBill(bill);
    setActionType('paid');
  };

  const confirmAction = () => {
    if (!selectedBill) return;

    const updates = {
      reviewer_notes: notes
    };

    if (actionType === 'approve') {
      updates.status = 'approved';
    } else if (actionType === 'reject') {
      updates.status = 'rejected';
    } else if (actionType === 'paid') {
      updates.status = 'paid';
      updates.payment_tx_hash = transactionHash;
    }

    updateBillMutation.mutate({ id: selectedBill.id, updates });
  };

  const filteredBills = bills.filter(b => b.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-2 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">Review Bills</h1>
          <p className="text-gray-400 mt-1">Approve bills and process crypto payments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="pending_approval">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : filteredBills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map(bill => (
              <BillCard 
                key={bill.id} 
                bill={bill}
                showActions={true}
                onApprove={handleApprove}
                onReject={handleReject}
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
            <Receipt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-200 mb-2">
              No {activeTab} bills
            </h3>
            <p className="text-gray-400">
              There are no bills with status: {activeTab}
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Bill'}
              {actionType === 'reject' && 'Reject Bill'}
              {actionType === 'paid' && 'Mark as Paid'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedBill && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bill:</span>
                  <span className="font-semibold">{selectedBill.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="font-semibold">${selectedBill.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wallet:</span>
                  <span className="font-mono text-xs truncate max-w-[200px]">
                    {selectedBill.crypto_wallet_address}
                  </span>
                </div>
              </div>
            )}

            {actionType === 'paid' && (
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash *</Label>
                <Input
                  id="txHash"
                  placeholder="0x..."
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes {actionType === 'reject' && '*'}</Label>
              <Textarea
                id="notes"
                placeholder="Add notes or reason..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                updateBillMutation.isPending ||
                (actionType === 'reject' && !notes) ||
                (actionType === 'paid' && !transactionHash)
              }
              className={
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-indigo-600 hover:bg-indigo-700'
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}