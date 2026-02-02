// components/events/TicketSelector.tsx
'use client';

import { useState } from 'react';
import { Ticket, CreditCard, Smartphone } from 'lucide-react';
import { Ticket as TicketType, Event } from '@prisma/client';

interface TicketSelectorProps {
  event: Event;
  tickets: TicketType[];
}

export default function TicketSelector({ event, tickets }: TicketSelectorProps) {
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');

  const updateQuantity = (ticketId: string, quantity: number) => {
    if (quantity < 0) return;
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: quantity
    }));
  };

  const totalQuantity = Object.values(selectedTickets).reduce((a, b) => a + b, 0);
  const totalAmount = tickets.reduce((total, ticket) => {
    const qty = selectedTickets[ticket.id] || 0;
    return total + (ticket.price * qty);
  }, 0);

  const handleCheckout = () => {
    if (totalQuantity === 0) {
      alert('Please select at least one ticket');
      return;
    }
    
    // In a real implementation, this would redirect to checkout
    // For now, we'll simulate the guest checkout flow
    const ticketData = {
      eventId: event.id,
      tickets: selectedTickets,
      totalAmount,
      paymentMethod
    };
    
    localStorage.setItem('guestCheckout', JSON.stringify(ticketData));
    
    // Redirect to checkout page (to be implemented)
    // router.push('/checkout');
    alert(`Proceeding to checkout with ${totalQuantity} ticket(s). Total: $${totalAmount.toFixed(2)}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-brand-primary/10 rounded-lg">
          <Ticket className="w-6 h-6 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Get Tickets
        </h2>
      </div>

      {/* Ticket Selection */}
      <div className="space-y-4 mb-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-slate-900">{ticket.type}</h3>
                <p className="text-sm text-slate-600">Remaining: {ticket.quantity}</p>
              </div>
              <div className="text-xl font-bold text-slate-900">
                ${ticket.price.toFixed(2)}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Select quantity
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                  disabled={(selectedTickets[ticket.id] || 0) === 0}
                  className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">
                  {selectedTickets[ticket.id] || 0}
                </span>
                <button
                  onClick={() => updateQuantity(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                  disabled={(selectedTickets[ticket.id] || 0) >= ticket.quantity}
                  className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center hover:bg-slate-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-900 mb-3">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('momo')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
              paymentMethod === 'momo'
                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <Smartphone className="w-5 h-5" />
            <span className="font-medium">MoMo</span>
          </button>
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
              paymentMethod === 'card'
                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Card</span>
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="border-t border-slate-200 pt-4 mb-6">
        <div className="flex justify-between text-slate-600 mb-2">
          <span>Tickets ({totalQuantity})</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-600 mb-2">
          <span>Service Fee</span>
          <span>${(totalAmount * 0.05).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-slate-900">
          <span>Total</span>
          <span>${(totalAmount * 1.05).toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={totalQuantity === 0}
        className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-bold text-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
      >
        {totalQuantity === 0 ? 'Select Tickets' : 'Continue to Checkout'}
      </button>

      {/* Guest Note */}
      <p className="text-sm text-center text-slate-500 mt-4">
        No account required • Secure payment • Instant ticket delivery
      </p>
    </div>
  );
}