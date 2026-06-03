<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'parse' | 'build'>('parse')

// PARSE mode
const input = ref('')

interface Pair {
  key: string
  value: string
}

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        parse: 'Разобрать',
        build: 'Собрать',
        inputLabel: 'Query-строка или полный URL',
        placeholder: '?foo=bar&name=Ада%20Лавлейс&tag=a&tag=b',
        key: 'Ключ',
        value: 'Значение',
        emptyParse: 'Вставьте query-строку или URL выше, чтобы увидеть пары ключ-значение.',
        invalidInput: 'Не удалось разобрать ввод как query-строку.',
        keyPlaceholder: 'ключ',
        valuePlaceholder: 'значение',
        addRow: '+ Добавить строку',
        removeRow: 'Удалить строку',
        buildOutput: 'Query-строка',
        emptyBuild: 'Добавьте пары ключ-значение, чтобы собрать query-строку.',
        pairsCount: 'пар',
      }
    : {
        parse: 'Parse',
        build: 'Build',
        inputLabel: 'Query string or full URL',
        placeholder: '?foo=bar&name=Ada%20Lovelace&tag=a&tag=b',
        key: 'Key',
        value: 'Value',
        emptyParse: 'Paste a query string or URL above to see the key-value pairs.',
        invalidInput: 'Could not parse the input as a query string.',
        keyPlaceholder: 'key',
        valuePlaceholder: 'value',
        addRow: '+ Add row',
        removeRow: 'Remove row',
        buildOutput: 'Query string',
        emptyBuild: 'Add key-value pairs to build a query string.',
        pairsCount: 'pairs',
      },
)

/** Extract the query portion: handle full URLs, leading '?', or a bare query string. */
function extractQuery(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  // If a full URL (or anything with a '?') is pasted, take the part after the first '?'.
  const qIndex = text.indexOf('?')
  let query = qIndex >= 0 ? text.slice(qIndex + 1) : text
  // Drop a trailing fragment if present.
  const hashIndex = query.indexOf('#')
  if (hashIndex >= 0) query = query.slice(0, hashIndex)
  return query
}

const parseError = ref<string | null>(null)

const parsedPairs = computed<Pair[]>(() => {
  parseError.value = null
  const query = extractQuery(input.value)
  if (!query) return []
  try {
    const params = new URLSearchParams(query)
    const out: Pair[] = []
    // Preserve order and repeated keys.
    params.forEach((value, key) => {
      out.push({ key, value })
    })
    return out
  } catch {
    parseError.value = ui.value.invalidInput
    return []
  }
})

// BUILD mode
const rows = ref<Pair[]>([
  { key: '', value: '' },
])

function addRow() {
  rows.value.push({ key: '', value: '' })
}

function removeRow(i: number) {
  rows.value.splice(i, 1)
  if (rows.value.length === 0) rows.value.push({ key: '', value: '' })
}

const built = computed(() => {
  const params = new URLSearchParams()
  for (const row of rows.value) {
    if (row.key === '') continue
    params.append(row.key, row.value)
  }
  return params.toString()
})

function clear() {
  if (mode.value === 'parse') {
    input.value = ''
  } else {
    rows.value = [{ key: '', value: '' }]
  }
}

function loadSample() {
  if (mode.value === 'parse') {
    input.value = 'https://example.com/search?q=hello%20world&page=2&tag=vue&tag=nuxt&utm_source=newsletter'
  } else {
    rows.value = [
      { key: 'q', value: 'hello world' },
      { key: 'page', value: '2' },
      { key: 'tag', value: 'vue' },
      { key: 'tag', value: 'nuxt' },
    ]
  }
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my URL or query string sent to a server?',
    a: 'No. Parsing and building both run entirely in your browser using the native URLSearchParams API. Nothing is uploaded, logged, or stored, so it is safe to paste URLs that contain tokens, session IDs, or other sensitive parameters.',
  },
  {
    q: 'Can I paste a full URL instead of just the query string?',
    a: 'Yes. If you paste a full URL like https://example.com/path?a=1&b=2, the parser automatically takes everything after the first "?" and ignores any "#fragment" at the end. You can also paste a bare query string with or without a leading "?".',
  },
  {
    q: 'How are repeated keys handled?',
    a: 'Repeated keys are preserved. A string like ?tag=a&tag=b produces two separate rows (tag=a and tag=b) rather than collapsing them, which matches how servers and frameworks usually read multi-value parameters.',
  },
  {
    q: 'Why does a space become "+" or "%20" in the built string?',
    a: 'URLSearchParams encodes spaces as "+" in the query component, which is the standard application/x-www-form-urlencoded form. A server-side parser (and this tool\'s Parse mode) decodes both "+" and "%20" back to a space, so the round trip is lossless.',
  },
  {
    q: 'Does it decode percent-encoded values automatically?',
    a: 'Yes. In Parse mode the values are shown fully decoded — name=Ada%20Lovelace appears as "Ada Lovelace". In Build mode you type plain text and the encoding is added for you, so you never have to escape characters by hand.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой URL или query-строка на сервер?',
    a: 'Нет. Разбор и сборка выполняются полностью в браузере через встроенный API URLSearchParams. Ничего не загружается, не логируется и не сохраняется, поэтому можно безопасно вставлять URL с токенами, идентификаторами сессий и другими конфиденциальными параметрами.',
  },
  {
    q: 'Можно ли вставить полный URL, а не только query-строку?',
    a: 'Да. Если вставить полный URL вида https://example.com/path?a=1&b=2, парсер автоматически возьмёт всё после первого «?» и проигнорирует «#фрагмент» в конце. Также можно вставить голую query-строку с ведущим «?» или без него.',
  },
  {
    q: 'Как обрабатываются повторяющиеся ключи?',
    a: 'Повторяющиеся ключи сохраняются. Строка ?tag=a&tag=b даёт две отдельные строки (tag=a и tag=b), а не схлопывает их — так серверы и фреймворки обычно читают многозначные параметры.',
  },
  {
    q: 'Почему пробел превращается в «+» или «%20» в собранной строке?',
    a: 'URLSearchParams кодирует пробел как «+» в query-части — это стандартная форма application/x-www-form-urlencoded. Серверный парсер (и режим «Разобрать» в этом инструменте) декодирует и «+», и «%20» обратно в пробел, поэтому преобразование туда-обратно происходит без потерь.',
  },
  {
    q: 'Декодируются ли percent-encoded значения автоматически?',
    a: 'Да. В режиме «Разобрать» значения показываются полностью декодированными — name=Ada%20Lovelace отображается как «Ada Lovelace». В режиме «Собрать» вы вводите обычный текст, а кодирование добавляется за вас, так что экранировать символы вручную не нужно.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="query-string-parser" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'parse' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'parse'"
        >{{ ui.parse }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'build' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'build'"
        >{{ ui.build }}</button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- PARSE mode -->
    <div v-if="mode === 'parse'" class="mt-4">
      <label class="label" for="qsp-input">{{ ui.inputLabel }}</label>
      <textarea
        id="qsp-input"
        v-model="input"
        class="textarea-code min-h-[6rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :placeholder="ui.placeholder"
        :aria-label="ui.inputLabel"
      />

      <div class="mt-4">
        <p v-if="parseError" class="text-sm text-red-600 dark:text-red-400">{{ parseError }}</p>
        <div
          v-else-if="parsedPairs.length"
          class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-ink-50 text-left dark:bg-ink-900">
                <th class="px-3 py-2 font-medium text-ink-600 dark:text-ink-300">{{ ui.key }}</th>
                <th class="px-3 py-2 font-medium text-ink-600 dark:text-ink-300">{{ ui.value }}</th>
                <th class="w-12 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(pair, i) in parsedPairs"
                :key="i"
                class="border-t border-ink-200 dark:border-ink-800"
              >
                <td class="px-3 py-2 font-mono align-top break-all">{{ pair.key }}</td>
                <td class="px-3 py-2 font-mono align-top break-all">{{ pair.value }}</td>
                <td class="px-3 py-2 align-top text-right">
                  <CopyButton :text="() => pair.value" small />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-ink-400">{{ ui.emptyParse }}</p>

        <p
          v-if="parsedPairs.length"
          class="mt-2 text-xs text-ink-400"
        >{{ parsedPairs.length }} {{ ui.pairsCount }}</p>
      </div>
    </div>

    <!-- BUILD mode -->
    <div v-else class="mt-4">
      <div class="space-y-2">
        <div
          v-for="(row, i) in rows"
          :key="i"
          class="flex items-center gap-2"
        >
          <input
            v-model="row.key"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :placeholder="ui.keyPlaceholder"
            :aria-label="ui.key"
          >
          <span class="text-ink-400">=</span>
          <input
            v-model="row.value"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :placeholder="ui.valuePlaceholder"
            :aria-label="ui.value"
          >
          <button
            type="button"
            class="btn-ghost !px-2.5 !py-1.5"
            :aria-label="ui.removeRow"
            @click="removeRow(i)"
          >✕</button>
        </div>
      </div>

      <button type="button" class="btn-ghost mt-3" @click="addRow">{{ ui.addRow }}</button>

      <div class="mt-5">
        <div class="flex items-center justify-between">
          <label class="label mb-0" for="qsp-output">{{ ui.buildOutput }}</label>
          <CopyButton :text="() => built" small />
        </div>
        <div
          id="qsp-output"
          class="mt-2 min-h-[3rem] overflow-auto rounded-lg border border-ink-200 bg-white p-3 font-mono text-sm break-all dark:border-ink-700 dark:bg-ink-950"
        >
          <span v-if="built">{{ built }}</span>
          <span v-else class="text-ink-400">{{ ui.emptyBuild }}</span>
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Разбор и сборка query-строк онлайн</h2>
        <p>
          Этот бесплатный <strong>парсер query-строк</strong> разбивает параметры
          URL на читаемую таблицу пар ключ-значение и собирает корректно
          закодированную query-строку обратно. Он создан для разработчиков,
          которые постоянно копаются в ссылках на API, UTM-метках и параметрах
          фильтров и хотят видеть, что именно отправляется, без ручного
          декодирования <code>%20</code> и <code>%2F</code>.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong> на встроенном API
          <code>URLSearchParams</code>. Ваши URL не отправляются на сервер,
          поэтому инструмент безопасен для ссылок с токенами, идентификаторами
          сессий и другими конфиденциальными параметрами.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>В режиме <code>Разобрать</code> вставьте query-строку или полный URL — пары появятся в таблице мгновенно.</li>
          <li>Можно вставить ссылку целиком: всё после первого <code>?</code> будет разобрано, а <code>#фрагмент</code> отброшен.</li>
          <li>Повторяющиеся ключи (<code>tag=a&amp;tag=b</code>) сохраняются как отдельные строки.</li>
          <li>В режиме <code>Собрать</code> добавляйте и удаляйте строки ключ-значение — query-строка обновляется вживую.</li>
          <li>Нажмите <code>Копировать</code> для значения или готовой строки, либо <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Кодирование и пробелы</h2>
        <p>
          В режиме <code>Разобрать</code> значения показываются уже
          декодированными, поэтому <code>name=%20</code> превращается в обычный
          пробел. В режиме <code>Собрать</code> вы вводите обычный текст, а
          percent-кодирование добавляется за вас. По стандарту
          <code>application/x-www-form-urlencoded</code> пробел в query кодируется
          как <code>+</code>; серверный парсер декодирует и <code>+</code>, и
          <code>%20</code> обратно в пробел, так что преобразование туда-обратно
          не теряет данных.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно закодировать или декодировать отдельное значение? Откройте
          <NuxtLink :to="localePath('/url-encode-decode')">URL-кодировщик/декодировщик</NuxtLink>.
          Для двоичных данных пригодится
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик/декодировщик Base64</NuxtLink>,
          а структурированный JSON удобно приводить в порядок в
          <NuxtLink :to="localePath('/json-formatter')">форматтере JSON</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Parse and build query strings online</h2>
        <p>
          This free <strong>query string parser</strong> splits URL parameters
          into a readable table of key-value pairs and builds a properly encoded
          query string back. It is made for developers who constantly dig through
          API links, UTM tags and filter parameters and want to see exactly what
          is being sent without decoding <code>%20</code> and <code>%2F</code> by
          hand.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong> on the native
          <code>URLSearchParams</code> API. Your URLs are never sent to a server,
          so it is safe for links that contain tokens, session IDs and other
          sensitive parameters.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>In <code>Parse</code> mode, paste a query string or a full URL — the pairs appear in the table instantly.</li>
          <li>You can paste a whole link: everything after the first <code>?</code> is parsed and any <code>#fragment</code> is dropped.</li>
          <li>Repeated keys (<code>tag=a&amp;tag=b</code>) are preserved as separate rows.</li>
          <li>In <code>Build</code> mode, add and remove key-value rows — the query string updates live.</li>
          <li>Click <code>Copy</code> for a single value or the finished string, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>Encoding and spaces</h2>
        <p>
          In <code>Parse</code> mode the values are shown already decoded, so
          <code>name=%20</code> becomes a real space. In <code>Build</code> mode
          you type plain text and the percent-encoding is added for you. By the
          <code>application/x-www-form-urlencoded</code> standard a space in the
          query is encoded as <code>+</code>; a server-side parser decodes both
          <code>+</code> and <code>%20</code> back to a space, so the round trip is
          lossless.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to encode or decode a single value? Open the
          <NuxtLink :to="localePath('/url-encode-decode')">URL encoder/decoder</NuxtLink>.
          For binary data reach for the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          and to tidy up structured JSON use the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
