import type { NormalizedGame } from "../normalized-game.js"
import type {
  ListRecentGamesOptions,
  ParsedGameRef,
  SiteAdapter,
} from "../site-adapter.js"
import { SiteAdapterError } from "../errors.js"
import {
  LICHESS_BASE_URL,
  LICHESS_GAME_ID_RE,
  LICHESS_SITE_ID,
} from "./constants.js"
import {
  createLichessHttp,
  type LichessFetch,
  type LichessHttp,
} from "./http.js"
import { lichessGameToNormalized } from "./normalize.js"
import { parseLichessUrl } from "./parse-url.js"
import type { LichessGameJson } from "./types.js"

export type CreateLichessAdapterOptions = {
  fetchImpl?: LichessFetch
  baseUrl?: string
  now?: () => Date
}

const DEFAULT_MAX_GAMES = 20

const buildExportPath = (gameId: string): string => {
  const params = new URLSearchParams({
    pgnInJson: "true",
    clocks: "true",
    evals: "false",
    accuracy: "false",
    literate: "false",
    opening: "true",
  })
  return `/game/export/${gameId}?${params.toString()}`
}

const buildUserGamesPath = (username: string, maxGames: number): string => {
  const params = new URLSearchParams({
    max: String(maxGames),
    moves: "false",
    clocks: "false",
    evals: "false",
    opening: "false",
  })
  return `/api/games/user/${encodeURIComponent(username)}?${params.toString()}`
}

const parseNdjsonGameIds = (body: string): string[] => {
  const ids: string[] = []
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }
    let row: unknown
    try {
      row = JSON.parse(trimmed) as unknown
    } catch {
      throw new SiteAdapterError({
        code: "upstream_error",
        message: "invalid ndjson line from Lichess user games",
        details: { line: trimmed.slice(0, 120) },
      })
    }
    if (
      typeof row === "object" &&
      row !== null &&
      "id" in row &&
      typeof (row as { id: unknown }).id === "string"
    ) {
      ids.push((row as { id: string }).id)
    }
  }
  return ids
}

export const createLichessAdapter = (
  options: CreateLichessAdapterOptions = {},
): SiteAdapter => {
  const httpOptions: {
    fetchImpl?: LichessFetch
    baseUrl?: string
  } = {}
  if (options.fetchImpl !== undefined) {
    httpOptions.fetchImpl = options.fetchImpl
  }
  if (options.baseUrl !== undefined) {
    httpOptions.baseUrl = options.baseUrl
  }
  const http: LichessHttp = createLichessHttp(httpOptions)
  const now = options.now ?? (() => new Date())

  const parseUrl = (url: string): ParsedGameRef | null => parseLichessUrl(url)

  const fetchGame = async (ref: ParsedGameRef): Promise<LichessGameJson> => {
    if (ref.site !== LICHESS_SITE_ID) {
      throw new SiteAdapterError({
        code: "upstream_error",
        message: `ref site is not ${LICHESS_SITE_ID}`,
        details: { site: ref.site },
      })
    }
    if (!LICHESS_GAME_ID_RE.test(ref.gameId)) {
      throw new SiteAdapterError({
        code: "not_found",
        message: "invalid Lichess game id",
        details: { gameId: ref.gameId },
      })
    }

    const response = await http.request(buildExportPath(ref.gameId), {
      method: "GET",
      headers: { Accept: "application/json" },
    })
    const json: unknown = await response.json()
    return json as LichessGameJson
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

    const response = await http.request(buildUserGamesPath(trimmed, maxGames), {
      method: "GET",
      headers: { Accept: "application/x-ndjson" },
    })
    const body = await response.text()
    const ids = parseNdjsonGameIds(body)

    return ids.map((gameId) => ({
      site: LICHESS_SITE_ID,
      gameId,
      sourceUrl: `${LICHESS_BASE_URL}/${gameId}`,
    }))
  }

  const toNormalizedGame = (raw: unknown): NormalizedGame => {
    return lichessGameToNormalized(raw, now().toISOString())
  }

  return {
    id: LICHESS_SITE_ID,
    parseUrl,
    fetchGame,
    listRecentGames,
    toNormalizedGame,
  }
}

export const lichessAdapter = createLichessAdapter()
