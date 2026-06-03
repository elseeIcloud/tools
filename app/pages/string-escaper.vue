<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Target = 'regex' | 'sql' | 'json' | 'backslash'
type Direction = 'escape' | 'unescape'

const target = ref<Target>('regex')
const direction = ref<Direction>('escape')
const sqlBackslash = ref(false)
const input = ref('')

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        target: 'Цель',
        targetAria: 'Цель экранирования',
        regex: 'Regex',
        sql: 'SQL-строка',
        json: 'JSON-строка',
        backslash: 'Backslash / C',
        direction: 'Направление',
        directionAria: 'Направление',
        escape: 'Экранировать',
        unescape: 'Снять экранирование',
        sqlBackslash: 'Также экранировать обратным слешем (MySQL)',
        ready: '✓ Готово',
        invalid: '✗ Не удалось разобрать строку',
        chars: 'символов',
        inputAria: 'Исходная строка',
        outputAria: 'Результат',
        inputPlaceholder: 'a.b*c',
      }
    : {
        target: 'Target',
        targetAria: 'Escape target',
        regex: 'Regex',
        sql: 'SQL string',
        json: 'JSON string',
        backslash: 'Backslash / C',
        direction: 'Direction',
        directionAria: 'Direction',
        escape: 'Escape',
        unescape: 'Unescape',
        sqlBackslash: 'Also backslash-escape (MySQL)',
        ready: '✓ Ready',
        invalid: '✗ Could not parse the string',
        chars: 'characters',
        inputAria: 'Source string',
        outputAria: 'Result',
        inputPlaceholder: 'a.b*c',
      },
)

// ---------------------------------------------------------------------------
// Regex: escape the metacharacters . * + ? ^ $ { } ( ) | [ ] \ with a
// backslash; unescape removes a single backslash placed before a metacharacter.
const REGEX_META = '.*+?^${}()|[]\\'
function regexEscape(text: string): string {
  // Same character class as MDN's suggested RegExp.escape.
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function regexUnescape(text: string): string {
  // Drop a backslash only when it precedes a regex metacharacter; leave other
  // sequences (e.g. \d, \w) untouched so they keep their meaning.
  return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}

// ---------------------------------------------------------------------------
// SQL: the portable escape is doubling a single quote ('' ). The optional
// MySQL/PostgreSQL backslash mode also escapes the common control bytes.
function sqlEscape(text: string, backslash: boolean): string {
  if (backslash) {
    // Order matters: escape the backslash itself first.
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\x1a/g, '\\Z')
      .replace(/'/g, "\\'")
  }
  return text.replace(/'/g, "''")
}
function sqlUnescape(text: string, backslash: boolean): string {
  if (backslash) {
    return text.replace(/\\(.)/g, (_m, c: string) => {
      switch (c) {
        case '0':
          return '\0'
        case 'n':
          return '\n'
        case 'r':
          return '\r'
        case 't':
          return '\t'
        case 'Z':
          return '\x1a'
        case "'":
          return "'"
        case '\\':
          return '\\'
        default:
          return c
      }
    })
  }
  return text.replace(/''/g, "'")
}

// ---------------------------------------------------------------------------
// JSON: escape = JSON.stringify(text) with the surrounding quotes removed;
// unescape = JSON.parse('"' + text + '"') so any errors surface as red status.
function jsonEscape(text: string): string {
  const s = JSON.stringify(text)
  return s.slice(1, -1)
}
function jsonUnescape(text: string): string {
  return JSON.parse('"' + text + '"') as string
}

// ---------------------------------------------------------------------------
// Backslash / C-style: the classic \n \t \r \\ \" \' \0 \b \f \v escapes.
function backslashEscape(text: string): string {
  let out = ''
  for (const ch of text) {
    switch (ch) {
      case '\\':
        out += '\\\\'
        break
      case '\n':
        out += '\\n'
        break
      case '\t':
        out += '\\t'
        break
      case '\r':
        out += '\\r'
        break
      case '"':
        out += '\\"'
        break
      case "'":
        out += "\\'"
        break
      case '\0':
        out += '\\0'
        break
      case '\b':
        out += '\\b'
        break
      case '\f':
        out += '\\f'
        break
      case '\v':
        out += '\\v'
        break
      default:
        out += ch
    }
  }
  return out
}
function backslashUnescape(text: string): string {
  return text.replace(/\\(.)/g, (_m, c: string) => {
    switch (c) {
      case 'n':
        return '\n'
      case 't':
        return '\t'
      case 'r':
        return '\r'
      case '0':
        return '\0'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case 'v':
        return '\v'
      case '"':
        return '"'
      case "'":
        return "'"
      case '\\':
        return '\\'
      default:
        return c
    }
  })
}

interface Result {
  output: string
  error: boolean
  empty: boolean
}

// Pure transforms: regex/replace, JSON.stringify and JSON.parse all run in the
// Node prerender env, so the result is a synchronous computed with no guard.
const result = computed<Result>(() => {
  const text = input.value
  if (!text) return { output: '', error: false, empty: true }

  try {
    let out: string
    if (target.value === 'regex') {
      out = direction.value === 'escape' ? regexEscape(text) : regexUnescape(text)
    } else if (target.value === 'sql') {
      out =
        direction.value === 'escape'
          ? sqlEscape(text, sqlBackslash.value)
          : sqlUnescape(text, sqlBackslash.value)
    } else if (target.value === 'json') {
      out = direction.value === 'escape' ? jsonEscape(text) : jsonUnescape(text)
    } else {
      out = direction.value === 'escape' ? backslashEscape(text) : backslashUnescape(text)
    }
    return { output: out, error: false, empty: false }
  } catch {
    // Only JSON unescape can throw (malformed escape sequence).
    return { output: '', error: true, empty: false }
  }
})

const output = computed(() => result.value.output)
const charCount = computed(() => output.value.length)

const samples: Record<Target, string> = {
  regex: 'a.b*c (price)? [x-y]',
  sql: "O'Brien said: it's 100% fine",
  json: 'he said "hi"\nand left',
  backslash: 'line1\tcol2\nC:\\path\\to "file"',
}

function loadSample() {
  // Sample matches the active direction: in unescape mode, feed the escaped
  // form so users immediately see a clean round-trip.
  direction.value = 'escape'
  input.value = samples[target.value]
}

function clear() {
  input.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server?',
    a: 'No. Every escape and unescape transform runs entirely in your browser with plain JavaScript — regex replacement, JSON.stringify and JSON.parse. Nothing you paste is uploaded, logged or stored, so it is safe for queries, secrets and other sensitive strings.',
  },
  {
    q: 'What does the Regex target escape?',
    a: 'It backslash-escapes the regular-expression metacharacters . * + ? ^ $ { } ( ) | [ ] and the backslash itself, so the text matches literally inside a pattern. Unescape removes a backslash that sits in front of one of those metacharacters, while leaving sequences like \\d or \\w intact.',
  },
  {
    q: 'How is the SQL string escaped?',
    a: 'The portable, ANSI-standard escape doubles a single quote, turning O\'Brien into O\'\'Brien. Enable "Also backslash-escape" for the MySQL/PostgreSQL style that additionally escapes the backslash and control bytes such as newline, tab and NUL. Always prefer parameterized queries over manual escaping in production code.',
  },
  {
    q: 'How does JSON escaping work?',
    a: 'Escaping runs JSON.stringify on your text and removes the surrounding quotes, producing exactly what belongs between the quotes of a JSON string — so he said "hi" becomes he said \\"hi\\". Unescaping wraps your text in quotes and runs JSON.parse; a malformed escape sequence shows a red status instead of broken output.',
  },
  {
    q: 'What is the Backslash / C-style mode for?',
    a: 'It handles the classic C-style escapes — \\n, \\t, \\r, \\\\, \\", \\\' and friends — used in C, Java, JavaScript and many config formats. Escape converts real control characters into their backslash form, and unescape turns them back, letting you round-trip multi-line strings cleanly.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Все преобразования экранирования и снятия экранирования выполняются целиком в браузере на обычном JavaScript — замена по regex, JSON.stringify и JSON.parse. Ничего из вставленного не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для запросов, секретов и других конфиденциальных строк.',
  },
  {
    q: 'Что экранирует цель Regex?',
    a: 'Она ставит обратный слеш перед метасимволами регулярных выражений . * + ? ^ $ { } ( ) | [ ] и перед самим обратным слешем, чтобы текст совпадал буквально внутри шаблона. Снятие экранирования убирает обратный слеш, стоящий перед таким метасимволом, не трогая последовательности вроде \\d или \\w.',
  },
  {
    q: 'Как экранируется SQL-строка?',
    a: 'Переносимое экранирование по стандарту ANSI удваивает одинарную кавычку, превращая O\'Brien в O\'\'Brien. Включите «Также экранировать обратным слешем» для стиля MySQL/PostgreSQL, который дополнительно экранирует обратный слеш и управляющие байты — перенос строки, табуляцию, NUL. В рабочем коде всегда предпочитайте параметризованные запросы ручному экранированию.',
  },
  {
    q: 'Как работает экранирование JSON?',
    a: 'Экранирование запускает JSON.stringify по вашему тексту и убирает окружающие кавычки, давая ровно то, что должно стоять между кавычками JSON-строки — так he said "hi" превращается в he said \\"hi\\". Снятие экранирования оборачивает текст в кавычки и запускает JSON.parse; некорректная escape-последовательность даёт красный статус вместо сломанного вывода.',
  },
  {
    q: 'Для чего режим Backslash / C?',
    a: 'Он работает с классическими C-последовательностями — \\n, \\t, \\r, \\\\, \\", \\\' и подобными — которые используются в C, Java, JavaScript и многих форматах конфигов. Экранирование превращает реальные управляющие символы в их форму с обратным слешем, а снятие экранирования возвращает их обратно, позволяя чисто прогнать многострочные строки туда-обратно.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="string-escaper" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.target }}
        <select v-model="target" class="field !w-auto !py-1.5" :aria-label="ui.targetAria">
          <option value="regex">{{ ui.regex }}</option>
          <option value="sql">{{ ui.sql }}</option>
          <option value="json">{{ ui.json }}</option>
          <option value="backslash">{{ ui.backslash }}</option>
        </select>
      </label>

      <div class="ml-1 inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="direction === 'escape' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="direction = 'escape'"
        >{{ ui.escape }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="direction === 'unescape' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="direction = 'unescape'"
        >{{ ui.unescape }}</button>
      </div>

      <label
        v-if="target === 'sql'"
        class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
      >
        <input v-model="sqlBackslash" type="checkbox" class="accent-accent" />
        {{ ui.sqlBackslash }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="result.error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
      </template>
      <template v-else-if="!result.empty">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.ready }}</span>
        <span class="text-ink-400">· {{ charCount.toLocaleString() }} {{ ui.chars }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <label class="label">{{ t('common.input') }}</label>
        <textarea
          v-model="input"
          class="textarea-code min-h-[18rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.inputPlaceholder"
          :aria-label="ui.inputAria"
        />
      </div>
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="label !mb-0">{{ t('common.output') }}</span>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          :value="output"
          readonly
          class="textarea-code min-h-[18rem] bg-ink-50 dark:bg-ink-900"
          spellcheck="false"
          :aria-label="ui.outputAria"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Экранирование строк для regex, SQL, JSON и C онлайн</h2>
        <p>
          Этот бесплатный <strong>инструмент экранирования строк</strong> готовит
          текст к безопасной вставке в регулярные выражения, SQL-строки, JSON и
          backslash/C-последовательности — и снимает экранирование обратно. Выберите
          <strong>цель</strong> и <strong>направление</strong>, вставьте строку и
          сразу получите результат. Сделано для разработчиков, которые постоянно
          переносят литералы между языками, запросами и конфигами.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш текст не
          отправляется на сервер, поэтому инструмент безопасен для фрагментов
          запросов, секретов и других конфиденциальных строк.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Цель</code>: Regex, SQL-строка, JSON-строка или Backslash / C.</li>
          <li>Переключите <code>Направление</code> между <code>Экранировать</code> и <code>Снять экранирование</code>.</li>
          <li>Для SQL включите чекбокс, чтобы дополнительно экранировать обратным слешем в стиле MySQL.</li>
          <li>Вставьте строку слева — результат появится справа в реальном времени.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Чем отличаются правила экранирования</h2>
        <p>
          У каждой цели свой набор спецсимволов. <strong>Regex</strong> ставит
          обратный слеш перед метасимволами <code>. * + ? ^ $ {{ '{' }} {{ '}' }} ( ) | [ ] \</code>,
          чтобы они совпадали буквально. <strong>SQL</strong> удваивает одинарную
          кавычку (<code>'</code> → <code>''</code>), а в режиме backslash экранирует
          ещё и управляющие байты. <strong>JSON</strong> использует
          <code>JSON.stringify</code> без внешних кавычек, поэтому обратное
          преобразование строго следует спецификации и при ошибке показывает
          красный статус. <strong>Backslash / C</strong> работает с привычными
          <code>\n \t \r \\ \"</code> из C, Java и JavaScript.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно экранировать символы для HTML? Откройте
          <NuxtLink :to="localePath('/html-entities')">кодировщик HTML-сущностей</NuxtLink>.
          Для query-строк и URL пригодится
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщик</NuxtLink>,
          а привести в порядок результат поможет
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Escape strings for regex, SQL, JSON and C online</h2>
        <p>
          This free <strong>string escaper</strong> prepares text for safe pasting
          into regular expressions, SQL strings, JSON and backslash/C-style
          sequences — and unescapes it back. Pick a <strong>target</strong> and a
          <strong>direction</strong>, paste your string and get the result instantly.
          It is built for developers who constantly move literals between languages,
          queries and config files.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your text is
          never sent to a server, so it is safe to use with query fragments, secrets
          and other sensitive strings.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Choose a <code>Target</code>: Regex, SQL string, JSON string or Backslash / C.</li>
          <li>Toggle the <code>Direction</code> between <code>Escape</code> and <code>Unescape</code>.</li>
          <li>For SQL, enable the checkbox to additionally backslash-escape in the MySQL style.</li>
          <li>Paste your string on the left — the result appears on the right in real time.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>How the escaping rules differ</h2>
        <p>
          Each target has its own special characters. <strong>Regex</strong>
          backslash-escapes the metacharacters
          <code>. * + ? ^ $ {{ '{' }} {{ '}' }} ( ) | [ ] \</code> so they match
          literally. <strong>SQL</strong> doubles the single quote
          (<code>'</code> → <code>''</code>), and the backslash mode also escapes
          control bytes. <strong>JSON</strong> uses <code>JSON.stringify</code>
          without the outer quotes, so unescaping strictly follows the spec and
          shows a red status on malformed input. <strong>Backslash / C</strong>
          handles the familiar <code>\n \t \r \\ \"</code> sequences from C, Java
          and JavaScript.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to escape characters for HTML? Open the
          <NuxtLink :to="localePath('/html-entities')">HTML entity encoder</NuxtLink>.
          For query strings and URLs, try the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          or tidy up the result with the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
