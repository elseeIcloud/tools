<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Group = 'general' | 'request' | 'response' | 'caching' | 'cors' | 'security'

interface Header {
  name: string
  group: Group
  descEn: string
  descRu: string
}

// In-file reference data. Pure constant — identical in Node prerender and the
// browser, so the whole page is SSG-safe with no ClientOnly needed.
const headers: Header[] = [
  // --- General ---
  {
    name: 'Date',
    group: 'general',
    descEn: 'The date and time at which the message was generated, in RFC 7231 format (e.g. Tue, 15 Nov 1994 08:12:31 GMT).',
    descRu: 'Дата и время формирования сообщения в формате RFC 7231 (например, Tue, 15 Nov 1994 08:12:31 GMT).',
  },
  {
    name: 'Connection',
    group: 'general',
    descEn: 'Controls whether the network connection stays open after the current transaction — keep-alive or close.',
    descRu: 'Управляет тем, останется ли сетевое соединение открытым после текущей транзакции, — keep-alive или close.',
  },
  {
    name: 'Content-Type',
    group: 'general',
    descEn: 'The media type of the body, such as application/json or text/html; charset=utf-8. Drives content parsing.',
    descRu: 'MIME-тип тела сообщения, например application/json или text/html; charset=utf-8. Определяет, как разбирать содержимое.',
  },
  {
    name: 'Content-Length',
    group: 'general',
    descEn: 'The size of the body in bytes. Lets the recipient know exactly how much data to read.',
    descRu: 'Размер тела сообщения в байтах. Сообщает получателю, сколько именно данных нужно прочитать.',
  },
  {
    name: 'Content-Encoding',
    group: 'general',
    descEn: 'The compression applied to the body, such as gzip, br or deflate, so the recipient can decode it.',
    descRu: 'Сжатие, применённое к телу (gzip, br или deflate), чтобы получатель смог его распаковать.',
  },
  {
    name: 'Transfer-Encoding',
    group: 'general',
    descEn: 'The form of encoding used to transfer the body, most commonly chunked for streaming responses of unknown length.',
    descRu: 'Способ кодирования передачи тела, чаще всего chunked — для потоковых ответов неизвестной длины.',
  },
  {
    name: 'Upgrade',
    group: 'general',
    descEn: 'Asks the server to switch to a different protocol on the same connection, such as upgrading to WebSocket.',
    descRu: 'Просит сервер переключиться на другой протокол в рамках того же соединения, например на WebSocket.',
  },
  {
    name: 'Via',
    group: 'general',
    descEn: 'Added by proxies and gateways to record the intermediaries a message passed through and detect loops.',
    descRu: 'Добавляется прокси и шлюзами, чтобы записать промежуточные узлы, через которые прошло сообщение, и выявлять петли.',
  },
  {
    name: 'Content-Language',
    group: 'general',
    descEn: 'Describes the natural language(s) of the body, such as en or ru, mainly for the audience it is intended for.',
    descRu: 'Указывает естественный язык(и) тела сообщения, например en или ru, прежде всего для целевой аудитории.',
  },

  // --- Request ---
  {
    name: 'Accept',
    group: 'request',
    descEn: 'Lists the media types the client can handle, with quality weights, so the server can negotiate the format.',
    descRu: 'Перечисляет MIME-типы, которые понимает клиент, с весами качества, чтобы сервер мог согласовать формат.',
  },
  {
    name: 'Accept-Encoding',
    group: 'request',
    descEn: 'Tells the server which compression algorithms the client supports, such as gzip, br or deflate.',
    descRu: 'Сообщает серверу, какие алгоритмы сжатия поддерживает клиент, например gzip, br или deflate.',
  },
  {
    name: 'Accept-Language',
    group: 'request',
    descEn: 'Indicates the client preferred natural languages, used by the server to pick a localized response.',
    descRu: 'Указывает предпочитаемые клиентом языки, по которым сервер выбирает локализованный ответ.',
  },
  {
    name: 'Authorization',
    group: 'request',
    descEn: 'Carries credentials to authenticate the client, such as a Bearer token or Basic base64 username and password.',
    descRu: 'Передаёт учётные данные для аутентификации клиента, например Bearer-токен или Basic с логином и паролем в base64.',
  },
  {
    name: 'Cookie',
    group: 'request',
    descEn: 'Sends previously stored cookies back to the server, typically for sessions and user preferences.',
    descRu: 'Отправляет серверу ранее сохранённые cookie, обычно для сессий и пользовательских настроек.',
  },
  {
    name: 'Host',
    group: 'request',
    descEn: 'The domain name (and optional port) of the target server. Required in HTTP/1.1 to support virtual hosting.',
    descRu: 'Доменное имя (и опционально порт) целевого сервера. Обязателен в HTTP/1.1 для поддержки виртуального хостинга.',
  },
  {
    name: 'Origin',
    group: 'request',
    descEn: 'The scheme, host and port the request originated from, sent for CORS and to protect against CSRF.',
    descRu: 'Схема, хост и порт, с которых пришёл запрос; отправляется для CORS и защиты от CSRF.',
  },
  {
    name: 'Referer',
    group: 'request',
    descEn: 'The URL of the page that linked to the requested resource. Spelled "Referer" due to a historical typo.',
    descRu: 'URL страницы, со ссылкой на запрашиваемый ресурс. Пишется «Referer» из-за исторической опечатки.',
  },
  {
    name: 'User-Agent',
    group: 'request',
    descEn: 'Identifies the client software — browser, version and OS — so servers can adapt or log the request.',
    descRu: 'Идентифицирует клиентское ПО — браузер, версию и ОС, — чтобы сервер мог адаптировать или залогировать запрос.',
  },
  {
    name: 'Range',
    group: 'request',
    descEn: 'Requests only part of a resource by byte range, enabling resumable downloads and media seeking.',
    descRu: 'Запрашивает только часть ресурса по диапазону байтов, позволяя докачивать файлы и перематывать медиа.',
  },
  {
    name: 'If-Match',
    group: 'request',
    descEn: 'Makes the request conditional: it proceeds only if the resource ETag matches, preventing lost updates.',
    descRu: 'Делает запрос условным: он выполняется, только если ETag ресурса совпадает, предотвращая потерю обновлений.',
  },
  {
    name: 'If-None-Match',
    group: 'request',
    descEn: 'Conditional based on ETag: the server returns 304 Not Modified if the cached version is still current.',
    descRu: 'Условие по ETag: сервер вернёт 304 Not Modified, если кэшированная версия всё ещё актуальна.',
  },
  {
    name: 'If-Modified-Since',
    group: 'request',
    descEn: 'Returns the resource only if it changed after the given date; otherwise the server replies 304 Not Modified.',
    descRu: 'Возвращает ресурс только если он изменился после указанной даты; иначе сервер отвечает 304 Not Modified.',
  },
  {
    name: 'If-Unmodified-Since',
    group: 'request',
    descEn: 'Proceeds only if the resource has not changed since the given date — used to guard unsafe updates.',
    descRu: 'Выполняется, только если ресурс не менялся с указанной даты, — защищает небезопасные обновления.',
  },
  {
    name: 'Forwarded',
    group: 'request',
    descEn: 'The standardized header recording client and proxy info (for, by, host, proto) across a chain of proxies.',
    descRu: 'Стандартизированный заголовок, фиксирующий данные клиента и прокси (for, by, host, proto) в цепочке прокси.',
  },
  {
    name: 'X-Forwarded-For',
    group: 'request',
    descEn: 'A de facto header listing the original client IP and any intermediate proxy IPs. Superseded by Forwarded.',
    descRu: 'Де-факто заголовок со списком исходного IP клиента и промежуточных прокси. Заменяется заголовком Forwarded.',
  },
  {
    name: 'X-Requested-With',
    group: 'request',
    descEn: 'A non-standard header, usually set to XMLHttpRequest, that lets servers detect AJAX calls from the page.',
    descRu: 'Нестандартный заголовок, обычно XMLHttpRequest, по которому сервер распознаёт AJAX-запросы со страницы.',
  },

  // --- Response ---
  {
    name: 'Set-Cookie',
    group: 'response',
    descEn: 'Sends a cookie from the server to be stored by the client, with attributes like Secure, HttpOnly and SameSite.',
    descRu: 'Отправляет cookie от сервера для сохранения клиентом, с атрибутами вроде Secure, HttpOnly и SameSite.',
  },
  {
    name: 'Location',
    group: 'response',
    descEn: 'Points to a URL: the target of a redirect (3xx) or the address of a newly created resource (201).',
    descRu: 'Указывает URL: адрес перенаправления (3xx) или адрес только что созданного ресурса (201).',
  },
  {
    name: 'Server',
    group: 'response',
    descEn: 'Names the software handling the request, such as nginx or Apache. Often trimmed to avoid disclosing versions.',
    descRu: 'Называет ПО, обрабатывающее запрос, например nginx или Apache. Часто урезается, чтобы скрыть версию.',
  },
  {
    name: 'WWW-Authenticate',
    group: 'response',
    descEn: 'Accompanies a 401 response to tell the client which authentication scheme and realm to use.',
    descRu: 'Сопровождает ответ 401, сообщая клиенту, какую схему аутентификации и область (realm) использовать.',
  },
  {
    name: 'Retry-After',
    group: 'response',
    descEn: 'Tells the client how long to wait before retrying, after a 429 or 503 — a number of seconds or a date.',
    descRu: 'Сообщает клиенту, сколько ждать перед повтором после 429 или 503 — число секунд или дату.',
  },
  {
    name: 'Allow',
    group: 'response',
    descEn: 'Lists the HTTP methods supported by the resource, returned with 405 Method Not Allowed or an OPTIONS reply.',
    descRu: 'Перечисляет HTTP-методы, поддерживаемые ресурсом; отдаётся с 405 Method Not Allowed или в ответе на OPTIONS.',
  },
  {
    name: 'Accept-Ranges',
    group: 'response',
    descEn: 'Signals whether the server supports range requests, usually bytes, enabling partial downloads.',
    descRu: 'Сообщает, поддерживает ли сервер запросы диапазонов, обычно bytes, позволяя частичную загрузку.',
  },
  {
    name: 'Content-Disposition',
    group: 'response',
    descEn: 'Indicates whether content is displayed inline or downloaded as an attachment, and suggests a filename.',
    descRu: 'Указывает, показывать ли содержимое inline или скачивать как вложение, и предлагает имя файла.',
  },
  {
    name: 'Age',
    group: 'response',
    descEn: 'How long, in seconds, the response has been stored in a proxy cache since it was generated at the origin.',
    descRu: 'Сколько секунд ответ хранится в кэше прокси с момента, когда он был сформирован на исходном сервере.',
  },
  {
    name: 'ETag',
    group: 'response',
    descEn: 'An opaque identifier for a specific version of a resource, used with If-None-Match for cache validation.',
    descRu: 'Непрозрачный идентификатор конкретной версии ресурса, используется с If-None-Match для проверки кэша.',
  },
  {
    name: 'Last-Modified',
    group: 'response',
    descEn: 'The date the resource was last changed, used with If-Modified-Since for conditional requests.',
    descRu: 'Дата последнего изменения ресурса, используется с If-Modified-Since для условных запросов.',
  },

  // --- Caching ---
  {
    name: 'Cache-Control',
    group: 'caching',
    descEn: 'The primary directive for caching behaviour — max-age, no-cache, no-store, public, private and more.',
    descRu: 'Основная директива поведения кэша — max-age, no-cache, no-store, public, private и другие.',
  },
  {
    name: 'Expires',
    group: 'caching',
    descEn: 'An absolute date after which the response is considered stale. Ignored if Cache-Control max-age is present.',
    descRu: 'Абсолютная дата, после которой ответ считается устаревшим. Игнорируется, если задан Cache-Control max-age.',
  },
  {
    name: 'Pragma',
    group: 'caching',
    descEn: 'A legacy HTTP/1.0 header; Pragma: no-cache behaves like Cache-Control: no-cache for old caches.',
    descRu: 'Устаревший заголовок HTTP/1.0; Pragma: no-cache ведёт себя как Cache-Control: no-cache для старых кэшей.',
  },
  {
    name: 'Vary',
    group: 'caching',
    descEn: 'Lists request headers that affect the response, so caches store a separate variant per combination.',
    descRu: 'Перечисляет заголовки запроса, влияющие на ответ, чтобы кэш хранил отдельный вариант для каждой комбинации.',
  },

  // --- CORS ---
  {
    name: 'Access-Control-Allow-Origin',
    group: 'cors',
    descEn: 'Specifies which origin may read the response — a single origin or * — the core of CORS.',
    descRu: 'Указывает, какому источнику разрешено читать ответ — один origin или * — ядро механизма CORS.',
  },
  {
    name: 'Access-Control-Allow-Methods',
    group: 'cors',
    descEn: 'In a preflight response, lists the HTTP methods permitted for the actual cross-origin request.',
    descRu: 'В ответе на preflight перечисляет HTTP-методы, разрешённые для фактического кросс-доменного запроса.',
  },
  {
    name: 'Access-Control-Allow-Headers',
    group: 'cors',
    descEn: 'In a preflight response, lists the request headers allowed in the actual cross-origin request.',
    descRu: 'В ответе на preflight перечисляет заголовки запроса, разрешённые в фактическом кросс-доменном запросе.',
  },
  {
    name: 'Access-Control-Allow-Credentials',
    group: 'cors',
    descEn: 'When true, allows the browser to send and expose credentials (cookies, auth) in a CORS request.',
    descRu: 'При значении true разрешает браузеру отправлять и раскрывать учётные данные (cookie, авторизацию) в CORS-запросе.',
  },
  {
    name: 'Access-Control-Expose-Headers',
    group: 'cors',
    descEn: 'Names response headers, beyond the safe defaults, that JavaScript on the page is allowed to read.',
    descRu: 'Перечисляет заголовки ответа сверх безопасных по умолчанию, которые JavaScript на странице может читать.',
  },
  {
    name: 'Access-Control-Max-Age',
    group: 'cors',
    descEn: 'How long, in seconds, the browser may cache a preflight response to avoid repeating OPTIONS requests.',
    descRu: 'Сколько секунд браузер может кэшировать ответ preflight, чтобы не повторять запросы OPTIONS.',
  },
  {
    name: 'Access-Control-Request-Method',
    group: 'cors',
    descEn: 'Sent by the browser in a preflight OPTIONS request to announce the method of the actual request.',
    descRu: 'Отправляется браузером в preflight-запросе OPTIONS, чтобы сообщить метод фактического запроса.',
  },
  {
    name: 'Access-Control-Request-Headers',
    group: 'cors',
    descEn: 'Sent in a preflight request to list the custom headers the actual cross-origin request will include.',
    descRu: 'Отправляется в preflight-запросе со списком нестандартных заголовков, которые будут в фактическом запросе.',
  },

  // --- Security ---
  {
    name: 'Strict-Transport-Security',
    group: 'security',
    descEn: 'Forces browsers to use HTTPS for the domain for a set max-age, optionally including subdomains (HSTS).',
    descRu: 'Заставляет браузеры использовать HTTPS для домена в течение заданного max-age, опционально для поддоменов (HSTS).',
  },
  {
    name: 'Content-Security-Policy',
    group: 'security',
    descEn: 'Restricts which sources of scripts, styles, images and more may load, mitigating XSS and injection attacks.',
    descRu: 'Ограничивает источники скриптов, стилей, изображений и прочего, снижая риск XSS и инъекций.',
  },
  {
    name: 'X-Content-Type-Options',
    group: 'security',
    descEn: 'Set to nosniff to stop browsers from MIME-sniffing responses away from the declared Content-Type.',
    descRu: 'Значение nosniff запрещает браузерам угадывать MIME-тип вопреки объявленному Content-Type.',
  },
  {
    name: 'X-Frame-Options',
    group: 'security',
    descEn: 'Controls whether the page may be embedded in a frame (DENY or SAMEORIGIN) to prevent clickjacking.',
    descRu: 'Управляет тем, можно ли встраивать страницу во фрейм (DENY или SAMEORIGIN), защищая от кликджекинга.',
  },
  {
    name: 'Referrer-Policy',
    group: 'security',
    descEn: 'Controls how much of the Referer header is sent on outgoing requests, balancing analytics and privacy.',
    descRu: 'Управляет тем, сколько данных из заголовка Referer отправляется в исходящих запросах, балансируя аналитику и приватность.',
  },
  {
    name: 'Permissions-Policy',
    group: 'security',
    descEn: 'Enables or disables powerful browser features such as camera, microphone and geolocation per origin.',
    descRu: 'Включает или отключает мощные возможности браузера — камеру, микрофон, геолокацию — по источникам.',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    group: 'security',
    descEn: 'Isolates the browsing context from cross-origin windows (COOP), a building block for cross-origin isolation.',
    descRu: 'Изолирует контекст просмотра от кросс-доменных окон (COOP) — основа кросс-доменной изоляции.',
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    group: 'security',
    descEn: 'Declares who may embed a resource (CORP) — same-origin, same-site or cross-origin — to block side-channel leaks.',
    descRu: 'Объявляет, кто может встраивать ресурс (CORP) — same-origin, same-site или cross-origin, — блокируя утечки по сторонним каналам.',
  },
]

const GROUPS: Group[] = ['general', 'request', 'response', 'caching', 'cors', 'security']

const query = ref('')

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        searchPlaceholder: 'Поиск по названию или описанию (например cache, cors, cookie)…',
        searchAria: 'Поиск по HTTP-заголовкам',
        noResults: 'Ничего не найдено. Попробуйте другое название или ключевое слово.',
        groupLabels: {
          general: 'Общие',
          request: 'Запроса',
          response: 'Ответа',
          caching: 'Кэширование',
          cors: 'CORS',
          security: 'Безопасность',
        } as Record<Group, string>,
      }
    : {
        searchPlaceholder: 'Search by name or description (e.g. cache, cors, cookie)…',
        searchAria: 'Search HTTP headers',
        noResults: 'No matches. Try a different name or keyword.',
        groupLabels: {
          general: 'General',
          request: 'Request',
          response: 'Response',
          caching: 'Caching',
          cors: 'CORS',
          security: 'Security',
        } as Record<Group, string>,
      },
)

// Live filter by header name or the current-locale description.
// Pure (no clock/random/DOM) — safe to evaluate during prerender.
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return headers
  return headers.filter((h) => {
    const d = locale.value === 'ru' ? h.descRu : h.descEn
    return h.name.toLowerCase().includes(q) || d.toLowerCase().includes(q)
  })
})

// Group the filtered rows, dropping empty groups.
const groups = computed(() =>
  GROUPS.map((group) => ({
    group,
    items: filtered.value.filter((h) => h.group === group),
  })).filter((g) => g.items.length > 0),
)

const totalCount = computed(() => filtered.value.length)

function desc(h: Header): string {
  return locale.value === 'ru' ? h.descRu : h.descEn
}

function clearSearch() {
  query.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is anything I type sent to a server?',
    a: 'No. This is a static reference: the full list of headers ships with the page and the search filters it entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored.',
  },
  {
    q: 'What is the difference between request and response headers?',
    a: 'Request headers are sent by the client to describe the request and the client itself (Accept, Authorization, User-Agent). Response headers are returned by the server to describe the response (Server, Set-Cookie, ETag). Some, like Content-Type, can appear in both directions.',
  },
  {
    q: 'What is the X- prefix on headers like X-Forwarded-For?',
    a: 'The X- prefix historically marked non-standard or experimental headers. RFC 6648 deprecated the convention, and several of these have standardized equivalents — for example Forwarded replaces X-Forwarded-For — but the older names remain widespread.',
  },
  {
    q: 'Which headers improve security?',
    a: 'Headers in the Security group are the main ones: Strict-Transport-Security forces HTTPS, Content-Security-Policy limits where resources may load from, X-Content-Type-Options: nosniff stops MIME sniffing, and X-Frame-Options or frame-ancestors prevent clickjacking.',
  },
  {
    q: 'Why is Referer spelled without the second "r"?',
    a: 'It was misspelled in the original HTTP proposal and the typo became part of the standard. The header field is "Referer", even though the related Referrer-Policy header uses the correct spelling.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли введённое на сервер?',
    a: 'Нет. Это статический справочник: полный список заголовков поставляется вместе со страницей, а поиск фильтрует его полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Чем заголовки запроса отличаются от заголовков ответа?',
    a: 'Заголовки запроса отправляет клиент, чтобы описать запрос и самого себя (Accept, Authorization, User-Agent). Заголовки ответа возвращает сервер, чтобы описать ответ (Server, Set-Cookie, ETag). Некоторые, например Content-Type, встречаются в обоих направлениях.',
  },
  {
    q: 'Что означает префикс X- в заголовках вроде X-Forwarded-For?',
    a: 'Префикс X- исторически отмечал нестандартные или экспериментальные заголовки. RFC 6648 отказался от этого соглашения, и у части таких заголовков появились стандартные аналоги — например, Forwarded заменяет X-Forwarded-For, — но старые названия по-прежнему широко используются.',
  },
  {
    q: 'Какие заголовки повышают безопасность?',
    a: 'Главные — из группы «Безопасность»: Strict-Transport-Security принуждает к HTTPS, Content-Security-Policy ограничивает источники ресурсов, X-Content-Type-Options: nosniff отключает угадывание MIME-типа, а X-Frame-Options или frame-ancestors защищают от кликджекинга.',
  },
  {
    q: 'Почему Referer пишется без второй «r»?',
    a: 'В исходном предложении HTTP слово написали с опечаткой, и она вошла в стандарт. Поле заголовка называется «Referer», хотя связанный заголовок Referrer-Policy использует правильное написание.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="http-headers" :faq="faq">
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
      {{ totalCount }} / {{ headers.length }}
    </div>

    <!-- Grouped reference -->
    <div v-if="groups.length" class="mt-2 space-y-8">
      <section v-for="g in groups" :key="g.group">
        <h2 class="mb-3 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
          {{ ui.groupLabels[g.group] }}
        </h2>
        <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
          <div
            v-for="(h, i) in g.items"
            :key="h.name"
            class="flex items-start gap-3 px-3 py-3 sm:gap-4 sm:px-4"
            :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
          >
            <div class="min-w-0 flex-1">
              <div class="font-mono text-sm font-semibold break-all text-accent">{{ h.name }}</div>
              <p class="mt-0.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ desc(h) }}</p>
            </div>
            <CopyButton :text="() => h.name" small class="shrink-0" />
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
        <h2>Справочник HTTP-заголовков с поиском</h2>
        <p>
          Эта бесплатная <strong>шпаргалка по HTTP-заголовкам</strong> собирает в
          одном месте около шестидесяти самых распространённых заголовков — от
          <code>Content-Type</code> и <code>Authorization</code> до правил CORS и
          заголовков безопасности — с кратким описанием каждого. Заголовки
          сгруппированы по назначению, а строка поиска мгновенно фильтрует список по
          названию или описанию, когда нужно быстро вспомнить, что делает
          <code>Cache-Control</code> или какой заголовок управляет CORS.
        </p>
        <p>
          Весь справочник работает <strong>полностью в браузере</strong>. Список
          заголовков загружается вместе со страницей, поиск выполняется локально, и
          ничего из введённого не отправляется на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Начните вводить в поле поиска — список фильтруется на лету.</li>
          <li>Ищите по названию (<code>ETag</code>) или ключевому слову из описания (<code>кэш</code>, <code>cors</code>).</li>
          <li>Просматривайте заголовки по группам: общие, запроса, ответа, кэширование, CORS, безопасность.</li>
          <li>Нажмите <code>Копировать</code> в строке, чтобы скопировать точное название заголовка.</li>
          <li>Очистите поиск, чтобы снова увидеть все группы целиком.</li>
        </ul>

        <h2>Как сгруппированы заголовки</h2>
        <p>
          <strong>Общие</strong> заголовки относятся и к запросу, и к ответу
          (например <code>Content-Type</code>). <strong>Запроса</strong> отправляет
          клиент, описывая себя и запрос. <strong>Ответа</strong> возвращает сервер.
          <strong>Кэширование</strong> управляет хранением и повторным
          использованием ответов. <strong>CORS</strong> регулирует кросс-доменные
          запросы, а <strong>безопасность</strong> укрепляет защиту от XSS,
          кликджекинга и понижения протокола. Деление условно: некоторые заголовки,
          как <code>Content-Type</code>, встречаются в обоих направлениях.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Отлаживаете HTTP? Загляните в
          <NuxtLink :to="localePath('/http-status-codes')">справочник кодов состояния HTTP</NuxtLink>,
          уточните значение заголовка <code>Content-Type</code> в
          <NuxtLink :to="localePath('/mime-types')">справочнике MIME-типов</NuxtLink>
          или разберите ссылку в
          <NuxtLink :to="localePath('/url-parser')">парсере URL</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Searchable HTTP header reference</h2>
        <p>
          This free <strong>HTTP header cheat sheet</strong> gathers about sixty of
          the most common headers in one place — from <code>Content-Type</code> and
          <code>Authorization</code> to CORS rules and security headers — each with a
          short description. Headers are grouped by purpose, and the search box
          filters the list instantly by name or description when you need to recall
          what <code>Cache-Control</code> does or which header drives CORS.
        </p>
        <p>
          The whole reference runs <strong>entirely in your browser</strong>. The
          header list ships with the page, the search happens locally, and nothing
          you type is sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Start typing in the search box — the list filters as you type.</li>
          <li>Search by name (<code>ETag</code>) or a keyword from the description (<code>cache</code>, <code>cors</code>).</li>
          <li>Browse headers by group: general, request, response, caching, CORS, security.</li>
          <li>Click <code>Copy</code> on a row to copy the exact header name.</li>
          <li>Clear the search to see all the groups in full again.</li>
        </ul>

        <h2>How the headers are grouped</h2>
        <p>
          <strong>General</strong> headers apply to both the request and the response
          (for example <code>Content-Type</code>). <strong>Request</strong> headers
          are sent by the client to describe itself and the request.
          <strong>Response</strong> headers are returned by the server.
          <strong>Caching</strong> headers control how responses are stored and
          reused. <strong>CORS</strong> headers govern cross-origin requests, and
          <strong>security</strong> headers harden a site against XSS, clickjacking
          and protocol downgrades. The split is a convention: some headers, like
          <code>Content-Type</code>, appear in both directions.
        </p>

        <h2>Related tools</h2>
        <p>
          Debugging HTTP? Open the
          <NuxtLink :to="localePath('/http-status-codes')">HTTP status code reference</NuxtLink>,
          look up a <code>Content-Type</code> value in the
          <NuxtLink :to="localePath('/mime-types')">MIME type reference</NuxtLink>,
          or break down a link in the
          <NuxtLink :to="localePath('/url-parser')">URL parser</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
