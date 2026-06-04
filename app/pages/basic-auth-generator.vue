<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const mode = ref<'encode' | 'decode'>('encode')

// Encode inputs
const username = ref('')
const password = ref('')

// Decode input (a full "Authorization: Basic xxx" header or a bare Base64 string)
const headerInput = ref('')

// Tool-specific labels (common verbs like Encode/Decode/Swap/Copy come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        conversionMode: 'Режим',
        username: 'Имя пользователя',
        usernameAria: 'Имя пользователя',
        usernamePlaceholder: 'admin',
        password: 'Пароль',
        passwordAria: 'Пароль',
        passwordPlaceholder: 'Введите пароль',
        credentials: 'Учётные данные (Base64)',
        credentialsAria: 'Учётные данные в Base64',
        header: 'Заголовок Authorization',
        headerAria: 'Полный заголовок Authorization',
        headerInput: 'Заголовок или строка Base64',
        headerInputAria: 'Заголовок Authorization или строка Base64',
        headerInputPlaceholder: 'Authorization: Basic YWRtaW46c2VjcmV0',
        decodedUser: 'Имя пользователя',
        decodedPass: 'Пароль',
        decodedUserAria: 'Декодированное имя пользователя',
        decodedPassAria: 'Декодированный пароль',
        ready: '✓ Заголовок готов',
        decoded: '✓ Декодировано',
        cannotDecode: '✗ Не удаётся декодировать',
        invalidBase64: 'Некорректная строка Base64 —',
        noColon: 'В декодированных данных нет «:» — это не похоже на учётные данные Basic Auth.',
        hintEncode: 'Введите имя пользователя и пароль, чтобы получить заголовок Basic Auth.',
        hintDecode: 'Вставьте заголовок Authorization или строку Base64, чтобы извлечь логин и пароль.',
        emptyCredentials: 'Здесь появятся учётные данные Base64…',
        emptyHeader: 'Здесь появится полный заголовок…',
        emptyDecoded: '—',
        colonNote: 'Пароль может содержать «:» — разделяется только первое двоеточие.',
      }
    : {
        conversionMode: 'Mode',
        username: 'Username',
        usernameAria: 'Username',
        usernamePlaceholder: 'admin',
        password: 'Password',
        passwordAria: 'Password',
        passwordPlaceholder: 'Enter a password',
        credentials: 'Credentials (Base64)',
        credentialsAria: 'Base64 credentials',
        header: 'Authorization header',
        headerAria: 'Full Authorization header',
        headerInput: 'Header or Base64 string',
        headerInputAria: 'Authorization header or Base64 string',
        headerInputPlaceholder: 'Authorization: Basic YWRtaW46c2VjcmV0',
        decodedUser: 'Username',
        decodedPass: 'Password',
        decodedUserAria: 'Decoded username',
        decodedPassAria: 'Decoded password',
        ready: '✓ Header ready',
        decoded: '✓ Decoded',
        cannotDecode: '✗ Cannot decode',
        invalidBase64: 'Invalid Base64 —',
        noColon: 'The decoded data has no ":" — it does not look like Basic Auth credentials.',
        hintEncode: 'Enter a username and password to build the Basic Auth header.',
        hintDecode: 'Paste an Authorization header or Base64 string to extract the username and password.',
        emptyCredentials: 'Base64 credentials appear here…',
        emptyHeader: 'The full header appears here…',
        emptyDecoded: '—',
        colonNote: 'A password may contain ":" — only the first colon is treated as the separator.',
      },
)

// --- Base64 helpers (UTF-8 safe; NOT called on the empty initial state) ---

function bytesToBase64(bytes: Uint8Array): string {
  // Build a binary string in chunks to avoid blowing the call stack on big inputs.
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Encode "user:pass" as UTF-8 bytes, then Base64. Only call on the client. */
function encodeCredentials(user: string, pass: string): string {
  const bytes = new TextEncoder().encode(`${user}:${pass}`)
  return bytesToBase64(bytes)
}

/** Strip an optional "Authorization: Basic" scheme and return the bare Base64. */
function stripScheme(raw: string): string {
  return raw
    .trim()
    .replace(/^Authorization\s*:\s*/i, '')
    .replace(/^Basic\s+/i, '')
    .trim()
}

/** Decode a bare Base64 string into { user, pass }; throws on invalid input. */
function decodeCredentials(b64: string): { user: string; pass: string } {
  const cleaned = b64.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned) || cleaned.length % 4 === 1) {
    throw new Error(
      locale.value === 'ru'
        ? 'строка содержит недопустимые символы'
        : 'the string contains characters that are not valid Base64',
    )
  }
  // fatal:true makes TextDecoder throw on malformed UTF-8 instead of inserting U+FFFD.
  const text = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(cleaned))
  const i = text.indexOf(':')
  if (i === -1) {
    throw new Error('__NO_COLON__')
  }
  // The password itself may contain ":", so split only on the first one.
  return { user: text.slice(0, i), pass: text.slice(i + 1) }
}

// --- Live results ---
//
// SSG-safety: btoa/atob/TextEncoder/TextDecoder are only invoked when the
// relevant input is non-empty, so the default (empty) prerender never runs
// any encoding. They also exist in Node, so a populated state would be safe
// too, but we keep work behind the non-empty guards by design.

const credentials = computed(() => {
  if (mode.value !== 'encode') return ''
  if (!username.value && !password.value) return ''
  return encodeCredentials(username.value, password.value)
})

const authHeader = computed(() =>
  credentials.value ? `Authorization: Basic ${credentials.value}` : '',
)

const decoded = computed<
  { ok: true; user: string; pass: string } | { ok: false; error: string }
>(() => {
  if (mode.value !== 'decode') return { ok: true, user: '', pass: '' }
  const bare = stripScheme(headerInput.value)
  if (!bare) return { ok: true, user: '', pass: '' }
  try {
    const { user, pass } = decodeCredentials(bare)
    return { ok: true, user, pass }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
})

const decodeError = computed(() => (decoded.value.ok ? null : decoded.value.error))
const noColon = computed(() => decodeError.value === '__NO_COLON__')
const decodedUser = computed(() => (decoded.value.ok ? decoded.value.user : ''))
const decodedPass = computed(() => (decoded.value.ok ? decoded.value.pass : ''))

const hasEncodeInput = computed(() => username.value.length > 0 || password.value.length > 0)
const hasDecodeInput = computed(() => stripScheme(headerInput.value).length > 0)
const hasDecodeResult = computed(() => decoded.value.ok && (decodedUser.value !== '' || decodedPass.value !== ''))

// --- Actions ---

function swap() {
  if (mode.value === 'encode') {
    // Send the freshly built header into the decode input, then flip.
    if (!authHeader.value) return
    headerInput.value = authHeader.value
    mode.value = 'decode'
  } else {
    // Send the decoded credentials back into the encode fields, then flip.
    if (!decoded.value.ok || !hasDecodeResult.value) return
    username.value = decoded.value.user
    password.value = decoded.value.pass
    mode.value = 'encode'
  }
}

function clear() {
  username.value = ''
  password.value = ''
  headerInput.value = ''
}

function loadSample() {
  if (mode.value === 'encode') {
    username.value = 'admin'
    password.value = 's3cr3t:pass'
  } else {
    headerInput.value = 'Authorization: Basic YWRtaW46czNjcjN0OnBhc3M='
  }
}

const faqEn: FaqItem[] = [
  {
    q: 'Are my username and password sent to a server?',
    a: 'No. The header is built and decoded entirely in your browser using the native TextEncoder, btoa and atob APIs. Your username and password are never uploaded, logged or stored, so it is safe to generate Basic Auth headers for production credentials here.',
  },
  {
    q: 'Does Basic Auth Base64 actually protect my password?',
    a: 'No. The "user:password" string is only Base64-encoded, which anyone can reverse instantly — it is encoding, not encryption. Basic Auth offers no confidentiality on its own, so always send it over HTTPS so the header is protected by TLS in transit.',
  },
  {
    q: 'What if my password contains a colon (:)?',
    a: 'That is fine. The credentials are joined as username:password and only the first colon is treated as the separator when decoding, so a password may itself contain any number of ":" characters. A username, however, cannot contain a colon.',
  },
  {
    q: 'Can I paste the whole "Authorization: Basic ..." header to decode it?',
    a: 'Yes. The decoder strips the optional "Authorization:" name and the "Basic" scheme automatically, so you can paste a full header line or just the bare Base64 token. It then Base64-decodes the value and splits it into username and password.',
  },
  {
    q: 'Does it handle non-ASCII characters in the password?',
    a: 'Yes. The credentials are encoded as UTF-8 bytes before Base64, and decoded back through UTF-8, so accented letters, emoji and non-Latin scripts round-trip correctly. Note that servers vary in how they interpret non-ASCII credentials, so ASCII is safest for interoperability.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли логин и пароль на сервер?',
    a: 'Нет. Заголовок создаётся и декодируется полностью в браузере встроенными API TextEncoder, btoa и atob. Имя пользователя и пароль никуда не загружаются, не логируются и не сохраняются, поэтому здесь безопасно создавать заголовки Basic Auth даже для боевых учётных данных.',
  },
  {
    q: 'Защищает ли Base64 в Basic Auth мой пароль?',
    a: 'Нет. Строка «user:password» лишь кодируется в Base64, а это любой мгновенно обратит назад — это кодирование, а не шифрование. Сам по себе Basic Auth не обеспечивает конфиденциальности, поэтому всегда передавайте его только по HTTPS, чтобы заголовок был защищён TLS при передаче.',
  },
  {
    q: 'Что если в пароле есть двоеточие (:)?',
    a: 'Это нормально. Учётные данные склеиваются как username:password, и при декодировании разделителем считается только первое двоеточие, поэтому в пароле может быть сколько угодно символов «:». А вот в имени пользователя двоеточия быть не может.',
  },
  {
    q: 'Можно ли вставить весь заголовок «Authorization: Basic ...» для декодирования?',
    a: 'Да. Декодер автоматически убирает необязательное имя «Authorization:» и схему «Basic», поэтому можно вставить как целую строку заголовка, так и просто голую строку Base64. Затем значение декодируется из Base64 и разбивается на логин и пароль.',
  },
  {
    q: 'Поддерживаются ли неASCII-символы в пароле?',
    a: 'Да. Учётные данные кодируются в байты UTF-8 перед Base64 и декодируются обратно через UTF-8, поэтому буквы с диакритикой, эмодзи и нелатинские письменности проходят туда-обратно без потерь. Учтите, что серверы по-разному трактуют неASCII-данные, поэтому для совместимости надёжнее ASCII.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="basic-auth-generator" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Encode / Decode segmented control -->
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
        >{{ t('common.encode') }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decode' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'decode'"
          @click="mode = 'decode'"
        >{{ t('common.decode') }}</button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="btn-ghost"
          :disabled="mode === 'encode' ? !authHeader : !hasDecodeResult"
          @click="swap"
        >{{ t('common.swap') }}</button>
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="mode === 'decode' && decodeError">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.cannotDecode }}</span>
        <span class="text-ink-500 dark:text-ink-400">
          {{ noColon ? ui.noColon : `${ui.invalidBase64} ${decodeError}.` }}
        </span>
      </template>
      <template v-else-if="mode === 'encode' && hasEncodeInput">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.ready }}</span>
      </template>
      <template v-else-if="mode === 'decode' && hasDecodeResult">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.decoded }}</span>
      </template>
      <span v-else class="text-ink-400">
        {{ mode === 'encode' ? ui.hintEncode : ui.hintDecode }}
      </span>
    </div>

    <!-- ENCODE mode -->
    <div v-if="mode === 'encode'" class="mt-3 grid gap-4 lg:grid-cols-2">
      <!-- Inputs -->
      <div class="grid gap-4">
        <div>
          <label class="label" for="ba-user">{{ ui.username }}</label>
          <input
            id="ba-user"
            v-model="username"
            type="text"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            :placeholder="ui.usernamePlaceholder"
            :aria-label="ui.usernameAria"
          />
        </div>
        <div>
          <label class="label" for="ba-pass">{{ ui.password }}</label>
          <input
            id="ba-pass"
            v-model="password"
            type="text"
            class="field"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            autocorrect="off"
            :placeholder="ui.passwordPlaceholder"
            :aria-label="ui.passwordAria"
          />
        </div>
      </div>

      <!-- Outputs -->
      <div class="grid gap-4">
        <div>
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <label class="label !mb-0" for="ba-credentials">{{ ui.credentials }}</label>
            <CopyButton :text="() => credentials" small />
          </div>
          <input
            id="ba-credentials"
            :value="credentials"
            type="text"
            class="field font-mono text-sm bg-ink-50 dark:bg-ink-900"
            readonly
            spellcheck="false"
            :placeholder="ui.emptyCredentials"
            :aria-label="ui.credentialsAria"
          />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <label class="label !mb-0" for="ba-header">{{ ui.header }}</label>
            <CopyButton :text="() => authHeader" small />
          </div>
          <textarea
            id="ba-header"
            :value="authHeader"
            class="textarea-code !min-h-0 bg-ink-50 dark:bg-ink-900"
            rows="2"
            readonly
            spellcheck="false"
            :placeholder="ui.emptyHeader"
            :aria-label="ui.headerAria"
          />
        </div>
      </div>
    </div>

    <!-- DECODE mode -->
    <div v-else class="mt-3 grid gap-4 lg:grid-cols-2">
      <!-- Input -->
      <div>
        <label class="label" for="ba-header-in">{{ ui.headerInput }}</label>
        <textarea
          id="ba-header-in"
          v-model="headerInput"
          class="textarea-code min-h-[10rem]"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          :placeholder="ui.headerInputPlaceholder"
          :aria-label="ui.headerInputAria"
        />
      </div>

      <!-- Decoded fields -->
      <div class="grid gap-4">
        <div>
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <label class="label !mb-0" for="ba-dec-user">{{ ui.decodedUser }}</label>
            <CopyButton :text="() => decodedUser" small />
          </div>
          <input
            id="ba-dec-user"
            :value="decodeError ? '' : decodedUser"
            type="text"
            class="field font-mono text-sm bg-ink-50 dark:bg-ink-900"
            readonly
            spellcheck="false"
            :placeholder="ui.emptyDecoded"
            :aria-label="ui.decodedUserAria"
          />
        </div>
        <div>
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <label class="label !mb-0" for="ba-dec-pass">{{ ui.decodedPass }}</label>
            <CopyButton :text="() => decodedPass" small />
          </div>
          <input
            id="ba-dec-pass"
            :value="decodeError ? '' : decodedPass"
            type="text"
            class="field font-mono text-sm bg-ink-50 dark:bg-ink-900"
            readonly
            spellcheck="false"
            :placeholder="ui.emptyDecoded"
            :aria-label="ui.decodedPassAria"
          />
        </div>
        <p class="text-xs text-ink-500 dark:text-ink-400">{{ ui.colonNote }}</p>
      </div>
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Генератор заголовка HTTP Basic Auth онлайн</h2>
        <p>
          Этот бесплатный <strong>генератор Basic Auth</strong> превращает имя
          пользователя и пароль в заголовок
          <code>Authorization: Basic &lt;base64&gt;</code> и декодирует его
          обратно — мгновенно и полностью в вашем браузере. Он удобен для
          разработчиков, которым нужно вручную задать заголовок авторизации в
          <code>curl</code>, Postman, тестах API или конфиге обратного прокси.
        </p>
        <p>
          Логин и пароль <strong>никогда не загружаются</strong> на сервер. Вся
          работа происходит локально с помощью браузерных API
          <code>TextEncoder</code>, <code>btoa</code> и <code>atob</code>,
          поэтому инструмент безопасен даже для боевых учётных данных.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Кодировать</code>, чтобы собрать заголовок, или <code>Декодировать</code>, чтобы прочитать существующий.</li>
          <li>В режиме кодирования введите <code>Имя пользователя</code> и <code>Пароль</code> — Base64 и полный заголовок обновляются мгновенно.</li>
          <li>В режиме декодирования вставьте строку <code>Authorization: Basic …</code> или голый Base64 — логин и пароль появятся отдельно.</li>
          <li>Нажмите <code>Поменять местами</code>, чтобы перенести результат в другой режим и проверить преобразование туда-обратно.</li>
          <li>Используйте <code>Копировать</code> рядом с нужным полем или <code>Пример</code>, чтобы загрузить образец.</li>
        </ul>

        <h2>Как устроен Basic Auth</h2>
        <p>
          В HTTP Basic Auth логин и пароль объединяются как
          <code>username:password</code>, кодируются в <strong>Base64</strong> и
          передаются в заголовке <code>Authorization: Basic …</code>. Это
          <strong>кодирование, а не шифрование</strong>: значение тривиально
          раскодировать, поэтому Basic Auth обязательно использовать только
          поверх <strong>HTTPS</strong>, где TLS защищает заголовок при передаче.
          Разделителем считается только первое двоеточие, поэтому пароль может
          содержать символ «:», а имя пользователя — нет.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Чтобы захешировать пароль для файла, используйте
          <NuxtLink :to="localePath('/htpasswd-generator')">генератор .htpasswd</NuxtLink>.
          Для произвольного кодирования откройте
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик Base64</NuxtLink>,
          а для токенов — <NuxtLink :to="localePath('/jwt-generator')">генератор JWT</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Online HTTP Basic Auth header generator</h2>
        <p>
          This free <strong>Basic Auth generator</strong> turns a username and
          password into an <code>Authorization: Basic &lt;base64&gt;</code>
          header, and decodes one back — instantly and entirely in your browser.
          It is handy for developers who need to set the authorization header by
          hand in <code>curl</code>, Postman, API tests or a reverse-proxy config.
        </p>
        <p>
          Your username and password are <strong>never uploaded</strong> to a
          server. All work happens locally with the browser's
          <code>TextEncoder</code>, <code>btoa</code> and <code>atob</code> APIs,
          which makes it safe even for production credentials.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick <code>Encode</code> to build a header, or <code>Decode</code> to read an existing one.</li>
          <li>In encode mode, enter a <code>Username</code> and <code>Password</code> — the Base64 and full header update instantly.</li>
          <li>In decode mode, paste an <code>Authorization: Basic …</code> string or bare Base64 — the username and password appear separately.</li>
          <li>Hit <code>Swap</code> to move the result into the other mode and verify a round trip.</li>
          <li>Use the <code>Copy</code> button next to any field, or <code>Sample</code> to load an example.</li>
        </ul>

        <h2>How Basic Auth works</h2>
        <p>
          In HTTP Basic Auth the username and password are joined as
          <code>username:password</code>, encoded as <strong>Base64</strong> and
          sent in the <code>Authorization: Basic …</code> header. This is
          <strong>encoding, not encryption</strong>: the value is trivial to
          reverse, so Basic Auth must only be used over <strong>HTTPS</strong>,
          where TLS protects the header in transit. Only the first colon is the
          separator, so a password may contain a ":" character while a username
          cannot.
        </p>

        <h2>Related tools</h2>
        <p>
          To hash a password for a file, use the
          <NuxtLink :to="localePath('/htpasswd-generator')">.htpasswd generator</NuxtLink>.
          For arbitrary encoding, open the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>,
          and for tokens use the <NuxtLink :to="localePath('/jwt-generator')">JWT generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
