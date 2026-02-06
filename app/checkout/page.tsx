// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2, Shield, CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [checkoutData, setCheckoutData] = useState<any>(null);

  useEffect(() => {
    // Get data from localStorage
    const data = localStorage.getItem('guestCheckout');
    if (!data) {
      router.push('/events');
      return;
    }
    setCheckoutData(JSON.parse(data));
  }, [router]);

  const handlePayment = async () => {
    if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Simulate MTN MoMo payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/payment/mock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: checkoutData.eventId,
    tickets: checkoutData.tickets, // Should be { "ticket-id-1": 2, "ticket-id-2": 1 }
    totalAmount: checkoutData.totalAmount,
    guestName: guestInfo.name,
    guestEmail: guestInfo.email,
    phoneNumber: guestInfo.phone
  })
});

      const result = await response.json();

      if (result.success) {
        setPaymentStatus('success');
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
         if (result.tickets && result.tickets[0]) {
            router.push(`/checkout/success/${result.tickets[0].id}`);
}
        }, 2000);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-slate-600 hover:text-brand-primary"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-10"></div>
            {['Cart', 'Checkout', 'Confirm'].map((step, index) => (
              <div key={step} className="text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index === 0 ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Payment */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Complete Payment</h2>
                
                {/* Guest Information */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-bold text-slate-900">Guest Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="flex">
                        <div className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg">
                          +231
                        </div>
                        <input
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                          placeholder="77 123 4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* MTN MoMo Simulation */}
                <div className="border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Smartphone className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">MTN MoMo Payment</h3>
                      <p className="text-sm text-slate-600">Simulated payment for demo</p>
                    </div>
                  </div>

                  {/* Payment Status Display */}
                  {paymentStatus === 'processing' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        <div>
                          <p className="font-medium text-blue-800">Processing MTN MoMo Payment...</p>
                          <p className="text-sm text-blue-600">Simulating mobile money transaction</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Payment Successful!</p>
                          <p className="text-sm text-green-600">Redirecting to your ticket...</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="font-medium text-red-800">Payment failed. Please try again.</p>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={loading || paymentStatus === 'processing'}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentStatus === 'processing' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Payment...
                      </span>
                    ) : (
                      'Complete Payment with MTN MoMo'
                    )}
                  </button>

                  <p className="text-sm text-slate-500 text-center mt-4">
                    This is a simulated payment. No real money will be charged.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-6">
                <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  {checkoutData.ticketDetails?.map((ticket: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {ticket.type} × {ticket.quantity}
                      </span>
                      <span>${(ticket.price * ticket.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span>${checkoutData.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service Fee</span>
                    <span>${(checkoutData.totalAmount * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t">
                    <span>Total</span>
                    <span>${(checkoutData.totalAmount * 1.05).toFixed(2)} LRD</span>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-center gap-6">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Secure Payment</p>
                      <p className="text-xs text-slate-500">Encrypted & Protected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}