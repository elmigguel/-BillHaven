import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { billsApi } from '../api/billsApi';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import StatsCard from '../components/dashboard/StatsCard';
import BillCard from '../components/bills/BillCard';
import {
  PlusCircle,
  Receipt,
  Clock,
  CheckCircle2,
  Wallet,
  DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: () => billsApi.list(),
    // FIX: Only fetch bills when user is loaded
    enabled: !!user && !authLoading
  });

  // FIX: Guard against user being null during initial load
  const myBills = user?.id ? bills.filter(b => b.user_id === user.id) : [];
  const pendingBills = myBills.filter(b => b.status === 'pending');
  const approvedBills = myBills.filter(b => b.status === 'approved');
  const paidBills = myBills.filter(b => b.status === 'paid');

  // Wereldwijde openstaande bills (pending + approved)
  const allOpenBills = bills.filter(b => b.status === 'pending' || b.status === 'approved');
  
  const totalSubmitted = myBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const totalPaid = paidBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  const recentBills = myBills.slice(0, 4);

  return (
    <motion.div
      className="min-h-screen bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 mb-2">
            Bill Haven
          </h1>
          <p className="text-gray-400">
            Submit your bills and get reimbursed in cryptocurrency
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link to={createPageUrl('SubmitBill')} className="block">
            <Button className="w-full h-16 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
              <PlusCircle className="w-5 h-5 mr-2" />
              Submit New Bill
            </Button>
          </Link>
          <Link to={createPageUrl('MyBills')} className="block">
            <Button className="w-full h-16 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-lg shadow-lg hover:shadow-cyan-500/50 transition-all duration-300">
              <Receipt className="w-5 h-5 mr-2" />
              My Bills
            </Button>
          </Link>
          <Link to={createPageUrl('FeeStructure')} className="block">
            <Button className="w-full h-16 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-lg shadow-lg hover:shadow-emerald-500/50 transition-all duration-300">
              <DollarSign className="w-5 h-5 mr-2" />
              Fee Structure
            </Button>
          </Link>
          <Link to={createPageUrl('ReviewBills')} className="block">
            <Button className="w-full h-16 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Review Bills
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Submitted"
            value={`$${totalSubmitted.toFixed(2)}`}
            icon={DollarSign}
            color="bg-indigo-500"
            subtitle={`${myBills.length} bills`}
            index={0}
          />
          <StatsCard
            title="Pending Review"
            value={pendingBills.length}
            icon={Clock}
            color="bg-amber-500"
            subtitle={`$${pendingBills.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)}`}
            index={1}
          />
          <StatsCard
            title="Approved"
            value={approvedBills.length}
            icon={CheckCircle2}
            color="bg-cyan-500"
            subtitle={`$${approvedBills.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)}`}
            index={2}
          />
          <StatsCard
            title="Total Paid"
            value={`$${totalPaid.toFixed(2)}`}
            icon={Wallet}
            color="bg-emerald-500"
            subtitle={`${paidBills.length} transactions`}
            index={3}
          />
        </div>

        {/* Wereldwijde Openstaande Bills */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Alle Openstaande Bills</h2>
            <span className="text-sm text-gray-400">
              {allOpenBills.length} openstaand • ${allOpenBills.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)} totaal
            </span>
          </div>

          {allOpenBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allOpenBills.slice(0, 8).map(bill => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg border border-gray-700">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-300">Geen openstaande bills</p>
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Mijn Recente Bills</h2>
            <Link to={createPageUrl('MyBills')}>
              <Button variant="ghost" className="text-gray-300 hover:bg-gray-800">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : recentBills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentBills.map(bill => (
                <BillCard key={bill.id} bill={bill} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
              <Receipt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">No bills yet</h3>
              <p className="text-gray-400 mb-4">Get started by submitting your first bill</p>
              <Link to={createPageUrl('SubmitBill')}>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Submit Bill
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}