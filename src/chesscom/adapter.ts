import type { NormalizedGame } from "../normalized-game.js"
import type {
  ListRecentGamesOptions,
  ParsedGameRef,
  SiteAdapter,
} from "../site-adapter.js"
import { SiteAdapterError } from "../errors.js"
import {
  CHESSCOM_GAME_ID_RE,
  CHESSCOM_SITE_ID,
} from "./constants.js"
import {
  createChessComHttp,
  type ChessComFetch,
  type ChessComHttp,
} from "./http.js"
import {
  buildArchivesPath,
  buildMonthlyGamesPath,
  decodeChessComCompositeGameId,
  encodeChessComCompositeGameId,
  parseArchiveYearMonth,
} from "./game-id.js"
import { chessComGameToNormalized } from "./normalize.js"
import { extractChessComGameIdFromUrl, parseChessComUrl } from "./parse-url.js"
import type {
  ChessComArchivesResponse,
  ChessComGameJson,
  ChessComGamesResponse,
} from "./types.js"

export type CreateChessComAdapterOptions = {
  fetchImpl?: ChessComFetch
  baseUrl?: string
  now?: () => Date
}

const DEFAULT_MAX_GAMES = 20

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null
}

const assertArchivesResponse = (raw: unknown): ChessComArchivesResponse => {
  if (!isRecord(raw) || !Array.isArray(raw.archives)) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Chess.com archives payload is invalid",
    })
  }
  const archives = raw.archives.filter(
    (item): item is string => typeof item === "string",
  )
  return { archives }
}

const assertGamesResponse = (raw: unknown): ChessComGamesResponse => {
  if (!isRecord(raw) || !Array.isArray(raw.games)) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "Chess.com monthly games payload is invalid",
    })
  }
  return { games: raw.games as ChessComGameJson[] }
}

const gameMatchesId = (game: ChessComGameJson, gameId: string): boolean => {
  const fromUrl = extractChessComGameIdFromUrl(game.url)
  return fromUrl === gameId
}

const toParsedRef = (
  game: ChessComGameJson,
  username: string,
  year: string,
  month: string,
): ParsedGameRef | null => {
  const numericId = extractChessComGameIdFromUrl(game.url)
  if (numericId === null) {
    return null
  }
  return {
    site: CHESSCOM_SITE_ID,
    gameId: encodeChessComCompositeGameId({
      username,
      year,
      month,
      gameId: numericId,
    }),
    sourceUrl: game.url,
  }
}

export const createChessComAdapter = (
  options: CreateChessComAdapterOptions = {},
): SiteAdapter => {
  const httpOptions: {
    fetchImpl?: ChessComFetch
    baseUrl?: string
  } = {}
  if (options.fetchImpl !== undefined) {
    httpOptions.fetchImpl = options.fetchImpl
  }
  if (options.baseUrl !== undefined) {
    httpOptions.baseUrl = options.baseUrl
  }
  const http: ChessComHttp = createChessComHttp(httpOptions)
  const now = options.now ?? (() => new Date())

  const parseUrl = (url: string): ParsedGameRef | null => parseChessComUrl(url)

  const fetchMonthlyGames = async (
    username: string,
    year: string,
    month: string,
  ): Promise<ChessComGameJson[]> => {
    const response = await http.request(
      buildMonthlyGamesPath(username, year, month),
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    )
    const json: unknown = await response.json()
    return assertGamesResponse(json).games
  }

  const fetchGame = async (ref: ParsedGameRef): Promise<ChessComGameJson> => {
    if (ref.site !== CHESSCOM_SITE_ID) {
      throw new SiteAdapterError({
        code: "upstream_error",
        message: `ref site is not ${CHESSCOM_SITE_ID}`,
        details: { site: ref.site },
      })
    }

    const composite = decodeChessComCompositeGameId(ref.gameId)
    if (composite === null) {
      if (CHESSCOM_GAME_ID_RE.test(ref.gameId)) {
        throw new SiteAdapterError({
          code: "not_found",
          message:
            "Chess.com Published-Data API has no single-game endpoint; use a composite game id from listRecentGames (username/YYYY/MM/id)",
          details: { gameId: ref.gameId },
        })
      }
      throw new SiteAdapterError({
        code: "not_found",
        message: "invalid Chess.com game id",
        details: { gameId: ref.gameId },
      })
    }

    const games = await fetchMonthlyGames(
      composite.username,
      composite.year,
      composite.month,
    )
    const match = games.find((game) => gameMatchesId(game, composite.gameId))
    if (!match) {
      throw new SiteAdapterError({
        code: "not_found",
        message: "Chess.com game not found in monthly archive",
        details: {
          username: composite.username,
          year: composite.year,
          month: composite.month,
          gameId: composite.gameId,
        },
      })
    }
    return match
  }

  const listRecentGames = async (
    username: string,
    listOptions?: ListRecentGamesOptions,
  ): Promise<ParsedGameRef[]> => {
    const trimmed = username.trim()
    if (trimmed.length === 0) {
      throw new SiteAdapterError({
        code: "not_found",
        message: "username is empty",
      })
    }

    const maxGames = listOptions?.maxGames ?? DEFAULT_MAX_GAMES
    if (!Number.isInteger(maxGames) || maxGames < 1) {
      throw new SiteAdapterError({
        code: "upstream_error",
        message: "maxGames must be a positive integer",
        details: { maxGames },
      })
    }

    const archivesResponse = await http.request(buildArchivesPath(trimmed), {
      method: "GET",
      headers: { Accept: "application/json" },
    })
    const archivesJson: unknown = await archivesResponse.json()
    const { archives } = assertArchivesResponse(archivesJson)

    const refs: ParsedGameRef[] = []
    for (let i = archives.length - 1; i >= 0 && refs.length < maxGames; i -= 1) {
      const archiveUrl = archives[i]
      if (archiveUrl === undefined) {
        continue
      }
      const ym = parseArchiveYearMonth(archiveUrl)
      if (ym === null) {
        throw new SiteAdapterError({
          code: "upstream_error",
          message: "Chess.com archive URL is malformed",
          details: { archiveUrl },
        })
      }

      const games = await fetchMonthlyGames(trimmed, ym.year, ym.month)
      for (let j = games.length - 1; j >= 0 && refs.length < maxGames; j -= 1) {
        const game = games[j]
        if (game === undefined) {
          continue
        }
        const ref = toParsedRef(game, trimmed, ym.year, ym.month)
        if (ref !== null) {
          refs.push(ref)
        }
      }
    }

    return refs
  }

  const toNormalizedGame = (raw: unknown): NormalizedGame => {
    return chessComGameToNormalized(raw, now().toISOString())
  }

  return {
    id: CHESSCOM_SITE_ID,
    parseUrl,
    fetchGame,
    listRecentGames,
    toNormalizedGame,
  }
}

export const chessComAdapter = createChessComAdapter()
