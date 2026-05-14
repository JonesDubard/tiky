"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Loader2, BarChart2, User,
} from "lucide-react";
import { useSession } from "next-auth/react";

export type VoteBlockReason = 'not_logged_in' | 'no_ticket' | null

interface PollOption {
  id: string;
  text: string;
  votes: number;
  imageUrl?: string | null;
}

interface ResultOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  imageUrl?: string | null;
}

interface PollVotingProps {
  pollId: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  pollType: string;
  votePrice?: number | null;
}

function PollSkeleton({ optionCount }: { optionCount: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: optionCount }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PollVoting({
  pollId,
  options,
  totalVotes: initialTotal,
  isActive,
  pollType,
  votePrice,
}: PollVotingProps) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<ResultOption[] | null>(null);
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [hasVotedAtLeastOnce, setHasVotedAtLeastOnce] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const isPaidPoll = votePrice && votePrice > 0;
  const totalPrice = isPaidPoll ? votePrice! * quantity : 0;

  // Device ID for guest voting
  const [deviceId, setDeviceId] = useState<string>('');

  // In‑page payment
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [countdown, setCountdown] = useState(120);

  // Phone number prompt for paid votes
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<'mtn_momo' | 'orange_money' | null>(null);

  useEffect(() => {
    let id = localStorage.getItem('tiky_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('tiky_device_id', id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (authStatus === 'loading') return;
    let cancelled = false;
    const loadData = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/results`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const merged = (data.results ?? []).map((r: ResultOption) => ({
            ...r,
            imageUrl: options.find(o => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
          }));
          setResults(merged);
          setTotalVotes(data.totalVotes);
        }
      } catch {}
      finally {
        if (!cancelled) setIsLoadingData(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [pollId, authStatus, options]);

  // Poll payment status
  useEffect(() => {
    if (!paymentId || paymentStatus !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${paymentId}`);
        const data = await res.json();
        if (data.orderStatus === 'COMPLETED') {
          setPaymentStatus('completed');
          const resultsRes = await fetch(`/api/polls/${pollId}/results`);
          const resultsData = await resultsRes.json();
          if (resultsData.results) {
            const merged = resultsData.results.map((r: ResultOption) => ({
              ...r,
              imageUrl: options.find(o => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
            }));
            setResults(merged);
            setTotalVotes(resultsData.totalVotes ?? 0);
          }
          setToast({ msg: 'Your votes have been added! 🎉', type: 'success' });
          setTimeout(() => setToast(null), 5000);
          setSelected(null);
          setQuantity(1);
        } else if (data.orderStatus === 'FAILED') {
          setPaymentStatus('failed');
          setToast({ msg: 'Payment failed. Please try again.', type: 'error' });
        }
        setCountdown(prev => prev - 1);
        if (data.orderStatus !== 'PENDING') {
          clearInterval(interval);
        }
      } catch (err) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId, paymentStatus, pollId, options]);

  const handleBuyVotes = async (method: 'mtn_momo' | 'orange_money') => {
  if (!selected) {
    setToast({ msg: 'Please select a contestant first', type: 'error' });
    return;
  }
  // Show phone input UI instead of prompt()
  setPendingMethod(method);
  setShowPhoneInput(true);
};

const handleConfirmPayment = async () => {
  if (!phoneNumber.trim() || !pendingMethod || !selected) return;
  setShowPhoneInput(false);
  setLoading(true);
  try {
    const res = await fetch('/api/poll-votes/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pollId,
        optionId: selected,
        quantity,
        phoneNumber: phoneNumber.trim(),
        paymentMethod: pendingMethod,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Initiation failed');
    setPaymentId(data.paymentId);
    setPaymentStatus('pending');
    setCountdown(120);
    setPhoneNumber('');
    setPendingMethod(null);
  } catch (err: any) {
    setToast({ msg: err.message, type: 'error' });
  } finally {
    setLoading(false);
  }
};

  const handleFreeVote = async () => {
    if (!selected) {
      setToast({ msg: 'Please select an option', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selected, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Vote failed')

      setHasVotedAtLeastOnce(true);
      if (data.results) {
        const merged = (data.results ?? []).map((r: ResultOption) => ({
          ...r,
          imageUrl: options.find(o => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
        }));
        setResults(merged);
        setTotalVotes(data.totalVotes);
      }
      setToast({ msg: 'Vote recorded! 🎉', type: 'success' });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) return <PollSkeleton optionCount={options.length} />;

  const displayOptions = results
    ? [...results].sort((a, b) => b.votes - a.votes)
    : options.map(o => ({
        ...o,
        percentage: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
      }));

  const showResults = hasVotedAtLeastOnce || !isActive;
  const canInteract = isActive;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Cast Your Vote</h2>
        </div>
        <span className="text-sm text-gray-500">{totalVotes} vote{totalVotes !== 1 && 's'}</span>
      </div>

      {/* No login restriction — guests welcome */}
      {isPaidPoll ? (
        <div className="space-y-3">
          {displayOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              disabled={!canInteract || loading}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected === option.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {option.imageUrl ? (
                  <img src={option.imageUrl} className="w-10 h-10 rounded-full object-cover" />
                ) : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">👤</div>}
                <span className="font-semibold">{option.text}</span>
              </div>
            </button>
          ))}
          <div className="flex items-center gap-4 mt-4">
            <label className="text-sm font-medium">Quantity:</label>
            <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="px-2 py-1 bg-gray-200 rounded-lg">−</button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button onClick={() => setQuantity(q => q+1)} className="px-2 py-1 bg-gray-200 rounded-lg">+</button>
            <span className="ml-auto text-sm">Total: ${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleBuyVotes('mtn_momo')} disabled={loading || !selected}
              className="flex-1 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl disabled:opacity-50">
              Pay with MoMo
            </button>
            <button
            disabled
            title="Coming soon"
            className="flex-1 py-3 bg-gray-200 text-gray-400 font-bold rounded-xl cursor-not-allowed">
            Orange Money (Coming Soon)
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                disabled={!canInteract || hasVotedAtLeastOnce || loading}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected === option.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  {option.imageUrl ? (
                    <img src={option.imageUrl} className="w-10 h-10 rounded-full" />
                  ) : <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">👤</div>}
                  <span className="font-semibold">{option.text}</span>
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleFreeVote} disabled={!selected || loading || hasVotedAtLeastOnce}
            className="mt-6 w-full py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-50">
            {loading ? 'Submitting…' : 'Submit Vote'}
          </button>
        </>
      )}

      {showResults && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold">Live Results</h3>
          {displayOptions.map(option => (
            <div key={option.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <span className="font-medium flex-1">{option.text}</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${option.percentage}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">{option.votes} vote{option.votes !== 1 && 's'} ({option.percentage}%)</span>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400 mt-2">Total votes: {totalVotes}</p>
        </div>
      )}

      {/* Phone number modal */}
{showPhoneInput && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <h3 className="font-bold text-lg mb-1">Enter your phone number</h3>
      <p className="text-sm text-gray-500 mb-4">
        We'll send a {pendingMethod === 'mtn_momo' ? 'MoMo' : 'Orange Money'} payment request to this number.
      </p>
      <input
        type="tel"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        placeholder="e.g. 0886123456"
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleConfirmPayment(); }}
      />
      <div className="flex gap-3">
        <button
          onClick={() => { setShowPhoneInput(false); setPhoneNumber(''); setPendingMethod(null); }}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmPayment}
          disabled={!phoneNumber.trim()}
          className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-50 hover:bg-orange-600 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

      {/* In‑page payment overlay */}
      {paymentStatus === 'pending' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-xs text-center shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Confirm your payment</h3>
            <p className="text-sm text-gray-500 mb-4">Open the prompt on your phone and enter your PIN.</p>
            <div className="text-2xl font-bold text-gray-700">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            <button onClick={() => { setPaymentStatus(null); setPaymentId(null); }} className="mt-4 text-sm text-red-500 underline">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}