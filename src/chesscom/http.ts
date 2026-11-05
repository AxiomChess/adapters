import { SiteAdapterError } from "../errors.js"
import {
  CHESSCOM_BASE_URL,
  CHESSCOM_ORIGIN,
  CHESSCOM_RATE_LIMIT_WAIT_MS,
  CHESSCOM_USER_AGENT,
} from "./constants.js"

export type ChessComFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>

export type ChessComHttpOptions = {
  fetchImpl?: ChessComFetch
  baseUrl?: string
  userAgent?: string
}

const assertChessComPubUrl = (url: URL): void => {
  if (url.origin !== CHESSCOM_ORIGIN) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: `refusing non-Chess.com PubAPI origin: ${url.origin}`,
      details: { origin: url.origin },
    })
  }
  if (!url.pathname.startsWith("/pub/")) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: `refusing non-/pub/ Chess.com path: ${url.pathname}`,
      details: { pathname: url.pathname },
    })
  }
}

const readRetryAfterMs = (response: Response): number | undefined => {
  const raw = response.headers.get("Retry-After")
  if (raw === null || raw.trim().length === 0) {
    return undefined
  }
  const asSeconds = Number(raw)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.ceil(asSeconds * 1000)
  }
  const asDate = Date.parse(raw)
  if (!Number.isNaN(asDate)) {
    const delta = asDate - Date.now()
    if (delta > 0) {
      return delta
    }
  }
  return undefined
}

export const mapChessComHttpError = (
  status: number,
  bodyText: string,
  retryAfterMs?: number,
): SiteAdapterError => {
  if (status === 429) {
    return new SiteAdapterError({
      code: "rate_limited",
      message:
        "Chess.com returned 429; retry serially after the polite wait",
      details: {
        status,
        retryAfterMs: retryAfterMs ?? CHESSCOM_RATE_LIMIT_WAIT_MS,
        body: bodyText.slice(0, 200),
      },
    })
  }

  if (status === 404 || status === 410) {
    return new SiteAdapterError({
      code: "not_found",
      message: "Chess.com resource not found or unavailable",
      details: { status, body: bodyText.slice(0, 200) },
    })
  }

  if (status === 401 || status === 403) {
    return new SiteAdapterError({
      code: "private_or_unavailable",
      message: "Chess.com game is private or unavailable",
      details: { status, body: bodyText.slice(0, 200) },
    })
  }

  return new SiteAdapterError({
    code: "upstream_error",
    message: `Chess.com upstream HTTP ${status}`,
    details: { status, body: bodyText.slice(0, 200) },
  })
}

export const createChessComHttp = (options: ChessComHttpOptions = {}) => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const baseUrl = options.baseUrl ?? CHESSCOM_BASE_URL
  const userAgent = options.userAgent ?? CHESSCOM_USER_AGENT

  const resolveUrl = (pathOrUrl: string): URL => {
    if (/^https?:\/\//i.test(pathOrUrl)) {
      return new URL(pathOrUrl)
    }
    const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
    const path = pathOrUrl.startsWith("/")
      ? pathOrUrl.slice(1)
      : pathOrUrl
    return new URL(path, base)
  }

  const request = async (
    pathOrUrl: string,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = resolveUrl(pathOrUrl)
    assertChessComPubUrl(url)

    const headers = new Headers(init.headers)
    if (!headers.has("User-Agent")) {
      headers.set("User-Agent", userAgent)
    }

    let response: Response
    try {
      response = await fetchImpl(url, { ...init, headers })
    } catch (cause) {
      throw new SiteAdapterError({
        code: "upstream_error",
        message: "Chess.com request failed",
        details: { cause: String(cause) },
      })
    }

    if (!response.ok) {
      const bodyText = await response.text()
      throw mapChessComHttpError(
        response.status,
        bodyText,
        readRetryAfterMs(response),
      )
    }

    return response
  }

  return { baseUrl, request }
}

export type ChessComHttp = ReturnType<typeof createChessComHttp>
