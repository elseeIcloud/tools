<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

/* ------------------------------------------------------------------ *
 * AES-GCM 256 with PBKDF2 (SHA-256) key derivation.
 *
 * Wire format (then Base64-encoded):
 *   salt(16 bytes) || iv(12 bytes) || ciphertext+GCM-tag
 *
 * SSG-SAFETY: nothing here touches crypto.subtle, crypto.getRandomValues,
 * TextEncoder/TextDecoder or btoa/atob at the top level or in any computed.
 * Every crypto call lives inside the async encrypt()/decrypt() handlers,
 * which only run on a user click, so prerender renders the empty state
 * with no error.
 * ------------------------------------------------------------------ */

const ITERATIONS = 150_000
const SALT_BYTES = 16
const IV_BYTES = 12

const mode = ref<'encrypt' | 'decrypt'>('encrypt')
const input = ref('')
const passphrase = ref('')
const output = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

// --- Base64 helpers (only ever called from inside async handlers) ---

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// --- Key derivation (PBKDF2 -> AES-GCM 256) ---

async function deriveKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pass),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

// --- Actions (all crypto strictly inside these handlers) ---

async function encrypt() {
  output.value = ''
  error.value = null
  if (!input.value || !passphrase.value) return
  busy.value = true
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const key = await deriveKey(passphrase.value, salt)
    const cipherBuf = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(input.value),
    )
    const cipher = new Uint8Array(cipherBuf)
    const blob = new Uint8Array(salt.length + iv.length + cipher.length)
    blob.set(salt, 0)
    blob.set(iv, salt.length)
    blob.set(cipher, salt.length + iv.length)
    output.value = bytesToBase64(blob)
  } catch {
    error.value = ui.value.encryptFailed
  } finally {
    busy.value = false
  }
}

async function decrypt() {
  output.value = ''
  error.value = null
  if (!input.value || !passphrase.value) return
  busy.value = true
  try {
    const blob = base64ToBytes(input.value)
    if (blob.length <= SALT_BYTES + IV_BYTES) throw new Error('too short')
    const salt = blob.subarray(0, SALT_BYTES)
    const iv = blob.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES)
    const cipher = blob.subarray(SALT_BYTES + IV_BYTES)
    const key = await deriveKey(passphrase.value, salt)
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher)
    // fatal:true surfaces malformed UTF-8 instead of silently mangling it.
    output.value = new TextDecoder('utf-8', { fatal: true }).decode(plainBuf)
  } catch {
    // Wrong passphrase, tampered blob (GCM tag mismatch) or invalid Base64.
    error.value = ui.value.decryptFailed
  } finally {
    busy.value = false
  }
}

function run() {
  if (mode.value === 'encrypt') encrypt()
  else decrypt()
}

function setMode(next: 'encrypt' | 'decrypt') {
  if (mode.value === next) return
  mode.value = next
  output.value = ''
  error.value = null
}

function clear() {
  input.value = ''
  passphrase.value = ''
  output.value = ''
  error.value = null
}

function loadSample() {
  if (mode.value === 'encrypt') {
    input.value = 'The launch code is hidden in plain sight. 🚀'
    passphrase.value = 'correct horse battery staple'
  }
}

const hasInput = computed(() => input.value.length > 0 && passphrase.value.length > 0)

// Tool-specific labels (common verbs like Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        conversionMode: 'Режим',
        encryptMode: 'Зашифровать',
        decryptMode: 'Расшифровать',
        plaintextLabel: 'Открытый текст',
        ciphertextLabel: 'Зашифрованные данные (Base64)',
        passphraseLabel: 'Пароль',
        passphrasePlaceholder: 'Придумайте надёжный пароль…',
        outputEncryptLabel: 'Зашифрованные данные (Base64)',
        outputDecryptLabel: 'Расшифрованный текст',
        encryptBtn: 'Зашифровать',
        decryptBtn: 'Расшифровать',
        plaintextPlaceholder: 'Введите или вставьте текст для шифрования…',
        ciphertextPlaceholder: 'Вставьте Base64-строку, полученную при шифровании…',
        outputEncryptPlaceholder: 'Здесь появится зашифрованный Base64…',
        outputDecryptPlaceholder: 'Здесь появится расшифрованный текст…',
        encryptFailed: 'Не удалось зашифровать — проверьте ввод и попробуйте снова.',
        decryptFailed: 'Расшифровка не удалась — неверный пароль или повреждённые данные.',
        encrypted: '✓ Зашифровано',
        decrypted: '✓ Расшифровано',
        charsOut: 'символов на выходе',
        hintEncrypt: 'Введите текст и пароль, затем нажмите «Зашифровать».',
        hintDecrypt: 'Вставьте Base64 и введите пароль, затем нажмите «Расшифровать».',
        working: 'Обработка…',
        needBoth: 'Нужны и текст, и пароль.',
      }
    : {
        conversionMode: 'Mode',
        encryptMode: 'Encrypt',
        decryptMode: 'Decrypt',
        plaintextLabel: 'Plain text',
        ciphertextLabel: 'Encrypted data (Base64)',
        passphraseLabel: 'Passphrase',
        passphrasePlaceholder: 'Choose a strong passphrase…',
        outputEncryptLabel: 'Encrypted data (Base64)',
        outputDecryptLabel: 'Decrypted text',
        encryptBtn: 'Encrypt',
        decryptBtn: 'Decrypt',
        plaintextPlaceholder: 'Type or paste the text you want to encrypt…',
        ciphertextPlaceholder: 'Paste the Base64 string produced by encryption…',
        outputEncryptPlaceholder: 'The encrypted Base64 appears here…',
        outputDecryptPlaceholder: 'The decrypted text appears here…',
        encryptFailed: 'Encryption failed — check your input and try again.',
        decryptFailed: 'Decryption failed — wrong password or corrupted data.',
        encrypted: '✓ Encrypted',
        decrypted: '✓ Decrypted',
        charsOut: 'characters out',
        hintEncrypt: 'Enter text and a passphrase, then press Encrypt.',
        hintDecrypt: 'Paste Base64 and enter the passphrase, then press Decrypt.',
        working: 'Working…',
        needBoth: 'Both text and a passphrase are required.',
      },
)

const inputLabel = computed(() =>
  mode.value === 'encrypt' ? ui.value.plaintextLabel : ui.value.ciphertextLabel,
)
const inputPlaceholder = computed(() =>
  mode.value === 'encrypt' ? ui.value.plaintextPlaceholder : ui.value.ciphertextPlaceholder,
)
const outputLabel = computed(() =>
  mode.value === 'encrypt' ? ui.value.outputEncryptLabel : ui.value.outputDecryptLabel,
)
const outputPlaceholder = computed(() =>
  mode.value === 'encrypt' ? ui.value.outputEncryptPlaceholder : ui.value.outputDecryptPlaceholder,
)

const faqEn: FaqItem[] = [
  {
    q: 'Are my text and passphrase sent to a server?',
    a: 'No. Encryption and decryption run entirely in your browser using the built-in WebCrypto API. Your plaintext, your passphrase and the derived key never leave the page — nothing is uploaded, logged or stored — so it is safe to encrypt secrets and private notes here.',
  },
  {
    q: 'What algorithm does this tool use?',
    a: 'It uses AES-GCM with a 256-bit key. The key is derived from your passphrase with PBKDF2 (SHA-256, 150,000 iterations) and a fresh random 16-byte salt, and each encryption uses a fresh random 12-byte IV. The output is the Base64 of salt + IV + ciphertext (which includes the GCM authentication tag).',
  },
  {
    q: 'Why does decryption say "wrong password or corrupted data"?',
    a: 'AES-GCM verifies an authentication tag on decryption. If the passphrase is wrong, or even a single byte of the Base64 blob was changed or truncated, the tag check fails and decryption is rejected. Re-check the exact passphrase and make sure you copied the full, unaltered output.',
  },
  {
    q: 'Can I decrypt the output with OpenSSL or another library?',
    a: 'Only if the other side reproduces this exact scheme: PBKDF2-SHA256 with 150,000 iterations over the 16-byte salt, then AES-256-GCM with the 12-byte IV, where the blob is salt(16) + IV(12) + ciphertext+tag. It is designed to round-trip within this tool; interop requires matching every parameter.',
  },
  {
    q: 'Is this a replacement for real security tooling?',
    a: 'No. AES-GCM-256 with PBKDF2 is solid, but this is a convenience tool, not an audited cryptosystem. For protecting high-value data use vetted software such as age, GnuPG, your password manager or a reviewed library, and never reuse a weak passphrase.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляются ли мой текст и пароль на сервер?',
    a: 'Нет. Шифрование и расшифровка выполняются полностью в браузере через встроенный WebCrypto API. Ваш открытый текст, пароль и производный ключ никогда не покидают страницу — ничего не загружается, не логируется и не сохраняется, поэтому здесь безопасно шифровать секреты и личные заметки.',
  },
  {
    q: 'Какой алгоритм использует инструмент?',
    a: 'Используется AES-GCM с 256-битным ключом. Ключ выводится из пароля через PBKDF2 (SHA-256, 150 000 итераций) со случайной 16-байтовой солью, а для каждого шифрования генерируется свежий случайный 12-байтовый IV. Результат — это Base64 от соль + IV + шифртекст (включающий тег аутентификации GCM).',
  },
  {
    q: 'Почему при расшифровке появляется «неверный пароль или повреждённые данные»?',
    a: 'AES-GCM проверяет тег аутентификации при расшифровке. Если пароль неверный или хотя бы один байт Base64-строки был изменён либо обрезан, проверка тега не проходит и расшифровка отклоняется. Перепроверьте точный пароль и убедитесь, что скопировали весь вывод без изменений.',
  },
  {
    q: 'Можно ли расшифровать результат в OpenSSL или другой библиотеке?',
    a: 'Только если другая сторона воспроизведёт ровно эту схему: PBKDF2-SHA256 с 150 000 итераций по 16-байтовой соли, затем AES-256-GCM с 12-байтовым IV, где блок имеет вид соль(16) + IV(12) + шифртекст+тег. Инструмент рассчитан на круговой обмен внутри себя; для совместимости нужно совпадение всех параметров.',
  },
  {
    q: 'Заменяет ли это полноценные средства защиты?',
    a: 'Нет. AES-GCM-256 с PBKDF2 надёжен, но это инструмент для удобства, а не проверенная аудитом криптосистема. Для защиты ценных данных используйте проверенные программы — age, GnuPG, ваш менеджер паролей или прошедшую ревью библиотеку — и никогда не используйте слабый пароль повторно.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="aes-encryption" :faq="faq">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Encrypt / Decrypt segmented control -->
      <div
        class="inline-flex rounded-lg border border-ink-200 p-0.5 dark:border-ink-700"
        role="group"
        :aria-label="ui.conversionMode"
      >
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'encrypt' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'encrypt'"
          @click="setMode('encrypt')"
        >{{ ui.encryptMode }}</button>
        <button
          type="button"
          class="rounded-md px-3 py-1 text-sm font-medium transition-colors"
          :class="mode === 'decrypt' ? 'bg-accent text-white' : 'text-ink-600 dark:text-ink-300'"
          :aria-pressed="mode === 'decrypt'"
          @click="setMode('decrypt')"
        >{{ ui.decryptMode }}</button>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" :disabled="mode === 'decrypt'" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Input -->
    <div class="mt-3">
      <label for="aes-input" class="label">{{ inputLabel }}</label>
      <textarea
        id="aes-input"
        v-model="input"
        class="textarea-code min-h-[10rem]"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        autocorrect="off"
        :placeholder="inputPlaceholder"
        :aria-label="inputLabel"
      />
    </div>

    <!-- Passphrase + action -->
    <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="flex-1">
        <label for="aes-pass" class="label">{{ ui.passphraseLabel }}</label>
        <input
          id="aes-pass"
          v-model="passphrase"
          type="password"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          :placeholder="ui.passphrasePlaceholder"
          :aria-label="ui.passphraseLabel"
          @keyup.enter="run"
        />
      </div>
      <button
        type="button"
        class="btn-primary shrink-0"
        :disabled="!hasInput || busy"
        @click="run"
      >
        {{ busy ? ui.working : (mode === 'encrypt' ? ui.encryptBtn : ui.decryptBtn) }}
      </button>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] items-center gap-2 text-sm">
      <template v-if="error">
        <span class="font-medium text-red-600 dark:text-red-400">{{ error }}</span>
      </template>
      <template v-else-if="output">
        <span class="font-medium text-green-600 dark:text-green-400">
          {{ mode === 'encrypt' ? ui.encrypted : ui.decrypted }}
        </span>
        <span class="text-ink-400">· {{ output.length.toLocaleString() }} {{ ui.charsOut }}</span>
      </template>
      <span v-else-if="!hasInput && (input || passphrase)" class="text-ink-400">{{ ui.needBoth }}</span>
      <span v-else class="text-ink-400">
        {{ mode === 'encrypt' ? ui.hintEncrypt : ui.hintDecrypt }}
      </span>
    </div>

    <!-- Output -->
    <div class="mt-3">
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <label for="aes-output" class="label !mb-0">{{ outputLabel }}</label>
        <ClientOnly>
          <CopyButton v-if="output" :text="() => output" small />
        </ClientOnly>
      </div>
      <textarea
        id="aes-output"
        :value="output"
        class="textarea-code min-h-[10rem]"
        readonly
        spellcheck="false"
        :placeholder="outputPlaceholder"
        :aria-label="outputLabel"
      />
    </div>

    <!-- Long-form content for SEO + users (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Шифрование и расшифровка текста AES онлайн</h2>
        <p>
          Этот бесплатный <strong>инструмент AES-шифрования</strong> зашифровывает
          и расшифровывает текст с помощью пароля — мгновенно и полностью в вашем
          браузере. Под капотом он использует <strong>AES-GCM с 256-битным ключом</strong>,
          а сам ключ выводится из вашего пароля через <strong>PBKDF2</strong>
          (SHA-256, 150 000 итераций) со случайной солью. Это удобно, когда нужно
          быстро защитить заметку, токен или фрагмент конфигурации перед отправкой.
        </p>
        <p>
          Всё происходит <strong>полностью в браузере</strong>. Ваш текст, пароль
          и производный ключ никогда не покидают страницу и не загружаются на
          сервер, поэтому секреты остаются у вас.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Выберите <code>Зашифровать</code>, чтобы защитить текст, или <code>Расшифровать</code>, чтобы вернуть его обратно.</li>
          <li>Введите или вставьте текст (или Base64-строку при расшифровке) в верхнее поле.</li>
          <li>Задайте надёжный <code>Пароль</code> — он понадобится, чтобы расшифровать данные позже.</li>
          <li>Нажмите кнопку действия и скопируйте результат кнопкой <code>Копировать</code>.</li>
          <li>Сохраните и пароль, и весь вывод Base64: без любого из них расшифровать данные невозможно.</li>
        </ul>

        <h2>Как это устроено</h2>
        <p>
          При шифровании создаётся свежая случайная соль (16 байт) и случайный IV
          (12 байт) через <code>crypto.getRandomValues</code>. Из пароля и соли
          выводится 256-битный ключ AES-GCM, затем текст шифруется. На выходе —
          Base64 от <code>соль(16) + IV(12) + шифртекст+тег</code>. При расшифровке
          эти части разбираются обратно, ключ выводится заново, и AES-GCM проверяет
          тег аутентификации: при неверном пароле или повреждённых данных операция
          отклоняется. Это надёжная схема, но инструмент создан для удобства и
          <strong>не заменяет</strong> проверенные аудитом средства вроде age, GnuPG
          или менеджера паролей.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужно проверить целостность и подлинность сообщения по ключу? Используйте
          <NuxtLink :to="localePath('/hmac-generator')">генератор HMAC</NuxtLink>.
          Чтобы посчитать контрольную сумму или хеш, откройте
          <NuxtLink :to="localePath('/hash-generator')">генератор хешей</NuxtLink>,
          а перекодировать данные без шифрования поможет
          <NuxtLink :to="localePath('/base64-encode-decode')">кодировщик/декодировщик Base64</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Encrypt and decrypt text with AES online</h2>
        <p>
          This free <strong>AES encryption tool</strong> encrypts and decrypts text
          with a passphrase, instantly and entirely in your browser. Under the hood
          it uses <strong>AES-GCM with a 256-bit key</strong>, and that key is
          derived from your passphrase with <strong>PBKDF2</strong> (SHA-256,
          150,000 iterations) over a random salt. It is handy when you need to
          quickly protect a note, a token or a config snippet before sharing it.
        </p>
        <p>
          Everything happens <strong>entirely in your browser</strong>. Your text,
          passphrase and the derived key never leave the page and are never uploaded
          to a server, so your secrets stay with you.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Pick <code>Encrypt</code> to protect text, or <code>Decrypt</code> to turn it back.</li>
          <li>Type or paste your text (or the Base64 blob when decrypting) into the top box.</li>
          <li>Set a strong <code>Passphrase</code> — you will need it to decrypt the data later.</li>
          <li>Press the action button, then grab the result with the <code>Copy</code> button.</li>
          <li>Keep both the passphrase and the full Base64 output: without either one the data cannot be recovered.</li>
        </ul>

        <h2>How it works</h2>
        <p>
          When encrypting, a fresh random salt (16 bytes) and IV (12 bytes) are
          generated with <code>crypto.getRandomValues</code>. A 256-bit AES-GCM key
          is derived from the passphrase and salt, then the text is encrypted. The
          output is the Base64 of <code>salt(16) + IV(12) + ciphertext+tag</code>.
          Decryption parses those parts back out, re-derives the key, and AES-GCM
          verifies the authentication tag — a wrong passphrase or tampered data is
          rejected. It is a sound scheme, but this tool is built for convenience and
          is <strong>not a replacement</strong> for audited tooling such as age,
          GnuPG or a password manager.
        </p>

        <h2>Related tools</h2>
        <p>
          Need to verify a message's integrity and authenticity with a key? Use the
          <NuxtLink :to="localePath('/hmac-generator')">HMAC generator</NuxtLink>.
          To compute a checksum or digest, open the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>,
          and re-encode data without encrypting it with the
          <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder/decoder</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
