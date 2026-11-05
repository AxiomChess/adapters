/**
 * Machine-readable supported-sites manifest for API GET /v1/sites.
 * Must stay aligned with implemented SiteAdapter instances.
 */

import {
  CHESSCOM_BASE_URL,
  CHESSCOM_RATE_LIMIT_WAIT_MS,
  CHESSCOM_SITE_ID,
} from "../chesscom/constants.js"
import {
  LICHESS_BASE_URL,
  LICHESS_RATE_LIMIT_WAIT_MS,
  LICHESS_SITE_ID,
} from "../lichess/constants.js"

export const SITES_MANIFEST_VERSION = 1 as const

/** Capabilities exposed by a site adapter for the public API. */
export type SiteCapability =
  | "parse_url"
  | "fetch_game"
  | "list_recent_games"

export type SupportedSiteEntry = {
  id: string
  displayName: string
  officialBaseUrl: string
  documentationUrl: string
  auth: "none"
  variants: readonly ["standard"]
  capabilities: readonly SiteCapability[]
  allowlistedHosts: readonly string[]
  rateLimitWaitMs: number
  notes: string
}

export type SitesManifest = {
  version: typeof SITES_MANIFEST_VERSION
  sites: readonly SupportedSiteEntry[]
}

const LICHESS_SITE: SupportedSiteEntry = Object.freeze({
  id: LICHESS_SITE_ID,
  displayName: "Lichess",
  officialBaseUrl: LICHESS_BASE_URL,
  documentationUrl: "https://lichess.org/api",
  auth: "none",
  variants: Object.freeze(["standard"] as const),
  capabilities: Object.freeze([
    "parse_url",
    "fetch_game",
    "list_recent_games",
  ] as const),
  allowlistedHosts: Object.freeze(["lichess.org", "www.lichess.org"] as const),
  rateLimitWaitMs: LICHESS_RATE_LIMIT_WAIT_MS,
  notes:
    "Official public API only. One request at a time from a worker; after HTTP 429 wait at least 60 seconds (Lichess API tips).",
})

const CHESSCOM_SITE: SupportedSiteEntry = Object.freeze({
  id: CHESSCOM_SITE_ID,
  displayName: "Chess.com",
  officialBaseUrl: CHESSCOM_BASE_URL,
  documentationUrl: "https://www.chess.com/news/view/published-data-api",
  auth: "none",
  variants: Object.freeze(["standard"] as const),
  capabilities: Object.freeze([
    "parse_url",
    "fetch_game",
    "list_recent_games",
  ] as const),
  allowlistedHosts: Object.freeze(["chess.com", "www.chess.com"] as const),
  rateLimitWaitMs: CHESSCOM_RATE_LIMIT_WAIT_MS,
  notes:
    "Published-Data API only under https://api.chess.com/pub/. PubAPI has no single-game endpoint; fetch_game uses composite ids username/YYYY/MM/id from list_recent_games.",
})

export const SUPPORTED_SITES: readonly SupportedSiteEntry[] = Object.freeze([
  LICHESS_SITE,
  CHESSCOM_SITE,
])

export const SITES_MANIFEST: SitesManifest = Object.freeze({
  version: SITES_MANIFEST_VERSION,
  sites: SUPPORTED_SITES,
})

export const getSupportedSites = (): readonly SupportedSiteEntry[] => {
  return SITES_MANIFEST.sites
}

export const getSupportedSiteById = (
  id: string,
): SupportedSiteEntry | undefined => {
  return SITES_MANIFEST.sites.find((site) => site.id === id)
}

/** JSON-serializable snapshot for API responses and committed manifest file. */
export const sitesManifestToJson = (): SitesManifest => {
  return JSON.parse(JSON.stringify(SITES_MANIFEST)) as SitesManifest
}
