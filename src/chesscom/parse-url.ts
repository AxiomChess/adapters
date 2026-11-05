import type { ParsedGameRef } from "../site-adapter.js"
import {
  CHESSCOM_GAME_ID_RE,
  CHESSCOM_SITE_ID,
  CHESSCOM_WEB_ORIGIN,
} from "./constants.js"

const ALLOWED_HOSTS = new Set(["chess.com", "www.chess.com"])

const normalizeSourceUrl = (kind: "live" | "daily", gameId: string): string => {
  return `${CHESSCOM_WEB_ORIGIN}/game/${kind}/${gameId}`
}

/**
 * Parse a public Chess.com game URL into a game ref.
 * Accepts /game/live/{id} and /game/daily/{id}.
 * The numeric gameId alone cannot be fetched via PubAPI (no single-game endpoint);
 * listRecentGames returns composite ids for fetchGame.
 */
export const parseChessComUrl = (url: string): ParsedGameRef | null => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase())) {
    return null
  }

  const segments = parsed.pathname.split("/").filter(Boolean)
  if (segments.length < 3) {
    return null
  }

  if (segments[0] !== "game") {
    return null
  }

  const kind = segments[1]
  const gameId = segments[2]
  if (kind !== "live" && kind !== "daily") {
    return null
  }
  if (!gameId || !CHESSCOM_GAME_ID_RE.test(gameId)) {
    return null
  }

  return {
    site: CHESSCOM_SITE_ID,
    gameId,
    sourceUrl: normalizeSourceUrl(kind, gameId),
  }
}

export const extractChessComGameIdFromUrl = (
  gameUrl: string,
): string | null => {
  const ref = parseChessComUrl(gameUrl)
  return ref?.gameId ?? null
}
