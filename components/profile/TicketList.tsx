// components/profile/TicketList.tsx
'use client';

import { format } from 'date-fns';
import { Download } from 'lucide-react';

interface Ticket {
  id: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  ticketType: string;
  price: number;
  qrCode: string;
  status: string;
  purchasedAt: Date;
}

export default function TicketList({ tickets }: { tickets: Ticket[] }) {
  const handleDownload = (qrCode: string) => {
    // Logic to download QR code as image or PDF
    window.open(`/api/tickets/${qrCode}/download`, '_blank');
  };

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <div key={ticket.id} className="border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{ticket.eventName}</h3>
              <p className="text-gray-600">
                {format(new Date(ticket.eventDate), 'PPP p')} • {ticket.eventLocation}
              </p>
              <p className="text-sm mt-2">
                Ticket: {ticket.ticketType} – ${ticket.price}
              </p>
              <p className="text-xs text-gray-500">
                Purchased: {format(new Date(ticket.purchasedAt), 'PP')}
              </p>
            </div>
            <button
              onClick={() => handleDownload(ticket.qrCode)}
              className="flex items-center gap-1 bg-brand-primary text-white px-3 py-1 rounded"
            >
              <Download size={16} />
              Download
            </button>
          </div>
          <div className="mt-2">
            <img
              src={`/api/qr/${ticket.qrCode}`} // assuming you have an endpoint to serve QR images
              alt="QR Code"
              className="w-24 h-24"
            />
          </div>
        </div>
      ))}
    </div>
  );
}