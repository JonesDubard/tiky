// app/types/polls.ts

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface PublicPoll {
  id: string
  title: string
  description: string
  endDate: string
  options: PollOption[]
  totalVotes: number
}
