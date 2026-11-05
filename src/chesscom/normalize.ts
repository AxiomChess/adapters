import { SiteAdapterError } from "../errors.js"
import type { NormalizedGame, NormalizedPlayer } from "../normalized-game.js"
import { CHESSCOM_SITE_ID } from "./constants.js"
import { extractChessComGameIdFromUrl } from "./parse-url.js"
import type { ChessComGameJson, ChessComPlayerSide } from "./types.js"

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const readPlayer = (
  side: ChessComPlayerSide | undefined,
  fallback: string,
): NormalizedPlayer => {
  const username = side?.username ?? fallback
  const player: NormalizedPlayer = { username }
  if (typeof side?.rating === "number") {
    player.rating = side.rating
  }
  return player
}

export const assertChessComGameJson = (raw: unknown): ChessComGameJson => {
  if (!isRecord(raw)) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Chess.com game payload is not an object",
    })
  }
  if (typeof raw.url !== "string" || raw.url.length === 0) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Chess.com game payload missing url",
    })
  }
  return raw as ChessComGameJson
}

export const chessComGameToNormalized = (
  raw: unknown,
  fetchedAt: string,
  sourceUrl?: string,
): NormalizedGame => {
  const game = assertChessComGameJson(raw)
  const rules = (game.rules ?? "chess").toLowerCase()
  if (rules !== "chess") {
    throw new SiteAdapterError({
      code: "unsupported_variant",
      message: `unsupported Chess.com variant: ${rules}`,
      details: { rules: game.rules, url: game.url },
    })
  }

  const pgn = game.pgn
  if (typeof pgn !== "string" || pgn.trim().length === 0) {
    throw new SiteAdapterError({
      code: "private_or_unavailable",
      message: "Chess.com game has no public PGN",
      details: { url: game.url },
    })
  }

  const siteGameId = extractChessComGameIdFromUrl(game.url)
  if (siteGameId === null) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Chess.com game url does not contain a numeric game id",
      details: { url: game.url },
    })
  }

  const normalized: NormalizedGame = {
    pgn,
    site: CHESSCOM_SITE_ID,
    siteGameId,
    players: {
      white: readPlayer(game.white, "White"),
      black: readPlayer(game.black, "Black"),
    },
    variant: "standard",
    sourceUrl: sourceUrl ?? game.url,
    fetchedAt,
  }

  if (typeof game.time_control === "string" && game.time_control.length > 0) {
    normalized.timeControl = game.time_control
  }

  return normalized
}
