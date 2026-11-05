import { describe, expect, it } from "vitest"

import { parseGameUrl } from "./url-router.js"

describe("parseGameUrl", () => {
  it("routes Lichess URL samples", () => {
    expect(parseGameUrl("https://lichess.org/q7ZvsdUF")).toEqual({
      site: "lichess",
      gameId: "q7ZvsdUF",
      sourceUrl: "https://lichess.org/q7ZvsdUF",
    })
    expect(parseGameUrl("https://www.lichess.org/q7ZvsdUF/black#12")?.gameId).toBe(
      "q7ZvsdUF",
    )
    expect(
      parseGameUrl("https://lichess.org/game/export/q7ZvsdUF")?.gameId,
    ).toBe("q7ZvsdUF")
  })

  it("routes Chess.com URL samples", () => {
    expect(parseGameUrl("https://www.chess.com/game/live/15360860817")).toEqual({
      site: "chesscom",
      gameId: "15360860817",
      sourceUrl: "https://www.chess.com/game/live/15360860817",
    })
    expect(parseGameUrl("https://chess.com/game/daily/29099782")?.gameId).toBe(
      "29099782",
    )
  })

  it("rejects invalid hosts and non-game paths", () => {
    expect(parseGameUrl("https://evil.example/q7ZvsdUF")).toBeNull()
    expect(parseGameUrl("https://api.chess.com/pub/player/erik")).toBeNull()
    expect(parseGameUrl("https://127.0.0.1/q7ZvsdUF")).toBeNull()
    expect(parseGameUrl("https://lichess.org/@/thibault")).toBeNull()
    expect(parseGameUrl("https://www.chess.com/member/erik")).toBeNull()
    expect(parseGameUrl("https://user:pass@lichess.org/q7ZvsdUF")).toBeNull()
  })
})
