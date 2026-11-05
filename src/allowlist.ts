/**
 * SSRF-safe allowlist for public game URL ingest (PROJECT_SPEC.md section 12).
 * Only documented site web hosts; never follow arbitrary user URLs.
 */

import { CHESSCOM_SITE_ID } from "./chesscom/constants.js"
import { LICHESS_SITE_ID } from "./lichess/constants.js"

export const ALLOWED_SITE_HOSTS = Object.freeze([
  "lichess.org",
  "www.lichess.org",
  "chess.com",
  "www.chess.com",
] as const)

export type AllowedSiteHost = (typeof ALLOWED_SITE_HOSTS)[number]

const ALLOWED_HOST_SET = new Set<string>(ALLOWED_SITE_HOSTS)

/** Map allowlisted hostname to site adapter id. */
export const siteIdForHost = (hostname: string): string | null => {
  const host = hostname.toLowerCase()
  if (host === "lichess.org" || host === "www.lichess.org") {
    return LICHESS_SITE_ID
  }
  if (host === "chess.com" || host === "www.chess.com") {
    return CHESSCOM_SITE_ID
  }
  return null
}

export const isAllowedSiteHost = (hostname: string): boolean => {
  return ALLOWED_HOST_SET.has(hostname.toLowerCase())
}

/**
 * Parse and validate a candidate game URL against the host allowlist.
 * Rejects non-http(s), credentials, and non-allowlisted hosts.
 * Does not fetch; safe for SSRF gates before any network call.
 */
export const parseAllowedSiteUrl = (url: string): URL | null => {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return null
  }

  if (parsed.username !== "" || parsed.password !== "") {
    return null
  }

  if (!isAllowedSiteHost(parsed.hostname)) {
    return null
  }

  return parsed
}

export const isAllowedSiteUrl = (url: string): boolean => {
  return parseAllowedSiteUrl(url) !== null
}
