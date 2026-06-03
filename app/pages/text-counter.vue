<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')

const WPM = 200

// Tool-specific labels (common verbs like Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        characters: 'Символы',
        charactersNoSpaces: 'Символы без пробелов',
        words: 'Слова',
        sentences: 'Предложения',
        lines: 'Строки',
        paragraphs: 'Абзацы',
        readingTime: 'Время чтения',
        min: 'мин',
        placeholder: 'Вставьте или введите текст, чтобы посмотреть статистику…',
      }
    : {
        characters: 'Characters',
        charactersNoSpaces: 'Characters (no spaces)',
        words: 'Words',
        sentences: 'Sentences',
        lines: 'Lines',
        paragraphs: 'Paragraphs',
        readingTime: 'Reading time',
        min: 'min',
        placeholder: 'Paste or type text to see live stats…',
      },
)

const characters = computed(() => input.value.length)

const charactersNoSpaces = computed(
  () => input.value.replace(/\s/g, '').length,
)

const words = computed(() => {
  const m = input.value.trim().match(/\S+/g)
  return m ? m.length : 0
})

const sentences = computed(() => {
  const m = input.value.match(/[^.!?…]*[.!?…]+/g)
  // Trailing text with no terminator still counts as one sentence.
  const tail = input.value.replace(/[^.!?…]*[.!?…]+/g, '').trim()
  return (m ? m.length : 0) + (tail.length > 0 ? 1 : 0)
})

const lines = computed(() => {
  if (input.value.length === 0) return 0
  return input.value.split(/\r\n|\r|\n/).length
})

const paragraphs = computed(() => {
  const blocks = input.value
    .split(/\n[ \t]*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
  return blocks.length
})

const readingMinutes = computed(() => Math.ceil(words.value / WPM))

const readingTime = computed(() => `${readingMinutes.value} ${ui.value.min}`)

const stats = computed(() => [
  { key: 'characters', label: ui.value.characters, value: characters.value },
  { key: 'charactersNoSpaces', label: ui.value.charactersNoSpaces, value: charactersNoSpaces.value },
  { key: 'words', label: ui.value.words, value: words.value },
  { key: 'sentences', label: ui.value.sentences, value: sentences.value },
  { key: 'lines', label: ui.value.lines, value: lines.value },
  { key: 'paragraphs', label: ui.value.paragraphs, value: paragraphs.value },
  { key: 'readingTime', label: ui.value.readingTime, value: readingTime.value },
])

function clear() {
  input.value = ''
}

const sampleEn = `The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs!

How vexingly quick daft zebras jump? Sphinx of black quartz, judge my vow.`

const sampleRu = `Съешь же ещё этих мягких французских булок да выпей чаю. В чащах юга жил бы цитрус?

Эх, чужак, общий съём цен шляп — юфть, вдрызг! Подумай и считай слова и символы.`

function loadSample() {
  input.value = locale.value === 'ru' ? sampleRu : sampleEn
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server?',
    a: 'No. The counter analyses your text entirely in your browser with JavaScript. Nothing is uploaded, logged or stored, so it is safe for drafts, private notes and confidential documents.',
  },
  {
    q: 'How are words counted?',
    a: 'A word is any run of non-whitespace characters separated by spaces, tabs or line breaks. Leading and trailing whitespace is ignored, so "Hello world." counts as two words.',
  },
  {
    q: 'How is reading time estimated?',
    a: 'Reading time is derived from the word count at about 200 words per minute, rounded up to the next whole minute. It is an estimate for prose; dense technical text usually reads more slowly.',
  },
  {
    q: 'How do you count sentences and paragraphs?',
    a: 'Sentences are counted by terminators — periods, question marks, exclamation marks and ellipses. Paragraphs are blocks of text separated by one or more blank lines, so soft line breaks within a block do not start a new paragraph.',
  },
  {
    q: 'What is the difference between characters with and without spaces?',
    a: '"Characters" counts every character including spaces, tabs and line breaks. "Characters (no spaces)" removes all whitespace first, which is the figure most platforms use for tweet- and SMS-style limits.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Счётчик анализирует текст полностью в браузере на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для черновиков, личных заметок и конфиденциальных документов.',
  },
  {
    q: 'Как считаются слова?',
    a: 'Слово — это любая последовательность непробельных символов, отделённая пробелами, табами или переносами строк. Пробелы в начале и в конце игнорируются, поэтому «Hello world.» считается как два слова.',
  },
  {
    q: 'Как оценивается время чтения?',
    a: 'Время чтения вычисляется из количества слов из расчёта около 200 слов в минуту и округляется вверх до целой минуты. Это оценка для обычного текста; плотный технический текст обычно читается медленнее.',
  },
  {
    q: 'Как считаются предложения и абзацы?',
    a: 'Предложения определяются по знакам конца — точкам, вопросительным и восклицательным знакам и многоточиям. Абзацы — это блоки текста, разделённые одной или несколькими пустыми строками, поэтому обычный перенос строки внутри блока не начинает новый абзац.',
  },
  {
    q: 'Чем отличаются символы с пробелами и без?',
    a: '«Символы» считают все символы, включая пробелы, табы и переносы строк. «Символы без пробелов» сначала убирают все пробельные символы — именно эту цифру используют большинство платформ для лимитов в духе твитов и SMS.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="text-counter" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
      <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      <div class="ml-auto">
        <CopyButton :text="() => input" />
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <label class="label" for="text-counter-input">{{ t('common.input') }}</label>
      <textarea
        id="text-counter-input"
        v-model="input"
        class="textarea-code min-h-[16rem]"
        spellcheck="false"
        :placeholder="ui.placeholder"
        :aria-label="t('common.input')"
      />
    </div>

    <!-- Live stats -->
    <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <div
        v-for="s in stats"
        :key="s.key"
        class="rounded-lg border border-ink-200 bg-white p-3.5 dark:border-ink-700 dark:bg-ink-950"
      >
        <div class="font-mono text-2xl font-semibold tabular-nums text-ink-900 dark:text-ink-100">
          {{ typeof s.value === 'number' ? s.value.toLocaleString() : s.value }}
        </div>
        <div class="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-400">{{ s.label }}</div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Счётчик символов, слов и строк онлайн</h2>
        <p>
          Этот бесплатный <strong>счётчик текста</strong> мгновенно показывает
          количество символов, символов без пробелов, слов, предложений, строк и
          абзацев, а также примерное время чтения — всё обновляется прямо во время
          набора. Он создан для авторов, редакторов, SMM-специалистов и
          разработчиков, которым нужно уложиться в лимит длины поста, метатега,
          описания или подписи.
        </p>
        <p>
          Инструмент работает <strong>полностью в браузере</strong>. Ваш текст
          никуда не отправляется, не логируется и не сохраняется, поэтому его
          безопасно использовать с черновиками, личными заметками и
          конфиденциальными документами.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте или введите текст в поле — статистика пересчитывается на лету.</li>
          <li>Смотрите карточки: символы, символы без пробелов, слова, предложения, строки, абзацы и время чтения.</li>
          <li>Нажмите <code>Пример</code>, чтобы подставить готовый текст, или <code>Очистить</code>, чтобы начать заново.</li>
          <li>Используйте <code>Копировать</code>, чтобы скопировать введённый текст целиком.</li>
        </ul>

        <h2>Как считаются метрики</h2>
        <p>
          <strong>Слова</strong> — это группы непробельных символов, разделённые
          пробелами, табами или переносами строк. <strong>Предложения</strong>
          определяются по знакам конца — точке, вопросительному и восклицательному
          знакам и многоточию. <strong>Абзацы</strong> — это блоки, разделённые
          пустой строкой. <strong>Время чтения</strong> рассчитывается из числа
          слов при скорости около 200 слов в минуту и округляется вверх до целой
          минуты.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно изменить стиль текста? Откройте
          <NuxtLink :to="localePath('/case-converter')">конвертер регистра</NuxtLink>,
          сгенерируйте текст-заполнитель в
          <NuxtLink :to="localePath('/lorem-ipsum-generator')">генераторе Lorem Ipsum</NuxtLink>
          или сравните две версии в
          <NuxtLink :to="localePath('/diff-checker')">сравнении текста (diff)</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Count characters, words and lines online</h2>
        <p>
          This free <strong>text counter</strong> instantly shows the number of
          characters, characters without spaces, words, sentences, lines and
          paragraphs, plus an estimated reading time — all updated live as you
          type. It is built for writers, editors, social-media managers and
          developers who need to stay within a length limit for a post, meta tag,
          description or caption.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your text is
          never sent to a server, logged or stored, so it is safe to use with
          drafts, private notes and confidential documents.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste or type your text into the field — the stats recalculate on the fly.</li>
          <li>Read the cards: characters, characters without spaces, words, sentences, lines, paragraphs and reading time.</li>
          <li>Click <code>Sample</code> to drop in ready-made text, or <code>Clear</code> to start over.</li>
          <li>Use <code>Copy</code> to copy the whole input back out.</li>
        </ul>

        <h2>How the metrics are counted</h2>
        <p>
          <strong>Words</strong> are runs of non-whitespace characters separated
          by spaces, tabs or line breaks. <strong>Sentences</strong> are detected
          by terminators — periods, question marks, exclamation marks and
          ellipses. <strong>Paragraphs</strong> are blocks separated by a blank
          line. <strong>Reading time</strong> is derived from the word count at
          roughly 200 words per minute, rounded up to the next whole minute.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to reshape the text? Open the
          <NuxtLink :to="localePath('/case-converter')">case converter</NuxtLink>,
          generate placeholder copy with the
          <NuxtLink :to="localePath('/lorem-ipsum-generator')">Lorem Ipsum generator</NuxtLink>,
          or compare two versions with the
          <NuxtLink :to="localePath('/diff-checker')">diff checker</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
