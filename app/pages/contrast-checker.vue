<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Fixed defaults so SSR output matches client hydration (no randomness/time).
const DEFAULT_FG = '#111827'
const DEFAULT_BG = '#ffffff'

// Source-of-truth text for each field; the picker syncs to/from these.
const fgInput = ref(DEFAULT_FG)
const bgInput = ref(DEFAULT_BG)

interface Rgb {
  r: number
  g: number
  b: number
}

// --- Pure, SSG-safe color helpers -------------------------------------------

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]!
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

// Normalize any accepted hex to canonical 6-digit #rrggbb for the picker/preview.
function normalizeHex(rgb: Rgb): string {
  const to = (n: number) => n.toString(16).padStart(2, '0')
  return '#' + to(rgb.r) + to(rgb.g) + to(rgb.b)
}

// WCAG relative luminance: linearize each sRGB channel, then weight.
function channelLuminance(c8: number): number {
  const c = c8 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
}

// --- Derived values (always reflect the two inputs) -------------------------

const fgRgb = computed(() => hexToRgb(fgInput.value))
const bgRgb = computed(() => hexToRgb(bgInput.value))

const fgValid = computed(() => fgRgb.value !== null)
const bgValid = computed(() => bgRgb.value !== null)
const bothValid = computed(() => fgValid.value && bgValid.value)

// Canonical hex for the picker + preview; falls back to the default when invalid
// so the live preview is never broken while the user is mid-typing.
const fgHex = computed(() => (fgRgb.value ? normalizeHex(fgRgb.value) : DEFAULT_FG))
const bgHex = computed(() => (bgRgb.value ? normalizeHex(bgRgb.value) : DEFAULT_BG))

const ratio = computed<number | null>(() => {
  if (!fgRgb.value || !bgRgb.value) return null
  const l1 = relativeLuminance(fgRgb.value)
  const l2 = relativeLuminance(bgRgb.value)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
})

// "4.54:1" — two decimals, trailing zeros trimmed for whole ratios (21:1).
const ratioLabel = computed(() => {
  const r = ratio.value
  if (r === null) return '—'
  const rounded = Math.round(r * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  return `${text}:1`
})

interface Check {
  level: 'AA' | 'AAA'
  size: 'normal' | 'large'
  threshold: number
  pass: boolean
}

// WCAG 2.1 thresholds: AA 4.5 (normal) / 3.0 (large); AAA 7.0 (normal) / 4.5 (large).
const checks = computed<Check[]>(() => {
  const r = ratio.value
  const build = (level: Check['level'], size: Check['size'], threshold: number): Check => ({
    level,
    size,
    threshold,
    pass: r !== null && r >= threshold,
  })
  return [
    build('AA', 'normal', 4.5),
    build('AA', 'large', 3),
    build('AAA', 'normal', 7),
    build('AAA', 'large', 4.5),
  ]
})

function swap() {
  const a = fgInput.value
  fgInput.value = bgInput.value
  bgInput.value = a
}

function reset() {
  fgInput.value = DEFAULT_FG
  bgInput.value = DEFAULT_BG
}

function onFgPicker(e: Event) {
  fgInput.value = (e.target as HTMLInputElement).value
}
function onBgPicker(e: Event) {
  bgInput.value = (e.target as HTMLInputElement).value
}

// Tool-specific labels (common verbs like Copy/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        foreground: 'Текст (foreground)',
        background: 'Фон (background)',
        ratio: 'Коэффициент контраста',
        invalidHex: 'Некорректный HEX (используйте #RGB или #RRGGBB)',
        invalidPair: 'Исправьте HEX-значения, чтобы вычислить контраст.',
        normal: 'Обычный текст',
        large: 'Крупный текст',
        pass: 'PASS',
        fail: 'FAIL',
        reset: 'Сбросить',
        preview: 'Превью',
        previewText: 'Быстрая бурая лиса прыгает через ленивого пса',
        previewLarge: 'Заголовок крупным текстом',
        min: 'мин.',
      }
    : {
        foreground: 'Text (foreground)',
        background: 'Background',
        ratio: 'Contrast ratio',
        invalidHex: 'Invalid HEX (use #RGB or #RRGGBB)',
        invalidPair: 'Fix the HEX values to compute the contrast.',
        normal: 'Normal text',
        large: 'Large text',
        pass: 'PASS',
        fail: 'FAIL',
        reset: 'Reset',
        preview: 'Preview',
        previewText: 'The quick brown fox jumps over the lazy dog',
        previewLarge: 'Heading in large text',
        min: 'min',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Are my colors sent to a server?',
    a: 'No. The contrast ratio and every WCAG check are computed entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so you can test brand colors and unreleased designs freely.',
  },
  {
    q: 'How is the contrast ratio calculated?',
    a: 'Each color is converted from sRGB to relative luminance: every channel is normalized to 0–1, linearized (a small gamma curve), then weighted as 0.2126·R + 0.7152·G + 0.0722·B. The ratio is (L_lighter + 0.05) / (L_darker + 0.05), giving a value from 1:1 (identical) to 21:1 (black on white).',
  },
  {
    q: 'What are the AA and AAA thresholds?',
    a: 'WCAG 2.1 requires at least 4.5:1 for normal text and 3:1 for large text to pass AA, and 7:1 for normal text and 4.5:1 for large text to pass the stricter AAA. "Large" means roughly 18.66px bold or 24px regular and up.',
  },
  {
    q: 'What counts as large text?',
    a: 'Large text is about 24px (18pt) regular weight or 18.66px (14pt) bold and larger. Because larger glyphs are easier to read, they are allowed a lower contrast threshold than body text.',
  },
  {
    q: 'Does a passing ratio guarantee good readability?',
    a: 'It is a strong baseline, not a guarantee. The ratio ignores font weight, anti-aliasing, surrounding colors and the needs of users with low vision or color blindness, so always sanity-check the live preview and test with real content.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои цвета на сервер?',
    a: 'Нет. Коэффициент контраста и все проверки WCAG вычисляются полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому можно свободно проверять фирменные цвета и неопубликованные макеты.',
  },
  {
    q: 'Как вычисляется коэффициент контраста?',
    a: 'Каждый цвет переводится из sRGB в относительную яркость: каналы нормализуются к 0–1, линеаризуются (небольшая гамма-кривая) и взвешиваются как 0.2126·R + 0.7152·G + 0.0722·B. Коэффициент равен (L_светлее + 0.05) / (L_темнее + 0.05) и лежит в диапазоне от 1:1 (одинаковые) до 21:1 (чёрный на белом).',
  },
  {
    q: 'Какие пороги у AA и AAA?',
    a: 'WCAG 2.1 требует минимум 4.5:1 для обычного текста и 3:1 для крупного, чтобы пройти AA, и 7:1 для обычного текста и 4.5:1 для крупного, чтобы пройти более строгий AAA. «Крупным» считается примерно жирный текст от 18.66px или обычный от 24px.',
  },
  {
    q: 'Что считается крупным текстом?',
    a: 'Крупный текст — это примерно 24px (18pt) обычного начертания или 18.66px (14pt) жирного и больше. Поскольку крупные символы читаются легче, для них допустим более низкий порог контраста, чем для основного текста.',
  },
  {
    q: 'Гарантирует ли проходной коэффициент хорошую читаемость?',
    a: 'Это надёжная база, но не гарантия. Коэффициент не учитывает насыщенность шрифта, сглаживание, окружающие цвета и потребности людей со слабым зрением или дальтонизмом, поэтому всегда проверяйте живое превью и тестируйте на реальном контенте.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="contrast-checker" :faq="faq">
    <!-- Color inputs -->
    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Foreground -->
      <div>
        <label class="label" for="cc-fg">{{ ui.foreground }}</label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="fgHex"
            class="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-950"
            :aria-label="ui.foreground"
            @input="onFgPicker"
          >
          <input
            id="cc-fg"
            v-model="fgInput"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="#111827"
            aria-label="Foreground HEX"
          >
          <CopyButton :text="() => fgHex" small />
        </div>
        <p v-if="!fgValid" class="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{{ ui.invalidHex }}</p>
      </div>

      <!-- Background -->
      <div>
        <label class="label" for="cc-bg">{{ ui.background }}</label>
        <div class="flex items-center gap-2">
          <input
            type="color"
            :value="bgHex"
            class="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-950"
            :aria-label="ui.background"
            @input="onBgPicker"
          >
          <input
            id="cc-bg"
            v-model="bgInput"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="#ffffff"
            aria-label="Background HEX"
          >
          <CopyButton :text="() => bgHex" small />
        </div>
        <p v-if="!bgValid" class="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{{ ui.invalidHex }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-4 flex items-center gap-2">
      <button type="button" class="btn-ghost" @click="swap">{{ t('common.swap') }}</button>
      <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
    </div>

    <!-- Ratio + verdicts -->
    <div class="mt-5">
      <template v-if="bothValid">
        <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
          <span class="text-sm text-ink-500 dark:text-ink-400">{{ ui.ratio }}</span>
          <span class="font-mono text-4xl font-bold tabular-nums text-ink-900 dark:text-ink-100">{{ ratioLabel }}</span>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="c in checks"
            :key="c.level + c.size"
            class="rounded-lg border p-3"
            :class="c.pass
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-red-500/30 bg-red-500/10'"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ c.level }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-bold"
                :class="c.pass
                  ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                  : 'bg-red-500/20 text-red-700 dark:text-red-400'"
              >{{ c.pass ? ui.pass : ui.fail }}</span>
            </div>
            <p class="mt-1 text-sm text-ink-600 dark:text-ink-300">
              {{ c.size === 'large' ? ui.large : ui.normal }}
            </p>
            <p class="mt-0.5 font-mono text-xs text-ink-400">{{ ui.min }} {{ c.threshold }}:1</p>
          </div>
        </div>
      </template>
      <p v-else class="text-sm font-medium text-red-600 dark:text-red-400">{{ ui.invalidPair }}</p>
    </div>

    <!-- Live preview -->
    <div class="mt-6">
      <span class="label">{{ ui.preview }}</span>
      <div
        class="rounded-lg border border-ink-200 p-6 dark:border-ink-700"
        :style="{ backgroundColor: bgHex, color: fgHex }"
        role="img"
        :aria-label="ui.preview"
      >
        <p class="text-2xl font-bold">{{ ui.previewLarge }}</p>
        <p class="mt-2 text-base">{{ ui.previewText }}</p>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Проверка контраста цветов по WCAG онлайн</h2>
        <p>
          Этот бесплатный <strong>инструмент проверки контраста</strong> вычисляет
          коэффициент контраста между цветом текста и фоном и сразу показывает,
          проходят ли они нормы доступности <strong>WCAG AA и AAA</strong> для
          обычного и крупного текста. Выберите цвета в палитре или введите
          HEX-значения вручную — коэффициент, бейджи PASS/FAIL и живое превью
          обновляются мгновенно. Инструмент сделан для разработчиков и дизайнеров,
          которым нужно быстро убедиться, что текст читается всеми пользователями.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Цвета не
          отправляются на сервер, поэтому инструмент безопасен для фирменных палитр и
          закрытых макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Задайте цвет <code>текста</code> и цвет <code>фона</code> через палитру или поле HEX (<code>#111827</code>, <code>#fff</code>).</li>
          <li>Смотрите коэффициент контраста (например <code>4.54:1</code>) и бейджи <code>PASS</code>/<code>FAIL</code> для AA и AAA.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы переставить текст и фон, или <code>Сбросить</code> для значений по умолчанию.</li>
          <li>Проверьте читаемость в живом превью на обычном и крупном тексте.</li>
        </ul>

        <h2>Что означает коэффициент контраста</h2>
        <p>
          Контраст считается через относительную яркость каждого цвета в
          пространстве sRGB и лежит в диапазоне от <code>1:1</code> (одинаковые цвета)
          до <code>21:1</code> (чёрный на белом). Порог <strong>AA</strong> — это
          <code>4.5:1</code> для обычного текста и <code>3:1</code> для крупного;
          более строгий <strong>AAA</strong> требует <code>7:1</code> и
          <code>4.5:1</code> соответственно. Некорректный HEX подсвечивается красным,
          а превью при этом остаётся читаемым.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Подбираете цвета? Переведите значения в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>,
          постройте оттенки в <NuxtLink :to="localePath('/color-palette-generator')">генераторе палитры</NuxtLink>
          или соберите фон в <NuxtLink :to="localePath('/css-gradient-generator')">генераторе CSS-градиентов</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>WCAG color contrast checker online</h2>
        <p>
          This free <strong>color contrast checker</strong> computes the contrast
          ratio between your text and background colors and instantly tells you
          whether they pass the <strong>WCAG AA and AAA</strong> accessibility
          thresholds for normal and large text. Pick colors with the swatch or type
          HEX values by hand — the ratio, the PASS/FAIL badges and the live preview
          all update instantly. It is built for developers and designers who need to
          confirm, fast, that text is readable for everyone.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. Your
          colors are never sent to a server, so it is safe to test brand palettes and
          unreleased designs.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Set the <code>text</code> and <code>background</code> colors via the picker or the HEX field (<code>#111827</code>, <code>#fff</code>).</li>
          <li>Read the contrast ratio (for example <code>4.54:1</code>) and the <code>PASS</code>/<code>FAIL</code> badges for AA and AAA.</li>
          <li>Click <code>Swap</code> to flip text and background, or <code>Reset</code> to return to the defaults.</li>
          <li>Sanity-check readability in the live preview for both normal and large text.</li>
        </ul>

        <h2>What the contrast ratio means</h2>
        <p>
          Contrast is derived from the relative luminance of each color in sRGB space
          and ranges from <code>1:1</code> (identical colors) to <code>21:1</code>
          (black on white). The <strong>AA</strong> threshold is <code>4.5:1</code>
          for normal text and <code>3:1</code> for large text; the stricter
          <strong>AAA</strong> level requires <code>7:1</code> and <code>4.5:1</code>
          respectively. An invalid HEX value is flagged in red while the preview stays
          readable.
        </p>

        <h2>Related tools</h2>
        <p>
          Choosing colors? Convert values in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>,
          build shades in the <NuxtLink :to="localePath('/color-palette-generator')">color palette generator</NuxtLink>,
          or compose a background in the <NuxtLink :to="localePath('/css-gradient-generator')">CSS gradient generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
