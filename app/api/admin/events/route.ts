// In the data object, ensure published is included
const data = {
  title: formData.get('title'),
  description: formData.get('description'),
  date: new Date(formData.get('date') as string).toISOString(),
  location: formData.get('location'),
  imageUrl: imageUrl || (formData.get('imageUrl') as string) || '',
  published: formData.get('published') === 'on', // Add this
  isFeatured: false, // Default to false
  tickets: ticketTypes.map(ticket => ({
    type: ticket.name,
    price: parseFloat(ticket.price),
    quantity: parseInt(ticket.quantity)
  }))
};