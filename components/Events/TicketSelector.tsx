'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Smartphone, ChevronRight } from 'lucide-react';

interface TicketType {
  id: string;
  type: string;
  price: number;
  quantity: number;
}

interface TicketSelectorProps {
  eventId: string;
  tickets: TicketType[];
}

export default function TicketSelector({ eventId, tickets }: TicketSelectorProps) {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);

  const availableTickets = tickets.filter(t => t.quantity > 0);

  const handleBuyNow = () => {
    if (!selectedTicket) return;
    
    const params = new URLSearchParams({
      type: selectedTicket.type,
      price: selectedTicket.price.toString(),
      quantity: quantity.toString(),
      ticketId: selectedTicket.id
    });
    
    router.push(`/events/${eventId}/mock-payment?${params.toString()}`);
  };

  if (availableTickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <Ticket className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Sold Out</h3>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border p-6 sticky top-6">
      <h2 className="text-2xl font-bold mb-6">Get Tickets</h2>

      <div className="space-y-4 mb-6">
        {availableTickets.map((ticket) => (
          <div 
            key={ticket.id} 
            className={`border rounded-xl p-4 cursor-pointer transition-all ${
              selectedTicket?.id === ticket.id 
                ? 'border-[#C2185B] bg-[#C2185B]/5' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => setSelectedTicket(ticket)}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-slate-900">{ticket.type}</span>
              <span className="text-xl font-bold text-[#C2185B]">
                {ticket.price.toFixed(2)} USD
              </span>
            </div>
            <p className="text-sm text-slate-600">{ticket.quantity} remaining</p>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <div className="mb-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600">Quantity:</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg border border-slate-300"
              >-</button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedTicket.quantity, quantity + 1))}
                className="w-8 h-8 rounded-lg border border-slate-300"
              >+</button>
            </div>
          </div>
          
          <div className="flex justify-between pt-3 border-t border-slate-200">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-xl text-[#C2185B]">
              {(selectedTicket.price * quantity).toFixed(2)} USD
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleBuyNow}
        disabled={!selectedTicket}
        className="w-full py-4 bg-gradient-to-r from-[#C2185B] to-[#E91E63] text-white rounded-xl font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Buy Now <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}