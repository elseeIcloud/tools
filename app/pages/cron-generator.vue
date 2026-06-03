<script setup lang="ts">
import cronstrue from 'cronstrue'
import { CronExpressionParser } from 'cron-parser'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const expression = ref('*/5 * * * *')

interface Preset {
  label: string
  value: string
}

// Tool-specific labels (common verbs like Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        fieldLabel: 'Cron-выражение (5 полей)',
        fieldOrder: 'Порядок: минута · час · день месяца · месяц · день недели',
        enterExpr: 'Введите cron-выражение.',
        invalid: '✗ Некорректно',
        presets: 'Шаблоны',
        usePreset: 'Применить шаблон',
        nextRuns: 'Следующие 5 запусков',
        calculating: 'Вычисляем ближайшие запуски…',
        enterValid: 'Введите корректное выражение, чтобы увидеть ближайшие запуски.',
        localTime: 'местное время',
        presetEveryMinute: 'Каждую минуту',
        presetEvery5: 'Каждые 5 минут',
        presetHourly: 'Каждый час',
        presetDailyMidnight: 'Ежедневно в полночь',
        presetWeekly: 'Еженедельно (вс)',
        presetMonthly: 'Ежемесячно',
        presetWeekdays9: 'Будни в 9 утра',
      }
    : {
        fieldLabel: 'Cron expression (5 fields)',
        fieldOrder: 'Order: minute · hour · day-of-month · month · day-of-week',
        enterExpr: 'Enter a cron expression.',
        invalid: '✗ Invalid',
        presets: 'Presets',
        usePreset: 'Use preset',
        nextRuns: 'Next 5 run times',
        calculating: 'Calculating upcoming run times…',
        enterValid: 'Enter a valid expression to preview upcoming runs.',
        localTime: 'local time',
        presetEveryMinute: 'Every minute',
        presetEvery5: 'Every 5 minutes',
        presetHourly: 'Hourly',
        presetDailyMidnight: 'Daily at midnight',
        presetWeekly: 'Weekly (Sun)',
        presetMonthly: 'Monthly',
        presetWeekdays9: 'Weekdays 9am',
      },
)

const presets = computed<Preset[]>(() => [
  { label: ui.value.presetEveryMinute, value: '* * * * *' },
  { label: ui.value.presetEvery5, value: '*/5 * * * *' },
  { label: ui.value.presetHourly, value: '0 * * * *' },
  { label: ui.value.presetDailyMidnight, value: '0 0 * * *' },
  { label: ui.value.presetWeekly, value: '0 0 * * 0' },
  { label: ui.value.presetMonthly, value: '0 0 1 * *' },
  { label: ui.value.presetWeekdays9, value: '0 9 * * 1-5' },
])

// cronstrue is a pure function (no time/randomness), so describing the
// expression is safe to do synchronously in a computed during SSR.
const description = computed<string>(() => {
  const expr = expression.value.trim()
  if (!expr) return ''
  return cronstrue.toString(expr, { throwExceptionOnParseError: true })
})

const error = computed<string | null>(() => {
  const expr = expression.value.trim()
  if (!expr) return ui.value.enterExpr
  try {
    cronstrue.toString(expr, { throwExceptionOnParseError: true })
    return null
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
})

const isValid = computed(() => !error.value)

// Next run times depend on the CURRENT time, so they MUST NOT be computed
// during setup/SSR (that would freeze them at build time and cause a
// hydration mismatch). We keep a placeholder until onMounted runs in the
// browser, recompute on input change, and render the list inside <ClientOnly>.
const nextRuns = ref<{ utc: string; local: string }[]>([])
const nextRunsError = ref<string | null>(null)

const localTzLabel = ref('')

function fmtUtc(d: Date): string {
  // Stable, locale-independent UTC rendering: YYYY-MM-DD HH:mm:ss UTC
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`
  )
}

function fmtLocal(d: Date): string {
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function computeNextRuns() {
  // Guard: only ever run in the browser (post-hydration). This reads the
  // current Date, which is non-deterministic and unsafe during prerender.
  if (!import.meta.client) return
  const expr = expression.value.trim()
  if (!expr) {
    nextRuns.value = []
    nextRunsError.value = null
    return
  }
  try {
    const interval = CronExpressionParser.parse(expr, { currentDate: new Date() })
    const runs: { utc: string; local: string }[] = []
    for (let i = 0; i < 5; i++) {
      const d = interval.next().toDate()
      runs.push({ utc: fmtUtc(d), local: fmtLocal(d) })
    }
    nextRuns.value = runs
    nextRunsError.value = null
  } catch (e) {
    nextRuns.value = []
    nextRunsError.value = e instanceof Error ? e.message : String(e)
  }
}

onMounted(() => {
  try {
    localTzLabel.value =
      Intl.DateTimeFormat().resolvedOptions().timeZone || ui.value.localTime
  } catch {
    localTzLabel.value = ui.value.localTime
  }
  computeNextRuns()
})

// Recompute whenever the expression changes. The handler itself is guarded,
// and the watcher only fires client-side after hydration when the value moves.
watch(expression, computeNextRuns)

function applyPreset(value: string) {
  expression.value = value
}

const faqEn: FaqItem[] = [
  {
    q: 'What is a cron expression?',
    a: 'A cron expression is a compact string that describes a recurring schedule, originally from the Unix cron daemon. The standard format used here has five fields — minute, hour, day of month, month and day of week — so "0 9 * * 1-5" means 9:00 AM on every weekday.',
  },
  {
    q: 'Is my schedule sent anywhere?',
    a: 'No. The expression is parsed, explained and turned into upcoming run times entirely in your browser with JavaScript. Nothing is uploaded or stored, so you can safely paste schedules from internal systems or private infrastructure.',
  },
  {
    q: 'Why are the "next run times" shown in UTC and local time?',
    a: 'Cron itself has no timezone — it runs against whatever clock the server uses. We show each run in UTC for an unambiguous reference and also in your browser’s local timezone so you can sanity-check the schedule. Confirm which timezone your actual cron host uses before relying on the times.',
  },
  {
    q: 'What do special characters like * , - and / mean?',
    a: 'An asterisk (*) means "every" value for that field. A comma lists specific values (1,15), a hyphen sets a range (1-5), and a slash defines a step (*/5 means every 5th unit). Combine them per field to build precise schedules.',
  },
  {
    q: 'Does this support seconds or the @yearly style shortcuts?',
    a: 'This tool focuses on the classic five-field crontab format that most systems accept. Six-field expressions with seconds and macro shortcuts like @daily are non-standard and vary between runners, so check your scheduler’s documentation if you need them.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Что такое cron-выражение?',
    a: 'Cron-выражение — это компактная строка, описывающая повторяющееся расписание; изначально она пришла из демона cron в Unix. Стандартный формат, который используется здесь, состоит из пяти полей — минута, час, день месяца, месяц и день недели — поэтому «0 9 * * 1-5» означает 9:00 утра каждый будний день.',
  },
  {
    q: 'Отправляется ли моё расписание куда-либо?',
    a: 'Нет. Выражение разбирается, расшифровывается и превращается в ближайшие времена запуска полностью в вашем браузере на JavaScript. Ничего не загружается и не сохраняется, поэтому можно безопасно вставлять расписания из внутренних систем или приватной инфраструктуры.',
  },
  {
    q: 'Почему «следующие запуски» показаны в UTC и в местном времени?',
    a: 'У самого cron нет часового пояса — он работает по тем часам, которые использует сервер. Мы показываем каждый запуск в UTC для однозначной точки отсчёта, а также в часовом поясе вашего браузера, чтобы можно было проверить расписание. Перед тем как полагаться на эти значения, уточните, какой часовой пояс использует ваш реальный cron-хост.',
  },
  {
    q: 'Что означают специальные символы вроде * , - и /?',
    a: 'Звёздочка (*) означает «каждое» значение поля. Запятая перечисляет конкретные значения (1,15), дефис задаёт диапазон (1-5), а слеш определяет шаг (*/5 означает каждую 5-ю единицу). Комбинируйте их по каждому полю, чтобы строить точные расписания.',
  },
  {
    q: 'Поддерживаются ли секунды или сокращения вида @yearly?',
    a: 'Этот инструмент рассчитан на классический формат crontab из пяти полей, который принимают большинство систем. Выражения из шести полей с секундами и макросы вроде @daily нестандартны и различаются между планировщиками, поэтому при необходимости сверяйтесь с документацией вашего планировщика.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="cron-generator" :faq="faq">
    <!-- Input field + copy -->
    <div>
      <label for="cron-expr" class="label">{{ ui.fieldLabel }}</label>
      <div class="flex flex-wrap items-start gap-2">
        <input
          id="cron-expr"
          v-model="expression"
          type="text"
          class="field !w-auto min-w-0 flex-1"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          placeholder="*/5 * * * *"
        />
        <CopyButton :text="() => expression" />
      </div>
      <p class="mt-1.5 text-xs text-ink-400">
        {{ ui.fieldOrder }}
      </p>
    </div>

    <!-- Live human-readable description / error status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-start gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalid }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ error }}</span>
      </template>
      <template v-else>
        <span class="font-medium text-green-600 dark:text-green-400">✓</span>
        <span class="text-ink-700 dark:text-ink-200">{{ description }}</span>
      </template>
    </div>

    <!-- Presets -->
    <div class="mt-4">
      <span class="label">{{ ui.presets }}</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in presets"
          :key="p.value"
          type="button"
          class="btn-ghost !py-1.5 text-xs"
          :class="expression.trim() === p.value ? '!border-accent text-accent' : ''"
          :aria-label="`${ui.usePreset}: ${p.label} (${p.value})`"
          @click="applyPreset(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Next 5 run times (client-only: depends on the current time) -->
    <div class="mt-6">
      <h2 class="mb-2 text-sm font-semibold text-ink-700 dark:text-ink-200">
        {{ ui.nextRuns }}
      </h2>
      <ClientOnly>
        <template #fallback>
          <p class="text-sm text-ink-400">{{ ui.calculating }}</p>
        </template>
        <p v-if="nextRunsError" class="text-sm text-red-600 dark:text-red-400">
          {{ nextRunsError }}
        </p>
        <p v-else-if="!nextRuns.length" class="text-sm text-ink-400">
          {{ ui.enterValid }}
        </p>
        <ol v-else class="space-y-2">
          <li
            v-for="(run, i) in nextRuns"
            :key="i"
            class="flex flex-col gap-0.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span class="font-mono text-ink-900 dark:text-ink-100">{{ run.utc }}</span>
            <span class="text-ink-500 dark:text-ink-400">{{ run.local }} ({{ localTzLabel || ui.localTime }})</span>
          </li>
        </ol>
      </ClientOnly>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генерация и расшифровка cron-выражений</h2>
        <p>
          Этот бесплатный <strong>генератор и расшифровщик cron-выражений</strong>
          превращает загадочные строки crontab в понятный текст, проверяет их
          прямо во время ввода и показывает ближайшие моменты запуска задачи.
          Инструмент создан для разработчиков и SRE, которые настраивают
          запланированные задачи, CI-пайплайны и резервные копии баз данных и
          хотят убедиться, что расписание делает именно то, что задумано, ещё до
          выкатки.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваше выражение не
          отправляется на сервер, поэтому его безопасно вставлять из приватной
          инфраструктуры или внутренних инструментов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите стандартное cron-выражение из пяти полей или нажмите <strong>шаблон</strong>, чтобы подставить его.</li>
          <li>Читайте живое <strong>описание на понятном языке</strong> под полем; при некорректном вводе показывается красная ошибка.</li>
          <li>Просматривайте <strong>следующие 5 запусков</strong>, показанные в UTC и в вашем местном часовом поясе.</li>
          <li>Меняйте отдельные поля — минуту, час, день, месяц, день недели — и описание обновляется мгновенно.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать готовое выражение для вашего crontab или конфига планировщика.</li>
        </ul>

        <h2>Как работают пять полей</h2>
        <p>
          Классическая строка cron состоит из пяти разделённых пробелами полей:
          <code>минута час день-месяца месяц день-недели</code>. Внутри каждого
          поля <code>*</code> означает любое значение, запятая перечисляет
          значения (<code>1,15</code>), дефис задаёт диапазон (<code>1-5</code>
          для понедельника–пятницы), а слеш добавляет шаг (<code>*/5</code> =
          каждая пятая единица). Поэтому <code>0 9 * * 1-5</code> читается как
          «в 09:00 каждый день недели с понедельника по пятницу». Помните, что у
          cron нет встроенного часового пояса: задачи выполняются по часам хоста,
          поэтому предпросмотр показывает и UTC, и местное время.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете с расписаниями и временем? Конвертируйте значения epoch в
          <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертере Unix timestamp</NuxtLink>,
          создавайте идентификаторы в
          <NuxtLink :to="localePath('/uuid-generator')">генераторе UUID</NuxtLink>
          или считайте контрольные суммы в
          <NuxtLink :to="localePath('/hash-generator')">генераторе хэшей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate and understand cron expressions</h2>
        <p>
          This free <strong>cron expression generator and explainer</strong> turns
          cryptic crontab strings into plain English, validates them as you type,
          and previews the next times the job would fire. It is built for
          developers and SREs who set up scheduled jobs, CI pipelines and database
          backups and want to be sure a schedule does what they intend before it
          ships.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your
          expression is never sent to a server, so it is safe to paste schedules
          from private infrastructure or internal tooling.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a standard five-field cron expression, or click a <strong>preset</strong> to fill it in.</li>
          <li>Read the live <strong>plain-English description</strong> below the field; invalid input shows a red error.</li>
          <li>Review the <strong>next 5 run times</strong>, shown in UTC and your local timezone.</li>
          <li>Tweak individual fields — minute, hour, day, month, weekday — and watch the description update instantly.</li>
          <li>Click <code>Copy</code> to grab the finished expression for your crontab or scheduler config.</li>
        </ul>

        <h2>How the five fields work</h2>
        <p>
          A classic cron line has five space-separated fields:
          <code>minute hour day-of-month month day-of-week</code>. Within each
          field, <code>*</code> means every value, a comma lists values
          (<code>1,15</code>), a hyphen sets a range (<code>1-5</code> for Monday
          to Friday), and a slash adds a step (<code>*/5</code> = every fifth
          unit). So <code>0 9 * * 1-5</code> reads as &ldquo;at 09:00 on every day
          of the week from Monday through Friday.&rdquo; Remember that cron has no
          built-in timezone: jobs run against the host clock, which is why the
          preview shows both UTC and local time.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with schedules and time? Convert epoch values with the
          <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>,
          create identifiers with the
          <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>, or compute
          checksums with the <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
