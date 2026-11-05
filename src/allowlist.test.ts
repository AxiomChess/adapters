import { describe, expect, it } from "vitest"

import {
  ALLOWED_SITE_HOSTS,
  isAllowedSiteHost,
  isAllowedSiteUrl,
  parseAllowedSiteUrl,
  siteIdForHost,
} from "./allowlist.js"

describe("SSRF allowlist", () => {
  it("lists only Lichess and Chess.com web hosts", () => {
    expect([...ALLOWED_SITE_HOSTS]).toEqual([
      "lichess.org",
      "www.lichess.org",
      "chess.com",
      "www.chess.com",
    ])
  })

  it("accepts allowlisted hosts", () => {
    expect(isAllowedSiteHost("lichess.org")).toBe(true)
    expect(isAllowedSiteHost("WWW.Chess.com")).toBe(true)
    expect(siteIdForHost("www.lichess.org")).toBe("lichess")
    expect(siteIdForHost("chess.com")).toBe("chesscom")
  })

  it("rejects non-allowlisted hosts and schemes", () => {
    expect(isAllowedSiteHost("evil.example")).toBe(false)
    expect(isAllowedSiteHost("api.chess.com")).toBe(false)
    expect(isAllowedSiteUrl("https://evil.example/q7ZvsdUF")).toBe(false)
    expect(isAllowedSiteUrl("file:///etc/passwd")).toBe(false)
    expect(isAllowedSiteUrl("https://127.0.0.1/q7ZvsdUF")).toBe(false)
    expect(
      isAllowedSiteUrl("https://user:pass@lichess.org/q7ZvsdUF"),
    ).toBe(false)
    expect(parseAllowedSiteUrl("not a url")).toBeNull()
    expect(siteIdForHost("evil.example")).toBeNull()
  })

  it("parses allowlisted game URLs", () => {
    const parsed = parseAllowedSiteUrl("https://lichess.org/q7ZvsdUF")
    expect(parsed?.hostname).toBe("lichess.org")
    expect(parsed?.pathname).toBe("/q7ZvsdUF")
  })
})
