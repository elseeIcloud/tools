<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'Is a JWT encrypted?',
    a: 'No. A standard JWT (a JWS) is only signed, not encrypted. The header and payload are Base64url-encoded, which anyone can reverse and read. Never put secrets like passwords in a JWT payload. If you need the contents to be hidden, use an encrypted token (JWE) or send the token only over HTTPS and keep sensitive data server-side.',
  },
  {
    q: 'What is the difference between decoding and verifying a JWT?',
    a: 'Decoding just Base64url-decodes the header and payload so you can read them — it proves nothing about authenticity. Verifying recomputes the signature with the secret or public key and checks it matches, which proves the token was issued by someone holding the key and was not tampered with. Always verify before trusting a token on the server.',
  },
  {
    q: 'Where should I store a JWT in the browser?',
    a: 'For web apps, an HttpOnly, Secure cookie is generally safer than localStorage, because JavaScript (and therefore an XSS attack) cannot read an HttpOnly cookie. localStorage is convenient but any injected script can steal the token. Whichever you choose, keep token lifetimes short and use refresh tokens.',
  },
  {
    q: 'What does the "exp" claim mean?',
    a: 'exp is the expiration time as a Unix timestamp (seconds since 1970). After that moment the token must be rejected. iat is when it was issued and nbf is the earliest time it is valid. You can convert these timestamps to a readable date with a Unix timestamp converter.',
  },
  {
    q: 'Can I trust a JWT decoded in the browser?',
    a: 'You can read it to inspect claims, but you must not make security decisions based on an unverified token. Signature verification needs the secret (HS256) or public key (RS256/ES256) and should happen on the server. Decoding in the browser is fine for debugging because nothing leaves your machine.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'JWT — это зашифрованный токен?',
    a: 'Нет. Обычный JWT (JWS) только подписан, но не зашифрован. Header и payload закодированы в Base64url — это легко раскодировать и прочитать. Никогда не кладите в payload секреты вроде паролей. Если содержимое нужно скрыть, используйте зашифрованный токен (JWE) или передавайте токен только по HTTPS, а чувствительные данные держите на сервере.',
  },
  {
    q: 'Чем декодирование отличается от проверки JWT?',
    a: 'Декодирование просто раскодирует Base64url в header и payload, чтобы их прочитать, — оно ничего не доказывает о подлинности. Проверка пересчитывает подпись секретом или открытым ключом и сверяет её, доказывая, что токен выпущен владельцем ключа и не подделан. На сервере всегда сначала проверяйте подпись, а уже потом доверяйте токену.',
  },
  {
    q: 'Где хранить JWT в браузере?',
    a: 'Для веб-приложений HttpOnly Secure cookie обычно безопаснее localStorage: JavaScript (а значит и XSS-атака) не может прочитать HttpOnly-cookie. localStorage удобен, но любой внедрённый скрипт способен украсть токен. Что бы вы ни выбрали, делайте время жизни токена коротким и используйте refresh-токены.',
  },
  {
    q: 'Что означает claim «exp»?',
    a: 'exp — это срок действия в виде Unix-времени (секунды с 1970 года). После этого момента токен нужно отклонять. iat — когда токен выпущен, nbf — с какого момента он действителен. Эти метки времени можно перевести в читаемую дату конвертером Unix timestamp.',
  },
  {
    q: 'Можно ли доверять JWT, раскодированному в браузере?',
    a: 'Прочитать и посмотреть claims — можно, но принимать решения о безопасности по непроверенному токену нельзя. Проверка подписи требует секрет (HS256) или открытый ключ (RS256/ES256) и должна выполняться на сервере. Декодировать в браузере для отладки безопасно — ничего не покидает ваш компьютер.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="what-is-jwt" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        <strong>JWT (JSON Web Token)</strong> — это компактный формат для безопасной
        передачи информации между сторонами в виде подписанного JSON. Чаще всего его
        используют для аутентификации: после входа сервер выдаёт токен, а браузер
        прикладывает его к каждому запросу в заголовке <code>Authorization: Bearer …</code>,
        чтобы не спрашивать логин и пароль снова.
      </p>

      <h2>Из чего состоит JWT</h2>
      <p>
        Токен — это три части, разделённые точками:
        <code>header.payload.signature</code>. Каждая из первых двух частей — это JSON,
        закодированный в <strong>Base64url</strong>. Например:
      </p>
      <pre><code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0Iiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzE3NTAwMDAwfQ.s6t4n0bI4qH5e7M_signature</code></pre>
      <ul>
        <li><strong>Header</strong> — алгоритм подписи и тип: <code>{"alg":"HS256","typ":"JWT"}</code>.</li>
        <li><strong>Payload</strong> — полезные данные (claims): <code>{"sub":"1234","role":"admin","exp":1717500000}</code>.</li>
        <li><strong>Signature</strong> — подпись header и payload секретом или приватным ключом.</li>
      </ul>

      <h2>Base64url — это не шифрование</h2>
      <p>
        Header и payload только <em>закодированы</em>, а не зашифрованы. Любой, у кого
        есть токен, может раскодировать и прочитать их. Поэтому
        <strong>не храните в payload секреты</strong> — пароли, ключи, личные данные.
        Подпись защищает от <em>подделки</em>, но не скрывает содержимое. Подробнее про
        само кодирование — в гайде
        <NuxtLink :to="localePath('/guides/what-is-base64')">«Что такое Base64»</NuxtLink>.
      </p>

      <h2>Частые claims</h2>
      <ul>
        <li><code>iss</code> — кто выпустил токен (issuer).</li>
        <li><code>sub</code> — субъект, обычно идентификатор пользователя.</li>
        <li><code>aud</code> — для кого предназначен токен (audience).</li>
        <li><code>exp</code> — срок действия (Unix-время); после него токен невалиден.</li>
        <li><code>iat</code> — когда выпущен; <code>nbf</code> — с какого момента действителен.</li>
        <li><code>jti</code> — уникальный идентификатор токена.</li>
      </ul>
      <p>
        Значения <code>exp</code>, <code>iat</code> и <code>nbf</code> — это секунды с
        1970 года. Перевести их в дату можно
        <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертером Unix timestamp</NuxtLink>.
      </p>

      <h2>Как декодировать JWT</h2>
      <ol>
        <li>Скопируйте токен целиком (вместе с точками).</li>
        <li>Вставьте его в <NuxtLink :to="localePath('/jwt-decoder')">декодер JWT</NuxtLink> — header и payload сразу отобразятся в читаемом виде.</li>
        <li>Проверьте <code>exp</code>: не истёк ли срок действия.</li>
      </ol>
      <p>
        Всё считается прямо в браузере — токен никуда не отправляется, поэтому безопасно
        разбирать даже рабочие токены.
      </p>

      <h2>Декодировать ≠ доверять</h2>
      <p>
        Самое важное правило: <strong>декодирование не доказывает подлинность</strong>.
        Кто угодно может изменить payload и заново закодировать его. Чтобы убедиться, что
        токен настоящий и не подделан, нужно <strong>проверить подпись</strong> — секретом
        для <code>HS256</code> или открытым ключом для <code>RS256</code>/<code>ES256</code>.
        Это делается на сервере. Проверить HMAC-подпись вручную можно в
        <NuxtLink :to="localePath('/jwt-verifier')">верификаторе JWT</NuxtLink>, а собрать и
        подписать свой токен — в
        <NuxtLink :to="localePath('/jwt-generator')">генераторе JWT</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        A <strong>JWT (JSON Web Token)</strong> is a compact format for safely passing
        information between parties as signed JSON. It is most often used for
        authentication: after you log in, the server issues a token and the browser
        attaches it to every request in an <code>Authorization: Bearer …</code> header,
        so you are not asked for your username and password again.
      </p>

      <h2>The parts of a JWT</h2>
      <p>
        A token is three parts separated by dots:
        <code>header.payload.signature</code>. The first two are JSON encoded with
        <strong>Base64url</strong>. For example:
      </p>
      <pre><code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0Iiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzE3NTAwMDAwfQ.s6t4n0bI4qH5e7M_signature</code></pre>
      <ul>
        <li><strong>Header</strong> — the signing algorithm and type: <code>{"alg":"HS256","typ":"JWT"}</code>.</li>
        <li><strong>Payload</strong> — the data (claims): <code>{"sub":"1234","role":"admin","exp":1717500000}</code>.</li>
        <li><strong>Signature</strong> — the header and payload signed with a secret or private key.</li>
      </ul>

      <h2>Base64url is not encryption</h2>
      <p>
        The header and payload are only <em>encoded</em>, not encrypted. Anyone holding
        the token can decode and read them, so
        <strong>never put secrets in the payload</strong> — no passwords, keys or private
        data. The signature protects against <em>tampering</em>, not against reading. For
        more on the encoding itself, see
        <NuxtLink :to="localePath('/guides/what-is-base64')">“What is Base64”</NuxtLink>.
      </p>

      <h2>Common claims</h2>
      <ul>
        <li><code>iss</code> — who issued the token (issuer).</li>
        <li><code>sub</code> — the subject, usually a user ID.</li>
        <li><code>aud</code> — who the token is intended for (audience).</li>
        <li><code>exp</code> — expiry (Unix time); the token is invalid after it.</li>
        <li><code>iat</code> — when it was issued; <code>nbf</code> — when it becomes valid.</li>
        <li><code>jti</code> — a unique token ID.</li>
      </ul>
      <p>
        The <code>exp</code>, <code>iat</code> and <code>nbf</code> values are seconds
        since 1970. Turn them into a date with the
        <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>.
      </p>

      <h2>How to decode a JWT</h2>
      <ol>
        <li>Copy the whole token (including the dots).</li>
        <li>Paste it into the <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink> — the header and payload appear in readable form.</li>
        <li>Check <code>exp</code> to see whether it has expired.</li>
      </ol>
      <p>
        Everything runs in your browser — the token is never uploaded, so it is safe to
        inspect even real, production tokens.
      </p>

      <h2>Decoding ≠ trusting</h2>
      <p>
        The most important rule: <strong>decoding does not prove authenticity</strong>.
        Anyone can change the payload and re-encode it. To be sure a token is genuine and
        untampered, you must <strong>verify the signature</strong> — with the secret for
        <code>HS256</code> or the public key for <code>RS256</code>/<code>ES256</code>.
        This happens on the server. You can check an HMAC signature by hand in the
        <NuxtLink :to="localePath('/jwt-verifier')">JWT verifier</NuxtLink>, or build and
        sign your own token in the
        <NuxtLink :to="localePath('/jwt-generator')">JWT generator</NuxtLink>.
      </p>
    </template>
  </GuidePage>
</template>
