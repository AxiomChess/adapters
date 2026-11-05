import { SiteAdapterError } from "../errors.js"
import type { NormalizedGame, NormalizedPlayer } from "../normalized-game.js"
import { LICHESS_BASE_URL, LICHESS_SITE_ID } from "./constants.js"
import type { LichessGameJson, LichessGamePlayer } from "./types.js"

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const readPlayer = (
  side: LichessGamePlayer | undefined,
  fallback: string,
): NormalizedPlayer => {
  const username =
    side?.user?.name ?? side?.user?.id ?? side?.name ?? fallback
  const player: NormalizedPlayer = { username }
  if (typeof side?.rating === "number") {
    player.rating = side.rating
  }
  if (typeof side?.user?.title === "string" && side.user.title.length > 0) {
    player.title = side.user.title
  }
  return player
}

/** Convert Lichess centisecond clock array to seconds. */
export const clocksCentisecondsToSeconds = (
  clocks: number[] | undefined,
): number[] | undefined => {
  if (!clocks || clocks.length === 0) {
    return undefined
  }
  return clocks.map((cs) => cs / 100)
}

export const formatTimeControl = (
  clock: LichessGameJson["clock"],
): string | undefined => {
  if (!clock) {
    return undefined
  }
  return `${clock.initial}+${clock.increment}`
}

export const assertLichessGameJson = (raw: unknown): LichessGameJson => {
  if (!isRecord(raw)) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Lichess game payload is not an object",
    })
  }
  if (typeof raw.id !== "string" || raw.id.length === 0) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Lichess game payload missing id",
    })
  }
  return raw as LichessGameJson
}

export const lichessGameToNormalized = (
  raw: unknown,
  fetchedAt: string,
  sourceUrl?: string,
): NormalizedGame => {
  const game = assertLichessGameJson(raw)
  const variant = (game.variant ?? "standard").toLowerCase()
  if (variant !== "standard") {
    throw new SiteAdapterError({
      code: "unsupported_variant",
      message: `unsupported Lichess variant: ${variant}`,
      details: { variant: game.variant, gameId: game.id },
    })
  }

  const pgn = game.pgn
  if (typeof pgn !== "string" || pgn.trim().length === 0) {
    throw new SiteAdapterError({
      code: "private_or_unavailable",
      message: "Lichess game has no public PGN",
      details: { gameId: game.id },
    })
  }

  const normalized: NormalizedGame = {
    pgn,
    site: LICHESS_SITE_ID,
    siteGameId: game.id,
    players: {
      white: readPlayer(game.players?.white, "White"),
      black: readPlayer(game.players?.black, "Black"),
    },
    variant: "standard",
    sourceUrl: sourceUrl ?? `${LICHESS_BASE_URL}/${game.id}`,
    fetchedAt,
  }

  const timeControl = formatTimeControl(game.clock)
  if (timeControl !== undefined) {
    normalized.timeControl = timeControl
  }

  const clocks = clocksCentisecondsToSeconds(game.clocks)
  if (clocks !== undefined) {
    normalized.clocks = clocks
  }

  return normalized
}
