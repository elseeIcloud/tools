<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const order = ref<'asc' | 'desc'>('asc')
const mode = ref<'alpha' | 'numeric' | 'length'>('alpha')
const ignoreCase = ref(false)
const trimLines = ref(true)
const removeBlank = ref(false)
const removeDuplicates = ref(false)

// Tool-specific labels (common verbs like Sample/Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        order: 'Порядок',
        orderAsc: 'По возрастанию',
        orderDesc: 'По убыванию',
        mode: 'Режим',
        modeAlpha: 'По алфавиту',
        modeNumeric: 'По числам',
        modeLength: 'По длине',
        ignoreCase: 'Игнорировать регистр',
        trim: 'Обрезать пробелы',
        removeBlank: 'Удалять пустые строки',
        removeDuplicates: 'Удалять дубликаты',
        reverse: 'Перевернуть',
        lines: 'строк',
        placeholder: 'banana\napple\nCherry\n10\n2',
        inputAria: 'Исходный текст',
        outputAria: 'Отсортированные строки',
      }
    : {
        order: 'Order',
        orderAsc: 'Ascending',
        orderDesc: 'Descending',
        mode: 'Mode',
        modeAlpha: 'Alphabetical',
        modeNumeric: 'Numeric',
        modeLength: 'By length',
        ignoreCase: 'Ignore case',
        trim: 'Trim whitespace',
        removeBlank: 'Remove blank lines',
        removeDuplicates: 'Remove duplicates',
        reverse: 'Reverse',
        lines: 'lines',
        placeholder: 'banana\napple\nCherry\n10\n2',
        inputAria: 'Source text',
        outputAria: 'Sorted lines',
      },
)

// Only alphabetical mode is case-sensitive in a way the toggle can affect.
const showIgnoreCase = computed(() => mode.value === 'alpha')

interface SortResult {
  lines: string[]
  output: string
  count: number
}

// Split input into the post-options pipeline (trim / blank / dedupe) without
// sorting. Pure string work — safe to run during the Node prerender.
function preprocess(text: string): string[] {
  if (!text) return []
  let lines = text.split(/\r\n|\r|\n/)
  if (trimLines.value) lines = lines.map((l) => l.trim())
  if (removeBlank.value) lines = lines.filter((l) => l !== '')
  if (removeDuplicates.value) {
    const seen = new Set<string>()
    const key = (l: string) => (showIgnoreCase.value && ignoreCase.value ? l.toLowerCase() : l)
    lines = lines.filter((l) => {
      const k = key(l)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }
  return lines
}

// Parse a leading number for numeric mode; NaN flags a non-number so it can be
// pushed to the end while keeping the original input order among themselves.
function numOf(line: string): number {
  const n = Number.parseFloat(line)
  return Number.isNaN(n) ? Number.NaN : n
}

function sortLines(lines: string[]): string[] {
  // Stable index keeps equal elements (and non-numbers) in input order.
  const indexed = lines.map((line, i) => ({ line, i }))

  if (mode.value === 'numeric') {
    indexed.sort((a, b) => {
      const na = numOf(a.line)
      const nb = numOf(b.line)
      const aNum = !Number.isNaN(na)
      const bNum = !Number.isNaN(nb)
      // Non-numbers always sort last, regardless of ascending/descending.
      if (aNum && !bNum) return -1
      if (!aNum && bNum) return 1
      if (!aNum && !bNum) return a.i - b.i
      if (na === nb) return a.i - b.i
      const cmp = na - nb
      return order.value === 'asc' ? cmp : -cmp
    })
  } else if (mode.value === 'length') {
    indexed.sort((a, b) => {
      const cmp = a.line.length - b.line.length
      if (cmp === 0) return a.i - b.i
      return order.value === 'asc' ? cmp : -cmp
    })
  } else {
    indexed.sort((a, b) => {
      const x = ignoreCase.value ? a.line.toLowerCase() : a.line
      const y = ignoreCase.value ? b.line.toLowerCase() : b.line
      const cmp = x.localeCompare(y)
      if (cmp === 0) return a.i - b.i
      return order.value === 'asc' ? cmp : -cmp
    })
  }

  return indexed.map((entry) => entry.line)
}

const result = ref<SortResult>({ lines: [], output: '', count: 0 })

function recompute() {
  const processed = preprocess(input.value)
  const sorted = sortLines(processed)
  result.value = { lines: sorted, output: sorted.join('\n'), count: sorted.length }
}

// Live: recompute when the input or any option changes.
watch([input, order, mode, ignoreCase, trimLines, removeBlank, removeDuplicates], recompute, {
  immediate: true,
})

const output = computed(() => result.value.output)
const hasInput = computed(() => input.value.length > 0)

// Reverse the current output order in place — independent of the sort settings.
function reverse() {
  const reversed = [...result.value.lines].reverse()
  input.value = reversed.join('\n')
}

function clear() {
  input.value = ''
}

const sample = `banana
apple
Cherry
banana
10
2
date
100
fig`

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server?',
    a: 'No. Sorting happens entirely in your browser with JavaScript. Nothing you paste is uploaded, logged or stored, so it is safe for lists of emails, IDs, log lines or any other sensitive data.',
  },
  {
    q: 'How does numeric sorting handle lines that are not numbers?',
    a: 'In numeric mode every line is parsed as a number from its start. Numeric lines are ordered by value (ascending or descending), and any line that is not a number is pushed to the end, keeping its original input order. This way "10" sorts after "2" instead of before it like plain text would.',
  },
  {
    q: 'What does "by length" sorting do?',
    a: 'It orders lines by their character count rather than their content, so the shortest line comes first in ascending order and the longest first in descending order. Lines with the same length stay in their original relative order.',
  },
  {
    q: 'When does "ignore case" matter?',
    a: 'It only applies to alphabetical sorting. With it off, uppercase letters are compared differently from lowercase ones, so "Cherry" and "apple" may not order the way you expect. Turn it on to sort case-insensitively while keeping each line in its original capitalization.',
  },
  {
    q: 'What is the difference between sorting and the Reverse button?',
    a: 'Sorting reorders the lines according to the chosen mode and order. Reverse simply flips the current order of the lines as they appear right now, ignoring the sort settings — handy for inverting a list you already arranged.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Сортировка выполняется полностью в браузере на JavaScript. Ничего из вставленного не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для списков email, идентификаторов, строк логов и других конфиденциальных данных.',
  },
  {
    q: 'Как числовая сортировка обрабатывает строки без чисел?',
    a: 'В режиме «По числам» каждая строка разбирается как число с её начала. Числовые строки упорядочиваются по значению (по возрастанию или убыванию), а строки без числа отправляются в конец и сохраняют исходный порядок. Так «10» окажется после «2», а не перед ним, как было бы при текстовом сравнении.',
  },
  {
    q: 'Что делает сортировка «По длине»?',
    a: 'Она упорядочивает строки по количеству символов, а не по содержимому: при возрастании первой идёт самая короткая строка, при убывании — самая длинная. Строки одинаковой длины сохраняют исходный относительный порядок.',
  },
  {
    q: 'Когда влияет «Игнорировать регистр»?',
    a: 'Опция действует только при сортировке по алфавиту. Когда она выключена, заглавные буквы сравниваются иначе, чем строчные, и «Cherry» может встать не там, где вы ожидаете. Включите её, чтобы сортировать без учёта регистра, сохраняя при этом исходное написание каждой строки.',
  },
  {
    q: 'Чем сортировка отличается от кнопки «Перевернуть»?',
    a: 'Сортировка переупорядочивает строки по выбранному режиму и порядку. «Перевернуть» просто меняет на обратный текущий порядок строк, не учитывая настройки сортировки — удобно, чтобы инвертировать уже подготовленный список.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="sort-lines" :faq="faq">
    <!-- Options toolbar -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.mode }}
        <select v-model="mode" class="field !w-auto !py-1.5" :aria-label="ui.mode">
          <option value="alpha">{{ ui.modeAlpha }}</option>
          <option value="numeric">{{ ui.modeNumeric }}</option>
          <option value="length">{{ ui.modeLength }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.order }}
        <select v-model="order" class="field !w-auto !py-1.5" :aria-label="ui.order">
          <option value="asc">{{ ui.orderAsc }}</option>
          <option value="desc">{{ ui.orderDesc }}</option>
        </select>
      </label>

      <label
        v-if="showIgnoreCase"
        class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
      >
        <input v-model="ignoreCase" type="checkbox" class="accent-accent" />
        {{ ui.ignoreCase }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="trimLines" type="checkbox" class="accent-accent" />
        {{ ui.trim }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="removeBlank" type="checkbox" class="accent-accent" />
        {{ ui.removeBlank }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="removeDuplicates" type="checkbox" class="accent-accent" />
        {{ ui.removeDuplicates }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!hasInput" @click="reverse">
          {{ ui.reverse }}
        </button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="hasInput">
        <span class="text-ink-500 dark:text-ink-400">
          {{ result.count.toLocaleString() }} {{ ui.lines }}
        </span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <label class="label">{{ t('common.input') }}</label>
        <textarea
          v-model="input"
          class="textarea-code min-h-[20rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
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
          class="textarea-code min-h-[20rem] bg-ink-50 dark:bg-ink-900"
          spellcheck="false"
          :aria-label="ui.outputAria"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Сортировка строк онлайн</h2>
        <p>
          Этот бесплатный инструмент <strong>сортирует строки текста</strong> по
          алфавиту, по числам или по длине — по возрастанию или по убыванию. Он
          пригодится разработчикам и аналитикам, которым нужно упорядочить списки
          email, идентификаторов, имён файлов, строк логов или любой другой
          построчный текст.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш текст не
          отправляется на сервер, поэтому инструмент безопасен для конфиденциальных
          списков, выгрузок пользователей и внутренних данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте текст в левое поле — отсортированный результат появляется сразу.</li>
          <li>Выберите <code>Режим</code>: по алфавиту, по числам или по длине строки.</li>
          <li>Задайте <code>Порядок</code> — по возрастанию или по убыванию.</li>
          <li>Для алфавитной сортировки включите <code>Игнорировать регистр</code>, чтобы <code>Cherry</code> и <code>apple</code> сравнивались без учёта регистра.</li>
          <li>При желании включите <code>Обрезать пробелы</code>, <code>Удалять пустые строки</code> или <code>Удалять дубликаты</code>.</li>
          <li>Нажмите <code>Перевернуть</code>, чтобы инвертировать текущий порядок, <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Алфавитная, числовая и сортировка по длине</h2>
        <p>
          В режиме <strong>по алфавиту</strong> строки сравниваются с учётом
          локали (<code>localeCompare</code>), поэтому буквы кириллицы и латиницы
          упорядочиваются естественно. В режиме <strong>по числам</strong> каждая
          строка разбирается как число с её начала: числовые значения
          упорядочиваются по величине, а строки без числа отправляются в конец и
          сохраняют исходный порядок. Режим <strong>по длине</strong> сравнивает
          строки по количеству символов. Сортировка стабильна — равные строки
          остаются в исходном относительном порядке.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Чтобы убрать повторы из списка, используйте
          <NuxtLink :to="localePath('/remove-duplicate-lines')">удаление повторяющихся строк</NuxtLink>.
          Посчитать строки и слова поможет
          <NuxtLink :to="localePath('/text-counter')">счётчик текста</NuxtLink>,
          а привести строки к единому стилю —
          <NuxtLink :to="localePath('/case-converter')">конвертер регистра</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Sort lines online</h2>
        <p>
          This free tool <strong>sorts lines of text</strong> alphabetically, by
          number or by length — ascending or descending. It is built for
          developers and analysts who need to order lists of emails, IDs, file
          names, log lines or any other line-based text.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your text is
          never sent to a server, so it is safe to use with sensitive lists, user
          exports and internal data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste your text into the left box — the sorted result appears instantly.</li>
          <li>Pick a <code>Mode</code>: alphabetical, numeric or by line length.</li>
          <li>Set the <code>Order</code> to ascending or descending.</li>
          <li>For alphabetical sorting, enable <code>Ignore case</code> so <code>Cherry</code> and <code>apple</code> compare case-insensitively.</li>
          <li>Optionally turn on <code>Trim whitespace</code>, <code>Remove blank lines</code> or <code>Remove duplicates</code>.</li>
          <li>Use <code>Reverse</code> to flip the current order, <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>Alphabetical, numeric and length sorting</h2>
        <p>
          In <strong>alphabetical</strong> mode lines are compared with a
          locale-aware comparison (<code>localeCompare</code>), so accented and
          non-Latin characters order naturally. In <strong>numeric</strong> mode
          each line is parsed as a number from its start: numeric values are
          ordered by magnitude, while any non-number line is pushed to the end and
          keeps its original order. The <strong>by length</strong> mode compares
          lines by character count. Sorting is stable, so equal lines stay in their
          original relative order.
        </p>

        <h2>Related tools</h2>
        <p>
          To strip repeats from a list, use
          <NuxtLink :to="localePath('/remove-duplicate-lines')">remove duplicate lines</NuxtLink>.
          To count lines and words, open the
          <NuxtLink :to="localePath('/text-counter')">text counter</NuxtLink>,
          or normalize line styles with the
          <NuxtLink :to="localePath('/case-converter')">case converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
