/**
 * Multi-site URL parser registry.
 * Routes allowlisted public game URLs to the matching site adapter parseUrl.
 */

import { parseChessComUrl } from "./chesscom/parse-url.js"
import { parseLichessUrl } from "./lichess/parse-url.js"
import { isAllowedSiteUrl } from "./allowlist.js"
import type { ParsedGameRef } from "./site-adapter.js"

export type GameUrlParser = (url: string) => ParsedGameRef | null

/** Ordered parsers for registered sites (Lichess, Chess.com). */
export const GAME_URL_PARSERS: readonly GameUrlParser[] = Object.freeze([
  parseLichessUrl,
  parseChessComUrl,
])

/**
 * Parse a public game URL into a site game ref.
 * Fail closed: non-allowlisted hosts and unknown paths return null.
 */
export const parseGameUrl = (url: string): ParsedGameRef | null => {
  if (!isAllowedSiteUrl(url)) {
    return null
  }

  for (const parse of GAME_URL_PARSERS) {
    const ref = parse(url)
    if (ref !== null) {
      return ref
    }
  }

  return null
}
