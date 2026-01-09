'use client';

interface PollOption {
  id: number;
  label: string;
  votes: number;
}

interface PollCardProps {
  poll: {
    id: number;
    question: string;
    options: PollOption[];
  };
}

export default function PollCard({ poll }: PollCardProps) {
  const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 min-w-[280px]
      hover:shadow-md transition">
      
      <h3 className="font-semibold text-sm mb-4">
        {poll.question}
      </h3>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = totalVotes
            ? (option.votes / totalVotes) * 100
            : 0;

          return (
            <div key={option.id}>
              <div className="flex justify-between text-xs mb-1">
                <span>{option.label}</span>
                <span className="text-gray-500">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FF6B35]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="mt-4 w-full py-2 text-sm font-semibold rounded-lg
        border border-gray-200 hover:bg-gray-50 transition">
        Vote
      </button>
    </div>
  );
}
