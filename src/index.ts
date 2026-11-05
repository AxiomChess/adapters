export type { AdapterError, AdapterErrorCode } from "./errors.js"
export { SiteAdapterError, isAdapterErrorCode } from "./errors.js"

export type {
  ChessVariant,
  NormalizedGame,
  NormalizedPlayer,
} from "./normalized-game.js"

export type {
  ListRecentGamesOptions,
  ParsedGameRef,
  SiteAdapter,
} from "./site-adapter.js"

export {
  createLichessAdapter,
  lichessAdapter,
  LICHESS_BASE_URL,
  LICHESS_RATE_LIMIT_WAIT_MS,
  LICHESS_SITE_ID,
  mapLichessHttpError,
  parseLichessUrl,
  type CreateLichessAdapterOptions,
  type LichessGameJson,
} from "./lichess/index.js"
