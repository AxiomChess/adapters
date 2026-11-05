/** Subset of Lichess GameJson used for ingest (official OpenAPI GameJson). */

export type LichessGamePlayer = {
  user?: {
    name?: string
    id?: string
    title?: string
  }
  rating?: number
  name?: string
}

export type LichessGameJson = {
  id: string
  rated?: boolean
  variant?: string
  speed?: string
  perf?: string
  status?: string
  players?: {
    white?: LichessGamePlayer
    black?: LichessGamePlayer
  }
  pgn?: string
  moves?: string
  clocks?: number[]
  clock?: {
    initial: number
    increment: number
    totalTime: number
  }
}
