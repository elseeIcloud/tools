<script setup lang="ts">
import { format } from 'sql-formatter'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Dialect = 'sql' | 'mysql' | 'postgresql' | 'tsql' | 'sqlite' | 'mariadb' | 'bigquery'
type KeywordCase = 'preserve' | 'upper' | 'lower'

const input = ref('')
const dialect = ref<Dialect>('sql')
const keywordCase = ref<KeywordCase>('upper')
const indent = ref<'2' | '4' | 'tab'>('2')

const output = ref('')
const error = ref<string | null>(null)

const indentOptions = computed(() =>
  indent.value === 'tab'
    ? { useTabs: true, tabWidth: 1 }
    : { useTabs: false, tabWidth: Number(indent.value) },
)

const isValid = computed(() => !error.value && output.value.length > 0)
const charCount = computed(() => output.value.length)

const dialects: { value: Dialect; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'tsql', label: 'SQL Server' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'bigquery', label: 'BigQuery' },
]

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        dialect: 'Диалект',
        keywordCase: 'Регистр ключевых слов',
        casePreserve: 'Как есть',
        caseUpper: 'ВЕРХНИЙ',
        caseLower: 'нижний',
        indent: 'Отступ',
        spaces2: '2 пробела',
        spaces4: '4 пробела',
        tab: 'Таб',
        valid: '✓ Отформатировано',
        invalid: '✗ Ошибка разбора SQL',
        placeholder: 'select id, name from users where active = 1;',
        outputPlaceholder: 'Отформатированный SQL появится здесь.',
      }
    : {
        dialect: 'Dialect',
        keywordCase: 'Keyword case',
        casePreserve: 'Preserve',
        caseUpper: 'UPPERCASE',
        caseLower: 'lowercase',
        indent: 'Indent',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
        tab: 'Tab',
        valid: '✓ Formatted',
        invalid: '✗ SQL parse error',
        placeholder: 'select id, name from users where active = 1;',
        outputPlaceholder: 'Formatted SQL will appear here.',
      },
)

// Pure: identical in Node prerender and the browser (sql-formatter is plain JS,
// no DOM/clock/random), so this is safe to run during static generation.
function reformat() {
  if (!input.value.trim()) {
    output.value = ''
    error.value = null
    return
  }
  try {
    output.value = format(input.value, {
      language: dialect.value,
      keywordCase: keywordCase.value,
      tabWidth: indentOptions.value.tabWidth,
      useTabs: indentOptions.value.useTabs,
    })
    error.value = null
  } catch (e) {
    output.value = ''
    error.value = e instanceof Error ? e.message : String(e)
  }
}

watch([input, dialect, keywordCase, indent], reformat, { immediate: true })

function clear() {
  input.value = ''
}

const sample =
  'select id,name,email from users u join orders o on o.user_id=u.id where u.active=1 and o.total>100 order by o.created_at desc limit 10;'

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my SQL sent to a server?',
    a: 'No. The formatter parses and pretty-prints your query entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so it is safe to use with proprietary queries, schema names or production statements.',
  },
  {
    q: 'Which SQL dialects are supported?',
    a: 'You can choose Standard SQL, MySQL, PostgreSQL, SQL Server (T-SQL), SQLite, MariaDB or BigQuery. Picking the right dialect lets the formatter understand dialect-specific keywords and functions and lay them out correctly.',
  },
  {
    q: 'What does the keyword-case option do?',
    a: 'It controls how reserved words like SELECT, FROM and WHERE are written. "Preserve" keeps your original casing, "UPPERCASE" makes keywords stand out from identifiers, and "lowercase" suits teams that prefer all-lowercase SQL.',
  },
  {
    q: 'Does formatting change what my query does?',
    a: 'No. The formatter only adjusts whitespace, indentation and keyword casing — it never rewrites logic, reorders clauses or touches your data. The reformatted query is equivalent to the original.',
  },
  {
    q: 'Why do I get a parse error?',
    a: 'The tool needs syntactically reasonable SQL to lay it out. Incomplete statements, unbalanced parentheses or quotes, or syntax from a different dialect can trigger an error. Switch to the matching dialect or fix the snippet and it will format again.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой SQL на сервер?',
    a: 'Нет. Форматтер разбирает и оформляет запрос полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для закрытых запросов, названий схем и боевых выражений.',
  },
  {
    q: 'Какие диалекты SQL поддерживаются?',
    a: 'Можно выбрать Standard SQL, MySQL, PostgreSQL, SQL Server (T-SQL), SQLite, MariaDB или BigQuery. Правильный диалект позволяет форматтеру распознавать специфичные ключевые слова и функции и расставлять их корректно.',
  },
  {
    q: 'Что делает опция регистра ключевых слов?',
    a: 'Она задаёт, как пишутся зарезервированные слова вроде SELECT, FROM и WHERE. «Как есть» сохраняет ваш исходный регистр, «ВЕРХНИЙ» выделяет ключевые слова на фоне идентификаторов, а «нижний» подойдёт командам, которые предпочитают SQL в нижнем регистре.',
  },
  {
    q: 'Меняет ли форматирование смысл запроса?',
    a: 'Нет. Форматтер меняет только пробелы, отступы и регистр ключевых слов — он не переписывает логику, не переставляет части запроса и не трогает данные. Результат полностью эквивалентен исходному запросу.',
  },
  {
    q: 'Почему появляется ошибка разбора?',
    a: 'Чтобы оформить запрос, инструменту нужен синтаксически разумный SQL. Незавершённые выражения, непарные скобки или кавычки, а также синтаксис другого диалекта могут вызвать ошибку. Выберите подходящий диалект или поправьте фрагмент — и форматирование снова сработает.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="sql-formatter" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="reformat">{{ t('common.format') }}</button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.dialect }}
        <select v-model="dialect" class="field !w-auto !py-1.5" :aria-label="ui.dialect">
          <option v-for="d in dialects" :key="d.value" :value="d.value">{{ d.label }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.keywordCase }}
        <select v-model="keywordCase" class="field !w-auto !py-1.5" :aria-label="ui.keywordCase">
          <option value="preserve">{{ ui.casePreserve }}</option>
          <option value="upper">{{ ui.caseUpper }}</option>
          <option value="lower">{{ ui.caseLower }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
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
        <CopyButton :text="() => output" />
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

    <!-- Editor panes -->
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <div>
        <span class="label">{{ t('common.input') }}</span>
        <textarea
          v-model="input"
          class="textarea-code min-h-[20rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
          aria-label="SQL"
        />
      </div>
      <div>
        <span class="label">{{ t('common.output') }}</span>
        <textarea
          :value="output"
          readonly
          class="textarea-code min-h-[20rem]"
          spellcheck="false"
          :placeholder="ui.outputPlaceholder"
          :aria-label="t('common.output')"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Форматирование и красивое оформление SQL онлайн</h2>
        <p>
          Этот бесплатный <strong>форматтер SQL</strong> превращает сжатые в одну
          строку запросы в аккуратный, читаемый код с отступами, переносами строк
          и единым регистром ключевых слов. Поддерживаются диалекты MySQL,
          PostgreSQL, SQL Server, SQLite, MariaDB, BigQuery и стандартный SQL,
          поэтому специфичный синтаксис вашей СУБД оформляется правильно.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш SQL не
          отправляется на сервер, поэтому инструмент безопасен для запросов с
          названиями таблиц, схем и боевых выражений.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте или введите SQL слева — результат форматируется на лету.</li>
          <li>Выберите <code>Диалект</code> своей базы данных для точного разбора.</li>
          <li>Задайте <code>Регистр ключевых слов</code>: как есть, ВЕРХНИЙ или нижний.</li>
          <li>Выберите <code>Отступ</code> — 2, 4 пробела или таб.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать результат, или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Зачем нужен единый стиль SQL</h2>
        <p>
          Запросы, склеенные в одну строку или собранные из кода, тяжело читать и
          проверять на code review. Последовательные отступы и регистр ключевых
          слов делают видимыми <code>JOIN</code>, <code>WHERE</code> и подзапросы,
          упрощают сравнение версий в diff и помогают быстрее замечать ошибки.
          Форматтер меняет только оформление — логика и результат запроса остаются
          прежними.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Приводите в порядок другие форматы? Используйте
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink>,
          оформите разметку в <NuxtLink :to="localePath('/xml-formatter')">форматтере XML</NuxtLink>
          или преобразуйте данные в
          <NuxtLink :to="localePath('/json-to-yaml')">конвертере JSON в YAML</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Format and beautify SQL online</h2>
        <p>
          This free <strong>SQL formatter</strong> turns queries crammed onto a
          single line into clean, readable code with proper indentation, line
          breaks and consistent keyword casing. It supports the MySQL, PostgreSQL,
          SQL Server, SQLite, MariaDB, BigQuery and standard SQL dialects, so the
          syntax specific to your database is laid out correctly.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your SQL is
          never sent to a server, so it is safe to use with queries that contain
          table names, schema names and production statements.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste or type your SQL on the left — it is formatted as you type.</li>
          <li>Pick the <code>Dialect</code> of your database for accurate parsing.</li>
          <li>Set the <code>Keyword case</code>: preserve, UPPERCASE or lowercase.</li>
          <li>Choose the <code>Indent</code> — 2 spaces, 4 spaces or a tab.</li>
          <li>Click <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>Why a consistent SQL style matters</h2>
        <p>
          Queries glued onto one line or assembled from code are hard to read and
          review. Consistent indentation and keyword casing make
          <code>JOIN</code>s, <code>WHERE</code> clauses and subqueries stand out,
          keep diffs clean, and help you spot mistakes faster. The formatter only
          changes the presentation — the logic and the result of the query stay
          exactly the same.
        </p>

        <h2>Related tools</h2>
        <p>
          Tidying up other formats? Use the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>,
          beautify markup in the <NuxtLink :to="localePath('/xml-formatter')">XML formatter</NuxtLink>,
          or convert data with the
          <NuxtLink :to="localePath('/json-to-yaml')">JSON to YAML converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
