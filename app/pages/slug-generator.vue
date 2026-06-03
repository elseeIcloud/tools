<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const separator = ref<'-' | '_'>('-')
const lowercase = ref(true)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        title: 'Заголовок',
        separator: 'Разделитель',
        hyphen: 'Дефис ( - )',
        underscore: 'Подчёркивание ( _ )',
        lowercase: 'Нижний регистр',
        slug: 'Slug',
        empty: 'Slug появится здесь.',
        placeholder: 'Например: Привет, мир!',
      }
    : {
        title: 'Title',
        separator: 'Separator',
        hyphen: 'Hyphen ( - )',
        underscore: 'Underscore ( _ )',
        lowercase: 'Lowercase',
        slug: 'Slug',
        empty: 'Your slug will appear here.',
        placeholder: 'e.g. Hello, world!',
      },
)

// Russian Cyrillic -> Latin transliteration (GOST-style, URL-friendly).
const CYRILLIC: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E', Ж: 'Zh',
  З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'Ts',
  Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu',
  Я: 'Ya',
}

function transliterate(text: string): string {
  let out = ''
  for (const ch of text) out += ch in CYRILLIC ? CYRILLIC[ch] : ch
  return out
}

function slugify(text: string, sep: '-' | '_', lower: boolean): string {
  // 1. Transliterate Cyrillic -> Latin (RU audience).
  let s = transliterate(text)
  // 2. Strip diacritics: decompose, then drop combining marks.
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
  // 3. Optional lowercase.
  if (lower) s = s.toLowerCase()
  // 4. Any run of non-alphanumerics (incl. spaces/underscores) -> separator.
  s = s.replace(/[^a-zA-Z0-9]+/g, sep)
  // 5. Trim leading/trailing separators.
  const trim = sep === '-' ? /^-+|-+$/g : /^_+|_+$/g
  return s.replace(trim, '')
}

const slug = computed(() => slugify(input.value, separator.value, lowercase.value))

function clear() {
  input.value = ''
}

function loadSample() {
  input.value = 'Привет, мир! 10 советов по SEO в 2024 году'
}

const faqEn: FaqItem[] = [
  {
    q: 'What is a URL slug?',
    a: 'A slug is the human-readable part of a URL that identifies a page, like "my-first-post" in /blog/my-first-post. Good slugs are lowercase, use only letters, digits and separators, and describe the page content, which helps both readers and search engines.',
  },
  {
    q: 'Does it transliterate Russian (Cyrillic) text?',
    a: 'Yes. Cyrillic letters are converted to their Latin equivalents (for example "Привет" becomes "privet") before the slug is built, so a Russian title produces a clean ASCII slug instead of percent-encoded characters.',
  },
  {
    q: 'Should I use hyphens or underscores?',
    a: 'Hyphens are recommended for URLs: Google treats a hyphen as a word separator, while an underscore joins words together. Use underscores only when a system or filename convention requires them. The default here is the hyphen.',
  },
  {
    q: 'Is my text sent to a server?',
    a: 'No. The slug is generated entirely in your browser with JavaScript. Nothing you type is uploaded, logged or stored, so it is safe to use with unpublished titles, internal page names or anything confidential.',
  },
  {
    q: 'How are accented and special characters handled?',
    a: 'Accents are removed by normalizing the text (é becomes e), and any run of spaces, punctuation or other non-alphanumeric characters collapses into a single separator. Leading and trailing separators are trimmed automatically.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Что такое URL-slug?',
    a: 'Slug — это человекопонятная часть URL, которая обозначает страницу, например "my-first-post" в адресе /blog/my-first-post. Хороший slug в нижнем регистре, содержит только буквы, цифры и разделители и описывает содержимое страницы — это удобно и читателям, и поисковым системам.',
  },
  {
    q: 'Транслитерируется ли русский текст (кириллица)?',
    a: 'Да. Кириллические буквы переводятся в латиницу (например, «Привет» становится "privet") перед сборкой slug, поэтому из русского заголовка получается чистый ASCII-slug вместо percent-кодированных символов.',
  },
  {
    q: 'Дефис или подчёркивание — что выбрать?',
    a: 'Для URL рекомендуется дефис: Google считает дефис разделителем слов, а подчёркивание склеивает слова вместе. Подчёркивание используйте только там, где этого требует система или соглашение об именах файлов. По умолчанию здесь дефис.',
  },
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Slug формируется полностью в браузере на JavaScript. Ничего из введённого не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для неопубликованных заголовков, внутренних имён страниц и любых конфиденциальных данных.',
  },
  {
    q: 'Как обрабатываются символы с диакритикой и спецсимволы?',
    a: 'Диакритика убирается нормализацией текста (é становится e), а любая последовательность пробелов, знаков препинания и прочих не буквенно-цифровых символов сворачивается в один разделитель. Лишние разделители в начале и конце обрезаются автоматически.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="slug-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.separator }}
        <select v-model="separator" class="field !w-auto !py-1.5" :aria-label="ui.separator">
          <option value="-">{{ ui.hyphen }}</option>
          <option value="_">{{ ui.underscore }}</option>
        </select>
      </label>

      <label class="ml-1 inline-flex cursor-pointer items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="lowercase" type="checkbox" class="h-4 w-4 accent-accent" />
        {{ ui.lowercase }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Title input -->
    <div class="mt-4">
      <label class="label" for="slug-title">{{ ui.title }}</label>
      <input
        id="slug-title"
        v-model="input"
        type="text"
        class="field !font-sans"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
      />
    </div>

    <!-- Slug output -->
    <div class="mt-4">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="label !mb-0">{{ ui.slug }}</span>
        <CopyButton :text="() => slug" small />
      </div>
      <div
        class="min-h-[3rem] break-all rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-sm dark:border-ink-700 dark:bg-ink-950"
      >
        <span v-if="slug" class="text-accent">{{ slug }}</span>
        <span v-else class="text-ink-400">{{ ui.empty }}</span>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор slug: чистые URL из любого заголовка</h2>
        <p>
          Этот бесплатный <strong>генератор slug</strong> превращает заголовок,
          название статьи или товара в аккуратный, URL-безопасный slug. Он
          транслитерирует кириллицу в латиницу, убирает диакритику, приводит текст
          к нижнему регистру и заменяет пробелы и знаки препинания на разделитель.
          Сделан для разработчиков и контент-менеджеров, которым нужны предсказуемые
          человекопонятные адреса для блогов, документации и каталогов.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Введённый текст не
          отправляется на сервер, поэтому slug можно генерировать даже из черновых
          и конфиденциальных заголовков.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите заголовок в поле — slug пересчитывается на лету.</li>
          <li>Выберите разделитель: <code>-</code> (по умолчанию) или <code>_</code>.</li>
          <li>Включите или выключите <code>Нижний регистр</code> — по умолчанию включён.</li>
          <li>Нажмите <code>Копировать</code>, чтобы забрать готовый slug.</li>
          <li>Нажмите <code>Пример</code>, чтобы сразу увидеть результат на демо-тексте.</li>
        </ul>

        <h2>Как формируется slug</h2>
        <p>
          Сначала кириллица переводится в латиницу по таблице транслитерации
          («Привет» → <code>privet</code>). Затем текст нормализуется через
          <code>NFKD</code>, и из него удаляются комбинируемые диакритические знаки,
          так что <code>é</code> превращается в <code>e</code>. Любая
          последовательность не буквенно-цифровых символов (пробелы, подчёркивания,
          пунктуация) сворачивается в один разделитель, а лишние разделители в
          начале и конце обрезаются. Дефис предпочтительнее: поисковые системы
          считают его границей слова, тогда как подчёркивание склеивает слова.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен другой стиль написания? Откройте
          <NuxtLink :to="localePath('/case-converter')">конвертер регистра</NuxtLink>
          для camelCase и snake_case, закодируйте параметры в
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщике</NuxtLink>
          или сгенерируйте текст-рыбу в
          <NuxtLink :to="localePath('/lorem-ipsum-generator')">генераторе Lorem Ipsum</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Slug generator: clean URLs from any title</h2>
        <p>
          This free <strong>slug generator</strong> turns a title, article name or
          product name into a tidy, URL-safe slug. It transliterates Cyrillic to
          Latin, strips diacritics, lowercases the text and replaces spaces and
          punctuation with a separator. It is built for developers and content
          editors who need predictable, human-readable URLs for blogs,
          documentation and catalogs.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The text you
          type is never sent to a server, so you can safely slugify draft titles
          and confidential page names.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type a title in the field — the slug updates as you type.</li>
          <li>Pick a separator: <code>-</code> (default) or <code>_</code>.</li>
          <li>Toggle <code>Lowercase</code> on or off — it is on by default.</li>
          <li>Click <code>Copy</code> to grab the finished slug.</li>
          <li>Click <code>Sample</code> to see the result on demo text instantly.</li>
        </ul>

        <h2>How the slug is built</h2>
        <p>
          First, Cyrillic is transliterated to Latin from a built-in map
          («Привет» → <code>privet</code>). The text is then normalized with
          <code>NFKD</code> and combining diacritic marks are removed, so
          <code>é</code> becomes <code>e</code>. Any run of non-alphanumeric
          characters (spaces, underscores, punctuation) collapses into a single
          separator, and leading or trailing separators are trimmed. Hyphens are
          preferred because search engines treat them as word boundaries, while
          underscores join words together.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a different naming style? Open the
          <NuxtLink :to="localePath('/case-converter')">case converter</NuxtLink>
          for camelCase and snake_case, encode parameters with the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          or generate filler copy with the
          <NuxtLink :to="localePath('/lorem-ipsum-generator')">Lorem Ipsum generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
