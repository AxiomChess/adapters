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
  ALLOWED_SITE_HOSTS,
  isAllowedSiteHost,
  isAllowedSiteUrl,
  parseAllowedSiteUrl,
  siteIdForHost,
  type AllowedSiteHost,
} from "./allowlist.js"

export {
  GAME_URL_PARSERS,
  parseGameUrl,
  type GameUrlParser,
} from "./url-router.js"

export {
  normalizePgn,
  SEVEN_TAG_ROSTER,
  type NormalizedPgn,
  type SevenTagName,
} from "./pgn/index.js"

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

export {
  createChessComAdapter,
  chessComAdapter,
  CHESSCOM_BASE_URL,
  CHESSCOM_ORIGIN,
  CHESSCOM_RATE_LIMIT_WAIT_MS,
  CHESSCOM_SITE_ID,
  buildMonthlyPgnPath,
  encodeChessComCompositeGameId,
  decodeChessComCompositeGameId,
  mapChessComHttpError,
  parseChessComUrl,
  type CreateChessComAdapterOptions,
  type ChessComGameJson,
} from "./chesscom/index.js"
