/**
 * Canonical PGN normalize to export-style text
 * (https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm).
 * STR tags first in fixed order; other tags ASCII-sorted; LF line endings;
 * blank line before movetext.
 */

import { SiteAdapterError } from "../errors.js"

export const SEVEN_TAG_ROSTER = [
  "Event",
  "Site",
  "Date",
  "Round",
  "White",
  "Black",
  "Result",
] as const

export type SevenTagName = (typeof SEVEN_TAG_ROSTER)[number]

const STR_DEFAULTS: Record<SevenTagName, string> = {
  Event: "?",
  Site: "?",
  Date: "????.??.??",
  Round: "?",
  White: "?",
  Black: "?",
  Result: "*",
}

const RESULT_VALUES = new Set(["1-0", "0-1", "1/2-1/2", "*"])

const TAG_LINE_RE = /^\s*\[\s*([A-Za-z0-9_]+)\s+"(.*)"\s*\]\s*$/
const TERMINATION_RE = /\b(1-0|0-1|1\/2-1\/2|\*)\s*$/

export type NormalizedPgn = {
  /** Export-format PGN text (LF, STR order, sorted extras) */
  pgn: string
  tags: Record<string, string>
  movetext: string
}

const unescapeTagValue = (raw: string): string => {
  let out = ""
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1]
      if (next === "\\" || next === '"') {
        out += next
        i += 1
        continue
      }
    }
    out += ch
  }
  return out
}

const escapeTagValue = (value: string): string => {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

const formatTagLine = (name: string, value: string): string => {
  return `[${name} "${escapeTagValue(value)}"]`
}

const isStandardVariant = (variant: string | undefined): boolean => {
  if (variant === undefined || variant.trim() === "") {
    return true
  }
  const v = variant.trim().toLowerCase()
  return v === "standard" || v === "chess"
}

const collapseMovetextWhitespace = (text: string): string => {
  return text.replace(/\s+/g, " ").trim()
}

/**
 * Normalize import-format or messy PGN into canonical export-format text.
 * Rejects empty input, malformed tags, missing movetext, and non-standard variants.
 */
export const normalizePgn = (input: string): NormalizedPgn => {
  if (typeof input !== "string" || input.trim().length === 0) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "PGN is empty",
    })
  }

  const text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  const lines = text.split("\n")
  const tags = new Map<string, string>()
  let movetextStart = 0

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (line === undefined) {
      break
    }
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      if (tags.size > 0) {
        movetextStart = i + 1
        break
      }
      continue
    }
    if (trimmed.startsWith("[")) {
      const match = TAG_LINE_RE.exec(trimmed)
      if (!match) {
        throw new SiteAdapterError({
          code: "upstream_error",
          message: `malformed PGN tag line: ${trimmed}`,
        })
      }
      const name = match[1]
      const rawValue = match[2]
      if (name === undefined || rawValue === undefined) {
        throw new SiteAdapterError({
          code: "upstream_error",
          message: `malformed PGN tag line: ${trimmed}`,
        })
      }
      if (tags.has(name)) {
        throw new SiteAdapterError({
          code: "upstream_error",
          message: `duplicate PGN tag: ${name}`,
        })
      }
      tags.set(name, unescapeTagValue(rawValue))
      movetextStart = i + 1
      continue
    }
    movetextStart = i
    break
  }

  const movetextRaw = lines.slice(movetextStart).join("\n")
  const movetext = collapseMovetextWhitespace(movetextRaw)
  if (movetext.length === 0) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "PGN movetext is missing",
    })
  }

  if (!isStandardVariant(tags.get("Variant"))) {
    throw new SiteAdapterError({
      code: "unsupported_variant",
      message: `unsupported PGN variant: ${tags.get("Variant")}`,
      details: { variant: tags.get("Variant") },
    })
  }

  const termination = TERMINATION_RE.exec(movetext)?.[1]
  const resultTag = tags.get("Result")
  if (resultTag !== undefined && !RESULT_VALUES.has(resultTag)) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: `invalid PGN Result tag: ${resultTag}`,
    })
  }
  if (
    resultTag !== undefined &&
    termination !== undefined &&
    resultTag !== termination
  ) {
    throw new SiteAdapterError({
      code: "upstream_error",
      message: "PGN Result tag does not match movetext termination",
      details: { resultTag, termination },
    })
  }

  const orderedTags: Record<string, string> = {}
  for (const name of SEVEN_TAG_ROSTER) {
    const value =
      tags.get(name) ??
      (name === "Result" && termination !== undefined
        ? termination
        : STR_DEFAULTS[name])
    orderedTags[name] = value
  }

  const extraNames = [...tags.keys()]
    .filter((name) => !(SEVEN_TAG_ROSTER as readonly string[]).includes(name))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

  for (const name of extraNames) {
    const value = tags.get(name)
    if (value !== undefined) {
      orderedTags[name] = value
    }
  }

  const tagLines = Object.entries(orderedTags).map(([name, value]) =>
    formatTagLine(name, value),
  )
  const pgn = `${tagLines.join("\n")}\n\n${movetext}\n`

  return { pgn, tags: orderedTags, movetext }
}
