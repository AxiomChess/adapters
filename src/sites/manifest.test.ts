import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { ALLOWED_SITE_HOSTS } from "../allowlist.js"
import { CHESSCOM_SITE_ID } from "../chesscom/constants.js"
import { LICHESS_SITE_ID } from "../lichess/constants.js"
import {
  SITE_ADAPTERS,
  SITES_MANIFEST,
  SITES_MANIFEST_VERSION,
  assertManifestMatchesAdapters,
  getSiteAdapter,
  getSupportedSiteById,
  getSupportedSites,
  sitesManifestToJson,
} from "./index.js"

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

describe("supported sites manifest", () => {
  it("lists exactly the implemented adapter ids", () => {
    expect(SITES_MANIFEST.version).toBe(SITES_MANIFEST_VERSION)
    expect(getSupportedSites().map((site) => site.id)).toEqual([
      LICHESS_SITE_ID,
      CHESSCOM_SITE_ID,
    ])
    assertManifestMatchesAdapters()
  })

  it("exposes parse_url, fetch_game, and list_recent_games for each site", () => {
    for (const site of getSupportedSites()) {
      expect(site.auth).toBe("none")
      expect(site.variants).toEqual(["standard"])
      expect(site.capabilities).toEqual([
        "parse_url",
        "fetch_game",
        "list_recent_games",
      ])
      expect(site.rateLimitWaitMs).toBe(60_000)
      expect(site.officialBaseUrl.startsWith("https://")).toBe(true)
      expect(getSiteAdapter(site.id)?.id).toBe(site.id)
    }
  })

  it("allowlisted hosts cover every host used by the SSRF allowlist", () => {
    const fromManifest = new Set(
      getSupportedSites().flatMap((site) => site.allowlistedHosts),
    )
    for (const host of ALLOWED_SITE_HOSTS) {
      expect(fromManifest.has(host)).toBe(true)
    }
  })

  it("looks up sites by id", () => {
    expect(getSupportedSiteById(LICHESS_SITE_ID)?.displayName).toBe("Lichess")
    expect(getSupportedSiteById(CHESSCOM_SITE_ID)?.displayName).toBe(
      "Chess.com",
    )
    expect(getSupportedSiteById("unknown")).toBeUndefined()
    expect(SITE_ADAPTERS[LICHESS_SITE_ID]?.id).toBe(LICHESS_SITE_ID)
  })

  it("committed sites.manifest.json matches the TypeScript manifest", () => {
    const onDisk = JSON.parse(
      readFileSync(join(packageRoot, "sites.manifest.json"), "utf8"),
    ) as unknown
    expect(onDisk).toEqual(sitesManifestToJson())
  })
})
