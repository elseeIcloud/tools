<script setup lang="ts">
import QRCode from 'qrcode'
import type { QRCodeErrorCorrectionLevel } from 'qrcode'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const input = ref('')
const size = ref(256)
const level = ref<'L' | 'M' | 'Q' | 'H'>('M')

// QR rendering is async (Promise-based) and DOM-adjacent, so it must never run
// during SSR/prerender. Start empty (stable across server/client), then produce
// the SVG + PNG data URI in onMounted() and on every input/option change.
const svg = ref('')
const dataUrl = ref('')
const error = ref<string | null>(null)

const hasInput = computed(() => input.value.trim().length > 0)
const charCount = computed(() => input.value.length)

// Tool-specific labels (common verbs like Clear/Sample/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        size: 'Размер',
        sizeAria: 'Размер QR-кода в пикселях',
        level: 'Коррекция ошибок',
        levelAria: 'Уровень коррекции ошибок',
        levelL: 'L — низкий (~7%)',
        levelM: 'M — средний (~15%)',
        levelQ: 'Q — высокий (~25%)',
        levelH: 'H — максимальный (~30%)',
        downloadPng: 'Скачать PNG',
        downloadSvg: 'Скачать SVG',
        ready: 'QR-код готов',
        generatedIn: '· создано в вашем браузере',
        emptyHint: 'Введите текст или ссылку, чтобы увидеть QR-код.',
        rendering: 'Рисуем QR-код…',
        previewAlt: 'Сгенерированный QR-код',
        placeholder: 'https://example.com или любой текст',
      }
    : {
        size: 'Size',
        sizeAria: 'QR code size in pixels',
        level: 'Error correction',
        levelAria: 'Error correction level',
        levelL: 'L — low (~7%)',
        levelM: 'M — medium (~15%)',
        levelQ: 'Q — quartile (~25%)',
        levelH: 'H — high (~30%)',
        downloadPng: 'Download PNG',
        downloadSvg: 'Download SVG',
        ready: 'QR code ready',
        generatedIn: '· generated in your browser',
        emptyHint: 'Enter text or a URL to see your QR code.',
        rendering: 'Rendering QR code…',
        previewAlt: 'Generated QR code',
        placeholder: 'https://example.com or any text',
      },
)

function clampSize() {
  let n = Math.floor(Number(size.value) || 0)
  if (n < 64) n = 64
  if (n > 1024) n = 1024
  size.value = n
}

/** Build both the inline SVG (for display) and the PNG data URI (for download). */
async function generate() {
  // Guard: only ever runs in the browser, never during prerender.
  if (!import.meta.client) return

  const text = input.value
  if (!text.trim()) {
    svg.value = ''
    dataUrl.value = ''
    error.value = null
    return
  }

  clampSize()
  const opts = {
    errorCorrectionLevel: level.value as QRCodeErrorCorrectionLevel,
    margin: 2,
    width: size.value,
  }

  try {
    const [svgStr, png] = await Promise.all([
      QRCode.toString(text, { type: 'svg', ...opts }),
      QRCode.toDataURL(text, { type: 'image/png', ...opts }),
    ])
    svg.value = svgStr
    dataUrl.value = png
    error.value = null
  } catch (e) {
    svg.value = ''
    dataUrl.value = ''
    error.value = e instanceof Error ? e.message : String(e)
  }
}

// First render is client-only, so server HTML (no QR) matches initial hydration.
onMounted(generate)
// Re-render whenever the text or any option changes.
watch([input, size, level], generate)

/** Trigger a file download from a URL via a throwaway anchor (browser only). */
function downloadFromUrl(url: string, filename: string) {
  if (!import.meta.client) return
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function downloadPng() {
  if (!dataUrl.value) return
  downloadFromUrl(dataUrl.value, 'qr-code.png')
}

function downloadSvg() {
  if (!svg.value) return
  const blob = new Blob([svg.value], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  downloadFromUrl(url, 'qr-code.svg')
  // Release the object URL after the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function loadSample() {
  input.value = 'https://example.com'
}

function clear() {
  input.value = ''
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server when I create a QR code?',
    a: 'No. The QR code is generated entirely in your browser with JavaScript — the text, the SVG and the PNG are all produced locally. Nothing you type is uploaded, logged or stored, so it is safe for private URLs, Wi-Fi credentials or contact details.',
  },
  {
    q: 'What is the difference between PNG and SVG output?',
    a: 'PNG is a fixed-resolution raster image, ideal for quick sharing, chat apps and slides. SVG is vector and scales to any size without blurring, so it is the better choice for print, large posters or further editing in a design tool.',
  },
  {
    q: 'What does the error-correction level (L, M, Q, H) do?',
    a: 'It controls how much of the QR code can be damaged or covered while still scanning. L recovers about 7%, M about 15%, Q about 25% and H about 30%. Higher levels make the code denser but more robust — pick H if you plan to place a logo over it or print on rough surfaces.',
  },
  {
    q: 'How much text can a QR code hold?',
    a: 'A single QR code can store up to roughly 4,300 alphanumeric characters or about 2,950 bytes, though that maximum needs the largest, densest symbol. For reliable scanning keep content short — a URL or a few lines of text — and prefer a higher error-correction level over cramming in data.',
  },
  {
    q: 'Why does a higher correction level make the QR code look busier?',
    a: 'More error correction means extra redundant data is encoded alongside your content, so the grid needs more modules (the small squares). That is the trade-off: a busier, denser code that survives more damage but may require a slightly larger size to scan comfortably.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер при создании QR-кода?',
    a: 'Нет. QR-код генерируется целиком в вашем браузере на JavaScript — и текст, и SVG, и PNG создаются локально. Ничего из введённого не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для приватных ссылок, паролей Wi-Fi или контактных данных.',
  },
  {
    q: 'Чем отличается вывод в PNG от SVG?',
    a: 'PNG — это растровое изображение фиксированного разрешения, удобное для быстрой отправки, мессенджеров и слайдов. SVG — векторный формат, который масштабируется до любого размера без размытия, поэтому он лучше подходит для печати, больших постеров и дальнейшего редактирования в графическом редакторе.',
  },
  {
    q: 'Что делает уровень коррекции ошибок (L, M, Q, H)?',
    a: 'Он определяет, какую часть QR-кода можно повредить или закрыть, при этом сохранив возможность считывания. L восстанавливает около 7%, M — около 15%, Q — около 25%, H — около 30%. Чем выше уровень, тем плотнее код, но и устойчивее — выбирайте H, если планируете наложить поверх логотип или печатать на неровной поверхности.',
  },
  {
    q: 'Сколько текста помещается в QR-код?',
    a: 'Один QR-код вмещает примерно до 4300 буквенно-цифровых символов или около 2950 байт, но для такого максимума нужен самый крупный и плотный символ. Для надёжного считывания держите содержимое коротким — ссылка или несколько строк текста — и лучше повышайте уровень коррекции ошибок, чем впихивайте больше данных.',
  },
  {
    q: 'Почему при более высоком уровне коррекции QR-код выглядит «гуще»?',
    a: 'Чем выше коррекция, тем больше избыточных данных кодируется вместе с вашим содержимым, поэтому сетке требуется больше модулей (маленьких квадратов). Это и есть компромисс: более плотный код, который переживает больше повреждений, но может потребовать чуть большего размера для комфортного сканирования.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="qr-code-generator" :faq="faq">
    <!-- Toolbar / options -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.level }}
        <select v-model="level" class="field !w-auto !py-1.5" :aria-label="ui.levelAria">
          <option value="L">{{ ui.levelL }}</option>
          <option value="M">{{ ui.levelM }}</option>
          <option value="Q">{{ ui.levelQ }}</option>
          <option value="H">{{ ui.levelH }}</option>
        </select>
      </label>

      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.size }}
        <input
          v-model.number="size"
          type="number"
          min="64"
          max="1024"
          step="32"
          class="field !w-24 !py-1.5"
          :aria-label="ui.sizeAria"
          @change="clampSize"
        />
        <span class="text-ink-400">px</span>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <label class="label" for="qr-input">{{ t('common.input') }}</label>
      <textarea
        id="qr-input"
        v-model="input"
        class="textarea-code min-h-[7rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
        :aria-label="t('common.input')"
      />
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ error }}</span>
      </template>
      <template v-else-if="hasInput">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.ready }}</span>
        <span class="text-ink-400">{{ ui.generatedIn }} · {{ charCount.toLocaleString() }} {{ t('common.characters') }}</span>
      </template>
      <span v-else class="text-ink-400">{{ ui.emptyHint }}</span>
    </div>

    <!-- Live preview + downloads: async output, so render on the client only -->
    <div class="mt-3">
      <ClientOnly>
        <div v-if="hasInput && svg" class="flex flex-col items-center gap-4">
          <div
            class="inline-block rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-700"
            :aria-label="ui.previewAlt"
            role="img"
            v-html="svg"
          />
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button type="button" class="btn-primary" @click="downloadPng">{{ ui.downloadPng }}</button>
            <button type="button" class="btn-ghost" @click="downloadSvg">{{ ui.downloadSvg }}</button>
            <CopyButton :text="() => input" />
          </div>
        </div>
        <div
          v-else
          class="rounded-lg border border-dashed border-ink-200 bg-white px-3 py-10 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950"
        >
          {{ ui.emptyHint }}
        </div>
        <template #fallback>
          <div class="rounded-lg border border-ink-200 bg-white px-3 py-10 text-center text-sm text-ink-400 dark:border-ink-700 dark:bg-ink-950">
            {{ ui.rendering }}
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генерация QR-кодов онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор QR-кодов</strong> превращает любой
          текст, ссылку или контактные данные в готовый к печати QR-код прямо в
          вашем браузере. Введите содержимое, при необходимости настройте размер
          и уровень коррекции ошибок и сразу получите живой предпросмотр, который
          можно скачать в <strong>PNG</strong> или <strong>SVG</strong>.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>: и сам QR-код, и
          файлы для скачивания создаются локально. Введённые данные никуда не
          отправляются, поэтому инструмент безопасен для приватных ссылок,
          паролей Wi-Fi и любой конфиденциальной информации.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите текст или ссылку в поле ввода — QR-код обновляется автоматически.</li>
          <li>Выберите <code>Коррекцию ошибок</code>: от <code>L</code> (меньше плотность) до <code>H</code> (максимальная устойчивость).</li>
          <li>Задайте <code>Размер</code> в пикселях — от 64 до 1024.</li>
          <li>Нажмите <code>Скачать PNG</code> для растрового файла или <code>Скачать SVG</code> для векторного.</li>
          <li>Используйте <code>Пример</code>, чтобы попробовать сразу, и <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>PNG или SVG, и что значит коррекция ошибок</h2>
        <p>
          <strong>PNG</strong> — растровое изображение фиксированного размера,
          удобное для мессенджеров, презентаций и быстрой отправки.
          <strong>SVG</strong> — вектор: масштабируется до любого размера без
          потери качества, что идеально для печати и баннеров. Уровень
          <strong>коррекции ошибок</strong> определяет, какую долю кода можно
          повредить или закрыть (например, логотипом) при сохранении читаемости:
          от ~7% на уровне <code>L</code> до ~30% на уровне <code>H</code>. Более
          высокий уровень делает код плотнее, но устойчивее к повреждениям.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен надёжный секрет для зашивания в QR? Создайте его в
          <NuxtLink :to="localePath('/password-generator')">генераторе паролей</NuxtLink>.
          Готовите ссылку с параметрами — приведите её в порядок в
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщике</NuxtLink>,
          а уникальные идентификаторы получите в
          <NuxtLink :to="localePath('/uuid-generator')">генераторе UUID</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate QR codes online</h2>
        <p>
          This free <strong>QR code generator</strong> turns any text, URL or
          contact details into a print-ready QR code, right in your browser.
          Enter your content, tweak the size and error-correction level if you
          like, and get a live preview you can download as
          <strong>PNG</strong> or <strong>SVG</strong>.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>: both the QR
          code and the downloadable files are produced locally. Nothing you type
          is sent to a server, so it is safe for private links, Wi-Fi
          credentials and any sensitive information.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type text or a URL into the input — the QR code updates automatically.</li>
          <li>Pick an <code>Error correction</code> level, from <code>L</code> (less dense) to <code>H</code> (most robust).</li>
          <li>Set the <code>Size</code> in pixels, anywhere from 64 to 1024.</li>
          <li>Click <code>Download PNG</code> for a raster file or <code>Download SVG</code> for a vector one.</li>
          <li>Use <code>Sample</code> to try it instantly, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>PNG vs. SVG, and what error correction means</h2>
        <p>
          <strong>PNG</strong> is a fixed-size raster image, handy for chat apps,
          slides and quick sharing. <strong>SVG</strong> is vector and scales to
          any size without losing sharpness, which is ideal for print and large
          banners. The <strong>error-correction</strong> level controls how much
          of the code can be damaged or covered (for example, by a logo) while
          still scanning — from about 7% at <code>L</code> up to about 30% at
          <code>H</code>. A higher level packs in more modules, making the code
          denser but more resilient.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a strong secret to embed in a QR code? Create one with the
          <NuxtLink :to="localePath('/password-generator')">password generator</NuxtLink>.
          Building a link with parameters? Tidy it up in the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>,
          and mint unique identifiers with the
          <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
