<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const trimLines = ref(true)
const ignoreCase = ref(false)
const keep = ref<'first' | 'last'>('first')
const sort = ref<'none' | 'asc' | 'desc'>('none')
const removeEmpty = ref(false)

// Tool-specific labels (common verbs like Sample/Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        trim: 'Обрезать пробелы',
        ignoreCase: 'Игнорировать регистр',
        removeEmpty: 'Удалять пустые строки',
        keep: 'Оставлять',
        keepFirst: 'Первое вхождение',
        keepLast: 'Последнее вхождение',
        sort: 'Сортировка',
        sortNone: 'Без сортировки',
        sortAsc: 'А → Я',
        sortDesc: 'Я → А',
        removedNone: 'Дубликаты не найдены',
        removed: (n: number) => `Удалено повторяющихся строк: ${n}`,
        lines: 'строк',
        placeholder: 'apple\nbanana\napple\n\nBanana',
        inputAria: 'Исходный текст',
        outputAria: 'Уникальные строки',
      }
    : {
        trim: 'Trim each line',
        ignoreCase: 'Ignore case',
        removeEmpty: 'Remove empty lines',
        keep: 'Keep',
        keepFirst: 'First occurrence',
        keepLast: 'Last occurrence',
        sort: 'Sort',
        sortNone: 'No sorting',
        sortAsc: 'A → Z',
        sortDesc: 'Z → A',
        removedNone: 'No duplicates found',
        removed: (n: number) => `Removed ${n} duplicate ${n === 1 ? 'line' : 'lines'}`,
        lines: 'lines',
        placeholder: 'apple\nbanana\napple\n\nBanana',
        inputAria: 'Source text',
        outputAria: 'Unique lines',
      },
)

interface Dedup {
  output: string
  /** Number of lines dropped as duplicates (does not count removed-empty lines). */
  removed: number
  /** Count of lines kept in the output. */
  kept: number
}

// Pure: plain string + Array work fine in the Node prerender env, so the
// result is computed synchronously with no client-only guard.
const result = computed<Dedup>(() => {
  if (!input.value) return { output: '', removed: 0, kept: 0 }

  // Split on any newline style; normalize the option pipeline per line.
  let lines = input.value.split(/\r\n|\r|\n/)
  if (trimLines.value) lines = lines.map((l) => l.trim())
  if (removeEmpty.value) lines = lines.filter((l) => l !== '')

  const total = lines.length
  // Comparison key controls what counts as a duplicate; the original line is
  // what we actually emit, so case/whitespace are preserved in the output.
  const keyOf = (line: string) => (ignoreCase.value ? line.toLowerCase() : line)

  const seen = new Map<string, string>()
  if (keep.value === 'first') {
    // First write wins; later duplicates are ignored, preserving first order.
    for (const line of lines) {
      const k = keyOf(line)
      if (!seen.has(k)) seen.set(k, line)
    }
  } else {
    // Last write wins. Deleting before re-setting moves the key to the end,
    // so the surviving copy keeps the position of the last occurrence.
    for (const line of lines) {
      const k = keyOf(line)
      if (seen.has(k)) seen.delete(k)
      seen.set(k, line)
    }
  }

  let unique = [...seen.values()]
  if (sort.value === 'asc') unique = [...unique].sort((a, b) => a.localeCompare(b))
  else if (sort.value === 'desc') unique = [...unique].sort((a, b) => b.localeCompare(a))

  return { output: unique.join('\n'), removed: total - unique.length, kept: unique.length }
})

const output = computed(() => result.value.output)
const hasInput = computed(() => input.value.length > 0)

function clear() {
  input.value = ''
}

const sample = `apple
banana
Apple
cherry
banana

APPLE
date
cherry`

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server?',
    a: 'No. Duplicate lines are removed entirely in your browser using JavaScript. Nothing you paste is uploaded, logged or stored, so it is safe for logs, lists of emails, IDs or any other sensitive data.',
  },
  {
    q: 'What is the difference between "ignore case" on and off?',
    a: 'With ignore case off, lines must match exactly, so "Apple" and "apple" are treated as two different lines and both are kept. With ignore case on, they compare as equal, so only one survives — but the line you actually see in the output keeps its original capitalization.',
  },
  {
    q: 'How do "keep first" and "keep last" differ?',
    a: 'Both produce the same set of unique lines; they only change which copy of a repeated line survives and where it sits. Keep first preserves the first time a line appeared and its original order. Keep last instead keeps the final occurrence, so the surviving line moves to the position of its last appearance.',
  },
  {
    q: 'What does "trim each line" do?',
    a: 'It strips leading and trailing whitespace from every line before comparing, so "  hello" and "hello " are recognized as the same line. It is useful for pasted lists where stray spaces or tabs would otherwise hide duplicates.',
  },
  {
    q: 'Does it change the order of my lines?',
    a: 'By default the original order is preserved (minus the removed duplicates). If you pick a sort option, the unique lines are reordered A→Z or Z→A using locale-aware comparison; choose "No sorting" to keep them as they came in.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Повторяющиеся строки удаляются целиком в браузере на JavaScript. Ничего из вставленного не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для логов, списков email, идентификаторов и других конфиденциальных данных.',
  },
  {
    q: 'Чем отличается включённый и выключенный «Игнорировать регистр»?',
    a: 'При выключенной опции строки должны совпадать точно, поэтому «Apple» и «apple» считаются разными и обе сохраняются. При включённой они сравниваются как равные, и остаётся только одна — но в результате вы видите строку в её исходном регистре.',
  },
  {
    q: 'Чем отличаются «Первое вхождение» и «Последнее вхождение»?',
    a: 'Оба варианта дают один и тот же набор уникальных строк; меняется лишь то, какая копия повторяющейся строки сохранится и где она окажется. «Первое вхождение» сохраняет первое появление строки и исходный порядок. «Последнее вхождение» оставляет последнее появление, поэтому строка перемещается на позицию своего последнего вхождения.',
  },
  {
    q: 'Что делает «Обрезать пробелы»?',
    a: 'Эта опция убирает пробелы в начале и в конце каждой строки перед сравнением, поэтому «  привет» и «привет » распознаются как одна строка. Полезно для вставленных списков, где случайные пробелы или табы иначе скрыли бы дубли.',
  },
  {
    q: 'Меняется ли порядок строк?',
    a: 'По умолчанию исходный порядок сохраняется (за вычетом удалённых дублей). Если выбрать сортировку, уникальные строки переупорядочиваются А→Я или Я→А с учётом локали; выберите «Без сортировки», чтобы оставить их как есть.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="remove-duplicate-lines" :faq="faq">
    <!-- Options toolbar -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="trimLines" type="checkbox" class="accent-accent" />
        {{ ui.trim }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="ignoreCase" type="checkbox" class="accent-accent" />
        {{ ui.ignoreCase }}
      </label>
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="removeEmpty" type="checkbox" class="accent-accent" />
        {{ ui.removeEmpty }}
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.keep }}
        <select v-model="keep" class="field !w-auto !py-1.5" :aria-label="ui.keep">
          <option value="first">{{ ui.keepFirst }}</option>
          <option value="last">{{ ui.keepLast }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.sort }}
        <select v-model="sort" class="field !w-auto !py-1.5" :aria-label="ui.sort">
          <option value="none">{{ ui.sortNone }}</option>
          <option value="asc">{{ ui.sortAsc }}</option>
          <option value="desc">{{ ui.sortDesc }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="hasInput">
        <span
          class="font-medium"
          :class="result.removed > 0 ? 'text-green-600 dark:text-green-400' : 'text-ink-500 dark:text-ink-400'"
        >
          {{ result.removed > 0 ? ui.removed(result.removed) : ui.removedNone }}
        </span>
        <span class="text-ink-400">· {{ result.kept.toLocaleString() }} {{ ui.lines }}</span>
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
        <h2>Удаление повторяющихся строк онлайн</h2>
        <p>
          Этот бесплатный инструмент <strong>удаляет повторяющиеся строки</strong>
          из любого текста и оставляет только уникальные. Он создан для
          разработчиков и аналитиков, которые чистят логи, списки email,
          идентификаторы, импорты или экспорты из таблиц, где одни и те же
          значения встречаются по многу раз.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш текст не
          отправляется на сервер, поэтому инструмент безопасен для конфиденциальных
          списков, выгрузок пользователей и внутренних данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте текст в левое поле — результат с уникальными строками появляется сразу.</li>
          <li>Включите <code>Обрезать пробелы</code>, чтобы пробелы по краям не мешали распознавать дубли.</li>
          <li>Включите <code>Игнорировать регистр</code>, чтобы <code>Apple</code> и <code>apple</code> считались одной строкой.</li>
          <li>Выберите <code>Оставлять</code>: первое или последнее вхождение повторяющейся строки.</li>
          <li>Задайте <code>Сортировку</code> (без сортировки, А → Я или Я → А) и при желании уберите пустые строки.</li>
          <li>Нажмите <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Как определяется дубликат</h2>
        <p>
          Две строки считаются одинаковыми, если совпадают их <strong>ключи
          сравнения</strong>. Опции <code>Обрезать пробелы</code> и
          <code>Игнорировать регистр</code> влияют только на ключ, а не на вывод:
          в результате строка остаётся в исходном виде. Небольшая сводка над полями
          показывает, сколько повторяющихся строк было удалено, а
          <code>Оставлять: последнее вхождение</code> меняет, какая именно копия
          сохранится, не меняя итоговый набор уникальных строк.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Хотите посчитать строки и слова до и после чистки? Откройте
          <NuxtLink :to="localePath('/text-counter')">счётчик текста</NuxtLink>.
          Сравнить два списка построчно поможет
          <NuxtLink :to="localePath('/diff-checker')">diff-чекер</NuxtLink>,
          а привести строки к единому стилю —
          <NuxtLink :to="localePath('/case-converter')">конвертер регистра</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Remove duplicate lines online</h2>
        <p>
          This free tool <strong>removes duplicate lines</strong> from any text
          and keeps only the unique ones. It is built for developers and analysts
          who clean up logs, email lists, IDs, imports or spreadsheet exports
          where the same values show up over and over.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your text is
          never sent to a server, so it is safe to use with sensitive lists, user
          exports and internal data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste your text into the left box — the unique-lines result appears instantly.</li>
          <li>Enable <code>Trim each line</code> so stray spaces around a line do not hide duplicates.</li>
          <li>Enable <code>Ignore case</code> to treat <code>Apple</code> and <code>apple</code> as the same line.</li>
          <li>Pick <code>Keep</code>: the first or the last occurrence of a repeated line.</li>
          <li>Set a <code>Sort</code> order (none, A → Z or Z → A) and optionally drop empty lines.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>How a duplicate is decided</h2>
        <p>
          Two lines count as the same when their <strong>comparison keys</strong>
          match. The <code>Trim each line</code> and <code>Ignore case</code>
          options affect only that key, not the output: the surviving line is
          emitted exactly as it appeared. A small summary above the boxes reports
          how many duplicate lines were removed, and
          <code>Keep: last occurrence</code> changes which copy survives without
          changing the final set of unique lines.
        </p>

        <h2>Related tools</h2>
        <p>
          Want to count lines and words before and after cleaning? Open the
          <NuxtLink :to="localePath('/text-counter')">text counter</NuxtLink>.
          To compare two lists line by line, use the
          <NuxtLink :to="localePath('/diff-checker')">diff checker</NuxtLink>,
          or normalize line styles with the
          <NuxtLink :to="localePath('/case-converter')">case converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
