<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const secret = ref('')

// Live "now" in seconds. Stays null during SSR/prerender and is only
// populated in the browser, so the expiry badge never causes a hydration
// mismatch (it lives inside <ClientOnly>).
const nowSec = ref<number | null>(null)
onMounted(() => {
  nowSec.value = Math.floor(Date.now() / 1000)
  const id = setInterval(() => (nowSec.value = Math.floor(Date.now() / 1000)), 1000)
  onBeforeUnmount(() => clearInterval(id))
})

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        tokenLabel: 'JSON Web Token',
        secretLabel: 'Секрет (HMAC)',
        secretPlaceholder: 'ваш-секрет-подписи',
        secretAria: 'Секрет для проверки HMAC-подписи',
        copyToken: 'Копировать токен',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        inputAria: 'Поле ввода JSON Web Token',
        invalid: '✗ Некорректный токен',
        decoded: '✓ Декодирован',
        startHint: 'Вставьте JWT и секрет, чтобы декодировать claims и проверить HMAC-подпись.',
        header: 'Заголовок',
        payload: 'Payload',
        timestampClaims: 'Стандартные временные claims',
        signature: 'Подпись',
        verifying: 'Проверка подписи…',
        valid: '✓ Подпись верна',
        invalidSig: '✗ Подпись неверна',
        needSecret: 'Введите секрет, чтобы проверить подпись',
        unsupported: 'Алгоритм не поддерживается',
        unsupportedNote:
          'Этот инструмент проверяет только HMAC-алгоритмы (HS256, HS384, HS512). Токены RS256/RS384/RS512 (RSA) и ES256/ES384/ES512 (ECDSA) подписаны асимметричным ключом, и для их проверки нужен открытый ключ издателя, а не общий секрет.',
        iat: 'Выпущен (iat)',
        nbf: 'Действителен с (nbf)',
        exp: 'Истекает (exp)',
      }
    : {
        tokenLabel: 'JSON Web Token',
        secretLabel: 'Secret (HMAC)',
        secretPlaceholder: 'your-signing-secret',
        secretAria: 'Secret for verifying the HMAC signature',
        copyToken: 'Copy token',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature',
        inputAria: 'JSON Web Token input',
        invalid: '✗ Invalid token',
        decoded: '✓ Decoded',
        startHint: 'Paste a JWT and a secret to decode the claims and verify the HMAC signature.',
        header: 'Header',
        payload: 'Payload',
        timestampClaims: 'Registered timestamp claims',
        signature: 'Signature',
        verifying: 'Verifying signature…',
        valid: '✓ Signature valid',
        invalidSig: '✗ Signature invalid',
        needSecret: 'Enter a secret to verify the signature',
        unsupported: 'Algorithm not supported',
        unsupportedNote:
          'This tool only verifies HMAC algorithms (HS256, HS384, HS512). RS256/RS384/RS512 (RSA) and ES256/ES384/ES512 (ECDSA) tokens are signed with an asymmetric key and need the issuer’s public key to verify, not a shared secret.',
        iat: 'Issued at (iat)',
        nbf: 'Not before (nbf)',
        exp: 'Expires (exp)',
      },
)

// --- base64url helpers (atob/TextDecoder/TextEncoder all exist in Node) ------
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
  signingInput: string
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

// Single computed that parses the whole token. Pure (no clock/crypto/random),
// so it is safe to evaluate during setup/prerender and renders server-side.
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
      signingInput: parts[0] + '.' + parts[1],
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

// Map a JWT HMAC alg to the WebCrypto hash name. null = not an HS* algorithm.
const HS_HASH: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}
const hmacHash = computed(() => (alg.value ? (HS_HASH[alg.value] ?? null) : null))

// --- Signature verdict --------------------------------------------------------
// crypto.subtle is async and the secret is sensitive, so verification is
// strictly client-only: the ref starts null, is produced inside a watcher
// guarded by import.meta.client, and the badge is rendered inside <ClientOnly>.
type Verdict =
  | { kind: 'none' }
  | { kind: 'need-secret' }
  | { kind: 'unsupported' }
  | { kind: 'verifying' }
  | { kind: 'valid' }
  | { kind: 'invalid' }

const verdict = ref<Verdict>({ kind: 'none' })

async function verify() {
  const data = decoded.value
  if (!data) {
    verdict.value = { kind: 'none' }
    return
  }
  if (hmacHash.value === null) {
    verdict.value = { kind: 'unsupported' }
    return
  }
  if (!secret.value) {
    verdict.value = { kind: 'need-secret' }
    return
  }

  verdict.value = { kind: 'verifying' }
  const hash = hmacHash.value
  const sec = secret.value
  const signingInput = data.signingInput
  const sigBytes = data.signature
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(sec),
      { name: 'HMAC', hash },
      false,
      ['verify'],
    )
    const ok = await crypto.subtle.verify('HMAC', key, base64UrlToBytes(sigBytes), enc.encode(signingInput))
    // Ignore a result that arrived after the inputs changed under us.
    if (
      decoded.value?.signingInput !== signingInput ||
      secret.value !== sec ||
      decoded.value?.signature !== sigBytes
    ) {
      return
    }
    verdict.value = { kind: ok ? 'valid' : 'invalid' }
  } catch {
    // Malformed base64url signature, etc. — treat as an invalid signature.
    verdict.value = { kind: 'invalid' }
  }
}

// Re-verify whenever the token, secret or algorithm changes — client only.
watch(
  [() => decoded.value?.signingInput, () => decoded.value?.signature, secret, hmacHash],
  () => {
    if (import.meta.client) verify()
  },
  { immediate: true },
)

// --- Human-readable standard timestamp claims (pure: just formatting) --------
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
  const keys: TimeClaim['key'][] = ['iat', 'nbf', 'exp']
  const out: TimeClaim[] = []
  for (const key of keys) {
    const sec = asEpochSeconds(decoded.value.payload[key])
    if (sec !== null) out.push({ key, label: ui.value[key], seconds: sec, utc: toUtc(sec) })
  }
  return out
})

const expSec = computed(() => (decoded.value ? asEpochSeconds(decoded.value.payload.exp) : null))
const nbfSec = computed(() => (decoded.value ? asEpochSeconds(decoded.value.payload.nbf) : null))

// Short, human relative duration like "2 days" / "3 hours" (locale-aware).
function relative(absSeconds: number): string {
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  let value = absSeconds
  let idx = 0
  for (let i = 0; i < units.length; i++) {
    if (value < units[i]![0]) {
      idx = i
      break
    }
    value = value / units[i]![0]
    idx = i
  }
  const rounded = Math.floor(value)

  if (locale.value === 'ru') {
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

// Expiry/validity badge — depends on the CURRENT time, so it is ONLY ever read
// inside <ClientOnly>, and nowSec is null until onMounted.
const expiry = computed<{ kind: 'valid' | 'expired' | 'pending' | 'none'; text: string }>(() => {
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
    return { kind: 'valid', text: ru ? `Не истёк · истекает через ${rel}` : `Not expired · expires in ${rel}` }
  }
  return { kind: 'valid', text: ru ? 'Нет claim exp' : 'No expiry claim' }
})

function clear() {
  input.value = ''
  secret.value = ''
}

// Real HS256 token signed with the secret "secret". Payload decodes to
// {sub, name, admin, iat, nbf, exp} with exp = 2030-01-01 (future), so it
// verifies as valid and the expiry badge reads "Not expired".
const sampleToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTcwMDAwMDAwMCwibmJmIjoxNzAwMDAwMDAwLCJleHAiOjE4OTM0NTYwMDB9.' +
  'LM0wkj7uWliO-rwj99tMhkwmmGJUWddkPSX3u1ldVug'

function loadSample() {
  input.value = sampleToken
  secret.value = 'secret'
}

const faqEn: FaqItem[] = [
  {
    q: 'Does my token or secret leave my browser?',
    a: 'No. The token is split and base64url-decoded, and the HMAC signature is verified with the Web Crypto API (crypto.subtle), entirely in your browser. Neither the token nor the secret is uploaded, logged or stored, so it is safe to test production secrets.',
  },
  {
    q: 'Which algorithms can this verify?',
    a: 'Only HMAC algorithms read from the header: HS256, HS384 and HS512, mapped to SHA-256, SHA-384 and SHA-512. Asymmetric tokens such as RS256 or ES256 are signed with a private key and can only be verified with the issuer’s public key, so the tool shows an "Algorithm not supported" note instead of a verdict.',
  },
  {
    q: 'What exactly does "Signature valid" prove?',
    a: 'It proves that the bytes "header.payload" were signed with the same secret you entered, so the token has not been tampered with by anyone who does not know that secret. It does not by itself check expiry — read the exp/nbf badge separately to confirm the token is currently usable.',
  },
  {
    q: 'A token is "valid" but the expiry badge says expired — is that a contradiction?',
    a: 'No. Signature validity and expiry are independent. A token can carry a genuine, correctly-signed signature while its exp claim is already in the past. A real backend would accept the signature but still reject the request because the token has expired.',
  },
  {
    q: 'How are iat, nbf and exp interpreted?',
    a: 'They are NumericDate claims: seconds since the Unix epoch (1970-01-01 UTC). The tool converts them to readable UTC dates and compares exp and nbf against your current clock to show whether the token is expired, not yet valid, or currently within its window.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Покидают ли мой токен или секрет браузер?',
    a: 'Нет. Токен разбивается и декодируется из base64url, а HMAC-подпись проверяется через Web Crypto API (crypto.subtle) полностью в браузере. Ни токен, ни секрет не загружаются, не логируются и не сохраняются, поэтому безопасно проверять боевые секреты.',
  },
  {
    q: 'Какие алгоритмы можно проверить?',
    a: 'Только HMAC-алгоритмы из заголовка: HS256, HS384 и HS512, отображаемые на SHA-256, SHA-384 и SHA-512. Асимметричные токены вроде RS256 или ES256 подписаны приватным ключом, и проверить их можно только открытым ключом издателя, поэтому вместо вердикта инструмент показывает примечание «Алгоритм не поддерживается».',
  },
  {
    q: 'Что именно доказывает «Подпись верна»?',
    a: 'Это доказывает, что байты «header.payload» были подписаны тем же секретом, который вы ввели, то есть токен не был изменён тем, кто этого секрета не знает. Само по себе это не проверяет срок действия — смотрите отдельный бейдж exp/nbf, чтобы убедиться, что токен сейчас пригоден.',
  },
  {
    q: 'Подпись «верна», но бейдж срока говорит «истёк» — это противоречие?',
    a: 'Нет. Корректность подписи и срок действия независимы. У токена может быть настоящая, правильно вычисленная подпись, при этом claim exp уже в прошлом. Реальный бэкенд принял бы подпись, но всё равно отклонил бы запрос, потому что токен просрочен.',
  },
  {
    q: 'Как интерпретируются iat, nbf и exp?',
    a: 'Это claims типа NumericDate: количество секунд с начала эпохи Unix (1970-01-01 UTC). Инструмент переводит их в читаемые даты UTC и сравнивает exp и nbf с вашими текущими часами, чтобы показать, истёк ли токен, ещё не действителен или сейчас в пределах срока.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="jwt-verifier" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label for="jwt-input" class="label !mb-0 mr-1">{{ ui.tokenLabel }}</label>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => input" :label="ui.copyToken" />
      </div>
    </div>

    <!-- Token input -->
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

    <!-- Secret input -->
    <div class="mt-3">
      <label for="jwt-secret" class="label">{{ ui.secretLabel }}</label>
      <input
        id="jwt-secret"
        v-model="secret"
        type="text"
        class="field font-mono"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.secretPlaceholder"
        :aria-label="ui.secretAria"
      >
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
        <!-- Expiry depends on the live clock — keep it strictly client-only. -->
        <ClientOnly>
          <span
            v-if="expiry.kind !== 'none'"
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="{
              'bg-green-500/10 text-green-700 dark:text-green-400': expiry.kind === 'valid',
              'bg-red-500/10 text-red-700 dark:text-red-400': expiry.kind === 'expired',
              'bg-amber-500/10 text-amber-700 dark:text-amber-400': expiry.kind === 'pending',
            }"
          >{{ expiry.text }}</span>
        </ClientOnly>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Signature verdict — async (crypto.subtle) + secret, so client-only. -->
    <ClientOnly>
      <div v-if="decoded" class="mt-4">
        <div
          v-if="verdict.kind === 'valid'"
          class="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-700 dark:text-green-400"
          role="status"
        >{{ ui.valid }}</div>
        <div
          v-else-if="verdict.kind === 'invalid'"
          class="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-400"
          role="status"
        >{{ ui.invalidSig }}</div>
        <div
          v-else-if="verdict.kind === 'unsupported'"
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          role="status"
        >
          <span class="font-semibold">⚠ {{ ui.unsupported }}<template v-if="alg"> ({{ alg }})</template>.</span>
          {{ ui.unsupportedNote }}
        </div>
        <div
          v-else-if="verdict.kind === 'need-secret'"
          class="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
        >{{ ui.needSecret }}</div>
        <div
          v-else-if="verdict.kind === 'verifying'"
          class="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
        >{{ ui.verifying }}</div>
      </div>
    </ClientOnly>

    <!-- Decoded output (pure — renders server-side) -->
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

    <!-- Signature bytes -->
    <div v-if="decoded" class="mt-5">
      <span class="label">{{ ui.signature }}</span>
      <pre class="overflow-auto rounded-lg border border-ink-200 bg-white p-3 font-mono text-[13px] leading-6 break-all dark:border-ink-700 dark:bg-ink-950">{{ decoded.signature }}</pre>
    </div>

    <!-- Long-form content for SEO + users -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Проверка подписи JSON Web Token прямо в браузере</h2>
        <p>
          Этот бесплатный <strong>инструмент проверки JWT</strong> декодирует JSON Web Token,
          показывает заголовок и payload в виде читаемого JSON и подтверждает, что HMAC-подпись
          действительно вычислена вашим секретом. Он считывает <code>alg</code> из заголовка
          (<code>HS256</code>, <code>HS384</code> или <code>HS512</code>), пересчитывает подпись
          над строкой <code>header.payload</code> через <code>crypto.subtle</code> и выводит
          понятный вердикт: <strong>✓ Подпись верна</strong> или <strong>✗ Подпись неверна</strong>.
        </p>
        <p>
          Всё происходит <strong>локально в вашем браузере</strong>. Ни токен, ни секрет не
          отправляются на сервер, поэтому безопасно проверять даже боевые ключи подписи и
          конфиденциальные access-токены.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте JWT в верхнее поле — заголовок и payload декодируются сразу.</li>
          <li>Введите общий <code>секрет</code> HMAC, которым подписан токен.</li>
          <li>Посмотрите вердикт: <code>Подпись верна</code> или <code>Подпись неверна</code>.</li>
          <li>Проверьте таблицу timestamp и бейдж срока действия (<code>exp</code>, <code>nbf</code>).</li>
          <li>Нажмите <code>Пример</code>, чтобы загрузить токен вместе с его секретом, или <code>Очистить</code>.</li>
        </ul>

        <h2>Что значит «подпись верна»</h2>
        <p>
          Корректная подпись доказывает, что байты <code>header.payload</code> были подписаны тем же
          секретом, что вы ввели, — то есть токен не подделали. Это <em>не</em> то же самое, что
          срок действия: токен с настоящей подписью может быть уже просрочен. Поэтому вердикт по
          подписи и бейдж <code>exp</code>/<code>nbf</code> показаны раздельно — реальный бэкенд
          проверяет и то, и другое.
        </p>

        <h2>Только HMAC, не RSA и не ECDSA</h2>
        <p>
          Этот инструмент проверяет лишь симметричные <code>HS*</code>-алгоритмы, где подпись и
          проверка используют один общий секрет. Токены <code>RS256</code>/<code>RS384</code>/<code>RS512</code>
          (RSA) и <code>ES256</code>/<code>ES384</code>/<code>ES512</code> (ECDSA) подписаны приватным
          ключом, и проверить их можно только открытым ключом издателя, а не секретом, — для таких
          токенов выводится примечание вместо вердикта.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно лишь прочитать claims без секрета? Используйте
          <NuxtLink :to="localePath('/jwt-decoder')">декодер JWT</NuxtLink>. Чтобы собрать и подписать
          новый токен, откройте <NuxtLink :to="localePath('/jwt-generator')">генератор JWT</NuxtLink>,
          а проверить входные данные HMAC помогает
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Verify JSON Web Token signatures in your browser</h2>
        <p>
          This free <strong>JWT verifier</strong> decodes a JSON Web Token, shows the header and
          payload as readable JSON, and confirms whether the HMAC signature was really produced
          with your secret. It reads <code>alg</code> from the header
          (<code>HS256</code>, <code>HS384</code> or <code>HS512</code>), recomputes the signature
          over the <code>header.payload</code> string with <code>crypto.subtle</code>, and gives a
          clear verdict: <strong>✓ Signature valid</strong> or <strong>✗ Signature invalid</strong>.
        </p>
        <p>
          Everything happens <strong>locally in your browser</strong>. Neither the token nor the
          secret is sent to a server, so it is safe to check production signing keys and sensitive
          access tokens.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste your JWT into the top box — the header and payload decode instantly.</li>
          <li>Enter the shared HMAC <code>secret</code> the token was signed with.</li>
          <li>Read the verdict: <code>Signature valid</code> or <code>Signature invalid</code>.</li>
          <li>Check the timestamp table and the expiry badge (<code>exp</code>, <code>nbf</code>).</li>
          <li>Hit <code>Sample</code> to load a token together with its secret, or <code>Clear</code>.</li>
        </ul>

        <h2>What "signature valid" means</h2>
        <p>
          A valid signature proves the <code>header.payload</code> bytes were signed with the same
          secret you entered — so the token has not been forged. That is <em>not</em> the same as
          expiry: a token with a genuine signature can still be past its <code>exp</code>. That is
          why the signature verdict and the <code>exp</code>/<code>nbf</code> badge are shown
          separately — a real backend checks both.
        </p>

        <h2>HMAC only, not RSA or ECDSA</h2>
        <p>
          This tool verifies only symmetric <code>HS*</code> algorithms, where signing and
          verifying share one secret. <code>RS256</code>/<code>RS384</code>/<code>RS512</code> (RSA)
          and <code>ES256</code>/<code>ES384</code>/<code>ES512</code> (ECDSA) tokens are signed with
          a private key and can only be verified with the issuer's public key, not a secret — for
          those, a note is shown instead of a pass/fail verdict.
        </p>

        <h2>Related tools</h2>
        <p>
          Just need to read the claims without a secret? Use the
          <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>. To build and sign a new
          token, open the <NuxtLink :to="localePath('/jwt-generator')">JWT generator</NuxtLink>, and
          to double-check HMAC inputs reach for the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
