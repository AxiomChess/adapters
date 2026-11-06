# Changelog

All notable changes to `@axiomchess/adapters` are documented in this file.

## [1.0.0] - 2026-11-06

### Added

- `SiteAdapter` / `NormalizedGame` contracts and shared error codes
- Lichess public API adapter with recorded fixtures
- Chess.com Published-Data API adapter (`https://api.chess.com/pub/` only) with recorded fixtures
- PGN normalization, URL router, and SSRF allowlist helpers
- Supported sites manifest (`SITES_MANIFEST` / `sites.manifest.json`) for API `/v1/sites`
- Offline fixture acceptance report for v1

### Notes

- First-party code: MIT. Official public endpoints only; no live network in tests.
