import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Receipt, 
  Calendar, 
  Wallet, 
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Coins
} from 'lucide-react';
import { formatBillDate } from '../../utils/dateUtils';

const statusConfig = {
  pending: { 
    color: 'bg-amber-100 text-amber-800 border-amber-200', 
    icon: Clock,
    iconColor: 'text-amber-600'
  },
  approved: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: CheckCircle2,
    iconColor: 'text-blue-600'
  },
  paid: { 
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
    icon: Coins,
    iconColor: 'text-emerald-600'
  },
  rejected: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    iconColor: 'text-red-600'
  }
};

const categoryColors = {
  rent: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
  utilities: 'bg-cyan-100 text-cyan-700',
  transport: 'bg-indigo-100 text-indigo-700',
  healthcare: 'bg-pink-100 text-pink-700',
  entertainment: 'bg-violet-100 text-violet-700',
  other: 'bg-gray-100 text-gray-700'
};

export default function BillCard({ bill, onViewDetails, showActions = false, onApprove, onReject, onMarkPaid }) {
  const status = statusConfig[bill.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-700 bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-100">{bill.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${categoryColors[bill.category]} border`}>
                {bill.category}
              </Badge>
              <Badge variant="outline" className={`${status.color} border`}>
                <StatusIcon className={`w-3 h-3 mr-1 ${status.iconColor}`} />
                {bill.status}
              </Badge>
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
      <div className="p-2 bg-purple-950 border border-purple-700 rounded-lg">
      <div className="flex justify-between text-xs">
        <span className="text-purple-300">Fee ({bill.fee_percentage}%):</span>
        <span className="text-purple-300 font-mono">${bill.fee_amount?.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-sm font-semibold mt-1">
        <span className="text-emerald-300">Payout:</span>
        <span className="text-emerald-400 font-mono">${bill.payout_amount?.toFixed(2)}</span>
      </div>
      </div>
      )}

      {bill.description && (
      <p className="text-sm text-gray-300 line-clamp-2">{bill.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatBillDate(bill)}
          </div>
          {bill.crypto_wallet_address && (
            <div className="flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {bill.crypto_currency || 'USDT'}
            </div>
          )}
        </div>

        {bill.proof_image_url && (
          <a 
            href={bill.proof_image_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Receipt
          </a>
        )}

        {bill.transaction_hash && (
          <div className="p-2 bg-emerald-950 border border-emerald-700 rounded-lg">
            <p className="text-xs text-emerald-300 font-mono truncate">
              TX: {bill.transaction_hash}
            </p>
          </div>
        )}

        {showActions && bill.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onApprove?.(bill)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button 
              onClick={() => onReject?.(bill)}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {showActions && bill.status === 'approved' && (
          <Button 
            onClick={() => onMarkPaid?.(bill)}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Coins className="w-4 h-4 mr-1" />
            Mark as Paid
          </Button>
        )}

        {!showActions && (
          <Button 
            onClick={() => onViewDetails?.(bill)}
            variant="outline"
            className="w-full mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
            size="sm"
          >
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}