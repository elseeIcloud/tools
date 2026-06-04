<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

interface ShadowLayer {
  /** Horizontal offset in px (can be negative). */
  offsetX: number
  /** Vertical offset in px (can be negative). */
  offsetY: number
  /** Blur radius in px, clamped to >= 0. */
  blur: number
  /** Spread radius in px (can be negative). */
  spread: number
  /** Any valid CSS color string, e.g. "rgba(0,0,0,0.15)" or "#1f2937". */
  color: string
  /** Whether the shadow is drawn inside the box. */
  inset: boolean
}

type PreviewBg = 'light' | 'dark'

// Fixed defaults so SSR output matches client hydration (no randomness/time).
function defaultLayers(): ShadowLayer[] {
  return [{ offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: 'rgba(0, 0, 0, 0.15)', inset: false }]
}

const layers = ref<ShadowLayer[]>(defaultLayers())
const previewBg = ref<PreviewBg>('light')

// --- Pure builders (SSG-safe: just string/number math) -----------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function intOr(value: number, fallback = 0): number {
  const n = Math.round(Number(value))
  return Number.isFinite(n) ? n : fallback
}

// One layer -> "[inset ]offsetX offsetY blur spread color".
function layerToString(l: ShadowLayer): string {
  const x = intOr(l.offsetX)
  const y = intOr(l.offsetY)
  const blur = Math.max(0, intOr(l.blur))
  const spread = intOr(l.spread)
  const prefix = l.inset ? 'inset ' : ''
  return `${prefix}${x}px ${y}px ${blur}px ${spread}px ${l.color}`
}

// All layers joined as a single comma-separated box-shadow value.
const shadowValue = computed(() => layers.value.map(layerToString).join(', '))

// The full copyable CSS declaration.
const shadowCss = computed(() => `box-shadow: ${shadowValue.value};`)

// --- Color helpers ------------------------------------------------------------

// <input type="color"> only accepts #rrggbb, so derive a stable hex from the
// stored color string (ignoring any alpha) for the swatch's value.
function toHexInput(color: string): string {
  const c = color.trim()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(c)
  if (long) return `#${long[1]}`.toLowerCase()
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(c)
  if (rgb) {
    const hex = (n: string) => clamp(Number(n), 0, 255).toString(16).padStart(2, '0')
    return `#${hex(rgb[1]!)}${hex(rgb[2]!)}${hex(rgb[3]!)}`
  }
  return '#000000'
}

// --- Layer handlers -----------------------------------------------------------

function patchLayer(i: number, patch: Partial<ShadowLayer>) {
  layers.value = layers.value.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
}

function setNumber(i: number, key: 'offsetX' | 'offsetY' | 'blur' | 'spread', value: number) {
  const n = intOr(value)
  patchLayer(i, { [key]: key === 'blur' ? Math.max(0, n) : n } as Partial<ShadowLayer>)
}

function setColor(i: number, value: string) {
  patchLayer(i, { color: value })
}

function setInset(i: number, value: boolean) {
  patchLayer(i, { inset: value })
}

function addLayer() {
  layers.value = [
    ...layers.value,
    { offsetX: 0, offsetY: 8, blur: 24, spread: -4, color: 'rgba(0, 0, 0, 0.2)', inset: false },
  ]
}

function removeLayer(i: number) {
  if (layers.value.length <= 1) return // keep at least one layer
  layers.value = layers.value.filter((_, idx) => idx !== i)
}

function reset() {
  layers.value = defaultLayers()
  previewBg.value = 'light'
}

function loadSample() {
  previewBg.value = 'light'
  layers.value = [
    { offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: false },
    { offsetX: 0, offsetY: 10, blur: 30, spread: -5, color: 'rgba(0, 0, 0, 0.25)', inset: false },
  ]
}

// Tool-specific labels (common verbs like Copy/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        preview: 'Превью',
        light: 'Светлый',
        dark: 'Тёмный',
        layers: 'Слои тени',
        layer: 'Слой',
        offsetX: 'Смещение X',
        offsetY: 'Смещение Y',
        blur: 'Размытие',
        spread: 'Разброс',
        color: 'Цвет',
        inset: 'Внутренняя (inset)',
        addLayer: 'Добавить слой',
        removeLayer: 'Удалить слой',
        reset: 'Сбросить',
        css: 'CSS-свойство box-shadow',
        minLayers: 'Нужен минимум один слой',
      }
    : {
        preview: 'Preview',
        light: 'Light',
        dark: 'Dark',
        layers: 'Shadow layers',
        layer: 'Layer',
        offsetX: 'Offset X',
        offsetY: 'Offset Y',
        blur: 'Blur',
        spread: 'Spread',
        color: 'Color',
        inset: 'Inset',
        addLayer: 'Add layer',
        removeLayer: 'Remove layer',
        reset: 'Reset',
        css: 'CSS box-shadow property',
        minLayers: 'At least one layer is required',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. The box-shadow string is built entirely in your browser with JavaScript. Nothing you change — values, colors or the preview — is uploaded, logged or stored, so you can safely tune shadows for unreleased designs.',
  },
  {
    q: 'What do offset, blur and spread actually do?',
    a: 'Offset X and Y move the shadow horizontally and vertically (negative values shift it left and up). Blur softens the edge — 0 is a hard edge, larger values fade it out. Spread grows or shrinks the shadow before blurring; a negative spread is handy for tight, lifted shadows.',
  },
  {
    q: 'How do I create a layered, more realistic shadow?',
    a: 'Click Add layer to stack several shadows in one box-shadow declaration. Real-world shadows usually combine a small, tight, darker shadow with a larger, softer, lighter one. Layers are applied top to bottom, and the tool joins them with commas automatically.',
  },
  {
    q: 'What is an inset shadow?',
    a: 'An inset shadow is drawn inside the element instead of outside, which makes the box look recessed or pressed in. Toggle the Inset checkbox on a layer to add the inset keyword to that part of the value.',
  },
  {
    q: 'Why is the shadow hard to see on a white background?',
    a: 'Soft, low-opacity shadows can disappear against the surface they sit on. Use the light/dark preview toggle to check your shadow on both backgrounds, and increase the color opacity, blur or offset if it is too faint.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Строка box-shadow собирается полностью в браузере на JavaScript. Ничего из того, что вы меняете — значения, цвета или превью, — не загружается, не логируется и не сохраняется, поэтому тени можно спокойно настраивать для неопубликованных макетов.',
  },
  {
    q: 'Что на самом деле делают смещение, размытие и разброс?',
    a: 'Смещение X и Y двигают тень по горизонтали и вертикали (отрицательные значения сдвигают её влево и вверх). Размытие смягчает край: 0 — резкая граница, большие значения растушёвывают её. Разброс увеличивает или уменьшает тень до размытия; отрицательный разброс удобен для аккуратных «приподнятых» теней.',
  },
  {
    q: 'Как сделать многослойную, более реалистичную тень?',
    a: 'Нажмите «Добавить слой», чтобы сложить несколько теней в одном свойстве box-shadow. Реалистичные тени обычно сочетают маленькую плотную тёмную тень с большой мягкой и светлой. Слои применяются сверху вниз, а инструмент сам объединяет их запятыми.',
  },
  {
    q: 'Что такое внутренняя (inset) тень?',
    a: 'Внутренняя тень рисуется внутри элемента, а не снаружи, из-за чего блок выглядит вдавленным или нажатым. Включите флажок «Внутренняя (inset)» у слоя, чтобы добавить ключевое слово inset в эту часть значения.',
  },
  {
    q: 'Почему тень плохо видно на белом фоне?',
    a: 'Мягкие тени с низкой прозрачностью могут пропадать на фоне, на котором лежат. Используйте переключатель светлого/тёмного превью, чтобы проверить тень на обоих фонах, и увеличьте непрозрачность цвета, размытие или смещение, если она слишком бледная.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="box-shadow-generator" :faq="faq">
    <!-- Actions -->
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" class="btn-primary" @click="addLayer">+ {{ ui.addLayer }}</button>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
      </div>
    </div>

    <!-- Live preview -->
    <div class="mt-5">
      <div class="mb-2 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.preview }}</span>
        <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
            :class="previewBg === 'light' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
            @click="previewBg = 'light'"
          >{{ ui.light }}</button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
            :class="previewBg === 'dark' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
            @click="previewBg = 'dark'"
          >{{ ui.dark }}</button>
        </div>
      </div>
      <div
        class="grid h-64 w-full place-items-center rounded-xl border transition-colors sm:h-72"
        :class="previewBg === 'light' ? 'border-ink-200 bg-ink-50' : 'border-ink-700 bg-ink-900'"
      >
        <div
          class="h-28 w-44 rounded-xl"
          :class="previewBg === 'light' ? 'bg-white' : 'bg-ink-800'"
          :style="{ boxShadow: shadowValue }"
          role="img"
          :aria-label="ui.preview"
        />
      </div>
    </div>

    <!-- Layers -->
    <div class="mt-5">
      <div class="mb-2 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.layers }}</span>
        <button type="button" class="btn-ghost !px-2.5 !py-1.5 text-xs" @click="addLayer">
          + {{ ui.addLayer }}
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="(layer, i) in layers"
          :key="i"
          class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.layer }} {{ i + 1 }}</span>
            <button
              type="button"
              class="btn-ghost !px-2.5 !py-1.5 text-xs"
              :disabled="layers.length <= 1"
              :aria-label="ui.removeLayer"
              @click="removeLayer(i)"
            >✕</button>
          </div>

          <!-- Numeric controls -->
          <div class="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <label class="block text-sm text-ink-500 dark:text-ink-400">
              <span class="mb-1 block">{{ ui.offsetX }}</span>
              <span class="flex items-center gap-2">
                <input
                  :value="layer.offsetX"
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  class="h-2 flex-1 cursor-pointer accent-accent"
                  :aria-label="`${ui.offsetX} ${i + 1}`"
                  @input="setNumber(i, 'offsetX', Number(($event.target as HTMLInputElement).value))"
                >
                <input
                  :value="layer.offsetX"
                  type="number"
                  step="1"
                  class="field !w-16 !py-1.5 text-center"
                  :aria-label="`${ui.offsetX} ${i + 1}`"
                  @input="setNumber(i, 'offsetX', Number(($event.target as HTMLInputElement).value))"
                >
              </span>
            </label>

            <label class="block text-sm text-ink-500 dark:text-ink-400">
              <span class="mb-1 block">{{ ui.offsetY }}</span>
              <span class="flex items-center gap-2">
                <input
                  :value="layer.offsetY"
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  class="h-2 flex-1 cursor-pointer accent-accent"
                  :aria-label="`${ui.offsetY} ${i + 1}`"
                  @input="setNumber(i, 'offsetY', Number(($event.target as HTMLInputElement).value))"
                >
                <input
                  :value="layer.offsetY"
                  type="number"
                  step="1"
                  class="field !w-16 !py-1.5 text-center"
                  :aria-label="`${ui.offsetY} ${i + 1}`"
                  @input="setNumber(i, 'offsetY', Number(($event.target as HTMLInputElement).value))"
                >
              </span>
            </label>

            <label class="block text-sm text-ink-500 dark:text-ink-400">
              <span class="mb-1 block">{{ ui.blur }}</span>
              <span class="flex items-center gap-2">
                <input
                  :value="layer.blur"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  class="h-2 flex-1 cursor-pointer accent-accent"
                  :aria-label="`${ui.blur} ${i + 1}`"
                  @input="setNumber(i, 'blur', Number(($event.target as HTMLInputElement).value))"
                >
                <input
                  :value="layer.blur"
                  type="number"
                  min="0"
                  step="1"
                  class="field !w-16 !py-1.5 text-center"
                  :aria-label="`${ui.blur} ${i + 1}`"
                  @input="setNumber(i, 'blur', Number(($event.target as HTMLInputElement).value))"
                >
              </span>
            </label>

            <label class="block text-sm text-ink-500 dark:text-ink-400">
              <span class="mb-1 block">{{ ui.spread }}</span>
              <span class="flex items-center gap-2">
                <input
                  :value="layer.spread"
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  class="h-2 flex-1 cursor-pointer accent-accent"
                  :aria-label="`${ui.spread} ${i + 1}`"
                  @input="setNumber(i, 'spread', Number(($event.target as HTMLInputElement).value))"
                >
                <input
                  :value="layer.spread"
                  type="number"
                  step="1"
                  class="field !w-16 !py-1.5 text-center"
                  :aria-label="`${ui.spread} ${i + 1}`"
                  @input="setNumber(i, 'spread', Number(($event.target as HTMLInputElement).value))"
                >
              </span>
            </label>
          </div>

          <!-- Color + inset -->
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
              {{ ui.color }}
              <input
                type="color"
                :value="toHexInput(layer.color)"
                class="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-ink-200 bg-white p-0.5 dark:border-ink-700 dark:bg-ink-900"
                :aria-label="`${ui.color} ${i + 1}`"
                @input="setColor(i, ($event.target as HTMLInputElement).value)"
              >
            </label>
            <input
              :value="layer.color"
              type="text"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              class="field !w-44 font-mono text-sm"
              :aria-label="`${ui.color} ${i + 1}`"
              @input="setColor(i, ($event.target as HTMLInputElement).value)"
            >

            <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
              <input
                type="checkbox"
                :checked="layer.inset"
                class="h-4 w-4 cursor-pointer accent-accent"
                :aria-label="`${ui.inset} ${i + 1}`"
                @change="setInset(i, ($event.target as HTMLInputElement).checked)"
              >
              {{ ui.inset }}
            </label>
          </div>
        </div>
      </div>
      <p v-if="layers.length <= 1" class="mt-1.5 text-xs text-ink-400">{{ ui.minLayers }}</p>
    </div>

    <!-- Output -->
    <div class="mt-5">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.css }}</span>
        <CopyButton :text="() => shadowCss" small />
      </div>
      <input
        :value="shadowCss"
        readonly
        class="field font-mono text-sm"
        spellcheck="false"
        :aria-label="ui.css"
      >
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор CSS box-shadow онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор CSS box-shadow</strong> помогает визуально
          собрать тень из нескольких слоёв: настроить смещение по осям X и Y, размытие,
          разброс, цвет и режим <code>inset</code>, увидеть результат в живом превью и
          скопировать готовое свойство <code>box-shadow</code> одним кликом. Инструмент
          сделан для разработчиков и дизайнеров, которым нужен корректный CSS-код тени
          для карточек, кнопок, модальных окон и всплывающих меню.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Значения и
          цвета не отправляются на сервер, поэтому инструмент безопасен для фирменных
          стилей и закрытых макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Меняйте <code>Смещение X</code>, <code>Смещение Y</code>, <code>Размытие</code> и <code>Разброс</code> ползунками или числовыми полями.</li>
          <li>Задайте <code>Цвет</code> тени палитрой или впишите любую CSS-строку, например <code>rgba(0,0,0,0.15)</code>.</li>
          <li>Включите флажок <code>Внутренняя (inset)</code>, чтобы тень рисовалась внутри элемента.</li>
          <li>Нажмите <code>Добавить слой</code>, чтобы наложить ещё одну тень, или <code>✕</code>, чтобы убрать слой (минимум один).</li>
          <li>Переключите фон превью между светлым и тёмным и скопируйте свойство кнопкой <code>Копировать</code>; <code>Пример</code> и <code>Сбросить</code> помогут начать.</li>
        </ul>

        <h2>Размытие против разброса</h2>
        <p>
          <strong>Размытие</strong> (третье значение) задаёт, насколько мягким будет
          край тени: <code>0</code> даёт резкую границу, большие значения растушёвывают
          её. <strong>Разброс</strong> (четвёртое значение) увеличивает или уменьшает
          размер тени до применения размытия. Положительный разброс делает тень крупнее
          самого элемента, а отрицательный — меньше, что удобно для аккуратных
          «приподнятых» карточек. Сочетание нескольких слоёв с разными параметрами даёт
          наиболее естественную и глубокую тень.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Оформляете интерфейс? Соберите фон в
          <NuxtLink :to="localePath('/css-gradient-generator')">генераторе градиентов</NuxtLink>,
          переведите значения в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>
          или настройте плавность анимаций в
          <NuxtLink :to="localePath('/cubic-bezier-generator')">генераторе кривых Безье</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>CSS box-shadow generator online</h2>
        <p>
          This free <strong>CSS box-shadow generator</strong> helps you build a layered
          shadow visually: tune the X and Y offsets, blur, spread, color and the
          <code>inset</code> mode, watch the result in a live preview, and copy the
          finished <code>box-shadow</code> property in one click. It is built for
          developers and designers who need correct shadow CSS for cards, buttons, modals
          and dropdowns.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. Your values
          and colors are never sent to a server, so it is safe to use with brand styles
          and unreleased designs.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Adjust <code>Offset X</code>, <code>Offset Y</code>, <code>Blur</code> and <code>Spread</code> with the sliders or number fields.</li>
          <li>Set the shadow <code>Color</code> with the picker, or type any CSS color string such as <code>rgba(0,0,0,0.15)</code>.</li>
          <li>Tick the <code>Inset</code> checkbox to draw the shadow inside the element.</li>
          <li>Click <code>Add layer</code> to stack another shadow, or <code>✕</code> to remove a layer (minimum one).</li>
          <li>Toggle the preview background between light and dark, then copy the property with the <code>Copy</code> button; <code>Sample</code> and <code>Reset</code> help you start.</li>
        </ul>

        <h2>Blur vs. spread</h2>
        <p>
          <strong>Blur</strong> (the third value) controls how soft the shadow edge is:
          <code>0</code> gives a hard edge, larger values fade it out. <strong>Spread</strong>
          (the fourth value) grows or shrinks the shadow before the blur is applied. A
          positive spread makes the shadow larger than the element, while a negative spread
          makes it smaller — perfect for tight, lifted cards. Combining several layers with
          different settings produces the most natural, layered depth.
        </p>

        <h2>Related tools</h2>
        <p>
          Styling an interface? Build a background in the
          <NuxtLink :to="localePath('/css-gradient-generator')">CSS gradient generator</NuxtLink>,
          convert values in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>,
          or tune animation easing in the
          <NuxtLink :to="localePath('/cubic-bezier-generator')">cubic bezier generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
