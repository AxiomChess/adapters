import type { NormalizedGame } from "./normalized-game.js"

/**
 * SiteAdapter extension point from PROJECT_SPEC.md section 9.
 * One adapter per site; register in a site registry (later tasks).
 */

export type ParsedGameRef = {
  site: string
  gameId: string
  sourceUrl: string
}

export type ListRecentGamesOptions = {
  /** Soft upper bound on returned refs; adapters may return fewer */
  maxGames?: number
}

export type SiteAdapter = {
  readonly id: string
  parseUrl: (url: string) => ParsedGameRef | null
  fetchGame: (ref: ParsedGameRef) => Promise<unknown>
  listRecentGames: (
    username: string,
    options?: ListRecentGamesOptions,
  ) => Promise<ParsedGameRef[]>
  toNormalizedGame: (raw: unknown) => NormalizedGame
}
