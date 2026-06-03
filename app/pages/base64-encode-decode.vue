<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'encode' | 'decode'>('encode')
const urlSafe = ref(false)
const input = ref('')

// Tool-specific labels (common verbs like Encode/Decode/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        conversionMode: 'Режим конвертации',
        urlSafe: 'URL-safe',
        inputEncode: 'Текст для кодирования',
        inputDecode: 'Base64 для декодирования',
        outputEncode: 'Результат Base64',
        outputDecode: 'Декодированный текст',
        cannotDecode: '✗ Не удаётся декодировать',
        invalidBase64: 'Некорректная строка Base64 —',
        encoded: 'Закодировано',
        decoded: 'Декодировано',
        charactersOut: 'символов на выходе',
        hintEncode: 'Введите или вставьте текст, чтобы мгновенно закодировать его в Base64.',
        hintDecode: 'Вставьте строку Base64, чтобы мгновенно её декодировать.',
        placeholderInDecode: 'SGVsbG8=',
        placeholderOutEncode: 'Здесь появится результат Base64…',
        placeholderOutDecode: 'Здесь появится декодированный текст…',
      }
    : {
        conversionMode: 'Conversion mode',
        urlSafe: 'URL-safe',
        inputEncode: 'Text to encode',
        inputDecode: 'Base64 to decode',
        outputEncode: 'Base64 output',
        outputDecode: 'Decoded text',
        cannotDecode: '✗ Cannot decode',
        invalidBase64: 'Invalid Base64 —',
        encoded: 'Encoded',
        decoded: 'Decoded',
        charactersOut: 'characters out',
        hintEncode: 'Type or paste text to encode it to Base64 instantly.',
        hintDecode: 'Paste a Base64 string to decode it instantly.',
        placeholderInDecode: 'SGVsbG8=',
        placeholderOutEncode: 'Base64 output appears here…',
        placeholderOutDecode: 'Decoded text appears here…',
      },
)

// --- Base64 helpers (UTF-8 safe, no naive btoa/atob on Unicode) ---

function bytesToBase64(bytes: Uint8Array): string {
  // Build a binary string in chunks to avoid blowing the call stack on big inputs.
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromUrlSafe(b64: string): string {
  // Accept both alphabets; restore standard chars and re-pad.
  let s = b64.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '')
  const pad = s.length % 4
  if (pad === 2) s += '=='
  else if (pad === 3) s += '='
  else if (pad === 1) throw new Error('length is not a valid Base64 string')
  return s
}

function encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const b64 = bytesToBase64(bytes)
  return urlSafe.value ? toUrlSafe(b64) : b64
}

function decode(text: string): string {
  const cleaned = fromUrlSafe(text)
  // After normalisation only the standard Base64 alphabet (+ padding) is valid.
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error('contains characters that are not valid Base64')
  }
  const bytes = base64ToBytes(cleaned)
  // fatal:true makes TextDecoder throw on malformed UTF-8 instead of inserting U+FFFD.
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// --- Live conversion (safe in setup: btoa/atob/TextEncoder/TextDecoder exist in Node) ---

const result = computed<{ ok: true; value: string } | { ok: false; error: string }>(() => {
  if (!input.value) return { ok: true, value: '' }
  try {
    return { ok: true, value: mode.value === 'encode' ? encode(input.value) : decode(input.value) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
})

const output = computed(() => (result.value.ok ? result.value.value : ''))
const error = computed(() => (result.value.ok ? null : result.value.error))
const hasInput = computed(() => input.value.length > 0)
const inputLabel = computed(() => (mode.value === 'encode' ? ui.value.inputEncode : ui.value.inputDecode))
const outputLabel = computed(() => (mode.value === 'encode' ? ui.value.outputEncode : ui.value.outputDecode))

// --- Actions ---

function swap() {
  // Move the current (valid) output into the input, and flip the mode.
  if (!result.value.ok) return
  input.value = result.value.value
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}

function clear() {
  input.value = ''
}

function loadSample() {
  if (mode.value === 'encode') {
    input.value = 'Hello, 世界 👋'
  } else {
    input.value = urlSafe.value ? 'SGVsbG8sIOS4lueVjCDwn5GL' : 'SGVsbG8sIOS4lueVjCDwn5GL'
  }
}

const faqEn: FaqItem[] = [
  {
    q: 'Does Base64 encryption keep my data secure?',
    a: 'No. Base64 is an encoding, not encryption — anyone can decode it instantly. It only makes binary or special-character data safe to transport as plain ASCII text, so never use it to protect passwords or secrets.',
  },
  {
    q: 'Is my text sent to a server?',
    a: 'No. Encoding and decoding run entirely in your browser with built-in JavaScript APIs (TextEncoder, btoa and atob). Nothing is uploaded or logged, so it is safe to paste tokens, keys or other sensitive strings.',
  },
  {
    q: 'Does it handle emoji and non-English characters?',
    a: 'Yes. The encoder converts your text to UTF-8 bytes before encoding, and the decoder turns the bytes back into UTF-8, so emoji and any Unicode script round-trip correctly. Naive tools that call btoa() directly corrupt these characters.',
  },
  {
    q: 'What is URL-safe Base64?',
    a: 'Standard Base64 uses the + and / characters, which have special meaning in URLs and filenames. URL-safe mode replaces them with - and _ and removes the = padding, producing a string you can drop into a query parameter or path. Decoding accepts both alphabets automatically.',
  },
  {
    q: 'Why do I get a decode error?',
    a: 'Decoding fails when the input is not valid Base64 — for example it contains stray characters, has the wrong length, or the bytes do not form valid UTF-8 text. Check for copied whitespace or a truncated string, and make sure you are in Decode mode.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Защищает ли кодирование Base64 мои данные?',
    a: 'Нет. Base64 — это кодирование, а не шифрование: любой может мгновенно его декодировать. Оно лишь позволяет безопасно передавать бинарные данные или спецсимволы как обычный ASCII-текст, поэтому никогда не используйте его для защиты паролей или секретов.',
  },
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Кодирование и декодирование выполняются полностью в браузере встроенными API JavaScript (TextEncoder, btoa и atob). Ничего не загружается и не логируется, поэтому можно безопасно вставлять токены, ключи и другие конфиденциальные строки.',
  },
  {
    q: 'Поддерживаются ли эмодзи и нелатинские символы?',
    a: 'Да. Кодировщик сначала преобразует текст в байты UTF-8, а декодировщик превращает байты обратно в UTF-8, поэтому эмодзи и любые письменности проходят туда-обратно без потерь. Примитивные инструменты, вызывающие btoa() напрямую, повреждают такие символы.',
  },
  {
    q: 'Что такое URL-safe Base64?',
    a: 'Стандартный Base64 использует символы + и /, у которых есть особое значение в URL и именах файлов. Режим URL-safe заменяет их на - и _ и убирает заполнение =, давая строку, которую можно вставить в параметр запроса или путь. Декодирование автоматически принимает оба алфавита.',
  },
  {
    q: 'Почему возникает ошибка декодирования?',
    a: 'Декодирование не удаётся, когда ввод не является корректным Base64 — например, в нём есть лишние символы, неверная длина или байты не образуют корректный текст UTF-8. Проверьте, нет ли скопированных пробелов или обрезанной строки, и убедитесь, что выбран режим декодирования.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="base64-encode-decode" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Encode / Decode segmented control -->
      <div
        class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700"
        role="group"
        :aria-label="ui.conversionMode"
      >
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'encode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'encode'"
          @click="mode = 'encode'"
        >{{ t('common.encode') }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'decode'"
          @click="mode = 'decode'"
        >{{ t('common.decode') }}</button>
      </div>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="urlSafe" type="checkbox" class="h-4 w-4 rounded border-ink-300 text-accent focus:ring-accent/30 dark:border-ink-600" />
        {{ ui.urlSafe }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!result.ok || !hasInput" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.cannotDecode }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ ui.invalidBase64 }} {{ error }}.</span>
      </template>
      <template v-else-if="hasInput">
        <span class="font-medium text-green-600 dark:text-green-400">
          ✓ {{ mode === 'encode' ? ui.encoded : ui.decoded }}
        </span>
        <span class="text-ink-400">· {{ output.length.toLocaleString() }} {{ ui.charactersOut }}</span>
      </template>
      <span v-else class="text-ink-400">
        {{ mode === 'encode' ? ui.hintEncode : ui.hintDecode }}
      </span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <div>
        <label :for="'b64-input'" class="label">{{ inputLabel }}</label>
        <textarea
          id="b64-input"
          v-model="input"
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          :placeholder="mode === 'encode' ? 'Hello, 世界' : ui.placeholderInDecode"
          :aria-label="inputLabel"
        />
      </div>

      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <label :for="'b64-output'" class="label !mb-0">{{ outputLabel }}</label>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          id="b64-output"
          :value="error ? '' : output"
          class="textarea-code min-h-[16rem]"
          readonly
          spellcheck="false"
          :placeholder="mode === 'encode' ? ui.placeholderOutEncode : ui.placeholderOutDecode"
          :aria-label="outputLabel"
        />
      </div>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Кодирование и декодирование Base64 онлайн</h2>
        <p>
          Этот бесплатный <strong>кодировщик и декодировщик Base64</strong>
          преобразует текст в Base64 и обратно — мгновенно и полностью в вашем
          браузере. Он создан для разработчиков, которым нужно встраивать
          «почти бинарные» данные в JSON, data URI, HTTP-заголовки, JWT или тело
          письма — везде, где допускается только обычный ASCII-текст. В отличие
          от многих простых инструментов, он кодирует через <strong>UTF-8</strong>,
          поэтому эмодзи и нелатинские письменности проходят туда-обратно без
          искажений.
        </p>
        <p>
          Ваш ввод <strong>никогда не загружается</strong> на сервер. Вся работа
          происходит локально с помощью браузерных API <code>TextEncoder</code>,
          <code>btoa</code> и <code>atob</code>, поэтому инструмент безопасен для
          токенов и других секретов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Кодировать</code>, чтобы превратить текст в Base64, или <code>Декодировать</code>, чтобы прочитать Base64 как текст.</li>
          <li>Введите или вставьте данные в левое поле — результат обновляется справа по мере ввода.</li>
          <li>Включите <code>URL-safe</code>, чтобы использовать <code>-</code> и <code>_</code> и убрать заполнение <code>=</code> для применения в URL.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы отправить результат обратно во ввод и сменить режим — удобно для проверки преобразования туда-обратно.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы загрузить образец с Unicode.</li>
        </ul>

        <h2>Что такое Base64 на самом деле</h2>
        <p>
          Base64 отображает каждые три байта данных на четыре печатных
          ASCII-символа из набора <code>A–Z</code>, <code>a–z</code>,
          <code>0–9</code>, <code>+</code> и <code>/</code>, дополняя конец
          символом <code>=</code>. Поэтому закодированный вывод примерно на треть
          больше исходных данных. Это <strong>кодирование, а не шифрование</strong>:
          декодировать его может любой, поэтому оно ничего не защищает — оно лишь
          позволяет произвольным байтам безопасно проходить по текстовым каналам.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно экранировать query-строку? Используйте
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщик</NuxtLink>.
          Разберите claims токена в <NuxtLink :to="localePath('/jwt-decoder')">декодере JWT</NuxtLink>
          (его части — это URL-safe Base64) или приведите в порядок декодированный
          payload в <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Encode and decode Base64 online</h2>
        <p>
          This free <strong>Base64 encoder and decoder</strong> converts text to
          Base64 and back, instantly and entirely in your browser. It is built for
          developers who need to embed binary-ish data in JSON, data URIs, HTTP
          headers, JWTs or email bodies — anywhere only plain ASCII text is allowed.
          Unlike many quick tools, it encodes through <strong>UTF-8</strong>, so
          emoji and non-Latin scripts survive the round trip unchanged.
        </p>
        <p>
          Your input is <strong>never uploaded</strong>. All work happens locally
          with the browser's <code>TextEncoder</code>, <code>btoa</code> and
          <code>atob</code> APIs, which makes it safe for tokens and other secrets.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick <code>Encode</code> to turn text into Base64, or <code>Decode</code> to read Base64 back as text.</li>
          <li>Type or paste into the left box — the result updates on the right as you type.</li>
          <li>Toggle <code>URL-safe</code> to use <code>-</code> and <code>_</code> and drop the <code>=</code> padding for use in URLs.</li>
          <li>Hit <code>Swap</code> to send the output back to the input and flip the mode — handy for verifying a round trip.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to load an example with Unicode.</li>
        </ul>

        <h2>What Base64 actually is</h2>
        <p>
          Base64 maps every three bytes of data onto four printable ASCII
          characters drawn from <code>A–Z</code>, <code>a–z</code>,
          <code>0–9</code>, <code>+</code> and <code>/</code>, padding the end with
          <code>=</code>. That is why encoded output is about a third larger than
          the original. It is an <strong>encoding, not encryption</strong>: anyone
          can decode it, so it protects nothing — it simply lets arbitrary bytes
          travel safely through text-only channels.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to escape a query string instead? Use the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>. Decode a
          token's claims with the <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>
          (its parts are URL-safe Base64), or tidy up a decoded payload with the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
