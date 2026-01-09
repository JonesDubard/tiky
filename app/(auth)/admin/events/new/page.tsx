import EventForm from '@/components/admin/EventForm'

export default function NewEventPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
        <p className="text-gray-600">
          Fill out the form below to create a new event. Tickets can be added after creation.
        </p>
      </div>
      
      <div className="max-w-2xl">
        <EventForm />
      </div>
    </div>
  )
}