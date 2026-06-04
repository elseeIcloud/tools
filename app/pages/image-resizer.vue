<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

interface SourceInfo {
  name: string
  size: number
  mime: string
  width: number
  height: number
  dataUri: string
}

interface ResultInfo {
  url: string
  size: number
  width: number
  height: number
  mime: OutputFormat
}

// No file until the user picks one, so the initial render is the deterministic
// empty state — safe for SSG, no window/FileReader/canvas touched at setup.
const source = ref<SourceInfo | null>(null)
const result = ref<ResultInfo | null>(null)
const error = ref<string | null>(null)
const dragOver = ref(false)
const busy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Resize controls.
const unit = ref<'px' | 'percent'>('px')
const lockRatio = ref(true)
const widthPx = ref<number | null>(null)
const heightPx = ref<number | null>(null)
const percent = ref(100)
const format = ref<OutputFormat>('image/jpeg')
const quality = ref(0.9)

// Tool-specific labels (common verbs like Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        dropTitle: 'Перетащите изображение сюда',
        dropHint: 'или нажмите, чтобы выбрать файл',
        dropFormats: 'PNG, JPG, WebP, GIF, BMP и другие',
        chooseFile: 'Выбрать файл',
        preview: 'Превью результата',
        previewAlt: 'Превью изменённого изображения',
        original: 'Оригинал',
        resized: 'После ресайза',
        dimensions: 'Размеры',
        fileSize: 'Размер файла',
        fileName: 'Имя файла',
        targetSize: 'Целевой размер',
        widthLabel: 'Ширина',
        heightLabel: 'Высота',
        unitLabel: 'Единицы',
        px: 'Пиксели (px)',
        percentUnit: 'Проценты (%)',
        scaleLabel: 'Масштаб',
        lockRatio: 'Сохранять пропорции',
        outputFormat: 'Формат вывода',
        qualityLabel: 'Качество',
        resizeBtn: 'Изменить размер',
        download: 'Скачать',
        notImage: 'Это не изображение. Выберите файл изображения (PNG, JPG, WebP, GIF и т. п.).',
        readError: 'Не удалось прочитать файл. Попробуйте другое изображение.',
        decodeError: 'Не удалось декодировать изображение. Возможно, формат не поддерживается браузером.',
        renderError: 'Не удалось создать изображение. Попробуйте другой формат или меньший размер.',
        startHint: 'Перетащите или выберите изображение, чтобы изменить его размер.',
        badSize: 'Укажите ширину и высоту больше нуля.',
        changeImage: 'Другое изображение',
        savings: 'экономия',
        grew: 'больше оригинала',
      }
    : {
        dropTitle: 'Drop an image here',
        dropHint: 'or click to choose a file',
        dropFormats: 'PNG, JPG, WebP, GIF, BMP and more',
        chooseFile: 'Choose file',
        preview: 'Result preview',
        previewAlt: 'Preview of the resized image',
        original: 'Original',
        resized: 'Resized',
        dimensions: 'Dimensions',
        fileSize: 'File size',
        fileName: 'File name',
        targetSize: 'Target size',
        widthLabel: 'Width',
        heightLabel: 'Height',
        unitLabel: 'Units',
        px: 'Pixels (px)',
        percentUnit: 'Percent (%)',
        scaleLabel: 'Scale',
        lockRatio: 'Keep aspect ratio',
        outputFormat: 'Output format',
        qualityLabel: 'Quality',
        resizeBtn: 'Resize image',
        download: 'Download',
        notImage: 'That is not an image. Pick an image file (PNG, JPG, WebP, GIF, etc.).',
        readError: 'Could not read the file. Try a different image.',
        decodeError: 'Could not decode the image. The format may not be supported by your browser.',
        renderError: 'Could not create the image. Try another format or a smaller size.',
        startHint: 'Drop or choose an image to resize it.',
        badSize: 'Enter a width and height greater than zero.',
        changeImage: 'Change image',
        savings: 'saved',
        grew: 'larger than original',
      },
)

// JPEG/WebP are lossy and take a quality value; PNG is lossless.
const isLossy = computed(() => format.value === 'image/jpeg' || format.value === 'image/webp')

// Pure derivation of the target pixel size from the current controls.
const target = computed<{ w: number; h: number } | null>(() => {
  if (!source.value) return null
  if (unit.value === 'percent') {
    const p = percent.value / 100
    return {
      w: Math.max(1, Math.round(source.value.width * p)),
      h: Math.max(1, Math.round(source.value.height * p)),
    }
  }
  const w = widthPx.value
  const h = heightPx.value
  if (!w || !h || w < 1 || h < 1) return null
  return { w: Math.round(w), h: Math.round(h) }
})

const sizeDelta = computed(() => {
  if (!source.value || !result.value) return null
  const diff = result.value.size - source.value.size
  const pct = (diff / source.value.size) * 100
  return { diff, pct }
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

// --- Aspect-ratio linked width/height inputs (px mode only) ---
function onWidthInput(value: number | null) {
  widthPx.value = value
  if (lockRatio.value && value && value > 0 && source.value) {
    const ratio = source.value.height / source.value.width
    heightPx.value = Math.max(1, Math.round(value * ratio))
  }
}

function onHeightInput(value: number | null) {
  heightPx.value = value
  if (lockRatio.value && value && value > 0 && source.value) {
    const ratio = source.value.width / source.value.height
    widthPx.value = Math.max(1, Math.round(value * ratio))
  }
}

function onLockToggle() {
  // When re-locking, snap height to the current width to restore proportions.
  if (lockRatio.value && unit.value === 'px' && widthPx.value && source.value) {
    const ratio = source.value.height / source.value.width
    heightPx.value = Math.max(1, Math.round(widthPx.value * ratio))
  }
}

// --- File handling (FileReader / Image only inside handlers — client-only) ---
function pickFormatFor(mime: string): OutputFormat {
  if (mime === 'image/png') return 'image/png'
  if (mime === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

function handleFile(file: File) {
  error.value = null
  if (!file.type.startsWith('image/')) {
    source.value = null
    error.value = ui.value.notImage
    return
  }
  busy.value = true
  const reader = new FileReader()
  reader.onload = () => {
    const dataUri = reader.result
    if (typeof dataUri !== 'string') {
      busy.value = false
      error.value = ui.value.readError
      return
    }
    const img = new Image()
    img.onload = () => {
      revokeResult()
      result.value = null
      source.value = {
        name: file.name,
        size: file.size,
        mime: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
        dataUri,
      }
      // Seed the controls from the natural size, keep a sensible output format.
      widthPx.value = img.naturalWidth
      heightPx.value = img.naturalHeight
      percent.value = 100
      unit.value = 'px'
      lockRatio.value = true
      format.value = pickFormatFor(file.type)
      busy.value = false
    }
    img.onerror = () => {
      busy.value = false
      source.value = null
      error.value = ui.value.decodeError
    }
    img.src = dataUri
  }
  reader.onerror = () => {
    busy.value = false
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

// --- Resize: draw the source to a canvas and export via toBlob ---
function resize() {
  if (!source.value) return
  const size = target.value
  if (!size) {
    error.value = ui.value.badSize
    return
  }
  error.value = null
  busy.value = true

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size.w
    canvas.height = size.h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      busy.value = false
      error.value = ui.value.renderError
      return
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // Fill a white backdrop for JPEG so transparency does not turn black.
    if (format.value === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size.w, size.h)
    }
    ctx.drawImage(img, 0, 0, size.w, size.h)

    const fmt = format.value
    const q = isLossy.value ? quality.value : undefined
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          busy.value = false
          error.value = ui.value.renderError
          return
        }
        revokeResult()
        result.value = {
          url: URL.createObjectURL(blob),
          size: blob.size,
          width: size.w,
          height: size.h,
          mime: fmt,
        }
        busy.value = false
      },
      fmt,
      q,
    )
  }
  img.onerror = () => {
    busy.value = false
    error.value = ui.value.decodeError
  }
  img.src = source.value.dataUri
}

function extFor(mime: OutputFormat): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return 'jpg'
}

function download() {
  if (!result.value || !source.value) return
  const base = source.value.name.replace(/\.[^.]+$/, '') || 'image'
  const a = document.createElement('a')
  a.href = result.value.url
  a.download = `${base}-${result.value.width}x${result.value.height}.${extFor(result.value.mime)}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function revokeResult() {
  if (result.value) {
    URL.revokeObjectURL(result.value.url)
  }
}

function clear() {
  revokeResult()
  source.value = null
  result.value = null
  error.value = null
}

// Object URLs allocated in handlers must be released to avoid memory leaks.
onBeforeUnmount(() => revokeResult())

const faqEn: FaqItem[] = [
  {
    q: 'Are my images uploaded to a server?',
    a: 'No. The image is read with the browser\'s FileReader API, redrawn on an HTML canvas and exported entirely on your device. Nothing is uploaded, logged or stored, so the resizer is safe for private photos, screenshots and confidential design assets.',
  },
  {
    q: 'How does "keep aspect ratio" work?',
    a: 'When the lock is on, editing either the width or the height automatically recalculates the other side from the image\'s original proportions, so it never looks stretched. Turn the lock off to set width and height independently and deliberately squash or stretch the picture.',
  },
  {
    q: 'Will resizing make my image blurry?',
    a: 'Scaling down looks sharp because the browser averages pixels with high-quality smoothing. Scaling up beyond the original dimensions cannot invent detail, so enlarged images get soft — for the best result resize down from a larger source rather than up from a small one.',
  },
  {
    q: 'Which output format and quality should I choose?',
    a: 'Keep PNG for graphics, logos and transparency; choose JPEG for photos where a smaller file matters; pick WebP for the best size-to-quality ratio on the modern web. For the lossy JPEG and WebP formats the quality slider trades file size against visual fidelity, while PNG is always lossless.',
  },
  {
    q: 'Why did my file get bigger after resizing?',
    a: 'Re-encoding can grow a file if you switch a heavily compressed JPEG to lossless PNG, or upscale the dimensions. The tool shows the original and new size side by side so you can spot this — lower the quality, keep the dimensions smaller, or pick JPEG/WebP to shrink the result.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Загружаются ли мои изображения на сервер?',
    a: 'Нет. Изображение читается через браузерный API FileReader, перерисовывается на HTML-canvas и экспортируется целиком на вашем устройстве. Ничего не загружается, не логируется и не сохраняется, поэтому ресайз безопасен для личных фото, скриншотов и конфиденциальных макетов.',
  },
  {
    q: 'Как работает «сохранять пропорции»?',
    a: 'Когда блокировка включена, при изменении ширины или высоты вторая сторона автоматически пересчитывается по исходным пропорциям картинки, поэтому она не растягивается. Отключите блокировку, чтобы задать ширину и высоту независимо и намеренно сжать или растянуть изображение.',
  },
  {
    q: 'Станет ли изображение размытым после ресайза?',
    a: 'Уменьшение выглядит чётко: браузер усредняет пиксели с качественным сглаживанием. Увеличение сверх исходного размера не может добавить деталей, поэтому такие картинки становятся мягкими — для лучшего результата уменьшайте крупный исходник, а не растягивайте маленький.',
  },
  {
    q: 'Какой формат и качество выбрать?',
    a: 'Оставьте PNG для графики, логотипов и прозрачности; выберите JPEG для фотографий, где важен маленький файл; берите WebP для лучшего соотношения размера и качества в современном вебе. Для форматов с потерями (JPEG и WebP) ползунок качества меняет компромисс между размером и чёткостью, а PNG всегда без потерь.',
  },
  {
    q: 'Почему файл стал больше после ресайза?',
    a: 'Перекодирование может увеличить файл, если переключить сильно сжатый JPEG в PNG без потерь или увеличить размеры. Инструмент показывает исходный и новый размер рядом, чтобы это заметить — снизьте качество, держите размеры меньше или выберите JPEG/WebP, чтобы уменьшить результат.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="image-resizer" :faq="faq">
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
      <span class="mb-3 text-3xl" aria-hidden="true">⤢</span>
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

    <!-- Editor -->
    <div v-if="source" class="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <!-- Preview + dimensions -->
      <div class="space-y-4 lg:order-2">
        <div>
          <p class="label">{{ ui.preview }}</p>
          <div class="grid place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-700 dark:bg-ink-950">
            <img
              :src="result ? result.url : source.dataUri"
              :alt="ui.previewAlt"
              class="max-h-64 max-w-full object-contain"
            />
          </div>
        </div>

        <dl class="grid grid-cols-[auto_1fr] content-start gap-x-4 gap-y-2 text-sm">
          <dt class="text-ink-500 dark:text-ink-400">{{ ui.fileName }}</dt>
          <dd class="break-all font-medium text-ink-800 dark:text-ink-100">{{ source.name }}</dd>

          <dt class="text-ink-500 dark:text-ink-400">{{ ui.original }}</dt>
          <dd class="font-medium text-ink-800 dark:text-ink-100">
            {{ source.width }}&thinsp;×&thinsp;{{ source.height }} px · {{ formatBytes(source.size) }}
          </dd>

          <template v-if="result">
            <dt class="text-ink-500 dark:text-ink-400">{{ ui.resized }}</dt>
            <dd class="font-medium text-ink-800 dark:text-ink-100">
              {{ result.width }}&thinsp;×&thinsp;{{ result.height }} px · {{ formatBytes(result.size) }}
              <span
                v-if="sizeDelta"
                class="ml-1 font-normal"
                :class="sizeDelta.diff <= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'"
              >
                ({{ sizeDelta.diff <= 0
                  ? `−${Math.abs(sizeDelta.pct).toFixed(0)}% ${ui.savings}`
                  : `+${sizeDelta.pct.toFixed(0)}% ${ui.grew}` }})
              </span>
            </dd>
          </template>
        </dl>

        <div v-if="result" class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="download">⬇ {{ ui.download }}</button>
        </div>
      </div>

      <!-- Controls -->
      <div class="space-y-4 lg:order-1">
        <p class="label !mb-0">{{ t('common.options') }}</p>

        <!-- Units -->
        <div>
          <label class="label">{{ ui.unitLabel }}</label>
          <div class="flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
            <button
              type="button"
              class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              :class="unit === 'px' ? 'bg-accent text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'"
              @click="unit = 'px'"
            >{{ ui.px }}</button>
            <button
              type="button"
              class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              :class="unit === 'percent' ? 'bg-accent text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'"
              @click="unit = 'percent'"
            >{{ ui.percentUnit }}</button>
          </div>
        </div>

        <!-- Pixel size -->
        <div v-if="unit === 'px'" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="resize-w">{{ ui.widthLabel }}</label>
              <input
                id="resize-w"
                class="field"
                type="number"
                min="1"
                inputmode="numeric"
                :value="widthPx ?? ''"
                @input="onWidthInput(($event.target as HTMLInputElement).valueAsNumber || null)"
              />
            </div>
            <div>
              <label class="label" for="resize-h">{{ ui.heightLabel }}</label>
              <input
                id="resize-h"
                class="field"
                type="number"
                min="1"
                inputmode="numeric"
                :value="heightPx ?? ''"
                @input="onHeightInput(($event.target as HTMLInputElement).valueAsNumber || null)"
              />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input v-model="lockRatio" type="checkbox" class="h-4 w-4 rounded accent-accent" @change="onLockToggle" />
            {{ ui.lockRatio }}
          </label>
        </div>

        <!-- Percent scale -->
        <div v-else>
          <label class="label" for="resize-pct">{{ ui.scaleLabel }} · {{ percent }}%</label>
          <input
            id="resize-pct"
            v-model.number="percent"
            type="range"
            min="1"
            max="200"
            step="1"
            class="w-full accent-accent"
          />
          <p v-if="target" class="mt-1 text-xs text-ink-500 dark:text-ink-400">
            {{ target.w }}&thinsp;×&thinsp;{{ target.h }} px
          </p>
        </div>

        <!-- Output format -->
        <div>
          <label class="label" for="resize-fmt">{{ ui.outputFormat }}</label>
          <select id="resize-fmt" v-model="format" class="field">
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </div>

        <!-- Quality (lossy only) -->
        <div v-if="isLossy">
          <label class="label" for="resize-q">{{ ui.qualityLabel }} · {{ Math.round(quality * 100) }}%</label>
          <input
            id="resize-q"
            v-model.number="quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            class="w-full accent-accent"
          />
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <button type="button" class="btn-primary" :disabled="busy || !target" @click="resize">
            {{ ui.resizeBtn }}
          </button>
          <button type="button" class="btn-ghost" @click="clear">{{ ui.changeImage }}</button>
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Изменение размера изображений онлайн</h2>
        <p>
          Этот бесплатный <strong>ресайз изображений</strong> меняет ширину и
          высоту картинки прямо в браузере. Перетащите PNG, JPG или WebP, задайте
          нужный размер в пикселях или процентах, при желании сохраните пропорции —
          и скачайте готовый файл. Инструмент сразу показывает исходные и новые
          размеры, а также разницу в весе файла.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong> через HTML-canvas.
          Изображение не загружается на сервер, не логируется и не сохраняется —
          поэтому ресайз безопасен для приватных фото, скриншотов и внутренних
          макетов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Перетащите изображение в область или нажмите <code>Выбрать файл</code>.</li>
          <li>Выберите единицы — <code>пиксели</code> или <code>проценты</code>.</li>
          <li>Задайте ширину и высоту; при включённой блокировке вторая сторона пересчитается сама.</li>
          <li>Выберите формат вывода (JPEG, PNG, WebP) и качество для форматов с потерями.</li>
          <li>Нажмите <code>Изменить размер</code>, проверьте превью и нажмите <code>Скачать</code>.</li>
        </ul>

        <h2>Пропорции, качество и формат</h2>
        <p>
          Включённая блокировка пропорций не даёт картинке растянуться: меняя
          ширину, вы автоматически меняете высоту по исходному соотношению сторон.
          Уменьшение выглядит чётко благодаря качественному сглаживанию, а вот
          увеличение сверх исходного размера делает изображение мягким. Для
          фотографий выбирайте <code>JPEG</code> или <code>WebP</code> и
          регулируйте ползунок качества; для графики и прозрачности оставляйте
          <code>PNG</code>.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно уменьшить вес без изменения размеров? Используйте
          <NuxtLink :to="localePath('/image-compressor')">сжатие изображений</NuxtLink>.
          Поменять формат файла поможет
          <NuxtLink :to="localePath('/image-format-converter')">конвертер форматов изображений</NuxtLink>,
          а встроить картинку прямо в CSS или HTML —
          <NuxtLink :to="localePath('/image-to-base64')">конвертер изображения в Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Resize images online</h2>
        <p>
          This free <strong>image resizer</strong> changes the width and height of
          a picture right in your browser. Drop a PNG, JPG or WebP, set the size you
          need in pixels or percent, optionally keep the aspect ratio, and download
          the result. The tool instantly shows the original and new dimensions along
          with the difference in file size.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong> via an HTML
          canvas. The image is never uploaded, logged or stored, so the resizer is
          safe for private photos, screenshots and internal mockups.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Drag an image onto the dropzone, or click <code>Choose file</code>.</li>
          <li>Pick the units — <code>pixels</code> or <code>percent</code>.</li>
          <li>Set width and height; with the lock on, the other side updates automatically.</li>
          <li>Choose an output format (JPEG, PNG, WebP) and a quality for lossy formats.</li>
          <li>Click <code>Resize image</code>, check the preview, then <code>Download</code>.</li>
        </ul>

        <h2>Aspect ratio, quality and format</h2>
        <p>
          Keeping the aspect ratio locked stops the picture from stretching: change
          the width and the height follows the original proportions automatically.
          Scaling down stays crisp thanks to high-quality smoothing, while scaling up
          beyond the source makes the image soft. For photos choose
          <code>JPEG</code> or <code>WebP</code> and tune the quality slider; for
          graphics and transparency keep <code>PNG</code>.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to shrink the file weight without changing dimensions? Use the
          <NuxtLink :to="localePath('/image-compressor')">image compressor</NuxtLink>.
          To change the file type, try the
          <NuxtLink :to="localePath('/image-format-converter')">image format converter</NuxtLink>,
          and to embed a picture straight into CSS or HTML use the
          <NuxtLink :to="localePath('/image-to-base64')">image to Base64 converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
