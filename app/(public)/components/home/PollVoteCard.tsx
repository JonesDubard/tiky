// PollVoteCard.tsx is the new unified voting component for both free and paid polls. It handles vote submission, payment flow, and live results display in one place.

'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Contestant {
  id: string;
  text: string;
  imageUrl: string | null;
  votes?: number;
  percentage?: number;
}

interface PollVoteCardProps {
  poll: {
    id: string;
    title: string;
    description: string | null;
    type: 'POLL' | 'CONTEST';
    endDate: Date | null;
    votePrice?: number | null;
  };
  contestants: Contestant[];
}

export default function PollVoteCard({ poll, contestants: initialContestants }: PollVoteCardProps) {
  const [contestants, setContestants] = useState<Contestant[]>(initialContestants);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [voting, setVoting] = useState(false);
  const [hasVotedAtLeastOnce, setHasVotedAtLeastOnce] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [deviceId, setDeviceId] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [countdown, setCountdown] = useState(120);

  // FIX 1: Resolve votePrice — trust prop if present, else fetch from results endpoint
  // This ensures isPaidPoll is never falsely null when the prop is simply missing.
  const [resolvedVotePrice, setResolvedVotePrice] = useState<number | null>(
    poll.votePrice ?? null
  );

  // FIX 1 cont: isPaidPoll uses strict number check — not just truthy
  const isPaidPoll = typeof resolvedVotePrice === 'number' && resolvedVotePrice > 0;
  const totalPrice = isPaidPoll ? resolvedVotePrice! * quantity : 0;

  // phone numbers for paid votes 
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
    fetch(`/api/polls/${poll.id}/results`)
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          setContestants(prev =>
            prev.map(c => {
              const fresh = data.results.find((r: any) => r.id === c.id);
              return fresh ? { ...c, votes: fresh.votes, percentage: fresh.percentage } : c;
            })
          );
          setTotalVotes(data.totalVotes ?? 0);
        }

        // FIX 1 cont: If votePrice wasn't in the prop, pull it from the poll detail endpoint
        if (resolvedVotePrice === null) {
          fetch(`/api/polls/${poll.id}`)
            .then(r => r.json())
            .then(pollData => {
              const price = pollData?.poll?.votePrice ?? pollData?.votePrice ?? null;
              if (typeof price === 'number') setResolvedVotePrice(price);
            })
            .catch(() => {});
        }
      })
      .catch(console.error);
  }, [poll.id]);

  useEffect(() => {
  if (!paymentId) return;

  console.log('[POLLVOTECARD] Starting polling for', paymentId);

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/payment/status?orderId=${paymentId}, {
        cache: 'no-store' // Ensure we get the latest status
      }`);
      const data = await res.json();
      console.log('[POLLVOTECARD] status:', data.orderStatus);

      if (data.orderStatus === 'COMPLETED') {
        clearInterval(interval);
        setPaymentStatus('completed');
        setHasVotedAtLeastOnce(true);
        const resultsRes = await fetch(`/api/polls/${poll.id}/results`);
        const resultsData = await resultsRes.json();
        if (resultsData.results) {
          setContestants(prev =>
            prev.map(c => {
              const fresh = resultsData.results.find((r: any) => r.id === c.id);
              return fresh ? { ...c, votes: fresh.votes, percentage: fresh.percentage } : c;
            })
          );
          setTotalVotes(resultsData.totalVotes ?? 0);
        }
        setToast({ msg: 'Your votes have been added! 🎉', type: 'success' });
        setTimeout(() => setToast(null), 5000);
        setSelectedContestant(null);
        setQuantity(1);
      } else if (data.orderStatus === 'FAILED') {
        clearInterval(interval);
        setPaymentStatus('failed');
        setToast({ msg: 'Payment failed. Please try again.', type: 'error' });
      }
    } catch {
      // keep polling on network error
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
    setToast({
      msg: 'Payment timed out. Check your MoMo and try again.',
      type: 'error'
    });
  }, 180_000);

  return () => {
    clearInterval(interval);
    clearInterval(ticker);
    clearTimeout(timeout);
  };
}, [paymentId]); 

 // handleBuyVotes is called when user clicks a payment button. It sets the pending method and shows the phone input modal.

const handleBuyVotes = async (method: 'mtn_momo' | 'orange_money') => {
  if (!selectedContestant) {          // ← was `selected`
    setToast({ msg: 'Please select a contestant first', type: 'error' });
    return;
  }
  setPendingMethod(method);
  setShowPhoneInput(true);
};

const handleConfirmPayment = async () => {
  if (!phoneNumber.trim() || !pendingMethod || !selectedContestant) return;  // ← was `selected`
  setShowPhoneInput(false);
  setVoting(true);                    // ← was `setLoading`
  try {
    const res = await fetch('/api/poll-votes/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pollId: poll.id,              // ← was `pollId`
        optionId: selectedContestant, // ← was `selected`
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
    setVoting(false);                 // ← was `setLoading`
  }
};

  // FIX 4: Read `error` key (not `message`) to get the real server error text
  const handleFreeVote = async (contestantId: string) => {
    setVoting(true);
    try {
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: contestantId, deviceId }),
      });
      const result = await response.json();

      // ✅ FIX 4: API returns { error: "..." } — was reading result.message (always undefined)
      if (!response.ok) throw new Error(result.error || result.message || 'Vote failed');

      setHasVotedAtLeastOnce(true);
      setSelectedContestant(contestantId);
      if (result.results) {
        setContestants(prev =>
          prev.map(c => {
            const fresh = result.results.find((r: any) => r.id === c.id);
            return fresh ? { ...c, votes: fresh.votes, percentage: fresh.percentage } : c;
          })
        );
        setTotalVotes(result.totalVotes ?? 0);
      }
      setToast({ msg: 'Your vote was recorded! 🎉', type: 'success' });
      setTimeout(() => setToast(null), 5000);
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setVoting(false);
    }
  };

  const getTimeRemaining = () => {
    if (!poll.endDate) return 'No end date';
    const end = new Date(poll.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{poll.title}</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {isPaidPoll ? `💰 $${resolvedVotePrice!.toFixed(2)} / vote` : '📊 Free Poll'}
          </span>
        </div>
        {poll.description && <p className="text-gray-600 mb-3">{poll.description}</p>}
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-4">⏰ {getTimeRemaining()}</span>
          <span>👥 {contestants.length} contestants</span>
        </div>
      </div>

      {isPaidPoll ? (
        <div className="space-y-4">
          {contestants.map(contestant => (
            <button
              key={contestant.id}
              onClick={() => setSelectedContestant(contestant.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selectedContestant === contestant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {contestant.imageUrl ? (
                  <img src={contestant.imageUrl} className="w-10 h-10 rounded-full object-cover" alt={contestant.text} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">👤</div>
                )}
                <div className="flex-1">
                  <span className="font-semibold text-gray-800">{contestant.text}</span>
                  {/* FIX 3: Show vote count on paid contestants too */}
                  {contestant.votes !== undefined && (
                    <p className="text-xs text-gray-400 mt-0.5">{contestant.votes} votes</p>
                  )}
                </div>
                {selectedContestant === contestant.id && (
                  <span className="text-blue-500 text-lg">✓</span>
                )}
              </div>
            </button>
          ))}

          {/* FIX 3: Quantity selector — always rendered in paid branch */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Number of votes:</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                {quantity} vote{quantity !== 1 ? 's' : ''} × ${resolvedVotePrice!.toFixed(2)}
              </span>
              <span className="text-base font-bold text-blue-700">
                Total: ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleBuyVotes('mtn_momo')}
              disabled={voting || !selectedContestant}
              className="flex-1 py-3 bg-yellow-400 text-yellow-900 font-bold rounded-xl disabled:opacity-50 hover:bg-yellow-500 transition-colors"
            >
              {voting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Pay with MoMo'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contestants.map(contestant => (
            <button
              key={contestant.id}
              onClick={() => handleFreeVote(contestant.id)}
              disabled={hasVotedAtLeastOnce || voting}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedContestant === contestant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="flex flex-col items-center">
                {contestant.imageUrl ? (
                  <img src={contestant.imageUrl} className="w-16 h-16 rounded-full object-cover mb-2" alt={contestant.text} />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">👤</div>
                )}
                <span className="font-medium">{contestant.text}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!isPaidPoll && hasVotedAtLeastOnce && (
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold">Live Results</h3>
          {[...contestants]
            .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
            .map(c => {
              const pct = c.percentage ?? 0;
              const votes = c.votes ?? 0;
              return (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
                  <span className="font-medium flex-1">{c.text}</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-20 text-right">
                    {votes} vote{votes !== 1 ? 's' : ''} ({pct}%)
                  </span>
                </div>
              );
            })}
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

      {paymentStatus === 'pending' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-xs text-center shadow-xl">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">Confirm your payment</h3>
            <p className="text-sm text-gray-500 mb-4">Open the prompt on your phone and enter your PIN.</p>
            <div className="text-2xl font-bold text-gray-700">
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => { setPaymentStatus(null); setPaymentId(null); }}
              className="mt-4 text-sm text-red-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border-t pt-4 mt-6 text-right text-sm text-gray-500">
        Total Votes: {totalVotes}
      </div>
    </div>
  );
}