<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const version = ref<'v4' | 'v7'>('v4')
const count = ref(5)
const uppercase = ref(false)
const hyphens = ref(true)

// Tool-specific labels (common verbs like Generate/Copy all/Count/Uppercase come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        version: 'Версия',
        versionAria: 'Версия UUID',
        v4: 'v4 (случайный)',
        v7: 'v7 (упорядоченный по времени)',
        countAria: 'Сколько UUID сгенерировать',
        hyphens: 'Дефисы',
        statusV4: 'UUID v4 (случайный)',
        statusV7: 'UUID v7 (упорядоченный по времени)',
        generatedIn: '· сгенерировано в вашем браузере',
        generating: 'Генерируем UUID…',
      }
    : {
        version: 'Version',
        versionAria: 'UUID version',
        v4: 'v4 (random)',
        v7: 'v7 (time-ordered)',
        countAria: 'Number of UUIDs to generate',
        hyphens: 'Hyphens',
        statusV4: 'UUID v4 (random)',
        statusV7: 'UUID v7 (time-ordered)',
        generatedIn: '· generated in your browser',
        generating: 'Generating UUIDs…',
      },
)

// RANDOM + TIME based: must NOT be produced during SSR/prerender.
// Start empty (stable across server/client), then populate in onMounted().
const uuids = ref<string[]>([])

/** Format 16 bytes as canonical 8-4-4-4-12 lowercase hex. */
function bytesToUuid(bytes: Uint8Array): string {
  const hex: string[] = []
  for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'))
  return (
    hex.slice(0, 4).join('') +
    '-' +
    hex.slice(4, 6).join('') +
    '-' +
    hex.slice(6, 8).join('') +
    '-' +
    hex.slice(8, 10).join('') +
    '-' +
    hex.slice(10, 16).join('')
  )
}

/** v4: random. Prefer native randomUUID, fall back to manual bit-fiddling. */
function uuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx
  return bytesToUuid(bytes)
}

/** v7: 48-bit big-endian Unix-ms timestamp, version 7, variant 10xx, rest random. */
function uuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  const ms = Date.now()
  // 48-bit timestamp, big-endian, into bytes 0..5.
  // ms can exceed 32 bits, so split into high/low halves to stay exact.
  const timeHigh = Math.floor(ms / 0x100000000) // top 16 bits used
  const timeLow = ms >>> 0 // lowest 32 bits
  bytes[0] = (timeHigh >>> 8) & 0xff
  bytes[1] = timeHigh & 0xff
  bytes[2] = (timeLow >>> 24) & 0xff
  bytes[3] = (timeLow >>> 16) & 0xff
  bytes[4] = (timeLow >>> 8) & 0xff
  bytes[5] = timeLow & 0xff

  bytes[6] = (bytes[6] & 0x0f) | 0x70 // version 7 in high nibble of byte 6
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10xx in high bits of byte 8
  return bytesToUuid(bytes)
}

function makeOne(): string {
  return version.value === 'v4' ? uuidV4() : uuidV7()
}

/** Apply the uppercase / hyphens display options to a canonical UUID. */
function formatOne(uuid: string): string {
  let out = uuid
  if (!hyphens.value) out = out.replace(/-/g, '')
  if (uppercase.value) out = out.toUpperCase()
  return out
}

// Raw canonical UUIDs are generated once; display formatting is reactive
// so toggling uppercase/hyphens never re-randomises the list.
const display = computed(() => uuids.value.map(formatOne))
const allText = computed(() => display.value.join('\n'))

function clampCount() {
  let n = Math.floor(Number(count.value) || 0)
  if (n < 1) n = 1
  if (n > 100) n = 100
  count.value = n
}

function generate() {
  clampCount()
  const next: string[] = []
  for (let i = 0; i < count.value; i++) next.push(makeOne())
  uuids.value = next
}

// First batch is produced on the client only — never during prerender —
// so server HTML (empty list) matches the initial client render.
onMounted(generate)

const faqEn: FaqItem[] = [
  {
    q: 'Are these UUIDs safe to use as real identifiers?',
    a: 'Yes. They are generated with the WebCrypto API (crypto.randomUUID and crypto.getRandomValues), which is a cryptographically strong random source. Because everything runs in your browser, the values are never sent anywhere, so they are safe for production keys, test fixtures and seed data alike.',
  },
  {
    q: 'What is the difference between UUID v4 and v7?',
    a: 'A v4 UUID is fully random except for the version and variant bits, so it has no inherent order. A v7 UUID embeds a 48-bit Unix-millisecond timestamp in its leading bytes, which makes IDs generated over time sort chronologically — handy as database primary keys because they keep B-tree indexes from fragmenting.',
  },
  {
    q: 'Why are v7 UUIDs better for database primary keys?',
    a: 'Because the timestamp comes first, v7 values are roughly monotonic, so new rows append near the end of an index instead of scattering randomly like v4. That improves insert locality and cache behaviour while still being globally unique and unguessable for the random portion.',
  },
  {
    q: 'Is anything sent to a server when I generate UUIDs?',
    a: 'No. The entire generator runs client-side in JavaScript. No UUIDs, timestamps or settings ever leave your device, and there is no logging or analytics on the values themselves, which makes it suitable for sensitive or offline work.',
  },
  {
    q: 'Can I generate many UUIDs at once and copy them together?',
    a: 'Yes. Set the count to anything from 1 to 100, click Generate, and use Copy all to grab the whole batch as a newline-separated list. Each row also has its own copy button for grabbing a single value.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Безопасно ли использовать эти UUID как настоящие идентификаторы?',
    a: 'Да. Они генерируются через WebCrypto API (crypto.randomUUID и crypto.getRandomValues) — криптографически стойкий источник случайности. Поскольку всё работает в браузере, значения никуда не отправляются, поэтому их безопасно использовать как для продакшен-ключей, так и для тестовых данных и сид-записей.',
  },
  {
    q: 'В чём разница между UUID v4 и v7?',
    a: 'UUID v4 полностью случаен, за исключением битов версии и варианта, поэтому у него нет внутреннего порядка. UUID v7 встраивает 48-битный timestamp в миллисекундах Unix в начальные байты, благодаря чему идентификаторы, созданные с течением времени, сортируются хронологически — это удобно для первичных ключей базы данных, так как препятствует фрагментации B-tree индексов.',
  },
  {
    q: 'Почему UUID v7 лучше подходят для первичных ключей базы данных?',
    a: 'Поскольку timestamp идёт первым, значения v7 примерно монотонны, поэтому новые строки добавляются ближе к концу индекса, а не разбрасываются случайно, как v4. Это улучшает локальность вставок и поведение кэша, при этом значения остаются глобально уникальными, а случайная часть — непредсказуемой.',
  },
  {
    q: 'Отправляется ли что-нибудь на сервер при генерации UUID?',
    a: 'Нет. Весь генератор работает на стороне клиента на JavaScript. Ни UUID, ни timestamp, ни настройки не покидают ваше устройство, и сами значения нигде не логируются и не отслеживаются — поэтому инструмент подходит для конфиденциальной или офлайн-работы.',
  },
  {
    q: 'Можно ли сгенерировать много UUID сразу и скопировать их вместе?',
    a: 'Да. Укажите количество от 1 до 100, нажмите «Сгенерировать» и используйте «Копировать всё», чтобы получить всю пачку списком, разделённым переносами строк. У каждой строки также есть собственная кнопка копирования для отдельного значения.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="uuid-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="generate">{{ t('common.generate') }}</button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.version }}
        <select v-model="version" class="field !w-auto !py-1.5" :aria-label="ui.versionAria">
          <option value="v4">{{ ui.v4 }}</option>
          <option value="v7">{{ ui.v7 }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ t('common.count') }}
        <input
          v-model.number="count"
          type="number"
          min="1"
          max="100"
          class="field !w-20 !py-1.5"
          :aria-label="ui.countAria"
          @change="clampCount"
        />
      </label>

      <div class="ml-auto flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="uppercase" type="checkbox" class="accent-accent" />
          {{ t('common.uppercase') }}
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="hyphens" type="checkbox" class="accent-accent" />
          {{ ui.hyphens }}
        </label>
        <CopyButton :text="() => allText" :label="t('common.copyAll')" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <span class="font-medium text-green-600 dark:text-green-400">
        {{ version === 'v4' ? ui.statusV4 : ui.statusV7 }}
      </span>
      <span class="text-ink-400">{{ ui.generatedIn }}</span>
    </div>

    <!-- Results: random + time based, so render on the client only -->
    <div class="mt-3">
      <ClientOnly>
        <ul class="divide-y divide-ink-200 overflow-hidden rounded-lg border border-ink-200 dark:divide-ink-800 dark:border-ink-700">
          <li
            v-for="(value, i) in display"
            :key="i"
            class="flex items-center justify-between gap-3 bg-white px-3 py-2 dark:bg-ink-950"
          >
            <code class="select-all break-all font-mono text-sm text-ink-800 dark:text-ink-100">{{ value }}</code>
            <CopyButton :text="() => value" small />
          </li>
        </ul>
        <template #fallback>
          <div class="rounded-lg border border-ink-200 bg-white px-3 py-6 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950">
            {{ ui.generating }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генерация UUID v4 и v7 онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор UUID</strong> создаёт универсальные
          уникальные идентификаторы (их также называют GUID) пачками, прямо в
          вашем браузере. Выберите классическую <strong>версию 4</strong>
          (полностью случайную) или новую <strong>версию 7</strong>
          (упорядоченную по времени), а затем копируйте результаты по одному или
          все сразу.
        </p>
        <p>
          Каждое значение генерируется через браузерный API
          <strong>WebCrypto</strong>, поэтому случайность криптографически стойкая,
          а <strong>ничего никогда не отправляется на сервер</strong> — идеально для
          генерации ключей, тестовых данных или сид-записей в конфиденциальных проектах.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите версию: <code>v4</code> для случайных идентификаторов или <code>v7</code> для упорядоченных по времени.</li>
          <li>Укажите в поле <code>Количество</code>, сколько нужно — от 1 до 100.</li>
          <li>Нажмите <code>Сгенерировать</code>, чтобы получить новую пачку.</li>
          <li>Переключайте <code>Верхний регистр</code> и <code>Дефисы</code>, чтобы настроить формат под себя.</li>
          <li>Используйте кнопку <code>Копировать</code> в строке для одного значения или <code>Копировать всё</code> для всего списка.</li>
        </ul>

        <h2>v4 против v7: что выбрать?</h2>
        <p>
          <strong>UUID v4</strong> — это 122 бита случайности с фиксированными
          битами версии и варианта, что даёт астрономически малую вероятность
          коллизии без какого-либо порядка. <strong>UUID v7</strong> помещает
          48-битный timestamp в миллисекундах Unix в первые шесть байт, поэтому
          идентификаторы, созданные с течением времени, сортируются хронологически.
          Это делает v7 отличным выбором для первичных ключей базы данных, где
          монотонные вставки сохраняют индексы компактными, тогда как v4 остаётся
          идеальным для непрозрачных токенов, имён файлов и везде, где порядок не
          должен раскрываться.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужна контрольная сумма вместо идентификатора? Попробуйте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>.
          Чтобы работать с timestamp, встроенными в UUID v7, используйте
          <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертер Unix timestamp</NuxtLink>,
          или составьте расписание в
          <NuxtLink :to="localePath('/cron-generator')">генераторе cron</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate v4 and v7 UUIDs online</h2>
        <p>
          This free <strong>UUID generator</strong> creates universally unique
          identifiers (also called GUIDs) in bulk, right in your browser. Choose
          between classic <strong>version 4</strong> (fully random) and the newer
          <strong>version 7</strong> (time-ordered) format, then copy the results
          individually or all at once.
        </p>
        <p>
          Every value is produced with the browser's
          <strong>WebCrypto</strong> API, so the randomness is cryptographically
          strong and <strong>nothing is ever sent to a server</strong> — ideal for
          generating keys, test data or seed records on sensitive projects.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick a version: <code>v4</code> for random IDs or <code>v7</code> for time-ordered ones.</li>
          <li>Set <code>Count</code> to how many you need, from 1 up to 100.</li>
          <li>Click <code>Generate</code> to produce a fresh batch.</li>
          <li>Toggle <code>Uppercase</code> and <code>Hyphens</code> to match your formatting needs.</li>
          <li>Use the row <code>Copy</code> button for one value, or <code>Copy all</code> for the whole list.</li>
        </ul>

        <h2>v4 vs. v7: which should you use?</h2>
        <p>
          A <strong>v4 UUID</strong> is 122 bits of randomness with fixed version
          and variant bits, giving an astronomically low collision chance with no
          ordering. A <strong>v7 UUID</strong> places a 48-bit Unix-millisecond
          timestamp in its first six bytes, so identifiers minted over time sort
          chronologically. That makes v7 a strong choice for database primary keys,
          where monotonic inserts keep indexes compact, while v4 remains perfect
          for opaque tokens, file names and anywhere ordering should not leak.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a checksum instead of an ID? Try the
          <NuxtLink :to="localePath('/hash-generator')">Hash generator</NuxtLink>.
          To work with the timestamps embedded in v7 UUIDs, use the
          <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>,
          or build a schedule with the
          <NuxtLink :to="localePath('/cron-generator')">Cron generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
