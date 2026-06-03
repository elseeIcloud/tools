<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Alg = 'HS256' | 'HS384' | 'HS512'

const alg = ref<Alg>('HS256')
const payload = ref('')
const secret = ref('')
const addIat = ref(true)
const addExp = ref(true)

// Tool-specific labels (common verbs like Copy/Clear/Sample/Generate come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        algorithm: 'Алгоритм',
        algorithmAria: 'Алгоритм подписи',
        secret: 'Секрет',
        secretAria: 'Секретный ключ для подписи',
        secretPlaceholder: 'your-256-bit-secret',
        payload: 'Payload (JSON)',
        payloadAria: 'Payload в формате JSON',
        addIat: 'Добавить iat (сейчас)',
        addExp: 'Добавить exp (+1 час)',
        token: 'Токен JWT',
        tokenAria: 'Сгенерированный токен JWT',
        valid: '✓ Подписан',
        invalidJson: '✗ Некорректный JSON в payload',
        noSecret: '✗ Введите секрет',
        signing: 'Подписываем токен…',
        tokenEmpty: 'Подписанный токен появится здесь.',
        placeholder: '{ "sub": "1234567890", "name": "Ада Лавлейс" }',
      }
    : {
        algorithm: 'Algorithm',
        algorithmAria: 'Signing algorithm',
        secret: 'Secret',
        secretAria: 'Secret key for signing',
        secretPlaceholder: 'your-256-bit-secret',
        payload: 'Payload (JSON)',
        payloadAria: 'Payload as JSON',
        addIat: 'Add iat (now)',
        addExp: 'Add exp (+1 hour)',
        token: 'JWT token',
        tokenAria: 'Generated JWT token',
        valid: '✓ Signed',
        invalidJson: '✗ Invalid JSON in payload',
        noSecret: '✗ Enter a secret',
        signing: 'Signing token…',
        tokenEmpty: 'The signed token will appear here.',
        placeholder: '{ "sub": "1234567890", "name": "Ada Lovelace" }',
      },
)

const token = ref('')
const error = ref<'invalidJson' | 'noSecret' | null>(null)

const hashByAlg: Record<Alg, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
}

/** UTF-8 bytes -> standard base64 -> URL-safe base64 without padding. */
function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)))
}

const statusLabel = computed(() => {
  if (error.value === 'invalidJson') return ui.value.invalidJson
  if (error.value === 'noSecret') return ui.value.noSecret
  if (token.value) return ui.value.valid
  return ''
})

const isError = computed(() => error.value !== null)
const hasToken = computed(() => token.value.length > 0)

/**
 * Build and HMAC-sign the token. Uses crypto.subtle (async) and a secret, so it
 * is client-only: guarded by import.meta.client and the output is rendered
 * inside <ClientOnly>. Validation surfaces a red status instead of a token.
 */
async function generate() {
  if (!import.meta.client) return

  if (!secret.value) {
    error.value = 'noSecret'
    token.value = ''
    return
  }

  let claims: Record<string, unknown>
  try {
    const parsed = payload.value.trim() ? JSON.parse(payload.value) : {}
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('payload must be a JSON object')
    }
    claims = { ...(parsed as Record<string, unknown>) }
  } catch {
    error.value = 'invalidJson'
    token.value = ''
    return
  }

  // iat / exp are computed at sign time so the token always reflects "now".
  const now = Math.floor(Date.now() / 1000)
  if (addIat.value) claims.iat = now
  if (addExp.value) claims.exp = now + 3600

  const header = { alg: alg.value, typ: 'JWT' }
  const signingInput = base64urlJson(header) + '.' + base64urlJson(claims)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret.value),
    { name: 'HMAC', hash: hashByAlg[alg.value] },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  const signature = base64url(new Uint8Array(sigBuf))

  error.value = null
  token.value = signingInput + '.' + signature
}

function clear() {
  payload.value = ''
  secret.value = ''
  token.value = ''
  error.value = null
}

const samplePayload = `{
  "sub": "1234567890",
  "name": "Ada Lovelace",
  "admin": true
}`

function loadSample() {
  alg.value = 'HS256'
  payload.value = samplePayload
  secret.value = 'your-256-bit-secret'
  addIat.value = true
  addExp.value = true
  generate()
}

// Re-sign whenever inputs change, but only on the client (crypto.subtle + secret).
onMounted(() => {
  watch([alg, payload, secret, addIat, addExp], generate, { immediate: true })
})

const faqEn: FaqItem[] = [
  {
    q: 'Is my secret or payload sent to a server?',
    a: 'No. The token is built and signed entirely in your browser using the WebCrypto API (crypto.subtle). Your secret, payload and the resulting JWT never leave your device and are not logged or stored, so it is safe for development and testing.',
  },
  {
    q: 'Which signing algorithms are supported?',
    a: 'The generator supports the HMAC family: HS256, HS384 and HS512, signed with the symmetric secret you provide. These use SHA-256, SHA-384 and SHA-512 respectively. Asymmetric algorithms like RS256 or ES256, which require a private key pair, are not built in.',
  },
  {
    q: 'What do the iat and exp claims do?',
    a: 'iat ("issued at") records when the token was created and exp ("expiration") is when it stops being valid, both as Unix epoch seconds. When you enable the checkboxes, iat is set to the current time and exp to one hour later, computed at the moment you generate the token.',
  },
  {
    q: 'Why is the signature URL-safe and unpadded?',
    a: 'JWT uses base64url encoding for all three segments, which replaces + with -, / with _, and strips the trailing = padding. That keeps the token safe to place in URLs, headers and cookies without further escaping, which is why the output looks different from plain base64.',
  },
  {
    q: 'Should I sign production tokens with a tool like this?',
    a: 'Use it for learning, debugging and local testing rather than minting real production credentials, since you would be typing your secret into a web page. For production, sign tokens server-side with a strong, secret key kept out of the browser entirely.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мой секрет или payload на сервер?',
    a: 'Нет. Токен собирается и подписывается полностью в браузере через WebCrypto API (crypto.subtle). Ваш секрет, payload и итоговый JWT не покидают устройство, не логируются и не сохраняются, поэтому инструмент безопасен для разработки и тестирования.',
  },
  {
    q: 'Какие алгоритмы подписи поддерживаются?',
    a: 'Поддерживается семейство HMAC: HS256, HS384 и HS512, подписываемые симметричным секретом, который вы вводите. Они используют SHA-256, SHA-384 и SHA-512 соответственно. Асимметричные алгоритмы вроде RS256 или ES256, требующие пары ключей, здесь не реализованы.',
  },
  {
    q: 'Что делают поля iat и exp?',
    a: 'iat («issued at») фиксирует момент создания токена, а exp («expiration») — момент, когда он перестаёт быть действительным, оба в секундах Unix epoch. Если включить флажки, iat устанавливается на текущее время, а exp — на час позже, и оба вычисляются в момент генерации токена.',
  },
  {
    q: 'Почему подпись URL-safe и без паддинга?',
    a: 'JWT использует кодировку base64url для всех трёх сегментов: + заменяется на -, / на _, а завершающие символы = (паддинг) убираются. Это позволяет безопасно размещать токен в URL, заголовках и cookie без дополнительного экранирования, поэтому результат отличается от обычного base64.',
  },
  {
    q: 'Стоит ли подписывать боевые токены таким инструментом?',
    a: 'Используйте его для обучения, отладки и локального тестирования, а не для выпуска настоящих продакшен-токенов, ведь секрет вводится в веб-страницу. В продакшене подписывайте токены на сервере надёжным секретным ключом, который вообще не попадает в браузер.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="jwt-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="generate">{{ t('common.generate') }}</button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.algorithm }}
        <select v-model="alg" class="field !w-auto !py-1.5" :aria-label="ui.algorithmAria">
          <option value="HS256">HS256</option>
          <option value="HS384">HS384</option>
          <option value="HS512">HS512</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="addIat" type="checkbox" class="accent-accent" />
        {{ ui.addIat }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="addExp" type="checkbox" class="accent-accent" />
        {{ ui.addExp }}
      </label>
    </div>

    <!-- Inputs -->
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <label class="label">{{ ui.payload }}</label>
        <textarea
          v-model="payload"
          class="textarea-code min-h-[14rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
          :aria-label="ui.payloadAria"
        />
      </div>
      <div>
        <label class="label">{{ ui.secret }}</label>
        <input
          v-model="secret"
          type="text"
          class="field font-mono"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.secretPlaceholder"
          :aria-label="ui.secretAria"
        />
        <p class="mt-2 text-xs text-ink-400">
          {{ t('common.options') }}: HMAC + {{ hashByAlg[alg] }}
        </p>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-4 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="isError">
        <span class="font-medium text-red-600 dark:text-red-400">{{ statusLabel }}</span>
      </template>
      <template v-else-if="hasToken">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="text-ink-400">· {{ alg }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Token output: signed via crypto.subtle (client-only) -->
    <div class="mt-2">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.token }}</span>
        <CopyButton :text="() => token" small />
      </div>
      <ClientOnly>
        <textarea
          :value="token"
          readonly
          class="textarea-code min-h-[8rem] bg-ink-50 dark:bg-ink-900"
          spellcheck="false"
          :placeholder="ui.tokenEmpty"
          :aria-label="ui.tokenAria"
        />
        <template #fallback>
          <div class="min-h-[8rem] rounded-lg border border-ink-200 bg-ink-50 px-3 py-6 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-900">
            {{ ui.signing }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Создание и подпись JWT онлайн (HS256/384/512)</h2>
        <p>
          Этот бесплатный <strong>генератор JWT</strong> собирает JSON Web Token из
          вашего payload, добавляет стандартный header <code>{ alg, typ: "JWT" }</code>
          и подписывает результат алгоритмом HMAC — <strong>HS256</strong>,
          <strong>HS384</strong> или <strong>HS512</strong> — вашим секретом.
          Готовый токен сразу появляется в поле результата и копируется в один клик.
        </p>
        <p>
          Подпись считается через браузерный API <strong>WebCrypto</strong>
          (<code>crypto.subtle</code>), поэтому ни секрет, ни payload, ни сам токен
          <strong>никогда не отправляются на сервер</strong>. Это удобно для отладки,
          обучения и локального тестирования авторизации.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Алгоритм</code>: HS256, HS384 или HS512.</li>
          <li>Введите <strong>payload</strong> как корректный JSON-объект (например, с полем <code>sub</code>).</li>
          <li>Укажите <strong>секрет</strong> — тот же ключ понадобится для проверки подписи.</li>
          <li>При желании включите <code>iat</code> (текущее время) и <code>exp</code> (+1 час) — они вычисляются в момент генерации.</li>
          <li>Нажмите <code>Сгенерировать</code> и <code>Копировать</code>, чтобы забрать токен, или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Из чего состоит JWT</h2>
        <p>
          JWT — это три сегмента, разделённые точками:
          <code>base64url(header) . base64url(payload) . base64url(signature)</code>.
          Header описывает алгоритм, payload содержит ваши claims, а подпись — это
          HMAC от строки <code>header.payload</code>, вычисленный с секретом. Все
          сегменты кодируются в <strong>base64url</strong> (символы <code>+/</code>
          заменяются на <code>-_</code>, паддинг <code>=</code> убирается), поэтому
          токен безопасно вставлять в URL и заголовки.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Чтобы разобрать готовый токен на части, откройте
          <NuxtLink :to="localePath('/jwt-decoder')">декодер JWT</NuxtLink>.
          Контрольную сумму поможет посчитать
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>,
          а вручную закодировать данные —
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Build and sign JWTs online (HS256/384/512)</h2>
        <p>
          This free <strong>JWT generator</strong> assembles a JSON Web Token from
          your payload, adds the standard <code>{ alg, typ: "JWT" }</code> header,
          and signs the result with an HMAC algorithm — <strong>HS256</strong>,
          <strong>HS384</strong> or <strong>HS512</strong> — using your secret. The
          finished token appears in the output box and copies with one click.
        </p>
        <p>
          Signing is computed with the browser's <strong>WebCrypto</strong> API
          (<code>crypto.subtle</code>), so your secret, payload and the token itself
          <strong>are never sent to a server</strong>. That makes it handy for
          debugging, learning and testing authentication locally.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Choose an <code>Algorithm</code>: HS256, HS384 or HS512.</li>
          <li>Enter the <strong>payload</strong> as a valid JSON object (for example with a <code>sub</code> claim).</li>
          <li>Provide a <strong>secret</strong> — the same key is needed to verify the signature.</li>
          <li>Optionally enable <code>iat</code> (current time) and <code>exp</code> (+1 hour); both are computed at generation time.</li>
          <li>Click <code>Generate</code> and <code>Copy</code> to grab the token, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>What a JWT is made of</h2>
        <p>
          A JWT is three dot-separated segments:
          <code>base64url(header) . base64url(payload) . base64url(signature)</code>.
          The header names the algorithm, the payload holds your claims, and the
          signature is the HMAC of the <code>header.payload</code> string computed
          with the secret. Every segment is <strong>base64url</strong> encoded
          (<code>+/</code> become <code>-_</code> and the <code>=</code> padding is
          stripped), which keeps the token safe to drop into URLs and headers.
        </p>

        <h2>Related tools</h2>
        <p>
          To pull a finished token apart, open the
          <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>.
          Compute a checksum with the
          <NuxtLink :to="localePath('/hash-generator')">Hash generator</NuxtLink>,
          or encode data by hand with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
