/**
 * Shared NormalizedGame contract from PROJECT_SPEC.md section 7.2.
 * v1 supports standard chess only unless a later task adds a variant.
 */

export type ChessVariant = "standard"

export type NormalizedPlayer = {
  username: string
  rating?: number
  title?: string
}

export type NormalizedGame = {
  /** Canonical PGN text */
  pgn: string
  /** Site adapter id, e.g. "lichess" or "chesscom" */
  site: string
  siteGameId: string
  players: {
    white: NormalizedPlayer
    black: NormalizedPlayer
  }
  timeControl?: string
  variant: ChessVariant
  /** Move clock times in seconds when present in public PGN/API */
  clocks?: number[]
  sourceUrl: string
  /** ISO-8601 timestamp when the game was fetched */
  fetchedAt: string
}
