// Single source of truth for every tool on the site.
// Drives the homepage grid, navigation, SEO metadata, internal linking
// and the JSON-LD SoftwareApplication schema on each tool page.
//
// Bilingual: per-locale SEO copy lives under `en` / `ru`. Category is a stable
// key; its label is translated in i18n/locales/*.json under `categories.*`.

export type Locale = 'en' | 'ru'

export interface ToolI18n {
  /** Short display name (cards, nav, breadcrumb, H1) */
  name: string
  /** SEO <title> (without the site-name suffix) */
  title: string
  /** Meta description (~150-160 chars) */
  description: string
  /** SEO keywords */
  keywords: string[]
}

export type ToolCategory = 'data' | 'encoding' | 'web-security' | 'time-ids'

export interface Tool {
  /** URL slug, also the route path: /<slug> (ru) and /en/<slug> (en) */
  slug: string
  /** Category key; label is localized via t(`categories.<key>`) */
  category: ToolCategory
  /** Emoji/text icon (cheap, dependency-free) */
  icon: string
  /** Slugs of related tools for the "See also" block */
  related: string[]
  en: ToolI18n
  ru: ToolI18n
}

export const CATEGORY_ORDER: ToolCategory[] = [
  'data',
  'encoding',
  'web-security',
  'time-ids',
]

export const tools: Tool[] = [
  {
    slug: 'json-formatter',
    category: 'data',
    icon: '{ }',
    related: ['base64-encode-decode', 'jwt-decoder', 'url-encode-decode'],
    en: {
      name: 'JSON Formatter',
      title: 'JSON Formatter & Validator — Beautify, Minify & View JSON Online',
      description:
        'Free online JSON formatter, validator and viewer. Beautify or minify JSON, catch syntax errors with line numbers, and explore data in a collapsible tree. Runs in your browser — nothing is uploaded.',
      keywords: ['json formatter', 'json validator', 'json beautifier', 'json viewer', 'format json online', 'json minify'],
    },
    ru: {
      name: 'Форматтер JSON',
      title: 'Форматтер и валидатор JSON — красивый вид, минификация и дерево онлайн',
      description:
        'Бесплатный онлайн-форматтер, валидатор и просмотрщик JSON. Форматируйте или сжимайте JSON, находите синтаксические ошибки с номером строки и изучайте данные в виде сворачиваемого дерева. Всё в браузере — ничего не загружается.',
      keywords: ['форматтер json', 'валидатор json', 'красивый json', 'просмотр json', 'форматировать json онлайн', 'минифицировать json'],
    },
  },
  {
    slug: 'base64-encode-decode',
    category: 'encoding',
    icon: '⇄',
    related: ['url-encode-decode', 'json-formatter', 'jwt-decoder'],
    en: {
      name: 'Base64 Encode/Decode',
      title: 'Base64 Encode & Decode Online — Text and UTF-8 Safe',
      description:
        'Free online Base64 encoder and decoder. Convert text to Base64 and back, with full UTF-8 support and URL-safe mode. All conversion happens locally in your browser.',
      keywords: ['base64 encode', 'base64 decode', 'base64 converter', 'base64 online', 'encode base64', 'decode base64'],
    },
    ru: {
      name: 'Base64 кодирование/декодирование',
      title: 'Base64 онлайн — кодирование и декодирование текста с UTF-8',
      description:
        'Бесплатный онлайн-кодировщик и декодировщик Base64. Преобразуйте текст в Base64 и обратно с полной поддержкой UTF-8 и URL-safe режимом. Всё происходит локально в браузере.',
      keywords: ['base64 кодирование', 'base64 декодирование', 'base64 онлайн', 'декодировать base64', 'кодировать base64', 'base64 конвертер'],
    },
  },
  {
    slug: 'url-encode-decode',
    category: 'encoding',
    icon: '%',
    related: ['base64-encode-decode', 'json-formatter', 'jwt-decoder'],
    en: {
      name: 'URL Encode/Decode',
      title: 'URL Encode & Decode Online — Percent-Encoding Tool',
      description:
        'Free online URL encoder and decoder. Percent-encode query strings and decode escaped URLs, with full component and URI modes. Everything runs in your browser.',
      keywords: ['url encode', 'url decode', 'percent encoding', 'urlencode online', 'uri encode decode', 'escape url'],
    },
    ru: {
      name: 'URL кодирование/декодирование',
      title: 'URL кодирование и декодирование онлайн — percent-encoding',
      description:
        'Бесплатный онлайн URL-кодировщик и декодировщик. Кодируйте query-строки в percent-encoding и декодируйте экранированные URL, в режимах компонента и полного URI. Всё работает в браузере.',
      keywords: ['url кодирование', 'url декодирование', 'percent encoding', 'urlencode онлайн', 'декодировать url', 'экранирование url'],
    },
  },
  {
    slug: 'jwt-decoder',
    category: 'web-security',
    icon: '🔐',
    related: ['base64-encode-decode', 'json-formatter', 'hash-generator'],
    en: {
      name: 'JWT Decoder',
      title: 'JWT Decoder — Decode JSON Web Tokens Online',
      description:
        'Free online JWT decoder. Inspect the header, payload and signature of any JSON Web Token, with decoded timestamps and expiry checks. Tokens never leave your browser.',
      keywords: ['jwt decoder', 'decode jwt', 'json web token', 'jwt parser', 'jwt viewer', 'decode jwt online'],
    },
    ru: {
      name: 'Декодер JWT',
      title: 'Декодер JWT — разбор JSON Web Token онлайн',
      description:
        'Бесплатный онлайн-декодер JWT. Просматривайте header, payload и подпись любого JSON Web Token, с расшифровкой меток времени и проверкой срока действия. Токены не покидают браузер.',
      keywords: ['декодер jwt', 'декодировать jwt', 'json web token', 'разбор jwt', 'просмотр jwt', 'jwt онлайн'],
    },
  },
  {
    slug: 'cron-generator',
    category: 'time-ids',
    icon: '⏱',
    related: ['unix-timestamp-converter', 'uuid-generator', 'hash-generator'],
    en: {
      name: 'Cron Generator',
      title: 'Cron Expression Generator — Build & Explain Crontab Schedules',
      description:
        'Free online cron expression generator and explainer. Build crontab schedules with a visual editor, read them in plain English, and preview the next run times. Works entirely in your browser.',
      keywords: ['cron generator', 'cron expression', 'crontab generator', 'cron schedule', 'cron parser', 'cron to english'],
    },
    ru: {
      name: 'Генератор cron',
      title: 'Генератор cron-выражений — построение и расшифровка расписаний crontab',
      description:
        'Бесплатный онлайн-генератор и расшифровщик cron-выражений. Стройте расписания crontab, читайте их простым языком и смотрите ближайшие запуски. Полностью в браузере.',
      keywords: ['генератор cron', 'cron выражение', 'crontab генератор', 'расписание cron', 'cron парсер', 'cron на русском'],
    },
  },
  {
    slug: 'unix-timestamp-converter',
    category: 'time-ids',
    icon: '🕒',
    related: ['cron-generator', 'uuid-generator', 'json-formatter'],
    en: {
      name: 'Timestamp Converter',
      title: 'Unix Timestamp Converter — Epoch to Date & Date to Epoch',
      description:
        'Free online Unix timestamp converter. Convert epoch seconds or milliseconds to a human-readable date, and dates back to timestamps, in UTC and your local timezone. Runs in your browser.',
      keywords: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'date to timestamp', 'epoch to date', 'unix time'],
    },
    ru: {
      name: 'Конвертер timestamp',
      title: 'Конвертер Unix timestamp — epoch в дату и дата в epoch',
      description:
        'Бесплатный онлайн-конвертер Unix timestamp. Преобразуйте epoch в секундах или миллисекундах в читаемую дату и обратно, в UTC и вашем часовом поясе. Работает в браузере.',
      keywords: ['конвертер unix timestamp', 'epoch конвертер', 'timestamp в дату', 'дата в timestamp', 'epoch в дату', 'unix время'],
    },
  },
  {
    slug: 'uuid-generator',
    category: 'time-ids',
    icon: '🆔',
    related: ['hash-generator', 'unix-timestamp-converter', 'cron-generator'],
    en: {
      name: 'UUID Generator',
      title: 'UUID Generator — Generate v4 & v7 UUIDs Online',
      description:
        'Free online UUID generator. Generate cryptographically random v4 UUIDs and time-ordered v7 UUIDs in bulk, with copy and uppercase options. Generated locally in your browser.',
      keywords: ['uuid generator', 'guid generator', 'generate uuid', 'uuid v4', 'uuid v7', 'random uuid'],
    },
    ru: {
      name: 'Генератор UUID',
      title: 'Генератор UUID — UUID v4 и v7 онлайн',
      description:
        'Бесплатный онлайн-генератор UUID. Генерируйте криптослучайные UUID v4 и упорядоченные по времени UUID v7 пакетами, с копированием и верхним регистром. Создаётся локально в браузере.',
      keywords: ['генератор uuid', 'генератор guid', 'сгенерировать uuid', 'uuid v4', 'uuid v7', 'случайный uuid'],
    },
  },
  {
    slug: 'hash-generator',
    category: 'web-security',
    icon: '#',
    related: ['uuid-generator', 'jwt-decoder', 'base64-encode-decode'],
    en: {
      name: 'Hash Generator',
      title: 'Hash Generator — MD5, SHA-1, SHA-256 & SHA-512 Online',
      description:
        'Free online hash generator. Compute MD5, SHA-1, SHA-256 and SHA-512 checksums of any text instantly. All hashing runs locally in your browser — nothing is uploaded.',
      keywords: ['hash generator', 'md5 generator', 'sha256 generator', 'sha1 hash', 'sha512 hash', 'online hash'],
    },
    ru: {
      name: 'Генератор хешей',
      title: 'Генератор хешей — MD5, SHA-1, SHA-256 и SHA-512 онлайн',
      description:
        'Бесплатный онлайн-генератор хешей. Вычисляйте контрольные суммы MD5, SHA-1, SHA-256 и SHA-512 для любого текста мгновенно. Всё хешируется локально в браузере — ничего не загружается.',
      keywords: ['генератор хешей', 'md5 генератор', 'sha256 генератор', 'sha1 хеш', 'sha512 хеш', 'хеш онлайн'],
    },
  },
]

const bySlug = new Map(tools.map((t) => [t.slug, t]))

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug)
}

export function getRelated(slug: string): Tool[] {
  const tool = bySlug.get(slug)
  if (!tool) return []
  return tool.related.map((s) => bySlug.get(s)).filter((t): t is Tool => !!t)
}

export function toolsByCategory(): { category: ToolCategory; items: Tool[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: tools.filter((t) => t.category === category),
  })).filter((g) => g.items.length > 0)
}
