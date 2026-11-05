import type { ParsedGameRef } from "../site-adapter.js"
import {
  LICHESS_BASE_URL,
  LICHESS_GAME_ID_RE,
  LICHESS_SITE_ID,
} from "./constants.js"

const ALLOWED_HOSTS = new Set(["lichess.org", "www.lichess.org"])

/**
 * Parse a public Lichess game URL into a game ref.
 * Accepts https://lichess.org/{gameId} and optional path suffixes (/white, /black, ply).
 */
export const parseLichessUrl = (url: string): ParsedGameRef | null => {
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
  if (segments.length === 0) {
    return null
  }

  let gameId: string | undefined
  if (segments[0] === "game" && segments[1] === "export" && segments[2]) {
    gameId = segments[2]
  } else if (segments[0] === "embed" && segments[1]) {
    gameId = segments[1]
  } else {
    gameId = segments[0]
  }

  if (!gameId || !LICHESS_GAME_ID_RE.test(gameId)) {
    return null
  }

  return {
    site: LICHESS_SITE_ID,
    gameId,
    sourceUrl: `${LICHESS_BASE_URL}/${gameId}`,
  }
}
