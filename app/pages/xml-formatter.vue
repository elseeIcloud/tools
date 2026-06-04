<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const indent = ref<'2' | '4' | 'tab'>('2')
const error = ref<string | null>(null)

const indentUnit = computed(() =>
  indent.value === 'tab' ? '\t' : ' '.repeat(Number(indent.value)),
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
        valid: '✓ Корректный XML',
        invalid: '✗ Некорректный XML',
        placeholder: '<root>\n  <item>значение</item>\n</root>',
        errUnexpectedClose: (got: string) =>
          `Неожиданный закрывающий тег </${got}>`,
        errMismatch: (got: string, want: string) =>
          `Закрывающий тег </${got}> не соответствует открытому <${want}>`,
        errUnclosed: (name: string) => `Тег <${name}> не закрыт`,
        errUnterminated: 'Незавершённый тег: пропущен «>»',
      }
    : {
        indent: 'Indent',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
        tab: 'Tab',
        valid: '✓ Valid XML',
        invalid: '✗ Invalid XML',
        placeholder: '<root>\n  <item>value</item>\n</root>',
        errUnexpectedClose: (got: string) =>
          `Unexpected closing tag </${got}>`,
        errMismatch: (got: string, want: string) =>
          `Closing tag </${got}> does not match open <${want}>`,
        errUnclosed: (name: string) => `Tag <${name}> is never closed`,
        errUnterminated: 'Unterminated tag: missing ">"',
      },
)

type TokenKind = 'open' | 'close' | 'selfClose' | 'comment' | 'cdata' | 'pi' | 'doctype' | 'text'

interface Token {
  kind: TokenKind
  /** Raw rendered string for the token (a full tag, or collapsed text). */
  raw: string
  /** Local tag name for open/close/selfClose tokens; '' otherwise. */
  name: string
}

// Pull the element name out of a tag's inner string, e.g. "div class='x'" -> "div".
function tagName(inner: string): string {
  const m = /^([^\s/>]+)/.exec(inner.trim())
  return m ? m[1] : ''
}

// Tokenize XML into tags and the text between them. Pure string scanning —
// no DOMParser or DOM API, so it behaves identically in Node and the browser.
// Returns null on an unterminated tag (a stray '<' without a closing '>').
function tokenize(xml: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  const n = xml.length

  while (i < n) {
    if (xml[i] === '<') {
      // Comment <!-- ... -->
      if (xml.startsWith('<!--', i)) {
        const end = xml.indexOf('-->', i + 4)
        const stop = end === -1 ? n : end + 3
        tokens.push({ kind: 'comment', raw: xml.slice(i, stop), name: '' })
        i = stop
        continue
      }
      // CDATA <![CDATA[ ... ]]>
      if (xml.startsWith('<![CDATA[', i)) {
        const end = xml.indexOf(']]>', i + 9)
        const stop = end === -1 ? n : end + 3
        tokens.push({ kind: 'cdata', raw: xml.slice(i, stop), name: '' })
        i = stop
        continue
      }
      // DOCTYPE <!DOCTYPE ...> (may contain nested [...] but commonly not)
      if (xml.startsWith('<!', i)) {
        const end = xml.indexOf('>', i + 2)
        if (end === -1) return null
        tokens.push({ kind: 'doctype', raw: xml.slice(i, end + 1), name: '' })
        i = end + 1
        continue
      }
      // Processing instruction / declaration <?xml ... ?>
      if (xml.startsWith('<?', i)) {
        const end = xml.indexOf('?>', i + 2)
        const stop = end === -1 ? n : end + 2
        tokens.push({ kind: 'pi', raw: xml.slice(i, stop), name: '' })
        i = stop
        continue
      }
      // Regular tag: scan to the matching '>'.
      const end = xml.indexOf('>', i)
      if (end === -1) return null
      const raw = xml.slice(i, end + 1)
      const inner = raw.slice(1, -1)
      if (inner.startsWith('/')) {
        tokens.push({ kind: 'close', raw, name: tagName(inner.slice(1)) })
      } else if (inner.endsWith('/')) {
        tokens.push({ kind: 'selfClose', raw, name: tagName(inner) })
      } else {
        tokens.push({ kind: 'open', raw, name: tagName(inner) })
      }
      i = end + 1
    } else {
      // Text up to the next '<'.
      const next = xml.indexOf('<', i)
      const stop = next === -1 ? n : next
      const text = xml.slice(i, stop)
      // Collapse insignificant whitespace but keep non-empty content.
      const collapsed = text.replace(/\s+/g, ' ').trim()
      if (collapsed) tokens.push({ kind: 'text', raw: collapsed, name: '' })
      i = stop
    }
  }

  return tokens
}

// Pretty-print XML: one tag/text node per line at the current indent depth.
function prettyPrint(xml: string, unit: string): string {
  const tokens = tokenize(xml)
  if (!tokens) return xml
  const lines: string[] = []
  let depth = 0
  for (const tok of tokens) {
    if (tok.kind === 'close') depth = Math.max(0, depth - 1)
    lines.push(unit.repeat(depth) + tok.raw)
    if (tok.kind === 'open') depth += 1
  }
  return lines.join('\n')
}

// Minify: remove whitespace between tags without touching text inside elements.
function minifyXml(xml: string): string {
  return xml.trim().replace(/>\s+</g, '><')
}

// Lightweight well-formedness check using a stack of tag names.
// Returns an error message, or null when the document is well-formed.
function validateXml(xml: string): string | null {
  const u = ui.value
  const tokens = tokenize(xml)
  if (!tokens) return u.errUnterminated
  const stack: string[] = []
  for (const tok of tokens) {
    if (tok.kind === 'open') {
      stack.push(tok.name)
    } else if (tok.kind === 'close') {
      if (stack.length === 0) return u.errUnexpectedClose(tok.name)
      const top = stack.pop() as string
      if (top !== tok.name) return u.errMismatch(tok.name, top)
    }
    // selfClose / comment / cdata / pi / doctype / text need no stack change.
  }
  if (stack.length > 0) return u.errUnclosed(stack[stack.length - 1] as string)
  return null
}

function validate() {
  error.value = input.value.trim() ? validateXml(input.value) : null
}

watch(input, validate, { immediate: true })
// Re-run validation when locale changes so error messages stay localized.
watch(locale, validate)

function format() {
  if (validateXml(input.value)) return
  input.value = prettyPrint(input.value, indentUnit.value)
}

function minify() {
  if (validateXml(input.value)) return
  input.value = minifyXml(input.value)
}

function clear() {
  input.value = ''
}

const sample =
  "<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don't forget me this weekend!</body></note>"

function loadSample() {
  input.value = sample
}

watch(indent, () => {
  if (isValid.value) format()
})

const faqEn: FaqItem[] = [
  {
    q: 'Is my XML sent to a server?',
    a: 'No. The formatter tokenizes, indents and validates your XML entirely in your browser with JavaScript — there is no DOMParser call and no network request. Nothing is uploaded, logged or stored, so it is safe for configs, SOAP envelopes and other sensitive markup.',
  },
  {
    q: 'What does the validator actually check?',
    a: 'It is a lightweight well-formedness check: it walks the tags and keeps a stack to make sure every opening tag has a matching closing tag in the right order. It reports the first problem — an unexpected closing tag, a mismatched pair or an unclosed element. It does not validate against a DTD or XSD schema.',
  },
  {
    q: 'What is the difference between Format and Minify?',
    a: 'Format (beautify) puts each tag and text node on its own line and indents nested elements with 2 spaces, 4 spaces or a tab. Minify strips the whitespace between tags, collapsing "> <" to "><", to make the document as small as possible for transport or storage.',
  },
  {
    q: 'Does it handle comments, CDATA, declarations and DOCTYPE?',
    a: 'Yes. The tokenizer recognises XML comments, CDATA sections, processing instructions and declarations such as <?xml ... ?>, and DOCTYPE blocks, and keeps their contents intact. Whitespace inside text and CDATA is preserved; only insignificant whitespace between nodes is collapsed.',
  },
  {
    q: 'Will minifying change the meaning of my XML?',
    a: 'Minifying only removes whitespace that sits between tags, so element structure and attribute values are untouched. Be aware that in formats where whitespace is significant (for example mixed content or xml:space="preserve"), removing inter-tag whitespace can matter — keep a formatted copy if in doubt.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой XML на сервер?',
    a: 'Нет. Форматтер разбирает, отступает и проверяет XML полностью в браузере на JavaScript — без вызова DOMParser и без сетевых запросов. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для конфигов, SOAP-конвертов и другой конфиденциальной разметки.',
  },
  {
    q: 'Что именно проверяет валидатор?',
    a: 'Это лёгкая проверка корректности структуры: инструмент проходит по тегам и ведёт стек, чтобы убедиться, что у каждого открывающего тега есть парный закрывающий в правильном порядке. Он сообщает о первой проблеме — неожиданном закрывающем теге, несовпадающей паре или незакрытом элементе. Проверки по DTD или XSD-схеме не выполняются.',
  },
  {
    q: 'Чем отличается «Форматировать» от «Сжать»?',
    a: 'Форматирование (beautify) ставит каждый тег и текстовый узел на отдельную строку и делает отступы для вложенных элементов: 2 пробела, 4 пробела или таб. Минификация убирает пробелы между тегами, схлопывая «> <» в «><», чтобы документ занимал минимум места при передаче или хранении.',
  },
  {
    q: 'Поддерживаются ли комментарии, CDATA, объявления и DOCTYPE?',
    a: 'Да. Токенизатор распознаёт XML-комментарии, секции CDATA, инструкции обработки и объявления вида <?xml ... ?>, а также блоки DOCTYPE и сохраняет их содержимое без изменений. Пробелы внутри текста и CDATA сохраняются; схлопывается только незначимый пробел между узлами.',
  },
  {
    q: 'Изменит ли минификация смысл моего XML?',
    a: 'Минификация убирает только пробелы, которые находятся между тегами, поэтому структура элементов и значения атрибутов остаются нетронутыми. Учтите: в форматах со значимыми пробелами (например, смешанное содержимое или xml:space="preserve") удаление пробелов между узлами может быть важным — сохраните отформатированную копию, если сомневаетесь.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="xml-formatter" :faq="faq">
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
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => input" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ error }}</span>
      </template>
      <template v-else-if="isValid">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="text-ink-400">· {{ charCount.toLocaleString() }} {{ t('common.characters') }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Editor -->
    <div class="mt-3">
      <textarea
        v-model="input"
        class="textarea-code min-h-[20rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
        aria-label="XML"
      />
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Форматирование, минификация и проверка XML онлайн</h2>
        <p>
          Этот бесплатный <strong>форматтер и валидатор XML</strong> превращает
          плотную строку XML в аккуратный текст с отступами, проверяет структуру
          документа на корректность и сообщает о первой ошибке вложенности тегов.
          Он сделан для разработчиков, которые правят конфиги, SOAP-запросы, RSS,
          манифесты и SVG и хотят, чтобы разметка была читаемой за один клик.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Разбор выполняется
          самописным строковым токенайзером без <code>DOMParser</code> и сетевых
          запросов, поэтому ваш XML не отправляется на сервер — это безопасно для
          конфиденциальных конфигов и внутренних данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте или введите XML в редактор — корректность проверяется на лету.</li>
          <li>Нажмите <code>Форматировать</code>, чтобы расставить отступы (2, 4 пробела или таб).</li>
          <li>Нажмите <code>Сжать</code>, чтобы убрать пробелы между тегами и получить минимальный размер.</li>
          <li>Следите за строкой статуса: зелёная — XML корректен, красная — показывает первую ошибку.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Что значит «well-formed» XML</h2>
        <p>
          XML считается <strong>well-formed</strong> (корректно оформленным), когда
          каждый открывающий тег закрыт парным закрывающим в правильном порядке, а
          элементы вложены без пересечений. Валидатор ведёт стек открытых тегов: при
          встрече <code>&lt;/tag&gt;</code> он сверяет имя с вершиной стека и
          сообщает о несовпадении, неожиданном закрытии или незакрытом элементе.
          Это не то же самое, что проверка по DTD или XSD-схеме — здесь проверяется
          именно структура, а не словарь допустимых элементов.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете с другими форматами данных? Приведите в порядок JSON в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>,
          отформатируйте запросы в <NuxtLink :to="localePath('/sql-formatter')">форматтере SQL</NuxtLink>
          или преобразуйте структуры в
          <NuxtLink :to="localePath('/json-to-yaml')">конвертере JSON в YAML</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Format, minify and validate XML online</h2>
        <p>
          This free <strong>XML formatter and validator</strong> turns a dense XML
          string into clean, indented text, checks the document structure for
          correctness and reports the first tag-nesting error. It is built for
          developers who edit configs, SOAP requests, RSS, manifests and SVG and
          want readable markup in a single click.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Parsing is done
          by a hand-written string tokenizer with no <code>DOMParser</code> and no
          network request, so your XML is never sent to a server — safe for sensitive
          configs and internal data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste or type your XML into the editor — it is validated as you type.</li>
          <li>Click <code>Format / Beautify</code> to indent it (2 spaces, 4 spaces or a tab).</li>
          <li>Click <code>Minify</code> to strip whitespace between tags for the smallest output.</li>
          <li>Watch the status line: green means the XML is well-formed, red shows the first error.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>What "well-formed" XML means</h2>
        <p>
          XML is <strong>well-formed</strong> when every opening tag has a matching
          closing tag in the right order and elements nest without overlapping. The
          validator keeps a stack of open tags: when it meets a
          <code>&lt;/tag&gt;</code> it checks the name against the top of the stack and
          reports a mismatch, an unexpected close or an unclosed element. This is not
          the same as validating against a DTD or XSD schema — it checks structure
          rather than the vocabulary of allowed elements.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with other data formats? Tidy up JSON in the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>,
          beautify queries in the <NuxtLink :to="localePath('/sql-formatter')">SQL formatter</NuxtLink>,
          or convert structures with the
          <NuxtLink :to="localePath('/json-to-yaml')">JSON to YAML converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
