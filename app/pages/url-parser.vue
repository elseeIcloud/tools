<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        urlLabel: 'URL',
        placeholder: 'https://user:pass@example.com:8443/path/to/page?q=1&lang=ru#section',
        inputAria: 'Поле ввода URL для разбора',
        invalid: '✗ Некорректный URL',
        valid: '✓ URL разобран',
        startHint: 'Вставьте URL выше, чтобы разобрать его на компоненты.',
        components: 'Компоненты',
        queryParams: 'Параметры запроса',
        noParams: 'В этом URL нет параметров запроса.',
        empty: '(пусто)',
        key: 'Ключ',
        value: 'Значение',
        protocol: 'Протокол (protocol)',
        origin: 'Источник (origin)',
        username: 'Имя пользователя (username)',
        password: 'Пароль (password)',
        host: 'Хост с портом (host)',
        hostname: 'Имя хоста (hostname)',
        port: 'Порт (port)',
        pathname: 'Путь (pathname)',
        search: 'Строка запроса (search)',
        hash: 'Якорь (hash)',
      }
    : {
        urlLabel: 'URL',
        placeholder: 'https://user:pass@example.com:8443/path/to/page?q=1&lang=en#section',
        inputAria: 'URL input to parse',
        invalid: '✗ Invalid URL',
        valid: '✓ URL parsed',
        startHint: 'Paste a URL above to break it down into its components.',
        components: 'Components',
        queryParams: 'Query parameters',
        noParams: 'This URL has no query parameters.',
        empty: '(empty)',
        key: 'Key',
        value: 'Value',
        protocol: 'Protocol',
        origin: 'Origin',
        username: 'Username',
        password: 'Password',
        host: 'Host (with port)',
        hostname: 'Hostname',
        port: 'Port',
        pathname: 'Pathname',
        search: 'Search (query string)',
        hash: 'Hash (fragment)',
      },
)

// Locale-aware error messages, returned as a tagged kind so the computed
// parser stays pure and the user-facing text follows the active language.
type ErrorKind = { kind: 'invalid'; raw: string }

function errorText(e: ErrorKind): string {
  if (locale.value === 'ru') {
    return `«${e.raw}» не является корректным абсолютным URL. Включите протокол, например https://.`
  }
  return `"${e.raw}" is not a valid absolute URL. Include a protocol such as https://.`
}

interface UrlPart {
  key: keyof typeof labelKeys
  label: string
  value: string
}

interface QueryParam {
  key: string
  value: string
}

// Maps the URL field name to the ui label key (both locales share these keys).
const labelKeys = {
  protocol: 'protocol',
  origin: 'origin',
  username: 'username',
  password: 'password',
  host: 'host',
  hostname: 'hostname',
  port: 'port',
  pathname: 'pathname',
  search: 'search',
  hash: 'hash',
} as const

// Single pure computed: parse the URL with the platform parser. `new URL`,
// `URLSearchParams` and `decodeURIComponent` all exist in the Node prerender
// environment, so this is SSG-safe and needs no ClientOnly.
const result = computed<
  | { ok: true; url: URL; parts: UrlPart[]; params: QueryParam[] }
  | { ok: false; error: ErrorKind }
  | null
>(() => {
  const raw = input.value.trim()
  if (!raw) return null

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, error: { kind: 'invalid', raw } }
  }

  const parts: UrlPart[] = (Object.keys(labelKeys) as (keyof typeof labelKeys)[]).map((key) => ({
    key,
    label: ui.value[key],
    value: url[key],
  }))

  // URLSearchParams decodes values and preserves repeated keys in order.
  const params: QueryParam[] = []
  for (const [key, value] of url.searchParams.entries()) {
    params.push({ key, value })
  }

  return { ok: true, url, parts, params }
})

const parsed = computed(() => (result.value?.ok ? result.value : null))
const error = computed(() =>
  result.value && !result.value.ok ? errorText(result.value.error) : null,
)

function clear() {
  input.value = ''
}

// Rich sample: HTTP Basic auth, non-default port, multiple query params
// (including a repeated key and a percent-encoded value) and a hash.
const sample =
  'https://user:pass@example.com:8443/path/to/page?q=1&tag=red&tag=blue&note=two%20words#section'

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my URL sent to a server?',
    a: 'No. The URL is parsed entirely in your browser with the built-in URL and URLSearchParams APIs. Nothing is uploaded, logged or stored, so it is safe to inspect links that contain tokens, signed parameters or other sensitive data.',
  },
  {
    q: 'Why do I need to include https:// or another protocol?',
    a: 'The parser handles absolute URLs only, because that is what the WHATWG URL specification requires. A bare value like example.com/page has no scheme, so it is rejected with a red error. Prefix it with https:// (or http://, ftp://, etc.) and it will parse.',
  },
  {
    q: 'How are the query parameter values decoded?',
    a: 'Values are read through URLSearchParams, which percent-decodes them and turns + into a space for you. So note=two%20words is shown as "two words", and any repeated key like tag=red&tag=blue is preserved as two separate rows in the order they appear.',
  },
  {
    q: 'What is the difference between host, hostname and origin?',
    a: 'Hostname is just the domain (example.com). Host adds the port when it is not the default (example.com:8443). Origin combines the protocol, hostname and port (https://example.com:8443) and is what browsers compare for same-origin checks.',
  },
  {
    q: 'Does it show the username and password from a URL?',
    a: 'Yes. If a URL contains HTTP Basic credentials like user:pass@host, they appear in the username and password fields. Embedding credentials in a URL is discouraged for security, but the parser surfaces them so you can spot and remove them.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой URL на сервер?',
    a: 'Нет. URL разбирается полностью в браузере встроенными API URL и URLSearchParams. Ничего не загружается, не логируется и не сохраняется, поэтому безопасно изучать ссылки с токенами, подписанными параметрами и другими конфиденциальными данными.',
  },
  {
    q: 'Зачем нужно указывать https:// или другой протокол?',
    a: 'Парсер работает только с абсолютными URL — этого требует спецификация WHATWG URL. Голое значение вроде example.com/page не содержит схемы, поэтому отклоняется с красной ошибкой. Добавьте https:// (или http://, ftp:// и т. п.), и разбор пройдёт.',
  },
  {
    q: 'Как декодируются значения параметров запроса?',
    a: 'Значения читаются через URLSearchParams, который снимает percent-кодирование и превращает + в пробел. Поэтому note=two%20words показывается как «two words», а повторяющийся ключ вроде tag=red&tag=blue сохраняется двумя отдельными строками в исходном порядке.',
  },
  {
    q: 'Чем отличаются host, hostname и origin?',
    a: 'Hostname — это только домен (example.com). Host добавляет порт, если он не стандартный (example.com:8443). Origin объединяет протокол, имя хоста и порт (https://example.com:8443) — именно его браузеры сравнивают при проверках одного источника.',
  },
  {
    q: 'Показываются ли имя пользователя и пароль из URL?',
    a: 'Да. Если URL содержит учётные данные HTTP Basic вида user:pass@host, они появятся в полях username и password. Встраивать учётные данные в URL небезопасно, но парсер их показывает, чтобы вы могли их заметить и убрать.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="url-parser" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label for="url-input" class="label !mb-0 mr-1">{{ ui.urlLabel }}</label>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => input" />
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <textarea
        id="url-input"
        v-model="input"
        class="textarea-code min-h-[6rem] break-all"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
        :aria-label="ui.inputAria"
      />
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] flex-wrap items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ error }}</span>
      </template>
      <template v-else-if="parsed">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">
          {{ parsed.params.length }} {{ ui.queryParams.toLowerCase() }}
        </span>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Components grid -->
    <div v-if="parsed" class="mt-5">
      <span class="label">{{ ui.components }}</span>
      <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="(p, i) in parsed.parts"
              :key="p.key"
              :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
            >
              <td class="w-1/3 whitespace-nowrap px-3 py-2 align-top font-medium text-ink-700 dark:text-ink-200">{{ p.label }}</td>
              <td class="px-3 py-2">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-mono break-all text-ink-600 dark:text-ink-300">
                    <template v-if="p.value">{{ p.value }}</template>
                    <span v-else class="text-ink-400 italic">{{ ui.empty }}</span>
                  </span>
                  <CopyButton v-if="p.value" :text="() => p.value" small class="shrink-0" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Query parameters -->
    <div v-if="parsed" class="mt-5">
      <span class="label">{{ ui.queryParams }}</span>
      <div v-if="parsed.params.length" class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-ink-100 dark:bg-ink-800">
              <th class="w-1/3 px-3 py-2 text-left font-medium text-ink-700 dark:text-ink-200">{{ ui.key }}</th>
              <th class="px-3 py-2 text-left font-medium text-ink-700 dark:text-ink-200">{{ ui.value }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(param, i) in parsed.params"
              :key="i"
              :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
            >
              <td class="px-3 py-2 align-top font-mono break-all font-medium text-ink-700 dark:text-ink-200">{{ param.key }}</td>
              <td class="px-3 py-2">
                <div class="flex items-start justify-between gap-2">
                  <span class="font-mono break-all text-ink-600 dark:text-ink-300">
                    <template v-if="param.value">{{ param.value }}</template>
                    <span v-else class="text-ink-400 italic">{{ ui.empty }}</span>
                  </span>
                  <CopyButton :text="() => param.value" small class="shrink-0" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-sm text-ink-400">{{ ui.noParams }}</p>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Разбор URL на компоненты онлайн</h2>
        <p>
          Этот бесплатный <strong>парсер URL</strong> разбивает любую ссылку на
          составные части — протокол, источник (origin), имя пользователя и пароль,
          хост, имя хоста, порт, путь, строку запроса и якорь — и показывает их в
          понятной таблице. Ниже он раскладывает строку запроса на отдельные пары
          ключ-значение, декодируя percent-кодирование и сохраняя повторяющиеся
          ключи. Инструмент сделан для разработчиков, которые ежедневно разбираются
          с redirect-ссылками, callback-URL OAuth и параметрами трекинга.
        </p>
        <p>
          Разбор выполняется <strong>полностью в браузере</strong> стандартным API
          <code>URL</code>. Ссылка не отправляется на сервер, поэтому безопасно
          изучать URL с токенами, подписями и другими конфиденциальными параметрами.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте абсолютный URL в поле — он разбирается сразу по мере ввода.</li>
          <li>Обязательно укажите протокол (<code>https://</code>, <code>http://</code> и т. п.), иначе URL будет отклонён.</li>
          <li>Изучите таблицу <code>Компоненты</code> — <code>hostname</code>, <code>port</code>, <code>pathname</code>, <code>hash</code> и другие.</li>
          <li>Просмотрите <code>Параметры запроса</code>: значения уже декодированы, повторяющиеся ключи показаны отдельными строками.</li>
          <li>Нажмите <code>Копировать</code> рядом с любым значением или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Что означают части URL</h2>
        <p>
          <strong>protocol</strong> — это схема со двоеточием (<code>https:</code>).
          <strong>hostname</strong> — только домен, а <strong>host</strong> добавляет
          порт, если он нестандартный. <strong>origin</strong> объединяет протокол,
          имя хоста и порт — именно его браузеры сравнивают при проверках одного
          источника. <strong>pathname</strong> — это путь, <strong>search</strong> —
          строка запроса вместе с <code>?</code>, а <strong>hash</strong> — якорь
          вместе с <code>#</code>. Поля <strong>username</strong> и
          <strong>password</strong> заполняются только если ссылка содержит учётные
          данные HTTP Basic вида <code>user:pass@host</code>.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно работать только со строкой запроса? Откройте
          <NuxtLink :to="localePath('/query-string-parser')">парсер query-строк</NuxtLink>,
          закодируйте или декодируйте отдельные значения в
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщике</NuxtLink>
          или разберите данные в
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщике/декодировщике Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Break a URL into its parts online</h2>
        <p>
          This free <strong>URL parser</strong> splits any link into its building
          blocks — protocol, origin, username and password, host, hostname, port,
          pathname, query string and hash — and lays them out in a readable table.
          Below that it expands the query string into individual key-value pairs,
          decoding percent-encoding and preserving repeated keys. It is built for
          developers who untangle redirect links, OAuth callback URLs and tracking
          parameters every day.
        </p>
        <p>
          Parsing runs <strong>entirely in your browser</strong> using the standard
          <code>URL</code> API. The link is never sent to a server, so it is safe to
          inspect URLs that carry tokens, signatures and other sensitive parameters.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste an absolute URL into the box — it is parsed instantly as you type.</li>
          <li>Always include a protocol (<code>https://</code>, <code>http://</code>, etc.), otherwise the URL is rejected.</li>
          <li>Read the <code>Components</code> table — <code>hostname</code>, <code>port</code>, <code>pathname</code>, <code>hash</code> and more.</li>
          <li>Review the <code>Query parameters</code>: values are already decoded, and repeated keys are shown as separate rows.</li>
          <li>Click <code>Copy</code> next to any value, or hit <code>Sample</code> to try it immediately.</li>
        </ul>

        <h2>What the URL parts mean</h2>
        <p>
          <strong>protocol</strong> is the scheme with its colon (<code>https:</code>).
          <strong>hostname</strong> is just the domain, while <strong>host</strong>
          adds the port when it is non-default. <strong>origin</strong> combines the
          protocol, hostname and port and is what browsers compare for same-origin
          checks. <strong>pathname</strong> is the path, <strong>search</strong> is
          the query string including the <code>?</code>, and <strong>hash</strong> is
          the fragment including the <code>#</code>. The <strong>username</strong> and
          <strong>password</strong> fields are only populated when the link contains
          HTTP Basic credentials like <code>user:pass@host</code>.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to work with just the query string? Open the
          <NuxtLink :to="localePath('/query-string-parser')">query string parser</NuxtLink>,
          encode or decode individual values in the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          or unpack data with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
