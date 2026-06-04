<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')

// Assumed offline guess rate for the crack-time estimate (fast GPU cracking
// of a fast/unsalted hash). Kept as a constant so the meaning is explicit.
const GUESS_RATE = 1e10

// Tool-specific labels (common verbs like Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        placeholder: 'Введите пароль, чтобы оценить надёжность…',
        length: 'Длина',
        poolSize: 'Размер алфавита',
        entropy: 'Энтропия',
        bits: 'бит',
        crackTime: 'Время взлома (офлайн)',
        rating: 'Оценка',
        charClasses: 'Наборы символов',
        lowercase: 'Строчные (a–z)',
        uppercase: 'Прописные (A–Z)',
        digits: 'Цифры (0–9)',
        symbols: 'Символы (!@#…)',
        warnings: 'Предупреждения',
        sampleLabel: 'Пример',
        privacy: 'Пароль анализируется прямо в браузере и никуда не отправляется.',
        instant: 'мгновенно',
        ratings: {
          veryWeak: 'Очень слабый',
          weak: 'Слабый',
          fair: 'Средний',
          strong: 'Надёжный',
          veryStrong: 'Очень надёжный',
        },
        warn: {
          tooShort: 'Слишком короткий — используйте минимум 12 символов.',
          onlyDigits: 'Только цифры — такой пароль подбирается мгновенно.',
          onlyLower: 'Только строчные буквы — добавьте регистр, цифры и символы.',
          noDigits: 'Нет цифр — добавьте хотя бы несколько.',
          noSymbols: 'Нет символов — добавьте знаки вроде !@#$ для надёжности.',
          oneClass: 'Один набор символов — смешайте разные типы.',
        },
      }
    : {
        placeholder: 'Type a password to estimate its strength…',
        length: 'Length',
        poolSize: 'Character pool',
        entropy: 'Entropy',
        bits: 'bits',
        crackTime: 'Crack time (offline)',
        rating: 'Rating',
        charClasses: 'Character sets',
        lowercase: 'Lowercase (a–z)',
        uppercase: 'Uppercase (A–Z)',
        digits: 'Digits (0–9)',
        symbols: 'Symbols (!@#…)',
        warnings: 'Warnings',
        sampleLabel: 'Sample',
        privacy: 'Your password is analysed in your browser and never sent anywhere.',
        instant: 'instant',
        ratings: {
          veryWeak: 'Very weak',
          weak: 'Weak',
          fair: 'Fair',
          strong: 'Strong',
          veryStrong: 'Very strong',
        },
        warn: {
          tooShort: 'Too short — use at least 12 characters.',
          onlyDigits: 'Digits only — this is cracked almost instantly.',
          onlyLower: 'Lowercase only — add case, digits and symbols.',
          noDigits: 'No digits — add a few.',
          noSymbols: 'No symbols — add characters like !@#$ for strength.',
          oneClass: 'Only one character set — mix different types.',
        },
      },
)

const length = computed(() => input.value.length)

// Which character classes appear, used to derive the guessing pool size.
const classes = computed(() => {
  const v = input.value
  return {
    lowercase: /[a-z]/.test(v),
    uppercase: /[A-Z]/.test(v),
    digits: /[0-9]/.test(v),
    // Anything that is not a letter, digit or whitespace counts as a symbol.
    symbols: /[^a-zA-Z0-9\s]/.test(v),
  }
})

const poolSize = computed(() => {
  if (!input.value) return 0
  const c = classes.value
  let pool = 0
  if (c.lowercase) pool += 26
  if (c.uppercase) pool += 26
  if (c.digits) pool += 10
  if (c.symbols) pool += 33
  // Fallback for inputs made purely of e.g. spaces/unicode we did not bucket.
  return pool || 1
})

// Entropy in bits = length * log2(poolSize). Pure arithmetic over the input.
const entropyBits = computed(() => {
  if (!input.value || poolSize.value <= 1) return 0
  return length.value * Math.log2(poolSize.value)
})

const ratingKey = computed<'veryWeak' | 'weak' | 'fair' | 'strong' | 'veryStrong'>(() => {
  const e = entropyBits.value
  if (e < 28) return 'veryWeak'
  if (e < 36) return 'weak'
  if (e < 60) return 'fair'
  if (e < 128) return 'strong'
  return 'veryStrong'
})

const ratingLabel = computed(() => ui.value.ratings[ratingKey.value])

// 0–100 width for the meter bar (capped at 128 bits = full).
const meterPercent = computed(() =>
  Math.min(100, Math.round((entropyBits.value / 128) * 100)),
)

const meterColor = computed(() => {
  switch (ratingKey.value) {
    case 'veryWeak':
      return 'bg-red-500'
    case 'weak':
      return 'bg-orange-500'
    case 'fair':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-lime-500'
    default:
      return 'bg-green-500'
  }
})

const ratingTextColor = computed(() => {
  switch (ratingKey.value) {
    case 'veryWeak':
      return 'text-red-600 dark:text-red-400'
    case 'weak':
      return 'text-orange-600 dark:text-orange-400'
    case 'fair':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'strong':
      return 'text-lime-600 dark:text-lime-400'
    default:
      return 'text-green-600 dark:text-green-400'
  }
})

// Estimated offline crack time in seconds: 2^entropy / rate. Pure arithmetic,
// no clock is read anywhere — just the number formatted into words below.
const crackSeconds = computed(() => {
  if (!input.value || entropyBits.value <= 0) return 0
  return Math.pow(2, entropyBits.value) / GUESS_RATE
})

function formatDuration(seconds: number): string {
  if (seconds < 1) return ui.value.instant

  const ru = locale.value === 'ru'
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const year = day * 365
  const century = year * 100

  // Pick the largest sensible unit, with pluralised labels per locale.
  const pick = (
    value: number,
    en: [string, string],
    ruForms: [string, string, string],
  ): string => {
    const n = Math.round(value)
    if (ru) return `${n.toLocaleString('ru-RU')} ${plural(n, ruForms)}`
    return `${n.toLocaleString('en-US')} ${n === 1 ? en[0] : en[1]}`
  }

  if (seconds >= century * 1000) {
    return ru ? 'миллиарды лет' : 'billions of years'
  }
  if (seconds >= century) {
    return pick(seconds / century, ['century', 'centuries'], ['век', 'века', 'веков'])
  }
  if (seconds >= year) {
    return pick(seconds / year, ['year', 'years'], ['год', 'года', 'лет'])
  }
  if (seconds >= day) {
    return pick(seconds / day, ['day', 'days'], ['день', 'дня', 'дней'])
  }
  if (seconds >= hour) {
    return pick(seconds / hour, ['hour', 'hours'], ['час', 'часа', 'часов'])
  }
  if (seconds >= minute) {
    return pick(seconds / minute, ['minute', 'minutes'], ['минута', 'минуты', 'минут'])
  }
  return pick(seconds, ['second', 'seconds'], ['секунда', 'секунды', 'секунд'])
}

// Russian plural selector (one / few / many).
function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

const crackTime = computed(() => {
  if (!input.value) return '—'
  return formatDuration(crackSeconds.value)
})

const classRows = computed(() => {
  const c = classes.value
  return [
    { key: 'lowercase', label: ui.value.lowercase, present: c.lowercase },
    { key: 'uppercase', label: ui.value.uppercase, present: c.uppercase },
    { key: 'digits', label: ui.value.digits, present: c.digits },
    { key: 'symbols', label: ui.value.symbols, present: c.symbols },
  ]
})

const warnings = computed(() => {
  if (!input.value) return [] as string[]
  const c = classes.value
  const list: string[] = []
  const onlyDigits = c.digits && !c.lowercase && !c.uppercase && !c.symbols
  const onlyLower = c.lowercase && !c.uppercase && !c.digits && !c.symbols
  const classCount = [c.lowercase, c.uppercase, c.digits, c.symbols].filter(Boolean).length

  if (length.value < 12) list.push(ui.value.warn.tooShort)
  if (onlyDigits) list.push(ui.value.warn.onlyDigits)
  else if (onlyLower) list.push(ui.value.warn.onlyLower)
  else if (classCount === 1) list.push(ui.value.warn.oneClass)
  if (!c.digits && !onlyDigits) list.push(ui.value.warn.noDigits)
  if (!c.symbols) list.push(ui.value.warn.noSymbols)

  return list
})

const stats = computed(() => [
  { key: 'length', label: ui.value.length, value: input.value ? length.value.toLocaleString() : '—' },
  { key: 'poolSize', label: ui.value.poolSize, value: input.value ? poolSize.value.toString() : '—' },
  {
    key: 'entropy',
    label: ui.value.entropy,
    value: input.value ? `${Math.round(entropyBits.value)} ${ui.value.bits}` : '—',
  },
  { key: 'crackTime', label: ui.value.crackTime, value: crackTime.value },
])

function clear() {
  input.value = ''
}

const sampleEn = 'Tr0ub4dour&3'
const sampleRu = 'L0sh@d-Korabl9-2026!'

function loadSample() {
  input.value = locale.value === 'ru' ? sampleRu : sampleEn
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my password sent to a server?',
    a: 'No. Everything runs entirely in your browser with JavaScript — nothing is uploaded, logged or stored. Your password never leaves the page, so it is safe to test even passwords you actively use.',
  },
  {
    q: 'How is the strength estimated?',
    a: 'It is a heuristic based on entropy, not a guarantee. The tool detects which character sets you use (lowercase, uppercase, digits, symbols) to get a guessing pool, then estimates entropy as length × log2(pool size) and maps that to a rating from Very weak to Very strong.',
  },
  {
    q: 'What does the crack time mean?',
    a: 'It assumes an attacker who already has the password hash and can try about 10 billion guesses per second on a fast GPU. The seconds value is 2^entropy ÷ guess rate, then formatted into a human-readable span. Slow, salted hashing (like bcrypt) makes real attacks far slower.',
  },
  {
    q: 'Why is a long passphrase often stronger than a complex short one?',
    a: 'Entropy grows with length, so each extra character multiplies the number of guesses required. A long, random passphrase usually beats a short string full of symbols, which is also harder to type and remember.',
  },
  {
    q: 'Does this checker detect leaked or common passwords?',
    a: 'No. It only measures structural strength — it does not compare against breach databases or dictionaries. A password can look strong by entropy yet still be unsafe if it has appeared in a data breach, so avoid reusing real passwords.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой пароль на сервер?',
    a: 'Нет. Всё работает полностью в браузере на JavaScript — ничего не загружается, не логируется и не сохраняется. Пароль не покидает страницу, поэтому проверять можно даже те пароли, которыми вы пользуетесь.',
  },
  {
    q: 'Как оценивается надёжность?',
    a: 'Это эвристика на основе энтропии, а не гарантия. Инструмент определяет, какие наборы символов вы используете (строчные, прописные, цифры, символы), вычисляет размер алфавита подбора, оценивает энтропию как длина × log2(размер алфавита) и сопоставляет с оценкой от «Очень слабый» до «Очень надёжный».',
  },
  {
    q: 'Что означает время взлома?',
    a: 'Предполагается, что у злоумышленника уже есть хеш пароля и он перебирает около 10 миллиардов вариантов в секунду на быстром GPU. Время в секундах — это 2^энтропия ÷ скорость перебора, затем число переводится в читаемый вид. Медленное хеширование с солью (например, bcrypt) делает реальные атаки гораздо медленнее.',
  },
  {
    q: 'Почему длинная фраза часто надёжнее короткого «сложного» пароля?',
    a: 'Энтропия растёт с длиной, поэтому каждый дополнительный символ умножает число необходимых вариантов перебора. Длинная случайная парольная фраза обычно надёжнее короткой строки из символов — и при этом её проще ввести и запомнить.',
  },
  {
    q: 'Проверяет ли инструмент утёкшие или популярные пароли?',
    a: 'Нет. Он измеряет только структурную надёжность и не сверяется с базами утечек или словарями. Пароль может выглядеть надёжным по энтропии, но всё равно быть небезопасным, если он засветился в утечке, поэтому не используйте здесь реальные пароли.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="password-strength-checker" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
      <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <label class="label" for="psc-input">{{ t('common.input') }}</label>
      <input
        id="psc-input"
        v-model="input"
        type="text"
        class="field font-mono"
        spellcheck="false"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        :placeholder="ui.placeholder"
        :aria-label="t('common.input')"
      />
      <p class="mt-2 text-xs text-ink-500 dark:text-ink-400">🔒 {{ ui.privacy }}</p>
    </div>

    <!-- Strength meter -->
    <div class="mt-5">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-ink-500 dark:text-ink-400">{{ ui.rating }}</span>
        <span class="text-sm font-semibold" :class="ratingTextColor">
          {{ input ? ratingLabel : '—' }}
        </span>
      </div>
      <div class="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="meterColor"
          :style="{ width: `${input ? meterPercent : 0}%` }"
        />
      </div>
    </div>

    <!-- Stats -->
    <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        v-for="s in stats"
        :key="s.key"
        class="rounded-lg border border-ink-200 bg-white p-3.5 dark:border-ink-700 dark:bg-ink-950"
      >
        <div class="font-mono text-lg font-semibold tabular-nums text-ink-900 dark:text-ink-100">
          {{ s.value }}
        </div>
        <div class="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Character sets -->
    <div class="mt-5">
      <div class="mb-2 text-sm font-medium text-ink-500 dark:text-ink-400">{{ ui.charClasses }}</div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          v-for="c in classRows"
          :key="c.key"
          class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
          :class="
            c.present
              ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
              : 'border-ink-200 text-ink-400 dark:border-ink-700 dark:text-ink-500'
          "
        >
          <span aria-hidden="true">{{ c.present ? '✓' : '·' }}</span>
          <span>{{ c.label }}</span>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length" class="mt-5">
      <div class="mb-2 text-sm font-medium text-ink-500 dark:text-ink-400">{{ ui.warnings }}</div>
      <ul class="space-y-1.5">
        <li
          v-for="(w, i) in warnings"
          :key="i"
          class="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{{ w }}</span>
        </li>
      </ul>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Проверка надёжности пароля онлайн</h2>
        <p>
          Этот бесплатный <strong>чекер надёжности пароля</strong> прямо во время
          набора показывает длину, используемые наборы символов, примерную
          <strong>энтропию в битах</strong>, итоговую оценку силы и ориентировочное
          время офлайн-взлома. Он помогает понять, достаточно ли стоек пароль, и
          подсказывает, что улучшить.
        </p>
        <p>
          Инструмент работает <strong>полностью в браузере</strong>. Пароль
          никуда не отправляется, не логируется и не сохраняется — все расчёты
          выполняются локально на вашем устройстве.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите пароль в поле — оценка и метрики пересчитываются на лету.</li>
          <li>Смотрите цветной индикатор силы и оценку от «Очень слабый» до «Очень надёжный».</li>
          <li>Проверьте, какие наборы символов задействованы, и прочитайте предупреждения.</li>
          <li>Нажмите <code>Пример</code>, чтобы подставить демонстрационный пароль, или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Как считается энтропия и время взлома</h2>
        <p>
          Размер алфавита складывается из присутствующих классов символов: строчные
          (26), прописные (26), цифры (10) и символы (около 33). Энтропия
          оценивается как <strong>длина × log₂(размер алфавита)</strong>. Время
          взлома — это 2^энтропия, делённое на предполагаемую скорость перебора
          (около 10 миллиардов вариантов в секунду на быстром GPU), переведённое в
          читаемый вид. Это эвристическая оценка, а не гарантия: реальная стойкость
          зависит от способа хранения хеша, наличия соли и того, не встречался ли
          пароль в утечках.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Создайте стойкий пароль в
          <NuxtLink :to="localePath('/password-generator')">генераторе паролей</NuxtLink>,
          получите безопасный хеш пароля с помощью
          <NuxtLink :to="localePath('/bcrypt-generator')">генератора bcrypt</NuxtLink>
          или посчитайте контрольные суммы в
          <NuxtLink :to="localePath('/hash-generator')">генераторе хешей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Check password strength online</h2>
        <p>
          This free <strong>password strength checker</strong> shows, as you type,
          the length, which character sets you use, the estimated
          <strong>entropy in bits</strong>, an overall strength rating and a rough
          offline crack-time guide. It helps you judge whether a password is
          resilient and what to improve.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your password
          is never sent to a server, logged or stored — every calculation happens
          locally on your device.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a password into the field — the rating and metrics recalculate on the fly.</li>
          <li>Watch the coloured strength meter and the rating from Very weak to Very strong.</li>
          <li>See which character sets are in use and read any warnings.</li>
          <li>Click <code>Sample</code> to load a demo password, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>How entropy and crack time are calculated</h2>
        <p>
          The character pool is the sum of the classes present: lowercase (26),
          uppercase (26), digits (10) and symbols (about 33). Entropy is estimated
          as <strong>length × log₂(pool size)</strong>. Crack time is 2^entropy
          divided by an assumed guess rate (around 10 billion guesses per second on
          a fast GPU), then formatted into a readable span. This is a heuristic
          estimate, not a guarantee: real strength depends on how the hash is
          stored, whether it is salted, and whether the password has appeared in a
          breach.
        </p>

        <h2>Related tools</h2>
        <p>
          Create a strong password with the
          <NuxtLink :to="localePath('/password-generator')">password generator</NuxtLink>,
          produce a secure password hash with the
          <NuxtLink :to="localePath('/bcrypt-generator')">bcrypt generator</NuxtLink>,
          or compute checksums in the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
