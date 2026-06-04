<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// --- Inputs (explicit + fixed defaults => fully deterministic, SSG-safe) -----
const pattern = ref('')
const testString = ref('')
const replacement = ref('')
const showReplace = ref(false)

// Flag toggles. `g` is offered to the user, but match iteration always uses an
// internal `g`-flagged copy so the table never depends on this checkbox.
const flags = reactive({
  g: true,
  i: false,
  m: false,
  s: false,
  u: false,
  y: false,
})

const flagOrder = ['g', 'i', 'm', 's', 'u', 'y'] as const
type FlagKey = (typeof flagOrder)[number]

const flagString = computed(() => flagOrder.filter((f) => flags[f]).join(''))

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        pattern: 'Шаблон (regex)',
        patternPlaceholder: 'например \\d+',
        testTitle: 'Тестовая строка',
        testPlaceholder: 'Вставьте сюда текст для проверки…',
        replaceToggle: 'Замена',
        replacement: 'Строка замены',
        replacementPlaceholder: 'например [$&]',
        replaceResult: 'Результат замены',
        valid: '✓ Корректный шаблон',
        invalid: '✗ Некорректный шаблон',
        matches: 'совпадений',
        match: 'совпадение',
        highlighted: 'Подсветка совпадений',
        noMatches: 'Совпадений не найдено.',
        startHint: 'Введите шаблон и тестовую строку, чтобы увидеть совпадения.',
        table: 'Совпадения',
        colNum: '#',
        colMatch: 'Совпадение',
        colIndex: 'Индекс',
        colGroups: 'Группы захвата',
        named: 'Именованные группы',
        noGroups: '—',
        flagsLabel: 'Флаги',
        flagTitles: {
          g: 'g — глобальный поиск (все совпадения)',
          i: 'i — без учёта регистра',
          m: 'm — многострочный режим (^ и $ на каждой строке)',
          s: 's — точка соответствует переводу строки',
          u: 'u — режим Unicode',
          y: 'y — «липкий» поиск с позиции lastIndex',
        },
      }
    : {
        pattern: 'Pattern (regex)',
        patternPlaceholder: 'e.g. \\d+',
        testTitle: 'Test string',
        testPlaceholder: 'Paste the text to test against…',
        replaceToggle: 'Replace',
        replacement: 'Replacement string',
        replacementPlaceholder: 'e.g. [$&]',
        replaceResult: 'Replace result',
        valid: '✓ Valid pattern',
        invalid: '✗ Invalid pattern',
        matches: 'matches',
        match: 'match',
        highlighted: 'Match highlighting',
        noMatches: 'No matches found.',
        startHint: 'Enter a pattern and a test string to see matches.',
        table: 'Matches',
        colNum: '#',
        colMatch: 'Match',
        colIndex: 'Index',
        colGroups: 'Capture groups',
        named: 'Named groups',
        noGroups: '—',
        flagsLabel: 'Flags',
        flagTitles: {
          g: 'g — global search (all matches)',
          i: 'i — case-insensitive',
          m: 'm — multiline (^ and $ match line boundaries)',
          s: 's — dotAll (. matches newlines)',
          u: 'u — unicode mode',
          y: 'y — sticky search from lastIndex',
        },
      },
)

// --- Compile the regex. Catch the constructor error; never throw. ------------
// The user-facing iteration regex always includes `g` so matchAll/exec loops
// terminate, regardless of the visible `g` checkbox.
const compiled = computed<{ re: RegExp; error: null } | { re: null; error: string }>(() => {
  if (!pattern.value) return { re: null, error: '' }
  // Force `g` for iteration; keep the other user flags. Drop a duplicate `g`.
  const iterFlags = flagOrder.filter((f) => f !== 'g' && flags[f]).join('') + 'g'
  try {
    return { re: new RegExp(pattern.value, iterFlags), error: null }
  } catch (e) {
    return { re: null, error: e instanceof Error ? e.message : String(e) }
  }
})

const error = computed(() => (compiled.value.error ? compiled.value.error : null))
const hasPattern = computed(() => pattern.value.length > 0)

interface MatchInfo {
  full: string
  index: number
  groups: (string | undefined)[]
  named: Record<string, string | undefined>
}

// Single pure pass: collect every match. We construct with `g` above, so we
// drive a manual exec() loop and guard against zero-length matches by
// bumping lastIndex by one when a match consumed no characters.
const matches = computed<MatchInfo[]>(() => {
  const re = compiled.value.re
  const text = testString.value
  if (!re || !text) return []

  const out: MatchInfo[] = []
  re.lastIndex = 0
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = re.exec(text)) !== null) {
    out.push({
      full: m[0],
      index: m.index,
      groups: m.slice(1),
      named: m.groups ? { ...m.groups } : {},
    })
    // Zero-length match: advance manually so we don't loop forever.
    if (m.index === re.lastIndex) re.lastIndex++
    // Hard cap as a final safety net for pathological inputs.
    if (++guard > 100000) break
  }
  return out
})

const matchCount = computed(() => matches.value.length)

// --- Highlighted test string (HTML, built from safe escaped segments) --------
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Build highlighted HTML by walking the (already computed) matches in order.
// Only matched ranges are wrapped in <mark>; everything is HTML-escaped first,
// so user text/patterns can never inject markup.
const highlightedHtml = computed(() => {
  const text = testString.value
  if (!text) return ''
  if (!matches.value.length) return escapeHtml(text)

  let html = ''
  let cursor = 0
  for (const m of matches.value) {
    if (m.index < cursor) continue // skip any overlap defensively
    html += escapeHtml(text.slice(cursor, m.index))
    const matchText = text.slice(m.index, m.index + m.full.length)
    // A zero-length match has nothing to wrap; show a thin marker instead.
    if (matchText.length === 0) {
      html += '<mark class="rt-mark rt-empty" aria-hidden="true"></mark>'
    } else {
      html += '<mark class="rt-mark">' + escapeHtml(matchText) + '</mark>'
    }
    cursor = m.index + m.full.length
  }
  html += escapeHtml(text.slice(cursor))
  return html
})

// --- Live replace result (uses the user's exact flag string) -----------------
const replaceResult = computed(() => {
  if (!showReplace.value) return ''
  if (!compiled.value.re || !testString.value) return ''
  try {
    // Re-build with the user's visible flags so non-global replace matches
    // their expectation (one replacement when `g` is off).
    const re = new RegExp(pattern.value, flagString.value)
    return testString.value.replace(re, replacement.value)
  } catch {
    return ''
  }
})

function clear() {
  pattern.value = ''
  testString.value = ''
  replacement.value = ''
}

function loadSample() {
  pattern.value = '(\\w+)@(\\w+)\\.(\\w+)'
  testString.value =
    'Contact us: ada@example.com or grace@dev.io.\nInvalid: not-an-email, foo@bar (no TLD).'
  flags.g = true
  flags.i = true
  flags.m = false
  flags.s = false
  flags.u = false
  flags.y = false
  showReplace.value = true
  replacement.value = '<$1 at $2 dot $3>'
}

function groupsText(m: MatchInfo): string {
  if (!m.groups.length) return ui.value.noGroups
  return m.groups.map((g, i) => `$${i + 1}=${g === undefined ? '∅' : JSON.stringify(g)}`).join('  ')
}

function namedText(m: MatchInfo): string {
  const keys = Object.keys(m.named)
  if (!keys.length) return ''
  return keys.map((k) => `${k}=${m.named[k] === undefined ? '∅' : JSON.stringify(m.named[k])}`).join('  ')
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my pattern or test text sent to a server?',
    a: 'No. The regular expression is compiled and run entirely in your browser with the native JavaScript RegExp engine. Nothing you type — the pattern, the test string or the replacement — is uploaded, logged or stored.',
  },
  {
    q: 'Which regex flavor does this use?',
    a: 'It uses the JavaScript (ECMAScript) regex engine, the same one in Node.js and every browser. That means JavaScript syntax for groups, lookarounds and the g, i, m, s, u and y flags. PCRE-only features like recursion or possessive quantifiers are not available.',
  },
  {
    q: 'What do the g, i, m, s, u and y flags do?',
    a: 'g finds all matches instead of just the first, i makes matching case-insensitive, m lets ^ and $ match at line breaks, s lets the dot match newlines, u enables full Unicode mode, and y (sticky) anchors each match at the previous lastIndex. The match table always lists every match regardless of the g checkbox.',
  },
  {
    q: 'Why does my pattern match an empty string?',
    a: 'Quantifiers like * or ? and alternations can match zero characters. A zero-length match is valid and is shown in the table, but the tester advances past it by one position so the search cannot loop forever on the same spot.',
  },
  {
    q: 'How do capture groups and named groups appear?',
    a: 'Each row shows the full match, its index in the text, the numbered capture groups ($1, $2, …) and any named groups written as (?<name>…). A group that did not participate in the match is shown as empty (∅).',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мой шаблон и тестовый текст на сервер?',
    a: 'Нет. Регулярное выражение компилируется и выполняется полностью в браузере встроенным движком RegExp JavaScript. Ничего из введённого — ни шаблон, ни тестовая строка, ни строка замены — не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Какой диалект regex используется?',
    a: 'Используется движок regex JavaScript (ECMAScript) — тот же, что в Node.js и каждом браузере. Это значит синтаксис JavaScript для групп, lookaround и флагов g, i, m, s, u и y. Возможности, специфичные для PCRE (рекурсия, ревнивые квантификаторы), недоступны.',
  },
  {
    q: 'Что делают флаги g, i, m, s, u и y?',
    a: 'g ищет все совпадения, а не только первое; i выключает учёт регистра; m позволяет ^ и $ совпадать на границах строк; s даёт точке совпадать с переводом строки; u включает полный режим Unicode; y (sticky) привязывает совпадение к предыдущему lastIndex. Таблица совпадений всегда показывает все совпадения независимо от флажка g.',
  },
  {
    q: 'Почему мой шаблон совпадает с пустой строкой?',
    a: 'Квантификаторы вроде * и ? и альтернации могут совпасть с нулём символов. Совпадение нулевой длины корректно и показывается в таблице, но тестер сдвигается за него на одну позицию, чтобы поиск не зациклился на одном месте.',
  },
  {
    q: 'Как отображаются группы захвата и именованные группы?',
    a: 'Каждая строка показывает полное совпадение, его индекс в тексте, нумерованные группы ($1, $2, …) и любые именованные группы вида (?<name>…). Группа, не участвовавшая в совпадении, показывается как пустая (∅).',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="regex-tester" :faq="faq">
    <!-- Pattern + flags -->
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-[16rem] flex-1">
        <label class="label" for="rt-pattern">{{ ui.pattern }}</label>
        <div class="flex items-center gap-1.5 font-mono">
          <span class="text-ink-400">/</span>
          <input
            id="rt-pattern"
            v-model="pattern"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            :placeholder="ui.patternPlaceholder"
            :aria-label="ui.pattern"
          >
          <span class="whitespace-nowrap text-ink-400">/{{ flagString }}</span>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Flag checkboxes -->
    <div class="mt-3">
      <span class="label">{{ ui.flagsLabel }}</span>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="f in flagOrder"
          :key="f"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-sm font-medium transition-colors dark:border-ink-700"
          :class="flags[f] ? 'border-accent bg-accent/10 text-accent' : 'text-ink-600 dark:text-ink-300'"
          :title="ui.flagTitles[f]"
        >
          <input v-model="flags[f]" type="checkbox" class="sr-only">
          <span class="font-mono">{{ f }}</span>
        </label>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] flex-wrap items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ error }}</span>
      </template>
      <template v-else-if="hasPattern && testString">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="text-ink-400">
          · {{ matchCount.toLocaleString() }}
          {{ matchCount === 1 ? ui.match : ui.matches }}
        </span>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Test string -->
    <div class="mt-3">
      <label class="label" for="rt-test">{{ ui.testTitle }}</label>
      <textarea
        id="rt-test"
        v-model="testString"
        class="textarea-code min-h-[12rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.testPlaceholder"
        :aria-label="ui.testTitle"
      />
    </div>

    <!-- Replacement (optional) -->
    <div class="mt-4">
      <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-300">
        <input v-model="showReplace" type="checkbox" class="h-4 w-4 rounded border-ink-300 text-accent">
        {{ ui.replaceToggle }}
      </label>

      <div v-if="showReplace" class="mt-2 grid gap-3">
        <div>
          <label class="label" for="rt-replace">{{ ui.replacement }}</label>
          <input
            id="rt-replace"
            v-model="replacement"
            class="field font-mono"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :placeholder="ui.replacementPlaceholder"
            :aria-label="ui.replacement"
          >
        </div>
        <div v-if="hasPattern && testString && !error">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="label !mb-0">{{ ui.replaceResult }}</span>
            <CopyButton :text="() => replaceResult" small />
          </div>
          <pre class="overflow-auto whitespace-pre-wrap break-words rounded-lg border border-ink-200 bg-white p-3 font-mono text-[13px] leading-6 dark:border-ink-700 dark:bg-ink-950">{{ replaceResult }}</pre>
        </div>
      </div>
    </div>

    <!-- Highlighted matches -->
    <div v-if="hasPattern && testString && !error" class="mt-5">
      <span class="label">{{ ui.highlighted }}</span>
      <!-- highlightedHtml is built from HTML-escaped segments only; matches are wrapped in <mark>. -->
      <pre
        class="overflow-auto whitespace-pre-wrap break-words rounded-lg border border-ink-200 bg-white p-3 font-mono text-[13px] leading-6 dark:border-ink-700 dark:bg-ink-950"
        v-html="highlightedHtml"
      />
    </div>

    <!-- Match table -->
    <div v-if="hasPattern && testString && !error && matchCount" class="mt-5">
      <span class="label">{{ ui.table }}</span>
      <div class="overflow-auto rounded-lg border border-ink-200 dark:border-ink-700">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500 dark:bg-ink-900 dark:text-ink-400">
              <th class="px-3 py-2 font-medium">{{ ui.colNum }}</th>
              <th class="px-3 py-2 font-medium">{{ ui.colMatch }}</th>
              <th class="px-3 py-2 font-medium">{{ ui.colIndex }}</th>
              <th class="px-3 py-2 font-medium">{{ ui.colGroups }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(m, i) in matches"
              :key="i"
              :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
            >
              <td class="px-3 py-2 font-mono text-ink-400">{{ i + 1 }}</td>
              <td class="px-3 py-2 font-mono text-ink-700 dark:text-ink-200">
                <span v-if="m.full.length">{{ m.full }}</span>
                <span v-else class="text-ink-400">({{ ui.match }} ∅)</span>
              </td>
              <td class="px-3 py-2 font-mono text-ink-500 dark:text-ink-400">{{ m.index }}</td>
              <td class="px-3 py-2 font-mono text-ink-600 dark:text-ink-300">
                <div>{{ groupsText(m) }}</div>
                <div v-if="namedText(m)" class="mt-0.5 text-ink-500 dark:text-ink-400">
                  {{ ui.named }}: {{ namedText(m) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No matches notice -->
    <div
      v-else-if="hasPattern && testString && !error && !matchCount"
      class="mt-5 rounded-lg border border-ink-200 bg-white p-3 text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-400"
    >
      {{ ui.noMatches }}
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Тестер регулярных выражений онлайн</h2>
        <p>
          Этот бесплатный <strong>тестер regex</strong> компилирует ваше
          регулярное выражение и прогоняет его по тестовой строке прямо во время
          ввода. Вы сразу видите общее число совпадений, текст с подсвеченными
          совпадениями и таблицу, где для каждого совпадения указаны индекс,
          нумерованные группы захвата и именованные группы. Инструмент сделан
          для разработчиков, которые отлаживают шаблоны для валидации, парсинга
          логов или поиска с заменой.
        </p>
        <p>
          Всё вычисляется <strong>полностью в браузере</strong> встроенным
          движком RegExp JavaScript. Ни шаблон, ни тестовый текст не
          отправляются на сервер, поэтому инструмент безопасен для внутренних
          логов и других конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите шаблон в поле <code>/.../</code> — например <code>\d+</code>.</li>
          <li>Включите нужные флаги: <code>g</code>, <code>i</code>, <code>m</code>, <code>s</code>, <code>u</code>, <code>y</code>.</li>
          <li>Вставьте текст в поле <code>Тестовая строка</code> — совпадения подсветятся сразу.</li>
          <li>Откройте <code>Замена</code>, чтобы увидеть живой результат <code>replace()</code> со ссылками <code>$1</code>, <code>$&amp;</code> и <code>$&lt;name&gt;</code>.</li>
          <li>Нажмите <code>Пример</code> для готового шаблона или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Совпадения, группы и нулевая длина</h2>
        <p>
          Таблица всегда перечисляет <strong>все</strong> совпадения: внутри
          итерация всегда идёт с флагом <code>g</code>, поэтому результат не
          зависит от флажка <code>g</code> в интерфейсе. Нумерованные группы
          (<code>$1</code>, <code>$2</code>) и именованные группы вида
          <code>(?&lt;year&gt;\d{4})</code> показываются отдельно; группа, не
          участвовавшая в совпадении, помечается как <code>∅</code>. Совпадения
          <strong>нулевой длины</strong> (например от <code>a*</code>) корректны:
          тестер сдвигает <code>lastIndex</code> на одну позицию, чтобы поиск не
          зациклился. Некорректный шаблон не роняет страницу — конструктор
          <code>RegExp</code> перехватывается, и вы видите красный статус с
          текстом ошибки.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно подготовить строку для шаблона? Экранируйте спецсимволы в
          <NuxtLink :to="localePath('/string-escaper')">экранировании строк</NuxtLink>,
          посчитайте символы и строки в
          <NuxtLink :to="localePath('/text-counter')">счётчике текста</NuxtLink>
          или сравните два варианта текста в
          <NuxtLink :to="localePath('/diff-checker')">diff-чекере</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online regular expression tester</h2>
        <p>
          This free <strong>regex tester</strong> compiles your regular
          expression and runs it against your test string as you type. You
          immediately see the total match count, the text with matches
          highlighted, and a table that lists each match with its index,
          numbered capture groups and named groups. It is built for developers
          who are debugging patterns for validation, log parsing or
          search-and-replace.
        </p>
        <p>
          Everything is computed <strong>entirely in your browser</strong> with
          the native JavaScript RegExp engine. Neither the pattern nor the test
          text is sent to a server, so it is safe to use with internal logs and
          other sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a pattern into the <code>/.../</code> field — for example <code>\d+</code>.</li>
          <li>Toggle the flags you need: <code>g</code>, <code>i</code>, <code>m</code>, <code>s</code>, <code>u</code>, <code>y</code>.</li>
          <li>Paste text into <code>Test string</code> — matches highlight instantly.</li>
          <li>Open <code>Replace</code> to see a live <code>replace()</code> result with <code>$1</code>, <code>$&amp;</code> and <code>$&lt;name&gt;</code> references.</li>
          <li>Hit <code>Sample</code> for a ready pattern, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>Matches, groups and zero-length</h2>
        <p>
          The table always lists <strong>every</strong> match: iteration
          internally always uses the <code>g</code> flag, so the result does not
          depend on the <code>g</code> checkbox in the UI. Numbered groups
          (<code>$1</code>, <code>$2</code>) and named groups like
          <code>(?&lt;year&gt;\d{4})</code> are shown separately; a group that
          did not participate in a match is marked <code>∅</code>.
          <strong>Zero-length</strong> matches (for instance from
          <code>a*</code>) are valid: the tester advances <code>lastIndex</code>
          by one so the search cannot loop forever. An invalid pattern never
          crashes the page — the <code>RegExp</code> constructor error is caught
          and shown as a red status with the error message.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to prepare a string for a pattern? Escape special characters in
          the <NuxtLink :to="localePath('/string-escaper')">string escaper</NuxtLink>,
          count characters and lines in the
          <NuxtLink :to="localePath('/text-counter')">text counter</NuxtLink>,
          or compare two versions of text in the
          <NuxtLink :to="localePath('/diff-checker')">diff checker</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>

<style scoped>
:deep(.rt-mark) {
  background-color: rgb(250 204 21 / 0.45);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
:deep(.rt-empty) {
  display: inline-block;
  width: 2px;
  padding: 0;
  background-color: rgb(239 68 68 / 0.6);
}
</style>
