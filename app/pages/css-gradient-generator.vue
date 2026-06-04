<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type GradientType = 'linear' | 'radial'

interface Stop {
  /** #rrggbb color from <input type="color"> */
  color: string
  /** position in percent, 0..100 */
  pos: number
}

// Fixed defaults so SSR output matches client hydration (no randomness/time).
const type = ref<GradientType>('linear')
const angle = ref(90)
const stops = ref<Stop[]>([
  { color: '#5b8cff', pos: 0 },
  { color: '#9f7bff', pos: 100 },
])

// --- Pure builders (SSG-safe: just string/number math) -----------------------

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

// Normalize an angle so the readonly output is stable (0..360, integer).
const safeAngle = computed(() => clamp(Math.round(angle.value) || 0, 0, 360))

// "color pos%, color pos%" — exactly as written, in the current stop order.
const stopList = computed(() =>
  stops.value.map((s) => `${s.color} ${clamp(Math.round(s.pos), 0, 100)}%`).join(', '),
)

// "linear-gradient(90deg, …)" / "radial-gradient(circle, …)" — the inner value.
const gradientValue = computed(() =>
  type.value === 'linear'
    ? `linear-gradient(${safeAngle.value}deg, ${stopList.value})`
    : `radial-gradient(circle, ${stopList.value})`,
)

// The two copyable CSS declarations.
const backgroundCss = computed(() => `background: ${gradientValue.value};`)
const backgroundImageCss = computed(() => `background-image: ${gradientValue.value};`)

// --- Stop handlers ------------------------------------------------------------

function addStop() {
  const list = stops.value
  const last = list[list.length - 1]!
  const prev = list[list.length - 2]
  // Place the new stop sensibly between the last two (or at the end).
  const pos = prev ? clamp(Math.round((last.pos + prev.pos) / 2), 0, 100) : last.pos
  stops.value = [...list, { color: '#ffffff', pos }]
}

function removeStop(i: number) {
  if (stops.value.length <= 2) return // minimum two stops
  stops.value = stops.value.filter((_, idx) => idx !== i)
}

function setStopColor(i: number, value: string) {
  stops.value = stops.value.map((s, idx) => (idx === i ? { ...s, color: value } : s))
}

function setStopPos(i: number, value: number) {
  const pos = clamp(Math.round(Number(value) || 0), 0, 100)
  stops.value = stops.value.map((s, idx) => (idx === i ? { ...s, pos } : s))
}

function reset() {
  type.value = 'linear'
  angle.value = 90
  stops.value = [
    { color: '#5b8cff', pos: 0 },
    { color: '#9f7bff', pos: 100 },
  ]
}

function loadSample() {
  type.value = 'linear'
  angle.value = 135
  stops.value = [
    { color: '#ff7a18', pos: 0 },
    { color: '#af002d', pos: 50 },
    { color: '#319197', pos: 100 },
  ]
}

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        type: 'Тип',
        linear: 'Линейный',
        radial: 'Радиальный',
        angle: 'Угол',
        preview: 'Превью',
        stops: 'Точки цвета',
        position: 'Позиция',
        color: 'Цвет',
        addStop: 'Добавить точку',
        removeStop: 'Удалить точку',
        reset: 'Сбросить',
        background: 'CSS-свойство background',
        backgroundImage: 'CSS-свойство background-image',
        minStops: 'Минимум две точки цвета',
      }
    : {
        type: 'Type',
        linear: 'Linear',
        radial: 'Radial',
        angle: 'Angle',
        preview: 'Preview',
        stops: 'Color stops',
        position: 'Position',
        color: 'Color',
        addStop: 'Add stop',
        removeStop: 'Remove stop',
        reset: 'Reset',
        background: 'CSS background property',
        backgroundImage: 'CSS background-image property',
        minStops: 'At least two color stops',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. The gradient is built as a CSS string entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so you can experiment freely with brand colors and unreleased designs.',
  },
  {
    q: 'What is the difference between background and background-image?',
    a: 'A gradient is technically an image, so it is valid in both. The background shorthand resets all background properties (color, position, repeat) before applying the gradient, while background-image only sets the image layer and leaves any existing background-color underneath. Use background-image when you are layering the gradient on top of other background settings.',
  },
  {
    q: 'How does the angle work for linear gradients?',
    a: 'The angle is in degrees and follows the CSS convention: 0deg points to the top, 90deg to the right, 180deg to the bottom and 270deg to the left. So 90deg runs the gradient left-to-right. Radial gradients ignore the angle — this tool emits radial-gradient(circle, …) instead.',
  },
  {
    q: 'Do I need to specify a position for every color stop?',
    a: 'Not in real CSS — the browser distributes stops without explicit positions evenly. This generator always writes an explicit percentage for each stop so the output is unambiguous and easy to fine-tune. You can set any value from 0% to 100%.',
  },
  {
    q: 'Why are there always at least two color stops?',
    a: 'A gradient needs at least two colors to blend between. The tool keeps a minimum of two stops and disables removing the last pair; you can add as many extra stops as you like in between.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Градиент собирается в CSS-строку полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому можно свободно экспериментировать с фирменными цветами и неопубликованными макетами.',
  },
  {
    q: 'Чем отличаются background и background-image?',
    a: 'Градиент технически является изображением, поэтому допустим в обоих свойствах. Сокращённое свойство background сбрасывает все фоновые параметры (цвет, позицию, повтор) перед применением градиента, а background-image задаёт только слой изображения и оставляет ниже существующий background-color. Используйте background-image, когда накладываете градиент поверх других фоновых настроек.',
  },
  {
    q: 'Как работает угол для линейного градиента?',
    a: 'Угол задаётся в градусах по соглашению CSS: 0deg направлен вверх, 90deg вправо, 180deg вниз и 270deg влево. Поэтому 90deg ведёт градиент слева направо. Радиальный градиент игнорирует угол — этот инструмент выводит radial-gradient(circle, …).',
  },
  {
    q: 'Нужно ли указывать позицию для каждой точки цвета?',
    a: 'В обычном CSS — нет: браузер сам равномерно распределит точки без явных позиций. Этот генератор всегда пишет явный процент для каждой точки, чтобы вывод был однозначным и его было удобно донастраивать. Можно задать любое значение от 0% до 100%.',
  },
  {
    q: 'Почему всегда минимум две точки цвета?',
    a: 'Градиенту нужно как минимум два цвета, чтобы между ними был переход. Инструмент держит минимум две точки и не позволяет удалить последнюю пару; между ними можно добавить сколько угодно дополнительных точек.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="css-gradient-generator" :faq="faq">
    <!-- Type toggle + angle + actions -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="type === 'linear' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="type = 'linear'"
        >{{ ui.linear }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="type === 'radial' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="type = 'radial'"
        >{{ ui.radial }}</button>
      </div>

      <label
        v-if="type === 'linear'"
        class="flex flex-1 items-center gap-3 text-sm font-medium text-ink-600 dark:text-ink-300"
      >
        {{ ui.angle }}
        <input
          v-model.number="angle"
          type="range"
          min="0"
          max="360"
          step="1"
          class="h-2 flex-1 cursor-pointer accent-accent"
          :aria-label="ui.angle"
        >
        <input
          v-model.number="angle"
          type="number"
          min="0"
          max="360"
          class="field !w-20 !py-1.5 text-center"
          :aria-label="ui.angle"
        >
        <span class="text-ink-400">deg</span>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
      </div>
    </div>

    <!-- Live preview -->
    <div class="mt-5">
      <span class="label">{{ ui.preview }}</span>
      <div
        class="h-56 w-full rounded-xl border border-ink-200 shadow-inner dark:border-ink-700 sm:h-72"
        :style="{ background: gradientValue }"
        role="img"
        :aria-label="ui.preview"
      />
    </div>

    <!-- Color stops -->
    <div class="mt-5">
      <div class="mb-2 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.stops }}</span>
        <button type="button" class="btn-ghost !px-2.5 !py-1.5 text-xs" @click="addStop">
          + {{ ui.addStop }}
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(stop, i) in stops"
          :key="i"
          class="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-white p-2.5 dark:border-ink-700 dark:bg-ink-950"
        >
          <input
            type="color"
            :value="stop.color"
            class="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-ink-200 bg-white p-0.5 dark:border-ink-700 dark:bg-ink-900"
            :aria-label="`${ui.color} ${i + 1}`"
            @input="setStopColor(i, ($event.target as HTMLInputElement).value)"
          >
          <code class="font-mono text-sm text-ink-600 dark:text-ink-300">{{ stop.color }}</code>

          <label class="ml-auto flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
            {{ ui.position }}
            <input
              :value="stop.pos"
              type="number"
              min="0"
              max="100"
              class="field !w-20 !py-1.5 text-center"
              :aria-label="`${ui.position} ${i + 1}`"
              @input="setStopPos(i, Number(($event.target as HTMLInputElement).value))"
            >
            <span class="text-ink-400">%</span>
          </label>

          <button
            type="button"
            class="btn-ghost !px-2.5 !py-1.5 text-xs"
            :disabled="stops.length <= 2"
            :aria-label="ui.removeStop"
            @click="removeStop(i)"
          >✕</button>
        </div>
      </div>
      <p v-if="stops.length <= 2" class="mt-1.5 text-xs text-ink-400">{{ ui.minStops }}</p>
    </div>

    <!-- Output: background -->
    <div class="mt-5">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.background }}</span>
        <CopyButton :text="() => backgroundCss" small />
      </div>
      <input
        :value="backgroundCss"
        readonly
        class="field"
        spellcheck="false"
        :aria-label="ui.background"
      >
    </div>

    <!-- Output: background-image -->
    <div class="mt-4">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.backgroundImage }}</span>
        <CopyButton :text="() => backgroundImageCss" small />
      </div>
      <input
        :value="backgroundImageCss"
        readonly
        class="field"
        spellcheck="false"
        :aria-label="ui.backgroundImage"
      >
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор CSS-градиентов онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор CSS-градиентов</strong> помогает собрать
          <strong>линейный</strong> или <strong>радиальный</strong> градиент из нескольких
          точек цвета, настроить угол и сразу увидеть результат в большом живом превью.
          Готовое CSS-объявление можно скопировать в один клик — в вариантах
          <code>background</code> и <code>background-image</code>. Инструмент сделан для
          разработчиков и дизайнеров, которым нужен корректный CSS-код градиента для кнопок,
          фонов и hero-блоков.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Данные о цвете
          не отправляются на сервер, поэтому инструмент безопасен для фирменных палитр и
          закрытых макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите тип градиента: <code>Линейный</code> или <code>Радиальный</code>.</li>
          <li>Для линейного задайте <code>Угол</code> (0–360°) ползунком или числом.</li>
          <li>Меняйте цвет каждой точки в палитре и её <code>Позицию</code> в процентах.</li>
          <li>Нажмите <code>Добавить точку</code>, чтобы вставить промежуточный цвет, или <code>✕</code>, чтобы убрать лишний (минимум две точки).</li>
          <li>Скопируйте <code>background</code> или <code>background-image</code> кнопкой <code>Копировать</code>; <code>Пример</code> и <code>Сбросить</code> помогут начать.</li>
        </ul>

        <h2>Линейный против радиального</h2>
        <p>
          <strong>Линейный</strong> градиент переходит между цветами вдоль прямой линии,
          направление которой задаёт угол: <code>0deg</code> — вверх, <code>90deg</code> —
          вправо, <code>180deg</code> — вниз. <strong>Радиальный</strong> градиент
          расходится из центра наружу кругом, поэтому угол для него не используется —
          инструмент выводит <code>radial-gradient(circle, …)</code>. Каждая точка цвета
          получает явный процент позиции, что делает CSS однозначным и удобным для правок.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Подбираете цвета для градиента? Переведите значения в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>,
          соберите согласованный набор в
          <NuxtLink :to="localePath('/color-palette-generator')">генераторе палитры</NuxtLink>
          или проверьте читаемость текста в
          <NuxtLink :to="localePath('/contrast-checker')">проверке контраста</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>CSS gradient generator online</h2>
        <p>
          This free <strong>CSS gradient generator</strong> helps you build a
          <strong>linear</strong> or <strong>radial</strong> gradient from multiple color
          stops, tune the angle, and see the result instantly in a large live preview. Copy
          the finished CSS declaration in one click — in both the <code>background</code> and
          <code>background-image</code> variants. It is built for developers and designers
          who need correct gradient CSS for buttons, backgrounds and hero sections.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. Your color data
          is never sent to a server, so it is safe to use with brand palettes and unreleased
          designs.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Choose the gradient type: <code>Linear</code> or <code>Radial</code>.</li>
          <li>For a linear gradient, set the <code>Angle</code> (0–360°) with the slider or the number field.</li>
          <li>Change each stop's color in the picker and its <code>Position</code> in percent.</li>
          <li>Click <code>Add stop</code> to insert an in-between color, or <code>✕</code> to remove an extra one (minimum two stops).</li>
          <li>Copy the <code>background</code> or <code>background-image</code> with the <code>Copy</code> button; <code>Sample</code> and <code>Reset</code> help you start.</li>
        </ul>

        <h2>Linear vs. radial</h2>
        <p>
          A <strong>linear</strong> gradient blends between colors along a straight line
          whose direction is set by the angle: <code>0deg</code> points up,
          <code>90deg</code> right, <code>180deg</code> down. A <strong>radial</strong>
          gradient spreads outward from the center in a circle, so the angle does not apply —
          the tool emits <code>radial-gradient(circle, …)</code>. Each color stop gets an
          explicit position percentage, which keeps the CSS unambiguous and easy to edit.
        </p>

        <h2>Related tools</h2>
        <p>
          Choosing colors for your gradient? Convert values in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>,
          build a coherent set in the
          <NuxtLink :to="localePath('/color-palette-generator')">color palette generator</NuxtLink>,
          or check text legibility in the
          <NuxtLink :to="localePath('/contrast-checker')">contrast checker</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
