<script setup lang="ts">
import bcrypt from 'bcryptjs'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const username = ref('admin')
const password = ref('')
const algorithm = ref<'bcrypt' | 'sha1'>('bcrypt')
const cost = ref(10)

// RANDOM (bcrypt salt) + ASYNC (crypto.subtle SHA-1): must NOT run during
// SSR/prerender. Start empty so server HTML matches the first client render,
// then populate it from the Generate handler (guarded by import.meta.client).
const output = ref('')
const status = ref<'idle' | 'ok' | 'working'>('idle')

// Tool-specific labels (common verbs like Generate/Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        username: 'Имя пользователя',
        usernameAria: 'Имя пользователя',
        usernamePlaceholder: 'admin',
        password: 'Пароль',
        passwordAria: 'Пароль',
        passwordPlaceholder: 'Введите пароль',
        algorithm: 'Алгоритм',
        algorithmAria: 'Алгоритм хеширования',
        bcrypt: 'bcrypt (рекомендуется)',
        sha1: 'SHA-1',
        cost: 'Сложность (cost)',
        costAria: 'Фактор сложности bcrypt',
        line: 'Строка .htpasswd',
        lineAria: 'Строка .htpasswd',
        ready: '✓ Запись готова',
        working: 'Вычисляем хеш…',
        needPassword: 'Введите пароль, чтобы сгенерировать запись.',
        emptyOutput: 'Заполните поля и нажмите «Сгенерировать» — запись появится здесь.',
        hintTitle: 'Что делать с этой строкой',
        hintBody: 'Добавьте её отдельной строкой в файл .htpasswd, затем подключите его в конфиге сервера.',
        apacheLabel: 'Apache (.htaccess или vhost)',
        nginxLabel: 'Nginx (внутри location)',
        twoYNote: 'Apache ожидает префикс $2y$, поэтому ведущий $2a$/$2b$ из bcryptjs автоматически заменяется на $2y$.',
      }
    : {
        username: 'Username',
        usernameAria: 'Username',
        usernamePlaceholder: 'admin',
        password: 'Password',
        passwordAria: 'Password',
        passwordPlaceholder: 'Enter a password',
        algorithm: 'Algorithm',
        algorithmAria: 'Hashing algorithm',
        bcrypt: 'bcrypt (recommended)',
        sha1: 'SHA-1',
        cost: 'Cost factor',
        costAria: 'bcrypt cost factor',
        line: '.htpasswd line',
        lineAria: '.htpasswd line',
        ready: '✓ Entry ready',
        working: 'Computing hash…',
        needPassword: 'Enter a password to generate an entry.',
        emptyOutput: 'Fill in the fields and click Generate — the entry will appear here.',
        hintTitle: 'What to do with this line',
        hintBody: 'Add it as one line to your .htpasswd file, then reference that file in your server config.',
        apacheLabel: 'Apache (.htaccess or vhost)',
        nginxLabel: 'Nginx (inside a location)',
        twoYNote: 'Apache expects the $2y$ prefix, so the leading $2a$/$2b$ from bcryptjs is automatically rewritten to $2y$.',
      },
)

const canGenerate = computed(() => password.value.length > 0)

/** SHA-1 via WebCrypto, base64-encoded, with the Apache "{SHA}" marker. */
async function sha1Crypt(pw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw))
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return '{SHA}' + btoa(binary)
}

/** bcrypt with a random salt; rewrite the prefix to the Apache-friendly $2y$. */
function bcryptCrypt(pw: string): string {
  const hash = bcrypt.hashSync(pw, cost.value)
  // bcryptjs emits $2a$ / $2b$; Apache's htpasswd expects $2y$.
  return hash.replace(/^\$2[abxy]\$/, '$2y$')
}

async function generate() {
  // Random salt (bcrypt) and crypto.subtle (SHA-1) are client-only.
  if (!import.meta.client || !canGenerate.value) return
  status.value = 'working'
  const user = username.value || 'user'
  let hash: string
  if (algorithm.value === 'bcrypt') {
    hash = bcryptCrypt(password.value)
  } else {
    hash = await sha1Crypt(password.value)
  }
  output.value = `${user}:${hash}`
  status.value = 'ok'
}

// Re-running on option changes would leak random/async work into render, so we
// instead simply invalidate the stale output and wait for the next Generate.
watch([username, password, algorithm, cost], () => {
  output.value = ''
  status.value = 'idle'
})

function clear() {
  password.value = ''
  output.value = ''
  status.value = 'idle'
}

const apacheConfig = `AuthType Basic
AuthName "Restricted"
AuthUserFile /etc/apache2/.htpasswd
Require valid-user`

const nginxConfig = `auth_basic "Restricted";
auth_basic_user_file /etc/nginx/.htpasswd;`

const faqEn: FaqItem[] = [
  {
    q: 'Is my password sent to a server?',
    a: 'No. Both bcrypt and SHA-1 hashing run entirely in your browser — bcrypt via the bcryptjs library and SHA-1 via the WebCrypto crypto.subtle API. Your username and password are never uploaded, logged or stored, so it is safe to generate credentials for production servers here.',
  },
  {
    q: 'Should I use bcrypt or SHA-1?',
    a: 'Use bcrypt. It is a deliberately slow, salted hash that resists brute-force and rainbow-table attacks, and Apache supports it on every modern platform. SHA-1 ({SHA}) is fast and unsalted, so it is only suitable for low-value, legacy setups — it is offered here for compatibility, not security.',
  },
  {
    q: 'Why does the bcrypt hash start with $2y$ instead of $2a$ or $2b$?',
    a: 'They are the same bcrypt algorithm; only the version tag differs. The bcryptjs library emits $2a$/$2b$, but Apache htpasswd writes and expects the $2y$ prefix, so this tool rewrites the leading tag to $2y$. The hash still verifies correctly against the password.',
  },
  {
    q: 'What does the cost factor do?',
    a: 'The cost (work factor) sets how many rounds bcrypt runs: each step up doubles the time to compute and to crack the hash. 10 is a sensible default; 12 is stronger but noticeably slower. Higher values make login checks slower too, so balance security against server load.',
  },
  {
    q: 'How do I use the generated line?',
    a: 'Copy the username:hash line into a file named .htpasswd (one user per line), place it outside your web root, and point your server at it: AuthUserFile in Apache, or auth_basic_user_file in Nginx. Reload the server and Basic Auth will prompt for the credentials.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой пароль на сервер?',
    a: 'Нет. И bcrypt, и SHA-1 вычисляются целиком в браузере — bcrypt через библиотеку bcryptjs, а SHA-1 через WebCrypto API crypto.subtle. Имя пользователя и пароль никуда не загружаются, не логируются и не сохраняются, поэтому здесь безопасно создавать учётные данные даже для боевых серверов.',
  },
  {
    q: 'Что выбрать — bcrypt или SHA-1?',
    a: 'Используйте bcrypt. Это намеренно медленный хеш с солью, устойчивый к перебору и атакам по радужным таблицам, и Apache поддерживает его на всех современных платформах. SHA-1 ({SHA}) быстрый и без соли, поэтому подходит только для малозначимых легаси-конфигураций — он добавлен для совместимости, а не ради безопасности.',
  },
  {
    q: 'Почему bcrypt-хеш начинается с $2y$, а не с $2a$ или $2b$?',
    a: 'Это один и тот же алгоритм bcrypt, отличается лишь метка версии. Библиотека bcryptjs выдаёт $2a$/$2b$, но Apache htpasswd записывает и ожидает префикс $2y$, поэтому инструмент заменяет ведущую метку на $2y$. Хеш по-прежнему корректно проверяется против пароля.',
  },
  {
    q: 'Что делает фактор сложности (cost)?',
    a: 'Cost (work factor) задаёт число раундов bcrypt: каждый шаг вверх удваивает время вычисления и взлома хеша. 10 — разумное значение по умолчанию; 12 надёжнее, но заметно медленнее. Большие значения замедляют и проверку входа, поэтому ищите баланс между безопасностью и нагрузкой на сервер.',
  },
  {
    q: 'Как использовать полученную строку?',
    a: 'Скопируйте строку username:hash в файл .htpasswd (по одному пользователю на строку), разместите его вне веб-корня и укажите серверу: AuthUserFile в Apache или auth_basic_user_file в Nginx. Перезагрузите сервер — и Basic Auth запросит эти учётные данные.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="htpasswd-generator" :faq="faq">
    <!-- Inputs -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="label" for="htpasswd-user">{{ ui.username }}</label>
        <input
          id="htpasswd-user"
          v-model="username"
          type="text"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.usernamePlaceholder"
          :aria-label="ui.usernameAria"
        />
      </div>
      <div>
        <label class="label" for="htpasswd-pass">{{ ui.password }}</label>
        <input
          id="htpasswd-pass"
          v-model="password"
          type="text"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.passwordPlaceholder"
          :aria-label="ui.passwordAria"
          @keyup.enter="generate"
        />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" class="btn-primary" :disabled="!canGenerate" @click="generate">
        {{ t('common.generate') }}
      </button>

      <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
        {{ ui.algorithm }}
        <select v-model="algorithm" class="field !w-auto !py-1.5" :aria-label="ui.algorithmAria">
          <option value="bcrypt">{{ ui.bcrypt }}</option>
          <option value="sha1">{{ ui.sha1 }}</option>
        </select>
      </label>

      <label
        v-if="algorithm === 'bcrypt'"
        class="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300"
      >
        {{ ui.cost }}
        <select v-model.number="cost" class="field !w-auto !py-1.5" :aria-label="ui.costAria">
          <option v-for="c in [8, 9, 10, 11, 12, 13, 14]" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
        <CopyButton :text="() => output" />
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <span v-if="status === 'working'" class="text-ink-400">{{ ui.working }}</span>
      <span v-else-if="status === 'ok' && output" class="font-medium text-green-600 dark:text-green-400">
        {{ ui.ready }}
      </span>
      <span v-else-if="!canGenerate" class="text-ink-400">{{ ui.needPassword }}</span>
      <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
    </div>

    <!-- Output: random/async, so render on the client only -->
    <div class="mt-3">
      <label class="label">{{ ui.line }}</label>
      <ClientOnly>
        <textarea
          :value="output"
          readonly
          rows="2"
          class="textarea-code !min-h-0 bg-ink-50 dark:bg-ink-900"
          spellcheck="false"
          :placeholder="ui.emptyOutput"
          :aria-label="ui.lineAria"
        />
        <template #fallback>
          <textarea
            readonly
            rows="2"
            class="textarea-code !min-h-0 bg-ink-50 dark:bg-ink-900"
            :placeholder="ui.emptyOutput"
            :aria-label="ui.lineAria"
          />
        </template>
      </ClientOnly>
      <p class="mt-2 text-xs text-ink-500 dark:text-ink-400">{{ ui.twoYNote }}</p>
    </div>

    <!-- Server config hint -->
    <div class="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-900/50">
      <p class="text-sm font-medium text-ink-700 dark:text-ink-200">{{ ui.hintTitle }}</p>
      <p class="mt-1 text-sm text-ink-600 dark:text-ink-300">{{ ui.hintBody }}</p>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div class="mb-1 text-xs font-medium text-ink-500 dark:text-ink-400">{{ ui.apacheLabel }}</div>
          <pre class="overflow-auto rounded-md border border-ink-200 bg-white p-3 font-mono text-xs text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200">{{ apacheConfig }}</pre>
        </div>
        <div>
          <div class="mb-1 text-xs font-medium text-ink-500 dark:text-ink-400">{{ ui.nginxLabel }}</div>
          <pre class="overflow-auto rounded-md border border-ink-200 bg-white p-3 font-mono text-xs text-ink-700 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200">{{ nginxConfig }}</pre>
        </div>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор .htpasswd онлайн для Apache и Nginx</h2>
        <p>
          Этот бесплатный <strong>генератор .htpasswd</strong> создаёт записи
          вида <code>username:hash</code> для HTTP Basic Auth — той самой защиты,
          что показывает браузерное окно с логином и паролем. Выберите алгоритм
          <strong>bcrypt</strong> (рекомендуется) или <strong>SHA-1</strong>,
          введите имя пользователя и пароль и получите готовую строку для файла
          <code>.htpasswd</code>.
        </p>
        <p>
          Всё считается <strong>полностью в браузере</strong>: bcrypt — через
          библиотеку bcryptjs, а SHA-1 — через WebCrypto. Пароль никуда не
          отправляется и не логируется, поэтому инструмент безопасен даже для
          учётных данных боевых серверов.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите <code>Имя пользователя</code> и <code>Пароль</code>.</li>
          <li>Выберите <code>Алгоритм</code>: <code>bcrypt</code> для надёжности или <code>SHA-1</code> для совместимости.</li>
          <li>Для bcrypt задайте <code>Сложность (cost)</code> — по умолчанию 10.</li>
          <li>Нажмите <code>Сгенерировать</code> и скопируйте строку <code>username:hash</code>.</li>
          <li>Добавьте её в файл <code>.htpasswd</code> (по одному пользователю на строку) и подключите в конфиге сервера.</li>
        </ul>

        <h2>bcrypt против SHA-1 и префикс $2y$</h2>
        <p>
          <strong>bcrypt</strong> — медленный хеш с солью: каждый раунд (фактор
          cost) удваивает время вычисления, что делает перебор дорогим, а соль
          исключает атаки по радужным таблицам. <strong>SHA-1</strong> быстрый и
          без соли, поэтому годится лишь для малозначимых легаси-конфигов.
          Библиотека bcryptjs выдаёт хеши с префиксом <code>$2a$</code> или
          <code>$2b$</code>, но Apache <code>htpasswd</code> ожидает
          <code>$2y$</code> — это тот же алгоритм, поэтому инструмент
          автоматически переписывает ведущую метку на <code>$2y$</code>, и хеш
          по-прежнему корректно проверяется.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужен сам пароль? Сгенерируйте его в
          <NuxtLink :to="localePath('/password-generator')">генераторе паролей</NuxtLink>.
          Для контрольных сумм откройте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>,
          а разобрать токен поможет
          <NuxtLink :to="localePath('/jwt-decoder')">декодер JWT</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online .htpasswd generator for Apache and Nginx</h2>
        <p>
          This free <strong>.htpasswd generator</strong> creates
          <code>username:hash</code> entries for HTTP Basic Auth — the protection
          that pops up the browser login dialog. Pick the
          <strong>bcrypt</strong> (recommended) or <strong>SHA-1</strong>
          algorithm, type a username and password, and get a ready-to-paste line
          for your <code>.htpasswd</code> file.
        </p>
        <p>
          Everything is computed <strong>entirely in your browser</strong>:
          bcrypt via the bcryptjs library and SHA-1 via WebCrypto. Your password
          is never sent to a server or logged, so it is safe even for production
          server credentials.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Enter a <code>Username</code> and <code>Password</code>.</li>
          <li>Choose an <code>Algorithm</code>: <code>bcrypt</code> for security or <code>SHA-1</code> for legacy compatibility.</li>
          <li>For bcrypt, set the <code>Cost factor</code> — 10 by default.</li>
          <li>Click <code>Generate</code> and copy the <code>username:hash</code> line.</li>
          <li>Add it to a <code>.htpasswd</code> file (one user per line) and reference it in your server config.</li>
        </ul>

        <h2>bcrypt vs. SHA-1 and the $2y$ prefix</h2>
        <p>
          <strong>bcrypt</strong> is a slow, salted hash: each round (the cost
          factor) doubles the compute time, making brute force expensive, while
          the salt defeats rainbow-table attacks. <strong>SHA-1</strong> is fast
          and unsalted, so it only fits low-value legacy setups. The bcryptjs
          library emits hashes with a <code>$2a$</code> or <code>$2b$</code>
          prefix, but Apache <code>htpasswd</code> expects <code>$2y$</code> —
          it is the same algorithm, so this tool rewrites the leading tag to
          <code>$2y$</code> and the hash still verifies correctly.
        </p>

        <h2>Related tools</h2>
        <p>
          Need the password itself? Create one in the
          <NuxtLink :to="localePath('/password-generator')">password generator</NuxtLink>.
          For checksums, open the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>,
          and to inspect a token use the
          <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
