import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import PollForm from 'components/admin/PollForm'

export default async function CreatePollPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create New Poll</h1>
          <p className="text-slate-600 mt-2">Create a new voting poll for your audience</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <PollForm />
        </div>
      </div>
    </div>
  )
}
