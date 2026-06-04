<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Group = 'control' | 'printable'

interface AsciiRow {
  dec: number
  hex: string // 2-digit uppercase, e.g. '0A'
  oct: string // 3-digit, e.g. '012'
  bin: string // 8-digit, e.g. '00001010'
  /** Abbreviation for control chars (NUL, LF…), the literal char for printable, or '(space)'. */
  glyph: string
  /** True when `glyph` is a real printable character rather than an abbreviation/label. */
  printable: boolean
  descEn: string
  descRu: string
  group: Group
}

// Abbreviation + bilingual description for the 0–31 and 127 control characters.
// Pure constant data — identical in Node prerender and the browser.
interface Control {
  abbr: string
  descEn: string
  descRu: string
}
const CONTROL: Record<number, Control> = {
  0: { abbr: 'NUL', descEn: 'Null character', descRu: 'Нулевой символ' },
  1: { abbr: 'SOH', descEn: 'Start of heading', descRu: 'Начало заголовка' },
  2: { abbr: 'STX', descEn: 'Start of text', descRu: 'Начало текста' },
  3: { abbr: 'ETX', descEn: 'End of text', descRu: 'Конец текста' },
  4: { abbr: 'EOT', descEn: 'End of transmission', descRu: 'Конец передачи' },
  5: { abbr: 'ENQ', descEn: 'Enquiry', descRu: 'Запрос' },
  6: { abbr: 'ACK', descEn: 'Acknowledge', descRu: 'Подтверждение' },
  7: { abbr: 'BEL', descEn: 'Bell (alert)', descRu: 'Звонок (сигнал)' },
  8: { abbr: 'BS', descEn: 'Backspace', descRu: 'Возврат на шаг (backspace)' },
  9: { abbr: 'HT', descEn: 'Horizontal tab', descRu: 'Горизонтальная табуляция (tab)' },
  10: { abbr: 'LF', descEn: 'Line feed (newline)', descRu: 'Перевод строки (новая строка)' },
  11: { abbr: 'VT', descEn: 'Vertical tab', descRu: 'Вертикальная табуляция' },
  12: { abbr: 'FF', descEn: 'Form feed', descRu: 'Прогон страницы (form feed)' },
  13: { abbr: 'CR', descEn: 'Carriage return', descRu: 'Возврат каретки' },
  14: { abbr: 'SO', descEn: 'Shift out', descRu: 'Выход за пределы (shift out)' },
  15: { abbr: 'SI', descEn: 'Shift in', descRu: 'Возврат в пределы (shift in)' },
  16: { abbr: 'DLE', descEn: 'Data link escape', descRu: 'Переключение канала данных' },
  17: { abbr: 'DC1', descEn: 'Device control 1 (XON)', descRu: 'Управление устройством 1 (XON)' },
  18: { abbr: 'DC2', descEn: 'Device control 2', descRu: 'Управление устройством 2' },
  19: { abbr: 'DC3', descEn: 'Device control 3 (XOFF)', descRu: 'Управление устройством 3 (XOFF)' },
  20: { abbr: 'DC4', descEn: 'Device control 4', descRu: 'Управление устройством 4' },
  21: { abbr: 'NAK', descEn: 'Negative acknowledge', descRu: 'Отрицательное подтверждение' },
  22: { abbr: 'SYN', descEn: 'Synchronous idle', descRu: 'Синхронизация' },
  23: { abbr: 'ETB', descEn: 'End of transmission block', descRu: 'Конец блока передачи' },
  24: { abbr: 'CAN', descEn: 'Cancel', descRu: 'Отмена' },
  25: { abbr: 'EM', descEn: 'End of medium', descRu: 'Конец носителя' },
  26: { abbr: 'SUB', descEn: 'Substitute', descRu: 'Замена' },
  27: { abbr: 'ESC', descEn: 'Escape', descRu: 'Управляющий символ Escape' },
  28: { abbr: 'FS', descEn: 'File separator', descRu: 'Разделитель файлов' },
  29: { abbr: 'GS', descEn: 'Group separator', descRu: 'Разделитель групп' },
  30: { abbr: 'RS', descEn: 'Record separator', descRu: 'Разделитель записей' },
  31: { abbr: 'US', descEn: 'Unit separator', descRu: 'Разделитель единиц' },
  127: { abbr: 'DEL', descEn: 'Delete', descRu: 'Удаление (delete)' },
}

// Short category words for printable characters.
const CAT = {
  space: { en: 'Space', ru: 'Пробел' },
  digit: { en: 'Digit', ru: 'Цифра' },
  upper: { en: 'Uppercase letter', ru: 'Заглавная буква' },
  lower: { en: 'Lowercase letter', ru: 'Строчная буква' },
  punct: { en: 'Punctuation', ru: 'Пунктуация' },
}

// Build all 128 rows (0..127) with a pure loop at module scope.
function buildRows(): AsciiRow[] {
  const rows: AsciiRow[] = []
  for (let dec = 0; dec < 128; dec++) {
    const hex = dec.toString(16).toUpperCase().padStart(2, '0')
    const oct = dec.toString(8).padStart(3, '0')
    const bin = dec.toString(2).padStart(8, '0')

    let glyph: string
    let printable: boolean
    let descEn: string
    let descRu: string
    let group: Group

    if (dec === 32) {
      glyph = '(space)'
      printable = false
      descEn = CAT.space.en
      descRu = CAT.space.ru
      group = 'printable'
    } else if (dec >= 33 && dec <= 126) {
      glyph = String.fromCharCode(dec)
      printable = true
      group = 'printable'
      if (dec >= 48 && dec <= 57) {
        descEn = CAT.digit.en
        descRu = CAT.digit.ru
      } else if (dec >= 65 && dec <= 90) {
        descEn = CAT.upper.en
        descRu = CAT.upper.ru
      } else if (dec >= 97 && dec <= 122) {
        descEn = CAT.lower.en
        descRu = CAT.lower.ru
      } else {
        descEn = CAT.punct.en
        descRu = CAT.punct.ru
      }
    } else {
      // Control characters: 0..31 and 127.
      const c = CONTROL[dec]!
      glyph = c.abbr
      printable = false
      descEn = c.descEn
      descRu = c.descRu
      group = 'control'
    }

    rows.push({ dec, hex, oct, bin, glyph, printable, descEn, descRu, group })
  }
  return rows
}

const rows: AsciiRow[] = buildRows()

const GROUPS: Group[] = ['control', 'printable']

const query = ref('')

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        searchPlaceholder: 'Поиск по dec, hex, oct, bin, символу или названию (например 65, 0A, A, LF)…',
        searchAria: 'Поиск по таблице ASCII',
        noResults: 'Ничего не найдено. Попробуйте другой код, символ или ключевое слово.',
        colDec: 'Dec',
        colHex: 'Hex',
        colOct: 'Oct',
        colBin: 'Bin',
        colChar: 'Символ',
        colName: 'Название',
        groupLabels: {
          control: 'Управляющие символы',
          printable: 'Печатные символы',
        } as Record<Group, string>,
      }
    : {
        searchPlaceholder: 'Search by dec, hex, oct, bin, character or name (e.g. 65, 0A, A, LF)…',
        searchAria: 'Search the ASCII table',
        noResults: 'No matches. Try a different code, character or keyword.',
        colDec: 'Dec',
        colHex: 'Hex',
        colOct: 'Oct',
        colBin: 'Bin',
        colChar: 'Char',
        colName: 'Name',
        groupLabels: {
          control: 'Control characters',
          printable: 'Printable characters',
        } as Record<Group, string>,
      },
)

// Live filter by dec/hex/oct/bin, the glyph/abbreviation, or the current-locale
// description. Pure (no clock/random/DOM) — safe to evaluate during prerender.
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((r) => {
    const desc = locale.value === 'ru' ? r.descRu : r.descEn
    return (
      String(r.dec).includes(q) ||
      r.hex.toLowerCase().includes(q) ||
      r.oct.includes(q) ||
      r.bin.includes(q) ||
      r.glyph.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q)
    )
  })
})

// Group the filtered rows, dropping empty groups.
const groups = computed(() =>
  GROUPS.map((group) => ({
    group,
    items: filtered.value.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0),
)

const totalCount = computed(() => filtered.value.length)

function desc(r: AsciiRow): string {
  return locale.value === 'ru' ? r.descRu : r.descEn
}

// Copy text for a row: the character for printable rows, the abbreviation otherwise.
function copyText(r: AsciiRow): string {
  return r.printable ? r.glyph : r.group === 'printable' ? ' ' : r.glyph
}

function clearSearch() {
  query.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is anything I search sent to a server?',
    a: 'No. This is a static reference: the full 128-character ASCII table ships with the page and the search filters it entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored.',
  },
  {
    q: 'What is the difference between control and printable characters?',
    a: 'Codes 0–31 and 127 are control characters — invisible signals like tab (9), line feed (10) and carriage return (13) that direct devices rather than print a glyph. Codes 32–126 are printable: the space, digits, letters and punctuation you actually see on screen.',
  },
  {
    q: 'Why does the table only go up to 127?',
    a: 'Standard ASCII is a 7-bit encoding, so it defines exactly 128 code points (0–127). Values 128–255 belong to "extended ASCII" code pages or to multi-byte encodings such as UTF-8, which are not part of the original ASCII standard shown here.',
  },
  {
    q: 'How do I convert an ASCII code between decimal, hex, octal and binary?',
    a: 'Every row already lists all four representations side by side, so you can read them off directly — for example the letter A is 65 in decimal, 41 in hex, 101 in octal and 01000001 in binary. For arbitrary numbers, use the linked number base converter.',
  },
  {
    q: 'What does the copy button copy for control characters?',
    a: 'For printable rows it copies the literal character (a space for code 32). For control characters it copies the abbreviation, such as LF or ESC, since those codes have no visible glyph to place on the clipboard.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой поисковый запрос на сервер?',
    a: 'Нет. Это статический справочник: полная таблица ASCII из 128 символов поставляется вместе со страницей, а поиск фильтрует её полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Чем управляющие символы отличаются от печатных?',
    a: 'Коды 0–31 и 127 — управляющие символы: невидимые сигналы вроде табуляции (9), перевода строки (10) и возврата каретки (13), которые управляют устройствами, а не печатают глиф. Коды 32–126 — печатные: пробел, цифры, буквы и знаки препинания, которые вы видите на экране.',
  },
  {
    q: 'Почему таблица заканчивается на 127?',
    a: 'Стандартный ASCII — это 7-битная кодировка, поэтому в ней ровно 128 кодовых точек (0–127). Значения 128–255 относятся к «расширенному ASCII» (кодовым страницам) или к многобайтовым кодировкам вроде UTF-8, которые не входят в исходный стандарт ASCII, показанный здесь.',
  },
  {
    q: 'Как перевести код ASCII между dec, hex, oct и binary?',
    a: 'В каждой строке уже приведены все четыре представления рядом, так что их можно прочитать напрямую — например, буква A равна 65 в десятичной, 41 в шестнадцатеричной, 101 в восьмеричной и 01000001 в двоичной системе. Для произвольных чисел воспользуйтесь конвертером систем счисления по ссылке.',
  },
  {
    q: 'Что копирует кнопка копирования для управляющих символов?',
    a: 'Для печатных строк копируется сам символ (для кода 32 — пробел). Для управляющих символов копируется аббревиатура, например LF или ESC, поскольку у этих кодов нет видимого глифа, который можно поместить в буфер обмена.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="ascii-table" :faq="faq">
    <!-- Search -->
    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="query"
        class="field flex-1"
        type="search"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.searchPlaceholder"
        :aria-label="ui.searchAria"
      >
      <button
        v-if="query"
        type="button"
        class="btn-ghost"
        @click="clearSearch"
      >{{ t('common.clear') }}</button>
    </div>

    <!-- Result count -->
    <div class="mt-3 min-h-[1.25rem] text-sm text-ink-400">
      {{ totalCount }} / {{ rows.length }}
    </div>

    <!-- Grouped reference -->
    <div v-if="groups.length" class="mt-2 space-y-8">
      <section v-for="g in groups" :key="g.group">
        <h2 class="mb-3 text-sm font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
          {{ ui.groupLabels[g.group] }}
        </h2>
        <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
          <!-- Column header -->
          <div
            class="hidden items-center gap-3 border-b border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold tracking-wide text-ink-500 uppercase sm:flex sm:gap-4 sm:px-4 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
          >
            <span class="w-10 shrink-0 text-right">{{ ui.colDec }}</span>
            <span class="w-10 shrink-0">{{ ui.colHex }}</span>
            <span class="w-12 shrink-0">{{ ui.colOct }}</span>
            <span class="w-24 shrink-0">{{ ui.colBin }}</span>
            <span class="w-16 shrink-0">{{ ui.colChar }}</span>
            <span class="min-w-0 flex-1">{{ ui.colName }}</span>
          </div>
          <div
            v-for="(r, i) in g.items"
            :key="r.dec"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:flex-nowrap sm:gap-4 sm:px-4"
            :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
          >
            <span class="w-10 shrink-0 text-right font-mono text-base font-semibold text-accent tabular-nums">{{ r.dec }}</span>
            <span class="w-10 shrink-0 font-mono text-sm text-ink-600 tabular-nums dark:text-ink-300">{{ r.hex }}</span>
            <span class="w-12 shrink-0 font-mono text-sm text-ink-600 tabular-nums dark:text-ink-300">{{ r.oct }}</span>
            <span class="w-24 shrink-0 font-mono text-sm text-ink-600 tabular-nums dark:text-ink-300">{{ r.bin }}</span>
            <span
              class="w-16 shrink-0 font-mono"
              :class="r.printable ? 'text-lg font-semibold text-ink-800 dark:text-ink-100' : 'text-sm text-ink-500 dark:text-ink-400'"
            >{{ r.glyph }}</span>
            <span class="min-w-0 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ desc(r) }}</span>
            <CopyButton :text="() => copyText(r)" small class="ml-auto shrink-0" />
          </div>
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <p v-else class="mt-2 rounded-lg border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-400 dark:border-ink-700">
      {{ ui.noResults }}
    </p>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Таблица ASCII с поиском: dec, hex, oct и binary</h2>
        <p>
          Эта бесплатная <strong>таблица ASCII</strong> собирает все 128 символов
          стандартной 7-битной кодировки в одном месте: для каждого кода показаны
          десятичное (dec), шестнадцатеричное (hex), восьмеричное (oct) и двоичное
          (bin) представления, сам символ или его аббревиатура, а также краткое
          описание. Строка поиска мгновенно фильтрует таблицу по любому из этих
          полей — удобно, когда нужно быстро узнать код символа или, наоборот,
          какой символ соответствует коду.
        </p>
        <p>
          Весь справочник работает <strong>полностью в браузере</strong>. Таблица
          загружается вместе со страницей, поиск выполняется локально, и ничего из
          введённого не отправляется на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Начните вводить в поле поиска — таблица фильтруется на лету.</li>
          <li>Ищите по десятичному коду (<code>65</code>), hex (<code>0A</code>), oct (<code>101</code>), bin (<code>01000001</code>), символу (<code>A</code>) или названию (<code>LF</code>).</li>
          <li>Просматривайте символы по группам: <code>управляющие</code> (0–31, 127) и <code>печатные</code> (32–126).</li>
          <li>Нажмите <code>Копировать</code> в строке: для печатных копируется сам символ, для управляющих — аббревиатура вроде <code>ESC</code>.</li>
          <li>Очистите поиск, чтобы снова увидеть обе группы целиком.</li>
        </ul>

        <h2>Управляющие и печатные символы</h2>
        <p>
          Коды <strong>0–31</strong> и <strong>127</strong> — управляющие символы.
          Они не печатают глиф, а подают сигналы: <code>HT</code> (9) — табуляция,
          <code>LF</code> (10) — перевод строки, <code>CR</code> (13) — возврат
          каретки, <code>ESC</code> (27) — начало управляющей последовательности.
          Коды <strong>32–126</strong> — печатные: пробел, цифры
          <code>0–9</code>, заглавные <code>A–Z</code>, строчные <code>a–z</code>
          и знаки препинания. Именно эти 95 печатных символов лежат в основе
          текста, имён файлов и большинства форматов данных.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно перевести произвольное число между системами счисления? Откройте
          <NuxtLink :to="localePath('/number-base-converter')">конвертер систем счисления</NuxtLink>.
          Разбираетесь с веб-запросами? Загляните в справочник
          <NuxtLink :to="localePath('/http-headers')">HTTP-заголовков</NuxtLink>
          или в таблицу
          <NuxtLink :to="localePath('/html-entities')">HTML-сущностей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Searchable ASCII table: dec, hex, oct and binary</h2>
        <p>
          This free <strong>ASCII table</strong> gathers all 128 characters of the
          standard 7-bit encoding in one place: each code shows its decimal (dec),
          hexadecimal (hex), octal (oct) and binary (bin) representations, the
          character itself or its abbreviation, and a short description. The search
          box filters the table instantly by any of those fields — handy when you
          need to look up a character's code, or which character a code maps to.
        </p>
        <p>
          The whole reference runs <strong>entirely in your browser</strong>. The
          table ships with the page, the search happens locally, and nothing you
          type is sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Start typing in the search box — the table filters as you type.</li>
          <li>Search by decimal code (<code>65</code>), hex (<code>0A</code>), oct (<code>101</code>), bin (<code>01000001</code>), the character (<code>A</code>) or a name (<code>LF</code>).</li>
          <li>Browse characters by group: <code>control</code> (0–31, 127) and <code>printable</code> (32–126).</li>
          <li>Click <code>Copy</code> on a row: printable rows copy the character itself, control rows copy the abbreviation such as <code>ESC</code>.</li>
          <li>Clear the search to see both groups in full again.</li>
        </ul>

        <h2>Control vs. printable characters</h2>
        <p>
          Codes <strong>0–31</strong> and <strong>127</strong> are control
          characters. They print no glyph and instead send signals: <code>HT</code>
          (9) is a tab, <code>LF</code> (10) is a line feed, <code>CR</code> (13) is
          a carriage return, and <code>ESC</code> (27) starts an escape sequence.
          Codes <strong>32–126</strong> are printable: the space, the digits
          <code>0–9</code>, uppercase <code>A–Z</code>, lowercase <code>a–z</code>
          and punctuation. These 95 printable characters are the backbone of text,
          file names and most data formats.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to convert an arbitrary number between bases? Open the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>.
          Working with web requests? Check the
          <NuxtLink :to="localePath('/http-headers')">HTTP headers</NuxtLink> reference
          or the <NuxtLink :to="localePath('/html-entities')">HTML entities</NuxtLink> table.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
