<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const length = ref(16)
const useUppercase = ref(true)
const useLowercase = ref(true)
const useDigits = ref(true)
const useSymbols = ref(true)
const excludeAmbiguous = ref(false)

// Tool-specific labels (common verbs like Generate/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        length: 'Длина',
        lengthAria: 'Длина пароля',
        charSets: 'Наборы символов',
        uppercase: 'Прописные (A–Z)',
        lowercase: 'Строчные (a–z)',
        digits: 'Цифры (0–9)',
        symbols: 'Символы (!@#$…)',
        excludeAmbiguous: 'Исключить похожие (Il1O0|)',
        strength: 'Надёжность',
        weak: 'Слабый',
        fair: 'Средний',
        strong: 'Надёжный',
        veryStrong: 'Очень надёжный',
        entropy: 'бит энтропии',
        noSet: 'Выберите хотя бы один набор символов.',
        generating: 'Генерируем пароль…',
        passwordAria: 'Сгенерированный пароль',
      }
    : {
        length: 'Length',
        lengthAria: 'Password length',
        charSets: 'Character sets',
        uppercase: 'Uppercase (A–Z)',
        lowercase: 'Lowercase (a–z)',
        digits: 'Digits (0–9)',
        symbols: 'Symbols (!@#$…)',
        excludeAmbiguous: 'Exclude ambiguous (Il1O0|)',
        strength: 'Strength',
        weak: 'Weak',
        fair: 'Fair',
        strong: 'Strong',
        veryStrong: 'Very strong',
        entropy: 'bits of entropy',
        noSet: 'Select at least one character set.',
        generating: 'Generating password…',
        passwordAria: 'Generated password',
      },
)

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?'
// Visually ambiguous glyphs that are easy to misread or mistype.
const AMBIGUOUS = new Set('Il1O0|'.split(''))

const hasSet = computed(
  () => useUppercase.value || useLowercase.value || useDigits.value || useSymbols.value,
)

// Charset is a pure computed (no randomness) so it is SSG-safe.
const charset = computed(() => {
  let chars = ''
  if (useUppercase.value) chars += UPPERCASE
  if (useLowercase.value) chars += LOWERCASE
  if (useDigits.value) chars += DIGITS
  if (useSymbols.value) chars += SYMBOLS
  if (excludeAmbiguous.value) {
    chars = chars
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }
  return chars
})

// Estimated entropy in bits: length * log2(alphabet size).
const entropyBits = computed(() => {
  const size = charset.value.length
  if (size <= 1 || length.value <= 0) return 0
  return Math.round(length.value * Math.log2(size))
})

const strength = computed<'weak' | 'fair' | 'strong' | 'veryStrong'>(() => {
  const e = entropyBits.value
  if (e < 40) return 'weak'
  if (e < 64) return 'fair'
  if (e < 100) return 'strong'
  return 'veryStrong'
})

const strengthMeta = computed(() => {
  switch (strength.value) {
    case 'weak':
      return { label: ui.value.weak, bars: 1, color: 'bg-red-500', text: 'text-red-600 dark:text-red-400' }
    case 'fair':
      return { label: ui.value.fair, bars: 2, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' }
    case 'strong':
      return { label: ui.value.strong, bars: 3, color: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' }
    default:
      return { label: ui.value.veryStrong, bars: 4, color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' }
  }
})

/**
 * Uniform random integer in [0, max) using crypto.getRandomValues with
 * rejection sampling to avoid modulo bias.
 */
function randomIndex(max: number): number {
  if (max <= 0) return 0
  // Largest multiple of `max` that fits in a uint32; reject anything above it.
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return x % max
}

function clampLength() {
  let n = Math.floor(Number(length.value) || 0)
  if (n < 6) n = 6
  if (n > 64) n = 64
  length.value = n
}

// RANDOM output: must NOT be produced during SSR/prerender.
// Start empty (stable across server/client), then populate in onMounted().
const password = ref('')

function generate() {
  if (!hasSet.value) {
    password.value = ''
    return
  }
  clampLength()
  const pool = charset.value
  if (!pool.length) {
    password.value = ''
    return
  }
  let out = ''
  for (let i = 0; i < length.value; i++) {
    out += pool[randomIndex(pool.length)]
  }
  password.value = out
}

// First password is produced on the client only — never during prerender —
// so server HTML (empty) matches the initial client render.
onMounted(generate)

const faqEn: FaqItem[] = [
  {
    q: 'Is my password sent to a server?',
    a: 'No. The password is generated entirely in your browser using the WebCrypto API (crypto.getRandomValues). Nothing is uploaded, logged or stored, so the value never leaves your device — which is exactly what you want for a secret.',
  },
  {
    q: 'How random are the passwords?',
    a: 'Each character is picked with crypto.getRandomValues, a cryptographically strong random source, and we use rejection sampling so every character in the chosen alphabet is equally likely. That avoids the subtle modulo bias you get from a naive random % length approach.',
  },
  {
    q: 'What does the strength meter mean?',
    a: 'It estimates entropy as length × log2(alphabet size) and labels it Weak (under 40 bits), Fair (40–63), Strong (64–99) or Very strong (100+ bits). More length and more character types both increase entropy, which is the single best predictor of resistance to brute-force guessing.',
  },
  {
    q: 'Why would I exclude ambiguous characters?',
    a: 'Glyphs like I, l, 1, O, 0 and the pipe | look almost identical in many fonts, so they are easy to misread when copying a password by hand. Excluding them makes the password easier to type from a screen at the cost of a slightly smaller alphabet.',
  },
  {
    q: 'How long should a password be?',
    a: 'For most accounts 16 characters with mixed sets is a solid default and lands in the Very strong range. For high-value accounts that you protect with a password manager, longer is always better — there is no downside to 24 or 32 characters when you are not typing them by hand.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой пароль на сервер?',
    a: 'Нет. Пароль генерируется полностью в браузере через WebCrypto API (crypto.getRandomValues). Ничего не загружается, не логируется и не сохраняется, поэтому значение никогда не покидает ваше устройство — именно это и нужно для секрета.',
  },
  {
    q: 'Насколько случайны пароли?',
    a: 'Каждый символ выбирается через crypto.getRandomValues — криптографически стойкий источник случайности, а мы используем выборку с отбраковкой (rejection sampling), чтобы каждый символ алфавита был равновероятен. Это устраняет тонкое смещение по модулю, возникающее при наивном подходе random % длина.',
  },
  {
    q: 'Что означает индикатор надёжности?',
    a: 'Он оценивает энтропию как длина × log2(размер алфавита) и присваивает метку: Слабый (менее 40 бит), Средний (40–63), Надёжный (64–99) или Очень надёжный (от 100 бит). И большая длина, и больше типов символов повышают энтропию — главный показатель устойчивости к перебору.',
  },
  {
    q: 'Зачем исключать похожие символы?',
    a: 'Символы вроде I, l, 1, O, 0 и вертикальной черты | во многих шрифтах выглядят почти одинаково, поэтому их легко перепутать при ручном вводе пароля. Их исключение упрощает набор пароля с экрана ценой чуть меньшего алфавита.',
  },
  {
    q: 'Какой длины должен быть пароль?',
    a: 'Для большинства аккаунтов 16 символов со смешанными наборами — надёжное значение по умолчанию, попадающее в категорию «Очень надёжный». Для важных аккаунтов, которые вы храните в менеджере паролей, чем длиннее, тем лучше — у 24 или 32 символов нет минусов, если вы не вводите их вручную.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="password-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="btn-primary" :disabled="!hasSet" @click="generate">
        {{ t('common.generate') }}
      </button>

      <label class="ml-1 flex items-center gap-3 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.length }}
        <input
          v-model.number="length"
          type="range"
          min="6"
          max="64"
          step="1"
          class="w-40 accent-accent"
          :aria-label="ui.lengthAria"
          @input="generate"
        />
        <input
          v-model.number="length"
          type="number"
          min="6"
          max="64"
          class="field !w-20 !py-1.5"
          :aria-label="ui.lengthAria"
          @change="clampLength(); generate()"
        />
      </label>

      <div class="ml-auto">
        <CopyButton :text="() => password" />
      </div>
    </div>

    <!-- Character set options -->
    <fieldset class="mt-4">
      <legend class="label">{{ ui.charSets }}</legend>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="useUppercase" type="checkbox" class="accent-accent" @change="generate" />
          {{ ui.uppercase }}
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="useLowercase" type="checkbox" class="accent-accent" @change="generate" />
          {{ ui.lowercase }}
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="useDigits" type="checkbox" class="accent-accent" @change="generate" />
          {{ ui.digits }}
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="useSymbols" type="checkbox" class="accent-accent" @change="generate" />
          {{ ui.symbols }}
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="excludeAmbiguous" type="checkbox" class="accent-accent" @change="generate" />
          {{ ui.excludeAmbiguous }}
        </label>
      </div>
    </fieldset>

    <!-- Generated password (random -> client only) -->
    <div class="mt-4">
      <ClientOnly>
        <div
          v-if="hasSet"
          class="flex min-h-[3.5rem] items-center break-all rounded-lg border border-ink-200 bg-white px-4 py-3 font-mono text-lg text-ink-900 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-100"
        >
          <span class="select-all">{{ password }}</span>
        </div>
        <p
          v-else
          class="flex min-h-[3.5rem] items-center rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-red-600 dark:border-ink-700 dark:bg-ink-950 dark:text-red-400"
        >
          {{ ui.noSet }}
        </p>
        <template #fallback>
          <div class="flex min-h-[3.5rem] items-center rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950">
            {{ ui.generating }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Strength meter (entropy is derived from settings only, but keep it
         next to the random output so the whole result block is client-only) -->
    <div class="mt-3">
      <ClientOnly>
        <div v-if="hasSet" class="flex items-center gap-3 text-sm">
          <span class="text-ink-500 dark:text-ink-400">{{ ui.strength }}:</span>
          <span class="flex items-center gap-1" aria-hidden="true">
            <span
              v-for="i in 4"
              :key="i"
              class="h-1.5 w-8 rounded-full"
              :class="i <= strengthMeta.bars ? strengthMeta.color : 'bg-ink-200 dark:bg-ink-700'"
            />
          </span>
          <span class="font-medium" :class="strengthMeta.text">{{ strengthMeta.label }}</span>
          <span class="text-ink-400">· {{ entropyBits }} {{ ui.entropy }}</span>
        </div>
      </ClientOnly>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генерация надёжных случайных паролей онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор паролей</strong> создаёт стойкие
          случайные пароли прямо в вашем браузере. Настройте длину от 6 до 64
          символов, выберите наборы — прописные, строчные, цифры и символы — и
          при необходимости исключите похожие символы, которые легко перепутать.
          Каждый символ выбирается через криптографически стойкий источник
          случайности, а индикатор сразу показывает примерную надёжность.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Пароль не
          отправляется на сервер, нигде не логируется и не сохраняется, поэтому
          его безопасно генерировать даже для самых важных аккаунтов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Задайте <code>длину</code> ползунком или числом — от 6 до 64 символов.</li>
          <li>Отметьте нужные наборы: <code>прописные</code>, <code>строчные</code>, <code>цифры</code>, <code>символы</code>.</li>
          <li>Включите <code>Исключить похожие</code>, чтобы убрать I, l, 1, O, 0 и | для удобства чтения.</li>
          <li>Нажмите <code>Сгенерировать</code>, чтобы получить новый пароль (или измените любую настройку — он обновится сам).</li>
          <li>Скопируйте результат кнопкой <code>Копировать</code> и вставьте в менеджер паролей.</li>
        </ul>

        <h2>Что такое энтропия и надёжность</h2>
        <p>
          Надёжность пароля определяется его <strong>энтропией</strong> —
          количеством бит, измеряемым как длина, умноженная на двоичный логарифм
          размера алфавита. Чем длиннее пароль и чем больше типов символов вы
          используете, тем больше энтропия и тем дольше его перебирать. Мы делим
          оценку на «Слабый», «Средний», «Надёжный» и «Очень надёжный»; для
          большинства аккаунтов цельтесь как минимум в «Надёжный», а пароли,
          которые хранятся в менеджере, можно смело делать длиннее.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен случайный идентификатор вместо пароля? Воспользуйтесь
          <NuxtLink :to="localePath('/uuid-generator')">генератором UUID</NuxtLink>.
          Чтобы получить хеш или контрольную сумму, откройте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>,
          а превратить ссылку или текст в код можно в
          <NuxtLink :to="localePath('/qr-code-generator')">генераторе QR-кодов</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate strong random passwords online</h2>
        <p>
          This free <strong>password generator</strong> creates strong, random
          passwords right in your browser. Set a length from 6 to 64 characters,
          pick the character sets — uppercase, lowercase, digits and symbols —
          and optionally exclude look-alike characters that are easy to confuse.
          Every character is drawn from a cryptographically strong random source,
          and the meter shows the estimated strength instantly.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The password
          is never sent to a server, never logged and never stored, so it is safe
          to generate even for your most important accounts.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Set the <code>length</code> with the slider or number box — from 6 to 64 characters.</li>
          <li>Tick the sets you want: <code>uppercase</code>, <code>lowercase</code>, <code>digits</code>, <code>symbols</code>.</li>
          <li>Turn on <code>Exclude ambiguous</code> to drop I, l, 1, O, 0 and | for easier reading.</li>
          <li>Click <code>Generate</code> for a fresh password (or change any setting and it regenerates automatically).</li>
          <li>Use <code>Copy</code> to grab the result and paste it into your password manager.</li>
        </ul>

        <h2>What entropy and strength mean</h2>
        <p>
          A password's resistance to guessing comes down to its
          <strong>entropy</strong> — a bit count measured as length times the
          base-2 logarithm of the alphabet size. The longer the password and the
          more character types you allow, the higher the entropy and the longer a
          brute-force attack takes. We bucket the estimate into Weak, Fair, Strong
          and Very strong; aim for at least Strong on everyday accounts, and feel
          free to go longer for anything stored in a password manager.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a random identifier instead of a password? Use the
          <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>.
          To produce a hash or checksum, open the
          <NuxtLink :to="localePath('/hash-generator')">Hash generator</NuxtLink>,
          and to turn a link or text into a scannable code, try the
          <NuxtLink :to="localePath('/qr-code-generator')">QR code generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
