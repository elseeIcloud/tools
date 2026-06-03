<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Soft warning threshold (~1.5 MB) — large data URIs bloat HTML/CSS.
const SOFT_WARN_BYTES = 1.5 * 1024 * 1024

interface ImageInfo {
  name: string
  size: number
  mime: string
  dataUri: string
}

// No output until the user picks a file, so the initial render is the
// deterministic empty state — safe for SSG, no ClientOnly needed.
const info = ref<ImageInfo | null>(null)
const error = ref<string | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Tool-specific labels (common verbs like Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        dropTitle: 'Перетащите изображение сюда',
        dropHint: 'или нажмите, чтобы выбрать файл',
        dropFormats: 'PNG, JPG, GIF, WebP, SVG, AVIF и другие',
        chooseFile: 'Выбрать файл',
        preview: 'Превью',
        fileName: 'Имя файла',
        fileSize: 'Размер',
        mimeType: 'Тип (MIME)',
        dataUri: 'Data URI (Base64)',
        cssSnippet: 'CSS-сниппет',
        notImage: 'Это не изображение. Выберите файл изображения (PNG, JPG, GIF, WebP, SVG и т. п.).',
        readError: 'Не удалось прочитать файл. Попробуйте другое изображение.',
        sizeWarn: 'Файл большой — итоговый data URI будет ещё крупнее (Base64 добавляет ~33%) и может замедлить загрузку CSS или HTML.',
        startHint: 'Перетащите или выберите изображение, чтобы получить его data URI.',
        previewAlt: 'Превью выбранного изображения',
      }
    : {
        dropTitle: 'Drop an image here',
        dropHint: 'or click to choose a file',
        dropFormats: 'PNG, JPG, GIF, WebP, SVG, AVIF and more',
        chooseFile: 'Choose file',
        preview: 'Preview',
        fileName: 'File name',
        fileSize: 'Size',
        mimeType: 'Type (MIME)',
        dataUri: 'Data URI (Base64)',
        cssSnippet: 'CSS snippet',
        notImage: 'That is not an image. Pick an image file (PNG, JPG, GIF, WebP, SVG, etc.).',
        readError: 'Could not read the file. Try a different image.',
        sizeWarn: 'This file is large — the resulting data URI will be even bigger (Base64 adds about 33%) and may slow down CSS or HTML loading.',
        startHint: 'Drop or choose an image to get its data URI.',
        previewAlt: 'Preview of the selected image',
      },
)

const cssSnippet = computed(() =>
  info.value ? `background-image: url(${info.value.dataUri});` : '',
)

const showSizeWarning = computed(() => !!info.value && info.value.size > SOFT_WARN_BYTES)

/** Human-readable byte size, e.g. 12.3 KB. Pure — safe anywhere. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`
}

// FileReader / drag events only fire from user interaction — strictly client-side.
function handleFile(file: File) {
  error.value = null
  if (!file.type.startsWith('image/')) {
    info.value = null
    error.value = ui.value.notImage
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result !== 'string') {
      error.value = ui.value.readError
      return
    }
    info.value = {
      name: file.name,
      size: file.size,
      mime: file.type,
      dataUri: result,
    }
  }
  reader.onerror = () => {
    info.value = null
    error.value = ui.value.readError
  }
  reader.readAsDataURL(file)
}

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
  // Allow re-selecting the same file consecutively.
  target.value = ''
}

function onDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function openPicker() {
  fileInput.value?.click()
}

function clear() {
  info.value = null
  error.value = null
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. The image is read with the browser\'s FileReader API and encoded to Base64 entirely on your device. Nothing is uploaded, logged or stored, so it is safe for private artwork, screenshots or internal assets.',
  },
  {
    q: 'What is a data URI and when should I use one?',
    a: 'A data URI embeds the file bytes directly in a string like data:image/png;base64,…, so the image travels inside your HTML or CSS instead of as a separate request. It is great for small icons, sprites or email-safe images because it removes an extra round-trip — but it inflates the file it lives in.',
  },
  {
    q: 'Why is the Base64 string larger than my original file?',
    a: 'Base64 represents three bytes with four ASCII characters, so the encoded text is roughly 33% larger than the raw image. That overhead is why data URIs are best for small images; for large files a normal <img src> or CSS url() to a real file is usually faster.',
  },
  {
    q: 'Which image formats are supported?',
    a: 'Any format your browser recognises as an image — PNG, JPEG, GIF, WebP, AVIF and SVG all work. The tool simply checks the file\'s MIME type, reads the bytes and outputs the matching data:<mime>;base64 URI; it does not re-encode or recompress the image.',
  },
  {
    q: 'How do I use the data URI in CSS or HTML?',
    a: 'Paste the full data URI into the src attribute of an <img> tag, or use the ready-made background-image: url(…) snippet in a CSS rule. Both work offline and need no separate file, which is handy for self-contained components or theme assets.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружается ли моё изображение на сервер?',
    a: 'Нет. Изображение читается через браузерный API FileReader и кодируется в Base64 целиком на вашем устройстве. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для приватных изображений, скриншотов и внутренних ассетов.',
  },
  {
    q: 'Что такое data URI и когда его использовать?',
    a: 'Data URI встраивает байты файла прямо в строку вида data:image/png;base64,…, поэтому изображение живёт внутри вашего HTML или CSS, а не загружается отдельным запросом. Это удобно для маленьких иконок, спрайтов и изображений в письмах, так как убирает лишний запрос — но увеличивает размер файла, в который встроено.',
  },
  {
    q: 'Почему строка Base64 больше исходного файла?',
    a: 'Base64 представляет три байта четырьмя ASCII-символами, поэтому закодированный текст примерно на 33% больше исходного изображения. Из-за этого data URI лучше всего подходят для маленьких картинок; для крупных файлов обычный <img src> или CSS url() к настоящему файлу обычно быстрее.',
  },
  {
    q: 'Какие форматы изображений поддерживаются?',
    a: 'Любой формат, который браузер распознаёт как изображение — PNG, JPEG, GIF, WebP, AVIF и SVG. Инструмент просто проверяет MIME-тип файла, читает байты и выдаёт соответствующий data:<mime>;base64 URI; он не перекодирует и не пережимает изображение.',
  },
  {
    q: 'Как использовать data URI в CSS или HTML?',
    a: 'Вставьте полный data URI в атрибут src тега <img> или используйте готовый сниппет background-image: url(…) в правиле CSS. Оба варианта работают офлайн и не требуют отдельного файла, что удобно для самодостаточных компонентов или ассетов темы.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="image-to-base64" :faq="faq">
    <!-- Dropzone -->
    <div
      class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors"
      :class="dragOver
        ? 'border-accent bg-accent/5'
        : 'border-ink-300 bg-ink-50 hover:border-accent dark:border-ink-700 dark:bg-ink-950'"
      role="button"
      tabindex="0"
      :aria-label="ui.dropTitle"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="dragOver = true"
      @dragenter.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <span class="mb-3 text-3xl" aria-hidden="true">🖼</span>
      <p class="font-medium text-ink-800 dark:text-ink-100">{{ ui.dropTitle }}</p>
      <p class="mt-1 text-sm text-ink-500 dark:text-ink-400">{{ ui.dropHint }}</p>
      <p class="mt-1 text-xs text-ink-400">{{ ui.dropFormats }}</p>
      <button type="button" class="btn-primary mt-4" @click.stop="openPicker">{{ ui.chooseFile }}</button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onInputChange"
      />
    </div>

    <!-- Error -->
    <p
      v-if="error"
      class="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
      role="alert"
    >
      {{ error }}
    </p>

    <!-- Start hint -->
    <p v-else-if="!info" class="mt-3 text-sm text-ink-400">{{ ui.startHint }}</p>

    <!-- Result -->
    <div v-if="info" class="mt-5 space-y-5">
      <!-- Size warning -->
      <p
        v-if="showSizeWarning"
        class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
      >
        ⚠ {{ ui.sizeWarn }}
      </p>

      <div class="flex flex-col gap-5 sm:flex-row">
        <!-- Preview -->
        <div class="sm:w-48 sm:shrink-0">
          <p class="label">{{ ui.preview }}</p>
          <div class="grid place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
            <img
              :src="info.dataUri"
              :alt="ui.previewAlt"
              class="max-h-48 max-w-full object-contain"
            />
          </div>
        </div>

        <!-- Metadata -->
        <dl class="grid flex-1 grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-sm">
          <dt class="text-ink-500 dark:text-ink-400">{{ ui.fileName }}</dt>
          <dd class="break-all font-medium text-ink-800 dark:text-ink-100">{{ info.name }}</dd>
          <dt class="text-ink-500 dark:text-ink-400">{{ ui.fileSize }}</dt>
          <dd class="font-medium text-ink-800 dark:text-ink-100">{{ formatBytes(info.size) }}</dd>
          <dt class="text-ink-500 dark:text-ink-400">{{ ui.mimeType }}</dt>
          <dd class="break-all font-mono text-ink-800 dark:text-ink-100">{{ info.mime }}</dd>
        </dl>
      </div>

      <!-- Data URI -->
      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="label !mb-0">{{ ui.dataUri }}</span>
          <CopyButton :text="() => info!.dataUri" small />
        </div>
        <textarea
          :value="info.dataUri"
          readonly
          class="textarea-code min-h-[8rem] break-all"
          spellcheck="false"
          :aria-label="ui.dataUri"
        />
      </div>

      <!-- CSS snippet -->
      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="label !mb-0">{{ ui.cssSnippet }}</span>
          <CopyButton :text="() => cssSnippet" small />
        </div>
        <textarea
          :value="cssSnippet"
          readonly
          class="textarea-code min-h-[5rem] break-all"
          spellcheck="false"
          :aria-label="ui.cssSnippet"
        />
      </div>

      <div class="flex">
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Преобразование изображения в Base64 и data URI онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер изображений в Base64</strong> читает
          вашу картинку прямо в браузере и выдаёт готовый
          <strong>data URI</strong> — строку вида
          <code>data:image/png;base64,…</code>, которую можно вставить в CSS или
          HTML без отдельного файла. Перетащите PNG, JPG, GIF, WebP, SVG или AVIF и
          сразу получите превью, имя, размер, MIME-тип, полный data URI и готовый
          CSS-сниппет.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Изображение не
          загружается на сервер, не логируется и не сохраняется — поэтому
          инструмент безопасен для приватных скриншотов, макетов и внутренних
          ассетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Перетащите изображение в область или нажмите <code>Выбрать файл</code>.</li>
          <li>Посмотрите превью, имя файла, размер и MIME-тип.</li>
          <li>Скопируйте полный <code>data URI</code> кнопкой <code>Копировать</code>.</li>
          <li>Или возьмите готовый сниппет <code>background-image: url(…)</code> для CSS.</li>
          <li>Нажмите <code>Очистить</code>, чтобы загрузить другое изображение.</li>
        </ul>

        <h2>Когда data URI помогает, а когда вредит</h2>
        <p>
          Встраивание через data URI убирает лишний сетевой запрос, поэтому удобно
          для маленьких иконок, спрайтов и изображений в письмах. Но Base64
          увеличивает размер примерно на 33%, а встроенные данные нельзя кэшировать
          отдельно от страницы. Для крупных изображений обычно быстрее обычный
          <code>&lt;img src&gt;</code> или CSS <code>url()</code> к настоящему файлу
          — поэтому для больших файлов показывается мягкое предупреждение.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно закодировать обычный текст? Используйте
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик/декодировщик Base64</NuxtLink>.
          Готовите ссылки и параметры — попробуйте
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщик</NuxtLink>,
          а подобрать цвета фона поможет
          <NuxtLink :to="localePath('/color-converter')">конвертер цветов</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert an image to Base64 and a data URI online</h2>
        <p>
          This free <strong>image to Base64 converter</strong> reads your picture
          right in the browser and produces a ready-to-use
          <strong>data URI</strong> — a string like
          <code>data:image/png;base64,…</code> that you can paste into CSS or HTML
          without a separate file. Drop a PNG, JPG, GIF, WebP, SVG or AVIF and
          instantly get a preview, the name, size and MIME type, the full data URI,
          and a ready-made CSS snippet.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The image is
          never uploaded, logged or stored, so it is safe for private screenshots,
          mockups and internal assets.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Drag an image onto the dropzone, or click <code>Choose file</code>.</li>
          <li>Review the preview, file name, size and MIME type.</li>
          <li>Copy the full <code>data URI</code> with the <code>Copy</code> button.</li>
          <li>Or grab the ready <code>background-image: url(…)</code> snippet for CSS.</li>
          <li>Click <code>Clear</code> to load a different image.</li>
        </ul>

        <h2>When data URIs help — and when they hurt</h2>
        <p>
          Inlining with a data URI removes an extra network request, which is handy
          for small icons, sprites and email-safe images. But Base64 adds about 33%
          to the size, and inlined bytes cannot be cached separately from the page.
          For large images a plain <code>&lt;img src&gt;</code> or CSS
          <code>url()</code> to a real file is usually faster — which is why a soft
          warning appears for big files.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to encode plain text? Use the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>.
          Building links and parameters? Try the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          and pick matching background colors with the
          <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
