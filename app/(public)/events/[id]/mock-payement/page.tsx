// // app/(public)/events/[id]/mock-payment/page.tsx
// 'use client';

// import { useState } from 'react';
// import { useRouter, useParams } from 'next/navigation';
// import { CheckCircle, Shield, Zap, Phone } from 'lucide-react';
// import dynamic from 'next/dynamic';

// // Dynamically import the overlay to prevent SSR issues
// import MomoAuthOverlay from '../../../components/payment/MomoAuthOverlay';

// export default function MockPaymentPage() {
//   const router = useRouter();
//   const params = useParams();
//   const eventId = params.id as string;
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [showMomoOverlay, setShowMomoOverlay] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState('');

//   const validatePhoneNumber = (phone: string) => {
//     // Basic validation for Liberian phone numbers (077, 088, 055)
//     const regex = /^(077|088|055)\d{6}$/;
//     return regex.test(phone.replace(/\s+/g, ''));
//   };

//   const handlePhoneSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!validatePhoneNumber(phoneNumber)) {
//       setError('Please enter a valid Liberian phone number (e.g., 0771234567)');
//       return;
//     }

//     setIsProcessing(true);
    
//     try {
//       // 1. Initiate mock payment
//       const response = await fetch('/api/payment/mock', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           eventId,
//           phoneNumber,
//           tickets: { 'general': 1 }, // Default to 1 general ticket
//           totalAmount: '0.00',
//           guestName: 'Demo User',
//           guestEmail: 'demo@example.com'
//         })
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Payment initiation failed');
//       }

//       // 2. Show MoMo overlay for 4 seconds
//       setShowMomoOverlay(true);
//       setIsProcessing(false);

//     } catch (err) {
//       console.error('Payment error:', err);
//       setError(err instanceof Error ? err.message : 'Payment failed');
//       setIsProcessing(false);
//     }
//   };

//   const handleAuthComplete = () => {
//     // After MoMo overlay completes, redirect to success page
//     // We need to get the transaction ID from somewhere
//     // For now, redirect to a generic success page
//     router.push(`/checkout/success/${eventId}?payment=success&method=momo`);
//   };

//   const handleBack = () => {
//     router.back();
//   };
// app/(public)/events/[id]/mock-payment/page.tsx - SIMPLIFIED WORKING VERSION
// app/(public)/events/[id]/mock-payment/page.tsx - FINAL FIXED VERSION
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, Shield, Zap, Phone } from 'lucide-react';
import MomoAuthOverlay from '../../../components/payment/MomoAuthOverlay';

export default function MockPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMomoOverlay, setShowMomoOverlay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const ticketPrice = 50.00;
  const serviceFee = 2.50;
  const totalAmount = ticketPrice + serviceFee;

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 9;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 9-digit phone number');
      return;
    }

    // Show MoMo overlay immediately
    setShowMomoOverlay(true);
    setIsProcessing(true);
    
    try {
      // Process payment in background
      const response = await fetch('/api/payment/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          phoneNumber,
          tickets: { 'general': 1 },
          totalAmount: totalAmount.toString(),
          guestName: 'Demo User',
          guestEmail: 'demo@example.com'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      setIsProcessing(false);
      // Overlay will auto-close after 4 seconds via onAuthComplete

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
      setShowMomoOverlay(false);
    }
  };

  const handleAuthComplete = () => {
    // Redirect to success page with amount
    router.push(`/checkout/success/${eventId}?payment=success&method=momo&phone=${phoneNumber}&amount=${totalAmount}&mock=true`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C2185B] rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            MTN MoMo Payment
          </h1>
          <p className="text-slate-600">
            Enter your phone number to complete payment
          </p>
        </div>

        {/* Phone Input Form */}
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Money Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500">+231</span>
              </div>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="771234567"
                className="pl-16 w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C2185B] focus:border-[#C2185B] outline-none transition"
                maxLength={9}
                required
                disabled={isProcessing || showMomoOverlay}
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Enter your MTN MoMo number (9 digits)
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Ticket Price:</span>
              <span className="font-medium">${ticketPrice.toFixed(2)} LRD</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Service Fee:</span>
              <span className="font-medium">${serviceFee.toFixed(2)} LRD</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-600 text-lg font-semibold">Total:</span>
              <span className="font-bold text-2xl text-[#C2185B]">${totalAmount.toFixed(2)} LRD</span>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-[#C2185B]" />
              <h3 className="font-bold text-slate-900">Secure Payment</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Encrypted transaction
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                MTN Mobile Money secured
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instant ticket delivery
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isProcessing || showMomoOverlay}
              className="w-full py-4 bg-gradient-to-r from-[#C2185B] to-[#E91E63] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Pay ${totalAmount.toFixed(2)} with MoMo
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleBack}
              disabled={isProcessing || showMomoOverlay}
              className="w-full py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel & Return
            </button>
          </div>
        </form>

        <p className="text-xs text-center text-slate-500 mt-6">
          A payment request will be sent to your phone. Enter your PIN to confirm.
        </p>
      </div>

      {/* MoMo Overlay - Shows immediately when form is submitted */}
      {showMomoOverlay && (
        <MomoAuthOverlay
          phoneNumber={phoneNumber}
          onAuthComplete={handleAuthComplete}
        />
      )}
    </div>
  );
}