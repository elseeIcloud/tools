<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// --- Zone list -------------------------------------------------------------
// Intl.supportedValuesOf exists in the Node prerender env, but guard it anyway
// and fall back to a curated list so the page never throws.
const FALLBACK_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const zones = computed<string[]>(() => {
  try {
    const sov = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    if (typeof sov === 'function') {
      const list = sov('timeZone')
      if (Array.isArray(list) && list.length) {
        // Surface UTC at the top, then the IANA list alphabetically.
        return ['UTC', ...list.filter((z) => z !== 'UTC')]
      }
    }
  } catch {
    /* fall through to the curated list */
  }
  return FALLBACK_ZONES
})

// --- State -----------------------------------------------------------------
// The default datetime is the CURRENT time, so it MUST be produced on the
// client only. Init to '' and fill it in onMounted; results are wrapped in
// <ClientOnly> so SSR output (empty) never mismatches hydration.
const datetime = ref('')
const sourceZone = ref('UTC')
const targets = ref<string[]>(['America/New_York', 'Asia/Tokyo'])

onMounted(() => {
  // Default source zone to the visitor's local zone when available.
  try {
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (guessed && zones.value.includes(guessed)) sourceZone.value = guessed
  } catch {
    /* keep UTC */
  }
  // "Now" rounded to the current minute, formatted for <input type="datetime-local">.
  datetime.value = nowLocalInputValue(sourceZone.value)
})

function addTarget() {
  // Pick the first zone not already shown (falling back to UTC).
  const used = new Set([sourceZone.value, ...targets.value])
  const next = zones.value.find((z) => !used.has(z)) ?? 'UTC'
  targets.value.push(next)
}

function removeTarget(i: number) {
  targets.value.splice(i, 1)
}

function setNow() {
  datetime.value = nowLocalInputValue(sourceZone.value)
}

function clear() {
  datetime.value = ''
}

function loadSample() {
  // Self-check value: 2024-01-01 12:00 in UTC -> New York 07:00, Tokyo 21:00.
  sourceZone.value = 'UTC'
  targets.value = ['America/New_York', 'Asia/Tokyo']
  datetime.value = '2024-01-01T12:00'
}

// --- Conversion (pure: Intl.DateTimeFormat exists in Node) -----------------

// Parts of a Date as rendered in a given IANA zone.
function partsInZone(date: Date, zone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const map: Record<string, number> = {}
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  return map
}

// Offset (in minutes, east-positive) of `zone` at the instant `date`.
function offsetMinutes(date: Date, zone: string): number {
  const p = partsInZone(date, zone)
  // The UTC timestamp of the same wall-clock numbers, treated as if UTC.
  const asUtc = Date.UTC(p.year!, p.month! - 1, p.day!, p.hour!, p.minute!, p.second!)
  return Math.round((asUtc - date.getTime()) / 60000)
}

// Interpret the wall-clock numbers (y/m/d/h/min) as a local time in `zone`
// and return the absolute UTC instant. Two iterations converge across DST.
function zonedWallClockToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  zone: string,
): Date {
  // First guess: treat the wall clock as if it were UTC.
  let ts = Date.UTC(y, mo - 1, d, h, mi, 0)
  for (let i = 0; i < 2; i++) {
    const off = offsetMinutes(new Date(ts), zone)
    const corrected = Date.UTC(y, mo - 1, d, h, mi, 0) - off * 60000
    if (corrected === ts) break
    ts = corrected
  }
  return new Date(ts)
}

// "Now" in `zone` as a YYYY-MM-DDTHH:mm string for <input type="datetime-local">.
function nowLocalInputValue(zone: string): string {
  const p = partsInZone(new Date(), zone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month!)}-${pad(p.day!)}T${pad(p.hour!)}:${pad(p.minute!)}`
}

// The UTC instant that the source wall-clock time refers to. null when blank/invalid.
const instant = computed<Date | null>(() => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/.exec(datetime.value)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[]
  const date = zonedWallClockToUtc(y!, mo!, d!, h!, mi!, sourceZone.value)
  return Number.isNaN(date.getTime()) ? null : date
})

// Format an instant in a given zone for display, plus its UTC offset label.
function formatOffset(min: number): string {
  const sign = min >= 0 ? '+' : '-'
  const abs = Math.abs(min)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return mm === '00' ? `UTC${sign}${Number(hh)}` : `UTC${sign}${hh}:${mm}`
}

interface Conversion {
  zone: string
  date: string
  time: string
  weekday: string
  offset: string
  copyText: string
}

function convert(date: Date, zone: string): Conversion {
  const loc = locale.value === 'ru' ? 'ru-RU' : 'en-US'
  const dateStr = new Intl.DateTimeFormat(loc, {
    timeZone: zone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
  const timeStr = new Intl.DateTimeFormat(loc, {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  const weekday = new Intl.DateTimeFormat(loc, { timeZone: zone, weekday: 'long' }).format(date)
  const offset = formatOffset(offsetMinutes(date, zone))
  return {
    zone,
    date: dateStr,
    time: timeStr,
    weekday,
    offset,
    // ISO-like, copyable line: 2024-01-01 21:00 (UTC+9) — Asia/Tokyo
    copyText: `${timeStr} ${offset} · ${dateStr} · ${zone}`,
  }
}

const sourceConversion = computed<Conversion | null>(() =>
  instant.value ? convert(instant.value, sourceZone.value) : null,
)

const results = computed<Conversion[]>(() =>
  instant.value ? targets.value.map((z) => convert(instant.value!, z)) : [],
)

// Tool-specific labels (common verbs like Copy/Sample/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        datetime: 'Дата и время',
        sourceZone: 'Исходный часовой пояс',
        targetZones: 'Целевые пояса',
        source: 'Источник',
        addZone: '+ Добавить пояс',
        removeZone: 'Удалить пояс',
        now: 'Сейчас',
        startHint: 'Укажите дату и время и исходный пояс, чтобы увидеть результат.',
        offset: 'смещение',
        ariaSource: 'Исходный часовой пояс',
        ariaTarget: 'Целевой часовой пояс',
      }
    : {
        datetime: 'Date & time',
        sourceZone: 'Source time zone',
        targetZones: 'Target zones',
        source: 'Source',
        addZone: '+ Add zone',
        removeZone: 'Remove zone',
        now: 'Now',
        startHint: 'Set a date, time and source zone to see the conversion.',
        offset: 'offset',
        ariaSource: 'Source time zone',
        ariaTarget: 'Target time zone',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. The converter runs entirely in your browser using the built-in JavaScript Intl.DateTimeFormat engine. The date, time and zones you enter are never uploaded, logged or stored.',
  },
  {
    q: 'How does it handle daylight saving time?',
    a: 'Each zone uses the IANA time zone database that ships with your browser, so the UTC offset reflects the correct rules — including daylight saving — for the exact instant you enter. That is why the same zone can show, for example, UTC-5 in January and UTC-4 in July.',
  },
  {
    q: 'What does it mean to "interpret the wall-clock time in the source zone"?',
    a: 'The time you type is read as the local clock reading in the source zone, not as UTC. The tool resolves that wall-clock time to a single absolute instant and then re-displays that instant in every target zone, so all rows refer to the same moment.',
  },
  {
    q: 'Where does the list of time zones come from?',
    a: 'It is built from Intl.supportedValuesOf("timeZone"), the full IANA list your browser knows about. If that API is unavailable, the tool falls back to a curated list of common zones so it always works.',
  },
  {
    q: 'Why is the default time filled in only after the page loads?',
    a: 'The default is the current time, which differs between the server that prerenders the page and your browser. To avoid a hydration mismatch the field starts empty and is set to "now" once the page is interactive in your browser.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Конвертер работает полностью в браузере на встроенном движке JavaScript Intl.DateTimeFormat. Введённые дата, время и пояса не загружаются, не логируются и не сохраняются.',
  },
  {
    q: 'Как учитывается переход на летнее время?',
    a: 'Каждый пояс использует базу часовых поясов IANA, встроенную в ваш браузер, поэтому смещение UTC отражает корректные правила — включая летнее время — именно для того момента, который вы указали. Поэтому один и тот же пояс может показывать, например, UTC-5 в январе и UTC-4 в июле.',
  },
  {
    q: 'Что значит «интерпретировать время по настенным часам в исходном поясе»?',
    a: 'Введённое время читается как показания локальных часов в исходном поясе, а не как UTC. Инструмент приводит это время к одному абсолютному моменту и затем заново отображает его в каждом целевом поясе, так что все строки относятся к одному и тому же моменту.',
  },
  {
    q: 'Откуда берётся список часовых поясов?',
    a: 'Он строится из Intl.supportedValuesOf("timeZone") — полного списка IANA, известного вашему браузеру. Если этот API недоступен, инструмент использует подобранный список распространённых поясов, поэтому работает всегда.',
  },
  {
    q: 'Почему время по умолчанию подставляется только после загрузки страницы?',
    a: 'По умолчанию подставляется текущее время, которое отличается на сервере, где страница пререндерится, и в вашем браузере. Чтобы избежать рассинхронизации гидратации, поле сначала пустое и заполняется значением «сейчас», как только страница становится интерактивной.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="timezone-converter" :faq="faq">
    <!-- Source -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="tz-datetime">{{ ui.datetime }}</label>
        <div class="flex items-center gap-2">
          <input
            id="tz-datetime"
            v-model="datetime"
            type="datetime-local"
            class="field"
            :aria-label="ui.datetime"
          >
          <button type="button" class="btn-ghost shrink-0" @click="setNow">{{ ui.now }}</button>
        </div>
      </div>

      <div>
        <label class="label" for="tz-source">{{ ui.sourceZone }}</label>
        <select
          id="tz-source"
          v-model="sourceZone"
          class="field"
          :aria-label="ui.ariaSource"
        >
          <option v-for="z in zones" :key="z" :value="z">{{ z }}</option>
        </select>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="addTarget">{{ ui.addZone }}</button>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Target zone selects -->
    <div class="mt-4">
      <span class="label">{{ ui.targetZones }}</span>
      <div class="space-y-2">
        <div v-for="(z, i) in targets" :key="i" class="flex items-center gap-2">
          <select
            v-model="targets[i]"
            class="field"
            :aria-label="ui.ariaTarget"
          >
            <option v-for="opt in zones" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <button
            type="button"
            class="btn-ghost shrink-0"
            :aria-label="ui.removeZone"
            @click="removeTarget(i)"
          >✕</button>
        </div>
      </div>
    </div>

    <!-- Results: the default time is "now" (client-only), so keep all
         conversion output inside <ClientOnly> to avoid a hydration mismatch. -->
    <ClientOnly>
      <div v-if="instant" class="mt-6 space-y-3">
        <!-- Source echo -->
        <div
          v-if="sourceConversion"
          class="rounded-lg border border-accent/40 bg-accent/5 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-accent">{{ ui.source }}</div>
              <div class="mt-1 font-mono text-lg font-semibold">{{ sourceConversion.time }}</div>
              <div class="text-sm text-ink-600 dark:text-ink-300">
                {{ sourceConversion.weekday }}, {{ sourceConversion.date }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium">{{ sourceConversion.zone }}</div>
              <div class="text-sm text-ink-500 dark:text-ink-400">{{ sourceConversion.offset }}</div>
            </div>
          </div>
        </div>

        <!-- Target rows -->
        <div
          v-for="(r, i) in results"
          :key="i"
          class="flex items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950"
        >
          <div>
            <div class="font-mono text-lg font-semibold">{{ r.time }}</div>
            <div class="text-sm text-ink-600 dark:text-ink-300">{{ r.weekday }}, {{ r.date }}</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-right">
              <div class="font-medium">{{ r.zone }}</div>
              <div class="text-sm text-ink-500 dark:text-ink-400">{{ ui.offset }}: {{ r.offset }}</div>
            </div>
            <CopyButton :text="() => r.copyText" small />
          </div>
        </div>
      </div>
      <p v-else class="mt-6 text-sm text-ink-400">{{ ui.startHint }}</p>

      <!-- Stable placeholder for SSR / pre-hydration. -->
      <template #fallback>
        <p class="mt-6 text-sm text-ink-400">{{ ui.startHint }}</p>
      </template>
    </ClientOnly>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер часовых поясов онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер часовых поясов</strong> переводит
          одну и ту же точку во времени между поясами. Укажите дату и время,
          выберите исходный пояс — и инструмент покажет соответствующее локальное
          время и смещение UTC в каждом целевом поясе. Можно добавлять и удалять
          сколько угодно целевых зон, чтобы сравнить их одним взглядом: удобно при
          планировании созвонов, дедлайнов и запусков с распределённой командой.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong> на
          встроенном движке <code>Intl.DateTimeFormat</code> и базе часовых поясов
          IANA. Данные не отправляются на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите дату и время в поле или нажмите <code>Сейчас</code>, чтобы подставить текущий момент.</li>
          <li>Выберите <strong>исходный часовой пояс</strong> — введённое время трактуется как локальное в нём.</li>
          <li>Нажмите <code>+ Добавить пояс</code>, чтобы добавить целевую зону, и <code>✕</code>, чтобы убрать.</li>
          <li>Смотрите для каждой зоны локальные дату и время и смещение UTC; нажмите <code>Копировать</code>, чтобы скопировать строку.</li>
          <li>Кнопка <code>Пример</code> подставляет проверочное значение, а <code>Очистить</code> — обнуляет поле.</li>
        </ul>

        <h2>Время по настенным часам, UTC и летнее время</h2>
        <p>
          Введённое время — это <em>показания настенных часов</em> в исходном
          поясе, а не UTC. Инструмент приводит его к единственному абсолютному
          моменту, а затем отображает этот момент в каждом поясе, поэтому все
          строки относятся к одному и тому же мгновению. Смещение UTC берётся для
          конкретной даты, так что переход на летнее время учитывается
          автоматически — один пояс может показывать UTC-5 зимой и UTC-4 летом.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете со временем и идентификаторами? Переводите epoch в
          <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертере Unix timestamp</NuxtLink>,
          стройте расписания в <NuxtLink :to="localePath('/cron-generator')">генераторе cron</NuxtLink>
          или создавайте идентификаторы в <NuxtLink :to="localePath('/uuid-generator')">генераторе UUID</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Timezone converter online</h2>
        <p>
          This free <strong>timezone converter</strong> translates a single point
          in time between zones. Enter a date and time, pick a source zone, and the
          tool shows the matching local time and UTC offset in every target zone.
          Add or remove as many target zones as you like to compare them at a
          glance — handy for scheduling calls, deadlines and launches with a
          distributed team.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong> using
          the built-in <code>Intl.DateTimeFormat</code> engine and the IANA time
          zone database. Nothing is sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a date and time, or hit <code>Now</code> to drop in the current moment.</li>
          <li>Choose the <strong>source time zone</strong> — your input is read as a local time there.</li>
          <li>Click <code>+ Add zone</code> to add a target zone and <code>✕</code> to remove one.</li>
          <li>Read each zone's local date, time and UTC offset; click <code>Copy</code> to grab the line.</li>
          <li>Use <code>Sample</code> to load a known-good example, or <code>Clear</code> to empty the field.</li>
        </ul>

        <h2>Wall-clock time, UTC and DST</h2>
        <p>
          The time you enter is a <em>wall-clock reading</em> in the source zone,
          not UTC. The tool resolves it to a single absolute instant and then
          re-displays that instant in each zone, so every row refers to the same
          moment. The UTC offset is computed for that specific date, so daylight
          saving time is handled automatically — one zone may show UTC-5 in winter
          and UTC-4 in summer.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with time and identifiers? Convert epochs in the
          <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>,
          build schedules in the <NuxtLink :to="localePath('/cron-generator')">cron generator</NuxtLink>,
          or mint identifiers in the <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
