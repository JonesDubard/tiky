// app/types/events.ts

export interface Ticket {
  type: string
  price: number
  quantity: number
}

export interface PublicEvent {
  id: string
  title: string
  description?: string
  date: Date | string
  location?: string
  imageUrl?: string
  published: boolean
  tickets?: Ticket[]
  createdAt?: Date
}
