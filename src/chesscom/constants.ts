/** Official Chess.com Published-Data API base (https://www.chess.com/news/view/published-data-api). */
export const CHESSCOM_BASE_URL = "https://api.chess.com/pub"

export const CHESSCOM_ORIGIN = "https://api.chess.com"

/**
 * Chess.com documents 429 for parallel / abnormal access; serial access is unlimited.
 * When 429 is returned, wait at least this long before retrying unless Retry-After says longer.
 */
export const CHESSCOM_RATE_LIMIT_WAIT_MS = 60_000

export const CHESSCOM_SITE_ID = "chesscom"

export const CHESSCOM_USER_AGENT =
  "AxiomChess-adapters/0.1 (+https://github.com/AxiomChess/adapters)"

/** Numeric game id from public Chess.com game URLs. */
export const CHESSCOM_GAME_ID_RE = /^\d+$/

export const CHESSCOM_WEB_ORIGIN = "https://www.chess.com"
