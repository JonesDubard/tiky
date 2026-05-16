"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, BarChart2, Trophy, Minus, Plus } from "lucide-react";
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
  const { status: authStatus } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<ResultOption[] | null>(null);
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [hasVotedAtLeastOnce, setHasVotedAtLeastOnce] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [justVotedOptionId, setJustVotedOptionId] = useState<string | null>(null);

  const isPaidPoll = votePrice && votePrice > 0;
  const totalPrice = isPaidPoll ? votePrice! * quantity : 0;

  const [deviceId, setDeviceId] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<'mtn_momo' | 'orange_money' | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; }, [options]);

  useEffect(() => {
    let id = localStorage.getItem('tiky_device_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('tiky_device_id', id); }
    setDeviceId(id);
  }, []);

  // Fetch fresh results — always bypass cache
  const refreshResults = async () => {
    try {
      const res = await fetch(`/api/polls/${pollId}/results`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const merged = (data.results ?? []).map((r: ResultOption) => ({
        ...r,
        imageUrl: optionsRef.current.find(o => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
      }));
      setResults(merged);
      setTotalVotes(data.totalVotes ?? 0);
    } catch {}
  };

  useEffect(() => {
    if (authStatus === 'loading') return;
    let cancelled = false;
    const loadData = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/results`, { cache: 'no-store' });
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
      finally { if (!cancelled) setIsLoadingData(false); }
    };
    loadData();
    return () => { cancelled = true; };
  }, [pollId, authStatus]);

  useEffect(() => {
    if (!paymentId || paymentStatus !== 'pending') return;
    console.log('[POLL] Starting polling for', paymentId);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${paymentId}`, { cache: 'no-store' });
        const data = await res.json();
        console.log('[POLL] status:', data.orderStatus);

        if (data.orderStatus === 'COMPLETED') {
          clearInterval(interval);
          clearInterval(ticker);
          clearTimeout(timeout);
          setPaymentStatus('completed');
          setHasVotedAtLeastOnce(true);
          setJustVotedOptionId(selected);

          // Optimistically add the votes to results immediately
          setResults(prev => {
            if (!prev || !selected) return prev;
            const updated = prev.map(r =>
              r.id === selected ? { ...r, votes: r.votes + quantity } : r
            );
            const newTotal = updated.reduce((sum, r) => sum + r.votes, 0);
            return updated.map(r => ({
              ...r,
              percentage: newTotal > 0 ? Math.round((r.votes / newTotal) * 100) : 0,
            }));
          });
          setTotalVotes(prev => prev + quantity);

          // Then fetch real results to confirm
          setTimeout(refreshResults, 1500);

          setToast({ msg: `🎉 ${quantity} vote${quantity > 1 ? 's' : ''} added successfully!`, type: 'success' });
          setTimeout(() => setToast(null), 5000);
          setSelected(null);
          setQuantity(1);
        } else if (data.orderStatus === 'FAILED') {
          clearInterval(interval);
          setPaymentStatus('failed');
          setToast({ msg: 'Payment failed. Please try again.', type: 'error' });
        }
      } catch {
        console.log('[POLL] Network error, will retry...');
      }
    }, 4000);

    const ticker = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      clearInterval(ticker);
      setPaymentStatus(null);
      setPaymentId(null);
      setCountdown(120);
      setToast({ msg: 'Payment timed out. Check your MoMo and try again.', type: 'error' });
    }, 180_000);

    return () => { clearInterval(interval); clearInterval(ticker); clearTimeout(timeout); };
  }, [paymentId]);

  const handleBuyVotes = (method: 'mtn_momo' | 'orange_money') => {
    if (!selected) { setToast({ msg: 'Please select a contestant first', type: 'error' }); return; }
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
        body: JSON.stringify({ pollId, optionId: selected, quantity, phoneNumber: phoneNumber.trim(), paymentMethod: pendingMethod }),
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
    if (!selected) { setToast({ msg: 'Please select an option', type: 'error' }); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: selected, deviceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Vote failed');
      setHasVotedAtLeastOnce(true);
      setJustVotedOptionId(selected);
      if (data.results) {
        const merged = (data.results ?? []).map((r: ResultOption) => ({
          ...r,
          imageUrl: optionsRef.current.find(o => o.id === r.id)?.imageUrl ?? r.imageUrl ?? null,
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
  const leaderId = displayOptions[0]?.id;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Cast Your Vote</h2>
        </div>
        <span className="text-sm text-gray-500">{totalVotes.toLocaleString()} vote{totalVotes !== 1 && 's'}</span>
      </div>

      {isPaidPoll ? (
        <div className="space-y-3">
          {displayOptions.map((option, idx) => {
            const isSelected = selected === option.id;
            const isLeader = showResults && option.id === leaderId && option.votes > 0;
            const justVoted = justVotedOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => canInteract && !loading && setSelected(option.id)}
                disabled={!canInteract || loading}
                className={`w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : justVoted
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {/* Progress bar background for results */}
                <div className="relative">
                  {showResults && option.percentage > 0 && (
                    <div
                      className="absolute inset-0 bg-orange-50 transition-all duration-700"
                      style={{ width: `${option.percentage}%` }}
                    />
                  )}
                  <div className="relative p-4 flex items-center gap-3">
                    {option.imageUrl ? (
                      <img src={option.imageUrl} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm" alt={option.text} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">👤</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{option.text}</span>
                        {isLeader && <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                        {justVoted && !isLeader && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                      </div>
                      {showResults && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm text-gray-500">
                            {option.votes.toLocaleString()} vote{option.votes !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs font-semibold text-orange-600">
                            {option.percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quantity + price selector — styled like event page */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Number of votes</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                  aria-label="Decrease"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center font-bold text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                  aria-label="Increase"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {quantity} vote{quantity !== 1 ? 's' : ''} × ${votePrice!.toFixed(2)}
              </span>
              <span className="text-base font-bold text-blue-700">
                Total: ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => handleBuyVotes('mtn_momo')}
              disabled={loading || !selected}
              className="flex-1 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl disabled:opacity-50 hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay with MoMo'}
            </button>
            <button disabled title="Coming soon" className="flex-1 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed text-sm">
              Orange Money<br /><span className="text-xs font-normal">Coming Soon</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayOptions.map(option => {
              const isSelected = selected === option.id;
              const justVoted = justVotedOptionId === option.id;
              const isLeader = showResults && option.id === leaderId && option.votes > 0;

              return (
                <button
                  key={option.id}
                  onClick={() => setSelected(option.id)}
                  disabled={!canInteract || hasVotedAtLeastOnce || loading}
                  className={`w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    isSelected || justVoted ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-60`}
                >
                  <div className="relative">
                    {showResults && option.percentage > 0 && (
                      <div
                        className="absolute inset-0 bg-orange-50 transition-all duration-700"
                        style={{ width: `${option.percentage}%` }}
                      />
                    )}
                    <div className="relative p-4 flex items-center gap-3">
                      {option.imageUrl ? (
                        <img src={option.imageUrl} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm" alt={option.text} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">👤</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{option.text}</span>
                          {isLeader && <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                          {justVoted && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                        </div>
                        {showResults && (
                          <span className="text-sm text-gray-500">
                            {option.votes.toLocaleString()} vote{option.votes !== 1 ? 's' : ''} · {option.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={handleFreeVote}
            disabled={!selected || loading || hasVotedAtLeastOnce}
            className="mt-4 w-full py-3 bg-orange-500 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-orange-600 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Vote'}
          </button>
        </>
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmPayment(); }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPhoneInput(false); setPhoneNumber(''); setPendingMethod(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
              >Cancel</button>
              <button
                onClick={handleConfirmPayment}
                disabled={!phoneNumber.trim()}
                className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-yellow-900 font-bold disabled:opacity-50 hover:bg-yellow-500"
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment pending overlay */}
      {paymentStatus === 'pending' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl mx-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Confirm on your phone</h3>
            <p className="text-sm text-gray-500 mb-2">
              Open the MTN MoMo prompt and enter your PIN to complete your vote purchase.
            </p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-400 mb-1">Buying</p>
              <p className="font-bold text-gray-800">
                {quantity} vote{quantity > 1 ? 's' : ''} · ${totalPrice.toFixed(2)}
              </p>
            </div>
            <div className="text-2xl font-bold text-gray-700 tabular-nums">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => { setPaymentStatus(null); setPaymentId(null); }}
              className="mt-4 text-sm text-red-400 hover:text-red-600 underline"
            >Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}