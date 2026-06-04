<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'encode' | 'decode'>('encode')
const separator = ref<'none' | 'space'>('space')
const upper = ref(false)
const input = ref('')

// Tool-specific labels (common verbs like Encode/Decode/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        conversionMode: 'Режим конвертации',
        toHex: 'Текст → Hex',
        toText: 'Hex → Текст',
        separator: 'Разделитель',
        sepNone: 'Без пробелов',
        sepSpace: 'Пробел',
        uppercase: 'Верхний регистр',
        inputEncode: 'Текст для перевода в hex',
        inputDecode: 'Hex для перевода в текст',
        outputEncode: 'Шестнадцатеричный код',
        outputDecode: 'Декодированный текст',
        cannotDecode: '✗ Не удаётся декодировать',
        invalidHex: 'Некорректный hex —',
        errOddLength: 'нечётное число цифр (нужно по две на байт)',
        errBadChar: 'допустимы только цифры 0–9 и буквы A–F',
        errBadUtf8: 'байты не образуют корректный текст UTF-8',
        encoded: 'Переведено в hex',
        decoded: 'Декодировано',
        charactersOut: 'символов на выходе',
        bytesOut: 'байт',
        hintEncode: 'Введите или вставьте текст, чтобы мгновенно получить его hex-представление.',
        hintDecode: 'Вставьте шестнадцатеричный код, чтобы мгновенно декодировать его в текст.',
        placeholderInEncode: 'Hello, 世界',
        placeholderInDecode: '48 65 6c 6c 6f',
        placeholderOutEncode: 'Здесь появится hex…',
        placeholderOutDecode: 'Здесь появится декодированный текст…',
      }
    : {
        conversionMode: 'Conversion mode',
        toHex: 'Text → Hex',
        toText: 'Hex → Text',
        separator: 'Separator',
        sepNone: 'None',
        sepSpace: 'Space',
        uppercase: 'Uppercase',
        inputEncode: 'Text to convert to hex',
        inputDecode: 'Hex to convert to text',
        outputEncode: 'Hexadecimal output',
        outputDecode: 'Decoded text',
        cannotDecode: '✗ Cannot decode',
        invalidHex: 'Invalid hex —',
        errOddLength: 'odd number of digits (two per byte required)',
        errBadChar: 'only digits 0–9 and letters A–F are allowed',
        errBadUtf8: 'the bytes are not valid UTF-8 text',
        encoded: 'Converted to hex',
        decoded: 'Decoded',
        charactersOut: 'characters out',
        bytesOut: 'bytes',
        hintEncode: 'Type or paste text to get its hex representation instantly.',
        hintDecode: 'Paste hexadecimal to decode it back to text instantly.',
        placeholderInEncode: 'Hello, 世界',
        placeholderInDecode: '48 65 6c 6c 6f',
        placeholderOutEncode: 'Hex output appears here…',
        placeholderOutDecode: 'Decoded text appears here…',
      },
)

// --- Hex helpers (UTF-8 safe; TextEncoder/TextDecoder used inside methods) ---

class HexError extends Error {}

function encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const sep = separator.value === 'space' ? ' ' : ''
  const out: string[] = new Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i]!.toString(16).padStart(2, '0')
  }
  const hex = out.join(sep)
  return upper.value ? hex.toUpperCase() : hex
}

function decode(text: string): string {
  // Strip whitespace and any 0x / \x byte prefixes, then validate.
  const cleaned = text
    .replace(/0x/gi, '')
    .replace(/\\x/gi, '')
    .replace(/\s+/g, '')
  if (cleaned.length === 0) return ''
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new HexError('bad-char')
  }
  if (cleaned.length % 2 !== 0) {
    throw new HexError('odd-length')
  }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16)
  }
  try {
    // fatal:true throws on malformed UTF-8 instead of inserting U+FFFD.
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new HexError('bad-utf8')
  }
}

// --- Live conversion (TextEncoder/TextDecoder exist in Node, so this is SSG-safe) ---

const result = computed<{ ok: true; value: string } | { ok: false; error: string }>(() => {
  if (!input.value) return { ok: true, value: '' }
  try {
    return { ok: true, value: mode.value === 'encode' ? encode(input.value) : decode(input.value) }
  } catch (e) {
    if (e instanceof HexError) {
      if (e.message === 'odd-length') return { ok: false, error: ui.value.errOddLength }
      if (e.message === 'bad-utf8') return { ok: false, error: ui.value.errBadUtf8 }
      return { ok: false, error: ui.value.errBadChar }
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
})

const output = computed(() => (result.value.ok ? result.value.value : ''))
const error = computed(() => (result.value.ok ? null : result.value.error))
const hasInput = computed(() => input.value.length > 0)
const inputLabel = computed(() => (mode.value === 'encode' ? ui.value.inputEncode : ui.value.inputDecode))
const outputLabel = computed(() => (mode.value === 'encode' ? ui.value.outputEncode : ui.value.outputDecode))

// --- Actions ---

function swap() {
  // Move the current (valid) output into the input, and flip the mode.
  if (!result.value.ok) return
  input.value = result.value.value
  mode.value = mode.value === 'encode' ? 'decode' : 'encode'
}

function clear() {
  input.value = ''
}

function loadSample() {
  if (mode.value === 'encode') {
    input.value = 'Hello, 世界 👋'
  } else {
    input.value = '48 65 6c 6c 6f 2c 20 e4 b8 96 e7 95 8c 20 f0 9f 91 8b'
  }
}

const faqEn: FaqItem[] = [
  {
    q: 'How does text get converted to hex?',
    a: 'Your text is first encoded to UTF-8 bytes, then each byte is written as a two-digit hexadecimal number from 00 to ff. Hex to text reverses this: every pair of hex digits becomes one byte, and the bytes are decoded back as UTF-8.',
  },
  {
    q: 'Is my data sent to a server?',
    a: 'No. The conversion runs entirely in your browser using the built-in TextEncoder and TextDecoder APIs. Nothing you type or paste is uploaded, logged or stored, so it is safe to convert tokens, keys and other sensitive data.',
  },
  {
    q: 'Does it support emoji and non-Latin characters?',
    a: 'Yes. Because the tool works through UTF-8 bytes, emoji and any Unicode script — Cyrillic, Chinese, Arabic and more — round-trip correctly. A single emoji can take up to four bytes, so it produces several hex pairs.',
  },
  {
    q: 'What hex formats can I paste for decoding?',
    a: 'Spaces and line breaks are ignored, and 0x or \\x prefixes are stripped automatically, so "48 65", "4865" and "0x48 0x65" all decode the same way. The cleaned input must contain only the digits 0–9 and letters A–F and have an even length.',
  },
  {
    q: 'Why do I get an "invalid hex" error?',
    a: 'Decoding fails if the input has an odd number of digits (each byte needs exactly two), contains characters outside 0–9 and A–F, or produces bytes that are not valid UTF-8 text. Check for a truncated value or a stray character and make sure you are in Hex → Text mode.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Как текст превращается в hex?',
    a: 'Сначала текст кодируется в байты UTF-8, затем каждый байт записывается двузначным шестнадцатеричным числом от 00 до ff. Перевод hex в текст делает обратное: каждая пара цифр становится байтом, а байты декодируются обратно как UTF-8.',
  },
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. Конвертация выполняется полностью в браузере встроенными API TextEncoder и TextDecoder. Ничего из введённого или вставленного не загружается, не логируется и не сохраняется, поэтому можно безопасно переводить токены, ключи и другие конфиденциальные данные.',
  },
  {
    q: 'Поддерживаются ли эмодзи и нелатинские символы?',
    a: 'Да. Так как инструмент работает через байты UTF-8, эмодзи и любые письменности — кириллица, китайский, арабский и другие — проходят туда-обратно без потерь. Один эмодзи может занимать до четырёх байт, поэтому даёт несколько пар hex.',
  },
  {
    q: 'В каком формате можно вставлять hex для декодирования?',
    a: 'Пробелы и переносы строк игнорируются, а префиксы 0x и \\x убираются автоматически, поэтому «48 65», «4865» и «0x48 0x65» декодируются одинаково. После очистки строка должна содержать только цифры 0–9 и буквы A–F и иметь чётную длину.',
  },
  {
    q: 'Почему возникает ошибка «некорректный hex»?',
    a: 'Декодирование не удаётся, если в строке нечётное число цифр (на каждый байт нужно ровно две), есть символы вне диапазона 0–9 и A–F, или байты не образуют корректный текст UTF-8. Проверьте, нет ли обрезанного значения или лишнего символа, и убедитесь, что выбран режим Hex → Текст.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="hex-to-text" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Text→Hex / Hex→Text segmented control -->
      <div
        class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700"
        role="group"
        :aria-label="ui.conversionMode"
      >
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'encode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'encode'"
          @click="mode = 'encode'"
        >{{ ui.toHex }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'decode'"
          @click="mode = 'decode'"
        >{{ ui.toText }}</button>
      </div>

      <!-- Output formatting options only affect Text → Hex -->
      <template v-if="mode === 'encode'">
        <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <span>{{ ui.separator }}:</span>
          <select
            v-model="separator"
            class="rounded-md border border-ink-200 bg-white px-2 py-1 text-sm dark:border-ink-700 dark:bg-ink-900"
            :aria-label="ui.separator"
          >
            <option value="space">{{ ui.sepSpace }}</option>
            <option value="none">{{ ui.sepNone }}</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <input v-model="upper" type="checkbox" class="h-4 w-4 rounded border-ink-300 text-accent focus:ring-accent/30 dark:border-ink-600" />
          {{ ui.uppercase }}
        </label>
      </template>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!result.ok || !hasInput" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.cannotDecode }}</span>
        <span class="text-ink-500 dark:text-ink-400">{{ ui.invalidHex }} {{ error }}.</span>
      </template>
      <template v-else-if="hasInput">
        <span class="font-medium text-green-600 dark:text-green-400">
          ✓ {{ mode === 'encode' ? ui.encoded : ui.decoded }}
        </span>
        <span class="text-ink-400">· {{ output.length.toLocaleString() }} {{ ui.charactersOut }}</span>
      </template>
      <span v-else class="text-ink-400">
        {{ mode === 'encode' ? ui.hintEncode : ui.hintDecode }}
      </span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 lg:grid-cols-2">
      <div>
        <label for="hex-input" class="label">{{ inputLabel }}</label>
        <textarea
          id="hex-input"
          v-model="input"
          class="textarea-code min-h-[16rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          :placeholder="mode === 'encode' ? ui.placeholderInEncode : ui.placeholderInDecode"
          :aria-label="inputLabel"
        />
      </div>

      <div>
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <label for="hex-output" class="label !mb-0">{{ outputLabel }}</label>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          id="hex-output"
          :value="error ? '' : output"
          class="textarea-code min-h-[16rem]"
          readonly
          spellcheck="false"
          :placeholder="mode === 'encode' ? ui.placeholderOutEncode : ui.placeholderOutDecode"
          :aria-label="outputLabel"
        />
      </div>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер Hex в текст и обратно</h2>
        <p>
          Этот бесплатный <strong>конвертер hex в текст</strong> переводит
          шестнадцатеричный код в читаемый текст и текст в hex — мгновенно и
          полностью в вашем браузере. Он пригодится, когда нужно разобрать
          hex-дамп, прочитать значение из лога или базы данных, собрать байтовую
          последовательность вручную или просто понять, какие символы скрываются
          за набором цифр. Кодирование идёт через <strong>UTF-8</strong>, поэтому
          эмодзи и кириллица проходят туда-обратно без искажений.
        </p>
        <p>
          Ваши данные <strong>никогда не загружаются</strong> на сервер. Вся работа
          происходит локально с помощью браузерных API <code>TextEncoder</code> и
          <code>TextDecoder</code>, поэтому инструмент безопасен для токенов,
          ключей и других секретов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Текст → Hex</code>, чтобы получить шестнадцатеричный код, или <code>Hex → Текст</code>, чтобы декодировать его обратно.</li>
          <li>Введите или вставьте данные в левое поле — результат обновляется справа по мере ввода.</li>
          <li>Для режима «Текст → Hex» выберите <code>Разделитель</code> (пробел между байтами или без него) и при необходимости включите <code>Верхний регистр</code>.</li>
          <li>При декодировании пробелы и префиксы <code>0x</code> игнорируются автоматически — можно вставлять hex почти в любом формате.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы отправить результат во ввод и сменить режим, а <code>Копировать</code> — чтобы забрать результат.</li>
        </ul>

        <h2>Что такое hex и как он соотносится с байтами</h2>
        <p>
          Шестнадцатеричная (hex) запись использует 16 цифр — <code>0–9</code> и
          <code>a–f</code> — и удобна тем, что один байт (8 бит) всегда умещается
          ровно в две hex-цифры от <code>00</code> до <code>ff</code>. Поэтому
          корректный hex для текста всегда имеет чётную длину. Значения вроде
          <code>0x</code> — это лишь префикс, обозначающий «дальше идёт hex»; сами
          байты он не меняет, и инструмент убирает его при декодировании.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Хотите свериться с кодами символов — загляните в
          <NuxtLink :to="localePath('/ascii-table')">таблицу ASCII</NuxtLink>.
          Нужно перевести данные в Base64 — используйте
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик Base64</NuxtLink>,
          а чтобы увидеть те же байты в виде нулей и единиц — откройте
          <NuxtLink :to="localePath('/text-to-binary')">конвертер текста в двоичный код</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Hex to text and back converter</h2>
        <p>
          This free <strong>hex to text converter</strong> turns hexadecimal into
          readable text and text into hex, instantly and entirely in your browser.
          It is handy when you need to read a hex dump, decode a value from a log or
          database, build a byte sequence by hand, or simply find out which
          characters a string of digits stands for. Encoding goes through
          <strong>UTF-8</strong>, so emoji and non-Latin scripts survive the round
          trip unchanged.
        </p>
        <p>
          Your data is <strong>never uploaded</strong>. All work happens locally
          with the browser's <code>TextEncoder</code> and <code>TextDecoder</code>
          APIs, which makes it safe for tokens, keys and other secrets.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick <code>Text → Hex</code> to get the hexadecimal, or <code>Hex → Text</code> to decode it back.</li>
          <li>Type or paste into the left box — the result updates on the right as you type.</li>
          <li>For Text → Hex, choose a <code>Separator</code> (space between bytes or none) and toggle <code>Uppercase</code> if you need it.</li>
          <li>When decoding, spaces and <code>0x</code> prefixes are ignored automatically, so you can paste hex in almost any format.</li>
          <li>Hit <code>Swap</code> to send the output back to the input and flip the mode, and <code>Copy</code> to grab the result.</li>
        </ul>

        <h2>What hex is and how it maps to bytes</h2>
        <p>
          Hexadecimal (hex) uses 16 digits — <code>0–9</code> and <code>a–f</code>
          — and is convenient because one byte (8 bits) always fits in exactly two
          hex digits, from <code>00</code> to <code>ff</code>. That is why valid hex
          for text always has an even length. A value like <code>0x</code> is just a
          prefix that means "hex follows"; it does not change the bytes themselves,
          and the tool strips it while decoding.
        </p>

        <h2>Related tools</h2>
        <p>
          Want to check character codes? See the
          <NuxtLink :to="localePath('/ascii-table')">ASCII table</NuxtLink>. Need
          Base64 instead? Use the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          or view the same bytes as ones and zeros with the
          <NuxtLink :to="localePath('/text-to-binary')">text to binary converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
