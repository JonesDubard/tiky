// types/polls.ts
export interface PublicPoll {
  id: string
  title: string
  description: string
  endDate: string
  options: Array<{
    id: string
    text: string
    votes: number
  }>
  totalVotes: number
  isFeatured?: boolean  
}