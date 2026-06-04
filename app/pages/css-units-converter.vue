<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Unit = 'px' | 'rem' | 'em' | 'pt' | '%'

const UNITS: Unit[] = ['px', 'rem', 'em', 'pt', '%']

// Fixed defaults so SSR output matches client hydration (no randomness/time).
const base = ref(16)
const value = ref(16)
const from = ref<Unit>('px')

// --- Pure math (SSG-safe: identical in Node prerender and the browser) --------

// A sane base: positive, finite. Falls back to 16 when the input is empty/0.
const safeBase = computed(() => {
  const b = Number(base.value)
  return Number.isFinite(b) && b > 0 ? b : 16
})

// Round to up to 4 significant decimals and trim trailing zeros.
function fmt(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 1e4) / 1e4
  // toFixed(4) then strip trailing zeros and a dangling dot.
  return rounded
    .toFixed(4)
    .replace(/\.?0+$/, '')
}

// Convert the typed value (in `from` unit) to px — px is the pivot.
const px = computed(() => {
  const v = Number(value.value)
  if (!Number.isFinite(v)) return 0
  const b = safeBase.value
  switch (from.value) {
    case 'px':
      return v
    case 'rem':
      return v * b
    case 'em':
      return v * b // em treated with the same base as rem for simplicity
    case 'pt':
      return v * (96 / 72)
    case '%':
      return (v / 100) * b
  }
})

// px -> a given unit.
function fromPx(unit: Unit, pxVal: number): number {
  const b = safeBase.value
  switch (unit) {
    case 'px':
      return pxVal
    case 'rem':
      return pxVal / b
    case 'em':
      return pxVal / b
    case 'pt':
      return pxVal * (72 / 96)
    case '%':
      return (pxVal / b) * 100
  }
}

// Equivalent value in every unit (including the source, so the grid is complete).
const results = computed(() =>
  UNITS.map((unit) => ({
    unit,
    value: fmt(fromPx(unit, px.value)),
    isSource: unit === from.value,
  })),
)

function copyText(unit: Unit, v: string): string {
  return `${v}${unit}`
}

function reset() {
  base.value = 16
  value.value = 16
  from.value = 'px'
}

function loadSample() {
  base.value = 16
  value.value = 24
  from.value = 'px'
}

// --- Static reference table: common px -> rem at base 16 (independent of input).
const refPx = [12, 14, 16, 18, 20, 24, 32]
const reference = refPx.map((p) => ({
  px: p,
  rem: fmt(p / 16),
}))

// Tool-specific labels (common verbs like Copy/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        baseLabel: 'Корневой размер шрифта',
        baseHint: 'База для rem, em и % (по умолчанию 16px).',
        valueLabel: 'Значение',
        fromLabel: 'Из единицы',
        equivalents: 'Эквиваленты',
        source: 'исходное',
        reset: 'Сбросить',
        referenceTitle: 'Частые значения при базе 16px',
        refPx: 'px',
        refRem: 'rem',
      }
    : {
        baseLabel: 'Root font size',
        baseHint: 'Base for rem, em and % (default 16px).',
        valueLabel: 'Value',
        fromLabel: 'From unit',
        equivalents: 'Equivalents',
        source: 'source',
        reset: 'Reset',
        referenceTitle: 'Common values at base 16px',
        refPx: 'px',
        refRem: 'rem',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. Every conversion is plain arithmetic done entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored, so the tool works offline and is safe for any project.',
  },
  {
    q: 'What does the root font size affect?',
    a: 'It is the base for relative units. rem and em are multiples of it (at base 16, 1rem = 16px), and % is taken relative to it too. px and pt are absolute, so they never depend on the base. Change the base to match your CSS root and the rem, em and % results update instantly.',
  },
  {
    q: 'Why are em and rem treated the same here?',
    a: 'rem is always relative to the root font size, while em is relative to the font size of the current element, which can be any ancestor value in real CSS. To keep a single, predictable answer this converter assumes em uses the same base as rem. For nested em it is best to compute against the actual parent font size.',
  },
  {
    q: 'How is pt converted to px?',
    a: 'CSS defines 1 inch as 96px and as 72pt, so the fixed ratio is 96/72 (1pt = 1.333…px and 1px = 0.75pt). This is independent of the root font size, which is why pt is an absolute unit alongside px.',
  },
  {
    q: 'How are the numbers rounded?',
    a: 'Results are rounded to at most four decimal places and trailing zeros are trimmed, so 16px shows as 1rem rather than 1.0000rem. The full-precision value is what gets used in your CSS; the display just keeps it readable.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Каждое преобразование — это обычная арифметика, выполняемая полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется, поэтому инструмент работает офлайн и безопасен для любого проекта.',
  },
  {
    q: 'На что влияет корневой размер шрифта?',
    a: 'Это база для относительных единиц. rem и em — это её кратные (при базе 16 1rem = 16px), и % тоже считается относительно неё. px и pt абсолютны и от базы не зависят. Поменяйте базу под свой корневой CSS — и значения rem, em и % мгновенно пересчитаются.',
  },
  {
    q: 'Почему em и rem здесь считаются одинаково?',
    a: 'rem всегда относителен корневому размеру шрифта, а em — размеру шрифта текущего элемента, который в реальном CSS может быть унаследован от любого предка. Чтобы дать один предсказуемый ответ, конвертер считает, что em использует ту же базу, что и rem. Для вложенных em лучше считать от фактического размера шрифта родителя.',
  },
  {
    q: 'Как pt переводится в px?',
    a: 'В CSS 1 дюйм равен 96px и 72pt, поэтому фиксированное соотношение — 96/72 (1pt = 1,333…px, а 1px = 0,75pt). Оно не зависит от корневого размера шрифта, поэтому pt, как и px, является абсолютной единицей.',
  },
  {
    q: 'Как округляются числа?',
    a: 'Результаты округляются максимум до четырёх знаков после запятой, а хвостовые нули обрезаются, поэтому 16px показывается как 1rem, а не 1.0000rem. В CSS используется полное значение, а на экране оно просто остаётся читаемым.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="css-units-converter" :faq="faq">
    <!-- Inputs -->
    <div class="flex flex-wrap items-end gap-4">
      <label class="flex flex-col gap-1 text-sm font-medium text-ink-600 dark:text-ink-300">
        {{ ui.valueLabel }}
        <input
          v-model.number="value"
          type="number"
          step="any"
          class="field !w-36"
          :aria-label="ui.valueLabel"
        >
      </label>

      <label class="flex flex-col gap-1 text-sm font-medium text-ink-600 dark:text-ink-300">
        {{ ui.fromLabel }}
        <select v-model="from" class="field !w-28" :aria-label="ui.fromLabel">
          <option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-sm font-medium text-ink-600 dark:text-ink-300">
        {{ ui.baseLabel }}
        <span class="flex items-center gap-2">
          <input
            v-model.number="base"
            type="number"
            min="1"
            step="any"
            class="field !w-28"
            :aria-label="ui.baseLabel"
          >
          <span class="text-ink-400">px</span>
        </span>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="reset">{{ ui.reset }}</button>
      </div>
    </div>
    <p class="mt-1.5 text-xs text-ink-400">{{ ui.baseHint }}</p>

    <!-- Equivalents -->
    <div class="mt-5">
      <span class="label">{{ ui.equivalents }}</span>
      <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <div
          v-for="(r, i) in results"
          :key="r.unit"
          class="flex items-center gap-3 px-3 py-3 sm:px-4"
          :class="[
            i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950',
            r.isSource ? 'ring-1 ring-inset ring-accent/30' : '',
          ]"
        >
          <span class="w-12 shrink-0 font-mono text-sm font-semibold text-accent">{{ r.unit }}</span>
          <span class="min-w-0 flex-1 font-mono text-base text-ink-800 dark:text-ink-100">
            {{ r.value }}<span class="text-ink-400">{{ r.unit }}</span>
            <span v-if="r.isSource" class="ml-2 text-xs font-medium text-ink-400">· {{ ui.source }}</span>
          </span>
          <CopyButton :text="() => copyText(r.unit, r.value)" small class="shrink-0" />
        </div>
      </div>
    </div>

    <!-- Static reference: common px -> rem at base 16 -->
    <div class="mt-6">
      <span class="label">{{ ui.referenceTitle }}</span>
      <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <div
          v-for="(r, i) in reference"
          :key="r.px"
          class="flex items-center gap-3 px-3 py-2.5 text-sm sm:px-4"
          :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
        >
          <span class="w-20 shrink-0 font-mono text-ink-700 dark:text-ink-200">{{ r.px }}{{ ui.refPx }}</span>
          <span class="text-ink-400">=</span>
          <span class="flex-1 font-mono text-ink-700 dark:text-ink-200">{{ r.rem }}{{ ui.refRem }}</span>
          <CopyButton :text="() => `${r.px}px = ${r.rem}rem`" small class="shrink-0" />
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер CSS-единиц онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер CSS-единиц</strong> переводит значения между
          <code>px</code>, <code>rem</code>, <code>em</code>, <code>pt</code> и <code>%</code>
          относительно заданного корневого размера шрифта. Введите число, выберите исходную
          единицу — и инструмент сразу покажет эквивалент во всех остальных единицах, каждый
          со своей кнопкой копирования. Удобно, когда нужно перевести макет из пикселей в
          масштабируемые <code>rem</code> или быстро понять, сколько это в процентах.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong>. Это чистая
          математика без отправки данных на сервер, поэтому конвертер работает офлайн и
          ничего из введённого не загружается.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите <code>Значение</code> и выберите единицу в поле <code>Из единицы</code>.</li>
          <li>При необходимости измените <code>Корневой размер шрифта</code> — базу для <code>rem</code>, <code>em</code> и <code>%</code> (по умолчанию 16px).</li>
          <li>Смотрите эквиваленты во всех единицах в списке ниже; исходная единица подсвечена.</li>
          <li>Нажмите <code>Копировать</code> в строке, чтобы скопировать значение вместе с единицей, например <code>1.5rem</code>.</li>
          <li>Кнопки <code>Пример</code> и <code>Сбросить</code> помогут быстро начать.</li>
        </ul>

        <h2>Абсолютные и относительные единицы</h2>
        <p>
          <code>px</code> и <code>pt</code> — <strong>абсолютные</strong> единицы и не зависят
          от настроек шрифта: в CSS 1 дюйм равен 96px и 72pt, отсюда соотношение 96/72.
          <code>rem</code>, <code>em</code> и <code>%</code> — <strong>относительные</strong>:
          они считаются от корневого размера шрифта (этот конвертер берёт для <code>em</code>
          ту же базу, что и для <code>rem</code>, ради предсказуемого результата). Перевод
          фиксированных пикселей в <code>rem</code> делает интерфейс масштабируемым: размеры
          растут вместе с настройками шрифта пользователя.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Работаете с дизайн-токенами? Переведите цвета в
          <NuxtLink :to="localePath('/color-converter')">конвертере цветов</NuxtLink>,
          соберите тень в
          <NuxtLink :to="localePath('/box-shadow-generator')">генераторе box-shadow</NuxtLink>
          или переведите числа между системами счисления в
          <NuxtLink :to="localePath('/number-base-converter')">конвертере систем счисления</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>CSS units converter online</h2>
        <p>
          This free <strong>CSS units converter</strong> translates values between
          <code>px</code>, <code>rem</code>, <code>em</code>, <code>pt</code> and <code>%</code>
          relative to a chosen root font size. Type a number, pick the source unit, and the
          tool instantly shows the equivalent in every other unit, each with its own copy
          button. It is handy for turning a pixel mockup into scalable <code>rem</code> values
          or quickly seeing what a size is as a percentage.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong>. It is pure math
          with no data sent to a server, so the converter works offline and nothing you type
          is uploaded.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Enter a <code>Value</code> and choose its unit in the <code>From unit</code> field.</li>
          <li>If needed, change the <code>Root font size</code> — the base for <code>rem</code>, <code>em</code> and <code>%</code> (default 16px).</li>
          <li>Read the equivalents in every unit in the list below; the source unit is highlighted.</li>
          <li>Click <code>Copy</code> on a row to copy the value with its unit, for example <code>1.5rem</code>.</li>
          <li>Use <code>Sample</code> and <code>Reset</code> to get started quickly.</li>
        </ul>

        <h2>Absolute vs. relative units</h2>
        <p>
          <code>px</code> and <code>pt</code> are <strong>absolute</strong> units that do not
          depend on font settings: in CSS one inch equals 96px and 72pt, which gives the 96/72
          ratio. <code>rem</code>, <code>em</code> and <code>%</code> are <strong>relative</strong>:
          they are measured against the root font size (this converter uses the same base for
          <code>em</code> as for <code>rem</code> to keep the result predictable). Converting
          fixed pixels to <code>rem</code> makes an interface scalable, so sizes grow with the
          user's preferred font size.
        </p>

        <h2>Related tools</h2>
        <p>
          Working with design tokens? Convert colors in the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>,
          build a shadow in the
          <NuxtLink :to="localePath('/box-shadow-generator')">box-shadow generator</NuxtLink>,
          or convert numbers between bases in the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
