<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

/* ------------------------------------------------------------------ *
 * Pure-JS MD5 (RFC 1321).
 * WebCrypto has no MD5, so we implement it here. The input is first
 * encoded to UTF-8 bytes so multi-byte characters (accents, emoji,
 * surrogate pairs) hash identically to other tooling.
 *
 * Verified against the RFC 1321 test suite:
 *   md5("")    = d41d8cd98f00b204e9800998ecf8427e
 *   md5("abc") = 900150983cd24fb0d6963f7d28e17f72
 * ------------------------------------------------------------------ */
function utf8Bytes(str: string): number[] {
  const out: number[] = []
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    if (c < 0x80) {
      out.push(c)
    } else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    } else if (c >= 0xd800 && c <= 0xdbff) {
      // High surrogate — combine with the following low surrogate.
      const lo = str.charCodeAt(++i)
      const cp = 0x10000 + ((c - 0xd800) << 10) + (lo - 0xdc00)
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      )
    } else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    }
  }
  return out
}

function md5(message: string): string {
  const add32 = (a: number, b: number) => (a + b) & 0xffffffff
  const rol = (x: number, c: number) => (x << c) | (x >>> (32 - c))
  const cmn = (q: number, a: number, b: number, x: number, s: number, t: number) =>
    add32(rol(add32(add32(a, q), add32(x, t)), s), b)
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & c) | (~b & d), a, b, x, s, t)
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & d) | (c & ~d), a, b, x, s, t)
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(b ^ c ^ d, a, b, x, s, t)
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(c ^ (b | ~d), a, b, x, s, t)

  const bytes = utf8Bytes(message)
  const origLen = bytes.length

  // Padding: 0x80, then zeros up to 56 mod 64, then 64-bit little-endian bit length.
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const bitLen = origLen * 8
  const lo = bitLen >>> 0
  const hi = Math.floor(bitLen / 0x100000000) >>> 0
  bytes.push(lo & 0xff, (lo >>> 8) & 0xff, (lo >>> 16) & 0xff, (lo >>> 24) & 0xff)
  bytes.push(hi & 0xff, (hi >>> 8) & 0xff, (hi >>> 16) & 0xff, (hi >>> 24) & 0xff)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const m = new Array<number>(16)
  for (let i = 0; i < bytes.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      const k = i + j * 4
      m[j] = bytes[k]! | (bytes[k + 1]! << 8) | (bytes[k + 2]! << 16) | (bytes[k + 3]! << 24)
    }
    let a = a0
    let b = b0
    let c = c0
    let d = d0

    a = ff(a, b, c, d, m[0]!, 7, 0xd76aa478)
    d = ff(d, a, b, c, m[1]!, 12, 0xe8c7b756)
    c = ff(c, d, a, b, m[2]!, 17, 0x242070db)
    b = ff(b, c, d, a, m[3]!, 22, 0xc1bdceee)
    a = ff(a, b, c, d, m[4]!, 7, 0xf57c0faf)
    d = ff(d, a, b, c, m[5]!, 12, 0x4787c62a)
    c = ff(c, d, a, b, m[6]!, 17, 0xa8304613)
    b = ff(b, c, d, a, m[7]!, 22, 0xfd469501)
    a = ff(a, b, c, d, m[8]!, 7, 0x698098d8)
    d = ff(d, a, b, c, m[9]!, 12, 0x8b44f7af)
    c = ff(c, d, a, b, m[10]!, 17, 0xffff5bb1)
    b = ff(b, c, d, a, m[11]!, 22, 0x895cd7be)
    a = ff(a, b, c, d, m[12]!, 7, 0x6b901122)
    d = ff(d, a, b, c, m[13]!, 12, 0xfd987193)
    c = ff(c, d, a, b, m[14]!, 17, 0xa679438e)
    b = ff(b, c, d, a, m[15]!, 22, 0x49b40821)

    a = gg(a, b, c, d, m[1]!, 5, 0xf61e2562)
    d = gg(d, a, b, c, m[6]!, 9, 0xc040b340)
    c = gg(c, d, a, b, m[11]!, 14, 0x265e5a51)
    b = gg(b, c, d, a, m[0]!, 20, 0xe9b6c7aa)
    a = gg(a, b, c, d, m[5]!, 5, 0xd62f105d)
    d = gg(d, a, b, c, m[10]!, 9, 0x02441453)
    c = gg(c, d, a, b, m[15]!, 14, 0xd8a1e681)
    b = gg(b, c, d, a, m[4]!, 20, 0xe7d3fbc8)
    a = gg(a, b, c, d, m[9]!, 5, 0x21e1cde6)
    d = gg(d, a, b, c, m[14]!, 9, 0xc33707d6)
    c = gg(c, d, a, b, m[3]!, 14, 0xf4d50d87)
    b = gg(b, c, d, a, m[8]!, 20, 0x455a14ed)
    a = gg(a, b, c, d, m[13]!, 5, 0xa9e3e905)
    d = gg(d, a, b, c, m[2]!, 9, 0xfcefa3f8)
    c = gg(c, d, a, b, m[7]!, 14, 0x676f02d9)
    b = gg(b, c, d, a, m[12]!, 20, 0x8d2a4c8a)

    a = hh(a, b, c, d, m[5]!, 4, 0xfffa3942)
    d = hh(d, a, b, c, m[8]!, 11, 0x8771f681)
    c = hh(c, d, a, b, m[11]!, 16, 0x6d9d6122)
    b = hh(b, c, d, a, m[14]!, 23, 0xfde5380c)
    a = hh(a, b, c, d, m[1]!, 4, 0xa4beea44)
    d = hh(d, a, b, c, m[4]!, 11, 0x4bdecfa9)
    c = hh(c, d, a, b, m[7]!, 16, 0xf6bb4b60)
    b = hh(b, c, d, a, m[10]!, 23, 0xbebfbc70)
    a = hh(a, b, c, d, m[13]!, 4, 0x289b7ec6)
    d = hh(d, a, b, c, m[0]!, 11, 0xeaa127fa)
    c = hh(c, d, a, b, m[3]!, 16, 0xd4ef3085)
    b = hh(b, c, d, a, m[6]!, 23, 0x04881d05)
    a = hh(a, b, c, d, m[9]!, 4, 0xd9d4d039)
    d = hh(d, a, b, c, m[12]!, 11, 0xe6db99e5)
    c = hh(c, d, a, b, m[15]!, 16, 0x1fa27cf8)
    b = hh(b, c, d, a, m[2]!, 23, 0xc4ac5665)

    a = ii(a, b, c, d, m[0]!, 6, 0xf4292244)
    d = ii(d, a, b, c, m[7]!, 10, 0x432aff97)
    c = ii(c, d, a, b, m[14]!, 15, 0xab9423a7)
    b = ii(b, c, d, a, m[5]!, 21, 0xfc93a039)
    a = ii(a, b, c, d, m[12]!, 6, 0x655b59c3)
    d = ii(d, a, b, c, m[3]!, 10, 0x8f0ccc92)
    c = ii(c, d, a, b, m[10]!, 15, 0xffeff47d)
    b = ii(b, c, d, a, m[1]!, 21, 0x85845dd1)
    a = ii(a, b, c, d, m[8]!, 6, 0x6fa87e4f)
    d = ii(d, a, b, c, m[15]!, 10, 0xfe2ce6e0)
    c = ii(c, d, a, b, m[6]!, 15, 0xa3014314)
    b = ii(b, c, d, a, m[13]!, 21, 0x4e0811a1)
    a = ii(a, b, c, d, m[4]!, 6, 0xf7537e82)
    d = ii(d, a, b, c, m[11]!, 10, 0xbd3af235)
    c = ii(c, d, a, b, m[2]!, 15, 0x2ad7d2bb)
    b = ii(b, c, d, a, m[9]!, 21, 0xeb86d391)

    a0 = add32(a0, a)
    b0 = add32(b0, b)
    c0 = add32(c0, c)
    d0 = add32(d0, d)
  }

  const hexLE = (n: number) => {
    let s = ''
    for (let i = 0; i < 4; i++) s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
    return s
  }
  return hexLE(a0) + hexLE(b0) + hexLE(c0) + hexLE(d0)
}

/* ------------------------------------------------------------------ *
 * SHA-1 / SHA-256 / SHA-512 via WebCrypto (async, returns hex).
 * ------------------------------------------------------------------ */
async function shaHex(algo: 'SHA-1' | 'SHA-256' | 'SHA-512', text: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const input = ref('')
const uppercase = ref(false)

// Results are populated only after an async compute, so they start empty
// and are wrapped in <ClientOnly> in the template to stay SSG-safe.
const hashes = ref<{ md5: string; sha1: string; sha256: string; sha512: string } | null>(null)
const computing = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
let token = 0

async function compute() {
  const text = input.value
  if (!text) {
    hashes.value = null
    computing.value = false
    return
  }
  const my = ++token
  computing.value = true
  try {
    const [sha1, sha256, sha512] = await Promise.all([
      shaHex('SHA-1', text),
      shaHex('SHA-256', text),
      shaHex('SHA-512', text),
    ])
    // Drop stale results if the input changed while awaiting.
    if (my !== token) return
    hashes.value = { md5: md5(text), sha1, sha256, sha512 }
  } finally {
    if (my === token) computing.value = false
  }
}

// crypto.subtle is async and only invoked from this watcher (a client-side
// reactive effect after hydration), never synchronously during setup.
watch(input, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(compute, 120)
})
onBeforeUnmount(() => timer && clearTimeout(timer))

function applyCase(hex: string): string {
  return uppercase.value ? hex.toUpperCase() : hex
}

const rows = computed(() => {
  const h = hashes.value
  return [
    { algo: 'MD5', value: h ? applyCase(h.md5) : '', bits: 128 },
    { algo: 'SHA-1', value: h ? applyCase(h.sha1) : '', bits: 160 },
    { algo: 'SHA-256', value: h ? applyCase(h.sha256) : '', bits: 256 },
    { algo: 'SHA-512', value: h ? applyCase(h.sha512) : '', bits: 512 },
  ]
})

const charCount = computed(() => input.value.length)
const byteCount = computed(() => (input.value ? utf8Bytes(input.value).length : 0))

const sample = 'The quick brown fox jumps over the lazy dog'
function loadSample() {
  input.value = sample
}
function clear() {
  input.value = ''
}

// Tool-specific labels (common verbs like Uppercase/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        inputLabel: 'Текст для хеширования',
        placeholder: 'Введите или вставьте любой текст — хеши посчитаются мгновенно…',
        bytes: 'байт UTF-8',
        startHint: 'Введите текст выше — хеши обновляются по мере набора.',
        legacy: 'Устаревший',
        bit: 'бит',
        computing: 'Вычисление…',
        copyPrefix: 'Скопировать',
      }
    : {
        inputLabel: 'Text to hash',
        placeholder: 'Type or paste any text to hash it instantly…',
        bytes: 'UTF-8 bytes',
        startHint: 'Enter text above — hashes update as you type.',
        legacy: 'Legacy',
        bit: 'bit',
        computing: 'Computing…',
        copyPrefix: 'Copy',
      },
)

const faqEn: FaqItem[] = [
  {
    q: 'Is my text sent to a server to be hashed?',
    a: 'No. Every digest is computed locally in your browser — SHA hashes use the built-in WebCrypto API and MD5 runs as in-page JavaScript. Nothing you type is uploaded, logged, or stored, so it is safe for passwords, secrets, and other sensitive strings.',
  },
  {
    q: 'How are Unicode characters and emoji handled?',
    a: 'Your text is first encoded to UTF-8 bytes and those bytes are hashed, which is the standard behaviour. That means accented letters, non-Latin scripts, and emoji produce the same hash here as they would from command-line tools like md5sum or sha256sum.',
  },
  {
    q: 'Why are MD5 and SHA-1 marked as legacy?',
    a: 'Both are cryptographically broken — practical collision attacks exist, so they must not be used for passwords, signatures, or anything security-critical. They are still fine for non-security tasks like file checksums, cache keys, or matching against legacy systems that already use them.',
  },
  {
    q: 'Does the output match my terminal or programming language?',
    a: 'Yes, as long as the same input bytes are used. The hex output here equals what you get from sha256sum, OpenSSL, Node’s crypto module, or Python’s hashlib for the same UTF-8 text. Use the Uppercase toggle if a system expects upper-case hex.',
  },
  {
    q: 'Can I hash files instead of text?',
    a: 'This tool hashes text input only. To checksum a file, paste its contents if it is text, or use a command-line tool such as sha256sum, since hashing binary files in the browser would require reading the whole file into memory.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой текст на сервер для хеширования?',
    a: 'Нет. Каждый хеш считается локально в браузере — SHA используют встроенный WebCrypto API, а MD5 работает на JavaScript прямо на странице. Ничего из введённого не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для паролей, секретов и других конфиденциальных строк.',
  },
  {
    q: 'Как обрабатываются символы Unicode и эмодзи?',
    a: 'Текст сначала кодируется в байты UTF-8, и хешируются именно эти байты — это стандартное поведение. Поэтому буквы с диакритикой, нелатинские алфавиты и эмодзи дают здесь такой же хеш, как и в консольных утилитах вроде md5sum или sha256sum.',
  },
  {
    q: 'Почему MD5 и SHA-1 помечены как устаревшие?',
    a: 'Оба криптографически взломаны — существуют практические атаки на коллизии, поэтому их нельзя использовать для паролей, подписей и всего, что критично для безопасности. Они по-прежнему подходят для несекретных задач: контрольных сумм файлов, ключей кеша или совместимости с устаревшими системами, которые их уже используют.',
  },
  {
    q: 'Совпадает ли результат с моим терминалом или языком программирования?',
    a: 'Да, если используются те же входные байты. Шестнадцатеричный вывод здесь совпадает с тем, что выдают sha256sum, OpenSSL, модуль crypto в Node или hashlib в Python для того же текста в UTF-8. Включите переключатель «Верхний регистр», если система ожидает hex в верхнем регистре.',
  },
  {
    q: 'Можно ли хешировать файлы вместо текста?',
    a: 'Этот инструмент хеширует только текстовый ввод. Чтобы получить контрольную сумму файла, вставьте его содержимое, если это текст, или используйте консольную утилиту вроде sha256sum — хеширование бинарных файлов в браузере потребовало бы загрузки всего файла в память.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="hash-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        <input v-model="uppercase" type="checkbox" class="h-4 w-4 accent-accent" />
        {{ t('common.uppercase') }}
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <label for="hash-input" class="label">{{ ui.inputLabel }}</label>
      <textarea
        id="hash-input"
        v-model="input"
        class="textarea-code min-h-[10rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
      />
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="charCount">
        <span class="text-ink-400">
          {{ charCount.toLocaleString() }} {{ t('common.characters') }} · {{ byteCount.toLocaleString() }} {{ ui.bytes }}
        </span>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Hash rows -->
    <div class="mt-4 space-y-3">
      <div
        v-for="row in rows"
        :key="row.algo"
        class="rounded-lg border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-950"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-baseline gap-2">
            <span class="font-mono text-sm font-semibold text-ink-900 dark:text-ink-100">{{ row.algo }}</span>
            <span class="text-xs text-ink-400">{{ row.bits }}-{{ ui.bit }}</span>
            <span
              v-if="row.algo === 'MD5' || row.algo === 'SHA-1'"
              class="rounded bg-amber-500/10 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400"
            >{{ ui.legacy }}</span>
          </div>
          <ClientOnly>
            <CopyButton v-if="row.value" :text="() => row.value" :label="`${ui.copyPrefix} ${row.algo}`" small />
          </ClientOnly>
        </div>
        <ClientOnly>
          <p
            v-if="row.value"
            class="mt-2 break-all font-mono text-sm text-ink-800 dark:text-ink-200"
          >{{ row.value }}</p>
          <p v-else class="mt-2 font-mono text-sm text-ink-400">
            {{ charCount && computing ? ui.computing : '—' }}
          </p>
          <template #fallback>
            <p class="mt-2 font-mono text-sm text-ink-400">—</p>
          </template>
        </ClientOnly>
      </div>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генерация хешей MD5, SHA-1, SHA-256 и SHA-512 онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор хешей</strong> превращает любой текст
          в его контрольные суммы MD5, SHA-1, SHA-256 и SHA-512 в реальном времени.
          Это удобно для проверки целостности файлов, создания ключей кеша,
          дедупликации данных или сравнения значения с хешем, полученным где-то ещё.
          Хеши SHA вычисляются встроенным движком WebCrypto вашего браузера, а MD5
          считается самодостаточной реализацией RFC 1321 на JavaScript.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваш ввод никогда не
          отправляется на сервер, поэтому безопасно хешировать секреты, токены и
          другие конфиденциальные строки.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите или вставьте текст в поле — все четыре хеша пересчитываются по мере набора.</li>
          <li>Читайте каждый хеш в виде hex в нижнем регистре в своей строке с указанием длины в битах.</li>
          <li>Включите <code>Верхний регистр</code>, если система, с которой вы сверяетесь, ожидает hex в верхнем регистре.</li>
          <li>Используйте кнопку <code>Копировать</code> в строке, чтобы скопировать один хеш.</li>
          <li>Нажмите <code>Пример</code>, чтобы загрузить образец текста, или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Какой хеш выбрать?</h2>
        <p>
          Для всего, что критично для безопасности, предпочтительны
          <strong>SHA-256</strong> или <strong>SHA-512</strong>: оба входят в
          семейство SHA-2 и не имеют известных практических слабостей.
          <strong>MD5</strong> и <strong>SHA-1</strong> взломаны атаками на
          коллизии, и их стоит использовать только для несекретных задач —
          контрольных сумм, ETag или совместимости со старыми системами. Учтите,
          что ни один из них не является функцией хеширования паролей: для хранения
          паролей используйте специализированный KDF вроде bcrypt, scrypt или Argon2.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен случайный идентификатор, а не хеш? Используйте
          <NuxtLink :to="localePath('/uuid-generator')">генератор UUID</NuxtLink>.
          Разбираете подписанный токен? Попробуйте
          <NuxtLink :to="localePath('/jwt-decoder')">декодер JWT</NuxtLink>,
          а сырые данные конвертируйте в
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщике/декодировщике Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Generate MD5, SHA-1, SHA-256 and SHA-512 hashes online</h2>
        <p>
          This free <strong>hash generator</strong> turns any text into its MD5,
          SHA-1, SHA-256 and SHA-512 checksums in real time. It is handy for
          verifying file integrity, generating cache keys, deduplicating data, or
          comparing a value against a hash produced elsewhere. The SHA digests use
          your browser’s native WebCrypto engine, while MD5 is computed by a
          self-contained JavaScript implementation of RFC 1321.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your input is
          never sent to a server, so it is safe to hash secrets, tokens or other
          sensitive strings.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type or paste your text into the box — all four hashes recompute as you type.</li>
          <li>Read each digest as lower-case hex on its own row, labelled with its bit length.</li>
          <li>Toggle <code>Uppercase</code> if the system you are matching expects upper-case hex.</li>
          <li>Use the per-row <code>Copy</code> button to grab a single hash.</li>
          <li>Click <code>Sample</code> to load example text, or <code>Clear</code> to start over.</li>
        </ul>

        <h2>Which hash should I use?</h2>
        <p>
          For anything security-sensitive, prefer <strong>SHA-256</strong> or
          <strong>SHA-512</strong>; both are part of the SHA-2 family and have no
          known practical weaknesses. <strong>MD5</strong> and <strong>SHA-1</strong>
          are broken by collision attacks and should only be used for non-security
          purposes such as checksums, ETags or interoperating with older systems.
          Note that none of these are password hashing functions — for storing
          passwords use a purpose-built KDF like bcrypt, scrypt or Argon2.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a random identifier instead of a digest? Use the
          <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink>.
          Inspecting a signed token? Try the
          <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>,
          and convert raw data with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
