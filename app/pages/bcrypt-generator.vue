<script setup lang="ts">
import bcrypt from 'bcryptjs'
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'hash' | 'verify'>('hash')

// HASH section state.
const hashPassword = ref('')
const cost = ref(10)

// VERIFY section state.
const verifyPassword = ref('')
const verifyHash = ref('')

// RANDOM (bcrypt salt) + CPU-heavy hashing must NOT run during SSR/prerender.
// Start empty so the server HTML matches the first client render, then populate
// from the click handlers (guarded by import.meta.client).
const output = ref('')
const status = ref<'idle' | 'working' | 'ok'>('idle')

// Verification result: null = not checked yet, true = match, false = no match,
// 'error' = the supplied hash is malformed.
const verifyResult = ref<true | false | 'error' | null>(null)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        hashTab: 'Хешировать',
        verifyTab: 'Проверить',
        password: 'Пароль',
        passwordAria: 'Пароль',
        passwordPlaceholder: 'Введите пароль',
        cost: 'Сложность (cost)',
        costAria: 'Фактор сложности bcrypt',
        costHint: 'Больше cost = медленнее и надёжнее.',
        hashBtn: 'Хешировать',
        hashResult: 'Хеш bcrypt',
        hashResultAria: 'Хеш bcrypt',
        emptyOutput: 'Введите пароль и нажмите «Хешировать» — хеш появится здесь.',
        working: 'Вычисляем хеш…',
        ready: '✓ Хеш готов',
        needPassword: 'Введите пароль, чтобы получить хеш.',
        saltNote:
          'Каждый клик даёт новый хеш (новая соль), но все они проходят проверку для того же пароля.',
        verifyPassword: 'Пароль',
        verifyHashLabel: 'Хеш bcrypt',
        verifyHashAria: 'Хеш bcrypt для проверки',
        verifyHashPlaceholder: '$2a$10$…',
        verifyBtn: 'Проверить',
        needBoth: 'Введите пароль и хеш, чтобы выполнить проверку.',
        match: '✓ Пароль совпадает с хешем',
        noMatch: '✗ Пароль не совпадает с хешем',
        badHash: '✗ Некорректный хеш bcrypt',
      }
    : {
        hashTab: 'Hash',
        verifyTab: 'Verify',
        password: 'Password',
        passwordAria: 'Password',
        passwordPlaceholder: 'Enter a password',
        cost: 'Cost factor',
        costAria: 'bcrypt cost factor',
        costHint: 'Higher cost = slower and safer.',
        hashBtn: 'Hash',
        hashResult: 'bcrypt hash',
        hashResultAria: 'bcrypt hash',
        emptyOutput: 'Enter a password and click Hash — the hash will appear here.',
        working: 'Computing hash…',
        ready: '✓ Hash ready',
        needPassword: 'Enter a password to get a hash.',
        saltNote:
          'Each click yields a different hash (new salt), yet they all verify against the same password.',
        verifyPassword: 'Password',
        verifyHashLabel: 'bcrypt hash',
        verifyHashAria: 'bcrypt hash to verify against',
        verifyHashPlaceholder: '$2a$10$…',
        verifyBtn: 'Verify',
        needBoth: 'Enter a password and a hash to run the check.',
        match: '✓ Password matches the hash',
        noMatch: '✗ Password does not match the hash',
        badHash: '✗ Malformed bcrypt hash',
      },
)

const canHash = computed(() => hashPassword.value.length > 0)
const canVerify = computed(
  () => verifyPassword.value.length > 0 && verifyHash.value.trim().length > 0,
)

function hash() {
  // Random salt + CPU-heavy bcrypt: client-only, never during prerender.
  if (!import.meta.client || !canHash.value) return
  status.value = 'working'
  output.value = bcrypt.hashSync(hashPassword.value, cost.value)
  status.value = 'ok'
}

function verify() {
  // bcryptjs throws on a malformed hash; treat that as "no match" gracefully.
  if (!import.meta.client || !canVerify.value) return
  try {
    verifyResult.value = bcrypt.compareSync(verifyPassword.value, verifyHash.value.trim())
  } catch {
    verifyResult.value = 'error'
  }
}

// Re-running on input changes would leak random/CPU work into render, so we
// just invalidate the stale output and wait for the next button press.
watch([hashPassword, cost], () => {
  output.value = ''
  status.value = 'idle'
})
watch([verifyPassword, verifyHash], () => {
  verifyResult.value = null
})

function clearHash() {
  hashPassword.value = ''
  output.value = ''
  status.value = 'idle'
}

function clearVerify() {
  verifyPassword.value = ''
  verifyHash.value = ''
  verifyResult.value = null
}

function loadHashSample() {
  hashPassword.value = 'correct horse battery staple'
}

function loadVerifySample() {
  // A static, pre-computed bcrypt hash of "correct horse battery staple".
  // Plain string only — no bcrypt call at setup, safe for prerender.
  verifyPassword.value = 'correct horse battery staple'
  verifyHash.value = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  verifyResult.value = null
}

const faqEn: FaqItem[] = [
  {
    q: 'Is my password sent to a server?',
    a: 'No. Both hashing and verification run entirely in your browser using the bcryptjs library — nothing is uploaded, logged or stored. Your secrets never leave the browser, so it is safe to hash and check production passwords here.',
  },
  {
    q: 'Why does hashing the same password give a different result each time?',
    a: 'bcrypt generates a fresh random salt on every run and embeds it in the output, so the same password produces a different hash each click. That is by design — it stops two identical passwords from sharing a hash. All of those hashes still verify against the original password.',
  },
  {
    q: 'What does the cost factor do?',
    a: 'The cost (work factor) sets how many rounds bcrypt runs: each step up doubles the time to compute and to crack the hash. 10 is a sensible default, 12 is stronger but noticeably slower. Higher values also slow down every login check, so balance security against load.',
  },
  {
    q: 'How does verification work without storing the salt separately?',
    a: 'A bcrypt hash already contains its version, cost and salt inside the string itself (the $2a$10$… prefix). Verify re-hashes the password using that embedded salt and cost, then compares — so you only need the password and the single hash string.',
  },
  {
    q: 'What happens if the hash I paste is malformed?',
    a: 'Verification handles it gracefully: if the string is not a valid bcrypt hash, the tool shows a red "malformed hash" badge instead of crashing. Make sure you paste the whole hash, starting with $2a$, $2b$ or $2y$.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой пароль на сервер?',
    a: 'Нет. И хеширование, и проверка выполняются целиком в браузере через библиотеку bcryptjs — ничего не загружается, не логируется и не сохраняется. Секреты не покидают браузер, поэтому здесь безопасно хешировать и проверять даже боевые пароли.',
  },
  {
    q: 'Почему один и тот же пароль каждый раз даёт разный хеш?',
    a: 'bcrypt генерирует новую случайную соль при каждом запуске и встраивает её в результат, поэтому один и тот же пароль при каждом клике даёт другой хеш. Так и задумано: это не даёт двум одинаковым паролям получить одинаковый хеш. При этом все такие хеши успешно проходят проверку исходным паролем.',
  },
  {
    q: 'Что делает фактор сложности (cost)?',
    a: 'Cost (work factor) задаёт число раундов bcrypt: каждый шаг вверх удваивает время вычисления и взлома хеша. 10 — разумное значение по умолчанию, 12 надёжнее, но заметно медленнее. Большие значения замедляют и каждую проверку входа, поэтому ищите баланс между безопасностью и нагрузкой.',
  },
  {
    q: 'Как работает проверка, если соль не хранится отдельно?',
    a: 'Хеш bcrypt уже содержит версию, cost и соль внутри самой строки (префикс $2a$10$…). Проверка заново хеширует пароль с этой встроенной солью и cost, а затем сравнивает результат — поэтому достаточно пароля и одной строки хеша.',
  },
  {
    q: 'Что будет, если вставленный хеш некорректен?',
    a: 'Проверка обрабатывает это аккуратно: если строка не является корректным хешем bcrypt, инструмент показывает красный бейдж «некорректный хеш», а не падает с ошибкой. Убедитесь, что вставили хеш целиком, начиная с $2a$, $2b$ или $2y$.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="bcrypt-generator" :faq="faq">
    <!-- Mode toggle -->
    <div class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700">
      <button
        type="button"
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="mode === 'hash' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
        @click="mode = 'hash'"
      >{{ ui.hashTab }}</button>
      <button
        type="button"
        class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
        :class="mode === 'verify' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
        @click="mode = 'verify'"
      >{{ ui.verifyTab }}</button>
    </div>

    <!-- HASH section -->
    <div v-show="mode === 'hash'" class="mt-4">
      <div>
        <label class="label" for="bcrypt-pass">{{ ui.password }}</label>
        <input
          id="bcrypt-pass"
          v-model="hashPassword"
          type="text"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          :placeholder="ui.passwordPlaceholder"
          :aria-label="ui.passwordAria"
          @keyup.enter="hash"
        />
      </div>

      <!-- Toolbar -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" class="btn-primary" :disabled="!canHash" @click="hash">
          {{ ui.hashBtn }}
        </button>

        <label class="ml-1 flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          {{ ui.cost }}
          <select v-model.number="cost" class="field !w-auto !py-1.5" :aria-label="ui.costAria">
            <option v-for="c in [8, 10, 12]" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>

        <div class="ml-auto flex items-center gap-2">
          <button type="button" class="btn-ghost" @click="loadHashSample">{{ t('common.sample') }}</button>
          <button type="button" class="btn-ghost" @click="clearHash">{{ t('common.clear') }}</button>
          <CopyButton :text="() => output" />
        </div>
      </div>

      <!-- Status line -->
      <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
        <span v-if="status === 'working'" class="text-ink-400">{{ ui.working }}</span>
        <span
          v-else-if="status === 'ok' && output"
          class="font-medium text-green-600 dark:text-green-400"
        >{{ ui.ready }}</span>
        <span v-else-if="!canHash" class="text-ink-400">{{ ui.needPassword }}</span>
        <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
      </div>

      <!-- Output: random/CPU work, so render on the client only -->
      <div class="mt-3">
        <label class="label">{{ ui.hashResult }}</label>
        <ClientOnly>
          <textarea
            :value="output"
            readonly
            rows="2"
            class="textarea-code !min-h-0 bg-ink-50 dark:bg-ink-900"
            spellcheck="false"
            :placeholder="ui.emptyOutput"
            :aria-label="ui.hashResultAria"
          />
          <template #fallback>
            <textarea
              readonly
              rows="2"
              class="textarea-code !min-h-0 bg-ink-50 dark:bg-ink-900"
              :placeholder="ui.emptyOutput"
              :aria-label="ui.hashResultAria"
            />
          </template>
        </ClientOnly>
        <p class="mt-2 text-xs text-ink-500 dark:text-ink-400">{{ ui.saltNote }}</p>
        <p class="mt-1 text-xs text-ink-500 dark:text-ink-400">{{ ui.costHint }}</p>
      </div>
    </div>

    <!-- VERIFY section -->
    <div v-show="mode === 'verify'" class="mt-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label" for="bcrypt-verify-pass">{{ ui.verifyPassword }}</label>
          <input
            id="bcrypt-verify-pass"
            v-model="verifyPassword"
            type="text"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :placeholder="ui.passwordPlaceholder"
            :aria-label="ui.verifyPassword"
            @keyup.enter="verify"
          />
        </div>
        <div>
          <label class="label" for="bcrypt-verify-hash">{{ ui.verifyHashLabel }}</label>
          <input
            id="bcrypt-verify-hash"
            v-model="verifyHash"
            type="text"
            class="field font-mono"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :placeholder="ui.verifyHashPlaceholder"
            :aria-label="ui.verifyHashAria"
            @keyup.enter="verify"
          />
        </div>
      </div>

      <!-- Toolbar -->
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" class="btn-primary" :disabled="!canVerify" @click="verify">
          {{ ui.verifyBtn }}
        </button>
        <div class="ml-auto flex items-center gap-2">
          <button type="button" class="btn-ghost" @click="loadVerifySample">{{ t('common.sample') }}</button>
          <button type="button" class="btn-ghost" @click="clearVerify">{{ t('common.clear') }}</button>
        </div>
      </div>

      <!-- Result badge: client-only (depends on a bcrypt call) -->
      <div class="mt-4 flex min-h-[2.5rem] items-center text-sm">
        <ClientOnly>
          <span
            v-if="verifyResult === true"
            class="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 font-medium text-green-700 dark:text-green-400"
          >{{ ui.match }}</span>
          <span
            v-else-if="verifyResult === false"
            class="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 font-medium text-red-700 dark:text-red-400"
          >{{ ui.noMatch }}</span>
          <span
            v-else-if="verifyResult === 'error'"
            class="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 font-medium text-red-700 dark:text-red-400"
          >{{ ui.badHash }}</span>
          <span v-else-if="!canVerify" class="text-ink-400">{{ ui.needBoth }}</span>
          <span v-else class="text-ink-400">{{ t('common.startHint') }}</span>
        </ClientOnly>
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор и проверка bcrypt онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор bcrypt</strong> хеширует пароль с
          выбранным фактором сложности (cost) и проверяет любой пароль по
          существующему хешу bcrypt. bcrypt — это медленный хеш с автоматической
          солью, разработанный специально для безопасного хранения паролей:
          подбор перебором обходится дорого, а соль исключает атаки по радужным
          таблицам.
        </p>
        <p>
          Всё считается <strong>полностью в браузере</strong> через библиотеку
          bcryptjs. Пароли и хеши никуда не отправляются, не логируются и не
          сохраняются, поэтому инструмент безопасен даже для боевых учётных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>В режиме <code>Хешировать</code> введите пароль и выберите <code>Сложность (cost)</code> — по умолчанию 10.</li>
          <li>Нажмите <code>Хешировать</code> и скопируйте получившийся хеш bcrypt.</li>
          <li>Каждый клик даёт новый хеш (новая соль) — это нормально, все они проверяются одним и тем же паролем.</li>
          <li>В режиме <code>Проверить</code> введите пароль и существующий хеш, затем нажмите <code>Проверить</code>.</li>
          <li>Зелёный бейдж означает совпадение, красный — несовпадение или некорректный хеш.</li>
        </ul>

        <h2>Зачем нужен фактор сложности (cost)</h2>
        <p>
          Параметр cost задаёт число раундов bcrypt: каждый шаг вверх удваивает
          время вычисления и, соответственно, стоимость взлома. Значение 10 —
          разумный баланс для большинства приложений, 12 надёжнее, но заметно
          медленнее. Помните, что большой cost замедляет и обычную проверку
          пароля при входе, поэтому подбирайте его под нагрузку вашего сервера.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужны контрольные суммы или другие алгоритмы? Откройте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>.
          Создаёте запись Basic Auth для Apache или Nginx — используйте
          <NuxtLink :to="localePath('/htpasswd-generator')">генератор .htpasswd</NuxtLink>,
          а сам надёжный пароль удобно получить в
          <NuxtLink :to="localePath('/password-generator')">генераторе паролей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online bcrypt generator and checker</h2>
        <p>
          This free <strong>bcrypt generator</strong> hashes a password at the
          cost factor you choose and verifies any password against an existing
          bcrypt hash. bcrypt is a deliberately slow, auto-salted hash built
          specifically for storing passwords: brute force is expensive and the
          salt defeats rainbow-table attacks.
        </p>
        <p>
          Everything is computed <strong>entirely in your browser</strong> with
          the bcryptjs library. Passwords and hashes are never sent to a server,
          logged or stored, so the tool is safe even for production credentials.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>In <code>Hash</code> mode, enter a password and pick the <code>Cost factor</code> — 10 by default.</li>
          <li>Click <code>Hash</code> and copy the resulting bcrypt hash.</li>
          <li>Each click yields a different hash (new salt) — that is expected, and they all verify against the same password.</li>
          <li>In <code>Verify</code> mode, enter a password and an existing hash, then click <code>Verify</code>.</li>
          <li>A green badge means a match, a red one means a mismatch or a malformed hash.</li>
        </ul>

        <h2>Why the cost factor matters</h2>
        <p>
          The cost parameter sets how many rounds bcrypt runs: each step up
          doubles the compute time and therefore the cost to crack. 10 is a
          sensible balance for most applications, 12 is stronger but noticeably
          slower. Remember that a high cost also slows down every login check, so
          tune it to your server's load.
        </p>

        <h2>Related tools</h2>
        <p>
          Need checksums or other algorithms? Open the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
          Building a Basic Auth entry for Apache or Nginx? Use the
          <NuxtLink :to="localePath('/htpasswd-generator')">.htpasswd generator</NuxtLink>,
          and grab a strong password itself from the
          <NuxtLink :to="localePath('/password-generator')">password generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
