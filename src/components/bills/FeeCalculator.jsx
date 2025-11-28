export function calculateFee(amount) {
  const numAmount = parseFloat(amount) || 0;
  
  let feePercentage;
  
  if (numAmount < 10000) {
    feePercentage = 4.4;
  } else if (numAmount < 20000) {
    feePercentage = 3.5;
  } else if (numAmount < 100000) {
    feePercentage = 2.6;
  } else if (numAmount < 1000000) {
    feePercentage = 1.7;
  } else {
    feePercentage = 0.8;
  }
  
  const feeAmount = numAmount * (feePercentage / 100);
  const payoutAmount = numAmount - feeAmount;
  
  return {
    feePercentage,
    feeAmount,
    payoutAmount,
    originalAmount: numAmount
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

export function FeeStructureInfo() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-100 mb-4">Fee Structure</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">Under $10,000</span>
          <span className="font-bold text-purple-400">4.4%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$10,000 - $20,000</span>
          <span className="font-bold text-purple-400">3.5%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$20,000 - $100,000</span>
          <span className="font-bold text-cyan-400">2.6%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">$100,000 - $1,000,000</span>
          <span className="font-bold text-emerald-400">1.7%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
          <span className="text-gray-300">Over $1,000,000</span>
          <span className="font-bold text-emerald-400">0.8%</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-4">
        Higher amounts get better rates. All fees are transparently calculated.
      </p>
    </div>
  );
}