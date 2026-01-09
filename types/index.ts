// Event type matching your Prisma schema
export interface Event {
  id: string
  title: string
  description: string | null
  date: Date
  venue: string
  imageUrl: string
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
}

// For the events list component
export interface EventWithDetails extends Event {
  // Add any additional fields you need
}

// Poll type
export interface Poll {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  endDate: Date | null
  isFeatured: boolean
  eventId: string | null
  createdAt: Date
  updatedAt: Date
}