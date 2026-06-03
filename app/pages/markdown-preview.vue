<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const showHtml = ref(false)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        markdown: 'Markdown',
        preview: 'Просмотр',
        showHtml: 'Показать HTML',
        hideHtml: 'Скрыть HTML',
        htmlOutput: 'HTML-вывод (очищенный)',
        copyHtml: 'Копировать HTML',
        previewEmpty: 'Отрендеренный Markdown появится здесь.',
        rendering: 'Рендерим Markdown…',
        placeholder: '# Привет\n\n**жирный** текст и [ссылка](https://example.com)',
      }
    : {
        markdown: 'Markdown',
        preview: 'Preview',
        showHtml: 'Show HTML',
        hideHtml: 'Hide HTML',
        htmlOutput: 'HTML output (sanitized)',
        copyHtml: 'Copy HTML',
        previewEmpty: 'Rendered Markdown will appear here.',
        rendering: 'Rendering Markdown…',
        placeholder: '# Hello\n\n**bold** text and a [link](https://example.com)',
      },
)

const charCount = computed(() => input.value.length)

// DOMPurify needs the DOM, so the sanitized HTML is produced on the client only.
// Start empty (stable across server/client), then fill in via a client-guarded
// watcher. marked.parse is synchronous; sanitization keeps v-html safe.
const html = ref('')

function render(md: string) {
  // marked.parse is sync for string input; sanitize before it ever hits v-html.
  const raw = marked.parse(md, { async: false }) as string
  return DOMPurify.sanitize(raw)
}

watch(
  input,
  (md) => {
    if (import.meta.client) html.value = render(md)
  },
  { immediate: true },
)

function clear() {
  input.value = ''
}

const sample = `# Markdown Preview

Write **Markdown** on the left and see the *rendered* HTML on the right.

## Features

- Headings, **bold** and _italic_
- Lists, like this one
- [Links](https://example.com)
- Inline \`code\` and code blocks

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`
}
\`\`\`

> Blockquotes work too.
`

function loadSample() {
  input.value = sample
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my Markdown sent to a server?',
    a: 'No. The Markdown is parsed and rendered entirely in your browser with the marked library, and the resulting HTML is sanitized with DOMPurify before display. Nothing is uploaded, logged, or stored, so it is safe for private notes, drafts and documentation.',
  },
  {
    q: 'Which Markdown flavour is supported?',
    a: 'The preview uses marked, which follows the CommonMark spec with GitHub-flavoured extensions such as fenced code blocks, tables and task lists. Headings, bold and italic text, links, images, blockquotes, ordered and unordered lists and inline code all render as expected.',
  },
  {
    q: 'Is the rendered HTML safe to paste into my site?',
    a: 'Yes. Every render is passed through DOMPurify, which strips dangerous markup like inline event handlers (onerror, onclick), <script> tags and javascript: URLs. The HTML output panel shows exactly this sanitized string, so what you copy is what was made safe.',
  },
  {
    q: 'How do I get the generated HTML?',
    a: 'Click Show HTML to reveal the secondary panel containing the sanitized HTML string, then use the Copy HTML button. The visual preview and the HTML output always stay in sync as you type.',
  },
  {
    q: 'Does it work offline?',
    a: 'Yes. Once the page has loaded, all parsing, sanitization and rendering happen locally in JavaScript, so the previewer keeps working without a network connection and never round-trips your text.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой Markdown на сервер?',
    a: 'Нет. Markdown разбирается и рендерится полностью в браузере библиотекой marked, а получившийся HTML очищается через DOMPurify перед показом. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для личных заметок, черновиков и документации.',
  },
  {
    q: 'Какой диалект Markdown поддерживается?',
    a: 'Просмотр использует marked, который следует спецификации CommonMark с расширениями в стиле GitHub: блоки кода с ограждением, таблицы и списки задач. Заголовки, жирный и курсивный текст, ссылки, изображения, цитаты, нумерованные и маркированные списки и инлайновый код рендерятся ожидаемо.',
  },
  {
    q: 'Безопасно ли вставлять отрендеренный HTML к себе на сайт?',
    a: 'Да. Каждый рендер проходит через DOMPurify, который вырезает опасную разметку: инлайновые обработчики событий (onerror, onclick), теги <script> и javascript:-ссылки. Панель HTML-вывода показывает именно эту очищенную строку, поэтому вы копируете то, что уже обезврежено.',
  },
  {
    q: 'Как получить сгенерированный HTML?',
    a: 'Нажмите «Показать HTML», чтобы раскрыть дополнительную панель с очищенной строкой HTML, и используйте кнопку «Копировать HTML». Визуальный просмотр и HTML-вывод всегда синхронизированы по мере ввода.',
  },
  {
    q: 'Работает ли инструмент офлайн?',
    a: 'Да. После загрузки страницы весь разбор, очистка и рендеринг происходят локально на JavaScript, поэтому просмотрщик продолжает работать без сети и никогда не отправляет ваш текст наружу.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="markdown-preview" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
      <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="btn-ghost"
          :aria-expanded="showHtml"
          @click="showHtml = !showHtml"
        >{{ showHtml ? ui.hideHtml : ui.showHtml }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="input.trim()">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.markdown }}</span>
        <span class="text-ink-400">· {{ charCount.toLocaleString() }} {{ t('common.characters') }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Editor + live preview -->
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <!-- Left: Markdown input -->
      <div>
        <label class="label" for="md-input">{{ ui.markdown }}</label>
        <textarea
          id="md-input"
          v-model="input"
          class="textarea-code min-h-[24rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.placeholder"
          :aria-label="ui.markdown"
        />
      </div>

      <!-- Right: rendered preview (client-only — DOMPurify needs the DOM) -->
      <div>
        <span class="label">{{ ui.preview }}</span>
        <ClientOnly>
          <div
            v-if="input.trim()"
            class="markdown-body min-h-[24rem] overflow-auto rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-950"
            v-html="html"
          />
          <div
            v-else
            class="grid min-h-[24rem] place-items-center rounded-lg border border-ink-200 bg-white p-4 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950"
          >{{ ui.previewEmpty }}</div>
          <template #fallback>
            <div class="grid min-h-[24rem] place-items-center rounded-lg border border-ink-200 bg-white p-4 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950">
              {{ ui.rendering }}
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>

    <!-- Secondary: sanitized HTML output -->
    <div v-show="showHtml" class="mt-4">
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <span class="label !mb-0">{{ ui.htmlOutput }}</span>
        <CopyButton :text="() => html" :label="ui.copyHtml" small />
      </div>
      <ClientOnly>
        <textarea
          :value="html"
          readonly
          class="textarea-code min-h-[10rem]"
          spellcheck="false"
          :aria-label="ui.htmlOutput"
        />
        <template #fallback>
          <div class="textarea-code grid min-h-[10rem] place-items-center text-ink-400">
            {{ ui.rendering }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Просмотр Markdown онлайн с рендером в HTML</h2>
        <p>
          Этот бесплатный <strong>просмотрщик Markdown</strong> рендерит ваш текст в
          живой предпросмотр и одновременно отдаёт <strong>готовый HTML</strong>,
          который можно скопировать и вставить куда угодно. Слева вы пишете Markdown,
          справа сразу видите результат — удобно для README, заметок, постов в блог и
          документации.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>: разбор выполняет
          библиотека marked, а итоговый HTML очищается через DOMPurify перед показом.
          Ваш текст никуда не отправляется, поэтому инструмент безопасен для черновиков
          и конфиденциальных материалов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите или вставьте Markdown в левое поле — предпросмотр обновляется на лету.</li>
          <li>Смотрите отрендеренный результат в правой панели по мере набора.</li>
          <li>Нажмите <code>Показать HTML</code>, чтобы увидеть очищенную строку HTML.</li>
          <li>Используйте <code>Копировать HTML</code>, чтобы забрать готовую разметку.</li>
          <li>Нажмите <code>Пример</code> для демо или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Почему HTML очищается</h2>
        <p>
          Markdown допускает встроенный HTML, а значит может содержать опасные
          конструкции — теги <code>&lt;script&gt;</code>, обработчики вроде
          <code>onerror</code> или ссылки <code>javascript:</code>. Перед тем как
          показать результат через <code>v-html</code>, инструмент пропускает разметку
          через <strong>DOMPurify</strong>, который вырезает такой код. Поэтому и
          предпросмотр, и HTML-вывод всегда безопасны для повторного использования.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Сравните две версии текста в
          <NuxtLink :to="localePath('/diff-checker')">проверке различий</NuxtLink>,
          посчитайте слова и символы в
          <NuxtLink :to="localePath('/text-counter')">счётчике текста</NuxtLink>
          или приведите заголовки к нужному виду в
          <NuxtLink :to="localePath('/case-converter')">конвертере регистра</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Preview Markdown online with live HTML rendering</h2>
        <p>
          This free <strong>Markdown previewer</strong> renders your text into a live
          preview while also giving you the <strong>generated HTML</strong> to copy and
          paste anywhere. Write Markdown on the left and watch the result update on the
          right — handy for READMEs, notes, blog posts and documentation.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>: parsing is handled
          by the marked library and the resulting HTML is sanitized with DOMPurify
          before display. Your text is never sent anywhere, so it is safe for drafts and
          confidential material.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type or paste Markdown into the left pane — the preview updates as you go.</li>
          <li>See the rendered result in the right pane in real time.</li>
          <li>Click <code>Show HTML</code> to reveal the sanitized HTML string.</li>
          <li>Use <code>Copy HTML</code> to grab the ready-to-use markup.</li>
          <li>Click <code>Sample</code> for a demo, or <code>Clear</code> to start fresh.</li>
        </ul>

        <h2>Why the HTML is sanitized</h2>
        <p>
          Markdown allows raw embedded HTML, which means it can carry dangerous
          constructs — <code>&lt;script&gt;</code> tags, handlers like
          <code>onerror</code>, or <code>javascript:</code> URLs. Before the result is
          shown through <code>v-html</code>, the markup is passed through
          <strong>DOMPurify</strong>, which strips that code out. As a result both the
          preview and the HTML output are always safe to reuse.
        </p>

        <h2>Related tools</h2>
        <p>
          Compare two versions of text in the
          <NuxtLink :to="localePath('/diff-checker')">Diff checker</NuxtLink>,
          count words and characters with the
          <NuxtLink :to="localePath('/text-counter')">Text counter</NuxtLink>,
          or reshape headings with the
          <NuxtLink :to="localePath('/case-converter')">Case converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>

<style scoped>
/* Scoped readable styling for the rendered preview pane only. */
.markdown-body :deep(h1) {
  @apply mb-3 mt-5 text-2xl font-bold first:mt-0;
}
.markdown-body :deep(h2) {
  @apply mb-2 mt-5 text-xl font-semibold first:mt-0;
}
.markdown-body :deep(h3) {
  @apply mb-2 mt-4 text-base font-semibold;
}
.markdown-body :deep(p) {
  @apply mb-3 leading-relaxed;
}
.markdown-body :deep(ul) {
  @apply mb-3 list-disc space-y-1 pl-6;
}
.markdown-body :deep(ol) {
  @apply mb-3 list-decimal space-y-1 pl-6;
}
.markdown-body :deep(a) {
  @apply font-medium text-accent hover:underline;
}
.markdown-body :deep(strong) {
  @apply font-semibold;
}
.markdown-body :deep(em) {
  @apply italic;
}
.markdown-body :deep(blockquote) {
  @apply my-3 border-l-4 border-ink-200 pl-4 italic text-ink-500 dark:border-ink-700 dark:text-ink-400;
}
.markdown-body :deep(code) {
  @apply rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-800 dark:bg-ink-800 dark:text-ink-100;
}
.markdown-body :deep(pre) {
  @apply my-3 overflow-auto rounded-lg bg-ink-900 p-3 dark:bg-ink-950;
}
.markdown-body :deep(pre code) {
  @apply bg-transparent p-0 text-ink-100;
}
.markdown-body :deep(table) {
  @apply my-3 w-full border-collapse text-sm;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  @apply border border-ink-200 px-3 py-1.5 text-left dark:border-ink-700;
}
.markdown-body :deep(img) {
  @apply max-w-full rounded;
}
.markdown-body :deep(hr) {
  @apply my-4 border-ink-200 dark:border-ink-700;
}
</style>
