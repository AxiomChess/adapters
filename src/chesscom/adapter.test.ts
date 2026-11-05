import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { SiteAdapterError } from "../errors.js"
import {
  buildMonthlyPgnPath,
  CHESSCOM_BASE_URL,
  CHESSCOM_ORIGIN,
  CHESSCOM_RATE_LIMIT_WAIT_MS,
  CHESSCOM_SITE_ID,
  createChessComAdapter,
  encodeChessComCompositeGameId,
  mapChessComHttpError,
  parseChessComUrl,
} from "./index.js"
import type { ChessComFetch } from "./http.js"

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/chesscom",
)

const readFixture = (name: string): string =>
  readFileSync(join(fixturesDir, name), "utf8")

type FixtureRoute = {
  match: (url: URL) => boolean
  status: number
  contentType: string
  body: string
  headers?: Record<string, string>
}

const createFixtureFetch = (routes: FixtureRoute[]): ChessComFetch => {
  return async (input) => {
    const url = typeof input === "string" ? new URL(input) : new URL(input.href)
    const route = routes.find((r) => r.match(url))
    if (!route) {
      throw new Error(`no fixture route for ${url.pathname}${url.search}`)
    }
    return new Response(route.body, {
      status: route.status,
      headers: {
        "Content-Type": route.contentType,
        ...(route.headers ?? {}),
      },
    })
  }
}

const fixtureRoutes = (): FixtureRoute[] => [
  {
    match: (url) =>
      url.pathname.toLowerCase() === "/pub/player/erik/games/archives",
    status: 200,
    contentType: "application/json",
    body: readFixture("archives-erik.json"),
  },
  {
    match: (url) =>
      url.pathname.toLowerCase() === "/pub/player/erik/games/2009/09",
    status: 200,
    contentType: "application/json",
    body: readFixture("games-erik-2009-09.json"),
  },
  {
    match: (url) =>
      url.pathname.toLowerCase() === "/pub/player/erik/games/2009/10",
    status: 200,
    contentType: "application/json",
    body: readFixture("games-erik-2009-10.json"),
  },
  {
    match: (url) =>
      url.pathname.toLowerCase() === "/pub/player/erik/games/2009/10/pgn",
    status: 200,
    contentType: "application/x-chess-pgn",
    body: readFixture("pgn-erik-2009-10.pgn"),
  },
  {
    match: (url) =>
      url.pathname.toLowerCase() ===
      "/pub/player/missinguser999zzz/games/archives",
    status: 404,
    contentType: "application/json",
    body: readFixture("archives-missing.json"),
  },
  {
    match: (url) =>
      url.pathname.toLowerCase() === "/pub/player/erik/games/2099/01",
    status: 429,
    contentType: "text/plain",
    body: readFixture("rate-limited.txt"),
  },
]

describe("parseChessComUrl", () => {
  it("parses public live and daily game URLs", () => {
    expect(parseChessComUrl("https://www.chess.com/game/live/15360860817")).toEqual(
      {
        site: CHESSCOM_SITE_ID,
        gameId: "15360860817",
        sourceUrl: "https://www.chess.com/game/live/15360860817",
      },
    )
    expect(
      parseChessComUrl("https://chess.com/game/daily/29099782")?.gameId,
    ).toBe("29099782")
  })

  it("rejects non-Chess.com hosts and unsupported paths", () => {
    expect(parseChessComUrl("https://lichess.org/q7ZvsdUF")).toBeNull()
    expect(parseChessComUrl("https://evil.example/game/live/1")).toBeNull()
    expect(parseChessComUrl("https://www.chess.com/member/erik")).toBeNull()
  })
})

describe("mapChessComHttpError", () => {
  it("maps 429 with polite retry wait", () => {
    const error = mapChessComHttpError(429, "slow down")
    expect(error).toBeInstanceOf(SiteAdapterError)
    expect(error.code).toBe("rate_limited")
    expect(error.details).toMatchObject({
      retryAfterMs: CHESSCOM_RATE_LIMIT_WAIT_MS,
    })
    expect(CHESSCOM_RATE_LIMIT_WAIT_MS).toBe(60_000)
  })

  it("maps 404, 410, and 403", () => {
    expect(mapChessComHttpError(404, "missing").code).toBe("not_found")
    expect(mapChessComHttpError(410, "gone").code).toBe("not_found")
    expect(mapChessComHttpError(403, "private").code).toBe(
      "private_or_unavailable",
    )
  })
})

describe("chesscom adapter fixtures (offline)", () => {
  const adapter = createChessComAdapter({
    fetchImpl: createFixtureFetch(fixtureRoutes()),
    now: () => new Date("2026-11-05T12:00:00.000Z"),
  })

  it("fetches and normalizes a standard public game via composite id", async () => {
    const compositeId = encodeChessComCompositeGameId({
      username: "erik",
      year: "2009",
      month: "10",
      gameId: "29099782",
    })
    const raw = await adapter.fetchGame({
      site: CHESSCOM_SITE_ID,
      gameId: compositeId,
      sourceUrl: "https://www.chess.com/game/daily/29099782",
    })
    const game = adapter.toNormalizedGame(raw)

    expect(game.site).toBe("chesscom")
    expect(game.siteGameId).toBe("29099782")
    expect(game.variant).toBe("standard")
    expect(game.players.white.username).toBe("Mainline_Novelty")
    expect(game.players.black.username).toBe("erik")
    expect(game.timeControl).toBe("1/259200")
    expect(game.pgn).toContain('[Site "Chess.com"]')
    expect(game.fetchedAt).toBe("2026-11-05T12:00:00.000Z")
    expect(game.sourceUrl).toBe("https://www.chess.com/game/daily/29099782")
  })

  it("rejects chess960 as unsupported_variant", async () => {
    const compositeId = encodeChessComCompositeGameId({
      username: "erik",
      year: "2009",
      month: "10",
      gameId: "29210290",
    })
    const raw = await adapter.fetchGame({
      site: CHESSCOM_SITE_ID,
      gameId: compositeId,
      sourceUrl: "https://www.chess.com/game/daily/29210290",
    })
    expect(() => adapter.toNormalizedGame(raw)).toThrow(SiteAdapterError)
    try {
      adapter.toNormalizedGame(raw)
    } catch (error) {
      expect(error).toBeInstanceOf(SiteAdapterError)
      expect((error as SiteAdapterError).code).toBe("unsupported_variant")
    }
  })

  it("maps numeric-only game id to not_found (no single-game PubAPI)", async () => {
    await expect(
      adapter.fetchGame({
        site: CHESSCOM_SITE_ID,
        gameId: "29099782",
        sourceUrl: "https://www.chess.com/game/daily/29099782",
      }),
    ).rejects.toMatchObject({ code: "not_found" })
  })

  it("maps 429 on monthly archive to rate_limited", async () => {
    const compositeId = encodeChessComCompositeGameId({
      username: "erik",
      year: "2099",
      month: "01",
      gameId: "1",
    })
    await expect(
      adapter.fetchGame({
        site: CHESSCOM_SITE_ID,
        gameId: compositeId,
        sourceUrl: "https://www.chess.com/game/live/1",
      }),
    ).rejects.toMatchObject({
      code: "rate_limited",
      details: { retryAfterMs: 60_000 },
    })
  })

  it("lists recent public games from archives + monthly fixtures", async () => {
    const refs = await adapter.listRecentGames("erik", { maxGames: 2 })
    expect(refs).toHaveLength(2)
    expect(refs[0]?.gameId).toBe("erik/2009/10/29210290")
    expect(refs[1]?.gameId).toBe("erik/2009/10/29150975")
    expect(refs[0]?.sourceUrl).toBe(
      "https://www.chess.com/game/daily/29210290",
    )
  })

  it("maps missing username archives to not_found", async () => {
    await expect(
      adapter.listRecentGames("missinguser999zzz"),
    ).rejects.toMatchObject({ code: "not_found" })
  })

  it("only uses official Chess.com PubAPI origin and /pub/ base", () => {
    expect(CHESSCOM_BASE_URL).toBe("https://api.chess.com/pub")
    expect(CHESSCOM_ORIGIN).toBe("https://api.chess.com")
    expect(buildMonthlyPgnPath("erik", "2009", "10")).toBe(
      "/player/erik/games/2009/10/pgn",
    )
  })

  it("serves recorded monthly PGN fixture under /pub/ only", async () => {
    const fetchImpl = createFixtureFetch(fixtureRoutes())
    const pgnPath = buildMonthlyPgnPath("erik", "2009", "10").replace(
      /^\//,
      "",
    )
    const response = await fetchImpl(
      new URL(pgnPath, `${CHESSCOM_BASE_URL}/`),
    )
    expect(response.url || `${CHESSCOM_BASE_URL}/${pgnPath}`).toContain(
      "/pub/",
    )
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain('[Site "Chess.com"]')
    expect(body).toContain("Mainline_Novelty")
  })
})
