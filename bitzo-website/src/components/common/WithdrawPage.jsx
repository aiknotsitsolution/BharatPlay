// src/pages/WithdrawPage.jsx
import React, { useState } from 'react';
import { ArrowLeft, Wallet, Copy, Check, AlertCircle } from 'lucide-react';
import { useRewards } from '../../context/RewardContext'; // your points context

export default function WithdrawPage() {
  const { points } = useRewards(); // current points from context

  // Mock current balance in USD (1 point = $0.01 example → adjust as needed)
  const usdBalance = (points * 0.01).toFixed(2); // $257.30 if points=25730

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Available withdraw methods (you can expand)
  const methods = [
    { id: 'upi', name: 'UPI (Google Pay / PhonePe)', min: 5, fee: 0 },
    { id: 'paypal', name: 'Cash', min: 10, fee: 2.9 },
    { id: 'bank', name: 'Bank Transfer', min: 20, fee: 1.5 },
  ];
``
  const handleCopyUPI = () => {
    navigator.clipboard.writeText('aditya@upi'); // replace with real UPI ID
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!selectedMethod) {
      setError('Select a withdrawal method');
      return;
    }
    if (withdrawAmount < selectedMethod.min) {
      setError(`Minimum withdrawal is $${selectedMethod.min}`);
      return;
    }
    if (withdrawAmount > parseFloat(usdBalance)) {
      setError('Insufficient balance');
      return;
    }

    // Here you would call your backend API
    alert(`Withdrawal request of $${withdrawAmount.toFixed(2)} via ${selectedMethod.name} submitted!`);
    // Reset form
    setAmount('');
    setSelectedMethod(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-gray-800 h-14 flex items-center px-4">
        <button className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-4">Withdraw</h1>
      </div>

      <div className="pt-20 px-4 max-w-md mx-auto">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1f] rounded-2xl p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-4xl font-bold">${usdBalance}</p>
            </div>
            <Wallet size={48} className="text-yellow-400 opacity-80" />
          </div>
          <p className="text-sm text-gray-500">
            ≈ {points.toFixed(2)} Bharat Play Points (1 point = $0.01)
          </p>
        </div>

        {/* Select Method */}
        <h2 className="text-lg font-semibold mb-3">Select Withdrawal Method</h2>
        <div className="space-y-3 mb-8">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method)}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                selectedMethod?.id === method.id
                  ? 'border-blue-600 bg-blue-950/30'
                  : 'border-gray-700 hover:border-gray-500 bg-[#1a1a1a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  {method.id === 'upi' ? '₹' : method.id === 'paypal' ? '$' : '🏦'}
                </div>
                <div className="text-left">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-xs text-gray-400">
                    Min: ${method.min} • Fee: ${method.fee}%
                  </p>
                </div>
              </div>
              {selectedMethod?.id === method.id && (
                <Check size={20} className="text-blue-500" />
              )}
            </button>
          ))}
        </div>

        {/* Amount Input */}
        {selectedMethod && (
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Amount to Withdraw (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl py-3.5 pl-10 pr-4 text-xl focus:outline-none focus:border-blue-600"
                step="0.01"
                min="0"
              />
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              You will receive ≈ ${(amount * (1 - selectedMethod.fee / 100)).toFixed(2)} after fee
            </p>
          </div>
        )}

        {/* UPI Specific (example) */}
        {selectedMethod?.id === 'upi' && (
          <div className="bg-[#1a1a1a] p-4 rounded-xl mb-8">
            <p className="text-sm mb-2">Send to UPI ID:</p>
            <div className="flex items-center justify-between bg-[#272727] p-3 rounded-lg">
              <span className="font-medium">aditya@upi</span>
              <button onClick={handleCopyUPI} className="text-blue-400 hover:text-blue-300">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Send exact amount and share screenshot in support
            </p>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={!selectedMethod || !amount || parseFloat(amount) <= 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            selectedMethod && amount && parseFloat(amount) > 0
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Withdraw Now
        </button>

        <p className="text-center text-xs text-gray-500 mt-6">
          Processing time: 1–3 business days • First withdrawal may take longer for verification
        </p>
      </div>
    </div>
  );
}