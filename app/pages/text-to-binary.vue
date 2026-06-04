<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'encode' | 'decode'>('encode')
const separator = ref<'space' | 'none'>('space')
const input = ref('')

// Tool-specific labels (common verbs like Encode/Decode/Swap come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        conversionMode: 'Режим конвертации',
        toBinary: 'В двоичный',
        toText: 'В текст',
        separator: 'Разделитель',
        sepSpace: 'Пробел',
        sepNone: 'Без разделителя',
        inputEncode: 'Текст для перевода в двоичный код',
        inputDecode: 'Двоичный код для перевода в текст',
        outputEncode: 'Двоичный код',
        outputDecode: 'Декодированный текст',
        cannotDecode: '✗ Не удаётся декодировать',
        invalidBinary: 'Некорректный двоичный код —',
        encoded: 'Закодировано',
        decoded: 'Декодировано',
        charactersOut: 'символов на выходе',
        hintEncode: 'Введите или вставьте текст, чтобы мгновенно получить его двоичный код.',
        hintDecode: 'Вставьте 8-битные группы, чтобы мгновенно декодировать их в текст.',
        placeholderInEncode: 'Привет',
        placeholderInDecode: '01001000 01101001',
        placeholderOutEncode: 'Здесь появится двоичный код…',
        placeholderOutDecode: 'Здесь появится декодированный текст…',
      }
    : {
        conversionMode: 'Conversion mode',
        toBinary: 'To binary',
        toText: 'To text',
        separator: 'Separator',
        sepSpace: 'Space',
        sepNone: 'No separator',
        inputEncode: 'Text to convert to binary',
        inputDecode: 'Binary to convert to text',
        outputEncode: 'Binary output',
        outputDecode: 'Decoded text',
        cannotDecode: '✗ Cannot decode',
        invalidBinary: 'Invalid binary —',
        encoded: 'Encoded',
        decoded: 'Decoded',
        charactersOut: 'characters out',
        hintEncode: 'Type or paste text to get its binary representation instantly.',
        hintDecode: 'Paste 8-bit groups to decode them back to text instantly.',
        placeholderInEncode: 'Hello',
        placeholderInDecode: '01001000 01101001',
        placeholderOutEncode: 'Binary output appears here…',
        placeholderOutDecode: 'Decoded text appears here…',
      },
)

// --- Text <-> binary helpers (UTF-8 safe, all work in pure JS / native APIs) ---

function encode(text: string): string {
  // Encode to UTF-8 bytes first, then format every byte as 8 binary digits.
  const bytes = new TextEncoder().encode(text)
  const groups: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    groups.push(bytes[i]!.toString(2).padStart(8, '0'))
  }
  return groups.join(separator.value === 'space' ? ' ' : '')
}

function decode(text: string): string {
  // Strip every kind of whitespace so both spaced and unspaced input work.
  const bits = text.replace(/\s+/g, '')
  if (bits === '') return ''
  if (!/^[01]+$/.test(bits)) {
    throw new Error(
      locale.value === 'ru'
        ? 'допустимы только цифры 0 и 1'
        : 'only the digits 0 and 1 are allowed',
    )
  }
  if (bits.length % 8 !== 0) {
    throw new Error(
      locale.value === 'ru'
        ? 'длина должна быть кратна 8 битам'
        : 'length must be a multiple of 8 bits',
    )
  }
  const bytes = new Uint8Array(bits.length / 8)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  }
  // fatal:true makes TextDecoder throw on malformed UTF-8 instead of inserting U+FFFD.
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// --- Live conversion (safe in setup: TextEncoder/TextDecoder exist in Node) ---

const result = computed<{ ok: true; value: string } | { ok: false; error: string }>(() => {
  if (!input.value) return { ok: true, value: '' }
  try {
    return { ok: true, value: mode.value === 'encode' ? encode(input.value) : decode(input.value) }
  } catch (e) {
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
  // Move the current (valid) output into the input, and flip the direction.
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
    input.value = '01001000 01101001'
  }
}

const faqEn: FaqItem[] = [
  {
    q: 'How is text turned into binary?',
    a: 'Your text is first encoded as UTF-8 bytes, then each byte is written as 8 binary digits (bits). For example the letter "H" is byte 72, which is 01001000. ASCII characters fit in one byte, while emoji and many non-Latin characters use two to four bytes, so they produce several 8-bit groups.',
  },
  {
    q: 'Is my text sent to a server?',
    a: 'No. The conversion runs entirely in your browser using the built-in TextEncoder and TextDecoder APIs. Nothing is uploaded, stored or logged, so it is safe to paste private notes, tokens or other sensitive text.',
  },
  {
    q: 'Why do I get an "invalid binary" error when decoding?',
    a: 'The decoder accepts only the digits 0 and 1, and the total number of bits must be a multiple of 8 because each character is one or more 8-bit bytes. An error means the input has other characters, a stray bit, or a group that is not exactly 8 bits long. Spaces and line breaks are ignored automatically.',
  },
  {
    q: 'Does it support emoji and non-English characters?',
    a: 'Yes. Because the tool converts text through UTF-8, emoji, Cyrillic, Chinese and every other Unicode script round-trip correctly. Such characters simply map to more than one byte, so you will see two, three or four 8-bit groups per character.',
  },
  {
    q: 'Can I decode binary without spaces between bytes?',
    a: 'Yes. The decoder strips all whitespace before reading the bits, so "0100100001101001" and "01001000 01101001" decode to the same text. When encoding you can choose a space separator for readability or no separator for a compact bit string.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Как текст превращается в двоичный код?',
    a: 'Сначала текст кодируется в байты UTF-8, затем каждый байт записывается как 8 двоичных цифр (битов). Например, буква «H» — это байт 72, то есть 01001000. ASCII-символы умещаются в один байт, а эмодзи и многие нелатинские символы занимают от двух до четырёх байт, поэтому дают несколько 8-битных групп.',
  },
  {
    q: 'Отправляется ли мой текст на сервер?',
    a: 'Нет. Преобразование выполняется полностью в вашем браузере с помощью встроенных API TextEncoder и TextDecoder. Ничего не загружается, не сохраняется и не логируется, поэтому можно безопасно вставлять личные заметки, токены и другой конфиденциальный текст.',
  },
  {
    q: 'Почему при декодировании появляется ошибка «некорректный двоичный код»?',
    a: 'Декодировщик принимает только цифры 0 и 1, а общее число битов должно быть кратно 8, потому что каждый символ состоит из одного или нескольких 8-битных байтов. Ошибка означает, что во вводе есть другие символы, лишний бит или группа не ровно из 8 цифр. Пробелы и переносы строк отбрасываются автоматически.',
  },
  {
    q: 'Поддерживаются ли эмодзи и нелатинские символы?',
    a: 'Да. Поскольку инструмент кодирует текст через UTF-8, эмодзи, кириллица, китайские иероглифы и любые другие письменности проходят туда-обратно без потерь. Такие символы просто отображаются в несколько байт, поэтому на каждый символ приходится две, три или четыре 8-битные группы.',
  },
  {
    q: 'Можно ли декодировать двоичный код без пробелов между байтами?',
    a: 'Да. Перед чтением битов декодировщик убирает все пробелы, поэтому «0100100001101001» и «01001000 01101001» дают один и тот же текст. При кодировании можно выбрать разделитель-пробел для читаемости или отсутствие разделителя для компактной строки битов.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="text-to-binary" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- To binary / To text segmented control -->
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
        >{{ ui.toBinary }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'decode'"
          @click="mode = 'decode'"
        >{{ ui.toText }}</button>
      </div>

      <label
        v-if="mode === 'encode'"
        class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
      >
        {{ ui.separator }}
        <select
          v-model="separator"
          class="field !w-auto !py-1 text-sm"
          :aria-label="ui.separator"
        >
          <option value="space">{{ ui.sepSpace }}</option>
          <option value="none">{{ ui.sepNone }}</option>
        </select>
      </label>

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
        <span class="text-ink-500 dark:text-ink-400">{{ ui.invalidBinary }} {{ error }}.</span>
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
        <label for="t2b-input" class="label">{{ inputLabel }}</label>
        <textarea
          id="t2b-input"
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
          <label for="t2b-output" class="label !mb-0">{{ outputLabel }}</label>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          id="t2b-output"
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
        <h2>Перевод текста в двоичный код и обратно</h2>
        <p>
          Этот бесплатный <strong>конвертер текста в двоичный код</strong>
          переводит обычный текст в нули и единицы и обратно — мгновенно и
          полностью в вашем браузере. Он пригодится разработчикам, студентам и
          всем, кто изучает, как компьютеры хранят символы: каждый байт
          показывается ровно восемью битами, чтобы наглядно видеть связь между
          текстом и его двоичным представлением. Кодирование идёт через
          <strong>UTF-8</strong>, поэтому кириллица, эмодзи и любые письменности
          переводятся корректно.
        </p>
        <p>
          Ваш текст <strong>никогда не загружается</strong> на сервер. Вся работа
          происходит локально с помощью браузерных API <code>TextEncoder</code> и
          <code>TextDecoder</code>, поэтому инструмент безопасен даже для
          конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>В двоичный</code>, чтобы превратить текст в биты, или <code>В текст</code>, чтобы прочитать двоичный код как текст.</li>
          <li>Введите или вставьте данные в левое поле — результат обновляется справа по мере ввода.</li>
          <li>В режиме «В двоичный» выберите разделитель: <code>Пробел</code> для читаемости или <code>Без разделителя</code> для компактной строки битов.</li>
          <li>При декодировании пробелы и переносы строк отбрасываются автоматически, а длина должна быть кратна 8 битам.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы отправить результат во ввод и сменить направление, или <code>Копировать</code> для результата, <code>Пример</code> для образца.</li>
        </ul>

        <h2>Почему байт — это 8 бит</h2>
        <p>
          В UTF-8 каждый символ хранится как один или несколько байтов, а один
          байт — это 8 бит, то есть число от <code>0</code> до <code>255</code>.
          Поэтому каждая 8-битная группа кодирует ровно один байт: латинская буква
          умещается в один байт, а эмодзи или иероглиф — в несколько, давая
          несколько групп подряд. Двоичный код — это не шифрование: любой может
          перевести его обратно, поэтому он ничего не скрывает, а лишь показывает,
          как символы выглядят на самом нижнем уровне.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен шестнадцатеричный вид вместо двоичного? Используйте
          <NuxtLink :to="localePath('/hex-to-text')">конвертер HEX в текст</NuxtLink>.
          Посмотрите коды символов в
          <NuxtLink :to="localePath('/ascii-table')">таблице ASCII</NuxtLink>
          или переводите числа между системами счисления в
          <NuxtLink :to="localePath('/number-base-converter')">конвертере систем счисления</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert text to binary and back</h2>
        <p>
          This free <strong>text-to-binary converter</strong> turns plain text into
          ones and zeros and back again, instantly and entirely in your browser. It
          is handy for developers, students and anyone learning how computers store
          characters: every byte is shown as exactly eight bits so you can see the
          relationship between text and its binary form. Encoding goes through
          <strong>UTF-8</strong>, so Latin, Cyrillic, emoji and any other script
          convert correctly.
        </p>
        <p>
          Your text is <strong>never uploaded</strong>. All work happens locally
          with the browser's <code>TextEncoder</code> and <code>TextDecoder</code>
          APIs, which makes it safe even for confidential data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick <code>To binary</code> to turn text into bits, or <code>To text</code> to read binary back as text.</li>
          <li>Type or paste into the left box — the result updates on the right as you type.</li>
          <li>In "To binary" mode choose a separator: <code>Space</code> for readability or <code>No separator</code> for a compact bit string.</li>
          <li>When decoding, spaces and line breaks are ignored automatically, and the length must be a multiple of 8 bits.</li>
          <li>Hit <code>Swap</code> to send the output back to the input and flip the direction, or use <code>Copy</code> for the result and <code>Sample</code> for an example.</li>
        </ul>

        <h2>Why a byte is 8 bits</h2>
        <p>
          In UTF-8 each character is stored as one or more bytes, and a single byte
          is 8 bits — a number from <code>0</code> to <code>255</code>. That is why
          each 8-bit group encodes exactly one byte: a Latin letter fits in one
          byte, while an emoji or ideograph needs several and produces several
          groups in a row. Binary is not encryption: anyone can convert it back, so
          it hides nothing — it simply shows how characters look at the lowest
          level.
        </p>

        <h2>Related tools</h2>
        <p>
          Need a hexadecimal view instead of binary? Use the
          <NuxtLink :to="localePath('/hex-to-text')">hex-to-text converter</NuxtLink>.
          Look up character codes in the
          <NuxtLink :to="localePath('/ascii-table')">ASCII table</NuxtLink>, or
          convert numbers between bases with the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
