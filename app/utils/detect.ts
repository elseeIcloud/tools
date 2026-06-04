// "Smart paste": classify a pasted/typed string and suggest the right tool.
// Pure and dependency-free — used by the command palette. Order matters
// (more specific patterns first); returns at most a few suggestions.

export interface Detection {
  /** i18n key suffix under `detect.*` describing what was recognized */
  kind: string
  /** tool slug to open */
  slug: string
}

export function detectInput(raw: string): Detection[] {
  const s = raw.trim()
  if (s.length < 3) return []

  const out: Detection[] = []
  const seen = new Set<string>()
  const add = (kind: string, slug: string) => {
    if (!seen.has(slug)) {
      seen.add(slug)
      out.push({ kind, slug })
    }
  }

  // JWT — three base64url segments separated by dots.
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/.test(s) && s.split('.').length === 3) {
    add('jwt', 'jwt-decoder')
  }

  // JSON — starts like an object/array and parses.
  if (/^[[{]/.test(s)) {
    try {
      JSON.parse(s)
      add('json', 'json-formatter')
    } catch {
      /* not valid JSON */
    }
  }

  // URL.
  if (/^https?:\/\/\S+$/i.test(s)) {
    add('url', 'url-parser')
  }

  // CSS color — hex, rgb()/rgba(), hsl()/hsla().
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) || /^(rgb|hsl)a?\([\d.,\s%/]+\)$/i.test(s)) {
    add('color', 'color-converter')
  }

  // Unix timestamp — 10 (seconds) or 13 (ms) digits.
  if (/^\d{10}$/.test(s) || /^\d{13}$/.test(s)) {
    add('timestamp', 'unix-timestamp-converter')
  }

  // Binary — only 0/1 and spaces, at least one byte.
  if (/^[01\s]+$/.test(s) && s.replace(/\s/g, '').length >= 8) {
    add('binary', 'text-to-binary')
  }

  // Hex bytes — even-length hex (optionally 0x-prefixed/spaced) with a letter.
  const hex = s.replace(/^0x/i, '').replace(/\s+/g, '')
  if (/^[0-9a-f]+$/i.test(hex) && hex.length % 2 === 0 && hex.length >= 4 && /[a-f]/i.test(hex)) {
    add('hex', 'hex-to-text')
  }

  // Base64 — charset only, length a multiple of 4 (kept last; least specific).
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length >= 8 && s.length % 4 === 0) {
    add('base64', 'base64-encode-decode')
  }

  return out.slice(0, 3)
}
