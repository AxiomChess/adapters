import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { SiteAdapterError } from "../errors.js"
import { normalizePgn } from "./normalize.js"

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
)

describe("normalizePgn", () => {
  it("canonicalizes tag order and line endings", () => {
    const messy = [
      '[Black "B"]\r',
      '[White "W"]\r\n',
      '[Result "1-0"]\r\n',
      '[Event "T"]\r\n',
      '[Date "2020.01.02"]\r\n',
      '[Site "S"]\r\n',
      '[Round "1"]\r\n',
      '[ECO "B00"]\r\n',
      "\r\n",
      "1. e4 e5 2. Nf3 1-0\r\n",
    ].join("")

    const result = normalizePgn(messy)
    expect(result.pgn).toBe(
      [
        '[Event "T"]',
        '[Site "S"]',
        '[Date "2020.01.02"]',
        '[Round "1"]',
        '[White "W"]',
        '[Black "B"]',
        '[Result "1-0"]',
        '[ECO "B00"]',
        "",
        "1. e4 e5 2. Nf3 1-0",
        "",
      ].join("\n"),
    )
    expect(result.tags.Event).toBe("T")
    expect(result.movetext).toBe("1. e4 e5 2. Nf3 1-0")
  })

  it("fills missing STR tags and sorts supplemental tags", () => {
    const result = normalizePgn('1. e4 e5 1/2-1/2')
    expect(result.tags.Event).toBe("?")
    expect(result.tags.Date).toBe("????.??.??")
    expect(result.tags.Result).toBe("1/2-1/2")
    expect(result.pgn.startsWith('[Event "?"]')).toBe(true)
  })

  it("normalizes recorded Chess.com fixture PGN", () => {
    const raw = readFileSync(
      join(fixturesDir, "chesscom/pgn-erik-2009-10.pgn"),
      "utf8",
    )
    const result = normalizePgn(raw)
    expect(result.tags.White).toBe("Mainline_Novelty")
    expect(result.tags.Black).toBe("erik")
    expect(result.tags.Result).toBe("1-0")
    expect(result.movetext.endsWith("1-0")).toBe(true)
    expect(result.pgn.indexOf('[Event "')).toBe(0)
    expect(result.pgn.indexOf('[Black "')).toBeLessThan(
      result.pgn.indexOf('[CurrentPosition "'),
    )
  })

  it("rejects empty, malformed, and non-standard variants", () => {
    expect(() => normalizePgn("")).toThrow(SiteAdapterError)
    expect(() => normalizePgn('[Event "x"')).toThrow(SiteAdapterError)
    expect(() =>
      normalizePgn('[Event "x"]\n[Event "y"]\n\n1. e4 *'),
    ).toThrow(SiteAdapterError)
    try {
      normalizePgn('[Variant "Crazyhouse"]\n\n1. e4 *')
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(SiteAdapterError)
      expect((error as SiteAdapterError).code).toBe("unsupported_variant")
    }
  })
})
