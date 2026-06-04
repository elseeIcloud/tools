<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Algo = 'SHA-256' | 'SHA-1' | 'SHA-384' | 'SHA-512'
type Format = 'hex' | 'base64'

const message = ref('')
const secret = ref('')
const algorithm = ref<Algo>('SHA-256')
const format = ref<Format>('hex')

// Result is populated only after an async compute, so it starts empty and is
// wrapped in <ClientOnly> in the template to stay SSG-safe.
const result = ref('')
const errorKey = ref('')
const computing = ref(false)

const algorithms: Algo[] = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512']

/* ------------------------------------------------------------------ *
 * ArrayBuffer -> hex / Base64. Pure helpers; never touch crypto.
 * ------------------------------------------------------------------ */
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  // btoa is only reached inside the async compute(), never during prerender.
  return btoa(binary)
}

/* ------------------------------------------------------------------ *
 * HMAC via WebCrypto. crypto.subtle (importKey + sign) and the
 * TextEncoder are only touched inside this async function, which runs
 * from a debounced watcher after hydration — never during setup or in
 * a computed over the empty initial state.
 * ------------------------------------------------------------------ */
let timer: ReturnType<typeof setTimeout> | undefined
let token = 0

async function compute() {
  const msg = message.value
  const key = secret.value
  errorKey.value = ''
  if (!msg || !key) {
    result.value = ''
    computing.value = false
    return
  }
  const my = ++token
  computing.value = true
  try {
    const enc = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: algorithm.value },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg))
    // Drop stale results if inputs changed while awaiting.
    if (my !== token) return
    result.value = format.value === 'hex' ? toHex(sig) : toBase64(sig)
  } catch {
    if (my !== token) return
    result.value = ''
    errorKey.value = 'failed'
  } finally {
    if (my === token) computing.value = false
  }
}

function schedule() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(compute, 120)
}

watch([message, secret, algorithm, format], schedule)
onBeforeUnmount(() => timer && clearTimeout(timer))

const sample = {
  message: 'The quick brown fox jumps over the lazy dog',
  secret: 's3cr3t-signing-key',
}
function loadSample() {
  message.value = sample.message
  secret.value = sample.secret
}
function clear() {
  message.value = ''
  secret.value = ''
  result.value = ''
  errorKey.value = ''
}

// Tool-specific labels (common verbs like Clear/Sample/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        messageLabel: 'Сообщение',
        messagePlaceholder: 'Введите или вставьте текст, который нужно подписать…',
        secretLabel: 'Секретный ключ',
        secretPlaceholder: 'Ваш общий секретный ключ',
        algorithmLabel: 'Хеш-алгоритм',
        formatLabel: 'Формат вывода',
        resultLabel: 'HMAC',
        startHint: 'Введите сообщение и секретный ключ — HMAC посчитается автоматически.',
        computing: 'Вычисление…',
        error: 'Не удалось вычислить HMAC. Проверьте ввод и попробуйте снова.',
        copyLabel: 'Скопировать HMAC',
        hex: 'Hex',
        base64: 'Base64',
      }
    : {
        messageLabel: 'Message',
        messagePlaceholder: 'Type or paste the text you want to sign…',
        secretLabel: 'Secret key',
        secretPlaceholder: 'Your shared secret key',
        algorithmLabel: 'Hash algorithm',
        formatLabel: 'Output format',
        resultLabel: 'HMAC',
        startHint: 'Enter a message and a secret key — the HMAC is computed automatically.',
        computing: 'Computing…',
        error: 'Could not compute the HMAC. Check your input and try again.',
        copyLabel: 'Copy HMAC',
        hex: 'Hex',
        base64: 'Base64',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my message or secret key sent to a server?',
    a: 'No. The HMAC is computed entirely in your browser using the built-in WebCrypto API. Your message and your secret key never leave the page — nothing is uploaded, logged, or stored — so it is safe to sign sensitive payloads with real signing keys.',
  },
  {
    q: 'What is HMAC and how is it different from a plain hash?',
    a: 'HMAC (Hash-based Message Authentication Code) combines a message with a secret key to produce an authentication tag. Unlike a plain SHA hash, anyone without the key cannot forge or recompute the tag, which is why HMAC is used to verify both the integrity and the authenticity of a message.',
  },
  {
    q: 'Which hash algorithm should I choose?',
    a: 'SHA-256 is the sensible default and is what most APIs and webhook signatures use. SHA-384 and SHA-512 produce longer tags for higher security margins, while SHA-1 is only here for compatibility with older systems and should not be chosen for new designs.',
  },
  {
    q: 'When do I use hex versus Base64 output?',
    a: 'It depends on what the verifying side expects. Many webhook providers (for example GitHub or Stripe) send hex-encoded HMAC signatures, while some systems use Base64. Pick the format your integration documents — the underlying signature is identical, only the text encoding differs.',
  },
  {
    q: 'Does this match HMAC from OpenSSL, Node, or Python?',
    a: 'Yes, for the same message, key, and algorithm. The output equals what you get from openssl dgst -hmac, Node’s crypto.createHmac, or Python’s hmac module, because the key and message are both encoded as UTF-8 bytes before signing — the standard behaviour.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли моё сообщение и секретный ключ на сервер?',
    a: 'Нет. HMAC вычисляется полностью в вашем браузере через встроенный WebCrypto API. Сообщение и секретный ключ никогда не покидают страницу — ничего не загружается, не логируется и не сохраняется, поэтому можно безопасно подписывать конфиденциальные данные настоящими ключами.',
  },
  {
    q: 'Что такое HMAC и чем он отличается от обычного хеша?',
    a: 'HMAC (Hash-based Message Authentication Code) объединяет сообщение с секретным ключом и формирует код аутентификации. В отличие от обычного SHA-хеша, без ключа невозможно подделать или пересчитать этот код, поэтому HMAC используют для проверки одновременно целостности и подлинности сообщения.',
  },
  {
    q: 'Какой хеш-алгоритм выбрать?',
    a: 'SHA-256 — разумный выбор по умолчанию, именно его применяют большинство API и подписи вебхуков. SHA-384 и SHA-512 дают более длинные коды с большим запасом прочности, а SHA-1 оставлен только для совместимости со старыми системами и не подходит для новых решений.',
  },
  {
    q: 'Когда использовать hex, а когда Base64?',
    a: 'Это зависит от того, что ожидает проверяющая сторона. Многие сервисы вебхуков (например, GitHub или Stripe) присылают подписи HMAC в hex, а часть систем использует Base64. Выберите формат из документации вашей интеграции — сама подпись одинакова, отличается лишь текстовое представление.',
  },
  {
    q: 'Совпадает ли результат с HMAC из OpenSSL, Node или Python?',
    a: 'Да, при одинаковых сообщении, ключе и алгоритме. Вывод совпадает с тем, что выдают openssl dgst -hmac, crypto.createHmac в Node или модуль hmac в Python, потому что и ключ, и сообщение кодируются в байты UTF-8 перед подписью — это стандартное поведение.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="hmac-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Message -->
    <div class="mt-3">
      <label for="hmac-message" class="label">{{ ui.messageLabel }}</label>
      <textarea
        id="hmac-message"
        v-model="message"
        class="textarea-code min-h-[8rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.messagePlaceholder"
      />
    </div>

    <!-- Secret key + options -->
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <label for="hmac-secret" class="label">{{ ui.secretLabel }}</label>
        <input
          id="hmac-secret"
          v-model="secret"
          type="text"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.secretPlaceholder"
        />
      </div>
      <div>
        <label for="hmac-algo" class="label">{{ ui.algorithmLabel }}</label>
        <select id="hmac-algo" v-model="algorithm" class="field">
          <option v-for="algo in algorithms" :key="algo" :value="algo">{{ algo }}</option>
        </select>
      </div>
    </div>

    <!-- Output format toggle -->
    <div class="mt-4">
      <span class="label">{{ ui.formatLabel }}</span>
      <div class="flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
        <label class="flex items-center gap-2">
          <input v-model="format" type="radio" value="hex" class="h-4 w-4 accent-accent" />
          {{ ui.hex }}
        </label>
        <label class="flex items-center gap-2">
          <input v-model="format" type="radio" value="base64" class="h-4 w-4 accent-accent" />
          {{ ui.base64 }}
        </label>
      </div>
    </div>

    <!-- Result -->
    <div class="mt-5">
      <div class="flex items-center justify-between gap-3">
        <label for="hmac-result" class="label mb-0">{{ ui.resultLabel }} · {{ algorithm }}</label>
        <ClientOnly>
          <CopyButton v-if="result" :text="() => result" :label="ui.copyLabel" small />
        </ClientOnly>
      </div>
      <ClientOnly>
        <textarea
          v-if="result"
          id="hmac-result"
          :value="result"
          readonly
          class="textarea-code mt-2 min-h-[5rem] break-all"
          spellcheck="false"
        />
        <p v-else-if="errorKey" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ ui.error }}</p>
        <p v-else class="mt-2 font-mono text-sm text-ink-400">
          {{ (message && secret && computing) ? ui.computing : ui.startHint }}
        </p>
        <template #fallback>
          <p class="mt-2 font-mono text-sm text-ink-400">{{ ui.startHint }}</p>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Онлайн-генератор HMAC (SHA-256, SHA-1, SHA-384, SHA-512)</h2>
        <p>
          Этот бесплатный <strong>генератор HMAC</strong> вычисляет код
          аутентификации сообщения по вашему тексту и секретному ключу.
          HMAC применяется для подписи и проверки вебхуков, API-запросов,
          токенов и любых данных, где важно убедиться, что сообщение не
          изменили и что оно пришло от владельца ключа. Поддерживаются
          алгоритмы SHA-256, SHA-1, SHA-384 и SHA-512, а вывод можно получить
          в формате hex или Base64.
        </p>
        <p>
          Всё считается <strong>полностью в браузере</strong> через встроенный
          движок WebCrypto. Ни сообщение, ни секретный ключ не отправляются на
          сервер, поэтому можно безопасно подписывать конфиденциальные данные
          настоящими ключами.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите или вставьте сообщение в верхнее поле.</li>
          <li>Укажите общий секретный ключ — он используется для подписи.</li>
          <li>Выберите хеш-алгоритм: <code>SHA-256</code> подходит для большинства задач.</li>
          <li>Переключите формат вывода между <code>Hex</code> и <code>Base64</code> под требования вашей системы.</li>
          <li>HMAC пересчитывается автоматически; нажмите <code>Копировать</code>, чтобы скопировать результат.</li>
          <li>Кнопка <code>Пример</code> подставит образец, а <code>Очистить</code> сбросит поля.</li>
        </ul>

        <h2>HMAC, проверка подписи и безопасность</h2>
        <p>
          В отличие от обычного хеша, HMAC нельзя пересчитать без секретного
          ключа, поэтому он подтверждает и целостность, и подлинность сообщения.
          Многие сервисы (GitHub, Stripe и другие) подписывают вебхуки именно
          через HMAC-SHA256: получатель пересчитывает HMAC по телу запроса и
          сравнивает его с переданной подписью. Сравнивайте подписи с защитой от
          атак по времени и держите ключ в секрете — именно он, а не алгоритм,
          обеспечивает безопасность.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен обычный хеш без ключа? Откройте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>.
          Работаете с подписанными токенами — проверьте их в
          <NuxtLink :to="localePath('/jwt-verifier')">верификаторе JWT</NuxtLink>
          или создайте новый в
          <NuxtLink :to="localePath('/jwt-generator')">генераторе JWT</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online HMAC generator (SHA-256, SHA-1, SHA-384, SHA-512)</h2>
        <p>
          This free <strong>HMAC generator</strong> computes a message
          authentication code from your text and a secret key. HMAC is used to
          sign and verify webhooks, API requests, tokens, and any data where you
          need to confirm a message was not tampered with and really came from
          the key holder. It supports the SHA-256, SHA-1, SHA-384, and SHA-512
          algorithms, with output as hex or Base64.
        </p>
        <p>
          Everything is computed <strong>entirely in your browser</strong> using
          the native WebCrypto engine. Neither your message nor your secret key
          is sent to a server, so it is safe to sign sensitive data with real
          signing keys.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type or paste your message into the top box.</li>
          <li>Enter the shared secret key used to sign it.</li>
          <li>Pick a hash algorithm — <code>SHA-256</code> suits most use cases.</li>
          <li>Switch the output between <code>Hex</code> and <code>Base64</code> to match your system.</li>
          <li>The HMAC recomputes automatically; press <code>Copy</code> to grab the result.</li>
          <li>Use <code>Sample</code> to load example values or <code>Clear</code> to reset the fields.</li>
        </ul>

        <h2>HMAC, signature verification, and security</h2>
        <p>
          Unlike a plain hash, an HMAC cannot be recomputed without the secret
          key, so it proves both the integrity and the authenticity of a message.
          Many services (GitHub, Stripe, and others) sign their webhooks with
          HMAC-SHA256: the receiver recomputes the HMAC over the request body and
          compares it to the signature that was sent. Always compare signatures
          with a constant-time check and keep the key secret — it is the key, not
          the algorithm, that provides the security.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a plain, keyless hash? Open the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
          Working with signed tokens? Validate them in the
          <NuxtLink :to="localePath('/jwt-verifier')">JWT verifier</NuxtLink>
          or mint a new one with the
          <NuxtLink :to="localePath('/jwt-generator')">JWT generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
