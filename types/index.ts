// types/index.ts
export interface EventWithDetails {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  location: string;
  imageUrl: string | null;
  isFeatured: boolean;
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface PollWithDetails {
  id: string;
  title: string;
  description: string | null;
  pollType: string;
  status: string;
  endDate: Date | null;
  isFeatured: boolean;
  creator: {
    name: string | null;
    email: string;
  };
  options: Array<{
    id: string;
    text: string;
    imageUrl: string | null;
    _count: {
      votes: number;
    };
  }>;
  _count: {
    votes: number;
  };
}