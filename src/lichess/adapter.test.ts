import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { SiteAdapterError } from "../errors.js"
import {
  createLichessAdapter,
  LICHESS_BASE_URL,
  LICHESS_RATE_LIMIT_WAIT_MS,
  LICHESS_SITE_ID,
  mapLichessHttpError,
  parseLichessUrl,
} from "./index.js"
import type { LichessFetch } from "./http.js"

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/lichess",
)

const readFixture = (name: string): string =>
  readFileSync(join(fixturesDir, name), "utf8")

type FixtureRoute = {
  match: (url: URL) => boolean
  status: number
  contentType: string
  body: string
}

const createFixtureFetch = (routes: FixtureRoute[]): LichessFetch => {
  return async (input) => {
    const url = typeof input === "string" ? new URL(input) : new URL(input.href)
    const route = routes.find((r) => r.match(url))
    if (!route) {
      throw new Error(`no fixture route for ${url.pathname}${url.search}`)
    }
    return new Response(route.body, {
      status: route.status,
      headers: { "Content-Type": route.contentType },
    })
  }
}

const fixtureRoutes = (): FixtureRoute[] => [
  {
    match: (url) => url.pathname === "/game/export/q7ZvsdUF",
    status: 200,
    contentType: "application/json",
    body: readFixture("export-q7ZvsdUF.json"),
  },
  {
    match: (url) => url.pathname === "/game/export/LE8yu7AO",
    status: 200,
    contentType: "application/json",
    body: readFixture("export-LE8yu7AO.json"),
  },
  {
    match: (url) => url.pathname === "/game/export/zzzzzzzz",
    status: 404,
    contentType: "application/json",
    body: readFixture("export-zzzzzzzz.json"),
  },
  {
    match: (url) => url.pathname.toLowerCase() === "/api/games/user/thibault",
    status: 200,
    contentType: "application/x-ndjson",
    body: readFixture("user-thibault.ndjson"),
  },
  {
    match: (url) => url.pathname === "/api/games/user/missinguser999",
    status: 404,
    contentType: "text/plain",
    body: "Invalid Lichess username",
  },
  {
    match: (url) => url.pathname === "/game/export/ratelimi",
    status: 429,
    contentType: "text/plain",
    body: readFixture("rate-limited.txt"),
  },
]

describe("parseLichessUrl", () => {
  it("parses public game URLs", () => {
    expect(parseLichessUrl("https://lichess.org/q7ZvsdUF")).toEqual({
      site: LICHESS_SITE_ID,
      gameId: "q7ZvsdUF",
      sourceUrl: `${LICHESS_BASE_URL}/q7ZvsdUF`,
    })
    expect(parseLichessUrl("https://lichess.org/q7ZvsdUF/black#12")?.gameId).toBe(
      "q7ZvsdUF",
    )
    expect(
      parseLichessUrl("https://lichess.org/game/export/q7ZvsdUF")?.gameId,
    ).toBe("q7ZvsdUF")
  })

  it("rejects non-Lichess hosts", () => {
    expect(parseLichessUrl("https://chess.com/game/12345678")).toBeNull()
    expect(parseLichessUrl("https://evil.example/q7ZvsdUF")).toBeNull()
  })
})

describe("mapLichessHttpError", () => {
  it("maps 429 with polite retry wait", () => {
    const error = mapLichessHttpError(429, "slow down")
    expect(error).toBeInstanceOf(SiteAdapterError)
    expect(error.code).toBe("rate_limited")
    expect(error.details).toMatchObject({
      retryAfterMs: LICHESS_RATE_LIMIT_WAIT_MS,
    })
    expect(LICHESS_RATE_LIMIT_WAIT_MS).toBe(60_000)
  })

  it("maps 404 and 403", () => {
    expect(mapLichessHttpError(404, "missing").code).toBe("not_found")
    expect(mapLichessHttpError(403, "private").code).toBe(
      "private_or_unavailable",
    )
  })
})

describe("lichess adapter fixtures (offline)", () => {
  const adapter = createLichessAdapter({
    fetchImpl: createFixtureFetch(fixtureRoutes()),
    now: () => new Date("2026-11-05T12:00:00.000Z"),
  })

  it("fetches and normalizes a standard public game", async () => {
    const ref = adapter.parseUrl("https://lichess.org/q7ZvsdUF")
    expect(ref).not.toBeNull()
    const raw = await adapter.fetchGame(ref!)
    const game = adapter.toNormalizedGame(raw)

    expect(game.site).toBe("lichess")
    expect(game.siteGameId).toBe("q7ZvsdUF")
    expect(game.variant).toBe("standard")
    expect(game.players.white.username).toBe("Lance5500")
    expect(game.players.black.username).toBe("TryingHard87")
    expect(game.timeControl).toBe("300+3")
    expect(game.pgn).toContain('[Variant "Standard"]')
    expect(game.clocks?.length).toBeGreaterThan(0)
    expect(game.clocks?.[0]).toBe(150.03)
    expect(game.fetchedAt).toBe("2026-11-05T12:00:00.000Z")
    expect(game.sourceUrl).toBe(`${LICHESS_BASE_URL}/q7ZvsdUF`)
  })

  it("rejects chess960 as unsupported_variant", async () => {
    const raw = await adapter.fetchGame({
      site: "lichess",
      gameId: "LE8yu7AO",
      sourceUrl: `${LICHESS_BASE_URL}/LE8yu7AO`,
    })
    expect(() => adapter.toNormalizedGame(raw)).toThrow(SiteAdapterError)
    try {
      adapter.toNormalizedGame(raw)
    } catch (error) {
      expect(error).toBeInstanceOf(SiteAdapterError)
      expect((error as SiteAdapterError).code).toBe("unsupported_variant")
    }
  })

  it("maps missing game export to not_found", async () => {
    await expect(
      adapter.fetchGame({
        site: "lichess",
        gameId: "zzzzzzzz",
        sourceUrl: `${LICHESS_BASE_URL}/zzzzzzzz`,
      }),
    ).rejects.toMatchObject({ code: "not_found" })
  })

  it("maps 429 on export to rate_limited", async () => {
    await expect(
      adapter.fetchGame({
        site: "lichess",
        gameId: "ratelimi",
        sourceUrl: `${LICHESS_BASE_URL}/ratelimi`,
      }),
    ).rejects.toMatchObject({
      code: "rate_limited",
      details: { retryAfterMs: 60_000 },
    })
  })

  it("lists recent public games from ndjson fixture", async () => {
    const refs = await adapter.listRecentGames("thibault", { maxGames: 2 })
    expect(refs).toHaveLength(2)
    expect(refs[0]?.gameId).toBe("PE5PRUAJ")
    expect(refs[1]?.gameId).toBe("k8OVq8Y5")
    expect(refs[0]?.sourceUrl).toBe(`${LICHESS_BASE_URL}/PE5PRUAJ`)
  })

  it("maps missing username to not_found", async () => {
    await expect(adapter.listRecentGames("missinguser999")).rejects.toMatchObject(
      { code: "not_found" },
    )
  })

  it("only requests official Lichess origin", () => {
    expect(LICHESS_BASE_URL).toBe("https://lichess.org")
  })
})
