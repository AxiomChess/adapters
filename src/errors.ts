/**
 * Shared adapter error codes from PROJECT_SPEC.md section 9.
 * Do not invent codes outside this set without a plan change.
 */
export type AdapterErrorCode =
  | "not_found"
  | "private_or_unavailable"
  | "rate_limited"
  | "unsupported_variant"
  | "upstream_error"

export type AdapterError = {
  code: AdapterErrorCode
  message: string
  details?: unknown
}

export const isAdapterErrorCode = (value: string): value is AdapterErrorCode => {
  return (
    value === "not_found" ||
    value === "private_or_unavailable" ||
    value === "rate_limited" ||
    value === "unsupported_variant" ||
    value === "upstream_error"
  )
}

export class SiteAdapterError extends Error {
  readonly code: AdapterErrorCode
  readonly details?: unknown

  constructor(error: AdapterError) {
    super(error.message)
    this.name = "SiteAdapterError"
    this.code = error.code
    if ("details" in error) {
      this.details = error.details
    }
  }
}
