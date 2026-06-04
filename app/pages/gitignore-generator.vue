<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

interface Template {
  id: string
  label: string
  patterns: string
}

// In-file reference data. Pure constant — identical in Node prerender and the
// browser, so the whole page is SSG-safe with no ClientOnly needed.
const templates: Template[] = [
  {
    id: 'node',
    label: 'Node',
    patterns: `# Dependencies
node_modules/
.pnp/
.pnp.js

# Build output
dist/
build/
out/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Coverage and caches
coverage/
.nyc_output/
.cache/
.eslintcache

# Environment
.env
.env.local
.env.*.local`,
  },
  {
    id: 'python',
    label: 'Python',
    patterns: `# Byte-compiled / optimized
__pycache__/
*.py[cod]
*$py.class

# Distribution / packaging
build/
dist/
*.egg-info/
.eggs/

# Virtual environments
.venv/
venv/
env/
ENV/

# Test and type caches
.pytest_cache/
.mypy_cache/
.ruff_cache/
.tox/
htmlcov/
.coverage

# Jupyter
.ipynb_checkpoints/`,
  },
  {
    id: 'java',
    label: 'Java',
    patterns: `# Compiled class files
*.class

# Packages
*.jar
*.war
*.ear

# Build tools
target/
build/
.gradle/

# Logs and reports
*.log
hs_err_pid*

# Maven wrapper
!.mvn/wrapper/maven-wrapper.jar`,
  },
  {
    id: 'go',
    label: 'Go',
    patterns: `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary and coverage
*.test
*.out
coverage.txt

# Dependency directory
vendor/

# Go workspace
go.work
go.work.sum`,
  },
  {
    id: 'rust',
    label: 'Rust',
    patterns: `# Build output
/target/

# Backtrace
*.rs.bk

# MSVC debug info
*.pdb

# Lock file (libraries only — keep for binaries)
# Cargo.lock`,
  },
  {
    id: 'dotnet',
    label: 'C# / .NET',
    patterns: `# Build results
bin/
obj/
[Dd]ebug/
[Rr]elease/

# User-specific files
*.user
*.suo
*.userprefs

# Visual Studio
.vs/
*.cache

# NuGet
*.nupkg
packages/`,
  },
  {
    id: 'macos',
    label: 'macOS',
    patterns: `.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
.fseventsd
.DocumentRevisions-V100
.VolumeIcon.icns
Icon\r`,
  },
  {
    id: 'windows',
    label: 'Windows',
    patterns: `Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
Desktop.ini
$RECYCLE.BIN/
*.lnk
*.stackdump`,
  },
  {
    id: 'linux',
    label: 'Linux',
    patterns: `*~
.fuse_hidden*
.directory
.Trash-*
.nfs*`,
  },
  {
    id: 'jetbrains',
    label: 'JetBrains (IDEA)',
    patterns: `# JetBrains IDEs (IntelliJ, WebStorm, PyCharm, GoLand…)
.idea/
*.iml
*.ipr
*.iws
out/

# File-based project format
*.iml.bak`,
  },
  {
    id: 'vscode',
    label: 'VS Code',
    patterns: `.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.code-workspace
.history/`,
  },
  {
    id: 'vim',
    label: 'Vim',
    patterns: `# Swap files
[._]*.s[a-v][a-z]
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]

# Session and backups
Session.vim
Sessionx.vim
.netrwhist
*~
tags`,
  },
  {
    id: 'logs',
    label: 'Logs & temp',
    patterns: `# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp
*.bak
*.swp
*.swo
*.orig
tmp/
temp/`,
  },
  {
    id: 'env',
    label: 'Environment & secrets',
    patterns: `# Environment variables
.env
.env.*
!.env.example

# Secrets and credentials
*.pem
*.key
*.p12
*.pfx
secrets.json
credentials.json
.netrc`,
  },
]

// Selection state is plain reactive data — no DOM, no clock, no randomness.
const selected = ref<Set<string>>(new Set(['node', 'macos', 'env']))

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function selectAll() {
  selected.value = new Set(templates.map((t) => t.id))
}

function clearAll() {
  selected.value = new Set()
}

// Output is a pure computed: concatenate the selected templates in registry
// order, each section prefixed with a "# <label>" comment header.
const output = computed(() => {
  const chosen = templates.filter((tpl) => selected.value.has(tpl.id))
  if (chosen.length === 0) return ''
  return chosen
    .map((tpl) => `# ${tpl.label}\n${tpl.patterns}`)
    .join('\n\n')
})

const selectedCount = computed(() => selected.value.size)
const lineCount = computed(() =>
  output.value ? output.value.split('\n').length : 0,
)

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        pickHint: 'Выберите технологии и окружения, для которых нужно сгенерировать .gitignore.',
        selectAll: 'Выбрать все',
        clearAll: 'Снять все',
        selectedLabel: 'выбрано',
        lines: 'строк',
        download: 'Скачать .gitignore',
        outputAria: 'Сгенерированный .gitignore',
        emptyState: 'Выберите хотя бы один шаблон выше, чтобы собрать файл .gitignore.',
        outputLabel: 'Файл .gitignore',
      }
    : {
        pickHint: 'Pick the technologies and environments you want a .gitignore for.',
        selectAll: 'Select all',
        clearAll: 'Clear all',
        selectedLabel: 'selected',
        lines: 'lines',
        download: 'Download .gitignore',
        outputAria: 'Generated .gitignore',
        emptyState: 'Select at least one template above to assemble your .gitignore file.',
        outputLabel: '.gitignore file',
      },
)

// Build the download inside the click handler only — Blob and object URL are
// browser-only APIs and must never run during prerender/setup.
function download() {
  const content = output.value
  if (!content) return
  const blob = new Blob([content + '\n'], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '.gitignore'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const faqEn: FaqItem[] = [
  {
    q: 'Is anything I select sent to a server?',
    a: 'No. Every .gitignore template ships with the page and the file is assembled entirely in your browser with JavaScript. Your selections, the generated output and the download all stay on your device — nothing is uploaded, logged or stored.',
  },
  {
    q: 'What is a .gitignore file for?',
    a: 'It tells Git which files and folders to leave untracked, so build output, dependencies, editor settings, logs and secrets never get committed. Place it in your repository root (you can also add one in any subfolder for rules scoped to that directory).',
  },
  {
    q: 'Can I combine multiple languages and operating systems?',
    a: 'Yes — that is the point. Tick Node plus Python, then add macOS and JetBrains, for example. The tool concatenates each selected template under its own "# Label" comment header so you can see where every block comes from.',
  },
  {
    q: 'Why should I ignore .env files?',
    a: 'Environment files usually hold secrets like API keys, database URLs and tokens. Committing them leaks credentials into your history forever. The Environment & secrets template ignores .env and common key files while keeping .env.example so teammates know which variables to set.',
  },
  {
    q: 'Should I commit my lock files and the target folder?',
    a: 'Commit lock files (package-lock.json, Cargo.lock for binaries, go.sum) so builds are reproducible, but ignore generated output such as node_modules/, dist/, target/ and bin/. The templates here follow these common conventions out of the box.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой выбор на сервер?',
    a: 'Нет. Все шаблоны .gitignore поставляются вместе со страницей, а файл собирается полностью в браузере на JavaScript. Выбор, итоговый результат и скачивание остаются на вашем устройстве — ничего не загружается, не логируется и не сохраняется.',
  },
  {
    q: 'Зачем нужен файл .gitignore?',
    a: 'Он указывает Git, какие файлы и папки не отслеживать, чтобы артефакты сборки, зависимости, настройки редактора, логи и секреты не попадали в коммиты. Разместите его в корне репозитория (можно добавить .gitignore и в подпапку — правила будут действовать в её пределах).',
  },
  {
    q: 'Можно ли совместить несколько языков и операционных систем?',
    a: 'Да, в этом и смысл. Отметьте, например, Node и Python, добавьте macOS и JetBrains. Инструмент объединяет каждый выбранный шаблон под собственным заголовком-комментарием «# Название», чтобы было видно, откуда взялся каждый блок.',
  },
  {
    q: 'Почему стоит игнорировать файлы .env?',
    a: 'В env-файлах обычно лежат секреты: ключи API, строки подключения к БД и токены. Их коммит навсегда оставляет учётные данные в истории. Шаблон «Окружение и секреты» игнорирует .env и типичные файлы ключей, но сохраняет .env.example, чтобы коллеги знали нужные переменные.',
  },
  {
    q: 'Нужно ли коммитить lock-файлы и папку target?',
    a: 'Lock-файлы (package-lock.json, Cargo.lock для бинарников, go.sum) стоит коммитить ради воспроизводимости сборки, а сгенерированные артефакты — node_modules/, dist/, target/, bin/ — игнорировать. Шаблоны здесь по умолчанию следуют этим общепринятым правилам.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="gitignore-generator" :faq="faq">
    <!-- Template picker -->
    <p class="text-sm text-ink-600 dark:text-ink-300">{{ ui.pickHint }}</p>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="tpl in templates"
        :key="tpl.id"
        type="button"
        class="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="selected.has(tpl.id)
          ? 'border-accent bg-accent text-white'
          : 'border-ink-200 text-ink-600 hover:border-accent dark:border-ink-700 dark:text-ink-300'"
        :aria-pressed="selected.has(tpl.id)"
        @click="toggle(tpl.id)"
      >{{ tpl.label }}</button>
    </div>

    <!-- Bulk controls -->
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" class="btn-ghost" @click="selectAll">{{ ui.selectAll }}</button>
      <button type="button" class="btn-ghost" @click="clearAll">{{ ui.clearAll }}</button>
      <span class="ml-auto text-sm text-ink-400">
        {{ selectedCount }} {{ ui.selectedLabel }}
      </span>
    </div>

    <!-- Output toolbar -->
    <div class="mt-6 flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium text-ink-700 dark:text-ink-200">{{ ui.outputLabel }}</span>
      <span v-if="lineCount" class="text-sm text-ink-400">· {{ lineCount }} {{ ui.lines }}</span>
      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="btn-primary"
          :disabled="!output"
          @click="download"
        >{{ ui.download }}</button>
        <CopyButton :text="() => output" />
      </div>
    </div>

    <!-- Generated .gitignore -->
    <div class="mt-3">
      <textarea
        v-show="output"
        :value="output"
        readonly
        class="textarea-code min-h-[20rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        :aria-label="ui.outputAria"
      />
      <p
        v-show="!output"
        class="min-h-[20rem] rounded-lg border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-400 dark:border-ink-700"
      >
        {{ ui.emptyState }}
      </p>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор .gitignore для любого стека</h2>
        <p>
          Этот бесплатный <strong>генератор .gitignore</strong> собирает готовый файл
          из проверенных шаблонов для популярных языков, IDE и операционных систем.
          Отметьте нужные технологии — Node, Python, Go, Rust, macOS, JetBrains и
          другие — и получите аккуратный <code>.gitignore</code> с понятными
          заголовками-комментариями для каждого блока, который можно скопировать или
          скачать одним нажатием.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Шаблоны загружаются
          вместе со страницей, файл собирается локально, а ваш выбор и результат не
          отправляются на сервер.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Нажмите на чипы с нужными технологиями и окружениями — они отмечаются мгновенно.</li>
          <li>Комбинируйте сколько угодно блоков: язык + IDE + операционную систему.</li>
          <li>Используйте <code>Выбрать все</code> или <code>Снять все</code> для быстрого старта.</li>
          <li>Скопируйте результат кнопкой <code>Копировать</code> или <code>Скачать .gitignore</code>.</li>
          <li>Положите файл <code>.gitignore</code> в корень репозитория и закоммитьте его.</li>
        </ul>

        <h2>Что обычно стоит игнорировать</h2>
        <p>
          В <code>.gitignore</code> попадают сгенерированные и локальные файлы:
          зависимости (<code>node_modules/</code>, <code>vendor/</code>), артефакты
          сборки (<code>dist/</code>, <code>target/</code>, <code>bin/</code>), логи и
          временные файлы, настройки редактора и IDE, а также секреты в
          <code>.env</code> и файлах ключей. При этом lock-файлы и
          <code>.env.example</code> обычно <em>оставляют</em> в репозитории, чтобы
          сборка была воспроизводимой, а коллеги знали необходимые переменные —
          шаблоны здесь учитывают это по умолчанию.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Настраиваете проект и доступы? Создайте надёжный пароль в
          <NuxtLink :to="localePath('/password-generator')">генераторе паролей</NuxtLink>,
          подготовьте файл аутентификации в
          <NuxtLink :to="localePath('/htpasswd-generator')">генераторе .htpasswd</NuxtLink>
          или поделитесь ссылкой через
          <NuxtLink :to="localePath('/qr-code-generator')">генератор QR-кодов</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>.gitignore generator for any stack</h2>
        <p>
          This free <strong>.gitignore generator</strong> assembles a ready-to-use
          file from battle-tested templates for popular languages, IDEs and operating
          systems. Tick the technologies you need — Node, Python, Go, Rust, macOS,
          JetBrains and more — and get a clean <code>.gitignore</code> with a clear
          comment header for each block that you can copy or download in one click.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. The templates
          ship with the page, the file is assembled locally, and your selections and
          output are never sent to a server.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Click the chips for the technologies and environments you need — they toggle instantly.</li>
          <li>Combine as many blocks as you like: language + IDE + operating system.</li>
          <li>Use <code>Select all</code> or <code>Clear all</code> for a quick start.</li>
          <li>Grab the result with <code>Copy</code>, or use <code>Download .gitignore</code>.</li>
          <li>Drop the <code>.gitignore</code> file in your repository root and commit it.</li>
        </ul>

        <h2>What you usually want to ignore</h2>
        <p>
          A <code>.gitignore</code> targets generated and local files: dependencies
          (<code>node_modules/</code>, <code>vendor/</code>), build artifacts
          (<code>dist/</code>, <code>target/</code>, <code>bin/</code>), logs and
          temporary files, editor and IDE settings, and secrets in <code>.env</code>
          and key files. Lock files and <code>.env.example</code> are usually
          <em>kept</em> in the repo so builds are reproducible and teammates know which
          variables to set — the templates here follow that convention by default.
        </p>

        <h2>Related tools</h2>
        <p>
          Setting up a project and its access? Create a strong password in the
          <NuxtLink :to="localePath('/password-generator')">password generator</NuxtLink>,
          prepare an auth file with the
          <NuxtLink :to="localePath('/htpasswd-generator')">.htpasswd generator</NuxtLink>,
          or share a link via the
          <NuxtLink :to="localePath('/qr-code-generator')">QR code generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
