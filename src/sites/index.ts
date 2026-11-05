export {
  SITES_MANIFEST,
  SITES_MANIFEST_VERSION,
  SUPPORTED_SITES,
  getSupportedSiteById,
  getSupportedSites,
  sitesManifestToJson,
  type SiteCapability,
  type SitesManifest,
  type SupportedSiteEntry,
} from "./manifest.js"

export {
  SITE_ADAPTERS,
  assertManifestMatchesAdapters,
  getSiteAdapter,
} from "./registry.js"
