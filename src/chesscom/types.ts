/** Subset of Chess.com PubAPI game objects used for ingest. */

export type ChessComPlayerSide = {
  username?: string
  rating?: number
  result?: string
  "@id"?: string
  uuid?: string
}

export type ChessComGameJson = {
  url: string
  pgn?: string
  fen?: string
  time_control?: string
  time_class?: string
  rules?: string
  rated?: boolean
  end_time?: number
  start_time?: number
  white?: ChessComPlayerSide
  black?: ChessComPlayerSide
  accuracies?: {
    white?: number
    black?: number
  }
  eco?: string
}

export type ChessComGamesResponse = {
  games: ChessComGameJson[]
}

export type ChessComArchivesResponse = {
  archives: string[]
}

/**
 * Composite game id used because PubAPI has no single-game-by-id endpoint.
 * Format: `{username}/{YYYY}/{MM}/{numericId}`
 */
export type ChessComCompositeGameId = {
  username: string
  year: string
  month: string
  gameId: string
}
