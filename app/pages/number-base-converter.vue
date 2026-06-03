<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Source value and its base. `sourceBase` is a preset (2/8/10/16) or 'custom',
// in which case `customBase` (2..36) is used.
const input = ref('')
const sourceBase = ref<'2' | '8' | '10' | '16' | 'custom'>('10')
const customBase = ref(36)

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

const activeBase = computed(() =>
  sourceBase.value === 'custom' ? customBase.value : Number(sourceBase.value),
)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        sourceBase: 'Система счисления',
        binary: 'Двоичная (2)',
        octal: 'Восьмеричная (8)',
        decimal: 'Десятичная (10)',
        hex: 'Шестнадцатеричная (16)',
        custom: 'Произвольная (2–36)',
        customBaseLabel: 'Основание',
        valuePlaceholder: 'Введите число…',
        invalidBase: 'Основание должно быть от 2 до 36.',
        invalidDigit: (d: string, b: number) =>
          `Недопустимая цифра «${d}» для основания ${b}.`,
        emptyHint: 'Введите число и выберите его систему счисления.',
        valid: '✓ Число распознано',
        outputs: 'Результаты',
        targetCustom: (b: number) => `Произвольная (${b})`,
      }
    : {
        sourceBase: 'Source base',
        binary: 'Binary (2)',
        octal: 'Octal (8)',
        decimal: 'Decimal (10)',
        hex: 'Hexadecimal (16)',
        custom: 'Arbitrary (2–36)',
        customBaseLabel: 'Base',
        valuePlaceholder: 'Enter a number…',
        invalidBase: 'Base must be between 2 and 36.',
        invalidDigit: (d: string, b: number) =>
          `Invalid digit "${d}" for base ${b}.`,
        emptyHint: 'Enter a number and choose its base.',
        valid: '✓ Number parsed',
        outputs: 'Results',
        targetCustom: (b: number) => `Arbitrary (${b})`,
      },
)

interface ParseResult {
  value: bigint | null
  error: string | null
}

// Parse `input` digit-by-digit in `activeBase` into a BigInt.
// Pure: uses only BigInt + string ops, safe during SSG prerender.
const parsed = computed<ParseResult>(() => {
  const base = activeBase.value
  if (!Number.isInteger(base) || base < 2 || base > 36) {
    return { value: null, error: ui.value.invalidBase }
  }

  const raw = input.value.trim()
  if (!raw) return { value: null, error: null }

  let negative = false
  let body = raw
  if (body[0] === '+' || body[0] === '-') {
    negative = body[0] === '-'
    body = body.slice(1)
  }
  // Allow common separators between digits.
  body = body.replace(/[\s_]/g, '')
  if (!body) return { value: null, error: null }

  const bigBase = BigInt(base)
  let acc = 0n
  for (const ch of body.toLowerCase()) {
    const d = DIGITS.indexOf(ch)
    if (d === -1 || d >= base) {
      return { value: null, error: ui.value.invalidDigit(ch, base) }
    }
    acc = acc * bigBase + BigInt(d)
  }
  if (negative) acc = -acc
  return { value: acc, error: null }
})

const error = computed(() => parsed.value.error)
const hasValue = computed(() => parsed.value.value !== null)

// Format a BigInt into a given radix; BigInt.toString(radix) covers 2..36.
function toBase(value: bigint, base: number, upper = false): string {
  const s = value.toString(base)
  return upper ? s.toUpperCase() : s
}

const outBinary = computed(() =>
  parsed.value.value === null ? '' : toBase(parsed.value.value, 2),
)
const outOctal = computed(() =>
  parsed.value.value === null ? '' : toBase(parsed.value.value, 8),
)
const outDecimal = computed(() =>
  parsed.value.value === null ? '' : toBase(parsed.value.value, 10),
)
const outHex = computed(() =>
  parsed.value.value === null ? '' : toBase(parsed.value.value, 16, true),
)
// Arbitrary target mirrors the custom base selector (defaults to 36).
const outCustom = computed(() =>
  parsed.value.value === null ? '' : toBase(parsed.value.value, customBase.value, true),
)

function clear() {
  input.value = ''
}

function loadSample() {
  sourceBase.value = '10'
  input.value = '255'
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my number sent to a server?',
    a: 'No. Every conversion runs entirely in your browser using JavaScript BigInt arithmetic. Nothing you type is uploaded, logged or stored, so it is safe even for values you would rather keep private.',
  },
  {
    q: 'How large can the numbers be?',
    a: 'As large as your browser can hold in memory. The converter uses BigInt, so there is no 32-bit or 53-bit limit — you can convert hundreds of digits without losing precision.',
  },
  {
    q: 'What does "base" or "radix" mean?',
    a: 'The base is how many distinct digits a system uses. Binary (base 2) uses 0–1, decimal (base 10) uses 0–9, and hexadecimal (base 16) uses 0–9 then A–F. The same quantity just looks different in each base.',
  },
  {
    q: 'Why was my input rejected?',
    a: 'Each base only allows certain digits. Base 2 accepts only 0 and 1, so "12" is invalid. The status line shows the exact offending digit and the base it was checked against. Spaces and underscores between digits are ignored.',
  },
  {
    q: 'Can it handle negative numbers and arbitrary bases?',
    a: 'Yes. A leading minus sign is supported, and you can pick any base from 2 to 36 for both the input and the arbitrary output column. Digits above 9 use the letters A–Z, exactly like hexadecimal extends past 9.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли моё число на сервер?',
    a: 'Нет. Все преобразования выполняются прямо в браузере с помощью арифметики BigInt в JavaScript. Введённое не загружается, не логируется и не сохраняется, поэтому инструмент безопасен даже для значений, которые лучше не показывать.',
  },
  {
    q: 'Насколько большие числа поддерживаются?',
    a: 'Настолько, насколько хватает памяти браузера. Конвертер использует BigInt, поэтому нет ограничений в 32 или 53 бита — можно переводить числа из сотен цифр без потери точности.',
  },
  {
    q: 'Что такое «основание» или «система счисления»?',
    a: 'Основание — это сколько различных цифр использует система. Двоичная (основание 2) использует 0–1, десятичная (10) — 0–9, шестнадцатеричная (16) — 0–9, затем A–F. Одна и та же величина просто по-разному выглядит в каждой системе.',
  },
  {
    q: 'Почему ввод был отклонён?',
    a: 'В каждой системе допустимы только определённые цифры. Основание 2 принимает лишь 0 и 1, поэтому «12» недопустимо. В строке статуса показывается конкретная неверная цифра и основание, по которому шла проверка. Пробелы и подчёркивания между цифрами игнорируются.',
  },
  {
    q: 'Поддерживаются ли отрицательные числа и произвольные основания?',
    a: 'Да. Поддерживается ведущий знак минус, а основание можно выбрать любое от 2 до 36 как для ввода, так и для произвольной колонки вывода. Цифры больше 9 обозначаются буквами A–Z, ровно как hex продолжает счёт после 9.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="number-base-converter" :faq="faq">
    <!-- Input + source base -->
    <div class="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div>
        <label class="label" for="nbc-value">{{ t('common.input') }}</label>
        <input
          id="nbc-value"
          v-model="input"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.valuePlaceholder"
          :aria-label="t('common.input')"
        >
      </div>

      <div>
        <label class="label" for="nbc-base">{{ ui.sourceBase }}</label>
        <div class="flex items-center gap-2">
          <select
            id="nbc-base"
            v-model="sourceBase"
            class="field !w-auto"
            :aria-label="ui.sourceBase"
          >
            <option value="2">{{ ui.binary }}</option>
            <option value="8">{{ ui.octal }}</option>
            <option value="10">{{ ui.decimal }}</option>
            <option value="16">{{ ui.hex }}</option>
            <option value="custom">{{ ui.custom }}</option>
          </select>
          <label
            v-if="sourceBase === 'custom'"
            class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
          >
            {{ ui.customBaseLabel }}
            <input
              v-model.number="customBase"
              type="number"
              min="2"
              max="36"
              class="field !w-20"
              :aria-label="ui.customBaseLabel"
            >
          </label>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
      <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ error }}</span>
      </template>
      <template v-else-if="hasValue">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
      </template>
      <span v-else class="text-ink-400">{{ ui.emptyHint }}</span>
    </div>

    <!-- Outputs -->
    <div class="mt-4">
      <div class="label">{{ ui.outputs }}</div>
      <div class="space-y-2">
        <!-- Binary -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span class="w-40 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.binary }}</span>
          <input
            class="field"
            readonly
            :value="outBinary"
            :aria-label="ui.binary"
          >
          <CopyButton :text="() => outBinary" small />
        </div>
        <!-- Octal -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span class="w-40 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.octal }}</span>
          <input
            class="field"
            readonly
            :value="outOctal"
            :aria-label="ui.octal"
          >
          <CopyButton :text="() => outOctal" small />
        </div>
        <!-- Decimal -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span class="w-40 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.decimal }}</span>
          <input
            class="field"
            readonly
            :value="outDecimal"
            :aria-label="ui.decimal"
          >
          <CopyButton :text="() => outDecimal" small />
        </div>
        <!-- Hex -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span class="w-40 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.hex }}</span>
          <input
            class="field"
            readonly
            :value="outHex"
            :aria-label="ui.hex"
          >
          <CopyButton :text="() => outHex" small />
        </div>
        <!-- Arbitrary target base -->
        <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span class="flex w-40 shrink-0 items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-300">
            {{ ui.targetCustom(customBase) }}
            <input
              v-model.number="customBase"
              type="number"
              min="2"
              max="36"
              class="field !w-16 !py-1"
              :aria-label="ui.customBaseLabel"
            >
          </span>
          <input
            class="field"
            readonly
            :value="outCustom"
            :aria-label="ui.targetCustom(customBase)"
          >
          <CopyButton :text="() => outCustom" small />
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер систем счисления онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер систем счисления</strong> переводит
          число между двоичной, восьмеричной, десятичной и шестнадцатеричной
          системами одновременно, а также в любое <strong>произвольное основание
          от 2 до 36</strong>. Вы указываете число и систему, в которой оно
          записано, а все остальные представления появляются мгновенно — каждое с
          кнопкой копирования.
        </p>
        <p>
          Под капотом используется <code>BigInt</code>, поэтому работают сколь
          угодно большие целые числа без потери точности — никаких ограничений в
          32 или 53 бита, как у обычных чисел JavaScript. Всё считается
          <strong>прямо в браузере</strong>: ничего не отправляется на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите число в поле ввода.</li>
          <li>Выберите его систему: двоичная, восьмеричная, десятичная, hex или произвольная (2–36).</li>
          <li>Для произвольной системы задайте основание в поле <code>Основание</code>.</li>
          <li>Смотрите результат сразу в bin, oct, dec, hex и выбранном произвольном основании.</li>
          <li>Нажмите <code>Копировать</code> рядом с нужной строкой или <code>Пример</code>, чтобы попробовать.</li>
        </ul>

        <h2>Цифры и проверка ввода</h2>
        <p>
          В каждой системе допустим свой набор цифр: основание 2 — только
          <code>0</code> и <code>1</code>, основание 16 — <code>0–9</code> и
          <code>A–F</code>, а для оснований выше 10 используются буквы вплоть до
          <code>Z</code> (основание 36). Если вы введёте цифру, недопустимую для
          выбранного основания (например, <code>2</code> в двоичной системе),
          инструмент покажет красное сообщение и не выдаст результат — без сбоев и
          исключений. Пробелы, подчёркивания и ведущий знак минус допускаются.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете с hex и значениями? Переведите цвета в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>,
          посчитайте контрольную сумму в
          <NuxtLink :to="localePath('/hash-generator')">генераторе хешей</NuxtLink>
          или разберите время в
          <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертере Unix timestamp</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Number base converter online</h2>
        <p>
          This free <strong>number base converter</strong> translates a value
          between binary, octal, decimal and hexadecimal at the same time, plus
          any <strong>arbitrary base from 2 to 36</strong>. You enter a number and
          the base it is written in, and every other representation appears
          instantly — each with its own copy button.
        </p>
        <p>
          It uses <code>BigInt</code> under the hood, so arbitrarily large
          integers convert without losing precision — there is no 32-bit or
          53-bit ceiling like with ordinary JavaScript numbers. Everything is
          computed <strong>right in your browser</strong>: nothing is sent to a
          server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a number into the input field.</li>
          <li>Choose its base: binary, octal, decimal, hex or arbitrary (2–36).</li>
          <li>For an arbitrary base, set the radix in the <code>Base</code> field.</li>
          <li>Read the result immediately in bin, oct, dec, hex and your chosen arbitrary base.</li>
          <li>Click <code>Copy</code> next to any row, or <code>Sample</code> to try it.</li>
        </ul>

        <h2>Digits and input validation</h2>
        <p>
          Each base allows its own set of digits: base 2 only <code>0</code> and
          <code>1</code>, base 16 <code>0–9</code> and <code>A–F</code>, and bases
          above 10 use letters up to <code>Z</code> (base 36). If you type a digit
          that is illegal for the chosen base — for example <code>2</code> in
          binary — the tool shows a red message and produces no output, with no
          crashes or thrown errors. Spaces, underscores and a leading minus sign
          are accepted.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with hex and values? Convert colors in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>,
          compute a checksum with the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>,
          or decode time with the
          <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
