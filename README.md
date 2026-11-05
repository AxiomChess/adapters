# adapters

Chess site adapters (Lichess, Chess.com, future), PGN normalization, and recorded fixtures for AxiomChess.

## Package

`@axiomchess/adapters` is a TypeScript library. Exports:

- `SiteAdapter` -- per-site ingest interface (`parseUrl`, `fetchGame`, `listRecentGames`, `toNormalizedGame`)
- `NormalizedGame` -- shared normalized game contract
- `AdapterErrorCode` / `SiteAdapterError` -- stable error mapping codes from the project spec
- `createLichessAdapter` / `lichessAdapter` -- Lichess public API adapter (`https://lichess.org` only)

Lichess tests use recorded fixtures under `fixtures/lichess/`. No live Chess.com or Lichess calls in CI. On HTTP 429, wait at least 60 seconds before retrying (Lichess API tips).

## Scripts

```sh
pnpm install
pnpm lint
pnpm test
pnpm build
```

Requires Node.js 20+ and pnpm 10+.

## License

MIT. See `LICENSE`.
