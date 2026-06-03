<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        currentUnixTime: 'Текущее Unix-время',
        seconds: 'секунд',
        ms: 'мс',
        copySeconds: 'Копировать секунды',
        now: 'Сейчас',
        tsToDate: 'Timestamp → Дата',
        dateToTs: 'Дата → Timestamp',
        unixTimestamp: 'Unix timestamp',
        tsPlaceholder: 'например, 1700000000',
        unit: 'Единица',
        autoDetect: 'Автоопределение',
        unitSeconds: 'Секунды',
        unitMs: 'Миллисекунды',
        enterToConvert: 'Введите epoch в секундах или миллисекундах для конвертации.',
        interpretedAs: 'Интерпретировано как',
        valMs: 'миллисекунды',
        valSeconds: 'секунды',
        utc: 'UTC',
        iso8601: 'ISO 8601',
        localTime: 'Местное время',
        relative: 'Относительно',
        dateTimeLabel: 'Дата и время (ваш часовой пояс)',
        isoUtc: 'ISO 8601 (UTC):',
        epochSeconds: 'Epoch, секунды',
        epochMs: 'Epoch, миллисекунды',
        errWholeNumber: 'Введите целое число (epoch в секундах или миллисекундах).',
        errOutOfRange: 'Это значение вне диапазона представимых дат.',
        errPickDate: 'Выберите дату и время, чтобы получить epoch timestamp.',
        errParse: 'Не удалось разобрать дату — попробуйте выбрать её заново.',
      }
    : {
        currentUnixTime: 'Current Unix time',
        seconds: 'seconds',
        ms: 'ms',
        copySeconds: 'Copy seconds',
        now: 'Now',
        tsToDate: 'Timestamp → Date',
        dateToTs: 'Date → Timestamp',
        unixTimestamp: 'Unix timestamp',
        tsPlaceholder: 'e.g. 1700000000',
        unit: 'Unit',
        autoDetect: 'Auto-detect',
        unitSeconds: 'Seconds',
        unitMs: 'Milliseconds',
        enterToConvert: 'Enter epoch seconds or milliseconds to convert.',
        interpretedAs: 'Interpreted as',
        valMs: 'milliseconds',
        valSeconds: 'seconds',
        utc: 'UTC',
        iso8601: 'ISO 8601',
        localTime: 'Local time',
        relative: 'Relative',
        dateTimeLabel: 'Date & time (your local timezone)',
        isoUtc: 'ISO 8601 (UTC):',
        epochSeconds: 'Epoch seconds',
        epochMs: 'Epoch milliseconds',
        errWholeNumber: 'Enter a whole number (epoch seconds or milliseconds).',
        errOutOfRange: 'That value is out of the range of representable dates.',
        errPickDate: 'Pick a date and time to convert it to an epoch timestamp.',
        errParse: 'That date could not be parsed — try re-selecting it.',
      },
)

// ── Live "current unix time" (client-only; see SSG notes) ──────────────────
const now = ref<number | null>(null) // ms since epoch; null until mounted
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  now.value = Date.now()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const nowSeconds = computed(() => (now.value === null ? '' : String(Math.floor(now.value / 1000))))
const nowMillis = computed(() => (now.value === null ? '' : String(now.value)))

// ── Helpers ────────────────────────────────────────────────────────────────
function isFiniteNumberString(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  // Accept integers (optionally signed); reject anything non-numeric/Invalid.
  return /^-?\d+$/.test(t)
}

// Build a relative ("3 days ago" / "in 5 minutes") string from a delta in ms.
const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: 'day', ms: 24 * 60 * 60 * 1000 },
  { unit: 'hour', ms: 60 * 60 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
]

function formatRelative(targetMs: number, fromMs: number): string {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const diff = targetMs - fromMs // positive => in the future
  const abs = Math.abs(diff)
  for (const { unit, ms } of RELATIVE_UNITS) {
    if (abs >= ms || unit === 'second') {
      const value = Math.round(diff / ms)
      return rtf.format(value, unit)
    }
  }
  return rtf.format(0, 'second')
}

// ── Section A: Timestamp -> Date ────────────────────────────────────────────
const tsInput = ref('1700000000')
const unit = ref<'auto' | 's' | 'ms'>('auto')

// Effective unit after auto-detection (>= 1e12 looks like ms).
const detectedUnit = computed<'s' | 'ms' | null>(() => {
  if (!isFiniteNumberString(tsInput.value)) return null
  if (unit.value !== 'auto') return unit.value
  const n = Math.abs(Number(tsInput.value))
  return n >= 1e12 ? 'ms' : 's'
})

const tsMillis = computed<number | null>(() => {
  if (detectedUnit.value === null) return null
  const n = Number(tsInput.value)
  if (!Number.isFinite(n)) return null
  return detectedUnit.value === 'ms' ? n : n * 1000
})

const tsDate = computed<Date | null>(() => {
  if (tsMillis.value === null) return null
  const d = new Date(tsMillis.value)
  return Number.isNaN(d.getTime()) ? null : d
})

const tsError = computed<string | null>(() => {
  if (!tsInput.value.trim()) return null
  if (!isFiniteNumberString(tsInput.value)) return ui.value.errWholeNumber
  if (tsDate.value === null) return ui.value.errOutOfRange
  return null
})

// Static (build-safe) outputs derived purely from the parsed timestamp.
const utcString = computed(() => (tsDate.value ? tsDate.value.toUTCString() : ''))
const isoString = computed(() => (tsDate.value ? tsDate.value.toISOString() : ''))

// Locale/timezone-dependent — toLocaleString reads the host TZ. Render under
// <ClientOnly> to avoid a server/client mismatch if build TZ != browser TZ.
const localString = computed(() => {
  if (!tsDate.value) return ''
  return tsDate.value.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'long' })
})

// Relative is time-dependent: keep it client-only (depends on `now`).
const relativeString = computed(() => {
  if (tsDate.value === null || now.value === null) return ''
  return formatRelative(tsDate.value.getTime(), now.value)
})

function useCurrentTimestamp() {
  if (now.value === null) return
  tsInput.value = String(Math.floor(now.value / 1000))
  unit.value = 's'
}
function clearTimestamp() {
  tsInput.value = ''
}

// ── Section B: Date -> Timestamp ────────────────────────────────────────────
// datetime-local gives a string like "2023-11-14T22:13" interpreted in LOCAL
// time by the Date constructor — exactly what we want for "local date -> epoch".
const dateInput = ref('') // populated in onMounted (current local time placeholder)

onMounted(() => {
  if (!dateInput.value) {
    const d = new Date()
    // Format as local "YYYY-MM-DDTHH:mm:ss" for the datetime-local control.
    const pad = (n: number) => String(n).padStart(2, '0')
    dateInput.value =
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
})

const dateMillis = computed<number | null>(() => {
  if (!dateInput.value) return null
  const ms = new Date(dateInput.value).getTime()
  return Number.isNaN(ms) ? null : ms
})

const dateError = computed<string | null>(() => {
  if (!dateInput.value) return ui.value.errPickDate
  if (dateMillis.value === null) return ui.value.errParse
  return null
})

const dateEpochSeconds = computed(() => (dateMillis.value === null ? '' : String(Math.floor(dateMillis.value / 1000))))
const dateEpochMillis = computed(() => (dateMillis.value === null ? '' : String(dateMillis.value)))
const dateIso = computed(() => {
  if (dateMillis.value === null) return ''
  return new Date(dateMillis.value).toISOString()
})

function useNowForDate() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  dateInput.value =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
const faqEn: FaqItem[] = [
  {
    q: 'What is a Unix timestamp?',
    a: 'A Unix timestamp (or epoch time) is the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970, ignoring leap seconds. Many systems and APIs store and exchange time this way because it is a single, timezone-independent integer that is easy to compare and sort.',
  },
  {
    q: 'Is the timestamp in seconds or milliseconds?',
    a: 'Both are common: Unix tools and most backends use seconds, while JavaScript Date.now() and many web APIs use milliseconds. This converter auto-detects the unit — values of 1e12 (a 13-digit number) or larger are treated as milliseconds — and you can override it with the unit toggle if the guess is wrong.',
  },
  {
    q: 'Does this tool send my dates to a server?',
    a: 'No. Every conversion runs entirely in your browser with the built-in JavaScript Date and Intl APIs. Nothing you type is uploaded, logged, or stored, so it is safe for internal or sensitive timestamps.',
  },
  {
    q: 'Why does the local time differ from UTC?',
    a: 'UTC is the absolute reference, while local time applies your operating system’s timezone and daylight-saving rules to the same instant. The ISO 8601 and UTC outputs are timezone-neutral, whereas the local string and relative ("3 days ago") values reflect your machine’s current settings.',
  },
  {
    q: 'What is the year 2038 problem?',
    a: 'Systems that store epoch seconds in a signed 32-bit integer overflow on 19 January 2038, after which the value wraps to a negative number. This tool uses 64-bit JavaScript numbers, so it handles dates far beyond 2038 without that limitation.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Что такое Unix timestamp?',
    a: 'Unix timestamp (или epoch time) — это число секунд, прошедших с 00:00:00 UTC 1 января 1970 года, без учёта високосных секунд. Многие системы и API хранят и передают время именно так, потому что это одно целое число, не зависящее от часового пояса, которое легко сравнивать и сортировать.',
  },
  {
    q: 'Timestamp в секундах или миллисекундах?',
    a: 'Распространены оба варианта: Unix-утилиты и большинство бэкендов используют секунды, тогда как JavaScript Date.now() и многие веб-API используют миллисекунды. Конвертер автоматически определяет единицу — значения от 1e12 (13-значное число) и больше считаются миллисекундами — а если догадка неверна, единицу можно задать вручную переключателем.',
  },
  {
    q: 'Отправляет ли инструмент мои даты на сервер?',
    a: 'Нет. Каждое преобразование выполняется полностью в браузере с помощью встроенных JavaScript-API Date и Intl. Ничего из введённого не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для внутренних или конфиденциальных timestamp.',
  },
  {
    q: 'Почему местное время отличается от UTC?',
    a: 'UTC — это абсолютная точка отсчёта, а местное время применяет к тому же моменту часовой пояс и правила перехода на летнее время вашей операционной системы. Вывод в ISO 8601 и UTC не зависит от часового пояса, тогда как строка местного времени и относительное значение («3 дня назад») отражают текущие настройки вашего компьютера.',
  },
  {
    q: 'Что такое проблема 2038 года?',
    a: 'Системы, хранящие epoch-секунды в знаковом 32-битном целом, переполняются 19 января 2038 года, после чего значение становится отрицательным. Этот инструмент использует 64-битные числа JavaScript, поэтому работает с датами далеко за пределами 2038 года без этого ограничения.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="unix-timestamp-converter" :faq="faq">
    <!-- Current Unix time (live, client-only) -->
    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 dark:border-ink-700 dark:bg-ink-950">
      <span class="text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.currentUnixTime }}</span>
      <ClientOnly>
        <span class="font-mono text-lg font-semibold tabular-nums text-ink-900 dark:text-ink-100">{{ nowSeconds }}</span>
        <span class="text-xs text-ink-400">{{ ui.seconds }} · {{ nowMillis }} {{ ui.ms }}</span>
        <template #fallback>
          <span class="font-mono text-lg font-semibold text-ink-400">—</span>
        </template>
      </ClientOnly>
      <div class="ml-auto">
        <CopyButton :text="() => nowSeconds" :label="ui.copySeconds" small />
      </div>
    </div>

    <!-- Section A: Timestamp -> Date -->
    <section class="mt-6">
      <h2 class="text-lg font-semibold">{{ ui.tsToDate }}</h2>

      <div class="mt-3 flex flex-wrap items-end gap-3">
        <div class="grow">
          <label for="ts-input" class="label">{{ ui.unixTimestamp }}</label>
          <input
            id="ts-input"
            v-model="tsInput"
            class="field"
            inputmode="numeric"
            spellcheck="false"
            autocomplete="off"
            :placeholder="ui.tsPlaceholder"
          >
        </div>

        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          {{ ui.unit }}
          <select v-model="unit" class="field !w-auto !py-2" :aria-label="ui.unit">
            <option value="auto">{{ ui.autoDetect }}</option>
            <option value="s">{{ ui.unitSeconds }}</option>
            <option value="ms">{{ ui.unitMs }}</option>
          </select>
        </label>

        <button type="button" class="btn-ghost" @click="useCurrentTimestamp">{{ ui.now }}</button>
        <button type="button" class="btn-ghost" @click="clearTimestamp">{{ t('common.clear') }}</button>
      </div>

      <!-- Status line -->
      <div class="mt-2 flex min-h-[1.5rem] items-center gap-2 text-sm">
        <span v-if="tsError" class="text-red-600 dark:text-red-400">✗ {{ tsError }}</span>
        <span v-else-if="!tsInput.trim()" class="text-ink-400">{{ ui.enterToConvert }}</span>
        <span v-else class="text-ink-500 dark:text-ink-400">
          {{ ui.interpretedAs }} <strong class="text-ink-700 dark:text-ink-200">{{ detectedUnit === 'ms' ? ui.valMs : ui.valSeconds }}</strong>
        </span>
      </div>

      <!-- Outputs -->
      <dl v-if="tsDate" class="mt-3 grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 dark:border-ink-700 dark:bg-ink-700">
        <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
          <dt class="w-28 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.utc }}</dt>
          <dd class="grow font-mono text-sm">{{ utcString }}</dd>
          <CopyButton :text="() => utcString" small />
        </div>
        <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
          <dt class="w-28 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.iso8601 }}</dt>
          <dd class="grow font-mono text-sm">{{ isoString }}</dd>
          <CopyButton :text="() => isoString" small />
        </div>
        <ClientOnly>
          <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
            <dt class="w-28 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.localTime }}</dt>
            <dd class="grow font-mono text-sm">{{ localString }}</dd>
            <CopyButton :text="() => localString" small />
          </div>
          <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
            <dt class="w-28 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.relative }}</dt>
            <dd class="grow font-mono text-sm">{{ relativeString }}</dd>
          </div>
        </ClientOnly>
      </dl>
    </section>

    <!-- Section B: Date -> Timestamp -->
    <section class="mt-8 border-t border-ink-200 pt-6 dark:border-ink-800">
      <h2 class="text-lg font-semibold">{{ ui.dateToTs }}</h2>

      <div class="mt-3 flex flex-wrap items-end gap-3">
        <div class="grow">
          <label for="date-input" class="label">{{ ui.dateTimeLabel }}</label>
          <input
            id="date-input"
            v-model="dateInput"
            type="datetime-local"
            step="1"
            class="field !w-auto"
          >
        </div>
        <button type="button" class="btn-ghost" @click="useNowForDate">{{ ui.now }}</button>
      </div>

      <div class="mt-2 flex min-h-[1.5rem] items-center gap-2 text-sm">
        <span v-if="dateError" class="text-ink-400">{{ dateError }}</span>
        <span v-else class="text-ink-500 dark:text-ink-400">
          {{ ui.isoUtc }} <span class="font-mono text-ink-700 dark:text-ink-200">{{ dateIso }}</span>
        </span>
      </div>

      <dl v-if="dateMillis !== null" class="mt-3 grid gap-px overflow-hidden rounded-lg border border-ink-200 bg-ink-200 dark:border-ink-700 dark:bg-ink-700">
        <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
          <dt class="w-32 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.epochSeconds }}</dt>
          <dd class="grow font-mono text-sm tabular-nums">{{ dateEpochSeconds }}</dd>
          <CopyButton :text="() => dateEpochSeconds" small />
        </div>
        <div class="flex flex-wrap items-center gap-2 bg-white px-4 py-2.5 dark:bg-ink-900">
          <dt class="w-32 shrink-0 text-sm text-ink-500 dark:text-ink-400">{{ ui.epochMs }}</dt>
          <dd class="grow font-mono text-sm tabular-nums">{{ dateEpochMillis }}</dd>
          <CopyButton :text="() => dateEpochMillis" small />
        </div>
      </dl>
    </section>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертация Unix timestamp и дат онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер Unix timestamp</strong> превращает
          epoch-время в читаемую дату и обратно. Вставьте timestamp, чтобы увидеть
          его в виде строки UTC, строки ISO 8601, местного времени и относительной
          фразы вроде «3 дня назад», или выберите дату, чтобы узнать её точный
          epoch в секундах и миллисекундах. Живые часы наверху показывают текущее
          Unix-время и обновляются раз в секунду.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong> с помощью встроенных
          JavaScript-API <code>Date</code> и <code>Intl</code>. Никакие timestamp
          не загружаются и не сохраняются, поэтому инструмент безопасен для логов,
          журналов аудита и других конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Чтобы декодировать timestamp, введите его в блок <strong>Timestamp → Дата</strong> — единица определится автоматически.</li>
          <li>Если догадка неверна, переключите <code>Единицу</code> на <code>Секунды</code> или <code>Миллисекунды</code>.</li>
          <li>Смотрите значения UTC, ISO 8601, местного и относительного времени и <code>Копируйте</code> нужное.</li>
          <li>Чтобы закодировать дату, выберите её в блоке <strong>Дата → Timestamp</strong> и скопируйте epoch в секундах или миллисекундах.</li>
          <li>Нажмите <code>Сейчас</code> в любом блоке, чтобы подставить текущий момент.</li>
        </ul>

        <h2>Секунды, миллисекунды и часовые пояса</h2>
        <p>
          Epoch-время отсчитывается от полуночи UTC 1 января 1970 года.
          Unix-утилиты и большинство бэкендов измеряют его в <strong>секундах</strong>
          (10-значное число для современных дат), тогда как JavaScript и многие
          браузерные API используют <strong>миллисекунды</strong> (13 цифр).
          Конвертер считает любое значение от <code>1e12</code> и больше
          миллисекундами. Вывод в ISO 8601 и UTC не зависит от часового пояса;
          строка местного времени и относительная фраза зависят от вашего
          компьютера, поэтому могут отличаться от того, что увидит коллега.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Планируете задачи по времени? Соберите расписание в
          <NuxtLink :to="localePath('/cron-generator')">генераторе Cron</NuxtLink>,
          создайте идентификаторы в
          <NuxtLink :to="localePath('/uuid-generator')">генераторе UUID</NuxtLink>
          или приведите в порядок payload в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert Unix timestamps and dates online</h2>
        <p>
          This free <strong>Unix timestamp converter</strong> turns epoch time into
          a human-readable date and back again. Paste a timestamp to see it as a UTC
          string, an ISO 8601 string, your local time and a relative phrase like
          “3 days ago”, or pick a date to read its exact epoch in both seconds and
          milliseconds. A live clock at the top shows the current Unix time, ticking
          once a second.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong> using the native
          JavaScript <code>Date</code> and <code>Intl</code> APIs. No timestamps are
          uploaded or stored, so it is safe for logs, audit trails and other
          sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>To decode a timestamp, type it into <strong>Timestamp → Date</strong>; the unit is auto-detected.</li>
          <li>If the guess is wrong, switch the <code>Unit</code> toggle to <code>Seconds</code> or <code>Milliseconds</code>.</li>
          <li>Read the UTC, ISO 8601, local and relative values, and <code>Copy</code> whichever you need.</li>
          <li>To encode a date, choose one in <strong>Date → Timestamp</strong> and copy the epoch seconds or milliseconds.</li>
          <li>Click <code>Now</code> in either section to drop in the current moment.</li>
        </ul>

        <h2>Seconds, milliseconds and timezones</h2>
        <p>
          Epoch time counts from midnight UTC on 1 January 1970. Unix utilities and
          most backends measure it in <strong>seconds</strong> (a 10-digit number for
          present-day dates), while JavaScript and many browser APIs use
          <strong>milliseconds</strong> (13 digits). The converter treats any value of
          <code>1e12</code> or larger as milliseconds. ISO 8601 and UTC output are
          timezone-neutral; the local string and the relative phrase depend on your
          own machine, which is why they may differ from a colleague’s.
        </p>

        <h2>Related tools</h2>
        <p>
          Scheduling jobs by time? Build a schedule with the
          <NuxtLink :to="localePath('/cron-generator')">Cron generator</NuxtLink>, mint identifiers
          with the <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>, or tidy
          up a payload with the <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
