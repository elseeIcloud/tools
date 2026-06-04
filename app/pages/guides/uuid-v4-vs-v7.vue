<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'Is UUID v7 better than v4?',
    a: 'It depends on the use case. v7 is better when the UUID is a database primary key or you sort/paginate by creation order, because its time-ordered values keep index inserts sequential. v4 is better for opaque public identifiers where you do not want to leak when a record was created. Neither is more "secure" — they use the same 122 or so random bits for collision resistance.',
  },
  {
    q: 'Can two UUIDs ever collide?',
    a: 'In practice, no. v4 has 122 random bits, so you would need to generate roughly a billion UUIDs per second for about 85 years to have a 50% chance of one collision. v7 spends 48 bits on a millisecond timestamp but still fills the remaining bits with randomness, so within any single millisecond collisions are still astronomically unlikely. Treat both as globally unique.',
  },
  {
    q: 'Does UUID v7 leak the creation time?',
    a: 'Yes. The first 48 bits of a v7 are the Unix time in milliseconds, so anyone with the value can read approximately when it was generated. That is usually harmless and even useful, but if exposing record timing is a privacy concern (for example, public user IDs), prefer v4, which contains no timestamp.',
  },
  {
    q: 'Why is v4 bad as a database primary key?',
    a: 'Because v4 values are random, consecutive inserts land in random positions of a B-tree index. That causes page splits, fragmentation and poor cache locality, slowing inserts and bloating the index on high-volume tables. v7 keeps new rows at the "end" of the index, so inserts stay sequential and pages fill cleanly — much like an auto-increment integer, but globally unique.',
  },
  {
    q: 'How do I read the timestamp inside a UUID v7?',
    a: 'Take the first 12 hex characters (the first three groups before stripping dashes), parse them as a hexadecimal number to get the Unix time in milliseconds, then divide by 1000 for seconds. Paste that value into a Unix timestamp converter to get a human-readable date and time.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'UUID v7 лучше, чем v4?',
    a: 'Зависит от задачи. v7 лучше, когда UUID используется как первичный ключ БД или вы сортируете и пагинируете по времени создания: упорядоченные значения держат вставки в индекс последовательными. v4 лучше для непрозрачных публичных идентификаторов, где не нужно раскрывать момент создания записи. По безопасности они равны — устойчивость к коллизиям обеспечивают те же ~122 случайных бита.',
  },
  {
    q: 'Могут ли два UUID совпасть?',
    a: 'На практике — нет. У v4 122 случайных бита: чтобы получить 50% шанс одной коллизии, нужно генерировать около миллиарда UUID в секунду примерно 85 лет. v7 тратит 48 бит на метку времени в миллисекундах, но остальные биты тоже случайны, поэтому даже в пределах одной миллисекунды коллизия астрономически маловероятна. Обе версии можно считать глобально уникальными.',
  },
  {
    q: 'Раскрывает ли UUID v7 время создания?',
    a: 'Да. Первые 48 бит v7 — это Unix-время в миллисекундах, поэтому любой, у кого есть значение, может узнать примерное время генерации. Обычно это безвредно и даже полезно, но если раскрытие времени записи нежелательно (например, публичные ID пользователей), берите v4 — в нём нет метки времени.',
  },
  {
    q: 'Почему v4 плох в роли первичного ключа БД?',
    a: 'Потому что значения v4 случайны, и последовательные вставки попадают в случайные места B-tree-индекса. Это вызывает расщепление страниц, фрагментацию и плохую локальность кэша — вставки замедляются, индекс разрастается на нагруженных таблицах. v7 держит новые строки в «конце» индекса, поэтому вставки остаются последовательными, а страницы заполняются аккуратно — почти как автоинкрементный integer, но глобально уникально.',
  },
  {
    q: 'Как прочитать метку времени внутри UUID v7?',
    a: 'Возьмите первые 12 hex-символов (первые три группы, если убрать дефисы), разберите их как шестнадцатеричное число — получите Unix-время в миллисекундах, затем поделите на 1000 для секунд. Вставьте это значение в конвертер Unix timestamp, чтобы получить понятную дату и время.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="uuid-v4-vs-v7" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        <strong>UUID (Universally Unique Identifier)</strong> — это 128-битный
        идентификатор, который можно генерировать где угодно без согласования с
        центральным сервером и при этом рассчитывать на его глобальную уникальность.
        В каноническом виде это 36 символов: 32 шестнадцатеричные цифры, разбитые
        дефисами по схеме <strong>8-4-4-4-12</strong>, например
        <code>0190b3f2-7c3a-7e4b-9a1d-2f5c8e6d4b10</code>.
      </p>
      <p>
        Внутри этих битов спрятана служебная информация. Одна
        <em>nibble</em> (полубайт) кодирует <strong>версию</strong> — первая цифра
        третьей группы: <code>4</code> для v4, <code>7</code> для v7. Ещё несколько
        старших бит четвёртой группы — это <strong>variant</strong>, который для
        стандарта RFC всегда даёт первую цифру четвёртой группы из набора
        <code>8</code>, <code>9</code>, <code>a</code> или <code>b</code>. Версия и
        variant занимают 6 бит, остальные 122 распределяются по-разному в каждой версии.
      </p>

      <h2>UUID v4 — почти полностью случайный</h2>
      <p>
        v4 — самая распространённая версия. Из 128 бит фиксированы только 6 (версия и
        variant), а оставшиеся <strong>122 бита заполняются случайными значениями</strong>.
        Никакой структуры внутри нет — это просто очень большое случайное число.
        Благодаря такому объёму энтропии коллизии практически невозможны: чтобы получить
        хотя бы один шанс на совпадение, пришлось бы генерировать миллиарды значений в
        секунду десятилетиями.
      </p>
      <p>
        Обратная сторона случайности проявляется, когда v4 используют как
        <strong>первичный ключ базы данных</strong>. Соседние по времени записи получают
        совершенно случайные ключи, поэтому новые строки попадают в случайные места
        B-tree-индекса. Это приводит к расщеплению страниц (page splits), фрагментации
        индекса и промахам кэша — на нагруженных на вставку таблицах это ощутимо
        замедляет работу и раздувает размер индекса.
      </p>

      <h2>UUID v7 — упорядоченный по времени</h2>
      <p>
        v7 решает именно эту проблему. Структура простая: <strong>старшие 48 бит — это
        Unix-время в миллисекундах</strong>, дальше идут версия, variant и случайные
        биты. Из-за того, что время стоит в начале, лексикографическая (побайтовая)
        сортировка UUID совпадает с сортировкой по времени создания. Значения, выданные
        позже, всегда «больше».
      </p>
      <pre><code>v4:  9f8c2a01-4b6e-4d3a-bf12-7c9e0a1d5b22   (122 случайных бита)
v7:  0190b3f2-7c3a-7e4b-9a1d-2f5c8e6d4b10
     └──────┬─────┘ └┬┘
       48 бит        версия 7, дальше случайность
     времени (мс)</code></pre>
      <p>
        Первые 12 hex-символов (<code>0190b3f2-7c3a</code> без дефиса) — это и есть метка
        времени. Разобрав их как шестнадцатеричное число, вы получите миллисекунды эпохи;
        поделив на 1000 и вставив результат в
        <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертер Unix timestamp</NuxtLink>,
        увидите дату и время генерации. При этом v7 остаётся глобально уникальным: даже в
        пределах одной миллисекунды младшие случайные биты делают совпадение
        астрономически маловероятным.
      </p>

      <h2>Сравнение коротко</h2>
      <ul>
        <li><strong>Упорядоченность:</strong> v4 — нет (случайный порядок); v7 — да (по времени создания).</li>
        <li><strong>Вставка/индекс в БД:</strong> v4 — фрагментация и page splits; v7 — последовательные вставки, дружелюбен к B-tree.</li>
        <li><strong>Уникальность:</strong> у обоих практически абсолютная.</li>
        <li><strong>Время создания:</strong> v4 не раскрывает ничего; v7 раскрывает приблизительное время генерации — небольшое соображение приватности.</li>
      </ul>

      <h2>Когда что использовать</h2>
      <p>
        Берите <strong>v7</strong> для первичных ключей БД и для всего, что вы сортируете
        или пагинируете по времени: курсорная пагинация, журналы событий, таблицы с
        высокой частотой вставок. Берите <strong>v4</strong> для непрозрачных публичных
        идентификаторов (ссылки для шеринга, токены приглашений, публичные ID пользователей)
        и везде, где раскрывать момент создания нежелательно.
      </p>
      <p>
        Стоит знать и о соседях: <strong>v1</strong> — устаревший вариант, где время
        сочетается с MAC-адресом сетевой карты (это утечка идентификатора машины, поэтому
        v1 не рекомендуют для новых систем). <strong>ULID</strong> — нестандартная, но
        популярная альтернатива v7: те же 48 бит времени плюс случайность, только в
        компактной 26-символьной кодировке Crockford Base32. Если стандартный 36-символьный
        формат не нужен, ULID решает ту же задачу упорядоченности.
      </p>
      <p>
        Сгенерировать UUID любой версии (и v4, и v7) можно в
        <NuxtLink :to="localePath('/uuid-generator')">генераторе UUID</NuxtLink> — всё
        считается локально в браузере. Если же вам нужен детерминированный, повторяемый
        идентификатор из строки (например, хэш контента), смотрите в сторону
        <NuxtLink :to="localePath('/hash-generator')">генератора хэшей</NuxtLink>: SHA-256
        от входных данных даёт стабильный «отпечаток», а не случайное значение. Про то,
        как 128 бит превращаются в компактную текстовую форму, полезно почитать гайд
        <NuxtLink :to="localePath('/guides/what-is-base64')">«Что такое Base64»</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        A <strong>UUID (Universally Unique Identifier)</strong> is a 128-bit identifier
        that can be generated anywhere, without coordinating with a central server, while
        still being globally unique in practice. In its canonical form it is 36 characters:
        32 hexadecimal digits split by dashes in the <strong>8-4-4-4-12</strong> pattern,
        for example <code>0190b3f2-7c3a-7e4b-9a1d-2f5c8e6d4b10</code>.
      </p>
      <p>
        Some of those bits carry metadata. One <em>nibble</em> (half-byte) encodes the
        <strong>version</strong> — the first digit of the third group: <code>4</code> for
        v4, <code>7</code> for v7. A few high bits of the fourth group are the
        <strong>variant</strong>, which for RFC UUIDs always makes the first digit of the
        fourth group one of <code>8</code>, <code>9</code>, <code>a</code> or
        <code>b</code>. Version and variant take 6 bits; the other 122 are laid out
        differently in each version.
      </p>

      <h2>UUID v4 — almost entirely random</h2>
      <p>
        v4 is the most common version. Of the 128 bits, only 6 are fixed (version and
        variant); the remaining <strong>122 bits are filled with random data</strong>.
        There is no internal structure — it is simply a very large random number. With
        that much entropy, collisions are practically impossible: you would have to
        generate billions of values per second for decades to get even a single chance of
        a clash.
      </p>
      <p>
        The downside of randomness shows up when v4 is used as a
        <strong>database primary key</strong>. Records created close in time get
        completely random keys, so new rows land in random positions of a B-tree index.
        That causes page splits, index fragmentation and cache misses — on insert-heavy
        tables it noticeably slows things down and bloats the index.
      </p>

      <h2>UUID v7 — time-ordered</h2>
      <p>
        v7 fixes exactly that problem. The layout is simple: the <strong>high 48 bits are
        a Unix timestamp in milliseconds</strong>, followed by the version, variant and
        random bits. Because the time sits at the front, a lexicographic (byte-wise) sort
        of the UUIDs matches their creation order. Values issued later are always
        "greater."
      </p>
      <pre><code>v4:  9f8c2a01-4b6e-4d3a-bf12-7c9e0a1d5b22   (122 random bits)
v7:  0190b3f2-7c3a-7e4b-9a1d-2f5c8e6d4b10
     └──────┬─────┘ └┬┘
       48 bits       version 7, then randomness
     of time (ms)</code></pre>
      <p>
        The first 12 hex characters (<code>0190b3f2-7c3a</code> without the dash) are the
        timestamp. Parse them as a hexadecimal number to get milliseconds since the epoch;
        divide by 1000 and paste the result into the
        <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>
        to see when it was generated. v7 still stays globally unique: even within a single
        millisecond, the trailing random bits make a clash astronomically unlikely.
      </p>

      <h2>Comparison at a glance</h2>
      <ul>
        <li><strong>Ordering:</strong> v4 — none (random order); v7 — yes (by creation time).</li>
        <li><strong>DB insert/index:</strong> v4 — fragmentation and page splits; v7 — sequential inserts, B-tree friendly.</li>
        <li><strong>Uniqueness:</strong> both are effectively absolute.</li>
        <li><strong>Creation time:</strong> v4 reveals nothing; v7 exposes the approximate generation time — a minor privacy consideration.</li>
      </ul>

      <h2>When to use which</h2>
      <p>
        Use <strong>v7</strong> for database primary keys and anything you sort or
        paginate by time: cursor pagination, event logs, high-insert tables. Use
        <strong>v4</strong> for opaque public identifiers (share links, invite tokens,
        public user IDs) and anywhere you must not reveal when something was created.
      </p>
      <p>
        It helps to know the neighbours too. <strong>v1</strong> is a legacy variant that
        combines time with the network card's MAC address (that leaks a machine identifier,
        so v1 is discouraged for new systems). <strong>ULID</strong> is a non-standard but
        popular alternative to v7: the same 48 bits of time plus randomness, but in a
        compact 26-character Crockford Base32 encoding. If you do not need the standard
        36-character format, ULID solves the same ordering problem.
      </p>
      <p>
        You can generate a UUID of either version (both v4 and v7) in the
        <NuxtLink :to="localePath('/uuid-generator')">UUID generator</NuxtLink> — everything
        runs locally in your browser. If instead you need a deterministic, repeatable
        identifier derived from a string (for example, a content hash), reach for the
        <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>: a SHA-256
        of the input gives a stable "fingerprint" rather than a random value. For how 128
        bits get turned into a compact text form, the
        <NuxtLink :to="localePath('/guides/what-is-base64')">"What is Base64"</NuxtLink>
        guide is a useful read.
      </p>
    </template>
  </GuidePage>
</template>
