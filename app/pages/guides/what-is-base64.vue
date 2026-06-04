<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'Is Base64 encryption?',
    a: 'No. Base64 is encoding, not encryption. There is no key and no secret — anyone with the string can decode it back to the original bytes instantly. It only changes how data is represented so it survives text-only channels. Never use Base64 to hide passwords, tokens or any sensitive data; for real protection use encryption (AES) or hashing (for passwords) instead.',
  },
  {
    q: 'Why is Base64 output about 33% larger than the input?',
    a: 'Base64 maps every 3 bytes (24 bits) of input onto 4 output characters of 6 bits each. So 3 bytes in become 4 bytes out — a 4/3 ratio, roughly 33% growth. On top of that, padding rounds the length up to a multiple of 4. This overhead is the trade-off for being able to carry binary data safely as plain text.',
  },
  {
    q: 'What is the "=" at the end of a Base64 string?',
    a: 'It is padding. Because output length must be a multiple of 4 characters, when the input is not a multiple of 3 bytes, Base64 pads the result with "=" signs. One leftover byte produces two "=", two leftover bytes produce one "=". The padding carries no data — it just signals how many input bytes the final group represented.',
  },
  {
    q: 'What is URL-safe Base64 and when do I need it?',
    a: 'Standard Base64 uses "+" and "/", which have special meaning in URLs and filenames. URL-safe Base64 replaces "+" with "-" and "/" with "_", and usually drops the "=" padding. It is what JWTs use (base64url) and what you want when a value goes into a query string, path or cookie. Most encoders offer a URL-safe option.',
  },
  {
    q: 'Should I Base64 an image to use it in CSS?',
    a: 'For small, rarely-changing assets (icons, tiny backgrounds) a Base64 data URI saves an HTTP request and avoids a separate file. But the image grows about 33%, it cannot be cached separately, and large data URIs bloat your CSS or HTML. Inline only small images; serve larger ones as normal files.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Base64 — это шифрование?',
    a: 'Нет. Base64 — это кодирование, а не шифрование. Здесь нет ключа и нет секрета: любой, у кого есть строка, мгновенно раскодирует её обратно в исходные байты. Меняется лишь способ представления данных, чтобы они прошли через текстовые каналы. Не используйте Base64 для сокрытия паролей, токенов и любых чувствительных данных — для защиты нужны шифрование (AES) или хеширование (для паролей).',
  },
  {
    q: 'Почему результат Base64 примерно на 33% больше исходных данных?',
    a: 'Base64 отображает каждые 3 байта (24 бита) входа на 4 выходных символа по 6 бит. То есть 3 байта на входе превращаются в 4 байта на выходе — соотношение 4/3, рост примерно на 33%. Сверху ещё дополнение (padding) округляет длину до кратной 4. Это плата за то, что двоичные данные можно безопасно передавать как обычный текст.',
  },
  {
    q: 'Что означает «=» в конце строки Base64?',
    a: 'Это дополнение (padding). Длина результата должна быть кратна 4 символам, поэтому, когда вход не кратен 3 байтам, Base64 добавляет в конец знаки «=». Один лишний байт даёт два «=», два лишних байта — один «=». Дополнение не несёт данных, оно лишь показывает, сколько входных байтов было в последней группе.',
  },
  {
    q: 'Что такое URL-safe Base64 и когда он нужен?',
    a: 'Обычный Base64 использует «+» и «/», а у них особое значение в URL и именах файлов. URL-safe Base64 заменяет «+» на «-» и «/» на «_», а дополнение «=» обычно убирает. Именно его применяют JWT (base64url), и именно он нужен, когда значение попадает в query-строку, путь или cookie. У большинства кодировщиков есть опция URL-safe.',
  },
  {
    q: 'Стоит ли кодировать картинку в Base64 для CSS?',
    a: 'Для маленьких и редко меняющихся ресурсов (иконки, крошечные фоны) data URI в Base64 экономит HTTP-запрос и избавляет от отдельного файла. Но картинка вырастает примерно на 33%, её нельзя закешировать отдельно, а большие data URI раздувают CSS или HTML. Встраивайте только мелкие изображения, крупные отдавайте обычными файлами.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="what-is-base64" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        <strong>Base64</strong> — это способ представить произвольные двоичные данные
        в виде текста, состоящего только из «безопасных» печатных символов. Он не сжимает
        и не шифрует данные — он лишь меняет их представление, чтобы байты можно было
        безопасно пронести через каналы, рассчитанные только на текст: HTML, CSS, JSON,
        электронную почту, URL.
      </p>

      <h2>Алфавит из 64 символов</h2>
      <p>
        В названии зашифрован принцип: кодирование использует <strong>64 символа</strong> —
        латинские буквы <code>A–Z</code>, <code>a–z</code>, цифры <code>0–9</code> и два
        дополнительных знака <code>+</code> и <code>/</code>. Каждому из этих 64 символов
        соответствует число от 0 до 63, то есть ровно <strong>6 бит</strong>. Ещё один
        служебный символ — <code>=</code> — используется как дополнение (padding) в конце.
      </p>

      <h2>Как это работает: 3 байта → 4 символа</h2>
      <p>
        Двоичные данные состоят из байтов по 8 бит, а символ Base64 кодирует 6 бит.
        Наименьшее общее кратное 8 и 6 — это 24 бита, то есть <strong>3 байта</strong>.
        Алгоритм берёт 3 байта (24 бита), разбивает их на <strong>4 группы по 6 бит</strong>
        и каждую группу заменяет соответствующим символом из алфавита. Так 3 байта на входе
        всегда дают 4 символа на выходе — отсюда и рост размера примерно на
        <strong>33%</strong> (соотношение 4 ÷ 3).
      </p>
      <p>Разберём слово <code>Hello</code> по шагам:</p>
      <pre><code>Текст:     H        e        l
ASCII:     72       101      108
Биты:      01001000 01100101 01101100
6-битами:  010010 000110 010101 101100
Числа:     18     6      21     44
Base64:    S      G       V      s</code></pre>
      <p>
        Первые 3 байта (<code>Hel</code>) превратились в <code>SGVs</code>. Осталось ещё
        2 байта — <code>lo</code>, и здесь вступает в дело дополнение.
      </p>

      <h2>Зачем нужно дополнение «=»</h2>
      <p>
        Если данных не кратное 3 количество байтов, последняя группа неполная. Её всё равно
        дополняют нулевыми битами до целых 6-битных символов, а недостающие до четвёрки
        позиции заполняют знаком <code>=</code>. Для <code>Hello</code> два оставшихся байта
        <code>lo</code> дают <code>bG8</code> плюс один <code>=</code>. Итог:
      </p>
      <pre><code>Hello → SGVsbG8=</code></pre>
      <p>
        Правило простое: один «лишний» байт даёт два <code>=</code>, два «лишних» байта —
        один <code>=</code>. Сами знаки <code>=</code> не несут данных, они лишь
        показывают, сколько байтов было в последней группе. Закодировать и раскодировать
        текст можно в
        <NuxtLink :to="localePath('/base64-encode-decode')">кодировщике Base64</NuxtLink> —
        всё считается прямо в браузере.
      </p>

      <h2>Где применяется Base64</h2>
      <p>
        Base64 нужен везде, где двоичные данные приходится передавать там, где ожидается
        только текст:
      </p>
      <ul>
        <li>
          <strong>Data URI</strong> в HTML и CSS — картинку или шрифт встраивают прямо в код:
          <code>background: url(data:image/png;base64,iVBORw0KGgo…)</code>. Получить такую
          строку для своей картинки удобно в
          <NuxtLink :to="localePath('/image-to-base64')">конвертере изображения в Base64</NuxtLink>.
        </li>
        <li><strong>Электронная почта (MIME)</strong> — вложения и нетекстовые части письма кодируются в Base64, потому что протокол SMTP исторически рассчитан на текст.</li>
        <li><strong>JSON и API</strong> — байтовые поля (файлы, бинарные подписи, ключи) удобно класть в строку JSON в виде Base64.</li>
        <li><strong>JWT</strong> — header и payload токена закодированы в варианте base64url; подробнее в гайде <NuxtLink :to="localePath('/guides/what-is-jwt')">«Что такое JWT»</NuxtLink>.</li>
      </ul>

      <h2>Base64 — это не шифрование</h2>
      <p>
        Это самое частое заблуждение. <strong>Base64 полностью обратим без какого-либо
        ключа.</strong> Любой, у кого есть строка, за миллисекунды получит исходные байты.
        Кодирование не скрывает и не защищает данные — оно только меняет их форму. Поэтому
        <strong>никогда не используйте Base64, чтобы «спрятать» пароли, токены или личные
        данные</strong>. Если данные нужно действительно защитить, применяйте шифрование
        (например, AES) или хеширование для паролей. Base64 отвечает за <em>транспорт</em>,
        а не за <em>безопасность</em>.
      </p>

      <h2>URL-safe Base64</h2>
      <p>
        Символы <code>+</code> и <code>/</code> имеют особое значение в URL и в именах
        файлов: <code>/</code> — разделитель пути, а <code>+</code> в query-строке часто
        трактуется как пробел. Чтобы строку можно было безопасно положить в адрес, придумали
        <strong>URL-safe-вариант (base64url)</strong>: <code>+</code> заменяют на
        <code>-</code>, <code>/</code> — на <code>_</code>, а дополнение <code>=</code> чаще
        всего убирают. Именно этот вариант используют JWT и многие токены в ссылках.
        Сравните это с
        <NuxtLink :to="localePath('/url-encode-decode')">URL-кодированием (percent-encoding)</NuxtLink> —
        это другая схема: она экранирует отдельные символы как <code>%XX</code> и решает
        ту же задачу безопасного текста, но иначе.
      </p>
    </template>

    <template v-else>
      <p>
        <strong>Base64</strong> is a way to represent arbitrary binary data as text made up
        only of "safe", printable characters. It does not compress and does not encrypt —
        it only changes how the data is represented, so the bytes can travel safely through
        channels that expect text: HTML, CSS, JSON, email and URLs.
      </p>

      <h2>An alphabet of 64 characters</h2>
      <p>
        The name encodes the idea: it uses <strong>64 characters</strong> — the Latin
        letters <code>A–Z</code>, <code>a–z</code>, the digits <code>0–9</code>, and two
        extra signs, <code>+</code> and <code>/</code>. Each of these 64 characters maps to
        a number from 0 to 63, which is exactly <strong>6 bits</strong>. One more special
        character, <code>=</code>, is used as padding at the end.
      </p>

      <h2>How it works: 3 bytes → 4 characters</h2>
      <p>
        Binary data is made of 8-bit bytes, while a Base64 character encodes 6 bits. The
        least common multiple of 8 and 6 is 24 bits, which is <strong>3 bytes</strong>. The
        algorithm takes 3 bytes (24 bits), splits them into <strong>4 groups of 6 bits</strong>,
        and replaces each group with the matching character from the alphabet. So 3 input
        bytes always produce 4 output characters — which is why the size grows by about
        <strong>33%</strong> (a 4 ÷ 3 ratio).
      </p>
      <p>Let's walk through the word <code>Hello</code>:</p>
      <pre><code>Text:      H        e        l
ASCII:     72       101      108
Bits:      01001000 01100101 01101100
6-bit:     010010 000110 010101 101100
Values:    18     6      21     44
Base64:    S      G       V      s</code></pre>
      <p>
        The first 3 bytes (<code>Hel</code>) became <code>SGVs</code>. Two bytes are left —
        <code>lo</code> — and that is where padding comes in.
      </p>

      <h2>What the "=" padding is for</h2>
      <p>
        When the data is not a multiple of 3 bytes, the final group is incomplete. It is
        still padded with zero bits to make whole 6-bit characters, and the missing slots
        needed to reach a group of four are filled with <code>=</code>. For <code>Hello</code>,
        the two remaining bytes <code>lo</code> produce <code>bG8</code> plus one
        <code>=</code>. The result:
      </p>
      <pre><code>Hello → SGVsbG8=</code></pre>
      <p>
        The rule is simple: one "extra" byte gives two <code>=</code>, two "extra" bytes
        give one <code>=</code>. The <code>=</code> signs carry no data — they just signal
        how many bytes the final group held. You can encode and decode text in the
        <NuxtLink :to="localePath('/base64-encode-decode')">Base64 encoder</NuxtLink> —
        everything runs right in your browser.
      </p>

      <h2>Where Base64 is used</h2>
      <p>
        Base64 shows up anywhere binary data has to be carried where only text is expected:
      </p>
      <ul>
        <li>
          <strong>Data URIs</strong> in HTML and CSS — an image or font is embedded directly
          in the code: <code>background: url(data:image/png;base64,iVBORw0KGgo…)</code>. You
          can produce such a string for your own image with the
          <NuxtLink :to="localePath('/image-to-base64')">image-to-Base64 converter</NuxtLink>.
        </li>
        <li><strong>Email (MIME)</strong> — attachments and non-text parts of a message are Base64-encoded, because SMTP was historically designed for text.</li>
        <li><strong>JSON and APIs</strong> — byte fields (files, binary signatures, keys) are conveniently placed into a JSON string as Base64.</li>
        <li><strong>JWT</strong> — a token's header and payload are encoded with the base64url variant; see the <NuxtLink :to="localePath('/guides/what-is-jwt')">"What is JWT"</NuxtLink> guide.</li>
      </ul>

      <h2>Base64 is not encryption</h2>
      <p>
        This is the most common misconception. <strong>Base64 is fully reversible with no
        key whatsoever.</strong> Anyone holding the string gets the original bytes back in
        milliseconds. Encoding neither hides nor protects data — it only changes its shape.
        So <strong>never use Base64 to "hide" passwords, tokens or private data</strong>. If
        data really needs protecting, use encryption (such as AES) or hashing for passwords.
        Base64 is about <em>transport</em>, not <em>security</em>.
      </p>

      <h2>URL-safe Base64</h2>
      <p>
        The characters <code>+</code> and <code>/</code> have special meaning in URLs and
        filenames: <code>/</code> is a path separator, and <code>+</code> in a query string
        is often read as a space. To make a string safe to drop into an address, there is a
        <strong>URL-safe variant (base64url)</strong>: <code>+</code> becomes <code>-</code>,
        <code>/</code> becomes <code>_</code>, and the <code>=</code> padding is usually
        omitted. This is the variant JWTs use, and what you want for tokens in links. Compare
        it with
        <NuxtLink :to="localePath('/url-encode-decode')">URL encoding (percent-encoding)</NuxtLink> —
        a different scheme that escapes individual characters as <code>%XX</code> and solves
        the same "safe text" problem in another way.
      </p>
    </template>
  </GuidePage>
</template>
