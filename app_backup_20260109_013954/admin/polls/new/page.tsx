import PollForm from '@/components/admin/PollForm'

export default function NewPollPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Poll/Contest</h1>
        <p className="text-gray-600">
          Create polls for user engagement or paid contests for revenue.
        </p>
      </div>
      
      <div className="max-w-3xl">
        <PollForm />
      </div>
    </div>
  )
}