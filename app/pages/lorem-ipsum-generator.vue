<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type Unit = 'paragraphs' | 'sentences' | 'words'

const amount = ref(3)
const unit = ref<Unit>('paragraphs')
const startWithLorem = ref(true)

// Tool-specific labels (common verbs like Generate/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        amount: 'Количество',
        amountAria: 'Сколько генерировать',
        unit: 'Единица',
        unitAria: 'Единица генерации',
        paragraphs: 'Абзацы',
        sentences: 'Предложения',
        words: 'Слова',
        startWith: 'Начать с «Lorem ipsum dolor sit amet…»',
        generating: 'Генерируем текст…',
        empty: 'Текст-рыба появится здесь.',
        statusFor: (n: number, label: string) => `${n} · ${label}`,
        generatedIn: '· сгенерировано в вашем браузере',
      }
    : {
        amount: 'Amount',
        amountAria: 'How much to generate',
        unit: 'Unit',
        unitAria: 'Generation unit',
        paragraphs: 'Paragraphs',
        sentences: 'Sentences',
        words: 'Words',
        startWith: 'Start with "Lorem ipsum dolor sit amet…"',
        generating: 'Generating text…',
        empty: 'Placeholder text will appear here.',
        statusFor: (n: number, label: string) => `${n} · ${label}`,
        generatedIn: '· generated in your browser',
      },
)

const unitLabel = computed(() => {
  if (unit.value === 'paragraphs') return ui.value.paragraphs
  if (unit.value === 'sentences') return ui.value.sentences
  return ui.value.words
})

// Classic Lorem Ipsum word bank.
const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'eu', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
  'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero',
  'eos', 'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores',
  'quas', 'molestias', 'recusandae', 'itaque', 'earum', 'rerum', 'hic', 'tenetur',
  'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'alias',
  'perferendis', 'doloribus', 'asperiores', 'repellat',
] as const

const LEAD_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet']

/** Random integer in [0, max) using crypto when available, else Math.random. */
function randInt(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

function pickWord(): string {
  return WORDS[randInt(WORDS.length)]
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Build an array of `count` words. When `lead` is true the first five words are
 * exactly "lorem ipsum dolor sit amet"; the rest vary by random selection.
 */
function makeWords(count: number, lead: boolean): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (lead && i < LEAD_WORDS.length) out.push(LEAD_WORDS[i])
    else out.push(pickWord())
  }
  return out
}

/** A sentence of 6..14 words, capitalized first word, trailing period. */
function makeSentence(lead: boolean): string {
  const len = 6 + randInt(9) // 6..14 words
  const words = makeWords(len, lead)
  words[0] = capitalize(words[0])
  return words.join(' ') + '.'
}

/** A paragraph of 3..6 sentences; only the first sentence may carry the lead. */
function makeParagraph(lead: boolean): string {
  const sentences = 3 + randInt(4) // 3..6 sentences
  const out: string[] = []
  for (let i = 0; i < sentences; i++) {
    out.push(makeSentence(lead && i === 0))
  }
  return out.join(' ')
}

// RANDOM output: must NOT be produced during SSR/prerender. Start empty (stable
// across server/client), then populate in onMounted().
const output = ref('')

function clampAmount() {
  let n = Math.floor(Number(amount.value) || 0)
  if (n < 1) n = 1
  if (n > 50) n = 50
  amount.value = n
}

function generate() {
  clampAmount()
  const n = amount.value
  const lead = startWithLorem.value

  if (unit.value === 'words') {
    // amount words; words-mode amount 5 returns exactly 5 words.
    output.value = makeWords(n, lead).join(' ')
    return
  }

  if (unit.value === 'sentences') {
    const parts: string[] = []
    for (let i = 0; i < n; i++) parts.push(makeSentence(lead && i === 0))
    output.value = parts.join(' ')
    return
  }

  // paragraphs: n blocks separated by a blank line -> n separated blocks.
  const paragraphs: string[] = []
  for (let i = 0; i < n; i++) paragraphs.push(makeParagraph(lead && i === 0))
  output.value = paragraphs.join('\n\n')
}

// First batch is produced on the client only — never during prerender —
// so server HTML (empty output) matches the initial client render.
onMounted(generate)

const faqEn: FaqItem[] = [
  {
    q: 'Is the generated text sent to a server?',
    a: 'No. Every paragraph, sentence and word is assembled in your browser with JavaScript from a built-in word bank. Nothing is uploaded, logged or stored, so you can generate placeholder copy completely offline.',
  },
  {
    q: 'What exactly is Lorem Ipsum?',
    a: 'Lorem Ipsum is scrambled, meaningless Latin-like text used as filler in layouts and mockups. Because the words carry no meaning, designers and developers can focus on visual rhythm and spacing instead of being distracted by the actual content.',
  },
  {
    q: 'Why would I start with "Lorem ipsum dolor sit amet"?',
    a: 'That opening is the classic, instantly recognisable form of the placeholder. Enabling the option pins those exact first words so the output reads as conventional Lorem Ipsum; turn it off if you want a fully randomised block instead.',
  },
  {
    q: 'How much text can I generate?',
    a: 'You can request from 1 up to 50 paragraphs, sentences or words at a time. Switch the unit to match what your design needs — paragraphs for body copy, sentences for captions, or individual words for labels and chips.',
  },
  {
    q: 'Is each generated block different?',
    a: 'Yes. Words are picked at random using the browser crypto API, so every click of Generate produces a fresh variation. The structure stays consistent — sentences are capitalised and punctuated, and paragraphs are separated by a blank line.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли сгенерированный текст на сервер?',
    a: 'Нет. Каждый абзац, предложение и слово собираются прямо в браузере на JavaScript из встроенного словаря. Ничего не загружается, не логируется и не сохраняется, поэтому генерировать текст-рыбу можно полностью офлайн.',
  },
  {
    q: 'Что вообще такое Lorem Ipsum?',
    a: 'Lorem Ipsum — это бессмысленный псевдолатинский текст, который используют как заполнитель в макетах и прототипах. Поскольку слова не несут смысла, дизайнеры и разработчики могут сосредоточиться на ритме и расстановке блоков, а не на реальном содержании.',
  },
  {
    q: 'Зачем начинать с «Lorem ipsum dolor sit amet»?',
    a: 'Это классическое, мгновенно узнаваемое начало текста-рыбы. Если включить опцию, первые слова будут именно такими, и текст читается как привычный Lorem Ipsum. Отключите её, если нужен полностью случайный блок.',
  },
  {
    q: 'Сколько текста можно сгенерировать?',
    a: 'Можно запросить от 1 до 50 абзацев, предложений или слов за раз. Переключайте единицу под задачу: абзацы — для основного текста, предложения — для подписей, отдельные слова — для меток и чипов.',
  },
  {
    q: 'Каждый блок получается разным?',
    a: 'Да. Слова выбираются случайно через браузерный crypto API, поэтому каждый клик по «Сгенерировать» даёт новый вариант. Структура остаётся стабильной — предложения начинаются с заглавной буквы и оканчиваются точкой, а абзацы разделяются пустой строкой.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="lorem-ipsum-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" @click="generate">{{ t('common.generate') }}</button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.amount }}
        <input
          v-model.number="amount"
          type="number"
          min="1"
          max="50"
          class="field !w-20 !py-1.5"
          :aria-label="ui.amountAria"
          @change="clampAmount"
        />
      </label>

      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700" role="group" :aria-label="ui.unitAria">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="unit === 'paragraphs' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="unit = 'paragraphs'"
        >{{ ui.paragraphs }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="unit === 'sentences' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="unit = 'sentences'"
        >{{ ui.sentences }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="unit === 'words' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="unit = 'words'"
        >{{ ui.words }}</button>
      </div>

      <div class="ml-auto flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="startWithLorem" type="checkbox" class="accent-accent" />
          {{ ui.startWith }}
        </label>
        <CopyButton :text="() => output" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <span class="font-medium text-green-600 dark:text-green-400">
        {{ ui.statusFor(amount, unitLabel) }}
      </span>
      <span class="text-ink-400">{{ ui.generatedIn }}</span>
    </div>

    <!-- Result: random, so render on the client only -->
    <div class="mt-3">
      <ClientOnly>
        <div
          v-if="output"
          class="prose-tool min-h-[16rem] whitespace-pre-wrap rounded-lg border border-ink-200 bg-white p-4 leading-relaxed dark:border-ink-700 dark:bg-ink-950"
        >{{ output }}</div>
        <div
          v-else
          class="min-h-[16rem] rounded-lg border border-ink-200 bg-white p-4 text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950"
        >{{ ui.empty }}</div>
        <template #fallback>
          <div class="min-h-[16rem] rounded-lg border border-ink-200 bg-white p-4 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950">
            {{ ui.generating }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор Lorem Ipsum онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор Lorem Ipsum</strong> создаёт
          текст-рыбу — абзацы, предложения или отдельные слова — прямо в вашем
          браузере. Укажите нужное количество, выберите единицу и получите чистый
          заполнитель для макетов, прототипов и тестовой вёрстки за один клик.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Текст собирается
          локально из встроенного классического словаря, поэтому
          <strong>ничего не отправляется на сервер</strong> и инструмент доступен
          даже офлайн.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Укажите в поле <code>Количество</code> число от 1 до 50.</li>
          <li>Выберите единицу: <code>Абзацы</code>, <code>Предложения</code> или <code>Слова</code>.</li>
          <li>Включите <code>Начать с «Lorem ipsum dolor sit amet…»</code>, чтобы получить узнаваемое начало.</li>
          <li>Нажмите <code>Сгенерировать</code> для нового варианта — слова выбираются случайно при каждом клике.</li>
          <li>Скопируйте результат кнопкой <code>Копировать</code> и вставьте в дизайн или шаблон.</li>
        </ul>

        <h2>Зачем нужен текст-рыба</h2>
        <p>
          Lorem Ipsum — это намеренно бессмысленный псевдолатинский текст, который
          веб-дизайнеры и типографы используют уже несколько веков. Поскольку слова
          ничего не значат, взгляд не цепляется за содержание, и можно оценить
          ритм, длину строк, межстрочные интервалы и общий баланс макета. Это
          гораздо честнее, чем повторять «текст текст текст», потому что распределение
          длин слов близко к настоящему контенту.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Хотите измерить объём текста? Откройте
          <NuxtLink :to="localePath('/text-counter')">счётчик текста</NuxtLink>.
          Приведите заголовки к нужному стилю в
          <NuxtLink :to="localePath('/case-converter')">конвертере регистра</NuxtLink>
          или превратите их в URL-адреса с помощью
          <NuxtLink :to="localePath('/slug-generator')">генератора slug</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate Lorem Ipsum online</h2>
        <p>
          This free <strong>Lorem Ipsum generator</strong> creates placeholder
          text — paragraphs, sentences or individual words — right in your browser.
          Set the amount, pick a unit, and grab clean filler copy for mockups,
          prototypes and test layouts in a single click.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The text is
          assembled locally from a built-in classic word bank, so
          <strong>nothing is sent to a server</strong> and the tool works even
          offline.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Set the <code>Amount</code> field to any number from 1 to 50.</li>
          <li>Choose a unit: <code>Paragraphs</code>, <code>Sentences</code> or <code>Words</code>.</li>
          <li>Enable <code>Start with "Lorem ipsum dolor sit amet…"</code> for the recognisable opening.</li>
          <li>Click <code>Generate</code> for a fresh variation — words are picked at random on every click.</li>
          <li>Hit <code>Copy</code> to grab the result and paste it into your design or template.</li>
        </ul>

        <h2>Why use placeholder text</h2>
        <p>
          Lorem Ipsum is intentionally meaningless pseudo-Latin text that web
          designers and typographers have used for centuries. Because the words
          carry no meaning, the eye is not pulled into reading the content, so you
          can judge rhythm, line length, leading and overall balance of a layout.
          It is far more honest than repeating "text text text" because the
          distribution of word lengths closely mirrors real copy.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to measure how much text you have? Open the
          <NuxtLink :to="localePath('/text-counter')">Text counter</NuxtLink>.
          Reshape titles in the
          <NuxtLink :to="localePath('/case-converter')">Case converter</NuxtLink>,
          or turn them into URLs with the
          <NuxtLink :to="localePath('/slug-generator')">Slug generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
