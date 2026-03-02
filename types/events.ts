// types/events.ts
export interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Keep Ticket as alias for backwards compatibility
export interface Ticket {
  id?: string;
  type?: string;
  name?: string;
  price: number;
  quantity: number;
}

export interface PublicEvent {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  location?: string | null;
  imageUrl?: string | null;
  published: boolean;
  isFeatured?: boolean;
  price?: number | null;
  ticketTypes: TicketType[];
  createdAt?: Date;
}