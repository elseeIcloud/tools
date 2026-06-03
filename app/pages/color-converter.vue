<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Fixed default color so SSR output matches client hydration (no randomness/time).
const DEFAULT_HEX = '#5b8cff'

interface Rgb {
  r: number
  g: number
  b: number
}
interface Hsl {
  h: number
  s: number
  l: number
}

// Source-of-truth RGB (0-255). The picker and all three fields derive from it.
const rgb = ref<Rgb>(hexToRgb(DEFAULT_HEX)!)

// Editable text for each field; re-synced from `rgb` whenever it changes.
const hexInput = ref('')
const rgbInput = ref('')
const hslInput = ref('')

// Per-field validity for the red status line. `null` = currently valid.
const hexError = ref<string | null>(null)
const rgbError = ref<string | null>(null)
const hslError = ref<string | null>(null)

// --- Conversions (pure, SSG-safe) -------------------------------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return '#' + to(r) + to(g) + to(b)
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
        break
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = ln - c / 2
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

// --- Parsers for the editable text fields -----------------------------------

function parseRgb(text: string): Rgb | null {
  const m = /^\s*(?:rgb)?\s*\(?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?\s*$/i.exec(text)
  if (!m) return null
  const r = Number(m[1])
  const g = Number(m[2])
  const b = Number(m[3])
  if (r > 255 || g > 255 || b > 255) return null
  return { r, g, b }
}

function parseHsl(text: string): Hsl | null {
  const m =
    /^\s*(?:hsl)?\s*\(?\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*%?\s*[,\s]\s*(\d{1,3})\s*%?\s*\)?\s*$/i.exec(text)
  if (!m) return null
  const h = Number(m[1])
  const s = Number(m[2])
  const l = Number(m[3])
  if (h > 360 || s > 100 || l > 100) return null
  return { h, s, l }
}

// --- Derived strings (always reflect the canonical `rgb`) --------------------

const hex = computed(() => rgbToHex(rgb.value))
const hsl = computed(() => rgbToHsl(rgb.value))
const rgbString = computed(() => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`)
const hslString = computed(() => `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`)

// Keep the editable fields in sync with the canonical color, clearing errors.
function syncFields() {
  hexInput.value = hex.value
  rgbInput.value = rgbString.value
  hslInput.value = hslString.value
  hexError.value = null
  rgbError.value = null
  hslError.value = null
}
syncFields()

// --- Field handlers: parse on input, update `rgb` on success -----------------

function onHexInput() {
  const parsed = hexToRgb(hexInput.value)
  if (!parsed) {
    hexError.value = ui.value.invalidHex
    return
  }
  hexError.value = null
  rgb.value = parsed
  rgbInput.value = rgbString.value
  hslInput.value = hslString.value
  rgbError.value = null
  hslError.value = null
}

function onRgbInput() {
  const parsed = parseRgb(rgbInput.value)
  if (!parsed) {
    rgbError.value = ui.value.invalidRgb
    return
  }
  rgbError.value = null
  rgb.value = parsed
  hexInput.value = hex.value
  hslInput.value = hslString.value
  hexError.value = null
  hslError.value = null
}

function onHslInput() {
  const parsed = parseHsl(hslInput.value)
  if (!parsed) {
    hslError.value = ui.value.invalidHsl
    return
  }
  hslError.value = null
  rgb.value = hslToRgb(parsed)
  hexInput.value = hex.value
  rgbInput.value = rgbString.value
  hexError.value = null
  rgbError.value = null
}

function onPicker(e: Event) {
  const value = (e.target as HTMLInputElement).value
  const parsed = hexToRgb(value)
  if (parsed) {
    rgb.value = parsed
    syncFields()
  }
}

function loadSample() {
  rgb.value = hexToRgb('#ff8800')!
  syncFields()
}

function reset() {
  rgb.value = hexToRgb(DEFAULT_HEX)!
  syncFields()
}

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        picker: 'Палитра',
        preview: 'Превью',
        invalidHex: 'Некорректный HEX (используйте #RGB или #RRGGBB)',
        invalidRgb: 'Некорректный RGB (значения 0–255)',
        invalidHsl: 'Некорректный HSL (H 0–360, S и L 0–100%)',
        reset: 'Сбросить',
      }
    : {
        picker: 'Picker',
        preview: 'Preview',
        invalidHex: 'Invalid HEX (use #RGB or #RRGGBB)',
        invalidRgb: 'Invalid RGB (values 0–255)',
        invalidHsl: 'Invalid HSL (H 0–360, S and L 0–100%)',
        reset: 'Reset',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my color data sent to a server?',
    a: 'No. Every conversion between HEX, RGB and HSL happens entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so you can use the tool freely for brand palettes or unreleased designs.',
  },
  {
    q: 'Do you support 3-digit shorthand hex like #f80?',
    a: 'Yes. Both 3-digit (#f80) and 6-digit (#ff8800) hex are accepted, with or without the leading #. A 3-digit value is expanded by doubling each character, so #f80 becomes #ff8800 before conversion.',
  },
  {
    q: 'How are RGB and HSL related?',
    a: 'RGB describes a color by the intensity of its red, green and blue channels (0–255 each). HSL describes the same color as Hue (0–360°), Saturation and Lightness (0–100%). HSL is often easier for humans because adjusting lightness or saturation keeps the same hue.',
  },
  {
    q: 'Why do HSL values sometimes not round-trip exactly?',
    a: 'HSL components are rounded to whole numbers for readability, and the RGB→HSL→RGB path involves floating-point math. For most colors the round-trip is exact, but a heavily rounded HSL can land on an adjacent RGB value. Use the HEX or RGB field when you need a precise, lossless value.',
  },
  {
    q: 'What happens when I type an invalid value?',
    a: 'The field shows a red message explaining the expected format and the other fields keep their last valid value — nothing throws or resets. Fix the input and the conversion resumes instantly.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли данные о цвете на сервер?',
    a: 'Нет. Все преобразования между HEX, RGB и HSL выполняются полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для фирменных палитр и неопубликованных макетов.',
  },
  {
    q: 'Поддерживается ли короткий 3-значный HEX вроде #f80?',
    a: 'Да. Принимаются и 3-значный (#f80), и 6-значный (#ff8800) HEX, с символом # или без него. 3-значное значение раскрывается удвоением каждого символа, поэтому #f80 превращается в #ff8800 перед конвертацией.',
  },
  {
    q: 'Как связаны RGB и HSL?',
    a: 'RGB описывает цвет интенсивностью красного, зелёного и синего каналов (0–255 каждый). HSL описывает тот же цвет через тон (Hue, 0–360°), насыщенность (Saturation) и светлоту (Lightness, 0–100%). HSL часто удобнее человеку: меняя светлоту или насыщенность, вы сохраняете прежний тон.',
  },
  {
    q: 'Почему HSL иногда не возвращается обратно точь-в-точь?',
    a: 'Компоненты HSL округляются до целых для читаемости, а путь RGB→HSL→RGB использует вычисления с плавающей точкой. Для большинства цветов обратное преобразование точное, но сильно округлённый HSL может попасть в соседнее значение RGB. Когда нужно точное значение без потерь, используйте поле HEX или RGB.',
  },
  {
    q: 'Что произойдёт, если ввести некорректное значение?',
    a: 'Поле покажет красное сообщение с ожидаемым форматом, а остальные поля сохранят последнее корректное значение — ничего не падает и не сбрасывается. Исправьте ввод, и конвертация продолжится мгновенно.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="color-converter" :faq="faq">
    <!-- Picker + preview -->
    <div class="flex flex-wrap items-center gap-4">
      <label class="flex items-center gap-3 text-sm font-medium text-ink-600 dark:text-ink-300">
        {{ ui.picker }}
        <input
          type="color"
          :value="hex"
          class="h-11 w-16 cursor-pointer rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-950"
          :aria-label="ui.picker"
          @input="onPicker"
        >
      </label>

      <div class="flex items-center gap-3">
        <span
          class="h-11 w-11 rounded-lg border border-ink-200 shadow-inner dark:border-ink-700"
          :style="{ backgroundColor: hex }"
          :aria-label="ui.preview"
          role="img"
        />
        <span class="text-sm text-ink-500 dark:text-ink-400">{{ ui.preview }}</span>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
      </div>
    </div>

    <!-- HEX / RGB / HSL fields, kept in sync -->
    <div class="mt-5 grid gap-4 sm:grid-cols-3">
      <!-- HEX -->
      <div>
        <label class="label" for="cc-hex">HEX</label>
        <div class="flex items-center gap-2">
          <input
            id="cc-hex"
            v-model="hexInput"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="#ff8800"
            aria-label="HEX"
            @input="onHexInput"
          >
          <CopyButton :text="() => hex" small />
        </div>
        <p v-if="hexError" class="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{{ hexError }}</p>
      </div>

      <!-- RGB -->
      <div>
        <label class="label" for="cc-rgb">RGB</label>
        <div class="flex items-center gap-2">
          <input
            id="cc-rgb"
            v-model="rgbInput"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="rgb(255, 136, 0)"
            aria-label="RGB"
            @input="onRgbInput"
          >
          <CopyButton :text="() => rgbString" small />
        </div>
        <p v-if="rgbError" class="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{{ rgbError }}</p>
      </div>

      <!-- HSL -->
      <div>
        <label class="label" for="cc-hsl">HSL</label>
        <div class="flex items-center gap-2">
          <input
            id="cc-hsl"
            v-model="hslInput"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="hsl(32, 100%, 50%)"
            aria-label="HSL"
            @input="onHslInput"
          >
          <CopyButton :text="() => hslString" small />
        </div>
        <p v-if="hslError" class="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{{ hslError }}</p>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер цветов HEX, RGB и HSL онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер цветов</strong> переводит один и тот же
          цвет между форматами <strong>HEX</strong>, <strong>RGB</strong> и
          <strong>HSL</strong> и сразу показывает результат в превью. Выберите цвет
          в нативной палитре или отредактируйте любое из трёх полей — остальные
          обновятся автоматически. Инструмент сделан для разработчиков и
          дизайнеров, которым нужно быстро получить значение в нужной нотации для
          CSS, Tailwind или дизайн-токенов.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Данные о
          цвете не отправляются на сервер, поэтому инструмент безопасен для
          фирменных палитр и закрытых макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите цвет в палитре или введите значение в поле <code>HEX</code> (например <code>#ff8800</code> или <code>#f80</code>).</li>
          <li>Отредактируйте <code>RGB</code> или <code>HSL</code> — связанные поля и превью обновятся мгновенно.</li>
          <li>Нажмите <code>Копировать</code> рядом с нужным форматом, чтобы вставить значение в код.</li>
          <li>Используйте <code>Пример</code> для быстрого старта или <code>Сбросить</code>, чтобы вернуться к значению по умолчанию.</li>
        </ul>

        <h2>Чем отличаются HEX, RGB и HSL</h2>
        <p>
          <strong>HEX</strong> — это компактная шестнадцатеричная запись каналов
          красного, зелёного и синего (<code>#RRGGBB</code>); короткая форма
          <code>#RGB</code> раскрывается удвоением символов. <strong>RGB</strong>
          задаёт те же каналы числами от 0 до 255. <strong>HSL</strong> описывает
          цвет через тон, насыщенность и светлоту — это удобнее, когда нужно
          сделать цвет светлее, темнее или менее насыщенным, сохранив тон.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужны другие преобразования? Переведите числа в
          <NuxtLink :to="localePath('/number-base-converter')">конвертере систем счисления</NuxtLink>,
          приведите в порядок данные в <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>
          или посчитайте хеш в <NuxtLink :to="localePath('/hash-generator')">генераторе хешей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>HEX, RGB and HSL color converter online</h2>
        <p>
          This free <strong>color converter</strong> translates the same color
          between <strong>HEX</strong>, <strong>RGB</strong> and
          <strong>HSL</strong> and shows the result in a live preview. Pick a color
          in the native picker or edit any of the three fields — the others update
          automatically. It is built for developers and designers who need a value
          in the right notation for CSS, Tailwind or design tokens, fast.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. Your
          color data is never sent to a server, so it is safe to use with brand
          palettes and unreleased designs.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick a color in the picker or type a value into the <code>HEX</code> field (for example <code>#ff8800</code> or <code>#f80</code>).</li>
          <li>Edit <code>RGB</code> or <code>HSL</code> — the linked fields and the preview update instantly.</li>
          <li>Click <code>Copy</code> next to the format you need to paste it into your code.</li>
          <li>Use <code>Sample</code> for a quick start, or <code>Reset</code> to return to the default color.</li>
        </ul>

        <h2>HEX vs. RGB vs. HSL</h2>
        <p>
          <strong>HEX</strong> is a compact hexadecimal notation of the red, green
          and blue channels (<code>#RRGGBB</code>); the shorthand <code>#RGB</code>
          form is expanded by doubling each character. <strong>RGB</strong> states
          the same channels as numbers from 0 to 255. <strong>HSL</strong>
          describes a color by Hue, Saturation and Lightness, which is handier when
          you want to make a color lighter, darker or less saturated while keeping
          the same hue.
        </p>

        <h2>Related tools</h2>
        <p>
          Need other conversions? Convert numbers in the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>,
          tidy up data in the <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>,
          or compute a digest with the <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
