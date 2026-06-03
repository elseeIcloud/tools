<script setup lang="ts">
import yaml from 'js-yaml'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'json2yaml' | 'yaml2json'>('json2yaml')
const indent = ref<'2' | '4'>('2')
const input = ref('')

// Tool-specific labels (common verbs like Swap/Sample/Clear/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        jsonToYaml: 'JSON → YAML',
        yamlToJson: 'YAML → JSON',
        indent: 'Отступ',
        indentAria: 'Размер отступа',
        spaces2: '2 пробела',
        spaces4: '4 пробела',
        valid: '✓ Готово',
        invalidJson: '✗ Некорректный JSON',
        invalidYaml: '✗ Некорректный YAML',
        inputJsonPlaceholder: '{\n  "a": 1,\n  "b": ["x", "y"]\n}',
        inputYamlPlaceholder: 'a: 1\nb:\n  - x\n  - y',
        inputJsonAria: 'Ввод JSON',
        inputYamlAria: 'Ввод YAML',
        outputYamlAria: 'Результат YAML',
        outputJsonAria: 'Результат JSON',
      }
    : {
        jsonToYaml: 'JSON → YAML',
        yamlToJson: 'YAML → JSON',
        indent: 'Indent',
        indentAria: 'Indent size',
        spaces2: '2 spaces',
        spaces4: '4 spaces',
        valid: '✓ Ready',
        invalidJson: '✗ Invalid JSON',
        invalidYaml: '✗ Invalid YAML',
        inputJsonPlaceholder: '{\n  "a": 1,\n  "b": ["x", "y"]\n}',
        inputYamlPlaceholder: 'a: 1\nb:\n  - x\n  - y',
        inputJsonAria: 'JSON input',
        inputYamlAria: 'YAML input',
        outputYamlAria: 'YAML output',
        outputJsonAria: 'JSON output',
      },
)

interface Conversion {
  output: string
  /** null = ok, 'empty' = nothing typed yet, others = a localized red status. */
  error: 'empty' | 'invalidJson' | 'invalidYaml' | null
}

// Pure: JSON and js-yaml (yaml.dump / yaml.load) all run fine in the Node
// prerender env, so the result is computed synchronously with no client guard.
// On any parse error we return a status code instead of throwing.
const conversion = computed<Conversion>(() => {
  const text = input.value.trim()
  if (!text) return { output: '', error: 'empty' }

  if (mode.value === 'json2yaml') {
    let data: unknown
    try {
      data = JSON.parse(input.value)
    } catch {
      return { output: '', error: 'invalidJson' }
    }
    try {
      // noCompatMode keeps plain scalars like y / no / on unquoted (YAML 1.2),
      // so output stays clean and round-trips back to the same JSON.
      const out = yaml.dump(data, { indent: Number(indent.value), noCompatMode: true })
      return { output: out, error: null }
    } catch {
      return { output: '', error: 'invalidJson' }
    }
  }

  // YAML -> JSON
  let data: unknown
  try {
    data = yaml.load(input.value)
  } catch {
    return { output: '', error: 'invalidYaml' }
  }
  // A bare comment or empty document parses to undefined; treat as not-ready.
  if (data === undefined) return { output: '', error: 'empty' }
  return { output: JSON.stringify(data, null, 2), error: null }
})

const output = computed(() => conversion.value.output)
const isValid = computed(() => conversion.value.error === null)

const statusLabel = computed(() => {
  const err = conversion.value.error
  if (err === 'invalidJson') return ui.value.invalidJson
  if (err === 'invalidYaml') return ui.value.invalidYaml
  return ui.value.valid
})

function swap() {
  // Feed the current output back as input and flip the conversion direction.
  if (!isValid.value || !output.value) return
  input.value = output.value
  mode.value = mode.value === 'json2yaml' ? 'yaml2json' : 'json2yaml'
}

function clear() {
  input.value = ''
}

const sampleJson = `{
  "name": "devtools",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nuxt generate",
    "dev": "nuxt dev"
  },
  "keywords": ["json", "yaml", "converter"]
}`

const sampleYaml = `name: devtools
version: 1.0.0
private: true
scripts:
  build: nuxt generate
  dev: nuxt dev
keywords:
  - json
  - yaml
  - converter`

function loadSample() {
  input.value = mode.value === 'json2yaml' ? sampleJson : sampleYaml
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my data sent to a server?',
    a: 'No. Both JSON to YAML and YAML to JSON conversion run entirely in your browser using JavaScript and the js-yaml library. Nothing you paste is uploaded, logged or stored, so it is safe for config files, secrets templates and other sensitive data.',
  },
  {
    q: 'Does the conversion round-trip cleanly?',
    a: 'Yes. Converting JSON to YAML and then YAML back to JSON returns the same data — objects, arrays, numbers, booleans and strings are all preserved. Use the Swap button to feed the output back in and verify the round-trip in one click.',
  },
  {
    q: 'Why are values like y, no or on not quoted?',
    a: 'The converter emits YAML 1.2 style, where bare words such as y, no, on and off are plain strings rather than booleans. That keeps the output clean and unambiguous, and it matches how modern parsers (and JSON) interpret the data.',
  },
  {
    q: 'Are comments preserved when converting YAML to JSON?',
    a: 'No. JSON has no concept of comments, so any # comments in your YAML are dropped during YAML to JSON conversion. Anchors and aliases are resolved into their concrete values, since JSON cannot represent references either.',
  },
  {
    q: 'What happens if my input is invalid?',
    a: 'Nothing breaks. If the JSON or YAML cannot be parsed, the tool shows a red status (Invalid JSON or Invalid YAML) and leaves the output empty instead of throwing or producing garbage. Fix the input and the result updates instantly.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мои данные на сервер?',
    a: 'Нет. И преобразование JSON в YAML, и YAML в JSON выполняются целиком в браузере на JavaScript с помощью библиотеки js-yaml. Ничего из вставленного не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для конфигов, шаблонов секретов и других конфиденциальных данных.',
  },
  {
    q: 'Сохраняются ли данные при преобразовании туда и обратно?',
    a: 'Да. Преобразование JSON в YAML, а затем YAML обратно в JSON возвращает те же данные — объекты, массивы, числа, булевы значения и строки сохраняются. Нажмите «Поменять местами», чтобы прогнать результат обратно и проверить обратимость в один клик.',
  },
  {
    q: 'Почему значения вроде y, no или on не берутся в кавычки?',
    a: 'Конвертер выводит YAML в стиле версии 1.2, где отдельные слова вроде y, no, on и off считаются обычными строками, а не булевыми значениями. Это делает вывод чистым и однозначным и соответствует тому, как современные парсеры (и JSON) трактуют эти данные.',
  },
  {
    q: 'Сохраняются ли комментарии при преобразовании YAML в JSON?',
    a: 'Нет. В JSON нет понятия комментариев, поэтому любые комментарии # в YAML отбрасываются при преобразовании YAML в JSON. Якоря и алиасы раскрываются в конкретные значения, так как JSON тоже не умеет хранить ссылки.',
  },
  {
    q: 'Что будет, если ввод некорректен?',
    a: 'Ничего не сломается. Если JSON или YAML не удаётся разобрать, инструмент показывает красный статус («Некорректный JSON» или «Некорректный YAML») и оставляет вывод пустым, а не выбрасывает ошибку и не выдаёт мусор. Исправьте ввод — и результат обновится мгновенно.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="json-to-yaml" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'json2yaml' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'json2yaml'"
        >{{ ui.jsonToYaml }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'yaml2json' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          @click="mode = 'yaml2json'"
        >{{ ui.yamlToJson }}</button>
      </div>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.indent }}
        <select v-model="indent" class="field !w-auto !py-1.5" :aria-label="ui.indentAria">
          <option value="2">{{ ui.spaces2 }}</option>
          <option value="4">{{ ui.spaces4 }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="!isValid || !output" @click="swap">{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="conversion.error && conversion.error !== 'empty'">
        <span class="font-medium text-red-600 dark:text-red-400">{{ statusLabel }}</span>
      </template>
      <template v-else-if="isValid">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
      </template>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Input / Output -->
    <div class="mt-3 grid gap-4 md:grid-cols-2">
      <div>
        <label class="label">{{ t('common.input') }}</label>
        <textarea
          v-model="input"
          class="textarea-code min-h-[18rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="mode === 'json2yaml' ? ui.inputJsonPlaceholder : ui.inputYamlPlaceholder"
          :aria-label="mode === 'json2yaml' ? ui.inputJsonAria : ui.inputYamlAria"
        />
      </div>
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="label !mb-0">{{ t('common.output') }}</span>
          <CopyButton :text="() => output" small />
        </div>
        <textarea
          :value="output"
          readonly
          class="textarea-code min-h-[18rem] bg-ink-50 dark:bg-ink-900"
          spellcheck="false"
          :aria-label="mode === 'json2yaml' ? ui.outputYamlAria : ui.outputJsonAria"
        />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Конвертер JSON в YAML и обратно онлайн</h2>
        <p>
          Этот бесплатный <strong>конвертер JSON ↔ YAML</strong> превращает
          JSON в читаемый YAML и разбирает YAML обратно в аккуратный JSON — в обе
          стороны, в один клик. Он создан для разработчиков и DevOps-инженеров,
          которые постоянно перекладывают конфигурацию между ответами API,
          манифестами Kubernetes, файлами CI/CD и docker-compose.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Ваши данные не
          отправляются на сервер, поэтому инструмент безопасен для конфигов,
          шаблонов секретов и других конфиденциальных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите направление: <code>JSON → YAML</code> или <code>YAML → JSON</code>.</li>
          <li>Вставьте данные слева — результат пересчитывается на лету.</li>
          <li>Выберите <code>Отступ</code>: 2 или 4 пробела для вывода.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы прогнать результат обратно и проверить преобразование в обе стороны.</li>
          <li>Используйте <code>Копировать</code> для результата или <code>Пример</code>, чтобы попробовать сразу.</li>
        </ul>

        <h2>Чем отличаются JSON и YAML</h2>
        <p>
          JSON и YAML описывают одну и ту же модель данных — объекты, массивы,
          строки, числа и булевы значения, — но по-разному. <strong>JSON</strong>
          компактен и однозначен, его любят API и базы данных. <strong>YAML</strong>
          использует отступы вместо скобок, поддерживает комментарии и читается
          человеком, поэтому стал стандартом для конфигов. При преобразовании
          YAML → JSON комментарии и якоря не сохраняются, так как в JSON их
          попросту нет. Если ввод некорректен, инструмент показывает красный
          статус вместо сломанного вывода.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно сначала привести JSON в порядок? Откройте
          <NuxtLink :to="localePath('/json-formatter')">форматтер JSON</NuxtLink>.
          Для табличных данных пригодится
          <NuxtLink :to="localePath('/json-to-csv')">конвертер JSON ↔ CSV</NuxtLink>,
          а для работы с числами в разных системах —
          <NuxtLink :to="localePath('/number-base-converter')">конвертер систем счисления</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Convert JSON to YAML and back online</h2>
        <p>
          This free <strong>JSON ↔ YAML converter</strong> turns JSON into
          readable YAML and parses YAML back into clean JSON — both directions, in
          a single click. It is built for developers and DevOps engineers who
          constantly move configuration between API responses, Kubernetes
          manifests, CI/CD files and docker-compose.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. Your data is
          never sent to a server, so it is safe to use with config files, secret
          templates and other sensitive data.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick a direction: <code>JSON → YAML</code> or <code>YAML → JSON</code>.</li>
          <li>Paste your data on the left — the result updates as you type.</li>
          <li>Choose an <code>Indent</code>: 2 or 4 spaces for the output.</li>
          <li>Click <code>Swap</code> to feed the output back as input and verify the round-trip both ways.</li>
          <li>Use <code>Copy</code> to grab the result, or <code>Sample</code> to try it instantly.</li>
        </ul>

        <h2>How JSON and YAML differ</h2>
        <p>
          JSON and YAML describe the same data model — objects, arrays, strings,
          numbers and booleans — but in different ways. <strong>JSON</strong> is
          compact and unambiguous, which APIs and databases love.
          <strong>YAML</strong> uses indentation instead of braces, supports
          comments and reads like prose, which is why it became the standard for
          configuration. When converting YAML to JSON, comments and anchors are
          not preserved because JSON has no equivalent for them. If the input is
          invalid, the tool shows a red status instead of producing broken output.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to tidy up the JSON first? Open the
          <NuxtLink :to="localePath('/json-formatter')">JSON formatter</NuxtLink>.
          For tabular data, try the
          <NuxtLink :to="localePath('/json-to-csv')">JSON ↔ CSV converter</NuxtLink>,
          or work with numbers across radixes in the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
