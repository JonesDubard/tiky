'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Phone, Shield, CheckCircle, Zap, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function PaymentContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  
  const ticketType = searchParams.get('type') || 'General';
  const ticketPrice = parseFloat(searchParams.get('price') || '50');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const subtotal = ticketPrice * quantity;
  const serviceFee = subtotal * 0.05;
  const total = subtotal + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length !== 9) {
      setError('Please enter a valid 9-digit phone number');
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      router.push(`/checkout/success/${eventId}?amount=${total.toFixed(2)}&phone=${cleaned}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/events/${eventId}`} className="flex items-center gap-2 text-slate-600">
            <ArrowLeft className="w-5 h-5" /> Back to Event
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#C2185B] rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">MTN Mobile Money</h1>
            <p className="text-slate-600 mt-2">{quantity}x {ticketType}</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>{subtotal.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Fee (5%):</span>
              <span>{serviceFee.toFixed(2)} USD</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold">
              <span>Total:</span>
              <span className="text-[#C2185B] text-xl">{total.toFixed(2)} USD</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">MTN MoMo Number</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-500">+231</span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="771234567"
                  className="pl-16 w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#C2185B]"
                  maxLength={9}
                  required
                />
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-[#C2185B] to-[#E91E63] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>Pay {total.toFixed(2)} USD <Zap className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}