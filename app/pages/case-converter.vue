<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        heading: 'Конвертер регистра',
        camel: 'camelCase',
        pascal: 'PascalCase',
        snake: 'snake_case',
        kebab: 'kebab-case',
        constant: 'CONSTANT_CASE',
        title: 'Title Case',
        sentence: 'Обычное предложение',
        lower: 'нижний регистр',
        upper: 'ВЕРХНИЙ РЕГИСТР',
        words: 'слов',
        empty: 'Введите текст слева, чтобы увидеть все варианты регистра.',
        placeholder: 'helloWorld foo',
      }
    : {
        heading: 'Case converter',
        camel: 'camelCase',
        pascal: 'PascalCase',
        snake: 'snake_case',
        kebab: 'kebab-case',
        constant: 'CONSTANT_CASE',
        title: 'Title Case',
        sentence: 'Sentence case',
        lower: 'lower case',
        upper: 'UPPER CASE',
        words: 'words',
        empty: 'Type some text on the left to see every case variant.',
        placeholder: 'helloWorld foo',
      },
)

/**
 * Robust word tokenizer. Splits on:
 *  - whitespace, hyphens, underscores and any other non-alphanumeric separators
 *  - camelCase / PascalCase boundaries (lower→Upper)
 *  - acronym boundaries (UPPER followed by Upper+lower, e.g. "JSONData" → JSON, Data)
 *  - letter↔digit boundaries (e.g. "user2name" → user, 2, name)
 * Returns lowercased word tokens.
 */
function tokenize(text: string): string[] {
  if (!text) return []
  // 1) Insert spaces at boundaries inside otherwise-joined identifiers.
  const spaced = text
    // lower/digit → Upper letter  (helloWorld → hello World)
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    // ACRONYM → Word              (JSONData → JSON Data)
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    // letter → digit             (user2 → user 2)
    .replace(/(\p{L})(\p{N})/gu, '$1 $2')
    // digit → letter             (2name → 2 name)
    .replace(/(\p{N})(\p{L})/gu, '$1 $2')
  // 2) Split on every run of non-alphanumeric characters and drop empties.
  return spaced
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
}

const words = computed(() => tokenize(input.value))

function capitalize(w: string): string {
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : w
}

const camelCase = computed(() =>
  words.value.map((w, i) => (i === 0 ? w : capitalize(w))).join(''),
)
const pascalCase = computed(() => words.value.map(capitalize).join(''))
const snakeCase = computed(() => words.value.join('_'))
const kebabCase = computed(() => words.value.join('-'))
const constantCase = computed(() => words.value.join('_').toUpperCase())
const titleCase = computed(() => words.value.map(capitalize).join(' '))
const sentenceCase = computed(() => {
  const joined = words.value.join(' ')
  return joined ? capitalize(joined) : ''
})
const lowerCase = computed(() => words.value.join(' '))
const upperCase = computed(() => words.value.join(' ').toUpperCase())

interface Variant {
  key: string
  label: string
  value: string
}

const variants = computed<Variant[]>(() => [
  { key: 'camel', label: ui.value.camel, value: camelCase.value },
  { key: 'pascal', label: ui.value.pascal, value: pascalCase.value },
  { key: 'snake', label: ui.value.snake, value: snakeCase.value },
  { key: 'kebab', label: ui.value.kebab, value: kebabCase.value },
  { key: 'constant', label: ui.value.constant, value: constantCase.value },
  { key: 'title', label: ui.value.title, value: titleCase.value },
  { key: 'sentence', label: ui.value.sentence, value: sentenceCase.value },
  { key: 'lower', label: ui.value.lower, value: lowerCase.value },
  { key: 'upper', label: ui.value.upper, value: upperCase.value },
])

const hasInput = computed(() => words.value.length > 0)

const sample = 'helloWorld foo-bar BAZ_qux JSONData user2name'

function loadSample() {
  input.value = sample
}

function clear() {
  input.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server?',
    a: 'No. Every conversion runs entirely in your browser with JavaScript. Your text is never uploaded, logged or stored, so it is safe to convert variable names, internal identifiers or any sensitive content.',
  },
  {
    q: 'How does it split mixed input into words?',
    a: 'The tokenizer splits on spaces, hyphens and underscores, and also detects camelCase and PascalCase boundaries, acronyms (like JSONData → JSON, Data) and letter-to-digit boundaries. Whatever style you paste in, it is broken into clean words before being reassembled in the case you need.',
  },
  {
    q: 'What is the difference between camelCase, PascalCase and snake_case?',
    a: 'camelCase lowercases the first word and capitalizes the rest with no separators (helloWorld). PascalCase capitalizes every word (HelloWorld). snake_case joins lowercased words with underscores (hello_world), while kebab-case uses hyphens (hello-world) and CONSTANT_CASE uses uppercase words joined by underscores (HELLO_WORLD).',
  },
  {
    q: 'When should I use each case?',
    a: 'camelCase is common for JavaScript and Java variables, PascalCase for class and component names, snake_case for Python variables and database columns, kebab-case for URLs, CSS classes and file names, and CONSTANT_CASE for environment variables and constants.',
  },
  {
    q: 'Does it handle non-Latin text and numbers?',
    a: 'Yes. Tokenization uses Unicode letter and number classes, so Cyrillic, accented characters and digits are recognized and split correctly. Note that camelCase, snake_case and similar styles assume Latin output, so non-Latin input is kept but not transliterated.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Все преобразования выполняются прямо в браузере на JavaScript. Текст не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для имён переменных, внутренних идентификаторов и любых конфиденциальных данных.',
  },
  {
    q: 'Как инструмент разбивает смешанный ввод на слова?',
    a: 'Токенизатор разбивает текст по пробелам, дефисам и подчёркиваниям, а также распознаёт границы camelCase и PascalCase, аббревиатуры (например, JSONData → JSON, Data) и переходы между буквами и цифрами. Какой бы стиль вы ни вставили, он сначала разбивается на чистые слова, а затем собирается в нужном регистре.',
  },
  {
    q: 'Чем отличаются camelCase, PascalCase и snake_case?',
    a: 'В camelCase первое слово в нижнем регистре, остальные с заглавной буквы и без разделителей (helloWorld). В PascalCase каждое слово с заглавной (HelloWorld). snake_case соединяет слова в нижнем регистре подчёркиваниями (hello_world), kebab-case использует дефисы (hello-world), а CONSTANT_CASE — слова в верхнем регистре через подчёркивание (HELLO_WORLD).',
  },
  {
    q: 'Когда использовать каждый стиль?',
    a: 'camelCase часто применяют для переменных в JavaScript и Java, PascalCase — для имён классов и компонентов, snake_case — для переменных Python и столбцов в базах данных, kebab-case — для URL, CSS-классов и имён файлов, а CONSTANT_CASE — для переменных окружения и констант.',
  },
  {
    q: 'Поддерживаются ли не-латинский текст и цифры?',
    a: 'Да. Токенизация использует Unicode-классы букв и цифр, поэтому кириллица, символы с диакритикой и цифры распознаются и разбиваются правильно. Учтите, что стили camelCase, snake_case и подобные рассчитаны на латиницу, поэтому не-латинский ввод сохраняется, но не транслитерируется.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="case-converter" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Input + variants -->
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <!-- Input -->
      <div>
        <label class="label" for="case-input">{{ t('common.input') }}</label>
        <textarea
          id="case-input"
          v-model="input"
          class="textarea-code min-h-[16rem] lg:min-h-[24rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
          :aria-label="t('common.input')"
        />
        <p class="mt-2 text-sm text-ink-400">
          <template v-if="hasInput">{{ words.length.toLocaleString() }} {{ ui.words }}</template>
          <template v-else>{{ t('common.startHint') }}</template>
        </p>
      </div>

      <!-- Variants -->
      <div>
        <span class="label">{{ t('common.result') }}</span>
        <div v-if="hasInput" class="space-y-2">
          <div
            v-for="v in variants"
            :key="v.key"
            class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ v.label }}</span>
              <CopyButton :text="() => v.value" small />
            </div>
            <p class="mt-1.5 break-all font-mono text-sm text-ink-900 dark:text-ink-100">{{ v.value }}</p>
          </div>
        </div>
        <div
          v-else
          class="grid min-h-[16rem] place-items-center rounded-lg border border-dashed border-ink-200 p-4 text-center text-sm text-ink-400 lg:min-h-[24rem] dark:border-ink-700"
        >
          {{ ui.empty }}
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер регистра онлайн: camelCase, snake_case, kebab-case и другие</h2>
        <p>
          Этот бесплатный <strong>конвертер регистра</strong> мгновенно преобразует
          любой текст в девять популярных стилей именования: camelCase, PascalCase,
          snake_case, kebab-case, CONSTANT_CASE, Title Case, обычное предложение,
          нижний и верхний регистр. Вставьте имя переменной, заголовок или фразу — и
          сразу получите все варианты с кнопкой копирования у каждого. Удобно при
          переходе между языками и соглашениями: из camelCase в snake_case для Python,
          из заголовка в kebab-case для URL или из чего угодно в CONSTANT_CASE для
          переменных окружения.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Текст не отправляется на
          сервер, поэтому инструмент безопасен для имён внутренних переменных, ключей
          и любых других конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Вставьте или введите текст в поле слева — преобразование идёт на лету.</li>
          <li>Справа появятся все девять вариантов регистра.</li>
          <li>Нажмите <code>Копировать</code> рядом с нужным стилем, чтобы скопировать его.</li>
          <li>Используйте <code>Пример</code>, чтобы попробовать сразу, или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Как работает разбиение на слова</h2>
        <p>
          Главное в любом конвертере регистра — корректный токенизатор. Этот инструмент
          разбивает ввод не только по пробелам, дефисам и подчёркиваниям, но и по
          границам внутри <code>camelCase</code> и <code>PascalCase</code>, по
          аббревиатурам (<code>JSONData</code> → <code>JSON</code>, <code>Data</code>) и
          по переходам между буквами и цифрами (<code>user2name</code> →
          <code>user</code>, <code>2</code>, <code>name</code>). Благодаря этому
          смешанный ввод вроде <code>helloWorld foo-bar BAZ_qux</code> сначала
          превращается в чистый список слов, а затем собирается в нужном стиле.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен URL-безопасный вариант? Откройте
          <NuxtLink :to="localePath('/slug-generator')">генератор slug</NuxtLink>.
          Посчитать символы и слова поможет
          <NuxtLink :to="localePath('/text-counter')">счётчик текста</NuxtLink>, а
          сравнить две версии текста — <NuxtLink :to="localePath('/diff-checker')">diff-чекер</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online case converter: camelCase, snake_case, kebab-case and more</h2>
        <p>
          This free <strong>case converter</strong> instantly transforms any text into
          nine popular naming styles: camelCase, PascalCase, snake_case, kebab-case,
          CONSTANT_CASE, Title Case, Sentence case, lower case and UPPER CASE. Paste a
          variable name, a title or a phrase and get every variant at once, each with
          its own copy button. It is handy when moving between languages and
          conventions — from camelCase to snake_case for Python, from a title to
          kebab-case for a URL, or from anything to CONSTANT_CASE for environment
          variables.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your text is never
          sent to a server, so it is safe to convert internal variable names, keys and
          any other sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Paste or type your text into the field on the left — it converts as you type.</li>
          <li>All nine case variants appear on the right.</li>
          <li>Click <code>Copy</code> next to the style you need to grab it.</li>
          <li>Use <code>Sample</code> to try it instantly, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>How the word splitting works</h2>
        <p>
          The heart of any case converter is a solid tokenizer. This tool splits input
          not only on spaces, hyphens and underscores, but also at boundaries inside
          <code>camelCase</code> and <code>PascalCase</code>, at acronyms
          (<code>JSONData</code> → <code>JSON</code>, <code>Data</code>) and at
          letter-to-digit boundaries (<code>user2name</code> → <code>user</code>,
          <code>2</code>, <code>name</code>). As a result, mixed input like
          <code>helloWorld foo-bar BAZ_qux</code> is first reduced to a clean list of
          words and then reassembled in the style you want.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a URL-safe version? Open the
          <NuxtLink :to="localePath('/slug-generator')">slug generator</NuxtLink>.
          Count characters and words with the
          <NuxtLink :to="localePath('/text-counter')">text counter</NuxtLink>, or compare
          two versions of your text with the
          <NuxtLink :to="localePath('/diff-checker')">diff checker</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
