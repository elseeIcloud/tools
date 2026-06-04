<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type TargetFormat = 'png' | 'jpeg' | 'webp'

interface SourceInfo {
  name: string
  size: number
  mime: string
  dataUri: string
  width: number
  height: number
}

interface ConvertResult {
  blobUrl: string
  size: number
  mime: string
  ext: string
}

// No file until the user picks one, so the initial render is the deterministic
// empty state — safe for SSG, no window/canvas/File touched at the top level.
const source = ref<SourceInfo | null>(null)
const result = ref<ConvertResult | null>(null)
const error = ref<string | null>(null)
const dragOver = ref(false)
const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const targetFormat = ref<TargetFormat>('png')
const quality = ref(90)
const bgColor = ref('#ffffff')

// JPEG and WebP are lossy and accept a quality value; PNG ignores it.
const supportsQuality = computed(() => targetFormat.value !== 'png')
// Only JPEG is fully opaque, so transparency must be flattened onto a color.
const needsBackground = computed(() => targetFormat.value === 'jpeg')

const formatLabels: Record<TargetFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

const targetMime = computed(() => `image/${targetFormat.value}`)

// Tool-specific labels (common verbs like Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        dropTitle: 'Перетащите изображение сюда',
        dropHint: 'или нажмите, чтобы выбрать файл',
        dropFormats: 'PNG, JPG, WebP, GIF, BMP и другие',
        chooseFile: 'Выбрать файл',
        targetFormat: 'Целевой формат',
        quality: 'Качество',
        background: 'Фон (для прозрачных областей)',
        bgNote: 'JPEG не поддерживает прозрачность — прозрачные пиксели зальются этим цветом.',
        convert: 'Конвертировать',
        converting: 'Конвертация…',
        download: 'Скачать',
        original: 'Оригинал',
        converted: 'Результат',
        format: 'Формат',
        size: 'Размер',
        dimensions: 'Размеры',
        preview: 'Превью',
        sizeDelta: 'Изменение размера',
        notImage: 'Это не изображение. Выберите файл изображения (PNG, JPG, WebP, GIF и т. п.).',
        readError: 'Не удалось прочитать файл. Попробуйте другое изображение.',
        decodeError: 'Не удалось декодировать изображение. Возможно, формат не поддерживается браузером.',
        convertError: 'Браузер не смог сохранить изображение в выбранном формате. Попробуйте другой формат.',
        startHint: 'Перетащите или выберите изображение, выберите целевой формат и нажмите «Конвертировать».',
        previewAlt: 'Превью сконвертированного изображения',
        sourceAlt: 'Превью исходного изображения',
        smaller: 'меньше',
        larger: 'больше',
        same: 'без изменений',
      }
    : {
        dropTitle: 'Drop an image here',
        dropHint: 'or click to choose a file',
        dropFormats: 'PNG, JPG, WebP, GIF, BMP and more',
        chooseFile: 'Choose file',
        targetFormat: 'Target format',
        quality: 'Quality',
        background: 'Background (for transparent areas)',
        bgNote: 'JPEG has no transparency — transparent pixels are filled with this color.',
        convert: 'Convert',
        converting: 'Converting…',
        download: 'Download',
        original: 'Original',
        converted: 'Converted',
        format: 'Format',
        size: 'Size',
        dimensions: 'Dimensions',
        preview: 'Preview',
        sizeDelta: 'Size change',
        notImage: 'That is not an image. Pick an image file (PNG, JPG, WebP, GIF, etc.).',
        readError: 'Could not read the file. Try a different image.',
        decodeError: 'Could not decode the image. The browser may not support this format.',
        convertError: 'The browser could not export the image in the chosen format. Try another format.',
        startHint: 'Drop or choose an image, pick a target format and click Convert.',
        previewAlt: 'Preview of the converted image',
        sourceAlt: 'Preview of the source image',
        smaller: 'smaller',
        larger: 'larger',
        same: 'no change',
      },
)

const sourceFormatLabel = computed(() => {
  if (!source.value) return ''
  const sub = source.value.mime.split('/')[1] ?? source.value.mime
  return sub.toUpperCase()
})

// Pure size comparison; safe in a computed (no DOM, no clock).
const sizeDelta = computed(() => {
  if (!source.value || !result.value) return null
  const diff = result.value.size - source.value.size
  if (diff === 0) return { kind: 'same' as const, percent: 0 }
  const percent = Math.round((Math.abs(diff) / source.value.size) * 100)
  return { kind: diff < 0 ? ('smaller' as const) : ('larger' as const), percent }
})

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

// Revoke a previously created object URL so converted blobs don't leak memory.
function revokeResult() {
  if (result.value) {
    URL.revokeObjectURL(result.value.blobUrl)
    result.value = null
  }
}

// FileReader / Image / canvas only run from user interaction — strictly client-side.
function handleFile(file: File) {
  error.value = null
  revokeResult()
  if (!file.type.startsWith('image/')) {
    source.value = null
    error.value = ui.value.notImage
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const dataUri = reader.result
    if (typeof dataUri !== 'string') {
      source.value = null
      error.value = ui.value.readError
      return
    }
    const img = new Image()
    img.onload = () => {
      source.value = {
        name: file.name,
        size: file.size,
        mime: file.type,
        dataUri,
        width: img.naturalWidth,
        height: img.naturalHeight,
      }
    }
    img.onerror = () => {
      source.value = null
      error.value = ui.value.decodeError
    }
    img.src = dataUri
  }
  reader.onerror = () => {
    source.value = null
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

/** Suggest a download name reusing the source base name with the new extension. */
function downloadName(): string {
  const base = source.value?.name.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}.${result.value?.ext ?? targetFormat.value}`
}

// Draw the decoded source onto a canvas and export it via toBlob.
function convert() {
  if (!source.value || busy.value) return
  error.value = null
  busy.value = true

  const src = source.value
  const img = new Image()
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = src.width
      canvas.height = src.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        error.value = ui.value.convertError
        busy.value = false
        return
      }
      // Flatten transparency onto a solid color before exporting to JPEG.
      if (needsBackground.value) {
        ctx.fillStyle = bgColor.value
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      const mime = targetMime.value
      const ext = targetFormat.value === 'jpeg' ? 'jpg' : targetFormat.value
      const q = supportsQuality.value ? quality.value / 100 : undefined

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            error.value = ui.value.convertError
            busy.value = false
            return
          }
          revokeResult()
          result.value = {
            blobUrl: URL.createObjectURL(blob),
            size: blob.size,
            mime,
            ext,
          }
          busy.value = false
        },
        mime,
        q,
      )
    } catch {
      error.value = ui.value.convertError
      busy.value = false
    }
  }
  img.onerror = () => {
    error.value = ui.value.decodeError
    busy.value = false
  }
  img.src = src.dataUri
}

function clear() {
  revokeResult()
  source.value = null
  error.value = null
  busy.value = false
}

onBeforeUnmount(revokeResult)

const faqEn: FaqItem[] = [
  {
    q: 'Is my image uploaded to a server?',
    a: 'No. The image is read with the browser\'s FileReader API and re-encoded on an in-memory canvas entirely on your device. Nothing is uploaded, logged or stored, so the converter is safe for private photos, screenshots and internal assets.',
  },
  {
    q: 'Which formats can I convert between?',
    a: 'You can convert any image the browser can decode (PNG, JPG, WebP, GIF, BMP and more) into PNG, JPEG or WebP. PNG is lossless and keeps transparency, JPEG is small but opaque, and WebP usually gives the best size-to-quality ratio while still supporting transparency.',
  },
  {
    q: 'What happens to transparency when I convert a PNG to JPEG?',
    a: 'JPEG has no alpha channel, so transparent areas have to be filled with a solid color. The tool lets you pick that background color (white by default) and flattens the transparency onto it before exporting. Convert to PNG or WebP instead if you need to keep transparency.',
  },
  {
    q: 'What does the quality slider do?',
    a: 'For the lossy JPEG and WebP formats the slider sets the encoder quality from 1 to 100 — lower values shrink the file but add visible compression artifacts. PNG is lossless, so the slider is hidden for it. Around 80-90 is a good balance for photos.',
  },
  {
    q: 'Why is the converted file sometimes larger than the original?',
    a: 'Re-encoding does not always shrink a file. Converting an already-optimized JPEG to PNG, for example, removes lossy compression and can balloon the size. The tool shows the original and converted sizes side by side so you can pick the format that actually helps.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружается ли моё изображение на сервер?',
    a: 'Нет. Изображение читается через браузерный API FileReader и перекодируется на canvas в памяти целиком на вашем устройстве. Ничего не загружается, не логируется и не сохраняется, поэтому конвертер безопасен для приватных фото, скриншотов и внутренних ассетов.',
  },
  {
    q: 'Между какими форматами можно конвертировать?',
    a: 'Можно преобразовать любое изображение, которое браузер умеет декодировать (PNG, JPG, WebP, GIF, BMP и другие), в PNG, JPEG или WebP. PNG без потерь и сохраняет прозрачность, JPEG компактный, но непрозрачный, а WebP обычно даёт лучшее соотношение размера и качества и при этом поддерживает прозрачность.',
  },
  {
    q: 'Что происходит с прозрачностью при конвертации PNG в JPEG?',
    a: 'У JPEG нет альфа-канала, поэтому прозрачные области нужно залить сплошным цветом. Инструмент позволяет выбрать этот цвет фона (по умолчанию белый) и накладывает прозрачность на него перед экспортом. Если прозрачность нужно сохранить, конвертируйте в PNG или WebP.',
  },
  {
    q: 'Зачем нужен ползунок качества?',
    a: 'Для форматов с потерями JPEG и WebP ползунок задаёт качество кодировщика от 1 до 100 — меньшие значения уменьшают файл, но добавляют заметные артефакты сжатия. PNG сжимается без потерь, поэтому для него ползунок скрыт. Для фотографий хорошим балансом будет около 80-90.',
  },
  {
    q: 'Почему результат иногда больше исходного файла?',
    a: 'Перекодирование не всегда уменьшает размер. Например, конвертация уже сжатого JPEG в PNG убирает сжатие с потерями и может сильно увеличить файл. Инструмент показывает исходный и итоговый размеры рядом, чтобы вы выбрали формат, который действительно помогает.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="image-format-converter" :faq="faq">
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
      <span class="mb-3 text-3xl" aria-hidden="true">🔄</span>
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
    <p v-else-if="!source" class="mt-3 text-sm text-ink-400">{{ ui.startHint }}</p>

    <!-- Options + conversion -->
    <div v-if="source" class="mt-5 space-y-5">
      <!-- Options -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="ifc-format">{{ ui.targetFormat }}</label>
          <select id="ifc-format" v-model="targetFormat" class="field">
            <option value="png">{{ formatLabels.png }}</option>
            <option value="jpeg">{{ formatLabels.jpeg }}</option>
            <option value="webp">{{ formatLabels.webp }}</option>
          </select>
        </div>

        <div v-if="supportsQuality">
          <label class="label" for="ifc-quality">{{ ui.quality }}: {{ quality }}</label>
          <input
            id="ifc-quality"
            v-model.number="quality"
            type="range"
            min="1"
            max="100"
            class="w-full accent-accent"
          />
        </div>
      </div>

      <!-- Background color (only when flattening to JPEG) -->
      <div v-if="needsBackground">
        <label class="label" for="ifc-bg">{{ ui.background }}</label>
        <div class="flex items-center gap-3">
          <input
            id="ifc-bg"
            v-model="bgColor"
            type="color"
            class="h-9 w-12 cursor-pointer rounded border border-ink-300 bg-white p-0.5 dark:border-ink-700 dark:bg-ink-950"
          />
          <input
            v-model="bgColor"
            type="text"
            class="field !mb-0 max-w-[8rem] font-mono"
            spellcheck="false"
            aria-label="HEX"
          />
        </div>
        <p class="mt-1.5 text-xs text-ink-500 dark:text-ink-400">{{ ui.bgNote }}</p>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-primary" :disabled="busy" @click="convert">
          {{ busy ? ui.converting : ui.convert }}
        </button>
        <a
          v-if="result"
          :href="result.blobUrl"
          :download="downloadName()"
          class="btn-primary"
        >
          {{ ui.download }}
        </a>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>

      <!-- Original vs converted -->
      <div class="grid gap-5 sm:grid-cols-2">
        <!-- Original -->
        <div class="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
          <p class="label">{{ ui.original }}</p>
          <div class="mb-3 grid place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
            <img :src="source.dataUri" :alt="ui.sourceAlt" class="max-h-44 max-w-full object-contain" />
          </div>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.format }}</dt>
            <dd class="font-mono font-medium text-ink-800 dark:text-ink-100">{{ sourceFormatLabel }}</dd>
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.size }}</dt>
            <dd class="font-medium text-ink-800 dark:text-ink-100">{{ formatBytes(source.size) }}</dd>
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.dimensions }}</dt>
            <dd class="font-medium text-ink-800 dark:text-ink-100">{{ source.width }} × {{ source.height }} px</dd>
          </dl>
        </div>

        <!-- Converted -->
        <div class="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
          <p class="label">{{ ui.converted }}</p>
          <div v-if="result" class="mb-3 grid place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
            <img :src="result.blobUrl" :alt="ui.previewAlt" class="max-h-44 max-w-full object-contain" />
          </div>
          <div v-else class="mb-3 grid h-32 place-items-center rounded-lg border border-dashed border-ink-300 text-sm text-ink-400 dark:border-ink-700">
            {{ ui.preview }}
          </div>
          <dl v-if="result" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.format }}</dt>
            <dd class="font-mono font-medium text-ink-800 dark:text-ink-100">{{ formatLabels[targetFormat] }}</dd>
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.size }}</dt>
            <dd class="font-medium text-ink-800 dark:text-ink-100">{{ formatBytes(result.size) }}</dd>
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.sizeDelta }}</dt>
            <dd class="font-medium">
              <span v-if="sizeDelta && sizeDelta.kind === 'smaller'" class="text-green-600 dark:text-green-400">
                −{{ sizeDelta.percent }}% ({{ ui.smaller }})
              </span>
              <span v-else-if="sizeDelta && sizeDelta.kind === 'larger'" class="text-amber-600 dark:text-amber-400">
                +{{ sizeDelta.percent }}% ({{ ui.larger }})
              </span>
              <span v-else class="text-ink-500 dark:text-ink-400">{{ ui.same }}</span>
            </dd>
          </dl>
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер форматов изображений онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер форматов изображений</strong>
          преобразует ваши картинки между <strong>PNG, JPEG и WebP</strong> прямо
          в браузере. Перетащите файл, выберите целевой формат и при необходимости
          настройте качество — а инструмент перерисует изображение на canvas и
          отдаст готовый файл для скачивания.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Изображение не
          загружается на сервер, не логируется и не сохраняется — поэтому конвертер
          безопасен для приватных фото, скриншотов и внутренних ассетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Перетащите изображение в область или нажмите <code>Выбрать файл</code>.</li>
          <li>Выберите целевой формат: <code>PNG</code>, <code>JPEG</code> или <code>WebP</code>.</li>
          <li>Для JPEG и WebP настройте ползунок <code>Качество</code>.</li>
          <li>Для JPEG выберите цвет фона — им зальются прозрачные области.</li>
          <li>Нажмите <code>Конвертировать</code>, сравните размеры и нажмите <code>Скачать</code>.</li>
        </ul>

        <h2>Какой формат выбрать</h2>
        <p>
          <strong>PNG</strong> сжимает без потерь и сохраняет прозрачность —
          идеален для логотипов, иконок и скриншотов с текстом.
          <strong>JPEG</strong> даёт маленькие файлы для фотографий, но не
          поддерживает прозрачность, поэтому прозрачные пиксели заливаются
          выбранным цветом фона. <strong>WebP</strong> обычно сочетает лучшее
          соотношение размера и качества с поддержкой прозрачности и часто
          оказывается самым компактным вариантом для веба.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно уменьшить вес файла без смены формата? Откройте
          <NuxtLink :to="localePath('/image-compressor')">сжатие изображений</NuxtLink>.
          Изменить ширину и высоту поможет
          <NuxtLink :to="localePath('/image-resizer')">ресайз изображений</NuxtLink>,
          а получить data URI для вставки в CSS или HTML —
          <NuxtLink :to="localePath('/image-to-base64')">конвертер изображения в Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Image format converter online</h2>
        <p>
          This free <strong>image format converter</strong> changes your pictures
          between <strong>PNG, JPEG and WebP</strong> right in the browser. Drop a
          file, pick the target format and tune the quality if needed — the tool
          redraws the image on a canvas and hands you a ready file to download.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The image is
          never uploaded, logged or stored, so the converter is safe for private
          photos, screenshots and internal assets.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Drag an image onto the dropzone, or click <code>Choose file</code>.</li>
          <li>Pick the target format: <code>PNG</code>, <code>JPEG</code> or <code>WebP</code>.</li>
          <li>For JPEG and WebP, adjust the <code>Quality</code> slider.</li>
          <li>For JPEG, choose a background color to fill transparent areas.</li>
          <li>Click <code>Convert</code>, compare the sizes and hit <code>Download</code>.</li>
        </ul>

        <h2>Which format should you pick</h2>
        <p>
          <strong>PNG</strong> is lossless and keeps transparency — ideal for logos,
          icons and screenshots with text. <strong>JPEG</strong> produces tiny files
          for photos but has no transparency, so transparent pixels are filled with
          the background color you choose. <strong>WebP</strong> usually combines the
          best size-to-quality ratio with transparency support and is often the most
          compact option for the web.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to shrink the file without changing the format? Open the
          <NuxtLink :to="localePath('/image-compressor')">image compressor</NuxtLink>.
          Change the width and height with the
          <NuxtLink :to="localePath('/image-resizer')">image resizer</NuxtLink>, and
          get a data URI to embed in CSS or HTML with the
          <NuxtLink :to="localePath('/image-to-base64')">image to Base64 converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
