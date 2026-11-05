# Chess.com recorded fixtures

Recorded HTTP response bodies from the official Chess.com Published-Data API (`https://api.chess.com/pub/`). Used by offline unit tests only. Do not replace with live network calls in CI.

| File | Source |
| --- | --- |
| `archives-erik.json` | Trimmed `GET /player/erik/games/archives` (two archive months) |
| `games-erik-2009-09.json` | `GET /player/erik/games/2009/09` empty month |
| `games-erik-2009-10.json` | Trimmed `GET /player/erik/games/2009/10` (2 standard + 1 chess960) |
| `pgn-erik-2009-10.pgn` | Sample body for `GET /player/erik/games/2009/10/pgn` |
| `archives-missing.json` | `GET /player/missinguser999zzz/games/archives` HTTP 404 body |
| `rate-limited.txt` | Synthetic body for HTTP 429 mapping tests |

Official docs: https://www.chess.com/news/view/published-data-api

Note: PubAPI has no single-game-by-id endpoint. `fetchGame` uses composite ids `username/YYYY/MM/id` produced by `listRecentGames`.
