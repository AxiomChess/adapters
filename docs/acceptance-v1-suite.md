# AxiomChess adapters acceptance suite v1

Language: English only. No emoji.

Generated: 2026-11-06 (T28)
Live network: none. Tests use recorded fixtures under `fixtures/lichess/` and `fixtures/chesscom/` only.

## Package checks

| Check | Status | Measured |
| --- | --- | --- |
| lint (eslint + tsc --noEmit) | PASS | 0 warnings |
| test (vitest) | PASS | 42/42 |
| build (tsc) | PASS | 0 warnings |

## Fixture coverage

- Lichess adapter offline fixtures: covered (export, user games, 429 -> rate_limited)
- Chess.com PubAPI offline fixtures: covered (archives, monthly games, rate_limited)
- PGN normalize + URL router + SSRF allowlist: covered
- Sites manifest matches implemented adapters: covered

## Notes

Canonical analyzer gates A1-A5: see `analyzer/docs/acceptance-v1-suite.md`.
Thresholds were not modified in this task.
