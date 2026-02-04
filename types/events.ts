// types/events.ts
export interface PublicEvent {
  id: string
  title: string
  description?: string
  date: string
  location?: string
  imageUrl?: string
  published: boolean
  isFeatured?: boolean  
  tickets: Array<{
    type: string
    price: number
    quantity: number
  }>
  createdAt: string
}