<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Mode = 'encode' | 'decode'
type EncodeScope = 'component' | 'uri'

const input = ref('')
const mode = ref<Mode>('encode')
const scope = ref<EncodeScope>('component')

// All of encodeURIComponent / encodeURI / decodeURIComponent / decodeURI exist
// in the Node prerender env, so deriving output in a computed is SSG-safe.
const result = computed<{ output: string; error: string | null }>(() => {
  const value = input.value
  if (!value) return { output: '', error: null }

  try {
    if (mode.value === 'encode') {
      const output =
        scope.value === 'component'
          ? encodeURIComponent(value)
          : encodeURI(value)
      return { output, error: null }
    }

    // Decode: prefer decodeURIComponent, fall back to decodeURI on error.
    try {
      return { output: decodeURIComponent(value), error: null }
    } catch {
      return { output: decodeURI(value), error: null }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { output: '', error: msg }
  }
})

const output = computed(() => result.value.output)
const error = computed(() => result.value.error)
const hasInput = computed(() => input.value.length > 0)
const inputChars = computed(() => input.value.length)
const outputChars = computed(() => output.value.length)

function clear() {
  input.value = ''
}

// Swap moves the current output into the input and flips the mode, so you can
// verify a round-trip in one click.
function swap() {
  if (error.value) return
  input.value = output.value
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}

const samples: Record<Mode, string> = {
  encode: 'a b&c=д',
  decode: 'a%20b%26c%3D%D0%B4',
}

function loadSample() {
  input.value = samples[mode.value]
}

// Tool-specific labels (common verbs like Encode/Decode/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        scope: 'Область',
        component: 'Компонент (encodeURIComponent)',
        fullUri: 'Полный URI (encodeURI)',
        scopeAria: 'Область кодирования',
        cannotDecode: '✗ Не удаётся декодировать',
        errorHint: ' — проверьте лишний символ «%» или неполную escape-последовательность.',
        encoded: 'Закодировано',
        decoded: 'Декодировано',
        startHint: 'Введите или вставьте текст, чтобы',
        startEncode: 'закодировать его моментально.',
        startDecode: 'декодировать его моментально.',
        textToEncode: 'Текст для кодирования',
        textToDecode: 'Текст для декодирования',
        encodedOutput: 'Закодированный результат',
        decodedOutput: 'Декодированный результат',
        inputAria: 'Текст для кодирования или декодирования',
        encodePlaceholder: 'https://example.com/search?q=red & blue',
        decodePlaceholder: 'https%3A%2F%2Fexample.com%2F',
        outputPlaceholder: 'Результат появится здесь…',
      }
    : {
        scope: 'Scope',
        component: 'Component (encodeURIComponent)',
        fullUri: 'Full URI (encodeURI)',
        scopeAria: 'Encoding scope',
        cannotDecode: '✗ Cannot decode',
        errorHint: ' — check for a stray "%" or an incomplete escape sequence.',
        encoded: 'Encoded',
        decoded: 'Decoded',
        startHint: 'Type or paste text to',
        startEncode: 'encode it instantly.',
        startDecode: 'decode it instantly.',
        textToEncode: 'Text to encode',
        textToDecode: 'Text to decode',
        encodedOutput: 'Encoded output',
        decodedOutput: 'Decoded output',
        inputAria: 'Text to encode or decode',
        encodePlaceholder: 'https://example.com/search?q=red & blue',
        decodePlaceholder: 'https%3A%2F%2Fexample.com%2F',
        outputPlaceholder: 'Result appears here…',
      },
)

const inputLabel = computed(() =>
  mode.value === 'encode' ? ui.value.textToEncode : ui.value.textToDecode,
)
const outputLabel = computed(() =>
  mode.value === 'encode' ? ui.value.encodedOutput : ui.value.decodedOutput,
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my input sent to a server?',
    a: 'No. Encoding and decoding happen entirely in your browser with JavaScript’s built-in URI functions. Nothing is uploaded, logged or stored, so it is safe for URLs that contain tokens, query parameters or other sensitive values.',
  },
  {
    q: 'What is the difference between "Component" and "Full URI" encoding?',
    a: 'Component mode uses encodeURIComponent, which escapes reserved characters such as &, =, ?, / and # so a value is safe inside a single query-string parameter. Full URI mode uses encodeURI, which leaves those reserved characters intact because they are meaningful in a complete URL, and only escapes things like spaces.',
  },
  {
    q: 'Which mode should I use to encode a query-string value?',
    a: 'Use Component mode. A parameter value like search=red & blue must have its space, ampersand and equals sign escaped so the server reads it as one value. Full URI mode would leave the ampersand untouched and break the parameter boundaries.',
  },
  {
    q: 'Why do I get a "URI malformed" error when decoding?',
    a: 'Percent-decoding expects every % to be followed by two hexadecimal digits (for example %20). A lone % or an incomplete sequence like %E0%A4 is invalid, so the decoder reports an error instead of guessing. Fix or remove the stray percent sign and try again.',
  },
  {
    q: 'Does it handle Unicode and emoji correctly?',
    a: 'Yes. The encoder converts non-ASCII characters to their UTF-8 percent-encoded bytes — for example д becomes %D0%B4 — and the decoder reverses the process, so any round-trip preserves accents, CJK text and emoji.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Кодирование и декодирование выполняются полностью в браузере с помощью встроенных URI-функций JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для URL с токенами, параметрами запроса и другими конфиденциальными значениями.',
  },
  {
    q: 'В чём разница между кодированием «Компонент» и «Полный URI»?',
    a: 'Режим «Компонент» использует encodeURIComponent, который экранирует зарезервированные символы &, =, ?, / и #, чтобы значение было безопасно внутри одного параметра query-строки. Режим «Полный URI» использует encodeURI, который оставляет эти зарезервированные символы нетронутыми, так как они имеют значение в полном URL, и экранирует только такие вещи, как пробелы.',
  },
  {
    q: 'Какой режим использовать для кодирования значения query-строки?',
    a: 'Используйте режим «Компонент». В значении параметра вроде search=red & blue нужно экранировать пробел, амперсанд и знак равенства, чтобы сервер прочитал его как одно значение. Режим «Полный URI» оставил бы амперсанд нетронутым и нарушил бы границы параметров.',
  },
  {
    q: 'Почему при декодировании возникает ошибка «URI malformed»?',
    a: 'Процентное декодирование ожидает, что за каждым символом % следуют две шестнадцатеричные цифры (например, %20). Одиночный % или неполная последовательность вроде %E0%A4 недопустимы, поэтому декодер сообщает об ошибке, а не пытается угадать. Исправьте или удалите лишний знак процента и попробуйте снова.',
  },
  {
    q: 'Корректно ли обрабатываются Unicode и эмодзи?',
    a: 'Да. Кодировщик преобразует символы вне ASCII в их процентно-закодированные байты UTF-8 — например, д становится %D0%B4 — а декодер выполняет обратное преобразование, поэтому любой round-trip сохраняет диакритику, текст CJK и эмодзи.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="url-encode-decode" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Mode toggle -->
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'encode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'encode'"
        >{{ t('common.encode') }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'decode'"
        >{{ t('common.decode') }}</button>
      </div>

      <!-- Encode sub-option -->
      <label
        v-if="mode === 'encode'"
        class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
      >
        {{ ui.scope }}
        <select v-model="scope" class="field !w-auto !py-1.5" :aria-label="ui.scopeAria">
          <option value="component">{{ ui.component }}</option>
          <option value="uri">{{ ui.fullUri }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="btn-ghost"
          :disabled="!hasInput || !!error"
          @click="swap"
        >{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => output" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.cannotDecode }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ error }}{{ ui.errorHint }}</span>
      </template>
      <template v-else-if="hasInput">
        <span class="font-medium text-green-600 dark:text-green-400">
          ✓ {{ mode === 'encode' ? ui.encoded : ui.decoded }}
        </span>
        <span class="text-ink-400">· {{ inputChars.toLocaleString() }} → {{ outputChars.toLocaleString() }} {{ t('common.characters') }}</span>
      </template>
      <span v-else class="text-ink-400">
        {{ ui.startHint }} {{ mode === 'encode' ? ui.startEncode : ui.startDecode }}
      </span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <label for="url-input" class="label">{{ inputLabel }}</label>
        <textarea
          id="url-input"
          v-model="input"
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="mode === 'encode' ? ui.encodePlaceholder : ui.decodePlaceholder"
          :aria-label="inputLabel"
        />
      </div>
      <div>
        <label for="url-output" class="label">{{ outputLabel }}</label>
        <textarea
          id="url-output"
          :value="output"
          readonly
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          :placeholder="ui.outputPlaceholder"
          :aria-label="outputLabel"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Кодирование и декодирование URL онлайн</h2>
        <p>
          Этот бесплатный <strong>кодировщик и декодировщик URL</strong> применяет
          процентное кодирование, чтобы текст безопасно передавался внутри URL, и
          выполняет обратное преобразование, чтобы прочитать экранированный адрес
          обычными символами. Он создан для разработчиков, которые собирают
          query-строки, отлаживают параметры редиректов или распутывают забитую
          символами <code>%20</code> ссылку, скопированную из адресной строки браузера.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong> с помощью стандартных
          функций <code>encodeURIComponent</code>, <code>encodeURI</code> и
          <code>decodeURIComponent</code>. Ваши данные не отправляются на сервер,
          поэтому можно безопасно вставлять URL с токенами доступа, идентификаторами
          сессий и другими приватными данными.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите режим <code>Кодировать</code> или <code>Декодировать</code> переключателем.</li>
          <li>При кодировании выберите <code>Компонент</code> для одного значения или <code>Полный URI</code> для целого адреса.</li>
          <li>Введите или вставьте текст слева — результат моментально обновится справа.</li>
          <li>Используйте <code>Поменять</code>, чтобы подать результат обратно на вход и проверить round-trip.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать результат, или <code>Пример</code>, чтобы попробовать образец.</li>
        </ul>

        <h2>Кодирование компонента против полного URI</h2>
        <p>
          Кодирование <strong>компонента</strong> (<code>encodeURIComponent</code>)
          экранирует зарезервированные символы <code>&amp;</code>, <code>=</code>,
          <code>?</code>, <code>/</code> и <code>#</code> — именно это нужно для
          отдельного значения query-строки, например <code>a b&amp;c=д</code> →
          <code>a%20b%26c%3D%D0%B4</code>. Кодирование <strong>полного URI</strong>
          (<code>encodeURI</code>) сохраняет эти символы, поскольку они разделяют
          части полного URL, и экранирует только пробелы и подобные небезопасные
          символы — так <code>https://x.com/a b</code> превращается в
          <code>https://x.com/a%20b</code>, оставляя схему и хост нетронутыми. При
          декодировании инструмент сначала пробует <code>decodeURIComponent</code> и
          при необходимости откатывается к <code>decodeURI</code>, чтобы оба стиля
          корректно проходили round-trip.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужна другая кодировка? Преобразуйте бинарно-безопасный текст в
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщике/декодировщике Base64</NuxtLink>,
          приведите в порядок ответ API в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink> или
          разберите токен в <NuxtLink :to="localePath('/jwt-decoder')">декодере JWT</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Encode and decode URLs online</h2>
        <p>
          This free <strong>URL encoder and decoder</strong> applies percent-encoding
          so that text travels safely inside a URL, and reverses it to read an escaped
          address back as plain characters. It is built for developers who assemble
          query strings, debug redirect parameters, or untangle a <code>%20</code>-filled
          link copied from a browser bar.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong> using the standard
          <code>encodeURIComponent</code>, <code>encodeURI</code> and
          <code>decodeURIComponent</code> functions. Your input is never sent to a
          server, so it is safe to paste URLs that contain access tokens, session IDs
          or other private data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Choose <code>Encode</code> or <code>Decode</code> with the mode toggle.</li>
          <li>When encoding, pick <code>Component</code> for a single value or <code>Full URI</code> for a whole address.</li>
          <li>Type or paste your text on the left — the result updates instantly on the right.</li>
          <li>Use <code>Swap</code> to feed the output back in and verify a round-trip.</li>
          <li>Click <code>Copy</code> to grab the result, or <code>Sample</code> to try an example.</li>
        </ul>

        <h2>Component vs. full-URI encoding</h2>
        <p>
          <strong>Component</strong> encoding (<code>encodeURIComponent</code>) escapes
          the reserved characters <code>&amp;</code>, <code>=</code>, <code>?</code>,
          <code>/</code> and <code>#</code>, which is exactly what you want for a single
          query-string value such as <code>a b&amp;c=д</code> → <code>a%20b%26c%3D%D0%B4</code>.
          <strong>Full URI</strong> encoding (<code>encodeURI</code>) preserves those
          characters because they delimit the parts of a complete URL, only escaping
          spaces and similar unsafe characters — so <code>https://x.com/a b</code> becomes
          <code>https://x.com/a%20b</code> with the scheme and host left intact. When
          decoding, this tool tries <code>decodeURIComponent</code> first and falls back
          to <code>decodeURI</code> so both styles round-trip cleanly.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a different encoding? Convert binary-safe text with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          tidy up an API response with the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>, or inspect a token with the
          <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
