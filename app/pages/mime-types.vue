<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Group = 'application' | 'text' | 'image' | 'audio' | 'video' | 'font' | 'multipart'

interface MimeType {
  /** Full MIME type, e.g. "application/json". */
  type: string
  /** Associated file extensions without the dot may be empty. */
  ext: string[]
  group: Group
  descEn: string
  descRu: string
}

// In-file reference data. Pure constant — identical in Node prerender and the
// browser, so the whole page is SSG-safe with no ClientOnly needed.
const mimes: MimeType[] = [
  // --- application ---
  {
    type: 'application/json',
    ext: ['json'],
    group: 'application',
    descEn: 'JSON data. The default content type for most REST APIs and config files.',
    descRu: 'Данные в формате JSON. Тип по умолчанию для большинства REST API и конфигурационных файлов.',
  },
  {
    type: 'application/ld+json',
    ext: ['jsonld'],
    group: 'application',
    descEn: 'JSON-LD: linked data in JSON, used for structured data and Schema.org markup.',
    descRu: 'JSON-LD: связанные данные в JSON, применяются для структурированной разметки и Schema.org.',
  },
  {
    type: 'application/xml',
    ext: ['xml'],
    group: 'application',
    descEn: 'XML data intended for application processing rather than direct display.',
    descRu: 'Данные XML, предназначенные для обработки приложением, а не для прямого отображения.',
  },
  {
    type: 'application/pdf',
    ext: ['pdf'],
    group: 'application',
    descEn: 'Portable Document Format: fixed-layout documents that look the same everywhere.',
    descRu: 'Portable Document Format: документы с фиксированной вёрсткой, одинаковые на любом устройстве.',
  },
  {
    type: 'application/zip',
    ext: ['zip'],
    group: 'application',
    descEn: 'ZIP archive: one or more files compressed and bundled into a single container.',
    descRu: 'Архив ZIP: один или несколько файлов, сжатых и упакованных в один контейнер.',
  },
  {
    type: 'application/gzip',
    ext: ['gz'],
    group: 'application',
    descEn: 'Gzip-compressed file, commonly used for single files and HTTP response compression.',
    descRu: 'Файл, сжатый gzip, — часто используется для отдельных файлов и сжатия HTTP-ответов.',
  },
  {
    type: 'application/octet-stream',
    ext: [],
    group: 'application',
    descEn: 'Arbitrary binary data of unknown type. The generic fallback that triggers a download.',
    descRu: 'Произвольные двоичные данные неизвестного типа. Универсальный запасной вариант, вызывающий скачивание.',
  },
  {
    type: 'application/x-www-form-urlencoded',
    ext: [],
    group: 'application',
    descEn: 'Default encoding for HTML form submissions: key=value pairs joined with ampersands.',
    descRu: 'Кодировка по умолчанию для HTML-форм: пары key=value, соединённые амперсандами.',
  },
  {
    type: 'application/javascript',
    ext: ['js', 'mjs'],
    group: 'application',
    descEn: 'JavaScript source code. Largely superseded by text/javascript per the HTML spec.',
    descRu: 'Исходный код JavaScript. По спецификации HTML в основном заменён на text/javascript.',
  },
  {
    type: 'application/wasm',
    ext: ['wasm'],
    group: 'application',
    descEn: 'WebAssembly binary module loaded and executed at near-native speed in the browser.',
    descRu: 'Двоичный модуль WebAssembly, загружаемый и исполняемый в браузере почти с нативной скоростью.',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: ['docx'],
    group: 'application',
    descEn: 'Microsoft Word document (.docx) in the Office Open XML format.',
    descRu: 'Документ Microsoft Word (.docx) в формате Office Open XML.',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: ['xlsx'],
    group: 'application',
    descEn: 'Microsoft Excel spreadsheet (.xlsx) in the Office Open XML format.',
    descRu: 'Электронная таблица Microsoft Excel (.xlsx) в формате Office Open XML.',
  },
  {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ext: ['pptx'],
    group: 'application',
    descEn: 'Microsoft PowerPoint presentation (.pptx) in the Office Open XML format.',
    descRu: 'Презентация Microsoft PowerPoint (.pptx) в формате Office Open XML.',
  },
  {
    type: 'application/msword',
    ext: ['doc'],
    group: 'application',
    descEn: 'Legacy Microsoft Word document (.doc) in the older binary format.',
    descRu: 'Устаревший документ Microsoft Word (.doc) в старом двоичном формате.',
  },
  {
    type: 'application/vnd.ms-excel',
    ext: ['xls'],
    group: 'application',
    descEn: 'Legacy Microsoft Excel spreadsheet (.xls) in the older binary format.',
    descRu: 'Устаревшая таблица Microsoft Excel (.xls) в старом двоичном формате.',
  },
  {
    type: 'application/vnd.ms-powerpoint',
    ext: ['ppt'],
    group: 'application',
    descEn: 'Legacy Microsoft PowerPoint presentation (.ppt) in the older binary format.',
    descRu: 'Устаревшая презентация Microsoft PowerPoint (.ppt) в старом двоичном формате.',
  },
  {
    type: 'application/rtf',
    ext: ['rtf'],
    group: 'application',
    descEn: 'Rich Text Format: portable text with basic formatting readable by most editors.',
    descRu: 'Rich Text Format: переносимый текст с базовым форматированием, читаемый большинством редакторов.',
  },
  {
    type: 'application/sql',
    ext: ['sql'],
    group: 'application',
    descEn: 'SQL script containing database queries or schema definitions.',
    descRu: 'SQL-скрипт с запросами к базе данных или определениями схемы.',
  },
  {
    type: 'application/graphql',
    ext: ['graphql', 'gql'],
    group: 'application',
    descEn: 'GraphQL query document sent as the request body to a GraphQL endpoint.',
    descRu: 'Документ запроса GraphQL, отправляемый в теле запроса на эндпоинт GraphQL.',
  },
  {
    type: 'application/x-tar',
    ext: ['tar'],
    group: 'application',
    descEn: 'Tar archive: an uncompressed bundle of files, often paired with gzip (.tar.gz).',
    descRu: 'Архив tar: несжатый набор файлов, часто в паре с gzip (.tar.gz).',
  },
  {
    type: 'application/x-7z-compressed',
    ext: ['7z'],
    group: 'application',
    descEn: '7-Zip archive offering high compression ratios with the LZMA algorithm.',
    descRu: 'Архив 7-Zip с высокой степенью сжатия по алгоритму LZMA.',
  },
  {
    type: 'application/manifest+json',
    ext: ['webmanifest'],
    group: 'application',
    descEn: 'Web App Manifest: JSON describing a PWA for installation on the home screen.',
    descRu: 'Web App Manifest: JSON, описывающий PWA для установки на главный экран.',
  },
  {
    type: 'application/rss+xml',
    ext: ['rss'],
    group: 'application',
    descEn: 'RSS feed in XML used to syndicate site updates to readers and aggregators.',
    descRu: 'RSS-лента в XML для распространения обновлений сайта в читалки и агрегаторы.',
  },
  {
    type: 'application/atom+xml',
    ext: ['atom'],
    group: 'application',
    descEn: 'Atom syndication feed in XML, a modern alternative to RSS.',
    descRu: 'Лента синдикации Atom в XML — современная альтернатива RSS.',
  },
  {
    type: 'application/epub+zip',
    ext: ['epub'],
    group: 'application',
    descEn: 'EPUB e-book: a ZIP package of HTML and assets read by e-readers.',
    descRu: 'Электронная книга EPUB: ZIP-пакет из HTML и ресурсов, читаемый электронными книгами.',
  },

  // --- text ---
  {
    type: 'text/plain',
    ext: ['txt'],
    group: 'text',
    descEn: 'Plain, unformatted text. The safe default when no richer type applies.',
    descRu: 'Простой неформатированный текст. Безопасный вариант по умолчанию, когда нет более точного типа.',
  },
  {
    type: 'text/html',
    ext: ['html', 'htm'],
    group: 'text',
    descEn: 'HTML markup rendered as a web page by browsers.',
    descRu: 'Разметка HTML, отображаемая браузерами как веб-страница.',
  },
  {
    type: 'text/css',
    ext: ['css'],
    group: 'text',
    descEn: 'Cascading Style Sheets that describe how HTML elements are presented.',
    descRu: 'Каскадные таблицы стилей (CSS), описывающие оформление HTML-элементов.',
  },
  {
    type: 'text/csv',
    ext: ['csv'],
    group: 'text',
    descEn: 'Comma-separated values: tabular data with one record per line.',
    descRu: 'Значения, разделённые запятыми (CSV): табличные данные по одной записи на строку.',
  },
  {
    type: 'text/markdown',
    ext: ['md', 'markdown'],
    group: 'text',
    descEn: 'Markdown source: lightweight text markup that converts to HTML.',
    descRu: 'Исходник Markdown: лёгкая текстовая разметка, преобразуемая в HTML.',
  },
  {
    type: 'text/xml',
    ext: ['xml'],
    group: 'text',
    descEn: 'XML meant to be read as text. Prefer application/xml for machine processing.',
    descRu: 'XML, предназначенный для чтения как текст. Для машинной обработки лучше application/xml.',
  },
  {
    type: 'text/javascript',
    ext: ['js', 'mjs'],
    group: 'text',
    descEn: 'JavaScript source code. The recommended type for scripts per the HTML spec.',
    descRu: 'Исходный код JavaScript. Рекомендуемый тип для скриптов по спецификации HTML.',
  },
  {
    type: 'text/calendar',
    ext: ['ics'],
    group: 'text',
    descEn: 'iCalendar data describing events, used for invites and calendar feeds.',
    descRu: 'Данные iCalendar с описанием событий — используются для приглашений и лент календаря.',
  },
  {
    type: 'text/tab-separated-values',
    ext: ['tsv'],
    group: 'text',
    descEn: 'Tab-separated values: tabular data with columns split by tab characters.',
    descRu: 'Значения, разделённые табуляцией (TSV): табличные данные с колонками через табы.',
  },
  {
    type: 'text/vcard',
    ext: ['vcf'],
    group: 'text',
    descEn: 'vCard contact data exchanged between address books and devices.',
    descRu: 'Контактные данные vCard, которыми обмениваются адресные книги и устройства.',
  },

  // --- image ---
  {
    type: 'image/png',
    ext: ['png'],
    group: 'image',
    descEn: 'Lossless raster image with transparency. Ideal for icons, logos and screenshots.',
    descRu: 'Растровое изображение без потерь с прозрачностью. Подходит для иконок, логотипов и скриншотов.',
  },
  {
    type: 'image/jpeg',
    ext: ['jpg', 'jpeg'],
    group: 'image',
    descEn: 'Lossy compressed photo format. Best for photographs where small size matters.',
    descRu: 'Формат фотографий со сжатием с потерями. Лучше всего для фото, где важен малый размер.',
  },
  {
    type: 'image/gif',
    ext: ['gif'],
    group: 'image',
    descEn: 'Indexed-colour image that also supports simple frame-by-frame animation.',
    descRu: 'Изображение с индексированной палитрой, поддерживает простую покадровую анимацию.',
  },
  {
    type: 'image/webp',
    ext: ['webp'],
    group: 'image',
    descEn: 'Modern format with lossy and lossless modes, smaller than PNG or JPEG.',
    descRu: 'Современный формат с режимами с потерями и без, меньше PNG и JPEG.',
  },
  {
    type: 'image/avif',
    ext: ['avif'],
    group: 'image',
    descEn: 'Next-generation image based on AV1, offering excellent compression and HDR.',
    descRu: 'Изображение нового поколения на базе AV1 с отличным сжатием и поддержкой HDR.',
  },
  {
    type: 'image/svg+xml',
    ext: ['svg'],
    group: 'image',
    descEn: 'Scalable Vector Graphics in XML: resolution-independent shapes and icons.',
    descRu: 'Масштабируемая векторная графика (SVG) в XML: фигуры и иконки без потери качества.',
  },
  {
    type: 'image/x-icon',
    ext: ['ico'],
    group: 'image',
    descEn: 'Windows icon format, traditionally used for the site favicon.ico.',
    descRu: 'Формат иконок Windows, традиционно используется для favicon.ico сайта.',
  },
  {
    type: 'image/tiff',
    ext: ['tiff', 'tif'],
    group: 'image',
    descEn: 'High-quality raster format common in printing, scanning and archiving.',
    descRu: 'Высококачественный растровый формат для печати, сканирования и архивирования.',
  },
  {
    type: 'image/bmp',
    ext: ['bmp'],
    group: 'image',
    descEn: 'Uncompressed bitmap image from Windows. Large files, rarely used on the web.',
    descRu: 'Несжатое растровое изображение Windows. Большие файлы, в вебе используется редко.',
  },
  {
    type: 'image/heic',
    ext: ['heic'],
    group: 'image',
    descEn: 'HEIF image used by Apple devices for photos with efficient compression.',
    descRu: 'Изображение HEIF, используемое устройствами Apple для фото с эффективным сжатием.',
  },

  // --- audio ---
  {
    type: 'audio/mpeg',
    ext: ['mp3'],
    group: 'audio',
    descEn: 'MP3 audio: the most widely supported lossy compressed sound format.',
    descRu: 'Аудио MP3: самый распространённый формат звука со сжатием с потерями.',
  },
  {
    type: 'audio/ogg',
    ext: ['ogg', 'oga'],
    group: 'audio',
    descEn: 'Ogg container, usually carrying Vorbis or Opus audio. Royalty-free.',
    descRu: 'Контейнер Ogg, обычно с аудио Vorbis или Opus. Свободен от лицензионных отчислений.',
  },
  {
    type: 'audio/wav',
    ext: ['wav'],
    group: 'audio',
    descEn: 'Uncompressed PCM audio. High quality but large files, common in editing.',
    descRu: 'Несжатое аудио PCM. Высокое качество, но большие файлы — часто при монтаже.',
  },
  {
    type: 'audio/webm',
    ext: ['weba'],
    group: 'audio',
    descEn: 'WebM audio, typically Opus, designed for efficient streaming on the web.',
    descRu: 'Аудио WebM, обычно Opus, рассчитанное на эффективную потоковую передачу в вебе.',
  },
  {
    type: 'audio/aac',
    ext: ['aac'],
    group: 'audio',
    descEn: 'Advanced Audio Coding: efficient lossy audio used by Apple and streaming.',
    descRu: 'Advanced Audio Coding: эффективное аудио с потерями, используется Apple и стримингом.',
  },
  {
    type: 'audio/flac',
    ext: ['flac'],
    group: 'audio',
    descEn: 'Free Lossless Audio Codec: compressed audio with no quality loss.',
    descRu: 'Free Lossless Audio Codec: сжатое аудио без потери качества.',
  },

  // --- video ---
  {
    type: 'video/mp4',
    ext: ['mp4', 'm4v'],
    group: 'video',
    descEn: 'MP4 container, usually H.264/AAC. The most compatible web video format.',
    descRu: 'Контейнер MP4, обычно H.264/AAC. Самый совместимый формат веб-видео.',
  },
  {
    type: 'video/webm',
    ext: ['webm'],
    group: 'video',
    descEn: 'WebM container with VP8/VP9 or AV1 video. Open and royalty-free.',
    descRu: 'Контейнер WebM с видео VP8/VP9 или AV1. Открытый и без лицензионных отчислений.',
  },
  {
    type: 'video/ogg',
    ext: ['ogv'],
    group: 'video',
    descEn: 'Ogg container carrying Theora video. An older open format.',
    descRu: 'Контейнер Ogg с видео Theora. Старый открытый формат.',
  },
  {
    type: 'video/quicktime',
    ext: ['mov'],
    group: 'video',
    descEn: 'Apple QuickTime movie (.mov), common output from iPhones and macOS.',
    descRu: 'Фильм Apple QuickTime (.mov), частый результат записи на iPhone и в macOS.',
  },
  {
    type: 'video/mpeg',
    ext: ['mpeg', 'mpg'],
    group: 'video',
    descEn: 'MPEG-1/2 video, an older format used on VCDs and early digital video.',
    descRu: 'Видео MPEG-1/2 — старый формат с VCD и ранней цифровой видеозаписи.',
  },
  {
    type: 'video/x-msvideo',
    ext: ['avi'],
    group: 'video',
    descEn: 'AVI container from Microsoft. Widely supported but dated and bulky.',
    descRu: 'Контейнер AVI от Microsoft. Широко поддерживается, но устарел и громоздок.',
  },

  // --- font ---
  {
    type: 'font/woff',
    ext: ['woff'],
    group: 'font',
    descEn: 'Web Open Font Format: compressed web font widely supported by browsers.',
    descRu: 'Web Open Font Format: сжатый веб-шрифт с широкой поддержкой в браузерах.',
  },
  {
    type: 'font/woff2',
    ext: ['woff2'],
    group: 'font',
    descEn: 'WOFF2: better-compressed successor to WOFF and the preferred web font.',
    descRu: 'WOFF2: преемник WOFF с лучшим сжатием, предпочтительный веб-шрифт.',
  },
  {
    type: 'font/ttf',
    ext: ['ttf'],
    group: 'font',
    descEn: 'TrueType font, a classic desktop and web outline font format.',
    descRu: 'Шрифт TrueType — классический контурный формат для системы и веба.',
  },
  {
    type: 'font/otf',
    ext: ['otf'],
    group: 'font',
    descEn: 'OpenType font supporting advanced typography and PostScript outlines.',
    descRu: 'Шрифт OpenType с поддержкой продвинутой типографики и контуров PostScript.',
  },

  // --- multipart ---
  {
    type: 'multipart/form-data',
    ext: [],
    group: 'multipart',
    descEn: 'Form submissions that include file uploads: each field is a separate part.',
    descRu: 'Отправка форм с загрузкой файлов: каждое поле передаётся отдельной частью.',
  },
  {
    type: 'multipart/byteranges',
    ext: [],
    group: 'multipart',
    descEn: 'Response carrying multiple byte ranges of a resource, used with 206 Partial Content.',
    descRu: 'Ответ с несколькими диапазонами байтов ресурса — используется с 206 Partial Content.',
  },
  {
    type: 'multipart/mixed',
    ext: [],
    group: 'multipart',
    descEn: 'A bundle of independent body parts of different types, common in email.',
    descRu: 'Набор независимых частей тела разных типов — часто встречается в электронной почте.',
  },
  {
    type: 'multipart/alternative',
    ext: [],
    group: 'multipart',
    descEn: 'Several representations of the same content (e.g. plain text and HTML email).',
    descRu: 'Несколько представлений одного содержимого (например, письмо в виде текста и HTML).',
  },
]

const GROUPS: Group[] = ['application', 'text', 'image', 'audio', 'video', 'font', 'multipart']

const query = ref('')

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        searchPlaceholder: 'Поиск по типу, расширению или описанию (например json, .png, шрифт)…',
        searchAria: 'Поиск по MIME-типам',
        noResults: 'Ничего не найдено. Попробуйте другой тип, расширение или ключевое слово.',
        groupLabels: {
          application: 'Application · Приложения',
          text: 'Text · Текст',
          image: 'Image · Изображения',
          audio: 'Audio · Аудио',
          video: 'Video · Видео',
          font: 'Font · Шрифты',
          multipart: 'Multipart',
        } as Record<Group, string>,
      }
    : {
        searchPlaceholder: 'Search by type, extension or description (e.g. json, .png, font)…',
        searchAria: 'Search MIME types',
        noResults: 'No matches. Try a different type, extension or keyword.',
        groupLabels: {
          application: 'Application',
          text: 'Text',
          image: 'Image',
          audio: 'Audio',
          video: 'Video',
          font: 'Font',
          multipart: 'Multipart',
        } as Record<Group, string>,
      },
)

// Live filter by type, any extension, or the current-locale description.
// Pure (no clock/random/DOM) — safe to evaluate during prerender.
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return mimes
  // Allow matching ".png" or "png" against extensions.
  const bare = q.startsWith('.') ? q.slice(1) : q
  return mimes.filter((m) => {
    const d = locale.value === 'ru' ? m.descRu : m.descEn
    return (
      m.type.toLowerCase().includes(q) ||
      m.ext.some((e) => e.includes(bare)) ||
      d.toLowerCase().includes(q)
    )
  })
})

// Group the filtered rows, dropping empty groups.
const groups = computed(() =>
  GROUPS.map((group) => ({
    group,
    items: filtered.value.filter((m) => m.group === group),
  })).filter((g) => g.items.length > 0),
)

function desc(m: MimeType): string {
  return locale.value === 'ru' ? m.descRu : m.descEn
}

// Render extensions as ".json .mjs" or an em dash when none are associated.
function extLabel(m: MimeType): string {
  return m.ext.length ? m.ext.map((e) => `.${e}`).join(' ') : '—'
}

function clearSearch() {
  query.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is anything I search sent to a server?',
    a: 'No. This is a static reference: the full list of MIME types ships with the page and the search filters it entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored.',
  },
  {
    q: 'What is a MIME type, exactly?',
    a: 'A MIME type (also called a media type or content type) is a two-part label like type/subtype — for example application/json or image/png. It tells browsers and servers how to interpret a file or HTTP body, independent of its file extension.',
  },
  {
    q: 'Where does the Content-Type header fit in?',
    a: 'The Content-Type response or request header carries the MIME type, optionally with parameters such as charset=utf-8 or a multipart boundary. It is how a server announces what kind of data it is sending, so the client renders or downloads it correctly.',
  },
  {
    q: 'What type should I use when I do not know the format?',
    a: 'Use application/octet-stream. It means "arbitrary binary data of unknown type" and typically prompts the browser to download the file rather than try to display it.',
  },
  {
    q: 'Why are there both text/javascript and application/javascript?',
    a: 'Both have been used historically. The HTML specification now recommends text/javascript for scripts, while application/javascript is the older, still widely accepted variant. Either one works in practice for serving JavaScript.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой поисковый запрос на сервер?',
    a: 'Нет. Это статический справочник: полный список MIME-типов поставляется вместе со страницей, а поиск фильтрует его полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Что такое MIME-тип?',
    a: 'MIME-тип (его также называют media type или content type) — это двухчастная метка вида type/subtype, например application/json или image/png. Она сообщает браузерам и серверам, как интерпретировать файл или тело HTTP, независимо от расширения.',
  },
  {
    q: 'При чём здесь заголовок Content-Type?',
    a: 'Заголовок Content-Type в ответе или запросе несёт MIME-тип, при необходимости с параметрами вроде charset=utf-8 или границей multipart. Так сервер сообщает, какие данные он отправляет, чтобы клиент правильно их отобразил или скачал.',
  },
  {
    q: 'Какой тип использовать, если формат неизвестен?',
    a: 'Используйте application/octet-stream. Он означает «произвольные двоичные данные неизвестного типа» и обычно заставляет браузер скачать файл, а не пытаться его отобразить.',
  },
  {
    q: 'Почему существуют и text/javascript, и application/javascript?',
    a: 'Исторически применялись оба. Спецификация HTML сейчас рекомендует text/javascript для скриптов, а application/javascript — более старый, но всё ещё широко принятый вариант. На практике для JavaScript работает любой из них.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="mime-types" :faq="faq">
    <!-- Search -->
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="query"
        class="field flex-1"
        type="search"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.searchPlaceholder"
        :aria-label="ui.searchAria"
      >
      <button
        v-if="query"
        type="button"
        class="btn-ghost"
        @click="clearSearch"
      >{{ t('common.clear') }}</button>
    </div>

    <!-- Result count -->
    <div class="mt-3 min-h-[1.25rem] text-sm text-ink-400">
      {{ filtered.length }} / {{ mimes.length }}
    </div>

    <!-- Grouped reference -->
    <div v-if="groups.length" class="mt-2 space-y-8">
      <section v-for="g in groups" :key="g.group">
        <h2 class="mb-3 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
          {{ ui.groupLabels[g.group] }}
        </h2>
        <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
          <div
            v-for="(m, i) in g.items"
            :key="m.type"
            class="flex items-start gap-3 px-3 py-3 sm:gap-4 sm:px-4"
            :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
          >
            <div class="min-w-0 flex-1">
              <div class="font-mono text-sm break-all text-accent">{{ m.type }}</div>
              <div class="mt-0.5 font-mono text-xs text-ink-500 tabular-nums dark:text-ink-400">{{ extLabel(m) }}</div>
              <p class="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ desc(m) }}</p>
            </div>
            <CopyButton :text="() => m.type" small class="shrink-0" />
          </div>
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <p v-else class="mt-2 rounded-lg border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-400 dark:border-ink-700">
      {{ ui.noResults }}
    </p>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Справочник MIME-типов с поиском</h2>
        <p>
          Эта бесплатная <strong>шпаргалка по MIME-типам</strong> собирает около
          семидесяти распространённых типов содержимого в одном месте — с
          расширениями файлов и кратким описанием. Типы сгруппированы по категориям
          (<code>application</code>, <code>text</code>, <code>image</code>,
          <code>audio</code>, <code>video</code>, <code>font</code>,
          <code>multipart</code>), а строка поиска мгновенно фильтрует список по типу,
          расширению или описанию — удобно, когда нужно быстро вспомнить
          <code>Content-Type</code> для <code>.webp</code> или для загрузки docx.
        </p>
        <p>
          Весь справочник работает <strong>полностью в браузере</strong>. Список типов
          загружается вместе со страницей, поиск выполняется локально, и ничего из
          введённого не отправляется на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Начните вводить в поле поиска — список фильтруется на лету.</li>
          <li>Ищите по типу (<code>application/json</code>), расширению (<code>.png</code> или <code>png</code>) или ключевому слову из описания (<code>шрифт</code>).</li>
          <li>Просматривайте типы по категориям: Application, Text, Image, Audio, Video, Font, Multipart.</li>
          <li>Нажмите <code>Копировать</code> в строке, чтобы скопировать сам MIME-тип, например <code>image/svg+xml</code>.</li>
          <li>Очистите поиск, чтобы снова увидеть все категории целиком.</li>
        </ul>

        <h2>MIME-тип и заголовок Content-Type</h2>
        <p>
          MIME-тип состоит из двух частей — <code>type/subtype</code>, например
          <code>text/html</code> или <code>application/pdf</code>. Сервер сообщает его
          в заголовке <code>Content-Type</code>, иногда добавляя параметры вроде
          <code>charset=utf-8</code> или <code>boundary=…</code> для multipart. Именно
          по MIME-типу, а не по расширению файла, браузер решает, как обработать ответ:
          показать как страницу, отрисовать изображение или предложить скачивание.
          Поэтому неверный <code>Content-Type</code> — частая причина того, что файл
          открывается «не так».
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Отлаживаете HTTP? Разберите заголовки запросов и ответов в
          <NuxtLink :to="localePath('/http-headers')">справочнике HTTP-заголовков</NuxtLink>,
          уточните коды ответа в
          <NuxtLink :to="localePath('/http-status-codes')">справочнике HTTP-кодов состояния</NuxtLink>
          или встройте картинку в data-URL с помощью
          <NuxtLink :to="localePath('/image-to-base64')">конвертера изображений в Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Searchable MIME type reference</h2>
        <p>
          This free <strong>MIME type cheat sheet</strong> gathers around seventy
          common content types in one place, each with its file extensions and a short
          description. Types are grouped by category (<code>application</code>,
          <code>text</code>, <code>image</code>, <code>audio</code>, <code>video</code>,
          <code>font</code>, <code>multipart</code>), and the search box filters the
          list instantly by type, extension or description — handy when you need to
          recall the <code>Content-Type</code> for <code>.webp</code> or for a docx
          upload.
        </p>
        <p>
          The whole reference runs <strong>entirely in your browser</strong>. The type
          list ships with the page, the search happens locally, and nothing you type is
          sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Start typing in the search box — the list filters as you type.</li>
          <li>Search by type (<code>application/json</code>), extension (<code>.png</code> or <code>png</code>) or a keyword from the description (<code>font</code>).</li>
          <li>Browse types by category: Application, Text, Image, Audio, Video, Font, Multipart.</li>
          <li>Click <code>Copy</code> on a row to copy the MIME type itself, for example <code>image/svg+xml</code>.</li>
          <li>Clear the search to see all the categories in full again.</li>
        </ul>

        <h2>MIME types and the Content-Type header</h2>
        <p>
          A MIME type has two parts — <code>type/subtype</code>, such as
          <code>text/html</code> or <code>application/pdf</code>. A server announces it
          in the <code>Content-Type</code> header, sometimes with parameters like
          <code>charset=utf-8</code> or a <code>boundary=…</code> for multipart bodies.
          Browsers rely on the MIME type, not the file extension, to decide what to do
          with a response: show it as a page, render an image, or offer a download. A
          wrong <code>Content-Type</code> is a common reason a file ends up opening the
          wrong way.
        </p>

        <h2>Related tools</h2>
        <p>
          Debugging HTTP? Break down request and response headers in the
          <NuxtLink :to="localePath('/http-headers')">HTTP headers reference</NuxtLink>,
          check response codes in the
          <NuxtLink :to="localePath('/http-status-codes')">HTTP status codes reference</NuxtLink>,
          or embed an image as a data URL with the
          <NuxtLink :to="localePath('/image-to-base64')">image to Base64 converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
