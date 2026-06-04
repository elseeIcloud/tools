<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Klass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx'

interface StatusCode {
  code: number
  /** Canonical English reason phrase, e.g. "Not Found". */
  name: string
  descEn: string
  descRu: string
  klass: Klass
}

// In-file reference data. Pure constant — identical in Node prerender and the
// browser, so the whole page is SSG-safe with no ClientOnly needed.
const codes: StatusCode[] = [
  // --- 1xx Informational ---
  {
    code: 100,
    name: 'Continue',
    klass: '1xx',
    descEn: 'The client should continue with its request. Sent after the server received the request headers and the client should now send the body.',
    descRu: 'Клиент может продолжать запрос. Отправляется после того, как сервер получил заголовки и клиент может отправлять тело запроса.',
  },
  {
    code: 101,
    name: 'Switching Protocols',
    klass: '1xx',
    descEn: 'The server agrees to switch protocols as requested in the Upgrade header — for example, upgrading from HTTP to WebSocket.',
    descRu: 'Сервер согласен сменить протокол, запрошенный в заголовке Upgrade, — например, переключиться с HTTP на WebSocket.',
  },
  {
    code: 103,
    name: 'Early Hints',
    klass: '1xx',
    descEn: 'Used to send preliminary headers, often Link headers for preload/preconnect, before the final response is ready.',
    descRu: 'Используется для отправки предварительных заголовков (обычно Link для preload/preconnect) до того, как готов финальный ответ.',
  },

  // --- 2xx Success ---
  {
    code: 200,
    name: 'OK',
    klass: '2xx',
    descEn: 'The request succeeded. The meaning depends on the method: GET returns the resource, POST returns the result of the action.',
    descRu: 'Запрос выполнен успешно. Смысл зависит от метода: GET возвращает ресурс, POST — результат действия.',
  },
  {
    code: 201,
    name: 'Created',
    klass: '2xx',
    descEn: 'The request succeeded and a new resource was created, usually after a POST or PUT. The Location header points to the new resource.',
    descRu: 'Запрос выполнен и создан новый ресурс, обычно после POST или PUT. Заголовок Location указывает на созданный ресурс.',
  },
  {
    code: 202,
    name: 'Accepted',
    klass: '2xx',
    descEn: 'The request was accepted for processing, but the processing has not finished. Typical for asynchronous or queued work.',
    descRu: 'Запрос принят в обработку, но обработка ещё не завершена. Типично для асинхронных или поставленных в очередь задач.',
  },
  {
    code: 204,
    name: 'No Content',
    klass: '2xx',
    descEn: 'The request succeeded but there is no body to return. Common for DELETE and for PUT/POST that do not need to send data back.',
    descRu: 'Запрос выполнен, но тело ответа отсутствует. Часто используется для DELETE и для PUT/POST, которым не нужно возвращать данные.',
  },
  {
    code: 206,
    name: 'Partial Content',
    klass: '2xx',
    descEn: 'The server is delivering only part of the resource in response to a Range header — used for resumable downloads and media streaming.',
    descRu: 'Сервер отдаёт только часть ресурса в ответ на заголовок Range — используется для докачки и потокового воспроизведения медиа.',
  },

  // --- 3xx Redirection ---
  {
    code: 301,
    name: 'Moved Permanently',
    klass: '3xx',
    descEn: 'The resource has permanently moved to the URL in the Location header. Clients and search engines should update their links.',
    descRu: 'Ресурс окончательно перемещён на URL из заголовка Location. Клиентам и поисковикам следует обновить ссылки.',
  },
  {
    code: 302,
    name: 'Found',
    klass: '3xx',
    descEn: 'The resource is temporarily at a different URL. The original URL should still be used for future requests.',
    descRu: 'Ресурс временно находится по другому URL. Для будущих запросов следует по-прежнему использовать исходный URL.',
  },
  {
    code: 303,
    name: 'See Other',
    klass: '3xx',
    descEn: 'The response is at another URL that should be fetched with GET — typically used after a POST to redirect to a result page.',
    descRu: 'Ответ находится по другому URL, который нужно запросить методом GET — обычно после POST для перехода на страницу результата.',
  },
  {
    code: 304,
    name: 'Not Modified',
    klass: '3xx',
    descEn: 'The cached copy is still valid, so no body is returned. Sent in response to conditional requests using If-None-Match or If-Modified-Since.',
    descRu: 'Кэшированная копия ещё актуальна, тело не возвращается. Отправляется в ответ на условные запросы с If-None-Match или If-Modified-Since.',
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    klass: '3xx',
    descEn: 'Like 302, but the request method and body must not change when following the redirect to the Location URL.',
    descRu: 'Как 302, но при переходе по URL из Location метод запроса и тело должны остаться неизменными.',
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    klass: '3xx',
    descEn: 'Like 301, but the request method and body must be preserved when following the permanent redirect.',
    descRu: 'Как 301, но при переходе по постоянному редиректу метод запроса и тело должны быть сохранены.',
  },

  // --- 4xx Client Error ---
  {
    code: 400,
    name: 'Bad Request',
    klass: '4xx',
    descEn: 'The server cannot process the request due to a client error such as malformed syntax, invalid framing or a deceptive request.',
    descRu: 'Сервер не может обработать запрос из-за ошибки клиента: неверный синтаксис, некорректное оформление или подозрительный запрос.',
  },
  {
    code: 401,
    name: 'Unauthorized',
    klass: '4xx',
    descEn: 'Authentication is required and has failed or not been provided. Despite the name, it means "unauthenticated".',
    descRu: 'Требуется аутентификация, которая не выполнена или не предоставлена. Несмотря на название, означает «не аутентифицирован».',
  },
  {
    code: 402,
    name: 'Payment Required',
    klass: '4xx',
    descEn: 'Reserved for future use. Some APIs use it to signal that payment or a paid plan is required to continue.',
    descRu: 'Зарезервирован для будущего использования. Некоторые API применяют его, чтобы сообщить о необходимости оплаты или платного тарифа.',
  },
  {
    code: 403,
    name: 'Forbidden',
    klass: '4xx',
    descEn: 'The server understood the request but refuses to authorize it. Unlike 401, re-authenticating will not help.',
    descRu: 'Сервер понял запрос, но отказывается его авторизовать. В отличие от 401, повторная аутентификация не поможет.',
  },
  {
    code: 404,
    name: 'Not Found',
    klass: '4xx',
    descEn: 'The server cannot find the requested resource. The endpoint may not exist, or the server hides an existing one for privacy.',
    descRu: 'Сервер не может найти запрошенный ресурс. Эндпоинт может не существовать либо сервер скрывает существующий ради приватности.',
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    klass: '4xx',
    descEn: 'The HTTP method is not supported for this resource. The Allow header lists the methods that are accepted.',
    descRu: 'HTTP-метод не поддерживается для этого ресурса. Заголовок Allow перечисляет допустимые методы.',
  },
  {
    code: 406,
    name: 'Not Acceptable',
    klass: '4xx',
    descEn: 'The server cannot produce a response matching the Accept headers sent in the request (content negotiation failed).',
    descRu: 'Сервер не может вернуть ответ, соответствующий заголовкам Accept из запроса (согласование содержимого не удалось).',
  },
  {
    code: 408,
    name: 'Request Timeout',
    klass: '4xx',
    descEn: 'The server timed out waiting for the request. The client took too long to send a complete request and may retry.',
    descRu: 'Сервер не дождался запроса. Клиент слишком долго отправлял полный запрос и может повторить попытку.',
  },
  {
    code: 409,
    name: 'Conflict',
    klass: '4xx',
    descEn: 'The request conflicts with the current state of the resource, such as an edit conflict or a duplicate that already exists.',
    descRu: 'Запрос конфликтует с текущим состоянием ресурса — например, конфликт правок или уже существующий дубликат.',
  },
  {
    code: 410,
    name: 'Gone',
    klass: '4xx',
    descEn: 'The resource is permanently gone and no forwarding address is known. Stronger and more intentional than 404.',
    descRu: 'Ресурс удалён навсегда, и адрес перенаправления неизвестен. Более сильный и намеренный сигнал, чем 404.',
  },
  {
    code: 413,
    name: 'Content Too Large',
    klass: '4xx',
    descEn: 'The request body is larger than the server is willing or able to process (formerly "Payload Too Large").',
    descRu: 'Тело запроса больше, чем сервер готов или способен обработать (ранее «Payload Too Large»).',
  },
  {
    code: 414,
    name: 'URI Too Long',
    klass: '4xx',
    descEn: 'The request URI is longer than the server is willing to interpret — often a GET with too many query parameters.',
    descRu: 'URI запроса длиннее, чем сервер готов разобрать, — нередко это GET со слишком большим числом параметров.',
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    klass: '4xx',
    descEn: 'The payload format is not supported. The Content-Type or Content-Encoding of the body is rejected by the server.',
    descRu: 'Формат тела запроса не поддерживается. Сервер отклоняет Content-Type или Content-Encoding переданного тела.',
  },
  {
    code: 418,
    name: "I'm a teapot",
    klass: '4xx',
    descEn: 'An April Fools joke from RFC 2324: the server refuses to brew coffee because it is, permanently, a teapot.',
    descRu: 'Первоапрельская шутка из RFC 2324: сервер отказывается варить кофе, потому что он, навсегда, — чайник.',
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    klass: '4xx',
    descEn: 'The request was well-formed but contains semantic errors that prevent processing — common for validation failures in APIs.',
    descRu: 'Запрос синтаксически корректен, но содержит смысловые ошибки, мешающие обработке, — типично для ошибок валидации в API.',
  },
  {
    code: 425,
    name: 'Too Early',
    klass: '4xx',
    descEn: 'The server is unwilling to process a request that might be replayed, such as one sent in TLS early data (0-RTT).',
    descRu: 'Сервер не готов обрабатывать запрос, который может быть повторён, — например, отправленный в early data TLS (0-RTT).',
  },
  {
    code: 426,
    name: 'Upgrade Required',
    klass: '4xx',
    descEn: 'The client must switch to a different protocol. The server sends an Upgrade header indicating what is required.',
    descRu: 'Клиент должен перейти на другой протокол. Сервер присылает заголовок Upgrade с указанием требуемого протокола.',
  },
  {
    code: 428,
    name: 'Precondition Required',
    klass: '4xx',
    descEn: 'The server requires the request to be conditional, for example with an If-Match header, to avoid lost-update conflicts.',
    descRu: 'Сервер требует, чтобы запрос был условным (например, с заголовком If-Match), чтобы избежать конфликтов потери обновлений.',
  },
  {
    code: 429,
    name: 'Too Many Requests',
    klass: '4xx',
    descEn: 'The client has sent too many requests in a given time (rate limiting). A Retry-After header may say when to try again.',
    descRu: 'Клиент отправил слишком много запросов за отведённое время (rate limiting). Заголовок Retry-After может указать, когда повторить.',
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    klass: '4xx',
    descEn: 'The server refuses the request because the header fields are too large, either individually or all together.',
    descRu: 'Сервер отклоняет запрос, потому что поля заголовков слишком велики — по отдельности или в сумме.',
  },

  // --- 5xx Server Error ---
  {
    code: 500,
    name: 'Internal Server Error',
    klass: '5xx',
    descEn: 'A generic, catch-all error: the server hit an unexpected condition and could not complete the request.',
    descRu: 'Общая ошибка на все случаи: сервер столкнулся с непредвиденной ситуацией и не смог выполнить запрос.',
  },
  {
    code: 501,
    name: 'Not Implemented',
    klass: '5xx',
    descEn: 'The server does not support the functionality required to fulfil the request, such as an unknown request method.',
    descRu: 'Сервер не поддерживает функциональность, нужную для выполнения запроса, — например, неизвестный метод запроса.',
  },
  {
    code: 502,
    name: 'Bad Gateway',
    klass: '5xx',
    descEn: 'A server acting as a gateway or proxy received an invalid response from the upstream server it contacted.',
    descRu: 'Сервер, работающий как шлюз или прокси, получил некорректный ответ от вышестоящего сервера.',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    klass: '5xx',
    descEn: 'The server cannot handle the request right now, usually due to overload or maintenance. Often temporary.',
    descRu: 'Сервер сейчас не может обработать запрос, обычно из-за перегрузки или обслуживания. Чаще всего временно.',
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    klass: '5xx',
    descEn: 'A gateway or proxy did not get a timely response from the upstream server needed to complete the request.',
    descRu: 'Шлюз или прокси не получил вовремя ответ от вышестоящего сервера, нужного для выполнения запроса.',
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    klass: '5xx',
    descEn: 'The server does not support the major HTTP protocol version used in the request.',
    descRu: 'Сервер не поддерживает основную версию протокола HTTP, использованную в запросе.',
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    klass: '5xx',
    descEn: 'The client must authenticate to gain network access — typically sent by a captive portal on public Wi-Fi.',
    descRu: 'Клиент должен пройти аутентификацию для доступа к сети — обычно отправляется captive-порталом в публичном Wi-Fi.',
  },
]

const KLASSES: Klass[] = ['1xx', '2xx', '3xx', '4xx', '5xx']

const query = ref('')

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        searchPlaceholder: 'Поиск по коду, названию или описанию (например 404, teapot, timeout)…',
        searchAria: 'Поиск по HTTP-кодам состояния',
        clearSearch: 'Очистить поиск',
        noResults: 'Ничего не найдено. Попробуйте другой код или ключевое слово.',
        classLabels: {
          '1xx': '1xx · Информационные',
          '2xx': '2xx · Успешные',
          '3xx': '3xx · Перенаправления',
          '4xx': '4xx · Ошибки клиента',
          '5xx': '5xx · Ошибки сервера',
        } as Record<Klass, string>,
      }
    : {
        searchPlaceholder: 'Search by code, name or description (e.g. 404, teapot, timeout)…',
        searchAria: 'Search HTTP status codes',
        clearSearch: 'Clear search',
        noResults: 'No matches. Try a different code or keyword.',
        classLabels: {
          '1xx': '1xx · Informational',
          '2xx': '2xx · Success',
          '3xx': '3xx · Redirection',
          '4xx': '4xx · Client Error',
          '5xx': '5xx · Server Error',
        } as Record<Klass, string>,
      },
)

// Live filter by code, English name, or the current-locale description.
// Pure (no clock/random/DOM) — safe to evaluate during prerender.
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return codes
  return codes.filter((c) => {
    const desc = locale.value === 'ru' ? c.descRu : c.descEn
    return (
      String(c.code).includes(q) ||
      c.name.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q)
    )
  })
})

// Group the filtered rows by class, dropping empty classes.
const groups = computed(() =>
  KLASSES.map((klass) => ({
    klass,
    items: filtered.value.filter((c) => c.klass === klass),
  })).filter((g) => g.items.length > 0),
)

const totalCount = computed(() => filtered.value.length)

function desc(c: StatusCode): string {
  return locale.value === 'ru' ? c.descRu : c.descEn
}

// Copy text for a row: "code name", e.g. "404 Not Found".
function copyText(c: StatusCode): string {
  return `${c.code} ${c.name}`
}

function clearSearch() {
  query.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is anything I type sent to a server?',
    a: 'No. This is a static reference: the full list of status codes ships with the page and the search filters it entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored.',
  },
  {
    q: 'How are HTTP status codes grouped?',
    a: 'By the first digit. 1xx are informational, 2xx mean success, 3xx are redirections, 4xx are client errors (the request was wrong) and 5xx are server errors (the server failed). This page shows a heading for each class.',
  },
  {
    q: 'What is the difference between 401 and 403?',
    a: '401 Unauthorized means you are not authenticated — valid credentials are missing or wrong, and authenticating may fix it. 403 Forbidden means you are authenticated but not allowed; re-authenticating will not help.',
  },
  {
    q: 'When should I use 404 versus 410?',
    a: 'Use 404 Not Found when a resource is missing or its existence is unknown. Use 410 Gone when you deliberately removed a resource permanently and want clients and crawlers to stop requesting it.',
  },
  {
    q: 'Is 418 "I\'m a teapot" a real status code?',
    a: 'It was defined as an April Fools joke in RFC 2324 (HTCPCP) and is not part of standard HTTP, but it is widely recognised and some servers and frameworks return it playfully. Search "teapot" above to find it.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли введённое на сервер?',
    a: 'Нет. Это статический справочник: полный список кодов поставляется вместе со страницей, а поиск фильтрует его полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Как сгруппированы HTTP-коды состояния?',
    a: 'По первой цифре. 1xx — информационные, 2xx — успешные, 3xx — перенаправления, 4xx — ошибки клиента (запрос был неверным), 5xx — ошибки сервера (сбой на стороне сервера). На странице для каждого класса показан отдельный заголовок.',
  },
  {
    q: 'Чем 401 отличается от 403?',
    a: '401 Unauthorized означает, что вы не аутентифицированы — учётные данные отсутствуют или неверны, и аутентификация может помочь. 403 Forbidden означает, что вы аутентифицированы, но доступ запрещён; повторная аутентификация не поможет.',
  },
  {
    q: 'Когда использовать 404, а когда 410?',
    a: 'Используйте 404 Not Found, когда ресурс отсутствует или его существование неизвестно. Используйте 410 Gone, когда вы намеренно удалили ресурс навсегда и хотите, чтобы клиенты и поисковые роботы перестали его запрашивать.',
  },
  {
    q: 'Код 418 «I\'m a teapot» настоящий?',
    a: 'Он был определён как первоапрельская шутка в RFC 2324 (HTCPCP) и не входит в стандартный HTTP, но широко известен, и некоторые серверы и фреймворки возвращают его в шутку. Введите «teapot» в поиск выше, чтобы найти его.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="http-status-codes" :faq="faq">
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
      {{ totalCount }} / {{ codes.length }}
    </div>

    <!-- Grouped reference -->
    <div v-if="groups.length" class="mt-2 space-y-8">
      <section v-for="g in groups" :key="g.klass">
        <h2 class="mb-3 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
          {{ ui.classLabels[g.klass] }}
        </h2>
        <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
          <div
            v-for="(c, i) in g.items"
            :key="c.code"
            class="flex items-start gap-3 px-3 py-3 sm:gap-4 sm:px-4"
            :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
          >
            <span class="w-12 shrink-0 font-mono text-base font-semibold text-accent tabular-nums">{{ c.code }}</span>
            <div class="min-w-0 flex-1">
              <div class="font-medium text-ink-800 dark:text-ink-100">{{ c.name }}</div>
              <p class="mt-0.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ desc(c) }}</p>
            </div>
            <CopyButton :text="() => copyText(c)" small class="shrink-0" />
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
        <h2>Справочник HTTP-кодов состояния с поиском</h2>
        <p>
          Эта бесплатная <strong>шпаргалка по HTTP-кодам состояния</strong> собирает
          все распространённые коды от <strong>1xx</strong> до <strong>5xx</strong> в
          одном месте с кратким описанием и подсказкой, когда их применять. Коды
          сгруппированы по классам, а строка поиска мгновенно фильтрует список по
          номеру, названию или описанию — удобно, когда нужно быстро понять, что
          означает 422 или почему API вернул 429.
        </p>
        <p>
          Весь справочник работает <strong>полностью в браузере</strong>. Список
          кодов загружается вместе со страницей, поиск выполняется локально, и
          ничего из введённого не отправляется на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Начните вводить в поле поиска — список фильтруется на лету.</li>
          <li>Ищите по коду (<code>404</code>), названию (<code>Not Found</code>) или ключевому слову из описания (<code>timeout</code>).</li>
          <li>Просматривайте коды по классам: <code>1xx</code>, <code>2xx</code>, <code>3xx</code>, <code>4xx</code>, <code>5xx</code>.</li>
          <li>Нажмите <code>Копировать</code> в строке, чтобы скопировать «код название», например <code>404 Not Found</code>.</li>
          <li>Очистите поиск, чтобы снова увидеть все группы целиком.</li>
        </ul>

        <h2>Что означают классы кодов</h2>
        <p>
          Первая цифра кода задаёт класс ответа. <strong>1xx</strong> —
          информационные, промежуточные сообщения. <strong>2xx</strong> — успех:
          запрос принят и обработан. <strong>3xx</strong> — перенаправление: ресурс
          находится по другому URL. <strong>4xx</strong> — ошибка клиента: с запросом
          что-то не так (неверный адрес, отсутствует авторизация, превышен лимит).
          <strong>5xx</strong> — ошибка сервера: запрос корректен, но сервер не смог
          его выполнить. Понимание класса помогает сразу определить, на чьей стороне
          проблема.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Отлаживаете HTTP-запросы? Разберите ссылку в
          <NuxtLink :to="localePath('/url-parser')">парсере URL</NuxtLink>,
          изучите токен авторизации в <NuxtLink :to="localePath('/jwt-decoder')">декодере JWT</NuxtLink>
          или рассчитайте сеть в
          <NuxtLink :to="localePath('/ip-subnet-calculator')">калькуляторе подсетей IP</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Searchable HTTP status code reference</h2>
        <p>
          This free <strong>HTTP status code cheat sheet</strong> gathers every
          common code from <strong>1xx</strong> to <strong>5xx</strong> in one place,
          with a short description and a hint about when to use it. Codes are grouped
          by class, and the search box filters the list instantly by number, name or
          description — handy when you need to know what a 422 means or why an API
          returned a 429.
        </p>
        <p>
          The whole reference runs <strong>entirely in your browser</strong>. The
          code list ships with the page, the search happens locally, and nothing you
          type is sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Start typing in the search box — the list filters as you type.</li>
          <li>Search by code (<code>404</code>), name (<code>Not Found</code>) or a keyword from the description (<code>timeout</code>).</li>
          <li>Browse codes by class: <code>1xx</code>, <code>2xx</code>, <code>3xx</code>, <code>4xx</code>, <code>5xx</code>.</li>
          <li>Click <code>Copy</code> on a row to copy "code name", for example <code>404 Not Found</code>.</li>
          <li>Clear the search to see all the groups in full again.</li>
        </ul>

        <h2>What the code classes mean</h2>
        <p>
          The first digit of a code sets its class. <strong>1xx</strong> are
          informational, interim messages. <strong>2xx</strong> mean success: the
          request was received and processed. <strong>3xx</strong> are redirections:
          the resource lives at another URL. <strong>4xx</strong> are client errors:
          something is wrong with the request (bad address, missing auth, rate
          limit). <strong>5xx</strong> are server errors: the request was fine but the
          server could not fulfil it. Knowing the class tells you at a glance which
          side the problem is on.
        </p>

        <h2>Related tools</h2>
        <p>
          Debugging HTTP requests? Break down a link in the
          <NuxtLink :to="localePath('/url-parser')">URL parser</NuxtLink>,
          inspect an auth token with the <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>,
          or work out a network with the
          <NuxtLink :to="localePath('/ip-subnet-calculator')">IP subnet calculator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
