// src/pages/WithdrawPage.jsx
import React, { useState } from "react";
import { ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { useRewards } from "../../context/RewardContext"; // your points context

const WITHDRAWALS_ENABLED = false;

export default function WithdrawPage() {
  const { points } = useRewards(); // current points from context

  // Mock current balance in USD (1 point = $0.01 example → adjust as needed)
  const usdBalance = (points * 0.01).toFixed(2); // $257.30 if points=25730

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  // Available withdraw methods (you can expand)
  const methods = [
    { id: "upi", name: "UPI (Google Pay / PhonePe)", min: 5, fee: 0 },
    { id: "paypal", name: "Cash", min: 10, fee: 2.9 },
    { id: "bank", name: "Bank Transfer", min: 20, fee: 1.5 },
  ];
  ``;
  const handleWithdraw = () => {
    if (!WITHDRAWALS_ENABLED) {
      setError(
        "Withdrawals are not available yet. Your points remain in your account until BharatPlay enables verified payouts.",
      );
      return;
    }

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!selectedMethod) {
      setError("Select a withdrawal method");
      return;
    }
    if (withdrawAmount < selectedMethod.min) {
      setError(`Minimum withdrawal is $${selectedMethod.min}`);
      return;
    }
    if (withdrawAmount > parseFloat(usdBalance)) {
      setError("Insufficient balance");
      return;
    }

    // Here you would call your backend API
    alert(
      `Withdrawal request of $${withdrawAmount.toFixed(2)} via ${selectedMethod.name} submitted!`,
    );
    // Reset form
    setAmount("");
    setSelectedMethod(null);
    setError("");
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
        <div className="bg-linear-to-br from-[#1a1a2e] to-[#0f0f1f] rounded-2xl p-6 mb-6 border border-gray-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm">BharatPlay Points</p>
              <p className="text-4xl font-bold">${usdBalance}</p>
            </div>
            <Wallet size={48} className="text-yellow-400 opacity-80" />
          </div>
          <p className="text-sm text-gray-500">
            Current points are promotional and are not cash until a verified
            BharatPlay payout program is enabled.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-200">
          Withdrawals are not available in this release. Do not send money or
          payment details to anyone claiming to represent BharatPlay. Your
          points remain associated with your account.
        </div>

        {/* Select Method */}
        <h2 className="text-lg font-semibold mb-3">Select Withdrawal Method</h2>
        <div className="space-y-3 mb-8">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method)}
              disabled={!WITHDRAWALS_ENABLED}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                !WITHDRAWALS_ENABLED
                  ? "border-gray-800 bg-[#151515] text-gray-500 cursor-not-allowed"
                  : selectedMethod?.id === method.id
                    ? "border-blue-600 bg-blue-950/30"
                    : "border-gray-700 hover:border-gray-500 bg-[#1a1a1a]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                  {method.id === "upi"
                    ? "₹"
                    : method.id === "paypal"
                      ? "$"
                      : "🏦"}
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
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
              You will receive ≈ $
              {(amount * (1 - selectedMethod.fee / 100)).toFixed(2)} after fee
            </p>
          </div>
        )}

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={
            !WITHDRAWALS_ENABLED ||
            !selectedMethod ||
            !amount ||
            parseFloat(amount) <= 0
          }
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            selectedMethod && amount && parseFloat(amount) > 0
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          {WITHDRAWALS_ENABLED ? "Withdraw Now" : "Withdrawals Unavailable"}
        </button>

        <p className="text-center text-xs text-gray-500 mt-6">
          Any future payout will require account verification, eligibility
          checks, and an active BharatPlay payout provider.
        </p>
      </div>
    </div>
  );
}
