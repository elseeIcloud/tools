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

export type ToolCategory = 'data' | 'text' | 'encoding' | 'design' | 'image' | 'web-security' | 'reference' | 'generators' | 'time-ids'

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
  'design',
  'image',
  'web-security',
  'reference',
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
    category: 'design',
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
    category: 'image',
    icon: '🖼',
    related: ['image-compressor', 'image-format-converter', 'base64-encode-decode'],
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
    category: 'design',
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
  {
    slug: 'regex-tester',
    category: 'text',
    icon: '.*',
    related: ['string-escaper', 'text-counter', 'diff-checker'],
    en: {
      name: 'Regex Tester',
      title: 'Regex Tester — Test & Debug Regular Expressions Online',
      description:
        'Free online regex tester. Test regular expressions against your text with live match highlighting, capture groups and flags. Everything runs in your browser.',
      keywords: ['regex tester', 'regular expression tester', 'regex online', 'test regex', 'regex match', 'regexp tester'],
    },
    ru: {
      name: 'Тестер регулярных выражений',
      title: 'Тестер regex — проверка регулярных выражений онлайн',
      description:
        'Бесплатный онлайн-тестер регулярных выражений. Проверяйте regex на своём тексте с подсветкой совпадений, группами захвата и флагами. Всё работает в браузере.',
      keywords: ['тестер regex', 'регулярные выражения онлайн', 'проверить regex', 'regex тест', 'совпадения regex', 'regexp тестер'],
    },
  },
  {
    slug: 'url-parser',
    category: 'encoding',
    icon: '🌐',
    related: ['query-string-parser', 'url-encode-decode', 'base64-encode-decode'],
    en: {
      name: 'URL Parser',
      title: 'URL Parser — Break a URL into Its Parts Online',
      description:
        'Free online URL parser. Split any URL into protocol, host, port, path, query parameters and hash, with decoded values. Everything runs in your browser.',
      keywords: ['url parser', 'parse url', 'url components', 'url breakdown', 'url analyzer', 'url query params'],
    },
    ru: {
      name: 'Парсер URL',
      title: 'Парсер URL — разбор ссылки на части онлайн',
      description:
        'Бесплатный онлайн-парсер URL. Разбейте любую ссылку на протокол, хост, порт, путь, параметры запроса и якорь, с декодированными значениями. Всё работает в браузере.',
      keywords: ['парсер url', 'разобрать url', 'компоненты url', 'разбор ссылки', 'анализ url', 'параметры url'],
    },
  },
  {
    slug: 'ip-subnet-calculator',
    category: 'web-security',
    icon: 'IP',
    related: ['number-base-converter', 'http-status-codes', 'hash-generator'],
    en: {
      name: 'IP Subnet Calculator',
      title: 'IP Subnet Calculator — CIDR, Mask & Range Online',
      description:
        'Free online IP subnet calculator. Enter an IPv4 address with CIDR to get the network, broadcast, mask, host range and host count. Everything runs in your browser.',
      keywords: ['subnet calculator', 'ip calculator', 'cidr calculator', 'ipv4 subnet', 'network mask calculator', 'ip range'],
    },
    ru: {
      name: 'Калькулятор подсетей IP',
      title: 'Калькулятор подсетей IP — CIDR, маска и диапазон онлайн',
      description:
        'Бесплатный онлайн-калькулятор подсетей IP. Введите IPv4-адрес с CIDR и получите сеть, broadcast, маску, диапазон хостов и их число. Всё работает в браузере.',
      keywords: ['калькулятор подсетей', 'ip калькулятор', 'cidr калькулятор', 'подсеть ipv4', 'маска сети', 'диапазон ip'],
    },
  },
  {
    slug: 'css-gradient-generator',
    category: 'design',
    icon: '▥',
    related: ['color-converter', 'color-palette-generator', 'contrast-checker'],
    en: {
      name: 'CSS Gradient Generator',
      title: 'CSS Gradient Generator — Linear & Radial Gradients Online',
      description:
        'Free online CSS gradient generator. Build linear and radial gradients with multiple color stops and an angle, preview live and copy the CSS. Everything runs in your browser.',
      keywords: ['css gradient generator', 'gradient generator', 'linear gradient', 'radial gradient', 'css background gradient', 'gradient css'],
    },
    ru: {
      name: 'Генератор CSS-градиентов',
      title: 'Генератор CSS-градиентов — линейные и радиальные онлайн',
      description:
        'Бесплатный онлайн-генератор CSS-градиентов. Создавайте линейные и радиальные градиенты с несколькими точками цвета и углом, смотрите превью и копируйте CSS. Всё в браузере.',
      keywords: ['генератор css градиентов', 'генератор градиентов', 'линейный градиент', 'радиальный градиент', 'css фон градиент', 'градиент css'],
    },
  },
  {
    slug: 'contrast-checker',
    category: 'design',
    icon: '◐',
    related: ['color-converter', 'color-palette-generator', 'css-gradient-generator'],
    en: {
      name: 'Contrast Checker',
      title: 'Color Contrast Checker — WCAG AA & AAA Online',
      description:
        'Free online color contrast checker. Test foreground and background colors against WCAG AA and AAA ratios for accessible text. Everything runs in your browser.',
      keywords: ['contrast checker', 'wcag contrast', 'color contrast', 'accessibility contrast', 'contrast ratio', 'aa aaa contrast'],
    },
    ru: {
      name: 'Проверка контраста',
      title: 'Проверка контраста цветов — WCAG AA и AAA онлайн',
      description:
        'Бесплатный онлайн-инструмент проверки контраста. Проверяйте цвета текста и фона по нормам WCAG AA и AAA для доступности. Всё работает в браузере.',
      keywords: ['проверка контраста', 'wcag контраст', 'контраст цветов', 'контраст доступность', 'коэффициент контраста', 'aa aaa контраст'],
    },
  },
  {
    slug: 'jwt-verifier',
    category: 'web-security',
    icon: '✔',
    related: ['jwt-decoder', 'jwt-generator', 'hash-generator'],
    en: {
      name: 'JWT Verifier',
      title: 'JWT Verifier — Verify JSON Web Token Signatures (HS256)',
      description:
        'Free online JWT verifier. Check whether a JSON Web Token HMAC signature is valid for your secret, and inspect its claims and expiry. The secret never leaves your browser.',
      keywords: ['jwt verifier', 'verify jwt', 'jwt signature', 'validate jwt', 'check jwt', 'jwt verify online'],
    },
    ru: {
      name: 'Проверка JWT',
      title: 'Проверка JWT — валидация подписи JSON Web Token (HS256)',
      description:
        'Бесплатный онлайн-инструмент проверки JWT. Убедитесь, что HMAC-подпись JSON Web Token верна для вашего секрета, и просмотрите claims и срок действия. Секрет не покидает браузер.',
      keywords: ['проверка jwt', 'валидация jwt', 'подпись jwt', 'проверить jwt', 'верификация jwt', 'jwt verify онлайн'],
    },
  },
  {
    slug: 'timezone-converter',
    category: 'time-ids',
    icon: '🌍',
    related: ['unix-timestamp-converter', 'cron-generator', 'uuid-generator'],
    en: {
      name: 'Timezone Converter',
      title: 'Timezone Converter — Convert Time Across Zones Online',
      description:
        'Free online timezone converter. Convert a date and time between time zones, see UTC offsets and compare multiple zones at once. Everything runs in your browser.',
      keywords: ['timezone converter', 'time zone converter', 'utc converter', 'convert time zones', 'world clock', 'time difference'],
    },
    ru: {
      name: 'Конвертер часовых поясов',
      title: 'Конвертер часовых поясов — перевод времени между зонами онлайн',
      description:
        'Бесплатный онлайн-конвертер часовых поясов. Переводите дату и время между поясами, смотрите смещения UTC и сравнивайте несколько зон сразу. Всё работает в браузере.',
      keywords: ['конвертер часовых поясов', 'конвертер времени', 'utc конвертер', 'перевод часовых поясов', 'мировое время', 'разница во времени'],
    },
  },
  {
    slug: 'http-status-codes',
    category: 'reference',
    icon: '⚑',
    related: ['http-headers', 'mime-types', 'url-parser'],
    en: {
      name: 'HTTP Status Codes',
      title: 'HTTP Status Codes — Reference & Lookup (1xx–5xx)',
      description:
        'Free HTTP status code reference. Search and browse every HTTP status code (1xx–5xx) with its meaning and when to use it — a fast, searchable cheat sheet in your browser.',
      keywords: ['http status codes', 'status code list', 'http 404', 'http 500', 'status code meaning', 'http response codes'],
    },
    ru: {
      name: 'HTTP-коды состояния',
      title: 'HTTP-коды состояния — справочник и поиск (1xx–5xx)',
      description:
        'Бесплатный справочник HTTP-кодов состояния. Ищите и просматривайте все коды (1xx–5xx) с описанием и когда их применять — быстрая шпаргалка с поиском в браузере.',
      keywords: ['http коды состояния', 'список кодов состояния', 'http 404', 'http 500', 'значение кода состояния', 'коды ответа http'],
    },
  },
  {
    slug: 'sql-formatter',
    category: 'data',
    icon: 'SQL',
    related: ['json-formatter', 'xml-formatter', 'json-to-yaml'],
    en: {
      name: 'SQL Formatter',
      title: 'SQL Formatter — Beautify & Format SQL Queries Online',
      description:
        'Free online SQL formatter and beautifier. Pretty-print messy SQL with proper indentation and keyword casing for MySQL, PostgreSQL, SQL Server, SQLite and more. Runs entirely in your browser.',
      keywords: ['sql formatter', 'format sql', 'sql beautifier', 'pretty print sql', 'sql formatter online', 'beautify sql query'],
    },
    ru: {
      name: 'Форматтер SQL',
      title: 'Форматтер SQL — красивое форматирование SQL-запросов онлайн',
      description:
        'Бесплатный онлайн-форматтер SQL. Приводите запутанные запросы к читаемому виду с отступами и регистром ключевых слов для MySQL, PostgreSQL, SQL Server, SQLite и других. Всё работает в браузере.',
      keywords: ['форматтер sql', 'форматировать sql', 'красивый sql', 'beautify sql', 'sql форматтер онлайн', 'отформатировать sql запрос'],
    },
  },
  {
    slug: 'xml-formatter',
    category: 'data',
    icon: 'XML',
    related: ['json-formatter', 'sql-formatter', 'json-to-yaml'],
    en: {
      name: 'XML Formatter',
      title: 'XML Formatter & Beautifier — Format and Minify XML Online',
      description:
        'Free online XML formatter, beautifier and validator. Indent messy XML, minify it, and catch well-formedness errors. Everything runs in your browser — nothing is uploaded.',
      keywords: ['xml formatter', 'format xml', 'xml beautifier', 'xml validator', 'minify xml', 'pretty print xml'],
    },
    ru: {
      name: 'Форматтер XML',
      title: 'Форматтер XML — форматирование и минификация XML онлайн',
      description:
        'Бесплатный онлайн-форматтер, beautifier и валидатор XML. Делайте отступы в запутанном XML, сжимайте его и находите ошибки разметки. Всё работает в браузере — ничего не загружается.',
      keywords: ['форматтер xml', 'форматировать xml', 'xml beautifier', 'валидатор xml', 'минифицировать xml', 'красивый xml'],
    },
  },
  {
    slug: 'box-shadow-generator',
    category: 'design',
    icon: '▢',
    related: ['css-gradient-generator', 'color-converter', 'cubic-bezier-generator'],
    en: {
      name: 'Box Shadow Generator',
      title: 'CSS Box Shadow Generator — Visual box-shadow Builder Online',
      description:
        'Free online CSS box-shadow generator. Build layered shadows with offset, blur, spread, color and inset, preview them live and copy the CSS. Everything runs in your browser.',
      keywords: ['box shadow generator', 'css box shadow', 'box-shadow generator', 'shadow css', 'css shadow maker', 'box shadow css'],
    },
    ru: {
      name: 'Генератор box-shadow',
      title: 'Генератор CSS box-shadow — визуальный конструктор тени онлайн',
      description:
        'Бесплатный онлайн-генератор CSS box-shadow. Стройте тени со смещением, размытием, разбросом, цветом и inset, смотрите превью и копируйте CSS. Всё работает в браузере.',
      keywords: ['генератор box shadow', 'css box shadow', 'генератор тени css', 'тень css', 'box-shadow генератор', 'css тень'],
    },
  },
  {
    slug: 'css-units-converter',
    category: 'design',
    icon: 'px',
    related: ['color-converter', 'box-shadow-generator', 'number-base-converter'],
    en: {
      name: 'CSS Units Converter',
      title: 'PX to REM Converter — px, rem, em & pt CSS Units Online',
      description:
        'Free online CSS unit converter. Convert between px, rem, em, pt and percent with a configurable root font size, in both directions. Everything runs in your browser.',
      keywords: ['px to rem', 'rem to px', 'css unit converter', 'px to em', 'px rem converter', 'convert px to rem'],
    },
    ru: {
      name: 'Конвертер единиц CSS',
      title: 'Конвертер px в rem — единицы px, rem, em и pt онлайн',
      description:
        'Бесплатный онлайн-конвертер единиц CSS. Переводите между px, rem, em, pt и процентами с настраиваемым базовым размером шрифта, в обе стороны. Всё работает в браузере.',
      keywords: ['px в rem', 'rem в px', 'конвертер единиц css', 'px в em', 'конвертер px rem', 'перевести px в rem'],
    },
  },
  {
    slug: 'cubic-bezier-generator',
    category: 'design',
    icon: '∿',
    related: ['box-shadow-generator', 'css-gradient-generator', 'color-converter'],
    en: {
      name: 'Cubic Bezier Generator',
      title: 'CSS Cubic Bezier Generator — Easing Curve Editor Online',
      description:
        'Free online cubic-bezier easing generator. Drag the curve, preview the animation and copy the CSS cubic-bezier() timing function, with common easing presets. Runs in your browser.',
      keywords: ['cubic bezier generator', 'css easing', 'cubic-bezier', 'easing function', 'animation curve', 'cubic bezier editor'],
    },
    ru: {
      name: 'Генератор cubic-bezier',
      title: 'Генератор CSS cubic-bezier — редактор кривой плавности онлайн',
      description:
        'Бесплатный онлайн-генератор кривых cubic-bezier. Двигайте кривую, смотрите превью анимации и копируйте CSS-функцию cubic-bezier(), с готовыми пресетами плавности. Работает в браузере.',
      keywords: ['генератор cubic bezier', 'css easing', 'cubic-bezier', 'функция плавности', 'кривая анимации', 'редактор cubic bezier'],
    },
  },
  {
    slug: 'mime-types',
    category: 'reference',
    icon: '🗂',
    related: ['http-headers', 'http-status-codes', 'image-to-base64'],
    en: {
      name: 'MIME Types',
      title: 'MIME Types List — Content-Type Reference & Lookup',
      description:
        'Free MIME type reference. Search common Content-Type values and file extensions (application/json, image/webp, text/csv and more) with descriptions. A fast, searchable cheat sheet in your browser.',
      keywords: ['mime types', 'content type', 'mime type list', 'file extension mime', 'content-type reference', 'mime type lookup'],
    },
    ru: {
      name: 'MIME-типы',
      title: 'Список MIME-типов — справочник Content-Type и поиск',
      description:
        'Бесплатный справочник MIME-типов. Ищите распространённые значения Content-Type и расширения файлов (application/json, image/webp, text/csv и другие) с описаниями. Быстрая шпаргалка с поиском в браузере.',
      keywords: ['mime типы', 'content type', 'список mime типов', 'mime тип файла', 'справочник content-type', 'поиск mime типа'],
    },
  },
  {
    slug: 'ascii-table',
    category: 'reference',
    icon: '🔤',
    related: ['number-base-converter', 'http-headers', 'html-entities'],
    en: {
      name: 'ASCII Table',
      title: 'ASCII Table — Character Codes in Dec, Hex, Oct & Binary',
      description:
        'Free ASCII table reference. Look up all 128 ASCII characters with their decimal, hexadecimal, octal and binary codes, plus control-character descriptions. Searchable, in your browser.',
      keywords: ['ascii table', 'ascii codes', 'ascii chart', 'character codes', 'ascii to hex', 'ascii reference'],
    },
    ru: {
      name: 'Таблица ASCII',
      title: 'Таблица ASCII — коды символов в dec, hex, oct и binary',
      description:
        'Бесплатный справочник таблицы ASCII. Смотрите все 128 символов ASCII с десятичными, шестнадцатеричными, восьмеричными и двоичными кодами и описанием управляющих символов. С поиском, в браузере.',
      keywords: ['таблица ascii', 'коды ascii', 'ascii символы', 'коды символов', 'ascii в hex', 'справочник ascii'],
    },
  },
  {
    slug: 'http-headers',
    category: 'reference',
    icon: '🧾',
    related: ['http-status-codes', 'mime-types', 'url-parser'],
    en: {
      name: 'HTTP Headers',
      title: 'HTTP Headers Reference — Request & Response Headers List',
      description:
        'Free HTTP headers reference. Search common request and response headers (Authorization, Cache-Control, Content-Type, CORS and more) with what each one does. A searchable cheat sheet in your browser.',
      keywords: ['http headers', 'http header list', 'request headers', 'response headers', 'http headers reference', 'header meaning'],
    },
    ru: {
      name: 'HTTP-заголовки',
      title: 'Справочник HTTP-заголовков — список заголовков запроса и ответа',
      description:
        'Бесплатный справочник HTTP-заголовков. Ищите распространённые заголовки запроса и ответа (Authorization, Cache-Control, Content-Type, CORS и другие) с описанием их назначения. Шпаргалка с поиском в браузере.',
      keywords: ['http заголовки', 'список http заголовков', 'заголовки запроса', 'заголовки ответа', 'справочник http заголовков', 'значение заголовка'],
    },
  },
  {
    slug: 'json-to-typescript',
    category: 'data',
    icon: 'TS',
    related: ['json-formatter', 'json-to-yaml', 'json-to-csv'],
    en: {
      name: 'JSON to TypeScript',
      title: 'JSON to TypeScript — Generate Interfaces & Types Online',
      description:
        'Free online JSON to TypeScript converter. Turn any JSON object into TypeScript interfaces or types, with nested objects, arrays and optional fields inferred. Runs in your browser.',
      keywords: ['json to typescript', 'json to ts', 'generate typescript interface', 'json to interface', 'ts type from json', 'typescript from json'],
    },
    ru: {
      name: 'JSON → TypeScript',
      title: 'JSON в TypeScript — генерация интерфейсов и типов онлайн',
      description:
        'Бесплатный онлайн-конвертер JSON в TypeScript. Превращайте JSON-объект в интерфейсы или типы TypeScript с выводом вложенных объектов, массивов и необязательных полей. Работает в браузере.',
      keywords: ['json в typescript', 'json to ts', 'генерация интерфейса typescript', 'json в интерфейс', 'тип ts из json', 'typescript из json'],
    },
  },
  {
    slug: 'date-difference-calculator',
    category: 'time-ids',
    icon: '📅',
    related: ['unix-timestamp-converter', 'timezone-converter', 'cron-generator'],
    en: {
      name: 'Date Difference Calculator',
      title: 'Date Difference Calculator — Days Between Two Dates',
      description:
        'Free online date difference calculator. Find the number of days, weeks, months and years between two dates, with or without counting the end day. Runs in your browser.',
      keywords: ['date difference calculator', 'days between dates', 'date duration', 'days calculator', 'time between dates', 'date diff'],
    },
    ru: {
      name: 'Калькулятор дат',
      title: 'Калькулятор разницы дат — сколько дней между датами',
      description:
        'Бесплатный онлайн-калькулятор разницы дат. Узнайте число дней, недель, месяцев и лет между двумя датами, с учётом или без учёта последнего дня. Работает в браузере.',
      keywords: ['калькулятор дат', 'сколько дней между датами', 'разница дат', 'калькулятор дней', 'время между датами', 'дней до даты'],
    },
  },
  {
    slug: 'chmod-calculator',
    category: 'web-security',
    icon: 'rwx',
    related: ['htpasswd-generator', 'number-base-converter', 'hash-generator'],
    en: {
      name: 'Chmod Calculator',
      title: 'Chmod Calculator — Unix File Permissions (rwx ↔ octal)',
      description:
        'Free online chmod calculator. Convert Unix file permissions between rwx checkboxes and octal (e.g. 755, 644) for owner, group and others, with the ready chmod command. Runs in your browser.',
      keywords: ['chmod calculator', 'file permissions', 'chmod 755', 'rwx to octal', 'unix permissions', 'chmod command'],
    },
    ru: {
      name: 'Chmod-калькулятор',
      title: 'Chmod-калькулятор — права доступа Unix (rwx ↔ восьмеричные)',
      description:
        'Бесплатный онлайн chmod-калькулятор. Переводите права доступа Unix между галочками rwx и восьмеричной записью (755, 644) для владельца, группы и остальных, с готовой командой chmod. Работает в браузере.',
      keywords: ['chmod калькулятор', 'права доступа', 'chmod 755', 'rwx в восьмеричную', 'права unix', 'команда chmod'],
    },
  },
  {
    slug: 'gitignore-generator',
    category: 'generators',
    icon: '.gi',
    related: ['password-generator', 'qr-code-generator', 'htpasswd-generator'],
    en: {
      name: '.gitignore Generator',
      title: '.gitignore Generator — Templates for Node, Python & More',
      description:
        'Free online .gitignore generator. Combine ready-made templates for Node, Python, Java, Go, Rust, macOS, Windows, editors and more into one .gitignore file. Runs in your browser.',
      keywords: ['gitignore generator', 'gitignore template', 'node gitignore', 'python gitignore', 'create gitignore', 'gitignore file'],
    },
    ru: {
      name: 'Генератор .gitignore',
      title: 'Генератор .gitignore — шаблоны для Node, Python и не только',
      description:
        'Бесплатный онлайн-генератор .gitignore. Соберите один файл .gitignore из готовых шаблонов для Node, Python, Java, Go, Rust, macOS, Windows, редакторов и другого. Работает в браузере.',
      keywords: ['генератор gitignore', 'шаблон gitignore', 'gitignore node', 'gitignore python', 'создать gitignore', 'файл gitignore'],
    },
  },
  {
    slug: 'hex-to-text',
    category: 'encoding',
    icon: 'Hx',
    related: ['ascii-table', 'base64-encode-decode', 'text-to-binary'],
    en: {
      name: 'Hex to Text',
      title: 'Hex to Text Converter — Hex ↔ ASCII/UTF-8 Online',
      description:
        'Free online hex to text converter. Convert hexadecimal to readable text and text to hex, with full UTF-8 support and optional byte spacing. Everything runs in your browser.',
      keywords: ['hex to text', 'text to hex', 'hex to ascii', 'hex converter', 'hexadecimal to text', 'ascii to hex'],
    },
    ru: {
      name: 'Hex в текст',
      title: 'Конвертер Hex в текст — hex ↔ ASCII/UTF-8 онлайн',
      description:
        'Бесплатный онлайн-конвертер hex в текст. Переводите шестнадцатеричный код в читаемый текст и обратно, с полной поддержкой UTF-8 и настройкой пробелов между байтами. Всё в браузере.',
      keywords: ['hex в текст', 'текст в hex', 'hex в ascii', 'конвертер hex', 'шестнадцатеричный в текст', 'ascii в hex'],
    },
  },
  {
    slug: 'text-to-binary',
    category: 'encoding',
    icon: '01',
    related: ['hex-to-text', 'ascii-table', 'number-base-converter'],
    en: {
      name: 'Text to Binary',
      title: 'Text to Binary Converter — Binary ↔ Text Online',
      description:
        'Free online text to binary converter. Convert text to 8-bit binary and binary back to text, with full UTF-8 support. Everything runs in your browser.',
      keywords: ['text to binary', 'binary to text', 'text to binary code', 'binary translator', 'convert text binary', 'ascii to binary'],
    },
    ru: {
      name: 'Текст в binary',
      title: 'Конвертер текста в двоичный код — binary ↔ текст онлайн',
      description:
        'Бесплатный онлайн-конвертер текста в двоичный код. Переводите текст в 8-битный binary и обратно, с полной поддержкой UTF-8. Всё работает в браузере.',
      keywords: ['текст в двоичный код', 'двоичный в текст', 'текст в binary', 'двоичный переводчик', 'перевести текст в binary', 'ascii в двоичный'],
    },
  },
  {
    slug: 'sort-lines',
    category: 'text',
    icon: '⇅',
    related: ['remove-duplicate-lines', 'text-counter', 'case-converter'],
    en: {
      name: 'Sort Lines',
      title: 'Sort Lines — Alphabetize & Sort Text Online',
      description:
        'Free online line sorter. Sort lines alphabetically, numerically or by length, ascending or descending, with reverse, case-insensitive and remove-duplicates options. Runs in your browser.',
      keywords: ['sort lines', 'alphabetize list', 'sort text online', 'line sorter', 'sort alphabetically', 'order lines'],
    },
    ru: {
      name: 'Сортировка строк',
      title: 'Сортировка строк — упорядочить текст по алфавиту онлайн',
      description:
        'Бесплатный онлайн-сортировщик строк. Сортируйте строки по алфавиту, числам или длине, по возрастанию и убыванию, с реверсом, игнором регистра и удалением дублей. Работает в браузере.',
      keywords: ['сортировка строк', 'сортировка по алфавиту', 'упорядочить текст', 'сортировщик строк', 'сортировать строки', 'по алфавиту онлайн'],
    },
  },
  {
    slug: 'markdown-table-generator',
    category: 'text',
    icon: '⊞',
    related: ['markdown-preview', 'json-to-csv', 'diff-checker'],
    en: {
      name: 'Markdown Table Generator',
      title: 'Markdown Table Generator — Build Tables from a Grid',
      description:
        'Free online Markdown table generator. Edit cells in a grid, set column alignment, and copy clean Markdown table syntax. You can also paste CSV or TSV. Runs in your browser.',
      keywords: ['markdown table generator', 'markdown table', 'create markdown table', 'md table', 'table to markdown', 'markdown table maker'],
    },
    ru: {
      name: 'Генератор Markdown-таблиц',
      title: 'Генератор Markdown-таблиц — таблицы из сетки онлайн',
      description:
        'Бесплатный онлайн-генератор Markdown-таблиц. Заполняйте ячейки в сетке, задавайте выравнивание колонок и копируйте готовый синтаксис Markdown-таблицы. Можно вставить CSV или TSV. Работает в браузере.',
      keywords: ['генератор markdown таблиц', 'markdown таблица', 'создать markdown таблицу', 'md таблица', 'таблица в markdown', 'сделать таблицу markdown'],
    },
  },
  {
    slug: 'image-compressor',
    category: 'image',
    icon: '🗜',
    related: ['image-resizer', 'image-format-converter', 'image-to-base64'],
    en: {
      name: 'Image Compressor',
      title: 'Image Compressor — Compress JPG, PNG & WebP Online',
      description:
        'Free online image compressor. Shrink JPG, PNG and WebP file size with an adjustable quality slider and compare the before/after size. Images are processed in your browser, never uploaded.',
      keywords: ['image compressor', 'compress image', 'compress jpeg', 'compress png', 'reduce image size', 'optimize image'],
    },
    ru: {
      name: 'Сжатие изображений',
      title: 'Сжатие изображений — уменьшить JPG, PNG и WebP онлайн',
      description:
        'Бесплатный онлайн-компрессор изображений. Уменьшайте размер JPG, PNG и WebP ползунком качества и сравнивайте размер до и после. Картинки обрабатываются в браузере и не загружаются на сервер.',
      keywords: ['сжатие изображений', 'сжать картинку', 'сжать jpeg', 'сжать png', 'уменьшить размер изображения', 'оптимизировать изображение'],
    },
  },
  {
    slug: 'image-resizer',
    category: 'image',
    icon: '⤢',
    related: ['image-compressor', 'image-format-converter', 'image-to-base64'],
    en: {
      name: 'Image Resizer',
      title: 'Image Resizer — Resize Images Online (Free)',
      description:
        'Free online image resizer. Change image width and height in pixels or percent, keep or unlock the aspect ratio, and download the result. Images never leave your browser.',
      keywords: ['image resizer', 'resize image', 'resize photo', 'change image size', 'image dimensions', 'scale image'],
    },
    ru: {
      name: 'Ресайз изображений',
      title: 'Ресайз изображений — изменить размер картинки онлайн',
      description:
        'Бесплатный онлайн-ресайз изображений. Меняйте ширину и высоту в пикселях или процентах, сохраняйте или отключайте пропорции и скачивайте результат. Картинки не покидают браузер.',
      keywords: ['ресайз изображений', 'изменить размер картинки', 'изменить размер фото', 'размер изображения', 'масштабировать картинку', 'уменьшить картинку'],
    },
  },
  {
    slug: 'image-format-converter',
    category: 'image',
    icon: '🔄',
    related: ['image-compressor', 'image-resizer', 'image-to-base64'],
    en: {
      name: 'Image Format Converter',
      title: 'Image Converter — PNG, JPG & WebP Online',
      description:
        'Free online image format converter. Convert images between PNG, JPG and WebP with a quality option, right in your browser — nothing is uploaded.',
      keywords: ['image converter', 'png to jpg', 'jpg to webp', 'png to webp', 'convert image format', 'webp converter'],
    },
    ru: {
      name: 'Конвертер форматов изображений',
      title: 'Конвертер изображений — PNG, JPG и WebP онлайн',
      description:
        'Бесплатный онлайн-конвертер форматов изображений. Конвертируйте картинки между PNG, JPG и WebP с настройкой качества — прямо в браузере, без загрузки на сервер.',
      keywords: ['конвертер изображений', 'png в jpg', 'jpg в webp', 'png в webp', 'конвертировать формат изображения', 'webp конвертер'],
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

// --- Categories: icons, SEO copy and helpers (drive the homepage overview and
// the /category/<slug> landing pages). Category display name + short blurb stay
// in i18n (categories.* / categoryDesc.*); the SEO title/description live here. ---

export const CATEGORY_ICON: Record<ToolCategory, string> = {
  data: '🗄️',
  text: '📝',
  encoding: '🔣',
  design: '🎨',
  image: '🖼️',
  'web-security': '🔐',
  reference: '📚',
  generators: '⚙️',
  'time-ids': '🕒',
}

export interface CategoryMetaI18n {
  /** SEO <title> for the category landing page (without the site-name suffix) */
  title: string
  /** Meta description for the category landing page */
  description: string
}

export const CATEGORY_META: Record<ToolCategory, { en: CategoryMetaI18n; ru: CategoryMetaI18n }> = {
  data: {
    en: {
      title: 'JSON & Data Tools — Format, Convert & Inspect Online',
      description: 'Free online data tools: JSON formatter, JSON↔CSV and JSON↔YAML converters, JSON to TypeScript, SQL and XML formatters and a number base converter. Everything runs in your browser.',
    },
    ru: {
      title: 'Инструменты для данных — форматирование и конвертация онлайн',
      description: 'Бесплатные инструменты для данных: форматтер JSON, конвертеры JSON↔CSV и JSON↔YAML, JSON в TypeScript, форматтеры SQL и XML, конвертер систем счисления. Всё работает в браузере.',
    },
  },
  text: {
    en: {
      title: 'Text Tools — Compare, Transform & Analyze Text Online',
      description: 'Free online text tools: diff checker, case converter, text counter, slug and lorem ipsum generators, regex tester, line sorter, Markdown tools and more. Runs entirely in your browser.',
    },
    ru: {
      title: 'Инструменты для текста — сравнение, преобразование и анализ',
      description: 'Бесплатные инструменты для текста: diff-чекер, конвертер регистра, счётчик, генераторы slug и lorem ipsum, тестер regex, сортировка строк, Markdown и другое. Всё в браузере.',
    },
  },
  encoding: {
    en: {
      title: 'Encoding & Escaping Tools — Base64, URL, HTML & More',
      description: 'Free online encoding tools: Base64, URL and HTML entity encode/decode, query-string and URL parsers, hex and binary converters and string escaping. All client-side.',
    },
    ru: {
      title: 'Кодирование и экранирование — Base64, URL, HTML и не только',
      description: 'Бесплатные инструменты кодирования: Base64, URL и HTML-сущности, парсеры query-строк и URL, конвертеры hex и binary, экранирование строк. Всё работает в браузере.',
    },
  },
  design: {
    en: {
      title: 'Color & Design Tools — Convert, Pick & Generate CSS',
      description: 'Free online color and CSS tools: color converter, palette and gradient generators, contrast checker, box-shadow, cubic-bezier and a CSS unit converter. Runs in your browser.',
    },
    ru: {
      title: 'Цвет и дизайн — конвертация, подбор и генерация CSS',
      description: 'Бесплатные инструменты для цвета и CSS: конвертер цветов, генераторы палитр и градиентов, проверка контраста, box-shadow, cubic-bezier и конвертер единиц. Всё в браузере.',
    },
  },
  image: {
    en: {
      title: 'Image Tools — Compress, Resize & Convert in Your Browser',
      description: 'Free online image tools: compress JPG, PNG and WebP, resize images, convert between formats and encode to Base64. Images are processed locally and never uploaded.',
    },
    ru: {
      title: 'Инструменты для изображений — сжатие, ресайз и конвертация',
      description: 'Бесплатные инструменты для картинок: сжатие JPG, PNG и WebP, ресайз, конвертация форматов и кодирование в Base64. Картинки обрабатываются локально и не загружаются.',
    },
  },
  'web-security': {
    en: {
      title: 'Web & Security Tools — JWT, Hashes, Permissions & Network',
      description: 'Free online web and security tools: JWT decode, verify and generate, hash generator, .htpasswd, chmod calculator and IP subnet calculator. Everything runs in your browser.',
    },
    ru: {
      title: 'Веб и безопасность — JWT, хеши, права и сеть',
      description: 'Бесплатные инструменты для веба и безопасности: JWT (декодирование, проверка, генерация), хеши, .htpasswd, chmod-калькулятор и калькулятор подсетей IP. Всё в браузере.',
    },
  },
  reference: {
    en: {
      title: 'Developer Reference — HTTP Codes, Headers, MIME & ASCII',
      description: 'Free, searchable developer reference: HTTP status codes, HTTP headers, MIME types and an ASCII table. Fast cheat sheets that work entirely in your browser.',
    },
    ru: {
      title: 'Справочники разработчика — HTTP-коды, заголовки, MIME и ASCII',
      description: 'Бесплатные справочники с поиском: HTTP-коды состояния, HTTP-заголовки, MIME-типы и таблица ASCII. Быстрые шпаргалки прямо в браузере.',
    },
  },
  generators: {
    en: {
      title: 'Generators — QR Codes, Passwords & .gitignore',
      description: 'Free online generators: QR codes, strong random passwords and ready-made .gitignore files. Everything is generated locally in your browser.',
    },
    ru: {
      title: 'Генераторы — QR-коды, пароли и .gitignore',
      description: 'Бесплатные онлайн-генераторы: QR-коды, надёжные случайные пароли и готовые файлы .gitignore. Всё генерируется локально в браузере.',
    },
  },
  'time-ids': {
    en: {
      title: 'Time & ID Tools — Timestamps, Cron, UUID & Dates',
      description: 'Free online time and identifier tools: Unix timestamp and timezone converters, cron expression generator, UUID generator and a date difference calculator. Runs in your browser.',
    },
    ru: {
      title: 'Время и идентификаторы — timestamp, cron, UUID и даты',
      description: 'Бесплатные инструменты для времени и ID: конвертеры Unix timestamp и часовых поясов, генератор cron, генератор UUID и калькулятор разницы дат. Всё в браузере.',
    },
  },
}

export function isToolCategory(s: string): s is ToolCategory {
  return (CATEGORY_ORDER as string[]).includes(s)
}

export function getToolsInCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category)
}

/** Localized "N tools" with correct Russian plural form. */
export function toolCountLabel(n: number, locale: 'en' | 'ru'): string {
  if (locale !== 'ru') return `${n} ${n === 1 ? 'tool' : 'tools'}`
  const m10 = n % 10
  const m100 = n % 100
  let word = 'инструментов'
  if (m10 === 1 && m100 !== 11) word = 'инструмент'
  else if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) word = 'инструмента'
  return `${n} ${word}`
}
