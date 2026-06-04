<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const style = ref<'interface' | 'type'>('interface')
const optionalMissing = ref(true)
const nullAsOptional = ref(false)
const rootName = ref('Root')

const output = ref('')
const error = ref<string | null>(null)
const errorLoc = ref<{ line: number; col: number } | null>(null)

const hasOutput = computed(() => !error.value && output.value.length > 0)
const lineCount = computed(() => (output.value ? output.value.split('\n').length : 0))

// Tool-specific labels (common verbs come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        style: 'Вывод',
        interface: 'interface',
        type: 'type',
        rootName: 'Имя корневого типа',
        optionalMissing: 'Помечать отсутствующие ключи как необязательные (?)',
        nullAsOptional: 'Считать null необязательным',
        invalid: '✗ Некорректный JSON',
        line: 'строка',
        column: 'столбец',
        placeholder: '{ "id": 1, "name": "Ада" }',
        outputAria: 'Сгенерированный TypeScript',
        startHint: 'Вставьте JSON слева, чтобы получить типы TypeScript.',
        lines: 'строк',
      }
    : {
        style: 'Output',
        interface: 'interface',
        type: 'type',
        rootName: 'Root type name',
        optionalMissing: 'Mark missing keys as optional (?)',
        nullAsOptional: 'Treat null as optional',
        invalid: '✗ Invalid JSON',
        line: 'line',
        column: 'column',
        placeholder: '{ "id": 1, "name": "Ada" }',
        outputAria: 'Generated TypeScript',
        startHint: 'Paste JSON on the left to get TypeScript types.',
        lines: 'lines',
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

// --- Self-contained TypeScript inferencer (pure, no dependency) ---

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function pascalCase(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, ' ').trim()
  if (!cleaned) return 'Field'
  const pascal = cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
  // A TypeScript identifier must not start with a digit.
  return /^[0-9]/.test(pascal) ? `Field${pascal}` : pascal
}

// A valid, bare property key needs no quotes; otherwise quote it.
function formatKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}

interface InferContext {
  // Generated interface/type blocks, keyed by the structural signature so that
  // identical object shapes are deduplicated into a single named declaration.
  blocks: Map<string, { name: string; body: string }>
  // Names already taken, to avoid collisions when two keys map to the same name.
  used: Set<string>
}

function uniqueName(base: string, ctx: InferContext): string {
  let name = base
  let i = 2
  while (ctx.used.has(name)) {
    name = `${base}${i}`
    i++
  }
  ctx.used.add(name)
  return name
}

// Merge the union of types found across array elements / sibling values.
function unionTypes(types: string[]): string {
  const seen: string[] = []
  for (const ty of types) {
    if (!seen.includes(ty)) seen.push(ty)
  }
  if (seen.length === 0) return 'unknown'
  if (seen.length === 1) return seen[0]!
  return seen.join(' | ')
}

function inferType(value: unknown, suggestedName: string, ctx: InferContext): string {
  if (value === null) return 'null'
  const kind = typeof value
  if (kind === 'string') return 'string'
  if (kind === 'number') return 'number'
  if (kind === 'boolean') return 'boolean'

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    // Singularize a plural-ish array name for nested element interfaces.
    const elementName = suggestedName.endsWith('s')
      ? suggestedName.slice(0, -1)
      : suggestedName
    const elementTypes = value.map((item) => inferType(item, elementName, ctx))
    const union = unionTypes(elementTypes)
    // Parenthesize unions inside an array type for correct precedence.
    return union.includes(' | ') ? `(${union})[]` : `${union}[]`
  }

  if (isPlainObject(value)) {
    return inferObject(value, suggestedName, ctx)
  }

  return 'unknown'
}

function inferObject(
  obj: Record<string, unknown>,
  suggestedName: string,
  ctx: InferContext,
): string {
  const keys = Object.keys(obj)
  const lines: string[] = []
  for (const key of keys) {
    const v = obj[key]
    let propType = inferType(v, pascalCase(key), ctx)
    let optional = ''
    if (nullAsOptional.value && v === null) {
      optional = '?'
      propType = 'null'
    }
    lines.push(`  ${formatKey(key)}${optional}: ${propType};`)
  }
  const body = lines.join('\n')
  // Deduplicate structurally identical objects under one declaration.
  const signature = body
  const existing = ctx.blocks.get(signature)
  if (existing) return existing.name

  const name = uniqueName(pascalCase(suggestedName), ctx)
  ctx.blocks.set(signature, { name, body })
  return name
}

// When the same key appears in several array elements, build a merged object
// type whose properties become optional if missing from some elements.
function preprocessArraysOfObjects(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((v) => preprocessArraysOfObjects(v))
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value)) out[k] = preprocessArraysOfObjects(value[k])
    return out
  }
  return value
}

// Build a single merged shape for an array of objects, tracking which keys are
// present in every element (required) vs only some (optional).
interface MergedObject {
  props: Map<string, { types: unknown[]; presentCount: number }>
  total: number
}

function mergeObjectArray(arr: Record<string, unknown>[]): MergedObject {
  const props = new Map<string, { types: unknown[]; presentCount: number }>()
  for (const item of arr) {
    for (const key of Object.keys(item)) {
      let entry = props.get(key)
      if (!entry) {
        entry = { types: [], presentCount: 0 }
        props.set(key, entry)
      }
      entry.types.push(item[key])
      entry.presentCount++
    }
  }
  return { props, total: arr.length }
}

function inferMergedArray(
  arr: Record<string, unknown>[],
  suggestedName: string,
  ctx: InferContext,
): string {
  const merged = mergeObjectArray(arr)
  const lines: string[] = []
  for (const [key, entry] of merged.props) {
    const types = entry.types.map((v) => inferType(v, pascalCase(key), ctx))
    const union = unionTypes(types)
    const missing = optionalMissing.value && entry.presentCount < merged.total
    lines.push(`  ${formatKey(key)}${missing ? '?' : ''}: ${union};`)
  }
  const body = lines.join('\n')
  const existing = ctx.blocks.get(body)
  if (existing) return existing.name
  const name = uniqueName(pascalCase(suggestedName), ctx)
  ctx.blocks.set(body, { name, body })
  return name
}

function inferRoot(value: unknown, name: string): string {
  const ctx: InferContext = { blocks: new Map(), used: new Set() }
  const root = pascalCase(name) || 'Root'

  let rootDecl = ''

  if (isPlainObject(value)) {
    // Force the root object onto the requested name.
    ctx.used.add(root)
    const lines: string[] = []
    for (const key of Object.keys(value)) {
      const v = value[key]
      let propType = inferType(v, pascalCase(key), ctx)
      let optional = ''
      if (nullAsOptional.value && v === null) {
        optional = '?'
        propType = 'null'
      }
      lines.push(`  ${formatKey(key)}${optional}: ${propType};`)
    }
    const body = lines.join('\n')
    rootDecl = declare(root, body)
  } else if (Array.isArray(value)) {
    ctx.used.add(root)
    if (value.length > 0 && value.every((v) => isPlainObject(v))) {
      const elemName = root.endsWith('s') ? root.slice(0, -1) : `${root}Item`
      const elemType = inferMergedArray(value as Record<string, unknown>[], elemName, ctx)
      rootDecl = aliasArray(root, elemType)
    } else {
      const elemTypes = value.map((v) => inferType(v, root, ctx))
      const union = unionTypes(elemTypes)
      const arrType = value.length === 0
        ? 'unknown[]'
        : union.includes(' | ')
          ? `(${union})[]`
          : `${union}[]`
      rootDecl = `export type ${root} = ${arrType};`
    }
  } else {
    const prim = inferType(value, root, ctx)
    rootDecl = `export type ${root} = ${prim};`
  }

  // Emit nested declarations first (in insertion order), root last for readability.
  const parts: string[] = []
  for (const { name: n, body } of ctx.blocks.values()) {
    parts.push(declare(n, body))
  }
  parts.push(rootDecl)
  return parts.join('\n\n')
}

function declare(name: string, body: string): string {
  if (style.value === 'type') {
    return body
      ? `export type ${name} = {\n${body}\n};`
      : `export type ${name} = {};`
  }
  return body
    ? `export interface ${name} {\n${body}\n}`
    : `export interface ${name} {}`
}

function aliasArray(name: string, elemType: string): string {
  const t = elemType.includes(' | ') ? `(${elemType})[]` : `${elemType}[]`
  return `export type ${name} = ${t};`
}

function convert() {
  const text = input.value
  if (!text.trim()) {
    output.value = ''
    error.value = null
    errorLoc.value = null
    return
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    output.value = ''
    error.value = msg
    errorLoc.value = locateError(text, msg)
    return
  }
  error.value = null
  errorLoc.value = null
  try {
    const prepared = preprocessArraysOfObjects(parsed)
    output.value = inferRoot(prepared, rootName.value.trim() || 'Root')
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : String(e)
    errorLoc.value = null
  }
}

watch([input, style, optionalMissing, nullAsOptional, rootName], convert, { immediate: true })

function clear() {
  input.value = ''
}

const sample = `{
  "id": 1024,
  "name": "Ada Lovelace",
  "active": true,
  "tags": ["admin", "engineer"],
  "profile": {
    "city": "London",
    "age": 36,
    "verified": null
  },
  "projects": [
    { "title": "Analytical Engine", "year": 1837, "stars": 99 },
    { "title": "Notes G", "year": 1843 }
  ]
}`

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my JSON uploaded anywhere?',
    a: 'No. The converter parses your JSON and generates the TypeScript entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so it is safe to use with private API responses, configs and other sensitive payloads.',
  },
  {
    q: 'What is the difference between an interface and a type alias?',
    a: 'An interface (export interface Root {…}) can be extended and merged and reads naturally for object shapes, while a type alias (export type Root = {…}) is more flexible for unions and primitives. Pick the style your codebase prefers using the Output toggle — the generated shapes are otherwise identical.',
  },
  {
    q: 'How does it decide which fields are optional?',
    a: 'When you point it at an array of objects, the tool merges every element and marks a key with ? if it is missing from at least one element. You can also enable "Treat null as optional" so that null values become optional fields instead of a null type.',
  },
  {
    q: 'How are nested objects and arrays named?',
    a: 'Each nested object becomes its own named interface based on the PascalCase of its key, identical shapes are deduplicated into one declaration, and arrays become T[] where T is inferred from the elements. Empty arrays are typed as unknown[] and mixed element types are emitted as a union.',
  },
  {
    q: 'Why did I get an "Unexpected token" error?',
    a: 'The input must be strict, valid JSON (RFC 8259). Comments, trailing commas, single quotes and unquoted keys are not allowed and trigger a parse error with the line and column of the problem. Fix the JSON first, then the types regenerate instantly.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружается ли мой JSON куда-либо?',
    a: 'Нет. Конвертер разбирает JSON и генерирует TypeScript полностью в браузере на JavaScript. Ничего не отправляется на сервер, не логируется и не сохраняется, поэтому инструмент безопасен для приватных ответов API, конфигов и других конфиденциальных данных.',
  },
  {
    q: 'Чем interface отличается от type?',
    a: 'Интерфейс (export interface Root {…}) можно расширять и объединять, он естественно описывает форму объекта, а псевдоним type (export type Root = {…}) гибче для объединений и примитивов. Выберите привычный для вашего проекта стиль переключателем «Вывод» — сами поля при этом одинаковы.',
  },
  {
    q: 'Как определяется, какие поля необязательны?',
    a: 'Для массива объектов инструмент объединяет все элементы и помечает ключ знаком ?, если он отсутствует хотя бы в одном элементе. Можно также включить «Считать null необязательным», чтобы значения null превращались в необязательные поля, а не в тип null.',
  },
  {
    q: 'Как называются вложенные объекты и массивы?',
    a: 'Каждый вложенный объект получает собственный именованный интерфейс на основе PascalCase его ключа, одинаковые формы объединяются в одно объявление, а массивы становятся T[], где T выводится из элементов. Пустые массивы типизируются как unknown[], а смешанные элементы — как объединение.',
  },
  {
    q: 'Почему появилась ошибка «Unexpected token»?',
    a: 'На вход нужен строгий корректный JSON (RFC 8259). Комментарии, висячие запятые, одинарные кавычки и ключи без кавычек недопустимы и вызывают ошибку разбора с указанием строки и столбца. Исправьте JSON — и типы тут же сгенерируются заново.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="json-to-typescript" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.style }}
        <select v-model="style" class="field !w-auto !py-1.5" :aria-label="ui.style">
          <option value="interface">{{ ui.interface }}</option>
          <option value="type">{{ ui.type }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.rootName }}
        <input
          v-model="rootName"
          type="text"
          class="field !w-32 !py-1.5"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :aria-label="ui.rootName"
        />
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Options -->
    <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600 dark:text-ink-300">
      <label class="flex items-center gap-2">
        <input v-model="optionalMissing" type="checkbox" class="h-4 w-4 rounded border-ink-300 text-accent dark:border-ink-600" />
        {{ ui.optionalMissing }}
      </label>
      <label class="flex items-center gap-2">
        <input v-model="nullAsOptional" type="checkbox" class="h-4 w-4 rounded border-ink-300 text-accent dark:border-ink-600" />
        {{ ui.nullAsOptional }}
      </label>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">
          {{ error }}<template v-if="errorLoc"> ({{ ui.line }} {{ errorLoc.line }}, {{ ui.column }} {{ errorLoc.col }})</template>
        </span>
      </template>
      <template v-else-if="hasOutput">
        <span class="font-medium text-green-600 dark:text-green-400">TypeScript</span>
        <span class="text-ink-400">· {{ lineCount.toLocaleString() }} {{ ui.lines }}</span>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-3 lg:grid-cols-2">
      <div>
        <label class="label">{{ t('common.input') }} · JSON</label>
        <textarea
          v-model="input"
          class="textarea-code min-h-[22rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
          aria-label="JSON"
        />
      </div>
      <div>
        <div class="flex items-center justify-between">
          <label class="label">{{ t('common.output') }} · TypeScript</label>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          :value="output"
          readonly
          class="textarea-code min-h-[22rem]"
          spellcheck="false"
          :aria-label="ui.outputAria"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертация JSON в TypeScript онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер JSON в TypeScript</strong> превращает
          любой JSON-объект в готовые <strong>интерфейсы или типы</strong>: выводит
          вложенные объекты в отдельные именованные интерфейсы, определяет тип
          элементов массивов, помечает необязательные поля знаком <code>?</code> и
          распознаёт строки, числа, логические значения и <code>null</code>. Идеально,
          когда нужно быстро описать ответ API или конфиг типами вместо ручного
          набора.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш JSON не
          отправляется на сервер, поэтому им безопасно пользоваться с приватными
          ответами API, токенами и внутренними данными.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте JSON в левое поле — типы генерируются на лету.</li>
          <li>Выберите <code>interface</code> или <code>type</code> в переключателе «Вывод».</li>
          <li>Задайте имя корневого типа (по умолчанию <code>Root</code>).</li>
          <li>Включите «Помечать отсутствующие ключи как необязательные», чтобы расставить <code>?</code> для массивов объектов.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать результат, или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Как выводятся необязательные поля и массивы</h2>
        <p>
          Для массива объектов инструмент объединяет все элементы в одну форму и
          ставит <code>?</code> у ключей, которых нет хотя бы в одном элементе.
          Одинаковые вложенные объекты сводятся к одному объявлению, пустые массивы
          получают тип <code>unknown[]</code>, а массивы со смешанными элементами —
          объединение вида <code>(A | B)[]</code>. Опция «Считать null необязательным»
          превращает значения <code>null</code> в необязательные поля.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Сначала приведите данные в порядок в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>,
          переведите их в YAML с помощью
          <NuxtLink :to="localePath('/json-to-yaml')">конвертера JSON в YAML</NuxtLink>
          или выгрузите в таблицу через
          <NuxtLink :to="localePath('/json-to-csv')">конвертер JSON в CSV</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert JSON to TypeScript online</h2>
        <p>
          This free <strong>JSON to TypeScript converter</strong> turns any JSON
          object into ready-to-use <strong>interfaces or type aliases</strong>: it
          lifts nested objects into their own named interfaces, infers array element
          types, marks optional properties with <code>?</code>, and recognises
          strings, numbers, booleans and <code>null</code>. It is perfect for quickly
          typing an API response or config instead of writing the types by hand.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your JSON is
          never sent to a server, so it is safe to use with private API payloads,
          tokens and internal data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste your JSON into the left pane — the types generate as you type.</li>
          <li>Choose <code>interface</code> or <code>type</code> with the Output toggle.</li>
          <li>Set the root type name (defaults to <code>Root</code>).</li>
          <li>Enable "Mark missing keys as optional" to add <code>?</code> for arrays of objects.</li>
          <li>Click <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>How optional fields and arrays are inferred</h2>
        <p>
          For an array of objects the tool merges every element into one shape and
          adds <code>?</code> to keys that are missing from at least one element.
          Identical nested objects collapse into a single declaration, empty arrays
          are typed as <code>unknown[]</code>, and arrays with mixed elements become a
          union such as <code>(A | B)[]</code>. The "Treat null as optional" option
          converts <code>null</code> values into optional fields.
        </p>

        <h2>Related tools</h2>
        <p>
          Clean up the data first in the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>,
          convert it to YAML with the
          <NuxtLink :to="localePath('/json-to-yaml')">JSON to YAML converter</NuxtLink>,
          or export it to a spreadsheet using the
          <NuxtLink :to="localePath('/json-to-csv')">JSON to CSV converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
