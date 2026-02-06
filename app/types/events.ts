// types/event.ts
export interface Event {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string;
  imageUrl: string | null;
  isFeatured: boolean;
  price: number | null;
  tickets: Ticket[];
}

export interface Ticket {
  id: string;
  type: string;
  price: number;
  quantity: number;
  eventId: string;
}

// Simplified interface for EventCard
export interface EventCardData {
  id: string;
  title: string;
  description?: string;
  date: string | Date;
  location?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  price?: number | null;
  tickets: Ticket[];
}

// Simplified interface for TicketSelector
export interface EventForTicketSelector {
  id: string;
  title: string;
  // Only include what TicketSelector needs
}