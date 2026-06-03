<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Mode = 'encode' | 'decode'

const input = ref('')
const mode = ref<Mode>('encode')
// Encode option: also escape every non-ASCII character to a numeric entity.
const encodeNonAscii = ref(false)

// --- ENCODE -----------------------------------------------------------------
// The five core characters are always escaped (ampersand first so we never
// double-escape an entity we are about to introduce); non-ASCII is optional.
function encodeHtml(value: string): string {
  let out = ''
  for (const ch of value) {
    const cp = ch.codePointAt(0) as number
    // Core characters first.
    if (ch === '&') out += '&amp;'
    else if (ch === '<') out += '&lt;'
    else if (ch === '>') out += '&gt;'
    else if (ch === '"') out += '&quot;'
    else if (ch === "'") out += '&#39;'
    // Optionally escape everything above ASCII to a numeric entity.
    else if (encodeNonAscii.value && cp > 127) out += '&#' + cp + ';'
    else out += ch
  }
  return out
}

// --- DECODE -----------------------------------------------------------------
// A built-in map of common named entities (the long tail beyond the core five).
const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  cent: '¢',
  pound: '£',
  yen: '¥',
  sect: '§',
  para: '¶',
  middot: '·',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  bull: '•',
  dagger: '†',
  Dagger: '‡',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
}

function decodeHtml(value: string): string {
  // Matches a decimal (&#60;), hex (&#x3C; / &#X3C;) or named (&amp;) entity.
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g, (full, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X'
      const cp = parseInt(isHex ? body.slice(2) : body.slice(1), isHex ? 16 : 10)
      if (Number.isNaN(cp) || cp < 0 || cp > 0x10ffff) return full
      try {
        return String.fromCodePoint(cp)
      } catch {
        return full
      }
    }
    // Named entity — only decode ones we know; leave unknown ones untouched.
    return Object.prototype.hasOwnProperty.call(NAMED, body) ? NAMED[body] : full
  })
}

// btoa/atob are not used here; String iteration, codePointAt, fromCodePoint and
// RegExp.replace all exist in the Node prerender env, so deriving the output in
// a pure computed is fully SSG-safe (no ClientOnly needed).
const output = computed(() =>
  input.value ? (mode.value === 'encode' ? encodeHtml(input.value) : decodeHtml(input.value)) : '',
)

const hasInput = computed(() => input.value.length > 0)
const inputChars = computed(() => input.value.length)
const outputChars = computed(() => output.value.length)

function clear() {
  input.value = ''
}

// Swap feeds the current output back into the input and flips the mode, so a
// round-trip can be verified in one click.
function swap() {
  input.value = output.value
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}

const samples: Record<Mode, string> = {
  encode: '<a href="x">5 & 6</a> © “quotes” — café',
  decode: '&lt;b&gt;Bold&lt;/b&gt; &amp; &copy; 2026 &mdash; caf&#233; &#x1F600;',
}

function loadSample() {
  input.value = samples[mode.value]
}

// Tool-specific labels (common verbs like Encode/Decode/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        encodeNonAscii: 'Кодировать все не-ASCII в числовые (&#NNN;)',
        encodeNonAsciiAria: 'Кодировать все символы вне ASCII в числовые сущности',
        encoded: 'Закодировано',
        decoded: 'Декодировано',
        startHint: 'Введите или вставьте текст, чтобы',
        startEncode: 'закодировать его в HTML-сущности.',
        startDecode: 'декодировать HTML-сущности обратно.',
        textToEncode: 'Текст для кодирования',
        textToDecode: 'Текст с HTML-сущностями',
        encodedOutput: 'Результат с HTML-сущностями',
        decodedOutput: 'Декодированный текст',
        inputAria: 'Текст для кодирования или декодирования HTML-сущностей',
        encodePlaceholder: '<a href="x">5 & 6</a>',
        decodePlaceholder: '&lt;b&gt;&amp;&#60;&#x3E;',
        outputPlaceholder: 'Результат появится здесь…',
      }
    : {
        encodeNonAscii: 'Encode all non-ASCII to numeric (&#NNN;)',
        encodeNonAsciiAria: 'Encode all non-ASCII characters to numeric entities',
        encoded: 'Encoded',
        decoded: 'Decoded',
        startHint: 'Type or paste text to',
        startEncode: 'escape it into HTML entities.',
        startDecode: 'unescape HTML entities back to text.',
        textToEncode: 'Text to encode',
        textToDecode: 'Text with HTML entities',
        encodedOutput: 'Escaped output',
        decodedOutput: 'Decoded text',
        inputAria: 'Text to encode or decode HTML entities',
        encodePlaceholder: '<a href="x">5 & 6</a>',
        decodePlaceholder: '&lt;b&gt;&amp;&#60;&#x3E;',
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
    q: 'Is my text sent to a server?',
    a: 'No. Encoding and decoding of HTML entities happen entirely in your browser with plain JavaScript — no network requests, no logging and no storage. That makes it safe for snippets that contain tokens, internal markup or other sensitive content.',
  },
  {
    q: 'Which characters does encoding escape?',
    a: 'By default it escapes the five characters that matter for HTML: & becomes &amp;, < becomes &lt;, > becomes &gt;, " becomes &quot; and \' becomes &#39;. Ampersand is always handled first so existing entities are not broken. Enable “Encode all non-ASCII” to additionally turn every character above ASCII into a numeric entity such as &#233;.',
  },
  {
    q: 'What kinds of entities can it decode?',
    a: 'It decodes decimal entities like &#60;, hexadecimal entities like &#x3C; (case-insensitive x), and a built-in map of common named entities — amp, lt, gt, quot, apos, nbsp, copy, reg, trade, euro, mdash, ndash, hellip, laquo, raquo and many more. Unknown named entities are left untouched so nothing is silently lost.',
  },
  {
    q: 'Why escape HTML at all — is it about security?',
    a: 'Yes. Escaping user-supplied text before inserting it into a page prevents the browser from interpreting it as markup, which is the core defence against cross-site scripting (XSS). It also lets you display literal tags, like showing <div> as text in documentation instead of rendering it.',
  },
  {
    q: 'Does it handle emoji and other astral-plane characters?',
    a: 'Yes. Encoding iterates by Unicode code point, so an emoji like 😀 becomes &#128512; when “Encode all non-ASCII” is on, and decoding uses String.fromCodePoint, so a numeric entity such as &#x1F600; is restored correctly to the original emoji.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Кодирование и декодирование HTML-сущностей выполняются полностью в браузере на обычном JavaScript — без сетевых запросов, логирования и хранения. Поэтому инструмент безопасен для фрагментов с токенами, внутренней разметкой и другим конфиденциальным содержимым.',
  },
  {
    q: 'Какие символы экранируются при кодировании?',
    a: 'По умолчанию экранируются пять важных для HTML символов: & становится &amp;, < — &lt;, > — &gt;, " — &quot;, а \' — &#39;. Амперсанд всегда обрабатывается первым, чтобы не сломать уже существующие сущности. Включите «Кодировать все не-ASCII», чтобы дополнительно превращать каждый символ вне ASCII в числовую сущность вроде &#233;.',
  },
  {
    q: 'Какие сущности умеет декодировать инструмент?',
    a: 'Он декодирует десятичные сущности вроде &#60;, шестнадцатеричные вроде &#x3C; (буква x в любом регистре) и встроенный набор популярных именованных сущностей — amp, lt, gt, quot, apos, nbsp, copy, reg, trade, euro, mdash, ndash, hellip, laquo, raquo и многие другие. Неизвестные именованные сущности остаются нетронутыми, чтобы ничего не потерялось незаметно.',
  },
  {
    q: 'Зачем вообще экранировать HTML — это про безопасность?',
    a: 'Да. Экранирование текста от пользователя перед вставкой на страницу не даёт браузеру интерпретировать его как разметку — это основная защита от межсайтового скриптинга (XSS). Кроме того, так можно показать литеральные теги, например вывести <div> как текст в документации, а не отрендерить его.',
  },
  {
    q: 'Поддерживаются ли эмодзи и символы за пределами BMP?',
    a: 'Да. Кодирование идёт по кодовым точкам Unicode, поэтому эмодзи вроде 😀 превращается в &#128512; при включённой опции «Кодировать все не-ASCII», а декодирование использует String.fromCodePoint, так что числовая сущность вроде &#x1F600; корректно восстанавливается в исходный эмодзи.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="html-entities" :faq="faq">
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
        <input v-model="encodeNonAscii" type="checkbox" class="accent-accent" :aria-label="ui.encodeNonAsciiAria" />
        {{ ui.encodeNonAscii }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="btn-ghost"
          :disabled="!hasInput"
          @click="swap"
        >{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => output" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="hasInput">
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
        <label for="html-input" class="label">{{ inputLabel }}</label>
        <textarea
          id="html-input"
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
        <label for="html-output" class="label">{{ outputLabel }}</label>
        <textarea
          id="html-output"
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
        <h2>Кодирование и декодирование HTML-сущностей онлайн</h2>
        <p>
          Этот бесплатный <strong>кодировщик и декодировщик HTML-сущностей</strong>
          экранирует специальные символы, чтобы текст можно было безопасно вставить
          в HTML, и выполняет обратное преобразование, превращая сущности вроде
          <code>&amp;lt;</code> и <code>&amp;#233;</code> обратно в обычные символы.
          Он создан для разработчиков, которые показывают код в документации,
          обезвреживают данные от пользователя перед выводом на страницу или
          распутывают шаблон, забитый <code>&amp;amp;</code> и <code>&amp;nbsp;</code>.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong> на чистом JavaScript:
          ничего не отправляется на сервер, поэтому безопасно вставлять разметку с
          токенами, внутренними комментариями и другими приватными данными.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите режим <code>Кодировать</code> или <code>Декодировать</code> переключателем.</li>
          <li>При кодировании при необходимости включите <code>Кодировать все не-ASCII в числовые</code>, чтобы экранировать буквы с диакритикой и эмодзи.</li>
          <li>Введите или вставьте текст слева — результат моментально появится справа.</li>
          <li>Используйте <code>Поменять местами</code>, чтобы подать результат обратно на вход и проверить round-trip.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать результат, или <code>Пример</code>, чтобы попробовать образец.</li>
        </ul>

        <h2>Что именно экранируется и декодируется</h2>
        <p>
          При кодировании всегда экранируются пять ключевых символов:
          <code>&amp;</code> → <code>&amp;amp;</code>, <code>&lt;</code> →
          <code>&amp;lt;</code>, <code>&gt;</code> → <code>&amp;gt;</code>,
          <code>"</code> → <code>&amp;quot;</code> и <code>'</code> →
          <code>&amp;#39;</code>. Амперсанд обрабатывается первым, чтобы не сломать
          уже готовые сущности. При декодировании инструмент понимает десятичные
          сущности (<code>&amp;#60;</code>), шестнадцатеричные (<code>&amp;#x3C;</code>)
          и встроенный набор именованных — <code>amp</code>, <code>lt</code>,
          <code>gt</code>, <code>quot</code>, <code>apos</code>, <code>nbsp</code>,
          <code>copy</code>, <code>mdash</code>, <code>ndash</code>, <code>hellip</code>,
          <code>laquo</code>, <code>raquo</code> и другие. Неизвестные именованные
          сущности остаются нетронутыми.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужна другая кодировка? Приведите в порядок ссылки и query-строки в
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщике</NuxtLink>,
          преобразуйте бинарно-безопасный текст в
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщике/декодировщике Base64</NuxtLink>
          или отформатируйте данные в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Encode and decode HTML entities online</h2>
        <p>
          This free <strong>HTML entity encoder and decoder</strong> escapes special
          characters so text can be safely embedded in HTML, and reverses the process,
          turning entities like <code>&amp;lt;</code> and <code>&amp;#233;</code> back
          into plain characters. It is built for developers who display code in
          documentation, sanitise user-supplied data before rendering it, or untangle
          a template stuffed with <code>&amp;amp;</code> and <code>&amp;nbsp;</code>.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong> with plain
          JavaScript — nothing is sent to a server, so it is safe to paste markup that
          contains tokens, internal comments or other private data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Choose <code>Encode</code> or <code>Decode</code> with the mode toggle.</li>
          <li>When encoding, optionally enable <code>Encode all non-ASCII to numeric</code> to escape accented letters and emoji too.</li>
          <li>Type or paste your text on the left — the result updates instantly on the right.</li>
          <li>Use <code>Swap</code> to feed the output back in and verify a round-trip.</li>
          <li>Click <code>Copy</code> to grab the result, or <code>Sample</code> to try an example.</li>
        </ul>

        <h2>What gets escaped and decoded</h2>
        <p>
          Encoding always escapes the five core characters: <code>&amp;</code> →
          <code>&amp;amp;</code>, <code>&lt;</code> → <code>&amp;lt;</code>,
          <code>&gt;</code> → <code>&amp;gt;</code>, <code>"</code> →
          <code>&amp;quot;</code> and <code>'</code> → <code>&amp;#39;</code>. Ampersand
          is handled first so existing entities are never broken. Decoding understands
          decimal entities (<code>&amp;#60;</code>), hexadecimal entities
          (<code>&amp;#x3C;</code>) and a built-in map of named entities — <code>amp</code>,
          <code>lt</code>, <code>gt</code>, <code>quot</code>, <code>apos</code>,
          <code>nbsp</code>, <code>copy</code>, <code>mdash</code>, <code>ndash</code>,
          <code>hellip</code>, <code>laquo</code>, <code>raquo</code> and more. Unknown
          named entities are left untouched.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a different encoding? Tidy up links and query strings with the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          convert binary-safe text with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          or format data with the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
