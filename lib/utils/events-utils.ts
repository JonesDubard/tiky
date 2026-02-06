// lib/utils/event-utils.ts
export function mapEventWithTickets(event: any) {
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? undefined,
    date: event.date.toISOString(),
    location: event.location ?? undefined,
    imageUrl: event.imageUrl ?? undefined,
    published: event.published,
    isFeatured: event.isFeatured,
    price: event.price,
    tickets: event.tickets.map((ticket: any) => ({
      type: ticket.type ?? 'General Admission',
      price: ticket.price,
      quantity: ticket.quantity
    })),
    createdAt: event.createdAt
  }
}