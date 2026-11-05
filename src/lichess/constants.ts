/** Official Lichess API origin only (https://lichess.org/api). */
export const LICHESS_BASE_URL = "https://lichess.org"

/**
 * After HTTP 429, wait at least one minute before retrying
 * (https://lichess.org/page/api-tips).
 */
export const LICHESS_RATE_LIMIT_WAIT_MS = 60_000

export const LICHESS_SITE_ID = "lichess"

export const LICHESS_USER_AGENT =
  "AxiomChess-adapters/0.1 (+https://github.com/AxiomChess/adapters)"

/** Lichess game ids are 8 alphanumeric characters (OpenAPI gameId). */
export const LICHESS_GAME_ID_RE = /^[a-zA-Z0-9]{8}$/
