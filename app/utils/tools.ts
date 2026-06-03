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

export type ToolCategory = 'data' | 'text' | 'encoding' | 'web-security' | 'generators' | 'time-ids'

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
  'text',
  'encoding',
  'web-security',
  'generators',
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
  {
    slug: 'diff-checker',
    category: 'text',
    icon: '≠',
    related: ['text-counter', 'json-formatter', 'case-converter'],
    en: {
      name: 'Diff Checker',
      title: 'Diff Checker — Compare Two Texts Online',
      description:
        'Free online diff checker. Compare two blocks of text or code line by line and highlight what was added, removed or changed. Runs entirely in your browser.',
      keywords: ['text diff', 'diff checker', 'compare text', 'text compare', 'diff tool', 'compare two files'],
    },
    ru: {
      name: 'Сравнение текста (diff)',
      title: 'Diff-чекер — сравнение двух текстов онлайн',
      description:
        'Бесплатный онлайн diff-чекер. Сравнивайте два блока текста или кода построчно и подсвечивайте добавленное, удалённое и изменённое. Всё работает в браузере.',
      keywords: ['сравнение текста', 'diff чекер', 'сравнить текст', 'текстовый diff', 'сравнить два файла', 'diff онлайн'],
    },
  },
  {
    slug: 'color-converter',
    category: 'data',
    icon: '🎨',
    related: ['number-base-converter', 'json-formatter', 'hash-generator'],
    en: {
      name: 'Color Converter',
      title: 'Color Converter — HEX, RGB & HSL Online',
      description:
        'Free online color converter. Convert colors between HEX, RGB and HSL, pick a color visually, and preview it instantly. Everything runs in your browser.',
      keywords: ['color converter', 'hex to rgb', 'rgb to hex', 'hex to hsl', 'color picker', 'rgb hsl converter'],
    },
    ru: {
      name: 'Конвертер цветов',
      title: 'Конвертер цветов — HEX, RGB и HSL онлайн',
      description:
        'Бесплатный онлайн-конвертер цветов. Переводите цвета между HEX, RGB и HSL, выбирайте цвет визуально и сразу смотрите превью. Всё работает в браузере.',
      keywords: ['конвертер цветов', 'hex в rgb', 'rgb в hex', 'hex в hsl', 'выбор цвета', 'конвертер rgb hsl'],
    },
  },
  {
    slug: 'lorem-ipsum-generator',
    category: 'text',
    icon: '¶',
    related: ['text-counter', 'case-converter', 'slug-generator'],
    en: {
      name: 'Lorem Ipsum Generator',
      title: 'Lorem Ipsum Generator — Placeholder Text Online',
      description:
        'Free online Lorem Ipsum generator. Create placeholder paragraphs, sentences or words for mockups and layouts, then copy with one click. Runs in your browser.',
      keywords: ['lorem ipsum generator', 'lorem ipsum', 'placeholder text', 'dummy text', 'filler text', 'lipsum'],
    },
    ru: {
      name: 'Генератор Lorem Ipsum',
      title: 'Генератор Lorem Ipsum — текст-рыба онлайн',
      description:
        'Бесплатный онлайн-генератор Lorem Ipsum. Создавайте текст-рыбу — абзацы, предложения или слова — для макетов и вёрстки и копируйте в один клик. Работает в браузере.',
      keywords: ['генератор lorem ipsum', 'lorem ipsum', 'текст рыба', 'placeholder текст', 'рыба для текста', 'lipsum'],
    },
  },
  {
    slug: 'query-string-parser',
    category: 'encoding',
    icon: '?',
    related: ['url-encode-decode', 'base64-encode-decode', 'json-formatter'],
    en: {
      name: 'Query String Parser',
      title: 'Query String Parser — Parse & Build URL Parameters',
      description:
        'Free online query string parser. Split a URL query string into readable key-value pairs and build one back, with encoding handled for you. Runs in your browser.',
      keywords: ['query string parser', 'parse query string', 'url parameters', 'querystring', 'url query parser', 'build query string'],
    },
    ru: {
      name: 'Парсер query-строк',
      title: 'Парсер query-строк — разбор и сборка параметров URL',
      description:
        'Бесплатный онлайн-парсер query-строк. Разбивайте query-строку URL на читаемые пары ключ-значение и собирайте обратно, с автоматическим кодированием. Работает в браузере.',
      keywords: ['парсер query строки', 'разбор query string', 'параметры url', 'querystring', 'парсер url', 'собрать query строку'],
    },
  },
  {
    slug: 'case-converter',
    category: 'text',
    icon: 'Aa',
    related: ['slug-generator', 'text-counter', 'diff-checker'],
    en: {
      name: 'Case Converter',
      title: 'Case Converter — camelCase, snake_case, kebab-case & More',
      description:
        'Free online case converter. Convert text between camelCase, snake_case, kebab-case, CONSTANT_CASE, Title Case and more, instantly. Runs in your browser.',
      keywords: ['case converter', 'camelcase converter', 'snake case', 'kebab case', 'title case', 'convert case online'],
    },
    ru: {
      name: 'Конвертер регистра',
      title: 'Конвертер регистра — camelCase, snake_case, kebab-case и другие',
      description:
        'Бесплатный онлайн-конвертер регистра. Преобразуйте текст между camelCase, snake_case, kebab-case, CONSTANT_CASE, Title Case и другими стилями мгновенно. Работает в браузере.',
      keywords: ['конвертер регистра', 'camelcase', 'snake case', 'kebab case', 'title case', 'изменить регистр онлайн'],
    },
  },
  {
    slug: 'text-counter',
    category: 'text',
    icon: '∑',
    related: ['case-converter', 'lorem-ipsum-generator', 'diff-checker'],
    en: {
      name: 'Text Counter',
      title: 'Text Counter — Characters, Words & Lines Online',
      description:
        'Free online text counter. Count characters, words, sentences, lines and estimated reading time as you type. Everything runs in your browser.',
      keywords: ['text counter', 'word counter', 'character counter', 'letter count', 'line counter', 'count words online'],
    },
    ru: {
      name: 'Счётчик текста',
      title: 'Счётчик текста — символы, слова и строки онлайн',
      description:
        'Бесплатный онлайн-счётчик текста. Считайте символы, слова, предложения, строки и примерное время чтения прямо при вводе. Всё работает в браузере.',
      keywords: ['счётчик текста', 'счётчик слов', 'счётчик символов', 'подсчёт слов', 'количество символов', 'посчитать слова онлайн'],
    },
  },
  {
    slug: 'number-base-converter',
    category: 'data',
    icon: '0x',
    related: ['color-converter', 'hash-generator', 'unix-timestamp-converter'],
    en: {
      name: 'Number Base Converter',
      title: 'Number Base Converter — Binary, Octal, Decimal & Hex',
      description:
        'Free online number base converter. Convert numbers between binary, octal, decimal and hexadecimal instantly, with arbitrary bases supported. Runs in your browser.',
      keywords: ['number base converter', 'binary to decimal', 'decimal to hex', 'hex to binary', 'base converter', 'radix converter'],
    },
    ru: {
      name: 'Конвертер систем счисления',
      title: 'Конвертер систем счисления — двоичная, восьмеричная, десятичная и hex',
      description:
        'Бесплатный онлайн-конвертер систем счисления. Переводите числа между двоичной, восьмеричной, десятичной и шестнадцатеричной системами мгновенно. Работает в браузере.',
      keywords: ['конвертер систем счисления', 'двоичная в десятичную', 'десятичная в hex', 'hex в двоичную', 'перевод чисел', 'системы счисления'],
    },
  },
  {
    slug: 'slug-generator',
    category: 'text',
    icon: '🔗',
    related: ['case-converter', 'url-encode-decode', 'lorem-ipsum-generator'],
    en: {
      name: 'Slug Generator',
      title: 'Slug Generator — Create URL Slugs Online',
      description:
        'Free online slug generator. Turn any title into a clean, URL-safe slug with transliteration, lowercasing and hyphenation. Runs in your browser.',
      keywords: ['slug generator', 'slugify', 'url slug', 'make slug', 'slugify online', 'url friendly text'],
    },
    ru: {
      name: 'Генератор slug',
      title: 'Генератор slug — создание URL-слагов онлайн',
      description:
        'Бесплатный онлайн-генератор slug. Превращайте любой заголовок в чистый URL-безопасный slug с транслитерацией, нижним регистром и дефисами. Работает в браузере.',
      keywords: ['генератор slug', 'slugify', 'url slug', 'сделать slug', 'slugify онлайн', 'человекопонятный url'],
    },
  },
  {
    slug: 'html-entities',
    category: 'encoding',
    icon: '&',
    related: ['url-encode-decode', 'base64-encode-decode', 'json-formatter'],
    en: {
      name: 'HTML Entities Encode/Decode',
      title: 'HTML Entity Encoder & Decoder — Escape HTML Online',
      description:
        'Free online HTML entity encoder and decoder. Escape characters like <, >, & and quotes to HTML entities and convert them back. Everything runs in your browser.',
      keywords: ['html entities', 'html encode', 'html decode', 'escape html', 'html entity decoder', 'htmlspecialchars'],
    },
    ru: {
      name: 'HTML-сущности (кодирование/декодирование)',
      title: 'Кодировщик и декодировщик HTML-сущностей онлайн',
      description:
        'Бесплатный онлайн-кодировщик и декодировщик HTML-сущностей. Экранируйте символы <, >, & и кавычки в HTML-сущности и возвращайте обратно. Всё работает в браузере.',
      keywords: ['html сущности', 'html кодирование', 'html декодирование', 'экранирование html', 'декодер html', 'спецсимволы html'],
    },
  },
  {
    slug: 'markdown-preview',
    category: 'text',
    icon: 'M↓',
    related: ['diff-checker', 'text-counter', 'case-converter'],
    en: {
      name: 'Markdown Preview',
      title: 'Markdown Preview — Render Markdown to HTML Online',
      description:
        'Free online Markdown previewer. Write Markdown and see the rendered HTML live, plus copy the generated HTML. Everything runs in your browser.',
      keywords: ['markdown preview', 'markdown to html', 'markdown editor', 'md preview', 'render markdown', 'markdown viewer'],
    },
    ru: {
      name: 'Просмотр Markdown',
      title: 'Просмотр Markdown — рендер Markdown в HTML онлайн',
      description:
        'Бесплатный онлайн-просмотрщик Markdown. Пишите Markdown и сразу видите отрендеренный HTML, плюс копируйте готовый HTML. Всё работает в браузере.',
      keywords: ['просмотр markdown', 'markdown в html', 'редактор markdown', 'md preview', 'рендер markdown', 'markdown онлайн'],
    },
  },
  {
    slug: 'qr-code-generator',
    category: 'generators',
    icon: '▦',
    related: ['password-generator', 'url-encode-decode', 'uuid-generator'],
    en: {
      name: 'QR Code Generator',
      title: 'QR Code Generator — Create QR Codes Online (Free)',
      description:
        'Free online QR code generator. Turn any text, URL or contact into a QR code and download it as PNG or SVG. Generated entirely in your browser.',
      keywords: ['qr code generator', 'create qr code', 'qr generator', 'qr code maker', 'generate qr', 'url to qr'],
    },
    ru: {
      name: 'Генератор QR-кодов',
      title: 'Генератор QR-кодов — создание QR онлайн бесплатно',
      description:
        'Бесплатный онлайн-генератор QR-кодов. Превращайте текст, ссылку или контакт в QR-код и скачивайте его в PNG или SVG. Создаётся целиком в браузере.',
      keywords: ['генератор qr кода', 'создать qr код', 'qr генератор', 'сделать qr код', 'сгенерировать qr', 'ссылка в qr'],
    },
  },
  {
    slug: 'password-generator',
    category: 'generators',
    icon: '🔑',
    related: ['uuid-generator', 'hash-generator', 'qr-code-generator'],
    en: {
      name: 'Password Generator',
      title: 'Password Generator — Strong Random Passwords Online',
      description:
        'Free online password generator. Create strong, random passwords with custom length and character sets. Generated locally in your browser and never sent anywhere.',
      keywords: ['password generator', 'random password', 'strong password generator', 'secure password', 'generate password', 'password maker'],
    },
    ru: {
      name: 'Генератор паролей',
      title: 'Генератор паролей — надёжные случайные пароли онлайн',
      description:
        'Бесплатный онлайн-генератор паролей. Создавайте надёжные случайные пароли с настройкой длины и набора символов. Генерируется локально в браузере и никуда не отправляется.',
      keywords: ['генератор паролей', 'случайный пароль', 'надёжный пароль', 'безопасный пароль', 'сгенерировать пароль', 'придумать пароль'],
    },
  },
  {
    slug: 'image-to-base64',
    category: 'encoding',
    icon: '🖼',
    related: ['base64-encode-decode', 'url-encode-decode', 'color-converter'],
    en: {
      name: 'Image to Base64',
      title: 'Image to Base64 — Convert Images to a Data URI Online',
      description:
        'Free online image to Base64 converter. Drop an image to get a Base64 data URI for CSS or HTML, with one-click copy. Files are processed in your browser, never uploaded.',
      keywords: ['image to base64', 'base64 image', 'image to data uri', 'png to base64', 'convert image base64', 'image encoder'],
    },
    ru: {
      name: 'Изображение в Base64',
      title: 'Изображение в Base64 — конвертация картинок в data URI онлайн',
      description:
        'Бесплатный онлайн-конвертер изображений в Base64. Перетащите картинку и получите data URI в Base64 для CSS или HTML, с копированием в один клик. Файлы обрабатываются в браузере и не загружаются на сервер.',
      keywords: ['изображение в base64', 'base64 картинка', 'картинка в data uri', 'png в base64', 'конвертер изображений base64', 'кодировать изображение'],
    },
  },
  {
    slug: 'json-to-csv',
    category: 'data',
    icon: '↔',
    related: ['json-formatter', 'number-base-converter', 'base64-encode-decode'],
    en: {
      name: 'JSON ↔ CSV Converter',
      title: 'JSON to CSV Converter — Convert Both Ways Online',
      description:
        'Free online JSON to CSV and CSV to JSON converter. Convert an array of JSON objects to CSV and back, with delimiter options. Everything runs in your browser.',
      keywords: ['json to csv', 'csv to json', 'json csv converter', 'convert json to csv', 'csv json', 'json2csv'],
    },
    ru: {
      name: 'Конвертер JSON ↔ CSV',
      title: 'Конвертер JSON в CSV — преобразование в обе стороны онлайн',
      description:
        'Бесплатный онлайн-конвертер JSON в CSV и CSV в JSON. Преобразуйте массив JSON-объектов в CSV и обратно, с настройкой разделителя. Всё работает в браузере.',
      keywords: ['json в csv', 'csv в json', 'конвертер json csv', 'преобразовать json в csv', 'csv json', 'json2csv'],
    },
  },
  {
    slug: 'json-to-yaml',
    category: 'data',
    icon: 'Y',
    related: ['json-formatter', 'json-to-csv', 'number-base-converter'],
    en: {
      name: 'JSON ↔ YAML Converter',
      title: 'JSON to YAML Converter — Convert Both Ways Online',
      description:
        'Free online JSON to YAML and YAML to JSON converter. Convert configuration and data between JSON and YAML with proper formatting. Everything runs in your browser.',
      keywords: ['json to yaml', 'yaml to json', 'json yaml converter', 'convert yaml', 'yaml parser', 'yaml formatter'],
    },
    ru: {
      name: 'Конвертер JSON ↔ YAML',
      title: 'Конвертер JSON в YAML — преобразование в обе стороны онлайн',
      description:
        'Бесплатный онлайн-конвертер JSON в YAML и YAML в JSON. Преобразуйте конфиги и данные между JSON и YAML с корректным форматированием. Всё работает в браузере.',
      keywords: ['json в yaml', 'yaml в json', 'конвертер json yaml', 'преобразовать yaml', 'yaml парсер', 'форматтер yaml'],
    },
  },
  {
    slug: 'jwt-generator',
    category: 'web-security',
    icon: '🔏',
    related: ['jwt-decoder', 'hash-generator', 'base64-encode-decode'],
    en: {
      name: 'JWT Generator',
      title: 'JWT Generator — Create & Sign JSON Web Tokens (HS256)',
      description:
        'Free online JWT generator. Build a JSON Web Token from a header and payload and sign it with HS256/384/512 using your secret. Signing happens in your browser; the secret never leaves it.',
      keywords: ['jwt generator', 'create jwt', 'sign jwt', 'generate jwt', 'jwt encoder', 'hs256 jwt'],
    },
    ru: {
      name: 'Генератор JWT',
      title: 'Генератор JWT — создание и подпись JSON Web Token (HS256)',
      description:
        'Бесплатный онлайн-генератор JWT. Соберите JSON Web Token из header и payload и подпишите HS256/384/512 своим секретом. Подпись считается в браузере, секрет его не покидает.',
      keywords: ['генератор jwt', 'создать jwt', 'подписать jwt', 'сгенерировать jwt', 'jwt энкодер', 'hs256 jwt'],
    },
  },
  {
    slug: 'htpasswd-generator',
    category: 'web-security',
    icon: '.ht',
    related: ['password-generator', 'hash-generator', 'jwt-generator'],
    en: {
      name: '.htpasswd Generator',
      title: '.htpasswd Generator — Apache Password Hashes Online',
      description:
        'Free online .htpasswd generator. Create Apache/Nginx htpasswd entries with bcrypt or SHA-1 hashing for HTTP Basic Auth. Hashing runs in your browser; nothing is uploaded.',
      keywords: ['htpasswd generator', 'htpasswd', 'apache password', 'basic auth password', 'bcrypt htpasswd', 'htpasswd online'],
    },
    ru: {
      name: 'Генератор .htpasswd',
      title: 'Генератор .htpasswd — хеши паролей Apache онлайн',
      description:
        'Бесплатный онлайн-генератор .htpasswd. Создавайте записи htpasswd для Apache/Nginx с хешированием bcrypt или SHA-1 для HTTP Basic Auth. Хеширование в браузере, ничего не загружается.',
      keywords: ['генератор htpasswd', 'htpasswd', 'пароль apache', 'basic auth пароль', 'bcrypt htpasswd', 'htpasswd онлайн'],
    },
  },
  {
    slug: 'color-palette-generator',
    category: 'data',
    icon: '🌈',
    related: ['color-converter', 'number-base-converter', 'json-formatter'],
    en: {
      name: 'Color Palette Generator',
      title: 'Color Palette Generator — Shades, Tints & Schemes Online',
      description:
        'Free online color palette generator. Build shades, tints and harmonious schemes (complementary, analogous, triadic) from a base color, with copyable HEX values. Runs in your browser.',
      keywords: ['color palette generator', 'color scheme generator', 'shades generator', 'color harmony', 'palette maker', 'hex palette'],
    },
    ru: {
      name: 'Генератор палитры цветов',
      title: 'Генератор палитры цветов — оттенки, тинты и схемы онлайн',
      description:
        'Бесплатный онлайн-генератор палитры цветов. Стройте оттенки, тинты и гармоничные схемы (комплементарную, аналоговую, триадную) от базового цвета, с копированием HEX. Работает в браузере.',
      keywords: ['генератор палитры цветов', 'генератор цветовых схем', 'генератор оттенков', 'цветовая гармония', 'подбор палитры', 'hex палитра'],
    },
  },
  {
    slug: 'remove-duplicate-lines',
    category: 'text',
    icon: '≣',
    related: ['text-counter', 'diff-checker', 'case-converter'],
    en: {
      name: 'Remove Duplicate Lines',
      title: 'Remove Duplicate Lines — Deduplicate Text Online',
      description:
        'Free online duplicate line remover. Strip repeated lines from text, with options to trim, ignore case, sort and drop blank lines. Everything runs in your browser.',
      keywords: ['remove duplicate lines', 'deduplicate text', 'delete duplicate lines', 'unique lines', 'text dedupe', 'remove repeated lines'],
    },
    ru: {
      name: 'Удаление повторяющихся строк',
      title: 'Удаление повторяющихся строк — дедупликация текста онлайн',
      description:
        'Бесплатный онлайн-инструмент для удаления повторяющихся строк. Убирайте дубли строк с опциями обрезки пробелов, игнора регистра, сортировки и удаления пустых строк. Всё в браузере.',
      keywords: ['удаление повторяющихся строк', 'дедупликация текста', 'удалить дубли строк', 'уникальные строки', 'убрать повторы', 'удалить одинаковые строки'],
    },
  },
  {
    slug: 'string-escaper',
    category: 'encoding',
    icon: '\\',
    related: ['html-entities', 'url-encode-decode', 'json-formatter'],
    en: {
      name: 'String Escaper',
      title: 'String Escaper — Escape for Regex, SQL, JSON & More',
      description:
        'Free online string escaper. Escape text for regular expressions, SQL strings, JSON and backslash/C-style sequences, and unescape it back. Everything runs in your browser.',
      keywords: ['string escape', 'regex escape', 'sql escape', 'escape string online', 'json string escape', 'unescape string'],
    },
    ru: {
      name: 'Экранирование строк',
      title: 'Экранирование строк — escape для regex, SQL, JSON и не только',
      description:
        'Бесплатный онлайн-инструмент экранирования строк. Экранируйте текст для регулярных выражений, SQL-строк, JSON и backslash/C-последовательностей и снимайте экранирование обратно. Всё в браузере.',
      keywords: ['экранирование строк', 'escape regex', 'escape sql', 'экранировать строку онлайн', 'json escape', 'снять экранирование'],
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

// Curated "popular" tools for the homepage highlight row.
export const POPULAR_SLUGS = [
  'json-formatter',
  'base64-encode-decode',
  'jwt-decoder',
  'hash-generator',
  'uuid-generator',
  'password-generator',
  'qr-code-generator',
  'unix-timestamp-converter',
]

export function getPopular(): Tool[] {
  return POPULAR_SLUGS.map((s) => bySlug.get(s)).filter((t): t is Tool => !!t)
}
