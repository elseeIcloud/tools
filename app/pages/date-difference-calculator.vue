<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Stored as YYYY-MM-DD strings from <input type="date">. Empty by default so
// the prerendered page renders the hint with no Date/clock access at setup.
const start = ref('')
const end = ref('')
const inclusive = ref(false)

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        startDate: 'Начальная дата',
        endDate: 'Конечная дата',
        inclusive: 'Включать последний день',
        today: 'Сегодня',
        swap: 'Поменять местами',
        hint: 'Выберите начальную и конечную дату, чтобы посчитать разницу.',
        invalid: 'Проверьте даты — одно из значений некорректно.',
        totalDays: 'Всего дней',
        breakdown: 'Годы, месяцы, дни',
        totalWeeks: 'Всего недель',
        totalHours: 'Всего часов',
        years: 'г.',
        months: 'мес.',
        days: 'дн.',
        negativeNote:
          'Конечная дата раньше начальной — показана абсолютная разница.',
        inclusiveNote: 'Последний день включён в подсчёт.',
        summaryLabel: 'Сводка',
        from: 'с',
        to: 'по',
      }
    : {
        startDate: 'Start date',
        endDate: 'End date',
        inclusive: 'Include the end day',
        today: 'Today',
        swap: 'Swap',
        hint: 'Pick a start and end date to calculate the difference.',
        invalid: 'Check the dates — one of the values is not valid.',
        totalDays: 'Total days',
        breakdown: 'Years, months, days',
        totalWeeks: 'Total weeks',
        totalHours: 'Total hours',
        years: 'y',
        months: 'mo',
        days: 'd',
        negativeNote:
          'The end date is before the start date — the absolute difference is shown.',
        inclusiveNote: 'The end day is counted in the total.',
        summaryLabel: 'Summary',
        from: 'from',
        to: 'to',
      },
)

const MS_PER_DAY = 86_400_000

// Parse a YYYY-MM-DD value into a UTC midnight timestamp. Using a fixed-format
// string with `Date` is deterministic; we read no current time anywhere.
function parseDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const ms = new Date(`${value}T00:00:00Z`).getTime()
  if (Number.isNaN(ms)) return null
  // Guard against overflow like 2024-02-30 silently rolling forward.
  const [y, m, d] = value.split('-').map(Number)
  const back = new Date(ms)
  if (
    back.getUTCFullYear() !== y ||
    back.getUTCMonth() + 1 !== m ||
    back.getUTCDate() !== d
  ) {
    return null
  }
  return ms
}

interface DiffResult {
  totalDays: number
  weeks: number
  hours: number
  years: number
  months: number
  days: number
  reversed: boolean
}

// Pure computed: depends only on the reactive string inputs, never on a clock.
const result = computed<DiffResult | null>(() => {
  const a = parseDate(start.value)
  const b = parseDate(end.value)
  if (a === null || b === null) return null

  const reversed = b < a
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)

  // Whole-day difference (UTC midnights ⇒ no DST drift). +1 when inclusive.
  let totalDays = Math.round((hi - lo) / MS_PER_DAY)
  if (inclusive.value) totalDays += 1

  // Calendar breakdown using UTC date parts, borrowing from the larger date.
  const dl = new Date(lo)
  const dh = new Date(hi)
  let years = dh.getUTCFullYear() - dl.getUTCFullYear()
  let months = dh.getUTCMonth() - dl.getUTCMonth()
  let days = dh.getUTCDate() - dl.getUTCDate()
  if (inclusive.value) days += 1

  if (days < 0) {
    months -= 1
    // Days in the month preceding the higher date.
    const daysInPrevMonth = new Date(
      Date.UTC(dh.getUTCFullYear(), dh.getUTCMonth(), 0),
    ).getUTCDate()
    days += daysInPrevMonth
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  return {
    totalDays,
    weeks: Math.floor(totalDays / 7),
    hours: totalDays * 24,
    years,
    months,
    days,
    reversed,
  }
})

const hasBothDates = computed(() => start.value !== '' && end.value !== '')
const invalid = computed(() => hasBothDates.value && result.value === null)

const nf = computed(() => new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US'))

const breakdownText = computed(() => {
  const r = result.value
  if (!r) return ''
  return `${r.years} ${ui.value.years} ${r.months} ${ui.value.months} ${r.days} ${ui.value.days}`
})

// Plain-text summary for the copy button.
const summary = computed(() => {
  const r = result.value
  if (!r) return ''
  const lines = [
    `${ui.value.from} ${start.value} ${ui.value.to} ${end.value}`,
    `${ui.value.totalDays}: ${r.totalDays}`,
    `${ui.value.breakdown}: ${breakdownText.value}`,
    `${ui.value.totalWeeks}: ${r.weeks}`,
    `${ui.value.totalHours}: ${r.hours}`,
  ]
  return lines.join('\n')
})

// "Today" sets the field client-side only, never during setup/prerender.
function setToday(target: 'start' | 'end') {
  const now = new Date()
  const value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (target === 'start') start.value = value
  else end.value = value
}

function swap() {
  const a = start.value
  start.value = end.value
  end.value = a
}

function clear() {
  start.value = ''
  end.value = ''
  inclusive.value = false
}

const faqEn: FaqItem[] = [
  {
    q: 'Are my dates sent to a server?',
    a: 'No. The date difference calculator runs entirely in your browser using JavaScript. The two dates you pick are never uploaded, logged or stored, so it is completely private even for personal or business planning.',
  },
  {
    q: 'How is the difference in years, months and days calculated?',
    a: 'It uses a calendar breakdown: it counts whole years first, then the remaining whole months, then the leftover days, borrowing the correct number of days from the previous month when needed. This matches how people naturally describe a span like "2 years, 3 months and 5 days".',
  },
  {
    q: 'What does "include the end day" do?',
    a: 'By default the difference is exclusive, so 1 January to 2 January is 1 day. Turning on "include the end day" counts both endpoints, adding one day to the total — useful for billing periods, leave requests or any count where the last day still counts.',
  },
  {
    q: 'Does it handle leap years correctly?',
    a: 'Yes. Dates are parsed to UTC midnight and the difference is measured in whole days, so 29 February in leap years and varying month lengths are all handled automatically without time-zone or daylight-saving drift.',
  },
  {
    q: 'What if the end date is earlier than the start date?',
    a: 'The calculator still works and shows the absolute difference, with a note that the dates were reversed. You can also press Swap to switch the two fields and read the result in the usual direction.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои даты на сервер?',
    a: 'Нет. Калькулятор разницы дат работает полностью в браузере на JavaScript. Выбранные даты не загружаются, не логируются и не сохраняются, поэтому инструмент полностью приватен даже для личного или рабочего планирования.',
  },
  {
    q: 'Как считается разница в годах, месяцах и днях?',
    a: 'Используется календарная разбивка: сначала считаются полные годы, затем оставшиеся полные месяцы, затем остаток в днях, при необходимости занимая нужное число дней из предыдущего месяца. Это совпадает с тем, как люди описывают период — например, «2 года, 3 месяца и 5 дней».',
  },
  {
    q: 'Что делает опция «Включать последний день»?',
    a: 'По умолчанию разница не включает конечную дату: с 1 по 2 января — это 1 день. Если включить «Включать последний день», учитываются обе границы и к итогу прибавляется один день — это удобно для расчётных периодов, заявок на отпуск и любых подсчётов, где последний день тоже считается.',
  },
  {
    q: 'Правильно ли учитываются високосные годы?',
    a: 'Да. Даты приводятся к полуночи по UTC, а разница измеряется в целых днях, поэтому 29 февраля в високосные годы и разная длина месяцев учитываются автоматически, без сдвигов из-за часового пояса или перехода на летнее время.',
  },
  {
    q: 'Что если конечная дата раньше начальной?',
    a: 'Калькулятор всё равно работает и показывает разницу по модулю с пометкой, что даты переставлены. Можно также нажать «Поменять местами», чтобы переставить поля и прочитать результат в привычном направлении.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="date-difference-calculator" :faq="faq">
    <!-- Date inputs toolbar -->
    <div class="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div>
        <label class="label" for="dd-start">{{ ui.startDate }}</label>
        <div class="flex items-center gap-2">
          <input
            id="dd-start"
            v-model="start"
            type="date"
            class="field !w-auto !py-1.5"
            :aria-label="ui.startDate"
          />
          <button type="button" class="btn-ghost !px-2.5 !py-1.5 text-xs" @click="setToday('start')">
            {{ ui.today }}
          </button>
        </div>
      </div>

      <div>
        <label class="label" for="dd-end">{{ ui.endDate }}</label>
        <div class="flex items-center gap-2">
          <input
            id="dd-end"
            v-model="end"
            type="date"
            class="field !w-auto !py-1.5"
            :aria-label="ui.endDate"
          />
          <button type="button" class="btn-ghost !px-2.5 !py-1.5 text-xs" @click="setToday('end')">
            {{ ui.today }}
          </button>
        </div>
      </div>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="inclusive" type="checkbox" class="accent-accent" />
        {{ ui.inclusive }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-4 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <span v-if="invalid" class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
      <span v-else-if="!result" class="text-ink-400">{{ ui.hint }}</span>
      <span v-else-if="result.reversed" class="text-ink-500 dark:text-ink-400">{{ ui.negativeNote }}</span>
      <span v-else-if="inclusive" class="text-ink-500 dark:text-ink-400">{{ ui.inclusiveNote }}</span>
    </div>

    <!-- Results -->
    <div v-if="result" class="mt-3">
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
          <div class="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ ui.totalDays }}</div>
          <div class="mt-1 font-mono text-2xl font-semibold tabular-nums">{{ nf.format(result.totalDays) }}</div>
        </div>
        <div class="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
          <div class="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ ui.breakdown }}</div>
          <div class="mt-1 font-mono text-2xl font-semibold tabular-nums">{{ breakdownText }}</div>
        </div>
        <div class="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
          <div class="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ ui.totalWeeks }}</div>
          <div class="mt-1 font-mono text-2xl font-semibold tabular-nums">{{ nf.format(result.weeks) }}</div>
        </div>
        <div class="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
          <div class="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ ui.totalHours }}</div>
          <div class="mt-1 font-mono text-2xl font-semibold tabular-nums">{{ nf.format(result.hours) }}</div>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between gap-2">
        <span class="text-sm text-ink-500 dark:text-ink-400">{{ ui.summaryLabel }}</span>
        <CopyButton :text="() => summary" small />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Калькулятор разницы между датами онлайн</h2>
        <p>
          Этот бесплатный <strong>калькулятор разницы дат</strong> показывает,
          сколько времени проходит между двумя датами: общее число дней,
          разбивку в годах, месяцах и днях, а также количество полных недель и
          часов. Он создан для тех, кто считает сроки проектов, расчётные
          периоды, возраст, отпуска и дедлайны и хочет получить ответ мгновенно.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Выбранные даты не
          отправляются на сервер, поэтому инструмент безопасен для личных и
          рабочих расчётов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Укажите <code>Начальную дату</code> и <code>Конечную дату</code> в полях выбора даты.</li>
          <li>Кнопка <code>Сегодня</code> подставляет текущую дату в нужное поле.</li>
          <li>Результат — дни, годы/месяцы/дни, недели и часы — появляется сразу.</li>
          <li>Включите <code>Включать последний день</code>, чтобы учесть обе границы (итог +1 день).</li>
          <li>Нажмите <code>Поменять местами</code>, если перепутали даты, или <code>Копировать</code>, чтобы скопировать сводку.</li>
        </ul>

        <h2>Точные и инклюзивные подсчёты</h2>
        <p>
          По умолчанию разница считается <strong>без последнего дня</strong>:
          период с 1 по 2 января равен одному дню. В платёжных циклах, заявках на
          отпуск и аренде часто нужен <strong>инклюзивный</strong> подсчёт, когда
          последний день тоже учитывается — для этого включите соответствующую
          опцию. Даты приводятся к полуночи по UTC, поэтому переход на летнее
          время и часовые пояса не искажают результат, а високосные годы
          обрабатываются автоматически.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно перевести дату в Unix-время и обратно? Откройте
          <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертер Unix-времени</NuxtLink>.
          Сравнить время в разных зонах поможет
          <NuxtLink :to="localePath('/timezone-converter')">конвертер часовых поясов</NuxtLink>,
          а собрать расписание задач —
          <NuxtLink :to="localePath('/cron-generator')">генератор cron</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Date difference calculator online</h2>
        <p>
          This free <strong>date difference calculator</strong> shows how much
          time falls between two dates: the total number of days, a breakdown in
          years, months and days, plus the full count of weeks and hours. It is
          built for anyone working out project timelines, billing periods, age,
          leave or deadlines who wants the answer instantly.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The dates
          you pick are never sent to a server, so it is safe for personal and
          business calculations.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Set a <code>Start date</code> and an <code>End date</code> using the date pickers.</li>
          <li>The <code>Today</code> button fills the matching field with the current date.</li>
          <li>The result — days, years/months/days, weeks and hours — appears immediately.</li>
          <li>Enable <code>Include the end day</code> to count both endpoints (the total gets +1 day).</li>
          <li>Press <code>Swap</code> if you mixed up the dates, or <code>Copy</code> to grab the summary.</li>
        </ul>

        <h2>Exclusive vs. inclusive counts</h2>
        <p>
          By default the difference is <strong>exclusive</strong>, so 1 January
          to 2 January is one day. Billing cycles, leave requests and rentals
          often need an <strong>inclusive</strong> count where the last day is
          included too — turn on the option for that. Dates are parsed to UTC
          midnight, so daylight-saving and time zones never skew the result, and
          leap years are handled automatically.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to convert a date to Unix time and back? Open the
          <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>.
          To compare clocks across regions, use the
          <NuxtLink :to="localePath('/timezone-converter')">time zone converter</NuxtLink>,
          or build a task schedule with the
          <NuxtLink :to="localePath('/cron-generator')">cron generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
