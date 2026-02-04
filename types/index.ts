// // types/events.ts
// export interface Ticket {
//   type: string;
//   price: number;
//   quantity: number;
// }

// export interface PublicEvent {
//   id: string;
//   title: string;
//   description?: string; // Optional instead of null
//   date: Date;
//   published: boolean;
//   location: string;
//   imageUrl?: string; // Optional instead of null
//   createdById: string;
//   organizerId?: string;
//   tickets: Ticket[];
//   createdAt?: Date;
// }

// types/index.ts
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  endDate: string;
  options: PollOption[];
  totalVotes: number;
}

export interface Ticket {
  id?: string;
  type: string;
  price: number;
  quantity: number;
}

// export interface Event {
//   id: string;
//   title: string;
//   description?: string;
//   date: Date;
//   published: boolean;
//   location: string;
//   imageUrl?: string;
//   createdById: string;
//   organizerId?: string;
//   tickets: Ticket[];
//   createdAt?: Date;
// }

// types/events.ts
export type Event = {
  id: string
  title: string
  description?: string
  image?: string
  location?: string
  date: string
  status: 'DRAFT' | 'PUBLISHED'
  createdAt: string
}
