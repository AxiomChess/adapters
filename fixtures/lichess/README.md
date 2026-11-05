# Lichess recorded fixtures

Recorded HTTP response bodies from the official Lichess public API (`https://lichess.org`). Used by offline unit tests only. Do not replace with live network calls in CI.

| File | Source |
| --- | --- |
| `export-q7ZvsdUF.json` | `GET /game/export/q7ZvsdUF` Accept `application/json` with `pgnInJson=true` |
| `export-LE8yu7AO.json` | `GET /game/export/LE8yu7AO` (Chess960; unsupported in v1) |
| `export-zzzzzzzz.json` | `GET /game/export/zzzzzzzz` HTTP 404 body |
| `user-thibault.ndjson` | `GET /api/games/user/thibault?max=2&moves=false` Accept `application/x-ndjson` |
| `rate-limited.txt` | Synthetic body for HTTP 429 mapping tests |

Official docs: https://lichess.org/api , https://lichess.org/page/api-tips
