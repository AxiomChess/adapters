import { describe, expect, it } from "vitest"

import {
  isAdapterErrorCode,
  SiteAdapterError,
  type NormalizedGame,
  type SiteAdapter,
} from "./index.js"

describe("@axiomchess/adapters exports", () => {
  it("exports AdapterErrorCode helpers", () => {
    expect(isAdapterErrorCode("not_found")).toBe(true)
    expect(isAdapterErrorCode("private_or_unavailable")).toBe(true)
    expect(isAdapterErrorCode("rate_limited")).toBe(true)
    expect(isAdapterErrorCode("unsupported_variant")).toBe(true)
    expect(isAdapterErrorCode("upstream_error")).toBe(true)
    expect(isAdapterErrorCode("cheater")).toBe(false)
  })

  it("constructs SiteAdapterError with stable code", () => {
    const error = new SiteAdapterError({
      code: "rate_limited",
      message: "upstream returned 429",
    })
    expect(error).toBeInstanceOf(Error)
    expect(error.code).toBe("rate_limited")
    expect(error.message).toBe("upstream returned 429")
  })

  it("accepts a SiteAdapter shape that yields NormalizedGame", async () => {
    const game: NormalizedGame = {
      pgn: '[Event "Test"]\n\n1. e4 e5 *',
      site: "example",
      siteGameId: "abc",
      players: {
        white: { username: "white" },
        black: { username: "black" },
      },
      variant: "standard",
      sourceUrl: "https://example.test/game/abc",
      fetchedAt: "2026-11-05T00:00:00.000Z",
    }

    const adapter: SiteAdapter = {
      id: "example",
      parseUrl: (url) => {
        if (!url.includes("/game/")) {
          return null
        }
        return {
          site: "example",
          gameId: "abc",
          sourceUrl: url,
        }
      },
      fetchGame: async () => ({ ok: true }),
      listRecentGames: async () => [],
      toNormalizedGame: () => game,
    }

    const ref = adapter.parseUrl("https://example.test/game/abc")
    expect(ref?.gameId).toBe("abc")
    const raw = await adapter.fetchGame(ref!)
    expect(adapter.toNormalizedGame(raw).site).toBe("example")
    expect(adapter.toNormalizedGame(raw).variant).toBe("standard")
  })
})
