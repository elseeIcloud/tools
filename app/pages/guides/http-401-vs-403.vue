<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'What is the difference between 401 and 403?',
    a: 'A 401 Unauthorized means the request is not authenticated: the credentials are missing, malformed or expired, so the server does not know who you are. A 403 Forbidden means you are authenticated — the server knows who you are — but you do not have permission for this resource. Put simply: 401 is "who are you?", 403 is "I know you, and you are not allowed".',
  },
  {
    q: 'When should I use 301 vs 302?',
    a: 'Use 301 Moved Permanently when a URL has changed for good — a renamed page, a domain migration, switching to HTTPS. Search engines transfer ranking to the new URL and clients cache it aggressively. Use 302 Found (or 307) when the move is temporary — maintenance, a short-lived A/B test, or a login redirect — so clients keep requesting the original URL.',
  },
  {
    q: 'Does a 302 redirect preserve the POST method and body?',
    a: 'Not reliably. Historically many clients turned a POST into a GET when following a 301 or 302, dropping the body. If you must keep the method and body, use 307 Temporary Redirect or 308 Permanent Redirect — they are explicitly defined to preserve both. For form submissions and APIs, prefer 307/308 over 302/301.',
  },
  {
    q: 'How do I fix a 401 error?',
    a: 'Provide valid credentials. Check that you are actually sending an Authorization header, that the token is not expired (decode it and read the exp claim), and that the scheme matches what the server expects (Bearer, Basic, etc.). If the token expired, refresh it and retry. The server should send a WWW-Authenticate header telling you which scheme it wants.',
  },
  {
    q: 'Is a 301 redirect good for SEO?',
    a: 'Yes, for permanent moves a 301 is the correct, SEO-friendly choice: it tells search engines the new URL is the canonical one and passes ranking signals to it. Using a 302 for a permanent move can leave the old URL indexed and split your ranking, so reserve 302/307 strictly for temporary redirects.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'В чём разница между 401 и 403?',
    a: '401 Unauthorized означает, что запрос не аутентифицирован: учётные данные отсутствуют, повреждены или просрочены, и сервер не знает, кто вы. 403 Forbidden означает, что вы аутентифицированы — сервер знает, кто вы, — но у вас нет прав на этот ресурс. Коротко: 401 — это «кто ты?», а 403 — «я тебя знаю, но тебе нельзя».',
  },
  {
    q: 'Когда использовать 301, а когда 302?',
    a: '301 Moved Permanently — когда URL изменился навсегда: переименовали страницу, переехали на другой домен, перешли на HTTPS. Поисковики переносят ранжирование на новый адрес, а клиенты агрессивно кэшируют ответ. 302 Found (или 307) — когда перенос временный: обслуживание, короткий A/B-тест, редирект на форму входа, чтобы клиенты продолжали обращаться к исходному URL.',
  },
  {
    q: 'Сохраняет ли редирект 302 метод POST и тело запроса?',
    a: 'Не гарантированно. Исторически многие клиенты при переходе по 301 или 302 превращали POST в GET и отбрасывали тело. Если метод и тело нужно сохранить, используйте 307 Temporary Redirect или 308 Permanent Redirect — они по спецификации сохраняют и то, и другое. Для отправки форм и API предпочитайте 307/308 вместо 302/301.',
  },
  {
    q: 'Как исправить ошибку 401?',
    a: 'Передайте корректные учётные данные. Проверьте, что вы действительно отправляете заголовок Authorization, что токен не просрочен (раскодируйте его и посмотрите claim exp), и что схема совпадает с ожидаемой сервером (Bearer, Basic и т.д.). Если токен истёк — обновите его и повторите запрос. Сервер должен прислать заголовок WWW-Authenticate с нужной схемой.',
  },
  {
    q: 'Полезен ли редирект 301 для SEO?',
    a: 'Да, для постоянных переездов 301 — правильный и дружественный к SEO выбор: он говорит поисковикам, что новый URL канонический, и передаёт ему сигналы ранжирования. Если использовать 302 для постоянного переезда, старый URL может остаться в индексе и размыть ранжирование, поэтому 302/307 оставляйте строго для временных редиректов.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="http-401-vs-403" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        Два класса HTTP-кодов чаще всего путают: <strong>401 и 403</strong> (доступ запрещён) и
        <strong>301 и 302</strong> (редиректы). На первый взгляд пары похожи, но выбор не тот ведёт
        к реальным проблемам — от бесконечных циклов «обнови токен» до потери позиций в поиске.
        Разберём обе пары и дадим простые правила, какой код возвращать. Полный список кодов с
        поиском есть в
        <NuxtLink :to="localePath('/http-status-codes')">справочнике HTTP-кодов</NuxtLink>.
      </p>

      <h2>401 Unauthorized — вы не аутентифицированы</h2>
      <p>
        Несмотря на название «Unauthorized», 401 на самом деле значит
        <em>«не аутентифицирован»</em>. Сервер не понял, кто вы: учётные данные
        <strong>отсутствуют, повреждены или просрочены</strong>. Типичные причины — нет заголовка
        <code>Authorization</code>, неверная схема, или истёкший JWT.
      </p>
      <p>
        По спецификации ответ 401 <strong>должен</strong> содержать заголовок
        <code>WWW-Authenticate</code>, который сообщает клиенту, какая схема нужна:
      </p>
      <pre><code>HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api", error="invalid_token"</code></pre>
      <p>
        Главное: <strong>повторная аутентификация может это исправить</strong>. Если токен истёк —
        обновите его и повторите запрос; если заголовка не было — добавьте его. Именно так работает
        типичный цикл с refresh-токеном: получили 401, незаметно для пользователя обновили
        access-токен и повторили исходный запрос. Если же сервер отвечает 401 на <em>валидный</em>
        токен, проблема обычно в рассинхроне часов (claim <code>nbf</code>/<code>exp</code>),
        неверном <code>aud</code> или в том, что ключ подписи на сервере сменился.
      </p>

      <h2>403 Forbidden — вам просто нельзя</h2>
      <p>
        403 возвращают, когда сервер <strong>знает, кто вы</strong> (запрос аутентифицирован), но у
        вас <strong>нет прав</strong> на этот ресурс. Обычный пользователь стучится в админскую
        панель; токен валиден, но в нём нет нужной роли или scope. В отличие от 401,
        <strong>повторная аутентификация не поможет</strong> — нужны другие права, а их выдаёт
        администратор, а не повторный логин.
      </p>
      <p>
        Запоминалка: <strong>401 — «кто ты?»</strong>, <strong>403 — «я тебя знаю, но тебе
        нельзя»</strong>. Первый код про <em>аутентификацию</em> (подтверждение личности), второй —
        про <em>авторизацию</em> (проверку прав). Не возвращайте 403 на отсутствующий токен и не
        возвращайте 401 на нехватку прав — клиенты по-разному реагируют на эти коды, и путаница
        ломает их логику обработки ошибок.
      </p>

      <h2>Правило выбора: 401 или 403</h2>
      <ul>
        <li>Токен <strong>отсутствует, повреждён или просрочен</strong> → <code>401</code>.</li>
        <li>Токен <strong>валиден, но без нужной роли/scope</strong> → <code>403</code>.</li>
      </ul>
      <p>
        Чтобы понять, в чём дело с токеном, раскодируйте его в
        <NuxtLink :to="localePath('/jwt-decoder')">декодере JWT</NuxtLink> и посмотрите claim
        <code>exp</code> (срок действия) и роли/scope в payload. Подробнее о структуре токена — в
        гайде <NuxtLink :to="localePath('/guides/what-is-jwt')">«Что такое JWT»</NuxtLink>. Заодно
        стоит свериться, какие заголовки вообще передаются: их назначение описано в
        <NuxtLink :to="localePath('/http-headers')">справочнике HTTP-заголовков</NuxtLink>
        (<code>Authorization</code>, <code>WWW-Authenticate</code>).
      </p>
      <p>
        Тонкость безопасности: иногда вместо 403 отвечают <code>404 Not Found</code>, чтобы не
        раскрывать само существование ресурса посторонним. Это допустимый приём для приватных
        данных.
      </p>

      <h2>301 vs 302 — постоянный и временный редирект</h2>
      <p>
        Редиректы 3xx говорят клиенту «ресурс теперь по другому адресу». Разница между 301 и 302 —
        в том, <strong>навсегда</strong> ли это.
      </p>
      <ul>
        <li>
          <strong>301 Moved Permanently</strong> — адрес сменился навсегда. Браузеры и поисковики
          обновляют закладки и ссылки, переносят ранжирование на новый URL и
          <strong>агрессивно кэшируют</strong> такой ответ (порой надолго).
        </li>
        <li>
          <strong>302 Found</strong> — перенос временный. Клиент должен и дальше обращаться к
          <em>исходному</em> URL, а текущий редирект использовать только сейчас.
        </li>
      </ul>
      <pre><code>HTTP/1.1 301 Moved Permanently
Location: https://example.com/new-path</code></pre>
      <p>
        Из-за агрессивного кэширования 301 коварен: если вы по ошибке поставили постоянный редирект,
        браузеры запомнят его и перестанут запрашивать старый URL — откатить такое сложно. Поэтому,
        пока вы не уверены, что переезд окончательный, безопаснее начать с 302.
      </p>

      <h2>Подвох с POST: 307 и 308</h2>
      <p>
        Исторически при переходе по 301 и 302 многие клиенты <strong>меняли метод</strong>:
        <code>POST</code> превращался в <code>GET</code>, а тело запроса терялось. Чтобы убрать эту
        неоднозначность, ввели две пары кодов, которые <strong>сохраняют метод и тело</strong>:
      </p>
      <ul>
        <li><strong>307 Temporary Redirect</strong> — временный, как 302, но метод и тело сохраняются.</li>
        <li><strong>308 Permanent Redirect</strong> — постоянный, как 301, но метод и тело сохраняются.</li>
      </ul>
      <p>
        Поэтому для редиректа форм и API-запросов выбирайте <code>307</code>/<code>308</code>, а не
        <code>302</code>/<code>301</code> — так <code>POST</code> останется <code>POST</code>.
      </p>
      <p>
        Особый случай — <strong>303 See Other</strong>: он наоборот <em>намеренно</em> переключает
        клиента на <code>GET</code>. Это классический паттерн PRG (Post/Redirect/Get): после
        успешной отправки формы сервер отвечает 303 и редиректит на страницу с результатом, чтобы
        обновление страницы не отправило форму повторно.
      </p>

      <h2>Когда какой редирект</h2>
      <ul>
        <li>Постоянный переезд сайта, смена домена, переход на HTTPS → <code>301</code> (или <code>308</code>, если важно сохранить метод).</li>
        <li>Временное обслуживание, A/B-тест, редирект на логин → <code>302</code> (или <code>307</code> для сохранения метода).</li>
      </ul>
      <p>
        Главная ошибка SEO — поставить 302 на постоянный переезд: старый URL может остаться в
        индексе, а ранжирование размоется между двумя адресами. Для постоянных переездов всегда
        301/308. Сверить любой код можно в
        <NuxtLink :to="localePath('/http-status-codes')">справочнике HTTP-кодов</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        Two groups of HTTP codes are the most commonly confused: <strong>401 vs 403</strong>
        (access denied) and <strong>301 vs 302</strong> (redirects). The pairs look similar, but
        picking the wrong one causes real problems — from infinite "refresh your token" loops to
        lost search rankings. Let's untangle both pairs and give simple rules for which code to
        return. A full, searchable list lives in the
        <NuxtLink :to="localePath('/http-status-codes')">HTTP status code reference</NuxtLink>.
      </p>

      <h2>401 Unauthorized — you are not authenticated</h2>
      <p>
        Despite the name "Unauthorized", a 401 really means
        <em>"not authenticated"</em>. The server cannot tell who you are: the credentials are
        <strong>missing, malformed or expired</strong>. Typical causes are a missing
        <code>Authorization</code> header, the wrong scheme, or an expired JWT.
      </p>
      <p>
        By the spec a 401 response <strong>must</strong> include a
        <code>WWW-Authenticate</code> header telling the client which scheme to use:
      </p>
      <pre><code>HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="api", error="invalid_token"</code></pre>
      <p>
        The key point: <strong>authenticating can fix it</strong>. If the token expired, refresh it
        and retry; if the header was missing, add it. That's exactly how a typical refresh-token
        loop works: you get a 401, silently refresh the access token, and replay the original
        request. If the server returns 401 on a token you believe is <em>valid</em>, the usual
        culprits are clock skew (the <code>nbf</code>/<code>exp</code> claims), a wrong
        <code>aud</code>, or a signing key that has rotated on the server.
      </p>

      <h2>403 Forbidden — you simply aren't allowed</h2>
      <p>
        A 403 is returned when the server <strong>knows who you are</strong> (the request is
        authenticated) but you <strong>lack permission</strong> for this resource. A regular user
        hits an admin panel; the token is valid, but it doesn't carry the required role or scope.
        Unlike a 401, <strong>re-authenticating will not help</strong> — you need different
        permissions, which an administrator grants, not another login.
      </p>
      <p>
        A mnemonic: <strong>401 is "who are you?"</strong>, <strong>403 is "I know you, and you are
        not allowed"</strong>. The first code is about <em>authentication</em> (proving identity),
        the second about <em>authorization</em> (checking rights). Don't return 403 for a missing
        token, and don't return 401 for insufficient rights — clients react differently to these
        codes, and mixing them up breaks their error-handling logic.
      </p>

      <h2>The decision rule: 401 or 403</h2>
      <ul>
        <li>Token is <strong>missing, malformed or expired</strong> → <code>401</code>.</li>
        <li>Token is <strong>valid but lacks the required role/scope</strong> → <code>403</code>.</li>
      </ul>
      <p>
        To diagnose a token, decode it in the
        <NuxtLink :to="localePath('/jwt-decoder')">JWT decoder</NuxtLink> and read the
        <code>exp</code> claim (expiry) plus any roles/scopes in the payload. For the full token
        anatomy, see the <NuxtLink :to="localePath('/guides/what-is-jwt')">"What is a JWT"</NuxtLink>
        guide. It also helps to check which headers are actually being sent — their meaning is
        listed in the
        <NuxtLink :to="localePath('/http-headers')">HTTP headers reference</NuxtLink>
        (<code>Authorization</code>, <code>WWW-Authenticate</code>).
      </p>
      <p>
        A security nuance: sometimes a server returns <code>404 Not Found</code> instead of 403 so
        it doesn't even reveal that the resource exists to outsiders. That's an accepted pattern for
        private data.
      </p>

      <h2>301 vs 302 — permanent vs temporary redirect</h2>
      <p>
        The 3xx redirects tell the client "the resource is now at another address". The difference
        between 301 and 302 is whether that move is <strong>permanent</strong>.
      </p>
      <ul>
        <li>
          <strong>301 Moved Permanently</strong> — the address changed for good. Browsers and
          search engines update bookmarks and links, transfer ranking to the new URL, and
          <strong>cache the response aggressively</strong> (sometimes for a long time).
        </li>
        <li>
          <strong>302 Found</strong> — the move is temporary. The client should keep using the
          <em>original</em> URL and only follow this redirect for now.
        </li>
      </ul>
      <pre><code>HTTP/1.1 301 Moved Permanently
Location: https://example.com/new-path</code></pre>
      <p>
        Because of that aggressive caching, a 301 is unforgiving: if you set a permanent redirect by
        mistake, browsers remember it and stop requesting the old URL — undoing that is hard. So
        until you're sure a move is final, it's safer to start with a 302.
      </p>

      <h2>The POST gotcha: 307 and 308</h2>
      <p>
        Historically, when following a 301 or 302, many clients <strong>changed the method</strong>:
        a <code>POST</code> became a <code>GET</code> and the request body was dropped. To remove
        that ambiguity, two extra codes were defined that <strong>preserve the method and
        body</strong>:
      </p>
      <ul>
        <li><strong>307 Temporary Redirect</strong> — temporary like 302, but method and body are kept.</li>
        <li><strong>308 Permanent Redirect</strong> — permanent like 301, but method and body are kept.</li>
      </ul>
      <p>
        So for redirecting form submissions and API calls, choose <code>307</code>/<code>308</code>
        over <code>302</code>/<code>301</code> — that way a <code>POST</code> stays a
        <code>POST</code>.
      </p>
      <p>
        One special case is <strong>303 See Other</strong>, which does the opposite on purpose: it
        <em>deliberately</em> switches the client to <code>GET</code>. This is the classic PRG
        (Post/Redirect/Get) pattern — after a successful form submission the server replies with 303
        and redirects to a result page, so reloading the page doesn't resubmit the form.
      </p>

      <h2>When to use which redirect</h2>
      <ul>
        <li>Permanent site move, domain change, switching to HTTPS → <code>301</code> (or <code>308</code> if the method must be preserved).</li>
        <li>Temporary maintenance, an A/B test, a login redirect → <code>302</code> (or <code>307</code> to preserve the method).</li>
      </ul>
      <p>
        The classic SEO mistake is using a 302 for a permanent move: the old URL can stay indexed
        and your ranking gets split across two addresses. For permanent moves, always use 301/308.
        You can look up any code in the
        <NuxtLink :to="localePath('/http-status-codes')">HTTP status code reference</NuxtLink>.
      </p>
    </template>
  </GuidePage>
</template>
