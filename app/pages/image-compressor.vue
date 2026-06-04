<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Output format options. JPEG/WebP honor quality; PNG ignores it, so when the
// source is PNG we re-encode to a lossy format the user picks.
type OutFormat = 'image/jpeg' | 'image/png' | 'image/webp'

interface Source {
  name: string
  size: number
  mime: string
  width: number
  height: number
  dataUri: string
}

interface Compressed {
  size: number
  mime: string
  url: string
  fileName: string
}

// No output until the user picks a file, so the initial render is the
// deterministic empty dropzone — safe for SSG, no ClientOnly needed.
const source = ref<Source | null>(null)
const compressed = ref<Compressed | null>(null)
const quality = ref(0.8)
const format = ref<OutFormat>('image/jpeg')
const error = ref<string | null>(null)
const busy = ref(false)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Tool-specific labels (common verbs like Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        dropTitle: 'Перетащите изображение сюда',
        dropHint: 'или нажмите, чтобы выбрать файл',
        dropFormats: 'JPG, PNG, WebP',
        chooseFile: 'Выбрать файл',
        quality: 'Качество',
        outFormat: 'Формат на выходе',
        original: 'Оригинал',
        compressedLabel: 'Сжатое',
        saved: 'Экономия',
        larger: 'больше',
        preview: 'Превью (сжатое)',
        dimensions: 'Размеры',
        download: 'Скачать',
        compressAgain: 'Сжать заново',
        pngNote:
          'PNG не использует параметр качества, поэтому для сжатия он перекодируется в JPEG или WebP. Это меняет формат и может убрать прозрачность (для JPEG фон станет чёрным).',
        notImage:
          'Это не изображение. Выберите файл JPG, PNG или WebP.',
        readError: 'Не удалось прочитать файл. Попробуйте другое изображение.',
        loadError: 'Не удалось декодировать изображение. Возможно, формат не поддерживается браузером.',
        encodeError: 'Не удалось сжать изображение в выбранном формате.',
        startHint: 'Перетащите или выберите изображение, чтобы сжать его.',
        previewAlt: 'Превью сжатого изображения',
        formatJpeg: 'JPEG',
        formatPng: 'PNG (без сжатия по качеству)',
        formatWebp: 'WebP',
      }
    : {
        dropTitle: 'Drop an image here',
        dropHint: 'or click to choose a file',
        dropFormats: 'JPG, PNG, WebP',
        chooseFile: 'Choose file',
        quality: 'Quality',
        outFormat: 'Output format',
        original: 'Original',
        compressedLabel: 'Compressed',
        saved: 'Saved',
        larger: 'larger',
        preview: 'Preview (compressed)',
        dimensions: 'Dimensions',
        download: 'Download',
        compressAgain: 'Compress again',
        pngNote:
          'PNG ignores the quality setting, so to compress it the image is re-encoded as JPEG or WebP. That changes the format and may drop transparency (JPEG fills it with black).',
        notImage: 'That is not an image. Pick a JPG, PNG or WebP file.',
        readError: 'Could not read the file. Try a different image.',
        loadError: 'Could not decode the image. The format may be unsupported by your browser.',
        encodeError: 'Could not compress the image in the chosen format.',
        startHint: 'Drop or choose an image to compress it.',
        previewAlt: 'Preview of the compressed image',
        formatJpeg: 'JPEG',
        formatPng: 'PNG (quality ignored)',
        formatWebp: 'WebP',
      },
)

// PNG has no lossy quality knob, so we warn and steer to JPEG/WebP.
const isPngSource = computed(() => source.value?.mime === 'image/png')
const qualityApplies = computed(() => format.value !== 'image/png')

const savedPercent = computed(() => {
  if (!source.value || !compressed.value) return null
  return Math.round((1 - compressed.value.size / source.value.size) * 100)
})

const extByMime: Record<OutFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

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

/** Strip the extension so we can append the new one cleanly. */
function baseName(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

// Revoke the previous compressed object URL before replacing/clearing it.
function revokeCompressed() {
  if (compressed.value) {
    URL.revokeObjectURL(compressed.value.url)
    compressed.value = null
  }
}

// FileReader / Image / canvas only run from user interaction — strictly client-side.
function handleFile(file: File) {
  error.value = null
  revokeCompressed()
  if (!file.type.startsWith('image/')) {
    source.value = null
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
    const img = new Image()
    img.onload = () => {
      source.value = {
        name: file.name,
        size: file.size,
        mime: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        dataUri: result,
      }
      // Default the output format to the source; PNG can't use quality, so
      // offer JPEG as a sensible lossy default for it.
      if (file.type === 'image/webp') format.value = 'image/webp'
      else if (file.type === 'image/png') format.value = 'image/jpeg'
      else format.value = 'image/jpeg'
      compress()
    }
    img.onerror = () => {
      source.value = null
      error.value = ui.value.loadError
    }
    img.src = result
  }
  reader.onerror = () => {
    source.value = null
    error.value = ui.value.readError
  }
  reader.readAsDataURL(file)
}

function compress() {
  if (!source.value) return
  error.value = null
  busy.value = true
  const src = source.value
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = src.width
    canvas.height = src.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      busy.value = false
      error.value = ui.value.encodeError
      return
    }
    // JPEG has no alpha — paint white so transparent areas aren't black.
    if (format.value === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)
    canvas.toBlob(
      (blob) => {
        busy.value = false
        if (!blob) {
          error.value = ui.value.encodeError
          return
        }
        revokeCompressed()
        compressed.value = {
          size: blob.size,
          mime: format.value,
          url: URL.createObjectURL(blob),
          fileName: `${baseName(src.name)}-compressed.${extByMime[format.value]}`,
        }
      },
      format.value,
      qualityApplies.value ? quality.value : undefined,
    )
  }
  img.onerror = () => {
    busy.value = false
    error.value = ui.value.loadError
  }
  img.src = src.dataUri
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

function download() {
  if (!compressed.value) return
  const a = document.createElement('a')
  a.href = compressed.value.url
  a.download = compressed.value.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function clear() {
  revokeCompressed()
  source.value = null
  error.value = null
}

onBeforeUnmount(revokeCompressed)

const faqEn: FaqItem[] = [
  {
    q: 'Are my images uploaded to a server?',
    a: 'No. The image is read with the browser\'s FileReader API, drawn onto an in-memory canvas and re-encoded entirely on your device. Nothing is uploaded, logged or stored, so it is safe for private photos, screenshots and confidential assets.',
  },
  {
    q: 'How does the quality slider reduce file size?',
    a: 'The image is redrawn to a canvas and re-encoded with canvas.toBlob at the quality you choose. Lower quality discards more fine detail and compresses harder, producing a smaller file. JPEG and WebP both respect this setting; values around 0.7–0.85 usually keep the picture looking sharp while cutting size a lot.',
  },
  {
    q: 'Why does the PNG quality setting do nothing?',
    a: 'PNG is a lossless format, so its encoder ignores the quality value — re-saving a PNG can even make it bigger. To actually shrink a PNG you must re-encode it to a lossy format, which is why the tool defaults a PNG to JPEG and lets you pick JPEG or WebP instead.',
  },
  {
    q: 'Why did my transparent PNG turn into a solid background?',
    a: 'JPEG has no alpha channel, so transparent pixels are filled with white when you export to JPEG. If you need to keep transparency while still compressing, choose WebP as the output format — it supports both transparency and lossy quality.',
  },
  {
    q: 'Does compressing change the image dimensions?',
    a: 'No. This tool keeps the original width and height and only re-encodes the pixels at a lower quality, so the resolution stays the same. If you also need to change the dimensions, use the dedicated image resizer first and then compress the result here.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружаются ли мои изображения на сервер?',
    a: 'Нет. Изображение читается через браузерный API FileReader, отрисовывается на canvas в памяти и перекодируется целиком на вашем устройстве. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для личных фото, скриншотов и конфиденциальных ассетов.',
  },
  {
    q: 'Как ползунок качества уменьшает размер файла?',
    a: 'Изображение перерисовывается на canvas и перекодируется через canvas.toBlob с выбранным качеством. Чем ниже качество, тем больше мелких деталей отбрасывается и тем сильнее сжатие — файл становится меньше. JPEG и WebP учитывают этот параметр; значения около 0.7–0.85 обычно сохраняют картинку чёткой и при этом заметно уменьшают размер.',
  },
  {
    q: 'Почему ползунок качества не влияет на PNG?',
    a: 'PNG — формат без потерь, поэтому его кодировщик игнорирует значение качества, а повторное сохранение PNG может даже увеличить размер. Чтобы реально сжать PNG, его нужно перекодировать в формат с потерями — поэтому для PNG по умолчанию выбран JPEG, а вы можете выбрать JPEG или WebP.',
  },
  {
    q: 'Почему мой прозрачный PNG получил сплошной фон?',
    a: 'У JPEG нет альфа-канала, поэтому при экспорте в JPEG прозрачные пиксели заливаются белым. Если нужно сохранить прозрачность и при этом сжать изображение, выберите формат WebP — он поддерживает и прозрачность, и качество с потерями.',
  },
  {
    q: 'Меняются ли размеры изображения при сжатии?',
    a: 'Нет. Инструмент сохраняет исходную ширину и высоту и только перекодирует пиксели с более низким качеством, так что разрешение остаётся прежним. Если нужно ещё и изменить размеры, сначала используйте отдельный ресайзер изображений, а затем сожмите результат здесь.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="image-compressor" :faq="faq">
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
      <span class="mb-3 text-3xl" aria-hidden="true">🗜</span>
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

    <!-- Controls + result -->
    <div v-if="source" class="mt-5 space-y-5">
      <!-- Options -->
      <div class="grid gap-5 sm:grid-cols-2">
        <!-- Quality slider -->
        <div>
          <label class="label" :class="!qualityApplies ? 'opacity-50' : ''" for="quality-slider">
            {{ ui.quality }}: {{ quality.toFixed(2) }}
          </label>
          <input
            id="quality-slider"
            v-model.number="quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            :disabled="!qualityApplies"
            class="w-full accent-accent disabled:opacity-50"
            @change="compress"
          />
        </div>

        <!-- Output format -->
        <div>
          <label class="label" for="out-format">{{ ui.outFormat }}</label>
          <select
            id="out-format"
            v-model="format"
            class="field"
            @change="compress"
          >
            <option value="image/jpeg">{{ ui.formatJpeg }}</option>
            <option value="image/webp">{{ ui.formatWebp }}</option>
            <option value="image/png">{{ ui.formatPng }}</option>
          </select>
        </div>
      </div>

      <!-- PNG / format note -->
      <p
        v-if="isPngSource || format === 'image/png'"
        class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
      >
        ⚠ {{ ui.pngNote }}
      </p>

      <!-- Size comparison -->
      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
          <dt class="text-xs text-ink-500 dark:text-ink-400">{{ ui.original }}</dt>
          <dd class="mt-0.5 font-mono text-base font-semibold text-ink-800 dark:text-ink-100">{{ formatBytes(source.size) }}</dd>
        </div>
        <div class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950">
          <dt class="text-xs text-ink-500 dark:text-ink-400">{{ ui.compressedLabel }}</dt>
          <dd class="mt-0.5 font-mono text-base font-semibold text-ink-800 dark:text-ink-100">
            {{ compressed ? formatBytes(compressed.size) : '—' }}
          </dd>
        </div>
        <div
          class="col-span-2 rounded-lg border p-3 sm:col-span-1"
          :class="savedPercent !== null && savedPercent >= 0
            ? 'border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40'
            : 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40'"
        >
          <dt
            class="text-xs"
            :class="savedPercent !== null && savedPercent >= 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-amber-700 dark:text-amber-400'"
          >{{ ui.saved }}</dt>
          <dd
            class="mt-0.5 font-mono text-base font-semibold"
            :class="savedPercent !== null && savedPercent >= 0
              ? 'text-green-700 dark:text-green-400'
              : 'text-amber-700 dark:text-amber-400'"
          >
            <template v-if="savedPercent === null">—</template>
            <template v-else-if="savedPercent >= 0">−{{ savedPercent }}%</template>
            <template v-else>+{{ -savedPercent }}% {{ ui.larger }}</template>
          </dd>
        </div>
      </dl>

      <!-- Preview -->
      <div v-if="compressed">
        <p class="label">{{ ui.preview }}</p>
        <div class="grid place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
          <img
            :src="compressed.url"
            :alt="ui.previewAlt"
            class="max-h-72 max-w-full object-contain"
          />
        </div>
        <p class="mt-1.5 text-xs text-ink-500 dark:text-ink-400">
          {{ ui.dimensions }}: {{ source.width }} × {{ source.height }} px
        </p>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn-primary"
          :disabled="!compressed || busy"
          @click="download"
        >
          {{ ui.download }}
        </button>
        <button type="button" class="btn-ghost" :disabled="busy" @click="compress">{{ ui.compressAgain }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Сжатие изображений онлайн без потери приватности</h2>
        <p>
          Этот бесплатный <strong>компрессор изображений</strong> уменьшает размер
          файлов JPG, PNG и WebP прямо в браузере. Перетащите картинку, подберите
          ползунком <strong>качество</strong>, и инструмент перерисует её на
          canvas и перекодирует через <code>canvas.toBlob</code>, показав исходный
          размер, размер после сжатия и процент экономии. Готовый файл можно сразу
          скачать.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Изображение не
          загружается на сервер, не логируется и не сохраняется — поэтому
          инструмент безопасен для личных фото, скриншотов и конфиденциальных
          ассетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Перетащите изображение в область или нажмите <code>Выбрать файл</code>.</li>
          <li>Двигайте ползунок <code>Качество</code> от 0.1 до 1.0 — ниже значение, меньше файл.</li>
          <li>Выберите формат на выходе: JPEG или WebP для сжатия с потерями.</li>
          <li>Сравните исходный и сжатый размеры и процент экономии.</li>
          <li>Нажмите <code>Скачать</code>, чтобы сохранить результат.</li>
        </ul>

        <h2>Почему PNG требует смены формата</h2>
        <p>
          PNG — формат без потерь, и его кодировщик игнорирует параметр качества:
          повторное сохранение почти не уменьшает размер, а иногда увеличивает его.
          Поэтому для PNG инструмент предлагает перекодировать изображение в JPEG
          или WebP. JPEG даёт наименьший размер, но не поддерживает прозрачность
          (она заливается белым), а WebP сжимает с потерями и сохраняет
          прозрачность — выбирайте формат под задачу.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно ещё и изменить размеры — используйте
          <NuxtLink :to="localePath('/image-resizer')">ресайзер изображений</NuxtLink>.
          Чтобы поменять формат без сжатия по качеству, подойдёт
          <NuxtLink :to="localePath('/image-format-converter')">конвертер форматов изображений</NuxtLink>,
          а встроить картинку прямо в CSS или HTML поможет
          <NuxtLink :to="localePath('/image-to-base64')">конвертер изображения в Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Compress images online without giving up privacy</h2>
        <p>
          This free <strong>image compressor</strong> shrinks JPG, PNG and WebP
          file size right in your browser. Drop an image, tune the
          <strong>quality</strong> slider, and the tool redraws it onto a canvas
          and re-encodes it with <code>canvas.toBlob</code>, showing the original
          size, the compressed size and how much you saved. You can download the
          result straight away.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The image is
          never uploaded, logged or stored, so it is safe for personal photos,
          screenshots and confidential assets.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Drag an image onto the dropzone, or click <code>Choose file</code>.</li>
          <li>Move the <code>Quality</code> slider from 0.1 to 1.0 — lower means a smaller file.</li>
          <li>Pick an output format: JPEG or WebP for lossy compression.</li>
          <li>Compare the original and compressed sizes and the percentage saved.</li>
          <li>Click <code>Download</code> to save the result.</li>
        </ul>

        <h2>Why PNG needs a format change</h2>
        <p>
          PNG is lossless, and its encoder ignores the quality value: re-saving a
          PNG barely shrinks it and can even make it larger. So for PNG the tool
          offers to re-encode the image as JPEG or WebP. JPEG gives the smallest
          size but has no transparency (it is filled with white), while WebP
          compresses with quality control and keeps transparency — choose the
          format that fits your use case.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to change the dimensions too? Use the
          <NuxtLink :to="localePath('/image-resizer')">image resizer</NuxtLink>.
          To switch formats without a quality slider, try the
          <NuxtLink :to="localePath('/image-format-converter')">image format converter</NuxtLink>,
          and to embed an image directly in CSS or HTML use the
          <NuxtLink :to="localePath('/image-to-base64')">image to Base64 converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
