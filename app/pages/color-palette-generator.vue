<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Deterministic, pure color math (no randomness, no time, no client APIs in
// the reactive path) -> the same output renders on the Node prerender and on
// the client, so NO <ClientOnly> wrapper is needed. The base ref is seeded with
// the fixed default so server and client agree on first paint.
const DEFAULT_HEX = '#5b8cff'
const base = ref(DEFAULT_HEX)

// Tool-specific labels (common verbs like Copy / Copy all come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        baseColor: 'Базовый цвет',
        baseColorAria: 'Выбор базового цвета',
        hexAria: 'HEX базового цвета',
        invalidHex: '✗ Введите корректный HEX (например #5b8cff)',
        validHex: '✓ Корректный HEX',
        reset: 'Сбросить',
        shadesTitle: 'Оттенки и тинты',
        shadesHint: 'От светлого к тёмному изменением яркости',
        complementary: 'Комплементарная',
        analogous: 'Аналоговая',
        triadic: 'Триадная',
        tetradic: 'Тетрадная',
        copyCss: 'CSS-переменные',
        copyJson: 'JSON',
      }
    : {
        baseColor: 'Base color',
        baseColorAria: 'Base color picker',
        hexAria: 'Base color HEX',
        invalidHex: '✗ Enter a valid HEX (e.g. #5b8cff)',
        validHex: '✓ Valid HEX',
        reset: 'Reset',
        shadesTitle: 'Shades & tints',
        shadesHint: 'Light to dark by varying lightness',
        complementary: 'Complementary',
        analogous: 'Analogous',
        triadic: 'Triadic',
        tetradic: 'Tetradic',
        copyCss: 'CSS variables',
        copyJson: 'JSON',
      },
)

/* ---------------------------------------------------------------------------
 * Pure color helpers — all run safely in the Node prerender environment.
 * ------------------------------------------------------------------------- */

const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

/** Normalise "#abc", "abc", "#aabbcc" -> a 6-digit "#aabbcc", or null. */
function normalizeHex(value: string): string | null {
  const m = HEX_RE.exec(value.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return '#' + h.toLowerCase()
}

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB {
  const h = hex.slice(1)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0')
  return '#' + to(r) + to(g) + to(b)
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x }
  else if (hp < 2) { r1 = x; g1 = c }
  else if (hp < 3) { g1 = c; b1 = x }
  else if (hp < 4) { g1 = x; b1 = c }
  else if (hp < 5) { r1 = x; b1 = c }
  else { r1 = c; b1 = x }
  const m = ln - c / 2
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 }
}

function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

function rotate(hsl: HSL, deg: number): HSL {
  return { h: (((hsl.h + deg) % 360) + 360) % 360, s: hsl.s, l: hsl.l }
}

/* ---------------------------------------------------------------------------
 * Derived palettes (pure computeds).
 * ------------------------------------------------------------------------- */

const normalized = computed(() => normalizeHex(base.value))
const isValid = computed(() => normalized.value !== null)
const baseHsl = computed<HSL | null>(() =>
  normalized.value ? rgbToHsl(hexToRgb(normalized.value)) : null,
)

interface Swatch { hex: string; label: string }

// 9 lightness steps from near-white (95%) to near-black (8%), keeping hue/sat.
const SHADE_STEPS = [95, 85, 72, 58, 45, 35, 26, 17, 8]

const shades = computed<Swatch[]>(() => {
  const hsl = baseHsl.value
  if (!hsl) return []
  return SHADE_STEPS.map((l) => {
    const hex = hslToHex({ h: hsl.h, s: hsl.s, l })
    return { hex, label: `${l}%` }
  })
})

function scheme(rotations: { deg: number; key: string }[]): Swatch[] {
  const hsl = baseHsl.value
  if (!hsl) return []
  return rotations.map(({ deg, key }) => ({
    hex: deg === 0 ? (normalized.value as string) : hslToHex(rotate(hsl, deg)),
    label: key,
  }))
}

const complementary = computed(() =>
  scheme([
    { deg: 0, key: '0°' },
    { deg: 180, key: '+180°' },
  ]),
)
const analogous = computed(() =>
  scheme([
    { deg: -30, key: '-30°' },
    { deg: 0, key: '0°' },
    { deg: 30, key: '+30°' },
  ]),
)
const triadic = computed(() =>
  scheme([
    { deg: 0, key: '0°' },
    { deg: 120, key: '+120°' },
    { deg: 240, key: '+240°' },
  ]),
)
const tetradic = computed(() =>
  scheme([
    { deg: 0, key: '0°' },
    { deg: 90, key: '+90°' },
    { deg: 180, key: '+180°' },
    { deg: 270, key: '+270°' },
  ]),
)

// "Copy all" payloads: CSS custom properties and JSON, built from the hex list.
function toCss(prefix: string, list: Swatch[]): string {
  return (
    ':root {\n' +
    list.map((s, i) => `  --${prefix}-${i + 1}: ${s.hex};`).join('\n') +
    '\n}'
  )
}

function toJson(list: Swatch[]): string {
  return JSON.stringify(list.map((s) => s.hex), null, 2)
}

// Keep the native <input type="color"> and the HEX text field in sync.
// The color picker always emits a valid 6-digit hex, so feed it straight in.
function onPicker(e: Event) {
  base.value = (e.target as HTMLInputElement).value
}

// For the <input type="color"> value we must always pass a valid 6-digit hex,
// even while the user is mid-typing an invalid HEX in the text field.
const pickerValue = computed(() => normalized.value ?? DEFAULT_HEX)

function reset() {
  base.value = DEFAULT_HEX
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my color data sent to a server?',
    a: 'No. The entire palette is computed in your browser with plain HSL math in JavaScript. Nothing about your base color or the generated swatches is uploaded, logged or stored, so it is safe to use on private brand or product work.',
  },
  {
    q: 'How are the shades and tints generated?',
    a: 'The base color is converted to HSL, then its lightness is stepped from about 95% (a near-white tint) down to about 8% (a near-black shade) while the hue and saturation stay fixed. That keeps the whole row visually on-brand and gives you a ready-made tonal scale.',
  },
  {
    q: 'What do complementary, analogous, triadic and tetradic mean?',
    a: 'They are harmony schemes built by rotating the hue on the color wheel. Complementary adds +180°, analogous uses ±30°, triadic uses ±120°, and tetradic uses +90/180/270°. The saturation and lightness are preserved, so the colors feel like a coherent set.',
  },
  {
    q: 'Are the HEX values always valid 6-digit colors?',
    a: 'Yes. Every swatch is rounded to integer RGB and emitted as a lowercase 6-digit #rrggbb value, so you can paste it straight into CSS, design tools or a config file without cleanup.',
  },
  {
    q: 'How do I reuse a whole group at once?',
    a: 'Each group has a Copy CSS variables button that produces a :root block of --name-1, --name-2 custom properties, and a Copy JSON button that gives you an array of HEX strings. Individual swatches also have their own copy button.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли данные о цвете на сервер?',
    a: 'Нет. Вся палитра вычисляется в браузере обычной математикой HSL на JavaScript. Ни базовый цвет, ни сгенерированные образцы не загружаются, не логируются и не сохраняются, поэтому инструмент безопасен для приватной работы над брендом или продуктом.',
  },
  {
    q: 'Как генерируются оттенки и тинты?',
    a: 'Базовый цвет переводится в HSL, после чего его яркость меняется примерно от 95% (почти белый тинт) до 8% (почти чёрный оттенок), а тон (hue) и насыщенность остаются неизменными. Это удерживает весь ряд в рамках бренда и даёт готовую тональную шкалу.',
  },
  {
    q: 'Что значат комплементарная, аналоговая, триадная и тетрадная схемы?',
    a: 'Это схемы гармонии, построенные поворотом тона по цветовому кругу. Комплементарная добавляет +180°, аналоговая использует ±30°, триадная — ±120°, а тетрадная — +90/180/270°. Насыщенность и яркость сохраняются, поэтому цвета воспринимаются как единый набор.',
  },
  {
    q: 'Всегда ли HEX-значения являются корректными 6-значными цветами?',
    a: 'Да. Каждый образец округляется до целых значений RGB и выводится как 6-значный #rrggbb в нижнем регистре, поэтому его можно сразу вставить в CSS, дизайн-инструменты или конфиг без правок.',
  },
  {
    q: 'Как переиспользовать целую группу сразу?',
    a: 'У каждой группы есть кнопка «CSS-переменные», создающая блок :root с custom properties --name-1, --name-2, и кнопка «JSON», дающая массив строк HEX. У отдельных образцов также есть собственная кнопка копирования.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="color-palette-generator" :faq="faq">
    <!-- Base color picker + HEX field (kept in sync) -->
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-300">
        {{ ui.baseColor }}
        <input
          type="color"
          :value="pickerValue"
          class="h-9 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white p-0.5 dark:border-ink-700 dark:bg-ink-950"
          :aria-label="ui.baseColorAria"
          @input="onPicker"
        />
      </label>

      <input
        v-model="base"
        type="text"
        class="field !w-40"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        placeholder="#5b8cff"
        :aria-label="ui.hexAria"
      />

      <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <span
        v-if="isValid"
        class="font-medium text-green-600 dark:text-green-400"
      >{{ ui.validHex }}</span>
      <span v-else class="font-medium text-red-600 dark:text-red-400">{{ ui.invalidHex }}</span>
    </div>

    <div v-if="isValid" class="mt-5 space-y-7">
      <!-- Shades & tints -->
      <section>
        <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ ui.shadesTitle }}</h3>
          <span class="text-xs text-ink-400">{{ ui.shadesHint }}</span>
          <div class="ml-auto flex items-center gap-2">
            <CopyButton :text="() => toCss('shade', shades)" :label="ui.copyCss" small />
            <CopyButton :text="() => toJson(shades)" :label="ui.copyJson" small />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
          <div
            v-for="(s, i) in shades"
            :key="i"
            class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700"
          >
            <div class="h-14 w-full" :style="{ backgroundColor: s.hex }" />
            <div class="flex items-center justify-between gap-1 bg-white px-2 py-1.5 dark:bg-ink-950">
              <code class="select-all font-mono text-xs text-ink-700 dark:text-ink-200">{{ s.hex }}</code>
              <CopyButton :text="() => s.hex" small />
            </div>
          </div>
        </div>
      </section>

      <!-- Harmony schemes -->
      <section
        v-for="group in [
          { title: ui.complementary, items: complementary, prefix: 'complementary' },
          { title: ui.analogous, items: analogous, prefix: 'analogous' },
          { title: ui.triadic, items: triadic, prefix: 'triadic' },
          { title: ui.tetradic, items: tetradic, prefix: 'tetradic' },
        ]"
        :key="group.prefix"
      >
        <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 class="text-sm font-semibold text-ink-800 dark:text-ink-100">{{ group.title }}</h3>
          <div class="ml-auto flex items-center gap-2">
            <CopyButton :text="() => toCss(group.prefix, group.items)" :label="ui.copyCss" small />
            <CopyButton :text="() => toJson(group.items)" :label="ui.copyJson" small />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div
            v-for="(s, i) in group.items"
            :key="i"
            class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700"
          >
            <div class="h-16 w-full" :style="{ backgroundColor: s.hex }" />
            <div class="flex items-center justify-between gap-1 bg-white px-2 py-1.5 dark:bg-ink-950">
              <code class="select-all font-mono text-xs text-ink-700 dark:text-ink-200">{{ s.hex }}</code>
              <CopyButton :text="() => s.hex" small />
            </div>
            <div class="bg-white px-2 pb-1.5 text-center text-[0.65rem] text-ink-400 dark:bg-ink-950">{{ s.label }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор палитры цветов онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор палитры цветов</strong> строит от
          одного базового цвета целую систему: ряд <strong>оттенков и тинтов</strong>
          и набор <strong>гармоничных схем</strong> — комплементарную, аналоговую,
          триадную и тетрадную. Каждый образец показан вместе со своим HEX и
          кнопкой копирования, а группу целиком можно забрать как CSS-переменные
          или массив JSON.
        </p>
        <p>
          Вся математика выполняется <strong>полностью в браузере</strong> на
          основе модели HSL. Ваш цвет никуда не отправляется, поэтому инструмент
          безопасен для приватной работы над брендом, дизайн-системой или
          продуктом.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите цвет в палитре <code>type="color"</code> или впишите HEX в поле — они синхронизированы.</li>
          <li>Поддерживаются короткая и полная записи: <code>#abc</code> и <code>#aabbcc</code>.</li>
          <li>Смотрите ряд оттенков и тинтов: от почти белого до почти чёрного при неизменном тоне.</li>
          <li>Используйте схемы гармонии, чтобы подобрать акцентные и дополняющие цвета.</li>
          <li>Копируйте отдельный HEX или всю группу как <code>CSS-переменные</code> либо <code>JSON</code>.</li>
        </ul>

        <h2>Как устроена математика цвета</h2>
        <p>
          Базовый HEX переводится в <strong>HSL</strong> (тон, насыщенность,
          яркость). Оттенки и тинты получаются изменением только яркости, поэтому
          ряд остаётся в рамках одного цвета. Схемы гармонии — это повороты тона
          по цветовому кругу: <code>+180°</code> для комплементарной,
          <code>±30°</code> для аналоговой, <code>±120°</code> для триадной и
          <code>+90/180/270°</code> для тетрадной. Например, у тона около
          <code>222°</code> комплементарный получается около <code>42°</code>.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно перевести один цвет между форматами? Откройте
          <NuxtLink :to="localePath('/color-converter')">конвертер цветов</NuxtLink>.
          Для работы с HEX как с числами пригодится
          <NuxtLink :to="localePath('/number-base-converter')">конвертер систем счисления</NuxtLink>,
          а оформить экспортированные значения поможет
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Color palette generator online</h2>
        <p>
          This free <strong>color palette generator</strong> builds a whole system
          from a single base color: a row of <strong>shades and tints</strong> plus
          a set of <strong>harmony schemes</strong> — complementary, analogous,
          triadic and tetradic. Each swatch is shown with its HEX value and a copy
          button, and you can grab a whole group as CSS custom properties or a JSON
          array.
        </p>
        <p>
          All the math runs <strong>entirely in your browser</strong> using the HSL
          color model. Your color is never sent anywhere, so it is safe for private
          brand, design-system or product work.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick a color in the <code>type="color"</code> swatch or type a HEX into the field — they stay in sync.</li>
          <li>Both short and full notations work: <code>#abc</code> and <code>#aabbcc</code>.</li>
          <li>Read the shades-and-tints row, from near-white to near-black at a fixed hue.</li>
          <li>Use the harmony schemes to find accent and supporting colors.</li>
          <li>Copy a single HEX, or a whole group as <code>CSS variables</code> or <code>JSON</code>.</li>
        </ul>

        <h2>How the color math works</h2>
        <p>
          The base HEX is converted to <strong>HSL</strong> (hue, saturation,
          lightness). Shades and tints come from varying only the lightness, so the
          row stays on a single hue. Harmony schemes are hue rotations around the
          color wheel: <code>+180°</code> for complementary, <code>±30°</code> for
          analogous, <code>±120°</code> for triadic and <code>+90/180/270°</code>
          for tetradic. For example, a hue near <code>222°</code> gives a
          complementary hue near <code>42°</code>.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to convert a single color between formats? Open the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>.
          To treat a HEX as a number, try the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>,
          or tidy up the exported values with the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
