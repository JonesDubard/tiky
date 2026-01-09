import PollCard from './PollCard';

const polls = [
  {
    id: 1,
    question: 'Who should headline Afro Nation Liberia?',
    options: [
      { id: 1, label: 'Burna Boy', votes: 120 },
      { id: 2, label: 'Wizkid', votes: 95 },
      { id: 3, label: 'Davido', votes: 80 },
    ],
  },
  {
    id: 2,
    question: 'Best DJ in Monrovia right now?',
    options: [
      { id: 1, label: 'DJ Neptune', votes: 60 },
      { id: 2, label: 'DJ Tunez', votes: 42 },
    ],
  },
];

export default function PollSection() {
  return (
    <section className="px-6 py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black">Live Polls</h2>
        <button className="text-sm font-semibold text-gray-600 hover:text-black">
          See all
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
    </section>
  );
}
