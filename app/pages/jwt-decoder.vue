<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')

// Live "now" in seconds. Stays null during SSR/prerender and is only
// populated in the browser, so the expiry badge never causes a hydration
// mismatch (it lives inside <ClientOnly>).
const nowSec = ref<number | null>(null)
onMounted(() => {
  nowSec.value = Math.floor(Date.now() / 1000)
  // Keep the badge fresh while the page is open.
  const id = setInterval(() => (nowSec.value = Math.floor(Date.now() / 1000)), 1000)
  onBeforeUnmount(() => clearInterval(id))
})

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        tokenLabel: 'JSON Web Token',
        copyToken: 'Копировать токен',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        inputAria: 'Поле ввода JSON Web Token',
        invalid: '✗ Некорректный токен',
        decoded: '✓ Декодирован',
        startHint: 'Вставьте JWT выше, чтобы декодировать заголовок, payload и claims.',
        header: 'Заголовок',
        payload: 'Payload',
        timestampClaims: 'Стандартные временные claims',
        signature: 'Подпись',
        signatureWarn1: 'Подпись показана как есть и',
        signatureWarnStrong: 'не проверяется',
        signatureWarn2: 'Для её проверки нужен секрет подписи или открытый ключ, которые этот инструмент никогда не получает.',
        iat: 'Выпущен (iat)',
        nbf: 'Действителен с (nbf)',
        exp: 'Истекает (exp)',
      }
    : {
        tokenLabel: 'JSON Web Token',
        copyToken: 'Copy token',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        inputAria: 'JSON Web Token input',
        invalid: '✗ Invalid token',
        decoded: '✓ Decoded',
        startHint: 'Paste a JWT above to decode its header, payload and claims.',
        header: 'Header',
        payload: 'Payload',
        timestampClaims: 'Registered timestamp claims',
        signature: 'Signature',
        signatureWarn1: 'The signature is shown as-is and is',
        signatureWarnStrong: 'not verified',
        signatureWarn2: 'Verifying it requires the signing secret or public key, which this tool never receives.',
        iat: 'Issued at (iat)',
        nbf: 'Not before (nbf)',
        exp: 'Expires (exp)',
      },
)

// --- base64url helpers (atob/TextDecoder both exist in the Node build env) ---
function base64UrlToBytes(part: string): Uint8Array {
  let b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  // Pad to a multiple of 4 so atob accepts it.
  while (b64.length % 4) b64 += '='
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function decodePart(part: string): unknown {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(part))
  return JSON.parse(text)
}

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

// Locale-aware error messages, returned as a tagged kind so the computed
// parser stays pure and the user-facing text follows the active language.
type ErrorKind =
  | { kind: 'parts'; count: number }
  | { kind: 'empty' }
  | { kind: 'header-b64' }
  | { kind: 'payload-b64' }
  | { kind: 'header-obj' }
  | { kind: 'payload-obj' }

function errorText(e: ErrorKind): string {
  if (locale.value === 'ru') {
    switch (e.kind) {
      case 'parts':
        return `JWT должен состоять из 3 частей, разделённых точками, но в этом токене ${e.count}.`
      case 'empty':
        return 'Один из сегментов токена пуст.'
      case 'header-b64':
        return 'Заголовок не является корректным JSON в кодировке base64url.'
      case 'payload-b64':
        return 'Payload не является корректным JSON в кодировке base64url.'
      case 'header-obj':
        return 'Заголовок декодировался не в JSON-объект.'
      case 'payload-obj':
        return 'Payload декодировался не в JSON-объект.'
    }
  }
  switch (e.kind) {
    case 'parts':
      return `A JWT must have 3 parts separated by dots, but this token has ${e.count}.`
    case 'empty':
      return 'One of the token segments is empty.'
    case 'header-b64':
      return 'The header is not valid base64url-encoded JSON.'
    case 'payload-b64':
      return 'The payload is not valid base64url-encoded JSON.'
    case 'header-obj':
      return 'The header did not decode to a JSON object.'
    case 'payload-obj':
      return 'The payload did not decode to a JSON object.'
  }
}

// Single computed that parses the whole token. Pure (no clock/random),
// so it is safe to evaluate during setup/prerender.
const result = computed<{ ok: true; data: DecodedJwt } | { ok: false; error: ErrorKind } | null>(() => {
  const raw = input.value.trim()
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 3) {
    return { ok: false, error: { kind: 'parts', count: parts.length } }
  }
  if (parts.some((p) => p.length === 0)) {
    return { ok: false, error: { kind: 'empty' } }
  }

  let header: unknown
  try {
    header = decodePart(parts[0]!)
  } catch {
    return { ok: false, error: { kind: 'header-b64' } }
  }

  let payload: unknown
  try {
    payload = decodePart(parts[1]!)
  } catch {
    return { ok: false, error: { kind: 'payload-b64' } }
  }

  if (typeof header !== 'object' || header === null || Array.isArray(header)) {
    return { ok: false, error: { kind: 'header-obj' } }
  }
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, error: { kind: 'payload-obj' } }
  }

  return {
    ok: true,
    data: {
      header: header as Record<string, unknown>,
      payload: payload as Record<string, unknown>,
      signature: parts[2]!,
    },
  }
})

const decoded = computed(() => (result.value?.ok ? result.value.data : null))
const error = computed(() => (result.value && !result.value.ok ? errorText(result.value.error) : null))

const headerJson = computed(() => (decoded.value ? JSON.stringify(decoded.value.header, null, 2) : ''))
const payloadJson = computed(() => (decoded.value ? JSON.stringify(decoded.value.payload, null, 2) : ''))

// Surface common header fields.
const alg = computed(() => {
  const v = decoded.value?.header.alg
  return typeof v === 'string' ? v : null
})
const typ = computed(() => {
  const v = decoded.value?.header.typ
  return typeof v === 'string' ? v : null
})

// --- Human-readable standard timestamp claims (pure: just formatting) ---
function asEpochSeconds(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function toUtc(sec: number): string {
  return new Date(sec * 1000).toUTCString()
}

interface TimeClaim {
  key: 'iat' | 'nbf' | 'exp'
  label: string
  seconds: number
  utc: string
}

const timeClaims = computed<TimeClaim[]>(() => {
  if (!decoded.value) return []
  const map: { key: TimeClaim['key'] }[] = [{ key: 'iat' }, { key: 'nbf' }, { key: 'exp' }]
  const out: TimeClaim[] = []
  for (const { key } of map) {
    const sec = asEpochSeconds(decoded.value.payload[key])
    if (sec !== null) out.push({ key, label: ui.value[key], seconds: sec, utc: toUtc(sec) })
  }
  return out
})

const expSec = computed(() => (decoded.value ? asEpochSeconds(decoded.value.payload.exp) : null))
const nbfSec = computed(() => (decoded.value ? asEpochSeconds(decoded.value.payload.nbf) : null))

// Short, human relative duration like "2 days" / "3 hours" (locale-aware).
function relative(absSeconds: number): string {
  const enUnits: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  let value = absSeconds
  let idx = 0
  for (let i = 0; i < enUnits.length; i++) {
    if (value < enUnits[i]![0]) {
      idx = i
      break
    }
    value = value / enUnits[i]![0]
    idx = i
  }
  const rounded = Math.floor(value)

  if (locale.value === 'ru') {
    // Russian plural forms: one / few / many.
    const forms: [string, string, string][] = [
      ['секунду', 'секунды', 'секунд'],
      ['минуту', 'минуты', 'минут'],
      ['час', 'часа', 'часов'],
      ['день', 'дня', 'дней'],
      ['месяц', 'месяца', 'месяцев'],
      ['год', 'года', 'лет'],
    ]
    const [one, few, many] = forms[idx]!
    const n10 = rounded % 10
    const n100 = rounded % 100
    let word = many
    if (n10 === 1 && n100 !== 11) word = one
    else if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) word = few
    return `${rounded} ${word}`
  }

  const names = ['second', 'minute', 'hour', 'day', 'month', 'year']
  const unit = names[idx]!
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'}`
}

// Validity badge — depends on the CURRENT time, so it is ONLY ever read
// inside <ClientOnly>, and nowSec is null until onMounted.
const validity = computed<{ kind: 'valid' | 'expired' | 'pending' | 'none'; text: string }>(() => {
  const now = nowSec.value
  if (now === null || !decoded.value) return { kind: 'none', text: '' }

  const ru = locale.value === 'ru'

  if (nbfSec.value !== null && now < nbfSec.value) {
    const rel = relative(nbfSec.value - now)
    return {
      kind: 'pending',
      text: ru ? `Ещё не действителен · начнётся через ${rel}` : `Not yet valid · starts in ${rel}`,
    }
  }
  if (expSec.value !== null) {
    if (now >= expSec.value) {
      const rel = relative(now - expSec.value)
      return { kind: 'expired', text: ru ? `Истёк ${rel} назад` : `Expired ${rel} ago` }
    }
    const rel = relative(expSec.value - now)
    return { kind: 'valid', text: ru ? `Действителен · истекает через ${rel}` : `Valid · expires in ${rel}` }
  }
  return { kind: 'valid', text: ru ? 'Действителен · нет claim exp' : 'Valid · no expiry claim' }
})

function clear() {
  input.value = ''
}

// Real-looking demo token. Payload decodes to {sub, name, admin, iat, nbf, exp}
// with an exp in the past (May 2024) so the badge demonstrates "Expired".
const sample =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwibmJmIjoxNTE2MjM5MDIyLCJleHAiOjE3MTYyMzkwMjJ9.' +
  'KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my token sent to a server?',
    a: 'No. The token is split and base64url-decoded entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so it is safe to inspect access tokens, ID tokens and other sensitive JWTs.',
  },
  {
    q: 'Does this verify the signature?',
    a: 'No. A JWT signature can only be verified with the secret key (HMAC) or the public key (RSA/ECDSA) that signed it, which this tool never asks for. It decodes and displays the parts so you can read the claims, but it does not prove the token is authentic or untampered.',
  },
  {
    q: 'Why is the payload readable without a password?',
    a: 'The header and payload of a JWT are only base64url-encoded, not encrypted. Anyone holding the token can read them, which is why you should never put secrets in a JWT payload — only the signature protects it from being changed, not from being read.',
  },
  {
    q: 'How are iat, nbf and exp interpreted?',
    a: 'These are NumericDate claims: seconds since the Unix epoch (1970-01-01 UTC). The tool converts them to readable UTC dates and compares exp and nbf against your current clock to show whether the token is expired, not yet valid, or currently valid.',
  },
  {
    q: 'What does "Invalid" mean here?',
    a: 'It means the text is not a well-formed JWT — for example it does not have three dot-separated parts, or the header/payload segments are not valid base64url-encoded JSON. It does not say anything about the cryptographic validity of the signature.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой токен на сервер?',
    a: 'Нет. Токен разбивается на части и декодируется из base64url полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому безопасно изучать access-токены, ID-токены и другие конфиденциальные JWT.',
  },
  {
    q: 'Проверяет ли инструмент подпись?',
    a: 'Нет. Подпись JWT можно проверить только секретным ключом (HMAC) или открытым ключом (RSA/ECDSA), которым он был подписан, — а их инструмент никогда не запрашивает. Он декодирует и показывает части, чтобы вы могли прочитать claims, но не подтверждает подлинность токена и отсутствие изменений.',
  },
  {
    q: 'Почему payload читается без пароля?',
    a: 'Заголовок и payload в JWT всего лишь закодированы в base64url, а не зашифрованы. Любой, у кого есть токен, может их прочитать — поэтому никогда не кладите секреты в payload JWT. Подпись защищает токен только от изменения, но не от чтения.',
  },
  {
    q: 'Как интерпретируются iat, nbf и exp?',
    a: 'Это claims типа NumericDate: количество секунд с начала эпохи Unix (1970-01-01 UTC). Инструмент переводит их в читаемые даты UTC и сравнивает exp и nbf с вашими текущими часами, чтобы показать, истёк ли токен, ещё не действителен или действителен сейчас.',
  },
  {
    q: 'Что здесь означает «Некорректный»?',
    a: 'Это значит, что текст не является корректным JWT — например, у него нет трёх частей, разделённых точками, или сегменты заголовка/payload не являются корректным JSON в кодировке base64url. Это ничего не говорит о криптографической корректности подписи.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="jwt-decoder" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label for="jwt-input" class="label !mb-0 mr-1">{{ ui.tokenLabel }}</label>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => input" :label="ui.copyToken" />
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <textarea
        id="jwt-input"
        v-model="input"
        class="textarea-code min-h-[8rem] break-all"
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
      <template v-else-if="decoded">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.decoded }}</span>
        <span v-if="alg" class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">
          alg: {{ alg }}
        </span>
        <span v-if="typ" class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">
          typ: {{ typ }}
        </span>
        <!-- Validity depends on the live clock — keep it strictly client-only. -->
        <ClientOnly>
          <span
            v-if="validity.kind !== 'none'"
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="{
              'bg-green-500/10 text-green-700 dark:text-green-400': validity.kind === 'valid',
              'bg-red-500/10 text-red-700 dark:text-red-400': validity.kind === 'expired',
              'bg-amber-500/10 text-amber-700 dark:text-amber-400': validity.kind === 'pending',
            }"
          >{{ validity.text }}</span>
        </ClientOnly>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Decoded output -->
    <div v-if="decoded" class="mt-5 grid gap-5 md:grid-cols-2">
      <!-- Header -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="label !mb-0">{{ ui.header }}</span>
          <CopyButton :text="() => headerJson" small />
        </div>
        <pre class="overflow-auto rounded-lg border border-ink-200 bg-white p-3 font-mono text-[13px] leading-6 dark:border-ink-700 dark:bg-ink-950">{{ headerJson }}</pre>
      </div>

      <!-- Payload -->
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="label !mb-0">{{ ui.payload }}</span>
          <CopyButton :text="() => payloadJson" small />
        </div>
        <div class="overflow-auto rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
          <JsonTree :data="decoded.payload" />
        </div>
      </div>
    </div>

    <!-- Standard timestamp claims -->
    <div v-if="decoded && timeClaims.length" class="mt-5">
      <span class="label">{{ ui.timestampClaims }}</span>
      <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="(c, i) in timeClaims"
              :key="c.key"
              :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
            >
              <td class="whitespace-nowrap px-3 py-2 font-medium text-ink-700 dark:text-ink-200">{{ c.label }}</td>
              <td class="px-3 py-2 font-mono text-ink-500 dark:text-ink-400">{{ c.seconds }}</td>
              <td class="px-3 py-2 text-ink-600 dark:text-ink-300">{{ c.utc }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signature (never verified) -->
    <div v-if="decoded" class="mt-5">
      <span class="label">{{ ui.signature }}</span>
      <pre class="overflow-auto rounded-lg border border-ink-200 bg-white p-3 font-mono text-[13px] leading-6 break-all dark:border-ink-700 dark:bg-ink-950">{{ decoded.signature }}</pre>
      <p class="mt-2 text-sm text-amber-700 dark:text-amber-400">
        ⚠ {{ ui.signatureWarn1 }} <strong>{{ ui.signatureWarnStrong }}</strong>. {{ ui.signatureWarn2 }}
      </p>
    </div>

    <!-- Long-form content for SEO + users -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Декодирование JSON Web Token прямо в браузере</h2>
        <p>
          Этот бесплатный <strong>декодер JWT</strong> разбивает JSON Web Token на три
          части — заголовок, payload и подпись, — декодирует первые две из base64url и
          показывает claims в виде читаемого JSON. Он также переводит стандартные
          timestamp <code>iat</code>, <code>nbf</code> и <code>exp</code> в даты UTC и
          сообщает, сверяясь с вашими собственными часами, действителен ли токен сейчас,
          истёк или ещё не активен.
        </p>
        <p>
          Всё происходит <strong>локально в вашем браузере</strong>. Токен не отправляется
          на сервер, поэтому безопасно изучать access-токены, ID-токены и refresh-токены,
          содержащие конфиденциальные данные о личности.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте JWT в поле — он декодируется сразу по мере ввода.</li>
          <li>Посмотрите <code>Заголовок</code>, чтобы увидеть алгоритм (<code>alg</code>) и тип (<code>typ</code>).</li>
          <li>Изучите claims в <code>Payload</code> в виде сворачиваемого дерева.</li>
          <li>Проверьте таблицу timestamp с читаемыми датами <code>iat</code>, <code>nbf</code> и <code>exp</code>.</li>
          <li>Используйте <code>Копировать</code> рядом с заголовком или payload, либо нажмите <code>Пример</code>, чтобы попробовать демо-токен.</li>
        </ul>

        <h2>Декодирование — это не проверка</h2>
        <p>
          JWT не зашифрован: заголовок и payload всего лишь закодированы в base64url, поэтому
          любой, у кого есть токен, может их прочитать. Именно подпись защищает токен от
          <em>изменения</em>, и для её проверки нужен секрет HMAC или открытый ключ издателя.
          Этот инструмент намеренно только декодирует: он показывает claims и выявляет
          некорректные токены, но никогда не запрашивает ключ и не утверждает, что токен
          подлинный. Считайте декодированное содержимое недоверенным, пока ваш бэкенд не
          проверит подпись.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Payload — это всего лишь Base64url и JSON, поэтому вам также могут пригодиться
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик/декодировщик Base64</NuxtLink>,
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink> для приведения
          в порядок декодированных claims или <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>,
          когда вы проверяете входные данные HMAC.
        </p>
      </template>

      <template v-else>
        <h2>Decode JSON Web Tokens in your browser</h2>
        <p>
          This free <strong>JWT decoder</strong> splits a JSON Web Token into its three
          parts — header, payload and signature — base64url-decodes the first two, and
          shows you the claims as readable JSON. It also converts the standard
          <code>iat</code>, <code>nbf</code> and <code>exp</code> timestamps into UTC dates
          and tells you, against your own clock, whether the token is currently valid,
          expired, or not yet active.
        </p>
        <p>
          Everything happens <strong>locally in your browser</strong>. Your token is never
          sent to a server, so it is safe to inspect access tokens, ID tokens and refresh
          tokens that carry sensitive identity data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste your JWT into the box — it is decoded instantly as you type.</li>
          <li>Read the <code>Header</code> to see the algorithm (<code>alg</code>) and type (<code>typ</code>).</li>
          <li>Explore the <code>Payload</code> claims in the collapsible tree view.</li>
          <li>Check the timestamp table for human-readable <code>iat</code>, <code>nbf</code> and <code>exp</code> dates.</li>
          <li>Use <code>Copy</code> next to the header or payload, or hit <code>Sample</code> to try a demo token.</li>
        </ul>

        <h2>Decoding is not the same as verifying</h2>
        <p>
          A JWT is not encrypted — the header and payload are merely base64url-encoded, so
          anyone with the token can read them. The signature is what protects a token from
          being <em>altered</em>, and verifying it requires the HMAC secret or the issuer's
          public key. This tool deliberately decodes only: it shows the claims and surfaces
          malformed tokens, but it never asks for a key and never claims a token is authentic.
          Treat the decoded contents as untrusted until your backend has verified the signature.
        </p>

        <h2>Related tools</h2>
        <p>
          The payload is just Base64url and JSON, so you may also like the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          the <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink> for cleaning up the
          decoded claims, or the <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>
          when you are checking HMAC inputs.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
