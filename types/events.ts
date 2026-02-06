// types/events.ts - UPDATE
export interface Ticket {
  type: string;  // Non-nullable
  price: number;
  quantity: number;
}

export interface PublicEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  imageUrl?: string;
  published: boolean;
  isFeatured?: boolean;
  price?: number | null;
  tickets: Ticket[];  // Uses the non-nullable Ticket type
  createdAt: Date;
}