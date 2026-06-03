<script setup lang="ts">
import Papa from 'papaparse'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'json2csv' | 'csv2json'>('json2csv')
const delimiter = ref<'comma' | 'semicolon' | 'tab'>('comma')
const input = ref('')

// Tool-specific labels (common verbs like Swap/Sample/Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        jsonToCsv: 'JSON → CSV',
        csvToJson: 'CSV → JSON',
        delimiter: 'Разделитель',
        delimiterAria: 'Разделитель CSV',
        comma: 'Запятая (,)',
        semicolon: 'Точка с запятой (;)',
        tab: 'Табуляция',
        valid: '✓ Готово',
        empty: '✗ Введите массив JSON-объектов',
        invalidJson: '✗ Некорректный JSON',
        notArray: '✗ Ожидается непустой массив объектов',
        rows: 'строк',
        inputJsonPlaceholder: '[\n  { "id": 1, "name": "Ада" },\n  { "id": 2, "name": "Алан" }\n]',
        inputCsvPlaceholder: 'id,name\n1,Ада\n2,Алан',
        inputJsonAria: 'Ввод JSON',
        inputCsvAria: 'Ввод CSV',
        outputCsvAria: 'Результат CSV',
        outputJsonAria: 'Результат JSON',
      }
    : {
        jsonToCsv: 'JSON → CSV',
        csvToJson: 'CSV → JSON',
        delimiter: 'Delimiter',
        delimiterAria: 'CSV delimiter',
        comma: 'Comma (,)',
        semicolon: 'Semicolon (;)',
        tab: 'Tab',
        valid: '✓ Ready',
        empty: '✗ Enter an array of JSON objects',
        invalidJson: '✗ Invalid JSON',
        notArray: '✗ Expected a non-empty array of objects',
        rows: 'rows',
        inputJsonPlaceholder: '[\n  { "id": 1, "name": "Ada" },\n  { "id": 2, "name": "Alan" }\n]',
        inputCsvPlaceholder: 'id,name\n1,Ada\n2,Alan',
        inputJsonAria: 'JSON input',
        inputCsvAria: 'CSV input',
        outputCsvAria: 'CSV output',
        outputJsonAria: 'JSON output',
      },
)

const delimiterChar = computed(() =>
  delimiter.value === 'semicolon' ? ';' : delimiter.value === 'tab' ? '\t' : ',',
)

interface Conversion {
  output: string
  error: 'empty' | 'invalidJson' | 'notArray' | null
  rows: number
}

// Pure: JSON, Papa.unparse and Papa.parse all run fine in the Node prerender
// env, so the result is computed synchronously with no client-only guard.
const conversion = computed<Conversion>(() => {
  const text = input.value.trim()
  if (!text) return { output: '', error: 'empty', rows: 0 }

  if (mode.value === 'json2csv') {
    let data: unknown
    try {
      data = JSON.parse(input.value)
    } catch {
      return { output: '', error: 'invalidJson', rows: 0 }
    }
    // JSON -> CSV requires a non-empty array (of objects/rows).
    if (!Array.isArray(data) || data.length === 0) {
      return { output: '', error: 'notArray', rows: 0 }
    }
    try {
      const csv = Papa.unparse(data as object[], { delimiter: delimiterChar.value })
      return { output: csv, error: null, rows: data.length }
    } catch {
      return { output: '', error: 'notArray', rows: 0 }
    }
  }

  // CSV -> JSON
  const parsed = Papa.parse<Record<string, string>>(input.value, {
    header: true,
    skipEmptyLines: true,
    delimiter: delimiterChar.value,
  })
  const rows = parsed.data
  if (!rows.length) return { output: '', error: 'notArray', rows: 0 }
  return { output: JSON.stringify(rows, null, 2), error: null, rows: rows.length }
})

const output = computed(() => conversion.value.output)
const isValid = computed(() => conversion.value.error === null)

const statusLabel = computed(() => {
  const err = conversion.value.error
  if (err === 'empty') return ''
  if (err === 'invalidJson') return ui.value.invalidJson
  if (err === 'notArray') return ui.value.notArray
  return ui.value.valid
})

function swap() {
  // Feed the current output back as input and flip the conversion direction.
  if (!isValid.value || !output.value) return
  input.value = output.value
  mode.value = mode.value === 'json2csv' ? 'csv2json' : 'json2csv'
}

function clear() {
  input.value = ''
}

const sampleJson = `[
  { "id": 1, "name": "Ada Lovelace", "active": true },
  { "id": 2, "name": "Alan Turing", "active": false }
]`

const sampleCsv = `id,name,active
1,Ada Lovelace,true
2,Alan Turing,false`

function loadSample() {
  input.value = mode.value === 'json2csv' ? sampleJson : sampleCsv
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. Both JSON to CSV and CSV to JSON conversion run entirely in your browser using JavaScript and the Papa Parse library. Nothing you paste is uploaded, logged or stored, so it is safe for exports, reports and other sensitive tabular data.',
  },
  {
    q: 'What JSON shape does JSON to CSV expect?',
    a: 'It expects a non-empty array of objects, like [{"a":1,"b":"x"},{"a":2,"b":"y"}]. Each object becomes a row and its keys become the column headers. A single object, a number, or an empty array is rejected with a red status instead of producing broken output.',
  },
  {
    q: 'Which delimiter should I choose?',
    a: 'Comma is the standard CSV separator. Choose semicolon when your locale uses commas as decimal separators (common in many European spreadsheets), or tab to produce TSV. The same delimiter is used both for generating CSV and for parsing it back to JSON.',
  },
  {
    q: 'How does the Swap button work?',
    a: 'Swap takes whatever is currently in the output, moves it into the input box, and flips the direction — so a JSON to CSV result becomes the input for CSV to JSON, and vice versa. It is a quick way to round-trip your data and confirm it converts cleanly both ways.',
  },
  {
    q: 'Are nested objects and arrays supported?',
    a: 'CSV is a flat, tabular format, so deeply nested values are serialized into a single cell rather than expanded into extra columns. For best results flatten your JSON to one level of keys before converting, or keep nested structures in JSON.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. И преобразование JSON в CSV, и CSV в JSON выполняются целиком в браузере на JavaScript с помощью библиотеки Papa Parse. Ничего из вставленного не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для выгрузок, отчётов и других конфиденциальных табличных данных.',
  },
  {
    q: 'Какой формат JSON ожидает режим JSON → CSV?',
    a: 'Ожидается непустой массив объектов, например [{"a":1,"b":"x"},{"a":2,"b":"y"}]. Каждый объект становится строкой, а его ключи — заголовками столбцов. Одиночный объект, число или пустой массив отклоняются с красным статусом, а не дают сломанный результат.',
  },
  {
    q: 'Какой разделитель выбрать?',
    a: 'Запятая — стандартный разделитель CSV. Выбирайте точку с запятой, если в вашей локали запятая используется как десятичный разделитель (часто в европейских таблицах), или табуляцию, чтобы получить TSV. Один и тот же разделитель применяется и при генерации CSV, и при разборе обратно в JSON.',
  },
  {
    q: 'Как работает кнопка «Поменять местами»?',
    a: 'Она берёт то, что сейчас в поле результата, переносит это во ввод и переключает направление — так результат JSON → CSV становится вводом для CSV → JSON и наоборот. Это быстрый способ прогнать данные туда-обратно и убедиться, что они конвертируются чисто в обе стороны.',
  },
  {
    q: 'Поддерживаются ли вложенные объекты и массивы?',
    a: 'CSV — плоский табличный формат, поэтому глубоко вложенные значения сериализуются в одну ячейку, а не раскладываются по дополнительным столбцам. Для лучшего результата приведите JSON к одному уровню ключей перед преобразованием или оставьте вложенные структуры в JSON.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="json-to-csv" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'json2csv' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'json2csv'"
        >{{ ui.jsonToCsv }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'csv2json' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'csv2json'"
        >{{ ui.csvToJson }}</button>
      </div>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.delimiter }}
        <select v-model="delimiter" class="field !w-auto !py-1.5" :aria-label="ui.delimiterAria">
          <option value="comma">{{ ui.comma }}</option>
          <option value="semicolon">{{ ui.semicolon }}</option>
          <option value="tab">{{ ui.tab }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!isValid || !output" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="conversion.error && conversion.error !== 'empty'">
        <span class="font-medium text-red-600 dark:text-red-400">{{ statusLabel }}</span>
      </template>
      <template v-else-if="isValid">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="text-ink-400">· {{ conversion.rows.toLocaleString() }} {{ ui.rows }}</span>
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
          :placeholder="mode === 'json2csv' ? ui.inputJsonPlaceholder : ui.inputCsvPlaceholder"
          :aria-label="mode === 'json2csv' ? ui.inputJsonAria : ui.inputCsvAria"
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
          :aria-label="mode === 'json2csv' ? ui.outputCsvAria : ui.outputJsonAria"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер JSON в CSV и обратно онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер JSON ↔ CSV</strong> превращает массив
          JSON-объектов в таблицу CSV и разбирает CSV обратно в аккуратный JSON —
          в обе стороны, в один клик. Он создан для разработчиков и аналитиков,
          которые постоянно перекладывают данные между ответами API, выгрузками
          из баз данных и таблицами вроде Excel или Google Sheets.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваши данные не
          отправляются на сервер, поэтому инструмент безопасен для выгрузок
          пользователей, отчётов и других конфиденциальных табличных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите направление: <code>JSON → CSV</code> или <code>CSV → JSON</code>.</li>
          <li>Для <code>JSON → CSV</code> вставьте <strong>непустой массив объектов</strong> — каждый объект станет строкой, а ключи — столбцами.</li>
          <li>Выберите <code>Разделитель</code>: запятая, точка с запятой или табуляция.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы прогнать результат обратно и проверить преобразование в обе стороны.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Почему важна структура данных</h2>
        <p>
          CSV — это плоский табличный формат: одна строка заголовков и далее
          строки значений. Поэтому <strong>JSON → CSV</strong> требует массив
          объектов одинаковой формы; одиночный объект или произвольно вложенный
          JSON не ложатся в таблицу, и инструмент покажет красный статус вместо
          сломанного вывода. Глубоко вложенные значения сериализуются в одну
          ячейку, поэтому перед конвертацией данные лучше привести к одному
          уровню ключей.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно сначала привести JSON в порядок? Откройте
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink>.
          Для работы с числами в разных системах счисления пригодится
          <NuxtLink :to="localePath('/number-base-converter')">конвертер систем счисления</NuxtLink>,
          а закодировать результат поможет
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert JSON to CSV and back online</h2>
        <p>
          This free <strong>JSON ↔ CSV converter</strong> turns an array of JSON
          objects into a CSV table and parses CSV back into clean JSON — both
          directions, in a single click. It is built for developers and analysts
          who constantly move data between API responses, database exports and
          spreadsheets like Excel or Google Sheets.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your data is
          never sent to a server, so it is safe to use with user exports, reports
          and other sensitive tabular data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick a direction: <code>JSON → CSV</code> or <code>CSV → JSON</code>.</li>
          <li>For <code>JSON → CSV</code>, paste a <strong>non-empty array of objects</strong> — each object becomes a row and its keys become columns.</li>
          <li>Choose a <code>Delimiter</code>: comma, semicolon or tab.</li>
          <li>Click <code>Swap</code> to feed the output back as input and verify the round-trip both ways.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>Why the data shape matters</h2>
        <p>
          CSV is a flat, tabular format: one header row followed by rows of
          values. That is why <strong>JSON → CSV</strong> requires an array of
          uniformly shaped objects; a single object or arbitrarily nested JSON
          does not map onto a table, so the tool shows a red status instead of
          producing broken output. Deeply nested values are serialized into a
          single cell, so it is best to flatten your data to one level of keys
          before converting.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to tidy up the JSON first? Open the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
          To work with numbers across radixes, try the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>,
          or encode the result with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
