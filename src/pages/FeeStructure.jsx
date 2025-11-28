import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingDown, DollarSign } from 'lucide-react';
import { FeeStructureInfo } from '../components/bills/FeeCalculator';

export default function FeeStructure() {
  const examples = [
    { amount: 500, fee: 4.4, feeAmount: 22, payout: 478 },
    { amount: 5000, fee: 4.4, feeAmount: 220, payout: 4780 },
    { amount: 15000, fee: 3.5, feeAmount: 525, payout: 14475 },
    { amount: 50000, fee: 2.6, feeAmount: 1300, payout: 48700 },
    { amount: 500000, fee: 1.7, feeAmount: 8500, payout: 491500 },
    { amount: 2000000, fee: 0.8, feeAmount: 16000, payout: 1984000 },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-6 text-gray-300 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 mb-2">
            Fee Structure
          </h1>
          <p className="text-gray-400">
            Transparent pricing that scales with your transaction size
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-6 border border-purple-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Volume Discounts</h3>
            </div>
            <p className="text-purple-200">
              The more you transact, the less you pay. Our tiered fee structure rewards larger transactions with significantly lower rates.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-lg p-6 border border-emerald-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-600 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Transparent Pricing</h3>
            </div>
            <p className="text-emerald-200">
              No hidden fees. What you see is what you pay. All fees are calculated and shown before you submit your bill.
            </p>
          </div>
        </div>

        <FeeStructureInfo />

        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-100 mb-4">Example Calculations</h3>
          <div className="space-y-3">
            {examples.map((example, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                <div>
                  <span className="text-gray-400 text-sm">Bill Amount:</span>
                  <span className="ml-2 text-white font-semibold text-lg">${example.amount.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <span className="text-purple-400 text-sm">Fee: {example.fee}%</span>
                  <br />
                  <span className="text-purple-300 text-xs">${example.feeAmount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 text-sm">You Receive:</span>
                  <br />
                  <span className="text-emerald-400 font-bold text-lg">${example.payout.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg border border-purple-700">
          <h3 className="text-lg font-bold text-white mb-2">Ready to get started?</h3>
          <p className="text-purple-200 mb-4">Submit your first bill and experience fast crypto reimbursement.</p>
          <Link to={createPageUrl('SubmitBill')}>
            <Button className="bg-white text-purple-900 hover:bg-gray-100">
              Submit a Bill
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}