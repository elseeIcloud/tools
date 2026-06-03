<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const indent = ref<'2' | '4' | 'tab'>('2')
const view = ref<'text' | 'tree'>('text')
const parsed = shallowRef<unknown>(undefined)
const error = ref<string | null>(null)
const errorLoc = ref<{ line: number; col: number } | null>(null)

const indentValue = computed<number | string>(() =>
  indent.value === 'tab' ? '\t' : Number(indent.value),
)
const isValid = computed(() => !error.value && input.value.trim().length > 0)
const charCount = computed(() => input.value.length)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        indent: 'Отступ',
        spaces2: '2 пробела',
        spaces4: '4 пробела',
        tab: 'Таб',
        text: 'Текст',
        tree: 'Дерево',
        valid: '✓ Корректный JSON',
        invalid: '✗ Некорректный JSON',
        line: 'строка',
        column: 'столбец',
        treeEmpty: 'Корректный JSON появится здесь в виде интерактивного дерева.',
        placeholder: '{ "привет": "мир" }',
      }
    : {
        indent: 'Indent',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
        tab: 'Tab',
        text: 'Text',
        tree: 'Tree',
        valid: '✓ Valid JSON',
        invalid: '✗ Invalid JSON',
        line: 'line',
        column: 'column',
        treeEmpty: 'Valid JSON will appear here as an interactive tree.',
        placeholder: '{ "hello": "world" }',
      },
)

function locateError(text: string, message: string) {
  const m = /position (\d+)/.exec(message)
  if (!m) return null
  const pos = Math.min(Number(m[1]), text.length)
  const upto = text.slice(0, pos)
  const line = upto.split('\n').length
  const col = pos - upto.lastIndexOf('\n')
  return { line, col }
}

function validate() {
  if (!input.value.trim()) {
    error.value = null
    errorLoc.value = null
    parsed.value = undefined
    return
  }
  try {
    parsed.value = JSON.parse(input.value)
    error.value = null
    errorLoc.value = null
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    parsed.value = undefined
    error.value = msg
    errorLoc.value = locateError(input.value, msg)
  }
}

watch(input, validate, { immediate: true })

function format() {
  try {
    input.value = JSON.stringify(JSON.parse(input.value), null, indentValue.value)
  } catch {
    /* validate() surfaces the error */
  }
}

function minify() {
  try {
    input.value = JSON.stringify(JSON.parse(input.value))
  } catch {
    /* validate() surfaces the error */
  }
}

function clear() {
  input.value = ''
}

const sample = `{
  "id": 1024,
  "name": "Ada Lovelace",
  "active": true,
  "roles": ["admin", "engineer"],
  "profile": { "city": "London", "joined": "1843-10-01" },
  "projects": null
}`

function loadSample() {
  input.value = sample
}

watch(indent, () => {
  if (isValid.value && view.value === 'text') format()
})

const faqEn: FaqItem[] = [
  {
    q: 'Is my JSON sent to a server?',
    a: 'No. The formatter parses and beautifies your JSON entirely in your browser using JavaScript. Nothing is uploaded, logged, or stored, which makes it safe for sensitive payloads like API responses or config files.',
  },
  {
    q: 'What is the difference between formatting and validating?',
    a: 'Validating checks whether your text is syntactically correct JSON and reports the first error with its line and column. Formatting (beautifying) re-indents valid JSON for readability, while minifying strips all whitespace to make it as small as possible.',
  },
  {
    q: 'Can it handle large JSON files?',
    a: 'Yes, up to the memory available to your browser tab — typically several megabytes work smoothly. For very large files the tree view may render slowly, so switch to text mode for the best performance.',
  },
  {
    q: 'Does it support comments, trailing commas, or JSON5?',
    a: 'No. It follows the strict JSON specification (RFC 8259), so comments and trailing commas are reported as errors. Remove them first if you are pasting a config that uses JSON5 or JSONC.',
  },
  {
    q: 'How do I fix an "Unexpected token" error?',
    a: 'That error means the parser hit a character it did not expect at the reported position — usually a missing comma, an unquoted key, single quotes instead of double quotes, or a trailing comma. Jump to the reported line and column to find it.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой JSON на сервер?',
    a: 'Нет. Форматтер разбирает и форматирует JSON прямо в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для конфиденциальных данных вроде ответов API или конфигов.',
  },
  {
    q: 'Чем форматирование отличается от валидации?',
    a: 'Валидация проверяет, что текст синтаксически корректен, и показывает первую ошибку с номером строки и столбца. Форматирование (beautify) переотступает корректный JSON для читаемости, а минификация убирает все пробелы, делая его максимально компактным.',
  },
  {
    q: 'Справится ли инструмент с большими файлами JSON?',
    a: 'Да, в пределах памяти вкладки браузера — обычно несколько мегабайт обрабатываются без проблем. Для очень больших файлов режим дерева может тормозить, поэтому используйте текстовый режим для максимальной скорости.',
  },
  {
    q: 'Поддерживаются ли комментарии, висячие запятые или JSON5?',
    a: 'Нет. Инструмент следует строгой спецификации JSON (RFC 8259), поэтому комментарии и висячие запятые считаются ошибкой. Уберите их, если вставляете конфиг в формате JSON5 или JSONC.',
  },
  {
    q: 'Как исправить ошибку «Unexpected token»?',
    a: 'Эта ошибка значит, что парсер встретил неожиданный символ в указанной позиции — обычно это пропущенная запятая, ключ без кавычек, одинарные кавычки вместо двойных или висячая запятая. Перейдите к указанной строке и столбцу, чтобы найти место.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="json-formatter" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="format">{{ t('common.format') }}</button>
      <button type="button" class="btn-ghost" @click="minify">{{ t('common.minify') }}</button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.indent }}
        <select v-model="indent" class="field !w-auto !py-1.5" :aria-label="ui.indent">
          <option value="2">{{ ui.spaces2 }}</option>
          <option value="4">{{ ui.spaces4 }}</option>
          <option value="tab">{{ ui.tab }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
            :class="view === 'text' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
            @click="view = 'text'"
          >{{ ui.text }}</button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
            :class="view === 'tree' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
            @click="view = 'tree'"
          >{{ ui.tree }}</button>
        </div>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => input" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">
          {{ error }}<template v-if="errorLoc"> ({{ ui.line }} {{ errorLoc.line }}, {{ ui.column }} {{ errorLoc.col }})</template>
        </span>
      </template>
      <template v-else-if="isValid">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="text-ink-400">· {{ charCount.toLocaleString() }} {{ t('common.characters') }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Editor / Tree -->
    <div class="mt-3">
      <textarea
        v-show="view === 'text'"
        v-model="input"
        class="textarea-code min-h-[20rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
        aria-label="JSON"
      />
      <div
        v-show="view === 'tree'"
        class="min-h-[20rem] overflow-auto rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950"
      >
        <JsonTree v-if="parsed !== undefined" :data="parsed" />
        <p v-else-if="error" class="font-mono text-sm text-red-500">{{ error }}</p>
        <p v-else class="text-sm text-ink-400">{{ ui.treeEmpty }}</p>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Форматирование, валидация и просмотр JSON онлайн</h2>
        <p>
          Этот бесплатный <strong>форматтер и валидатор JSON</strong> превращает
          беспорядочный JSON в аккуратный текст с отступами, показывает ошибки с
          точным номером строки и столбца и позволяет изучать структуру в виде
          сворачиваемого дерева. Сделан для разработчиков, которые десятки раз в
          день вставляют ответы API, строки логов и конфиги и хотят, чтобы они
          были читаемыми.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш JSON не
          отправляется на сервер, поэтому его безопасно использовать с токенами,
          внутренними ответами API и другими конфиденциальными данными.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте или введите JSON в редактор — он проверяется на лету.</li>
          <li>Нажмите <code>Форматировать</code>, чтобы расставить отступы (2, 4 пробела или таб).</li>
          <li>Нажмите <code>Сжать</code>, чтобы убрать пробелы и получить минимальный размер.</li>
          <li>Переключитесь на <code>Дерево</code>, чтобы разворачивать вложенные объекты и массивы.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Beautify против minify</h2>
        <p>
          <strong>Форматирование</strong> добавляет отступы и переносы строк,
          чтобы JSON было удобно читать и сравнивать. <strong>Минификация</strong>
          убирает все необязательные пробелы и переносы — это нужно, когда JSON
          встраивают в URL, колонку базы данных или сетевой запрос, где важен размер.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете с закодированными данными? Попробуйте
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик/декодировщик Base64</NuxtLink>,
          разберите токен в <NuxtLink :to="localePath('/jwt-decoder')">декодере JWT</NuxtLink>
          или приведите в порядок query-строки в
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщике</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Format, validate and explore JSON online</h2>
        <p>
          This free <strong>JSON formatter and validator</strong> beautifies messy
          JSON into clean, indented text, flags syntax errors with the exact line
          and column, and lets you browse the structure in a collapsible tree.
          It is built for developers who paste API responses, log lines and config
          files dozens of times a day and just want them readable.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your JSON is
          never sent to a server, so it is safe to use with tokens, internal API
          payloads and other sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste or type your JSON into the editor — it is validated as you type.</li>
          <li>Click <code>Format / Beautify</code> to indent it (2 spaces, 4 spaces or tabs).</li>
          <li>Click <code>Minify</code> to strip whitespace for the smallest possible output.</li>
          <li>Switch to <code>Tree</code> view to expand and collapse nested objects and arrays.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>Beautify vs. minify</h2>
        <p>
          <strong>Beautifying</strong> adds indentation and line breaks so JSON is
          easy to read and diff. <strong>Minifying</strong> removes every optional
          space and newline, which is what you want when embedding JSON in a URL,
          a database column, or a network payload where size matters.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with encoded data? Try the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          decode a token with the <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>,
          or clean up query strings with the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
