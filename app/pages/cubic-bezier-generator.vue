<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Four control numbers for cubic-bezier(x1, y1, x2, y2).
// Default = the CSS `ease` curve. Fixed so SSR output matches hydration.
const x1 = ref(0.25)
const y1 = ref(0.1)
const x2 = ref(0.25)
const y2 = ref(1)

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

// Round to a tidy 2 decimals for stable, copyable output.
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// X coordinates are constrained to [0, 1]; Y may overshoot to roughly
// [-0.5, 1.5] so bouncy/anticipating curves are possible. Pure math — safe
// to evaluate during prerender.
const cx1 = computed(() => round2(clamp(Number(x1.value) || 0, 0, 1)))
const cy1 = computed(() => round2(clamp(Number(y1.value) || 0, -0.5, 1.5)))
const cx2 = computed(() => round2(clamp(Number(x2.value) || 0, 0, 1)))
const cy2 = computed(() => round2(clamp(Number(y2.value) || 0, -0.5, 1.5)))

// The CSS timing function — the copyable output.
const bezier = computed(
  () => `cubic-bezier(${cx1.value}, ${cy1.value}, ${cx2.value}, ${cy2.value})`,
)

// --- SVG geometry -----------------------------------------------------------
// The editor lives in a unit square. We pad it and flip Y so that larger y
// values point up, matching how easing curves are usually drawn. Everything
// here is a PURE computed of the four numbers, so the curve renders correctly
// during prerender with no dragging.

const PAD = 28 // px padding around the unit square
const SIZE = 240 // px side of the unit square inside the SVG
const VB = SIZE + PAD * 2 // total viewBox side

// Map a unit-square point (ux, uy) -> SVG pixel coords (Y flipped).
function px(ux: number): number {
  return PAD + ux * SIZE
}
function py(uy: number): number {
  return PAD + (1 - uy) * SIZE
}

// Endpoints are fixed at (0,0) and (1,1); P1/P2 are the control handles.
const p0 = { x: px(0), y: py(0) }
const p3 = { x: px(1), y: py(1) }

const h1 = computed(() => ({ x: px(cx1.value), y: py(cy1.value) }))
const h2 = computed(() => ({ x: px(cx2.value), y: py(cy2.value) }))

// The cubic path's `d` attribute — pure, renders on the server.
const pathD = computed(
  () =>
    `M ${p0.x} ${p0.y} C ${h1.value.x} ${h1.value.y} ${h2.value.x} ${h2.value.y} ${p3.x} ${p3.y}`,
)

// --- Presets ----------------------------------------------------------------

interface Preset {
  name: string
  v: [number, number, number, number]
}

const presets: Preset[] = [
  { name: 'linear', v: [0, 0, 1, 1] },
  { name: 'ease', v: [0.25, 0.1, 0.25, 1] },
  { name: 'ease-in', v: [0.42, 0, 1, 1] },
  { name: 'ease-out', v: [0, 0, 0.58, 1] },
  { name: 'ease-in-out', v: [0.42, 0, 0.58, 1] },
]

function applyPreset(p: Preset) {
  x1.value = p.v[0]
  y1.value = p.v[1]
  x2.value = p.v[2]
  y2.value = p.v[3]
}

// Highlight the active preset when the numbers match exactly.
const activePreset = computed(() => {
  const cur = [cx1.value, cy1.value, cx2.value, cy2.value]
  const match = presets.find((p) => p.v.every((n, i) => n === cur[i]))
  return match?.name ?? null
})

// --- Dragging (client-only) -------------------------------------------------
// All pointer logic is attached in onMounted and removed in onBeforeUnmount.
// The SVG element is reached via a template ref; window/document are never
// touched at setup top level.

const svgEl = ref<SVGSVGElement | null>(null)
const dragging = ref<1 | 2 | null>(null)

// Convert a pointer event to bezier space using the SVG bounding box.
function pointerToUnit(ev: PointerEvent): { ux: number; uy: number } | null {
  const el = svgEl.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  // Account for the SVG being scaled to its rendered size vs. the viewBox.
  const scaleX = VB / rect.width
  const scaleY = VB / rect.height
  const vx = (ev.clientX - rect.left) * scaleX
  const vy = (ev.clientY - rect.top) * scaleY
  const ux = (vx - PAD) / SIZE
  const uy = 1 - (vy - PAD) / SIZE // un-flip Y
  return { ux, uy }
}

function startDrag(which: 1 | 2, ev: PointerEvent) {
  ev.preventDefault()
  dragging.value = which
}

function onPointerMove(ev: PointerEvent) {
  if (!dragging.value) return
  const u = pointerToUnit(ev)
  if (!u) return
  ev.preventDefault()
  if (dragging.value === 1) {
    x1.value = round2(clamp(u.ux, 0, 1))
    y1.value = round2(clamp(u.uy, -0.5, 1.5))
  } else {
    x2.value = round2(clamp(u.ux, 0, 1))
    y2.value = round2(clamp(u.uy, -0.5, 1.5))
  }
}

function onPointerUp() {
  dragging.value = null
}

// --- Animation preview (client-only) ----------------------------------------
// `pos` toggles between two states so the CSS transition (using the current
// cubic-bezier) replays. It renders as a static element during prerender.

const pos = ref(false)
let playTimer: ReturnType<typeof setTimeout> | undefined

function play() {
  pos.value = false
  if (playTimer) clearTimeout(playTimer)
  // Next tick on the client so the browser registers the reset before moving.
  playTimer = setTimeout(() => (pos.value = true), 50)
}

const transitionStyle = computed(() => ({
  transition: `transform 1.1s ${bezier.value}`,
  transform: pos.value ? 'translateX(calc(100% - 1px))' : 'translateX(0)',
}))

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  if (playTimer) clearTimeout(playTimer)
})

function reset() {
  applyPreset(presets[1]!) // ease
}

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        presets: 'Пресеты',
        curve: 'Редактор кривой',
        curveHint: 'Перетаскивайте точки или меняйте числа ниже.',
        preview: 'Превью анимации',
        play: 'Запустить',
        timing: 'CSS transition-timing-function',
        reset: 'Сбросить',
        valueX1: 'x1 (0–1)',
        valueY1: 'y1',
        valueX2: 'x2 (0–1)',
        valueY2: 'y2',
        timeLabel: 'время',
        progressLabel: 'прогресс',
      }
    : {
        presets: 'Presets',
        curve: 'Curve editor',
        curveHint: 'Drag the handles or edit the numbers below.',
        preview: 'Animation preview',
        play: 'Play',
        timing: 'CSS transition-timing-function',
        reset: 'Reset',
        valueX1: 'x1 (0–1)',
        valueY1: 'y1',
        valueX2: 'x2 (0–1)',
        valueY2: 'y2',
        timeLabel: 'time',
        progressLabel: 'progress',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. The curve, the preview and the cubic-bezier() string are all computed entirely in your browser with JavaScript. Nothing you drag or type is uploaded, logged or stored, so you can experiment with timing for unreleased products freely.',
  },
  {
    q: 'What do the four cubic-bezier numbers mean?',
    a: 'They are the coordinates of the two control points: cubic-bezier(x1, y1, x2, y2). The curve always starts at (0,0) and ends at (1,1), where the X axis is normalized time and the Y axis is progress. The two control points bend the curve to speed up, slow down or overshoot the animation.',
  },
  {
    q: 'Why can the Y values go above 1 or below 0?',
    a: 'X is restricted to 0–1 so time always moves forward, but Y is allowed to overshoot — roughly -0.5 to 1.5 here. That overshoot is exactly what produces bouncy or anticipating easings, where the element shoots past its target and settles back.',
  },
  {
    q: 'How do I use the output in CSS?',
    a: 'Copy the cubic-bezier(...) value and drop it into transition-timing-function or animation-timing-function, for example "transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);". The same value also works as the easing argument in the Web Animations API.',
  },
  {
    q: 'What are linear, ease, ease-in and ease-out?',
    a: 'They are the built-in CSS keywords, each equal to a specific cubic-bezier: linear is (0,0,1,1), ease is (0.25,0.1,0.25,1), ease-in is (0.42,0,1,1), ease-out is (0,0,0.58,1) and ease-in-out is (0.42,0,0.58,1). The preset buttons load these so you can tweak from a familiar starting point.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Кривая, превью и строка cubic-bezier() вычисляются полностью в браузере на JavaScript. Ничего из того, что вы перетаскиваете или вводите, не загружается, не логируется и не сохраняется, поэтому можно свободно экспериментировать с анимацией для закрытых проектов.',
  },
  {
    q: 'Что означают четыре числа cubic-bezier?',
    a: 'Это координаты двух контрольных точек: cubic-bezier(x1, y1, x2, y2). Кривая всегда начинается в (0,0) и заканчивается в (1,1), где ось X — это нормированное время, а ось Y — прогресс анимации. Контрольные точки изгибают кривую, заставляя анимацию ускоряться, замедляться или вылетать за пределы.',
  },
  {
    q: 'Почему значения Y могут быть больше 1 или меньше 0?',
    a: 'X ограничен диапазоном 0–1, чтобы время всегда шло вперёд, а Y может выходить за пределы — здесь примерно от -0.5 до 1.5. Именно такой выход за границы создаёт «пружинящие» эффекты с отскоком, когда элемент проскакивает цель и возвращается обратно.',
  },
  {
    q: 'Как использовать результат в CSS?',
    a: 'Скопируйте значение cubic-bezier(...) и подставьте его в transition-timing-function или animation-timing-function, например «transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);». То же значение работает как функция плавности в Web Animations API.',
  },
  {
    q: 'Что такое linear, ease, ease-in и ease-out?',
    a: 'Это встроенные ключевые слова CSS, каждое из которых равно конкретной cubic-bezier: linear — это (0,0,1,1), ease — (0.25,0.1,0.25,1), ease-in — (0.42,0,1,1), ease-out — (0,0,0.58,1), а ease-in-out — (0.42,0,0.58,1). Кнопки пресетов загружают эти значения, чтобы можно было настраивать кривую от знакомой отправной точки.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="cubic-bezier-generator" :faq="faq">
    <!-- Presets -->
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.presets }}</span>
      <button
        v-for="p in presets"
        :key="p.name"
        type="button"
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="
          activePreset === p.name
            ? 'bg-accent text-white'
            : 'border border-ink-200 text-ink-600 hover:border-accent dark:border-ink-700 dark:text-ink-300'
        "
        @click="applyPreset(p)"
      >{{ p.name }}</button>
      <button type="button" class="btn-ghost ml-auto" @click="reset">{{ ui.reset }}</button>
    </div>

    <div class="mt-5 grid gap-5 lg:grid-cols-2">
      <!-- Curve editor -->
      <div>
        <span class="label">{{ ui.curve }}</span>
        <div class="rounded-xl border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
          <svg
            ref="svgEl"
            :viewBox="`0 0 ${VB} ${VB}`"
            class="w-full touch-none select-none"
            role="img"
            :aria-label="ui.curve"
          >
            <!-- Unit-square frame -->
            <rect
              :x="PAD"
              :y="PAD"
              :width="SIZE"
              :height="SIZE"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              class="text-ink-200 dark:text-ink-700"
            />
            <!-- Diagonal (linear reference) -->
            <line
              :x1="p0.x"
              :y1="p0.y"
              :x2="p3.x"
              :y2="p3.y"
              stroke="currentColor"
              stroke-width="1"
              stroke-dasharray="4 4"
              class="text-ink-200 dark:text-ink-700"
            />
            <!-- Handle lines -->
            <line
              :x1="p0.x"
              :y1="p0.y"
              :x2="h1.x"
              :y2="h1.y"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-accent/50"
            />
            <line
              :x1="p3.x"
              :y1="p3.y"
              :x2="h2.x"
              :y2="h2.y"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-accent/50"
            />
            <!-- The cubic curve (pure, renders on server) -->
            <path
              :d="pathD"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              class="text-accent"
            />
            <!-- Fixed endpoints -->
            <circle :cx="p0.x" :cy="p0.y" r="3.5" class="fill-ink-400" />
            <circle :cx="p3.x" :cy="p3.y" r="3.5" class="fill-ink-400" />
            <!-- Draggable handles (pointer events; client-only logic) -->
            <circle
              :cx="h1.x"
              :cy="h1.y"
              r="7"
              class="cursor-grab fill-accent"
              :class="dragging === 1 ? 'cursor-grabbing' : ''"
              role="slider"
              tabindex="0"
              :aria-label="`${ui.valueX1}, ${ui.valueY1}`"
              @pointerdown="startDrag(1, $event)"
            />
            <circle
              :cx="h2.x"
              :cy="h2.y"
              r="7"
              class="cursor-grab fill-accent"
              :class="dragging === 2 ? 'cursor-grabbing' : ''"
              role="slider"
              tabindex="0"
              :aria-label="`${ui.valueX2}, ${ui.valueY2}`"
              @pointerdown="startDrag(2, $event)"
            />
          </svg>
        </div>
        <p class="mt-1.5 text-xs text-ink-400">{{ ui.curveHint }}</p>

        <!-- Numeric inputs (fully usable without dragging) -->
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label class="text-sm text-ink-500 dark:text-ink-400">
            {{ ui.valueX1 }}
            <input
              v-model.number="x1"
              type="number"
              min="0"
              max="1"
              step="0.01"
              class="field mt-1 text-center"
              :aria-label="ui.valueX1"
            >
          </label>
          <label class="text-sm text-ink-500 dark:text-ink-400">
            {{ ui.valueY1 }}
            <input
              v-model.number="y1"
              type="number"
              min="-0.5"
              max="1.5"
              step="0.01"
              class="field mt-1 text-center"
              :aria-label="ui.valueY1"
            >
          </label>
          <label class="text-sm text-ink-500 dark:text-ink-400">
            {{ ui.valueX2 }}
            <input
              v-model.number="x2"
              type="number"
              min="0"
              max="1"
              step="0.01"
              class="field mt-1 text-center"
              :aria-label="ui.valueX2"
            >
          </label>
          <label class="text-sm text-ink-500 dark:text-ink-400">
            {{ ui.valueY2 }}
            <input
              v-model.number="y2"
              type="number"
              min="-0.5"
              max="1.5"
              step="0.01"
              class="field mt-1 text-center"
              :aria-label="ui.valueY2"
            >
          </label>
        </div>
      </div>

      <!-- Preview + output -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="label !mb-0">{{ ui.preview }}</span>
          <button type="button" class="btn-primary !px-4 !py-1.5 text-sm" @click="play">
            ▶ {{ ui.play }}
          </button>
        </div>

        <div class="space-y-4 rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950">
          <!-- transform / position track -->
          <div>
            <div class="mb-1 text-xs text-ink-400">{{ ui.progressLabel }}</div>
            <div class="relative h-9 w-full rounded-lg bg-ink-100 dark:bg-ink-800">
              <div
                class="absolute top-1 left-1 h-7 w-7 rounded-md bg-accent shadow"
                :style="transitionStyle"
              />
            </div>
          </div>
          <!-- a wide growing bar to read overshoot more easily -->
          <div>
            <div class="mb-1 text-xs text-ink-400">{{ ui.timeLabel }}</div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                class="h-full origin-left rounded-full bg-accent/70"
                :style="{
                  transition: `transform 1.1s ${bezier}`,
                  transform: pos ? 'scaleX(1)' : 'scaleX(0)',
                }"
              />
            </div>
          </div>
        </div>

        <!-- Output -->
        <div class="mt-4">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="label !mb-0">{{ ui.timing }}</span>
            <CopyButton :text="() => bezier" small />
          </div>
          <input
            :value="bezier"
            readonly
            class="field font-mono"
            spellcheck="false"
            :aria-label="ui.timing"
          >
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор CSS cubic-bezier онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор cubic-bezier</strong> помогает подобрать
          собственную функцию плавности для CSS-анимаций. Двигайте контрольные точки
          прямо на кривой, выбирайте готовые пресеты, смотрите, как меняется движение,
          в живом превью — и копируйте готовую запись <code>cubic-bezier(x1, y1, x2, y2)</code>
          одним кликом. Инструмент сделан для разработчиков и дизайнеров интерфейсов,
          которым нужна точная и предсказуемая динамика переходов.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Параметры
          кривой никуда не отправляются, поэтому инструментом безопасно пользоваться
          для закрытых продуктов и неопубликованных макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите ближайший <code>пресет</code> (linear, ease, ease-in, ease-out, ease-in-out) как отправную точку.</li>
          <li>Перетаскивайте две точки на кривой мышью или пальцем — координаты обновятся автоматически.</li>
          <li>Или задайте точные значения <code>x1</code>, <code>y1</code>, <code>x2</code>, <code>y2</code> в числовых полях.</li>
          <li>Нажмите <code>Запустить</code>, чтобы проиграть анимацию с текущей кривой.</li>
          <li>Скопируйте строку <code>cubic-bezier(...)</code> кнопкой <code>Копировать</code> и вставьте в свой CSS.</li>
        </ul>

        <h2>Как читать кривую</h2>
        <p>
          Кривая всегда идёт из точки <code>(0,0)</code> в <code>(1,1)</code>: по
          горизонтали отложено <strong>время</strong> от 0 до 1, по вертикали —
          <strong>прогресс</strong> анимации. Чем круче участок, тем быстрее движение в
          этот момент. Координаты X контрольных точек ограничены диапазоном 0–1, чтобы
          время не шло назад, а Y может выходить за пределы — именно это создаёт эффект
          «пружины» с отскоком за целевое значение. Готовое значение подставляется в
          <code>transition-timing-function</code> или <code>animation-timing-function</code>.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Оформляете интерфейс дальше? Соберите тень в
          <NuxtLink :to="localePath('/box-shadow-generator')">генераторе box-shadow</NuxtLink>,
          создайте фон в
          <NuxtLink :to="localePath('/css-gradient-generator')">генераторе CSS-градиентов</NuxtLink>
          или переведите цвета в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>CSS cubic-bezier generator online</h2>
        <p>
          This free <strong>cubic-bezier generator</strong> helps you craft a custom
          easing function for your CSS animations. Drag the control points right on the
          curve, pick from common presets, watch the motion change in a live preview, and
          copy the finished <code>cubic-bezier(x1, y1, x2, y2)</code> declaration in one
          click. It is built for developers and interface designers who want precise,
          predictable transition timing.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. Your curve
          values are never sent to a server, so the tool is safe to use for private
          products and unreleased designs.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick the closest <code>preset</code> (linear, ease, ease-in, ease-out, ease-in-out) as a starting point.</li>
          <li>Drag the two handles on the curve with a mouse or finger — the coordinates update automatically.</li>
          <li>Or type exact <code>x1</code>, <code>y1</code>, <code>x2</code>, <code>y2</code> values into the number fields.</li>
          <li>Click <code>Play</code> to replay the animation with the current curve.</li>
          <li>Copy the <code>cubic-bezier(...)</code> string with the <code>Copy</code> button and paste it into your CSS.</li>
        </ul>

        <h2>How to read the curve</h2>
        <p>
          The curve always runs from <code>(0,0)</code> to <code>(1,1)</code>: the
          horizontal axis is <strong>time</strong> from 0 to 1 and the vertical axis is
          animation <strong>progress</strong>. The steeper a segment, the faster the motion
          at that moment. The control points' X coordinates are limited to 0–1 so time never
          runs backwards, while Y is allowed to overshoot — and that overshoot is what
          creates springy easings that bounce past the target. The resulting value goes into
          <code>transition-timing-function</code> or <code>animation-timing-function</code>.
        </p>

        <h2>Related tools</h2>
        <p>
          Styling the rest of the UI? Build a shadow in the
          <NuxtLink :to="localePath('/box-shadow-generator')">box-shadow generator</NuxtLink>,
          create a background in the
          <NuxtLink :to="localePath('/css-gradient-generator')">CSS gradient generator</NuxtLink>,
          or convert colors in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
