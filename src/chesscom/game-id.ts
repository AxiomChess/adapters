import { CHESSCOM_GAME_ID_RE } from "./constants.js"
import type { ChessComCompositeGameId } from "./types.js"

const COMPOSITE_RE =
  /^([A-Za-z0-9_-]+)\/(\d{4})\/(\d{2})\/(\d+)$/

export const encodeChessComCompositeGameId = (
  parts: ChessComCompositeGameId,
): string => {
  return `${parts.username}/${parts.year}/${parts.month}/${parts.gameId}`
}

export const decodeChessComCompositeGameId = (
  value: string,
): ChessComCompositeGameId | null => {
  const match = COMPOSITE_RE.exec(value)
  if (!match) {
    return null
  }
  const username = match[1]
  const year = match[2]
  const month = match[3]
  const gameId = match[4]
  if (
    username === undefined ||
    year === undefined ||
    month === undefined ||
    gameId === undefined
  ) {
    return null
  }
  if (!CHESSCOM_GAME_ID_RE.test(gameId)) {
    return null
  }
  return { username, year, month, gameId }
}

export const parseArchiveYearMonth = (
  archiveUrl: string,
): { year: string; month: string } | null => {
  let parsed: URL
  try {
    parsed = new URL(archiveUrl)
  } catch {
    return null
  }
  const segments = parsed.pathname.split("/").filter(Boolean)
  // /pub/player/{username}/games/{YYYY}/{MM}
  if (segments.length < 6) {
    return null
  }
  const year = segments[segments.length - 2]
  const month = segments[segments.length - 1]
  if (
    year === undefined ||
    month === undefined ||
    !/^\d{4}$/.test(year) ||
    !/^\d{2}$/.test(month)
  ) {
    return null
  }
  return { year, month }
}

export const buildMonthlyGamesPath = (
  username: string,
  year: string,
  month: string,
): string => {
  return `/player/${encodeURIComponent(username)}/games/${year}/${month}`
}

export const buildMonthlyPgnPath = (
  username: string,
  year: string,
  month: string,
): string => {
  return `/player/${encodeURIComponent(username)}/games/${year}/${month}/pgn`
}

export const buildArchivesPath = (username: string): string => {
  return `/player/${encodeURIComponent(username)}/games/archives`
}
