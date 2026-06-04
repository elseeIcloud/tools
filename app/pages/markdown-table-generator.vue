<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Align = 'left' | 'center' | 'right'

// Plain reactive arrays — SSG-safe, render identically in Node and the browser.
const grid = ref<string[][]>([
  ['Name', 'Type', 'Default'],
  ['id', 'number', '0'],
  ['active', 'boolean', 'false'],
])
const aligns = ref<Align[]>(['left', 'left', 'left'])
const pasteText = ref('')

const colCount = computed(() => aligns.value.length)
const rowCount = computed(() => grid.value.length)

// --- Markdown output (pure computed) ---
function escapeCell(value: string): string {
  // Escape pipes and collapse newlines so a single cell stays on one line.
  return value.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|')
}

function separator(align: Align, width: number): string {
  const dashCount = Math.max(width, align === 'center' ? 5 : 3)
  switch (align) {
    case 'left':
      return ':' + '-'.repeat(dashCount - 1)
    case 'right':
      return '-'.repeat(dashCount - 1) + ':'
    case 'center':
      return ':' + '-'.repeat(dashCount - 2) + ':'
  }
}

function pad(value: string, width: number, align: Align): string {
  const gap = width - [...value].length
  if (gap <= 0) return value
  if (align === 'right') return ' '.repeat(gap) + value
  if (align === 'center') {
    const left = Math.floor(gap / 2)
    return ' '.repeat(left) + value + ' '.repeat(gap - left)
  }
  return value + ' '.repeat(gap)
}

const markdown = computed(() => {
  const cols = colCount.value
  if (cols === 0 || rowCount.value === 0) return ''

  const cells = grid.value.map((row) =>
    Array.from({ length: cols }, (_, c) => escapeCell(row[c] ?? '')),
  )

  // Column width = widest content cell, but at least the separator minimum.
  const widths = Array.from({ length: cols }, (_, c) => {
    const content = Math.max(0, ...cells.map((row) => [...row[c]!].length))
    const minSep = aligns.value[c] === 'center' ? 5 : 3
    return Math.max(content, minSep)
  })

  const lines: string[] = []
  const header = cells[0] ?? Array.from({ length: cols }, () => '')
  lines.push('| ' + header.map((cell, c) => pad(cell, widths[c]!, aligns.value[c]!)).join(' | ') + ' |')
  lines.push('| ' + widths.map((w, c) => separator(aligns.value[c]!, w)).join(' | ') + ' |')
  for (let r = 1; r < cells.length; r++) {
    const row = cells[r]!
    lines.push('| ' + row.map((cell, c) => pad(cell, widths[c]!, aligns.value[c]!)).join(' | ') + ' |')
  }
  return lines.join('\n')
})

const charCount = computed(() => markdown.value.length)

// --- Grid mutations (event handlers only) ---
function setCell(r: number, c: number, value: string) {
  grid.value[r]![c] = value
}

function addColumn() {
  for (const row of grid.value) row.push('')
  aligns.value.push('left')
}

function removeColumn() {
  if (colCount.value <= 1) return
  for (const row of grid.value) row.pop()
  aligns.value.pop()
}

function addRow() {
  grid.value.push(Array.from({ length: colCount.value }, () => ''))
}

function removeRow() {
  if (rowCount.value <= 1) return
  grid.value.pop()
}

function setAlign(c: number, value: Align) {
  aligns.value[c] = value
}

function clear() {
  grid.value = [Array.from({ length: colCount.value }, () => '')]
}

const sampleGrid: string[][] = [
  ['Method', 'Path', 'Description'],
  ['GET', '/users', 'List all users'],
  ['POST', '/users', 'Create a user'],
  ['DELETE', '/users/:id', 'Remove a user'],
]

function loadSample() {
  grid.value = sampleGrid.map((row) => [...row])
  aligns.value = ['center', 'left', 'left']
}

// --- CSV / TSV import (parsed inside a handler) ---
function importDelimited() {
  const raw = pasteText.value.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (!raw.trim()) return
  const rows = raw.split('\n')
  // Auto-detect tabs vs commas from the first row.
  const useTab = rows[0]!.includes('\t')
  const parsed = rows.map((line) =>
    (useTab ? line.split('\t') : line.split(',')).map((cell) => cell.trim()),
  )
  const cols = Math.max(1, ...parsed.map((row) => row.length))
  grid.value = parsed.map((row) =>
    Array.from({ length: cols }, (_, c) => row[c] ?? ''),
  )
  aligns.value = Array.from({ length: cols }, () => 'left')
  pasteText.value = ''
}

// Tool-specific labels (common verbs come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        builder: 'Конструктор таблицы',
        firstRowHint: 'Первая строка — заголовок таблицы.',
        addRow: '+ Строка',
        removeRow: '− Строка',
        addCol: '+ Столбец',
        removeCol: '− Столбец',
        align: 'Выравнивание',
        alignLeft: 'По левому краю',
        alignCenter: 'По центру',
        alignRight: 'По правому краю',
        left: 'Слева',
        center: 'Центр',
        right: 'Справа',
        header: 'Заголовок',
        markdown: 'Markdown',
        cellPlaceholder: 'Ячейка',
        importTitle: 'Импорт из CSV / TSV',
        importHint: 'Вставьте данные с разделителями (запятые или табы) — таблица заполнится автоматически.',
        importBtn: 'Заполнить из CSV/TSV',
        importPlaceholder: 'Name, Type, Default\nid, number, 0\nactive, boolean, false',
        emptyOutput: 'Заполните ячейки — Markdown-таблица появится здесь.',
        size: 'Размер',
        columnLabel: 'Столбец',
      }
    : {
        builder: 'Table builder',
        firstRowHint: 'The first row is the table header.',
        addRow: '+ Row',
        removeRow: '− Row',
        addCol: '+ Column',
        removeCol: '− Column',
        align: 'Alignment',
        alignLeft: 'Align left',
        alignCenter: 'Align center',
        alignRight: 'Align right',
        left: 'Left',
        center: 'Center',
        right: 'Right',
        header: 'Header',
        markdown: 'Markdown',
        cellPlaceholder: 'Cell',
        importTitle: 'Import from CSV / TSV',
        importHint: 'Paste delimited data (commas or tabs) to fill the grid automatically.',
        importBtn: 'Fill grid from CSV/TSV',
        importPlaceholder: 'Name, Type, Default\nid, number, 0\nactive, boolean, false',
        emptyOutput: 'Fill in the cells — the Markdown table appears here.',
        size: 'Size',
        columnLabel: 'Column',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my table data sent to a server?',
    a: 'No. The whole generator runs entirely in your browser with JavaScript — the grid you edit and the Markdown it produces never leave your device. Nothing is uploaded, logged, or stored, so it is safe for internal docs and private data.',
  },
  {
    q: 'What Markdown flavor does it output?',
    a: 'It produces GitHub-Flavored Markdown (GFM) pipe tables: a header row, a separator row that encodes alignment, and one row per record. These render correctly on GitHub, GitLab, Reddit, many static-site generators and most Markdown editors.',
  },
  {
    q: 'How do the alignment controls work?',
    a: 'Each column has a left / center / right control that maps to the separator row: :--- aligns left, :---: centers, and ---: aligns right. The output is padded so the raw Markdown stays neatly aligned even before it is rendered.',
  },
  {
    q: 'Can I import an existing CSV or TSV?',
    a: 'Yes. Paste comma- or tab-separated rows into the import box and click the fill button. The tool auto-detects tabs versus commas from the first line, splits on newlines, and rebuilds the grid with the first row as the header.',
  },
  {
    q: 'What happens if a cell contains a pipe character?',
    a: 'A literal pipe (|) would otherwise break the table, so the generator automatically escapes it as \\| in the output. Line breaks inside a cell are collapsed to spaces, keeping every cell on a single Markdown row.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли данные таблицы на сервер?',
    a: 'Нет. Весь генератор работает целиком в браузере на JavaScript — сетка, которую вы редактируете, и получаемый Markdown не покидают ваше устройство. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для внутренней документации и приватных данных.',
  },
  {
    q: 'Какой формат Markdown создаётся?',
    a: 'Создаётся таблица в формате GitHub-Flavored Markdown (GFM) на «трубах»: строка заголовка, строка-разделитель с выравниванием и по строке на каждую запись. Такие таблицы корректно отображаются на GitHub, GitLab, Reddit, во многих генераторах статических сайтов и редакторах Markdown.',
  },
  {
    q: 'Как работают переключатели выравнивания?',
    a: 'У каждого столбца есть переключатель слева / центр / справа, который задаёт строку-разделитель: :--- выравнивает влево, :---: по центру, а ---: вправо. Вывод дополняется пробелами, чтобы исходный Markdown оставался ровным даже до отрисовки.',
  },
  {
    q: 'Можно ли импортировать готовый CSV или TSV?',
    a: 'Да. Вставьте строки, разделённые запятыми или табами, в поле импорта и нажмите кнопку заполнения. Инструмент сам определит табы или запятые по первой строке, разобьёт текст по переносам и построит сетку, где первая строка станет заголовком.',
  },
  {
    q: 'Что произойдёт, если в ячейке есть символ вертикальной черты?',
    a: 'Обычная вертикальная черта (|) сломала бы таблицу, поэтому генератор автоматически экранирует её как \\| в выводе. Переносы строк внутри ячейки заменяются пробелами, и каждая ячейка остаётся в одной строке Markdown.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="markdown-table-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium text-ink-700 dark:text-ink-200">{{ ui.builder }}</span>
      <button type="button" class="btn-ghost" @click="addRow">{{ ui.addRow }}</button>
      <button type="button" class="btn-ghost" :disabled="rowCount <= 1" @click="removeRow">{{ ui.removeRow }}</button>
      <button type="button" class="btn-ghost" @click="addColumn">{{ ui.addCol }}</button>
      <button type="button" class="btn-ghost" :disabled="colCount <= 1" @click="removeColumn">{{ ui.removeCol }}</button>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <p class="mt-3 text-sm text-ink-500 dark:text-ink-400">{{ ui.firstRowHint }}</p>

    <!-- Editable grid -->
    <div class="mt-3 overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-700">
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-ink-200 bg-ink-50 dark:border-ink-700 dark:bg-ink-800">
            <th
              v-for="(a, c) in aligns"
              :key="`align-${c}`"
              class="border-l border-ink-200 p-2 first:border-l-0 dark:border-ink-700"
            >
              <label class="sr-only" :for="`align-${c}`">{{ ui.align }} {{ ui.columnLabel }} {{ c + 1 }}</label>
              <select
                :id="`align-${c}`"
                :value="a"
                class="field !w-auto !py-1.5"
                :aria-label="`${ui.align} ${ui.columnLabel} ${c + 1}`"
                @change="setAlign(c, ($event.target as HTMLSelectElement).value as Align)"
              >
                <option value="left">⬅ {{ ui.left }}</option>
                <option value="center">↔ {{ ui.center }}</option>
                <option value="right">➡ {{ ui.right }}</option>
              </select>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, r) in grid"
            :key="`row-${r}`"
            class="border-t border-ink-200 dark:border-ink-700"
          >
            <td
              v-for="(_, c) in aligns"
              :key="`cell-${r}-${c}`"
              class="border-l border-ink-200 p-0 first:border-l-0 dark:border-ink-700"
            >
              <input
                :value="row[c] ?? ''"
                type="text"
                class="w-full border-0 bg-transparent px-2.5 py-2 font-mono text-sm text-ink-900 outline-none focus:bg-accent/5 focus:ring-2 focus:ring-inset focus:ring-accent/40 dark:text-ink-100"
                :class="r === 0 ? 'font-semibold' : ''"
                :placeholder="r === 0 ? ui.header : ui.cellPlaceholder"
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                :aria-label="`${ui.columnLabel} ${c + 1}, ${r === 0 ? ui.header : `${t('common.count')} ${r}`}`"
                @input="setCell(r, c, ($event.target as HTMLInputElement).value)"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CSV / TSV import -->
    <div class="mt-4 rounded-lg border border-ink-200 p-3 dark:border-ink-700">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <label class="text-sm font-medium text-ink-700 dark:text-ink-200" for="paste-area">{{ ui.importTitle }}</label>
        <button type="button" class="btn-ghost !py-1.5 text-xs" :disabled="!pasteText.trim()" @click="importDelimited">
          {{ ui.importBtn }}
        </button>
      </div>
      <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">{{ ui.importHint }}</p>
      <textarea
        id="paste-area"
        v-model="pasteText"
        class="textarea-code mt-2 min-h-[6rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.importPlaceholder"
      />
    </div>

    <!-- Markdown output -->
    <div class="mt-5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-sm font-medium text-ink-700 dark:text-ink-200">{{ ui.markdown }}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-ink-400">{{ ui.size }}: {{ colCount }} × {{ rowCount }} · {{ charCount.toLocaleString() }} {{ t('common.characters') }}</span>
          <CopyButton :text="() => markdown" />
        </div>
      </div>
      <textarea
        :value="markdown"
        readonly
        class="textarea-code mt-2 min-h-[12rem]"
        spellcheck="false"
        :placeholder="ui.emptyOutput"
        :aria-label="ui.markdown"
      />
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор Markdown-таблиц онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор Markdown-таблиц</strong> позволяет
          собрать таблицу визуально в редактируемой сетке и сразу получить
          корректный GitHub-Flavored Markdown. Добавляйте и убирайте строки и
          столбцы, задавайте выравнивание для каждого столбца и копируйте готовый
          результат в README, issue, документацию или заметки — без ручного
          подсчёта вертикальных черт и дефисов.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Содержимое таблицы
          не отправляется на сервер, поэтому инструмент безопасен для внутренней
          документации и любых конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите данные прямо в ячейки сетки — первая строка становится заголовком.</li>
          <li>Кнопками <code>+ Столбец</code> и <code>+ Строка</code> расширяйте таблицу, а <code>−</code> — убирайте лишнее.</li>
          <li>Выберите выравнивание для каждого столбца: слева, по центру или справа.</li>
          <li>Вставьте готовые данные в поле <code>Импорт из CSV / TSV</code>, чтобы заполнить сетку автоматически.</li>
          <li>Нажмите <code>Копировать</code> рядом с блоком Markdown и вставьте таблицу куда нужно.</li>
        </ul>

        <h2>Выравнивание и экранирование</h2>
        <p>
          Выравнивание кодируется в строке-разделителе: <code>:---</code> — слева,
          <code>:---:</code> — по центру, <code>---:</code> — справа. Столбцы
          дополняются пробелами, чтобы исходный текст выглядел ровно. Символ
          вертикальной черты внутри ячейки автоматически экранируется как
          <code>\|</code>, а переносы строк заменяются пробелами, чтобы таблица
          оставалась корректной.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Проверьте, как таблица отрендерится, в
          <NuxtLink :to="localePath('/markdown-preview')">предпросмотре Markdown</NuxtLink>,
          превратите данные в таблицу через
          <NuxtLink :to="localePath('/json-to-csv')">конвертер JSON в CSV</NuxtLink>
          или сравните две версии в
          <NuxtLink :to="localePath('/diff-checker')">сравнении текста</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Markdown table generator online</h2>
        <p>
          This free <strong>Markdown table generator</strong> lets you build a
          table visually in an editable grid and instantly get well-formed
          GitHub-Flavored Markdown. Add or remove rows and columns, set per-column
          alignment, and copy the result straight into a README, an issue,
          documentation or notes — no counting pipes and dashes by hand.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The table
          contents are never sent to a server, so it is safe for internal docs and
          any sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type your data directly into the grid cells — the first row becomes the header.</li>
          <li>Use <code>+ Column</code> and <code>+ Row</code> to grow the table, and <code>−</code> to trim it.</li>
          <li>Pick an alignment for each column: left, center or right.</li>
          <li>Paste existing data into the <code>Import from CSV / TSV</code> box to fill the grid automatically.</li>
          <li>Click <code>Copy</code> next to the Markdown block and paste the table wherever you need it.</li>
        </ul>

        <h2>Alignment and escaping</h2>
        <p>
          Alignment is encoded in the separator row: <code>:---</code> is left,
          <code>:---:</code> is centered and <code>---:</code> is right. Columns are
          padded with spaces so the raw text stays tidy. A pipe character inside a
          cell is automatically escaped as <code>\|</code>, and line breaks are
          collapsed to spaces so the table stays valid.
        </p>

        <h2>Related tools</h2>
        <p>
          See how the table renders in the
          <NuxtLink :to="localePath('/markdown-preview')">Markdown preview</NuxtLink>,
          turn data into a table with the
          <NuxtLink :to="localePath('/json-to-csv')">JSON to CSV converter</NuxtLink>,
          or compare two versions in the
          <NuxtLink :to="localePath('/diff-checker')">diff checker</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
