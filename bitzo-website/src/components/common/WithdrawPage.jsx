import React from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRewards } from "../../context/useRewards";

export default function WithdrawPage() {
  const { points } = useRewards();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 text-white">
      <header className="flex h-14 items-center border-b border-gray-800 px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 p-2"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-4 text-xl font-bold">Rewards</h1>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <section className="mb-6 rounded-2xl border border-gray-700 bg-linear-to-br from-[#1a1a2e] to-[#0f0f1f] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Loyalty Points</p>
              <p className="text-4xl font-bold">
                {Number(points || 0).toLocaleString()}
              </p>
            </div>
            <Wallet size={44} className="text-yellow-400 opacity-80" />
          </div>
          <p className="text-sm leading-relaxed text-gray-400">
            Points are promotional loyalty rewards and do not have a guaranteed
            cash value.
          </p>
        </section>

        <section
          role="status"
          className="mb-6 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-200"
        >
          Withdrawals are currently unavailable. Do not send money or payment
          details to anyone claiming to represent VidBux.
        </section>

        <section className="space-y-3 rounded-xl border border-gray-800 bg-[#151515] p-5">
          <h2 className="text-lg font-semibold">Withdrawal information</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            If a verified payout program becomes available, the minimum
            redemption threshold will be ₹100. Approved requests may take
            45–60 days to process. These are not guarantees of eligibility,
            approval, or payment.
          </p>
          <p className="text-xs leading-relaxed text-gray-500">
            Until payouts are enabled, points cannot be withdrawn or exchanged
            for cash. Any future redemption will be subject to verification,
            program rules, and the payout options shown in the app.
          </p>
        </section>
      </main>
    </div>
  );
}
