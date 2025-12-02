/**
 * Calculate fee with optional affiliate discount
 * @param {number} amount - Transaction amount in USD
 * @param {boolean} hasAffiliateDiscount - User has active referral discount
 *
 * Standard Tier Structure:
 * - Under $10,000:      4.4% (2.2% with affiliate)
 * - $10,000 - $20,000:  3.5%
 * - $20,000 - $50,000:  2.8%
 * - $50,000 - $500,000: 1.7%
 * - $500,000 - $1M:     1.2%
 * - Over $1,000,000:    0.8%
 *
 * AFFILIATE DISCOUNT RULES:
 * - Per successful referral: 3 discounted transactions
 * - Volume cap: $10,000 MAX TOTAL across those 3 transactions
 * - Discount: 50% off ONLY on <$10K tier (4.4% → 2.2%)
 * - Minimum referral: Friend must complete >$500 transaction
 * - Max savings per user: ~$220 ($10K × 2.2%)
 */
export function calculateFee(amount, hasAffiliateDiscount = false) {
  const numAmount = parseFloat(amount) || 0;

  let feePercentage;
  let isDiscounted = false;

  if (numAmount < 10000) {
    // Affiliate discount: 50% off standard 4.4%
    feePercentage = hasAffiliateDiscount ? 2.2 : 4.4;
    isDiscounted = hasAffiliateDiscount;
  } else if (numAmount < 20000) {
    feePercentage = 3.5;
  } else if (numAmount < 50000) {
    feePercentage = 2.8;
  } else if (numAmount < 500000) {
    feePercentage = 1.7;
  } else if (numAmount < 1000000) {
    feePercentage = 1.2;
  } else {
    feePercentage = 0.8;
  }

  const feeAmount = numAmount * (feePercentage / 100);
  const payoutAmount = numAmount - feeAmount;

  return {
    feePercentage,
    feeAmount,
    payoutAmount,
    originalAmount: numAmount,
    isDiscounted,
    originalFeePercentage: isDiscounted ? 4.4 : feePercentage,
    savings: isDiscounted ? numAmount * 0.022 : 0 // Savings from 50% discount
  };
}

export function FeeBreakdown({ amount }) {
  const fee = calculateFee(amount);
  
  if (fee.originalAmount === 0) return null;
  
  return (
    <div className="p-4 bg-gradient-to-br from-purple-950 to-indigo-950 rounded-lg border border-purple-700 space-y-3">
      <h4 className="font-semibold text-purple-200 text-sm">Fee Breakdown</h4>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Bill Amount:</span>
          <span className="font-mono">${fee.originalAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-purple-300">
          <span>Platform Fee ({fee.feePercentage}%):</span>
          <span className="font-mono">-${fee.feeAmount.toFixed(2)}</span>
        </div>
        
        <div className="h-px bg-purple-700" />
        
        <div className="flex justify-between text-emerald-400 font-semibold text-base">
          <span>You'll Receive:</span>
          <span className="font-mono">${fee.payoutAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-purple-900 bg-opacity-30 rounded text-xs text-purple-200">
        💡 Lower fees for higher amounts
      </div>
    </div>
  );
}

export function FeeStructureInfo({ showAffiliatePromo = true }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      {/* Affiliate Promo Banner */}
      {showAffiliatePromo && (
        <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-lg border border-emerald-600 text-center">
          <div className="text-3xl font-black text-emerald-300 mb-1">
            UP TO 50% OFF!
          </div>
          <p className="text-emerald-200 text-sm">
            Refer a friend and get massive discounts on fees
          </p>
          <p className="text-emerald-400/60 text-xs mt-2">
            *50% discount on transactions under $10K after successful referral (&gt;$500)
          </p>
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-100 mb-4">Fee Structure</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div>
            <span className="text-gray-300">Under $10,000</span>
            <span className="ml-2 text-xs text-emerald-400">(2.2% with referral)</span>
          </div>
          <span className="font-bold text-purple-400">4.4%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$10,000 - $20,000</span>
          <span className="font-bold text-purple-400">3.5%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$20,000 - $50,000</span>
          <span className="font-bold text-cyan-400">2.8%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$50,000 - $500,000</span>
          <span className="font-bold text-cyan-400">1.7%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$500,000 - $1,000,000</span>
          <span className="font-bold text-emerald-400">1.2%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">Over $1,000,000</span>
          <span className="font-bold text-emerald-400">0.8%</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4">
        Higher amounts get better rates. Refer friends for additional discounts!
      </p>
    </div>
  );
}