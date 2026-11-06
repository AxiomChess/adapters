<p align="center">
  <img src="https://raw.githubusercontent.com/AxiomChess/design/main/assets/brand/banner.svg" alt="AxiomChess" width="880" />
</p>

# adapters

Chess site adapters (Lichess, Chess.com, future), PGN normalization, and recorded fixtures for AxiomChess.

## Package

`@axiomchess/adapters` is a TypeScript library. Exports:

- `SiteAdapter` -- per-site ingest interface (`parseUrl`, `fetchGame`, `listRecentGames`, `toNormalizedGame`)
- `NormalizedGame` -- shared normalized game contract
- `AdapterErrorCode` / `SiteAdapterError` -- stable error mapping codes from the project spec
- `parseGameUrl` -- multi-site URL router over allowlisted Lichess and Chess.com hosts
- `isAllowedSiteHost` / `isAllowedSiteUrl` / `parseAllowedSiteUrl` -- SSRF-safe host allowlist helpers
- `normalizePgn` -- canonical PGN export-format normalizer (Seven Tag Roster order)
- `createLichessAdapter` / `lichessAdapter` -- Lichess public API adapter (`https://lichess.org` only)
- `createChessComAdapter` / `chessComAdapter` -- Chess.com Published-Data API adapter (`https://api.chess.com/pub/` only)
- `SITES_MANIFEST` / `getSupportedSites` / `SITE_ADAPTERS` -- machine-readable supported sites list for API `GET /v1/sites` (also `sites.manifest.json`)

Tests use recorded fixtures under `fixtures/lichess/` and `fixtures/chesscom/`. No live Chess.com or Lichess calls in CI. On HTTP 429, wait at least 60 seconds before retrying (Lichess API tips; Chess.com polite serial retry). Chess.com has no single-game PubAPI endpoint; `fetchGame` uses composite ids `username/YYYY/MM/id` from `listRecentGames`.

## Scripts

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
```

Requires Node.js 20+ and pnpm 10+.

## Docs

https://axiomchess.github.io/docs/supported-sites.html

## License

MIT. See `LICENSE`.
