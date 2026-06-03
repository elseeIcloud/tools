<script setup lang="ts">
import { diffLines, diffWordsWithSpace } from 'diff'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const original = ref('')
const changed = ref('')
const mode = ref<'line' | 'word'>('line')

// Tool-specific labels (common verbs like Clear/Sample/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        original: 'Оригинал',
        changed: 'Изменённый',
        lineMode: 'По строкам',
        wordMode: 'По словам',
        diff: 'Различия',
        added: 'добавлено',
        removed: 'удалено',
        identical: 'Тексты идентичны.',
        empty: 'Введите текст в оба поля, чтобы увидеть различия.',
        originalPlaceholder: 'Вставьте исходный текст…',
        changedPlaceholder: 'Вставьте изменённый текст…',
      }
    : {
        original: 'Original',
        changed: 'Changed',
        lineMode: 'Line diff',
        wordMode: 'Word diff',
        diff: 'Diff',
        added: 'added',
        removed: 'removed',
        identical: 'The two texts are identical.',
        empty: 'Enter text in both fields to see the diff.',
        originalPlaceholder: 'Paste the original text…',
        changedPlaceholder: 'Paste the changed text…',
      },
)

interface Part {
  value: string
  added: boolean
  removed: boolean
}

const parts = computed<Part[]>(() => {
  if (!original.value && !changed.value) return []
  const result =
    mode.value === 'line'
      ? diffLines(original.value, changed.value)
      : diffWordsWithSpace(original.value, changed.value)
  return result.map((p) => ({
    value: p.value,
    added: Boolean(p.added),
    removed: Boolean(p.removed),
  }))
})

const hasInput = computed(() => original.value.length > 0 || changed.value.length > 0)

const hasChanges = computed(() => parts.value.some((p) => p.added || p.removed))

// Count added / removed lines for the +N / -N summary (line-accurate in both modes).
function countLines(text: string): number {
  if (!text) return 0
  const trimmed = text.endsWith('\n') ? text.slice(0, -1) : text
  return trimmed.split('\n').length
}

const summary = computed(() => {
  let added = 0
  let removed = 0
  for (const p of parts.value) {
    if (p.added) added += countLines(p.value)
    else if (p.removed) removed += countLines(p.value)
  }
  return { added, removed }
})

function swap() {
  const tmp = original.value
  original.value = changed.value
  changed.value = tmp
}

function clear() {
  original.value = ''
  changed.value = ''
}

const sampleOriginal = `function greet(name) {
  const message = "Hello, " + name;
  console.log(message);
  return message;
}`

const sampleChanged = `function greet(name) {
  const message = \`Hi, \${name}!\`;
  console.log(message);
  return message.trim();
}`

function loadSample() {
  original.value = sampleOriginal
  changed.value = sampleChanged
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text uploaded anywhere?',
    a: 'No. The comparison runs entirely in your browser with JavaScript. Neither the original nor the changed text is sent to a server, logged, or stored, so it is safe for proprietary code, contracts and other sensitive content.',
  },
  {
    q: 'What is the difference between line diff and word diff?',
    a: 'Line diff compares the two texts line by line and is best for code and structured data, where each line is a meaningful unit. Word diff compares word by word (including spaces), so it highlights small edits inside a line — ideal for prose and paragraphs.',
  },
  {
    q: 'What do the colors mean?',
    a: 'Green marks content that was added in the changed text, red with a line-through marks content that was removed from the original, and normal text is unchanged. The +N / -N summary shows how many lines were added and removed.',
  },
  {
    q: 'Does the diff ignore whitespace or letter case?',
    a: 'No. The comparison is exact: differences in spacing, indentation, trailing newlines and capitalization are all reported. Normalize your text first if you want to ignore those.',
  },
  {
    q: 'Can I compare two files?',
    a: 'Yes — open each file, copy its contents, and paste one into Original and the other into Changed. Everything stays local in your browser, so even large files never leave your device.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружается ли мой текст куда-либо?',
    a: 'Нет. Сравнение полностью выполняется в браузере на JavaScript. Ни оригинал, ни изменённый текст не отправляются на сервер, не логируются и не сохраняются — поэтому инструмент безопасен для закрытого кода, договоров и других конфиденциальных данных.',
  },
  {
    q: 'Чем отличается сравнение по строкам от сравнения по словам?',
    a: 'Сравнение по строкам сопоставляет тексты построчно и лучше всего подходит для кода и структурированных данных, где строка — это законченная единица. Сравнение по словам идёт по словам (включая пробелы) и подсвечивает мелкие правки внутри строки — это удобно для обычного текста и абзацев.',
  },
  {
    q: 'Что означают цвета?',
    a: 'Зелёным выделяется то, что добавлено в изменённый текст, красным с зачёркиванием — то, что удалено из оригинала, обычный текст не менялся. Сводка +N / −N показывает, сколько строк добавлено и удалено.',
  },
  {
    q: 'Игнорирует ли diff пробелы и регистр?',
    a: 'Нет. Сравнение точное: различия в пробелах, отступах, завершающих переносах строк и регистре учитываются. Если их нужно игнорировать, нормализуйте текст заранее.',
  },
  {
    q: 'Можно ли сравнить два файла?',
    a: 'Да — откройте каждый файл, скопируйте содержимое и вставьте одно в поле «Оригинал», а другое — в «Изменённый». Всё остаётся локально в браузере, поэтому даже большие файлы не покидают устройство.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="diff-checker" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'line' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'line'"
        >{{ ui.lineMode }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'word' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'word'"
        >{{ ui.wordMode }}</button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Two inputs -->
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <label class="label" for="diff-original">{{ ui.original }}</label>
        <textarea
          id="diff-original"
          v-model="original"
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.originalPlaceholder"
        />
      </div>
      <div>
        <label class="label" for="diff-changed">{{ ui.changed }}</label>
        <textarea
          id="diff-changed"
          v-model="changed"
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.changedPlaceholder"
        />
      </div>
    </div>

    <!-- Summary line -->
    <div class="mt-4 flex min-h-[1.5rem] items-center gap-3 text-sm">
      <span class="font-medium text-ink-700 dark:text-ink-200">{{ ui.diff }}</span>
      <template v-if="hasInput">
        <span class="font-mono text-green-600 dark:text-green-400">+{{ summary.added }}</span>
        <span class="text-ink-400">{{ ui.added }}</span>
        <span class="font-mono text-red-600 dark:text-red-400">−{{ summary.removed }}</span>
        <span class="text-ink-400">{{ ui.removed }}</span>
      </template>
    </div>

    <!-- Rendered diff -->
    <div
      class="mt-2 min-h-[8rem] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-ink-200 bg-white p-4 font-mono text-sm leading-relaxed dark:border-ink-700 dark:bg-ink-950"
    >
      <template v-if="hasInput">
        <span v-if="!hasChanges" class="text-ink-400">{{ ui.identical }}</span>
        <template v-else>
          <span
            v-for="(p, i) in parts"
            :key="i"
            :class="
              p.added
                ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                : p.removed
                  ? 'bg-red-500/15 text-red-700 line-through dark:text-red-300'
                  : 'text-ink-700 dark:text-ink-200'
            "
          >{{ p.value }}</span>
        </template>
      </template>
      <span v-else class="text-ink-400">{{ ui.empty }}</span>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Сравнение двух текстов онлайн (diff)</h2>
        <p>
          Этот бесплатный <strong>diff-чекер</strong> сравнивает два блока текста или
          кода и наглядно показывает, что добавлено, удалено и осталось без
          изменений. Добавленные фрагменты подсвечиваются зелёным, удалённые —
          красным с зачёркиванием, а неизменённый текст остаётся обычным. Сверху
          выводится краткая сводка <code>+N / −N</code> — сколько строк добавлено и
          удалено.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Тексты не
          отправляются на сервер, поэтому инструмент безопасен для закрытого кода,
          договоров, конфигов и других конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте исходную версию в поле <code>Оригинал</code>, а новую — в <code>Изменённый</code>.</li>
          <li>Выберите режим <code>По строкам</code> для кода или <code>По словам</code> для обычного текста.</li>
          <li>Смотрите различия ниже: зелёное добавлено, красное зачёркнутое удалено.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы поменять стороны и инвертировать diff.</li>
          <li>Используйте <code>Пример</code>, чтобы попробовать сразу, и <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>По строкам или по словам</h2>
        <p>
          Сравнение <strong>по строкам</strong> сопоставляет тексты построчно — это
          лучший выбор для исходного кода и структурированных данных, где строка
          является логической единицей. Сравнение <strong>по словам</strong> идёт
          по отдельным словам вместе с пробелами и подсвечивает мелкие правки прямо
          внутри строки, что удобно для абзацев и редактуры текста. Diff здесь
          точный: различия в пробелах, отступах и регистре учитываются.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно оценить объём текста? Откройте
          <NuxtLink :to="localePath('/text-counter')">счётчик текста</NuxtLink>.
          Сравниваете JSON? Сначала приведите его к единому виду в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>,
          а привести имена к одному стилю поможет
          <NuxtLink :to="localePath('/case-converter')">конвертер регистра</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Compare two texts online (diff)</h2>
        <p>
          This free <strong>diff checker</strong> compares two blocks of text or code
          and shows clearly what was added, removed and left unchanged. Added content
          is highlighted in green, removed content in red with a line-through, and
          unchanged text stays normal. A compact <code>+N / −N</code> summary at the
          top tells you how many lines were added and removed.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your texts are
          never sent to a server, so it is safe for proprietary code, contracts,
          config files and other sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste the earlier version into <code>Original</code> and the newer one into <code>Changed</code>.</li>
          <li>Pick <code>Line diff</code> for code or <code>Word diff</code> for prose.</li>
          <li>Read the diff below: green is added, red with a line-through is removed.</li>
          <li>Click <code>Swap</code> to switch the two sides and invert the diff.</li>
          <li>Use <code>Sample</code> to try it instantly, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>Line diff vs. word diff</h2>
        <p>
          <strong>Line diff</strong> compares the texts line by line — the best choice
          for source code and structured data, where each line is a meaningful unit.
          <strong>Word diff</strong> compares word by word (including the spaces between
          them) and highlights small edits inside a line, which is ideal for paragraphs
          and copy editing. The comparison is exact: differences in whitespace,
          indentation and capitalization are all reported.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to size up your text? Open the
          <NuxtLink :to="localePath('/text-counter')">text counter</NuxtLink>.
          Comparing JSON? Normalize it first in the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>,
          and align identifier styles with the
          <NuxtLink :to="localePath('/case-converter')">case converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
