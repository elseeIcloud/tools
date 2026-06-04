// Single source of truth for every guide/article on the site.
// Drives the /guides index, navigation, SEO metadata, internal linking and the
// Article (BlogPosting) JSON-LD on each guide page.
//
// Bilingual: per-locale copy lives under `en` / `ru`. Bodies are hand-authored
// Vue under app/pages/guides/<slug>.vue (rich prose + internal links to tools).

import type { Tool } from './tools'

export interface GuideI18n {
  /** SEO <title> (without the site-name suffix) */
  title: string
  /** Page H1 (may read slightly differently from the SEO title) */
  h1: string
  /** Meta description (~150-160 chars) */
  description: string
  /** Short summary shown on the /guides index card */
  excerpt: string
  /** SEO keywords */
  keywords: string[]
}

export interface Guide {
  /** URL slug → /guides/<slug> (ru) and /en/guides/<slug> (en) */
  slug: string
  /** Publish date, ISO 'YYYY-MM-DD' (string → SSG-safe, no Date at build) */
  date: string
  /** Optional last-updated date, ISO 'YYYY-MM-DD' */
  updated?: string
  /** Emoji/text icon */
  icon: string
  /** Related tool slugs — linked in the "Tools in this guide" block */
  tools: string[]
  /** Related guide slugs — linked in the "More guides" block */
  related: string[]
  en: GuideI18n
  ru: GuideI18n
}

export const guides: Guide[] = [
  {
    slug: 'what-is-jwt',
    date: '2026-06-04',
    icon: '🔐',
    tools: ['jwt-decoder', 'jwt-verifier', 'jwt-generator'],
    related: ['what-is-base64', 'http-401-vs-403'],
    en: {
      title: 'What Is a JWT and How to Decode It — A Practical Guide',
      h1: 'What is a JWT and how to decode it',
      description:
        'Understand JSON Web Tokens: the header, payload and signature, base64url encoding, common claims like exp and iat, and how to safely decode and verify a JWT.',
      excerpt: 'The three parts of a JWT, what the claims mean, and how to decode and verify one safely.',
      keywords: ['what is jwt', 'how to decode jwt', 'jwt structure', 'jwt claims', 'jwt header payload signature', 'decode json web token'],
    },
    ru: {
      title: 'Что такое JWT и как его декодировать — практический гид',
      h1: 'Что такое JWT и как его декодировать',
      description:
        'Разбираемся в JSON Web Token: header, payload и подпись, кодирование base64url, частые claims (exp, iat) и как безопасно декодировать и проверить JWT.',
      excerpt: 'Три части JWT, что значат claims и как безопасно декодировать и проверять токен.',
      keywords: ['что такое jwt', 'как декодировать jwt', 'структура jwt', 'claims jwt', 'jwt header payload signature', 'декодировать json web token'],
    },
  },
  {
    slug: 'cron-expressions-explained',
    date: '2026-06-04',
    icon: '⏱',
    tools: ['cron-generator', 'unix-timestamp-converter', 'timezone-converter'],
    related: ['uuid-v4-vs-v7', 'css-px-rem-em'],
    en: {
      title: 'Cron Expressions Explained — Syntax and Examples',
      h1: 'Cron expressions explained, with examples',
      description:
        'Learn cron syntax: the five fields, special characters like *, /, , and -, and ready-to-copy examples such as "every 5 minutes", hourly, daily and weekly schedules.',
      excerpt: 'The five cron fields, special characters, and copy-ready examples for common schedules.',
      keywords: ['cron expression', 'cron syntax', 'cron every 5 minutes', 'crontab examples', 'cron schedule explained', 'cron format'],
    },
    ru: {
      title: 'Cron-выражения: синтаксис и примеры',
      h1: 'Cron-выражения: синтаксис и примеры',
      description:
        'Разбираем синтаксис cron: пять полей, спецсимволы *, /, , и -, и готовые примеры — «каждые 5 минут», ежечасно, ежедневно и еженедельно.',
      excerpt: 'Пять полей cron, спецсимволы и готовые примеры для частых расписаний.',
      keywords: ['cron выражение', 'синтаксис cron', 'cron каждые 5 минут', 'примеры crontab', 'расписание cron', 'формат cron'],
    },
  },
  {
    slug: 'what-is-base64',
    date: '2026-06-04',
    icon: '⇄',
    tools: ['base64-encode-decode', 'image-to-base64', 'url-encode-decode'],
    related: ['what-is-jwt', 'uuid-v4-vs-v7'],
    en: {
      title: 'What Is Base64 and Why It Is Used — Explained Simply',
      h1: 'What is Base64 and why it’s used',
      description:
        'Base64 explained: how binary-to-text encoding works, why it is used for data URIs, email and APIs, why it is not encryption, and the ~33% size overhead.',
      excerpt: 'How Base64 turns binary into text, where it’s used, and why it isn’t encryption.',
      keywords: ['what is base64', 'base64 encoding explained', 'base64 data uri', 'is base64 encryption', 'base64 overhead', 'base64 vs encryption'],
    },
    ru: {
      title: 'Что такое Base64 и зачем оно нужно — простыми словами',
      h1: 'Что такое Base64 и зачем оно нужно',
      description:
        'Base64 простыми словами: как работает кодирование двоичных данных в текст, зачем оно в data URI, письмах и API, почему это не шифрование и про +33% к размеру.',
      excerpt: 'Как Base64 превращает двоичные данные в текст, где применяется и почему это не шифрование.',
      keywords: ['что такое base64', 'base64 простыми словами', 'base64 data uri', 'base64 это шифрование', 'base64 размер', 'зачем base64'],
    },
  },
  {
    slug: 'uuid-v4-vs-v7',
    date: '2026-06-04',
    icon: '🆔',
    tools: ['uuid-generator', 'unix-timestamp-converter', 'hash-generator'],
    related: ['what-is-base64', 'cron-expressions-explained'],
    en: {
      title: 'UUID v4 vs v7 — Differences and When to Use Each',
      h1: 'UUID v4 vs v7: differences and when to use each',
      description:
        'Compare UUID v4 and v7: randomness vs time-ordering, why v7 is better for database keys and indexes, collision risk, and how to choose between them.',
      excerpt: 'Random v4 vs time-ordered v7 — collision risk, database performance, and which to pick.',
      keywords: ['uuid v4 vs v7', 'uuid v7', 'time ordered uuid', 'uuid for database key', 'uuid version difference', 'best uuid version'],
    },
    ru: {
      title: 'UUID v4 vs v7 — разница и когда что использовать',
      h1: 'UUID v4 vs v7: разница и когда что использовать',
      description:
        'Сравниваем UUID v4 и v7: случайность против упорядоченности по времени, почему v7 лучше для ключей и индексов БД, риск коллизий и как выбрать.',
      excerpt: 'Случайный v4 против упорядоченного v7 — коллизии, производительность БД и что выбрать.',
      keywords: ['uuid v4 vs v7', 'uuid v7', 'упорядоченный uuid', 'uuid для ключа бд', 'разница версий uuid', 'какая версия uuid'],
    },
  },
  {
    slug: 'css-px-rem-em',
    date: '2026-06-04',
    icon: 'px',
    tools: ['css-units-converter', 'color-converter', 'contrast-checker'],
    related: ['cron-expressions-explained', 'http-401-vs-403'],
    en: {
      title: 'px vs rem vs em in CSS — What’s the Difference?',
      h1: 'px, rem and em in CSS: what’s the difference',
      description:
        'Understand CSS units px, rem and em: absolute vs relative sizing, how rem and em inherit, accessibility and zoom, and when to use each — with examples.',
      excerpt: 'Absolute px vs relative rem/em, how they inherit, and which to use for accessible, scalable UI.',
      keywords: ['px vs rem', 'rem vs em', 'css units explained', 'when to use rem', 'px rem em difference', 'css relative units'],
    },
    ru: {
      title: 'px, rem и em в CSS — в чём разница?',
      h1: 'px, rem и em в CSS: в чём разница',
      description:
        'Разбираем единицы CSS px, rem и em: абсолютные и относительные размеры, как наследуются rem и em, доступность и зум, и когда что использовать — с примерами.',
      excerpt: 'Абсолютные px против относительных rem/em, наследование и что выбрать для доступного UI.',
      keywords: ['px или rem', 'rem или em', 'единицы css', 'когда использовать rem', 'разница px rem em', 'относительные единицы css'],
    },
  },
  {
    slug: 'http-401-vs-403',
    date: '2026-06-04',
    icon: '⚑',
    tools: ['http-status-codes', 'http-headers', 'jwt-decoder'],
    related: ['what-is-jwt', 'css-px-rem-em'],
    en: {
      title: 'HTTP 401 vs 403 and 301 vs 302 — Explained',
      h1: 'HTTP status codes: 401 vs 403 and 301 vs 302',
      description:
        'The difference between 401 and 403 (authentication vs authorization) and between 301 and 302 redirects (permanent vs temporary), with when to use each.',
      excerpt: '401 vs 403 (auth vs permissions) and 301 vs 302 (permanent vs temporary redirects), clarified.',
      keywords: ['401 vs 403', '301 vs 302', 'http status codes explained', 'difference 401 403', 'permanent vs temporary redirect', 'authentication vs authorization'],
    },
    ru: {
      title: 'HTTP 401 vs 403 и 301 vs 302 — разбираемся',
      h1: 'HTTP-коды: 401 vs 403 и 301 vs 302',
      description:
        'В чём разница между 401 и 403 (аутентификация и авторизация) и между редиректами 301 и 302 (постоянный и временный), и когда какой использовать.',
      excerpt: '401 vs 403 (аутентификация и права) и 301 vs 302 (постоянный и временный редирект) — понятно.',
      keywords: ['401 vs 403', '301 vs 302', 'http коды разбор', 'разница 401 403', 'постоянный или временный редирект', 'аутентификация и авторизация'],
    },
  },
]

const bySlug = new Map(guides.map((g) => [g.slug, g]))

export function getGuide(slug: string): Guide | undefined {
  return bySlug.get(slug)
}

/** Guides newest-first (stable: ties keep registry order). */
export function getGuidesSorted(): Guide[] {
  return [...guides].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getRelatedGuides(slug: string): Guide[] {
  const g = bySlug.get(slug)
  if (!g) return []
  return g.related.map((s) => bySlug.get(s)).filter((x): x is Guide => !!x)
}

/** Related tools for a guide, resolved against the tool registry. */
export function getGuideTools(slug: string): Tool[] {
  const g = bySlug.get(slug)
  if (!g) return []
  return g.tools.map((s) => getTool(s)).filter((x): x is Tool => !!x)
}

/** Reverse link: guides that reference a given tool (for tool-page cross-links). */
export function getGuidesForTool(toolSlug: string): Guide[] {
  return guides.filter((g) => g.tools.includes(toolSlug))
}

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Format an ISO 'YYYY-MM-DD' date for display. Pure → identical in Node + browser. */
export function formatGuideDate(iso: string, locale: 'en' | 'ru'): string {
  const [y, m, d] = iso.split('-').map(Number)
  const mi = (m || 1) - 1
  return locale === 'ru' ? `${d} ${MONTHS_RU[mi]} ${y} г.` : `${MONTHS_EN[mi]} ${d}, ${y}`
}
