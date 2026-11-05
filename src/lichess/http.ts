import { SiteAdapterError } from "../errors.js"
import {
  LICHESS_BASE_URL,
  LICHESS_RATE_LIMIT_WAIT_MS,
  LICHESS_USER_AGENT,
} from "./constants.js"

export type LichessFetch = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>

export type LichessHttpOptions = {
  fetchImpl?: LichessFetch
  baseUrl?: string
  userAgent?: string
}

const assertLichessUrl = (url: URL, baseUrl: string): void => {
  const allowed = new URL(baseUrl)
  if (url.origin !== allowed.origin) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: `refusing non-Lichess origin: ${url.origin}`,
      details: { origin: url.origin },
    })
  }
}

export const mapLichessHttpError = (
  status: number,
  bodyText: string,
): SiteAdapterError => {
  if (status === 429) {
    return new SiteAdapterError({
      code: "rate_limited",
      message:
        "Lichess returned 429; wait at least one minute before retrying",
      details: {
        status,
        retryAfterMs: LICHESS_RATE_LIMIT_WAIT_MS,
        body: bodyText.slice(0, 200),
      },
    })
  }

  if (status === 404) {
    return new SiteAdapterError({
      code: "not_found",
      message: "Lichess resource not found or unavailable",
      details: { status, body: bodyText.slice(0, 200) },
    })
  }

  if (status === 401 || status === 403) {
    return new SiteAdapterError({
      code: "private_or_unavailable",
      message: "Lichess game is private or unavailable",
      details: { status, body: bodyText.slice(0, 200) },
    })
  }

  return new SiteAdapterError({
    code: "upstream_error",
    message: `Lichess upstream HTTP ${status}`,
    details: { status, body: bodyText.slice(0, 200) },
  })
}

export const createLichessHttp = (options: LichessHttpOptions = {}) => {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const baseUrl = options.baseUrl ?? LICHESS_BASE_URL
  const userAgent = options.userAgent ?? LICHESS_USER_AGENT

  const request = async (
    pathWithQuery: string,
    init: RequestInit = {},
  ): Promise<Response> => {
    const url = new URL(pathWithQuery, baseUrl)
    assertLichessUrl(url, baseUrl)

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
        message: "Lichess request failed",
        details: { cause: String(cause) },
      })
    }

    if (!response.ok) {
      const bodyText = await response.text()
      throw mapLichessHttpError(response.status, bodyText)
    }

    return response
  }

  return { baseUrl, request }
}

export type LichessHttp = ReturnType<typeof createLichessHttp>
