# adapters

Chess site adapters (Lichess, Chess.com, future), PGN normalization, and recorded fixtures for AxiomChess.

## Package

`@axiomchess/adapters` is a TypeScript library. v1 bootstrap exports:

- `SiteAdapter` -- per-site ingest interface (`parseUrl`, `fetchGame`, `listRecentGames`, `toNormalizedGame`)
- `NormalizedGame` -- shared normalized game contract
- `AdapterErrorCode` / `SiteAdapterError` -- stable error mapping codes from the project spec

Site implementations and HTTP fixtures land in later roadmap tasks. Tests use recorded fixtures only; no live Chess.com or Lichess calls in CI.

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
