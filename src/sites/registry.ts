/**
 * Registry of implemented site adapters keyed by manifest site id.
 */

import { chessComAdapter } from "../chesscom/adapter.js"
import { CHESSCOM_SITE_ID } from "../chesscom/constants.js"
import { lichessAdapter } from "../lichess/adapter.js"
import { LICHESS_SITE_ID } from "../lichess/constants.js"
import type { SiteAdapter } from "../site-adapter.js"
import { SITES_MANIFEST } from "./manifest.js"

export const SITE_ADAPTERS: Readonly<Record<string, SiteAdapter>> =
  Object.freeze({
    [LICHESS_SITE_ID]: lichessAdapter,
    [CHESSCOM_SITE_ID]: chessComAdapter,
  })

export const getSiteAdapter = (id: string): SiteAdapter | undefined => {
  return SITE_ADAPTERS[id]
}

/** Assert every manifest site has an adapter and every adapter is listed. */
export const assertManifestMatchesAdapters = (): void => {
  const manifestIds = SITES_MANIFEST.sites.map((site) => site.id)
  const adapterIds = Object.keys(SITE_ADAPTERS)

  for (const id of manifestIds) {
    const adapter = SITE_ADAPTERS[id]
    if (!adapter) {
      throw new Error(`manifest site "${id}" has no registered adapter`)
    }
    if (adapter.id !== id) {
      throw new Error(
        `adapter id "${adapter.id}" does not match manifest site "${id}"`,
      )
    }
  }

  for (const id of adapterIds) {
    if (!manifestIds.includes(id)) {
      throw new Error(`registered adapter "${id}" missing from sites manifest`)
    }
  }
}
