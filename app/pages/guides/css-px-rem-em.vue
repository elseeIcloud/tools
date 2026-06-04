<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'Should I use px or rem for font-size?',
    a: 'Use rem for font-size. A rem is relative to the root (html) font-size, so when a user raises their browser default font size, rem-based text scales up with it. A font-size in px stays fixed and ignores that preference, which is worse for accessibility. Reserve px for tiny fixed details like 1px borders.',
  },
  {
    q: 'How many pixels is 1rem?',
    a: '1rem equals the root font-size, which is 16px by default in every major browser. So 1rem = 16px, 0.75rem = 12px and 1.5rem = 24px — unless you (or the user) change the html font-size, in which case every rem value scales proportionally.',
  },
  {
    q: 'What is the difference between em and rem?',
    a: 'rem is always relative to the root element font-size, so it stays predictable everywhere. em is relative to the font-size of the current element, so it changes from element to element and compounds when elements with em font-sizes are nested. Use rem when you want a stable scale, em when a value should track its own element.',
  },
  {
    q: 'Does using px hurt accessibility?',
    a: 'For font-size and spacing, yes — px values do not respond to the user’s browser font-size setting, so text stays small for people who increased their default. Page zoom (Ctrl/Cmd +) still scales px, but the font-size preference does not. Use rem for type and spacing so the layout respects that preference; px is fine for hairline borders.',
  },
  {
    q: 'Which unit should I use in media queries?',
    a: 'Prefer em (or rem) in media-query widths. Browsers evaluate media queries against the user’s default font-size, so em breakpoints shift when someone enlarges text, keeping your layout aligned with their reading size. px breakpoints stay fixed and can break layouts at large text sizes. For consistency, em is the common choice for breakpoints.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Что использовать для font-size — px или rem?',
    a: 'Для font-size используйте rem. Единица rem отсчитывается от корневого размера шрифта (на элементе html), поэтому, когда пользователь увеличивает шрифт по умолчанию в браузере, текст в rem масштабируется вместе с ним. Размер в px остаётся фиксированным и игнорирует эту настройку — это хуже для доступности. px оставьте для мелких фиксированных деталей вроде границы в 1px.',
  },
  {
    q: 'Сколько пикселей в 1rem?',
    a: '1rem равен корневому размеру шрифта, а он по умолчанию во всех основных браузерах равен 16px. Значит, 1rem = 16px, 0.75rem = 12px, а 1.5rem = 24px — пока вы (или пользователь) не измените font-size у html. Тогда все значения в rem пересчитаются пропорционально.',
  },
  {
    q: 'Чем em отличается от rem?',
    a: 'rem всегда отсчитывается от размера шрифта корневого элемента, поэтому ведёт себя предсказуемо везде. em отсчитывается от font-size текущего элемента, поэтому меняется от элемента к элементу и накапливается (умножается) во вложенных элементах с em-размерами шрифта. rem нужен, когда хочется стабильной шкалы, em — когда значение должно зависеть от собственного шрифта элемента.',
  },
  {
    q: 'Вредит ли px доступности?',
    a: 'Для font-size и отступов — да: значения в px не реагируют на настройку размера шрифта в браузере, поэтому текст остаётся мелким для тех, кто увеличил шрифт по умолчанию. Масштаб страницы (Ctrl/Cmd +) px всё же увеличивает, а вот настройка размера шрифта — нет. Используйте rem для типографики и отступов, чтобы вёрстка уважала эту настройку; для тонких границ px подходит.',
  },
  {
    q: 'Какую единицу использовать в медиазапросах?',
    a: 'В ширинах медиазапросов лучше использовать em (или rem). Браузер вычисляет медиазапросы относительно размера шрифта по умолчанию, поэтому брейкпоинты в em смещаются, когда человек увеличивает текст, и вёрстка остаётся согласованной с его размером чтения. Брейкпоинты в px фиксированы и могут ломать макет при крупном шрифте. Для единообразия для брейкпоинтов обычно берут em.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="css-px-rem-em" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        В CSS размеры задают разными единицами, и три самые частые —
        <code>px</code>, <code>rem</code> и <code>em</code>. Выглядят они похоже, но
        ведут себя по-разному: <code>px</code> — <strong>абсолютная</strong> единица, а
        <code>rem</code> и <code>em</code> — <strong>относительные</strong>. От выбора
        зависит, будет ли интерфейс масштабироваться под настройки пользователя и
        насколько предсказуемо он поведёт себя во вложенных элементах.
      </p>

      <h2>px — абсолютная единица</h2>
      <p>
        <code>px</code> — это CSS-пиксель, не зависящий от устройства (device-independent
        pixel). Он не привязан к физическому пикселю экрана: на дисплеях с высокой
        плотностью один CSS-пиксель раскладывается на несколько физических. Главное —
        значение в <code>px</code> <em>фиксировано</em>: <code>16px</code> остаётся
        16px независимо от размера шрифта родителя или корня страницы. Это удобно, когда
        нужен жёстко заданный размер: граница в <code>1px</code>, иконка фиксированного
        размера, тонкая разделительная линия.
      </p>

      <h2>rem — относительно корня</h2>
      <p>
        <code>rem</code> (root em) отсчитывается от <strong>размера шрифта корневого
        элемента</strong> — то есть от <code>font-size</code> элемента
        <code>&lt;html&gt;</code>. По умолчанию в браузерах корневой размер шрифта равен
        <strong>16px</strong>, поэтому <code>1rem = 16px</code>. Небольшой ориентир для
        пересчёта:
      </p>
      <ul>
        <li><code>12px = 0.75rem</code></li>
        <li><code>14px = 0.875rem</code></li>
        <li><code>16px = 1rem</code></li>
        <li><code>18px = 1.125rem</code></li>
        <li><code>20px = 1.25rem</code></li>
        <li><code>24px = 1.5rem</code></li>
        <li><code>32px = 2rem</code></li>
      </ul>
      <p>
        Важно, что <code>rem</code> всегда смотрит только на корень — он не зависит от
        вложенности. Где бы вы ни написали <code>font-size: 1.5rem</code>, это будет 24px
        (при корне 16px), и на любом уровне дерева DOM. Это делает <code>rem</code>
        предсказуемой шкалой для типографики и отступов. Перевести конкретные значения
        между px и rem удобно в
        <NuxtLink :to="localePath('/css-units-converter')">конвертере единиц CSS</NuxtLink>.
      </p>

      <h2>em — относительно текущего элемента</h2>
      <p>
        <code>em</code> отсчитывается от <code>font-size</code> <strong>текущего
        элемента</strong>. А для самого свойства <code>font-size</code> единица
        <code>em</code> берёт за основу шрифт <em>родителя</em>. Из-за этого во вложенных
        элементах <code>em</code> начинает <strong>накапливаться (умножаться)</strong>.
        Посмотрите на пример:
      </p>
      <pre><code>html  { font-size: 16px; }      /* корень */
.box  { font-size: 1.5em; }     /* 1.5 × 16px = 24px  */
.box .box { font-size: 1.5em; } /* 1.5 × 24px = 36px  — родитель уже 24px! */
.box .box .box { font-size: 1.5em; } /* 1.5 × 36px = 54px */</code></pre>
      <p>
        Каждый вложенный <code>.box</code> берёт <code>1.5em</code> не от корня, а от
        размера шрифта своего родителя, и значения перемножаются. Для <code>rem</code>
        такого нет: <code>1.5rem</code> на любой глубине — это всегда 24px. Этот эффект
        накопления — и сильная сторона <code>em</code> (значения «подстраиваются» под
        контекст), и частая причина неожиданно крупного текста в глубоко вложенной
        вёрстке.
      </p>

      <h2>Доступность: почему rem важнее px для шрифтов</h2>
      <p>
        Пользователи могут менять размер шрифта по умолчанию в настройках браузера —
        например, поставить 20px вместо 16px, потому что так удобнее читать. Если
        типографика и отступы заданы в <code>rem</code>, при таком изменении корневой
        размер становится 20px, и <strong>весь текст и интерфейс масштабируются</strong>:
        <code>1rem</code> теперь 20px, <code>1.5rem</code> — 30px. А вот значения в
        <code>px</code> на эту настройку <strong>не реагируют</strong>: текст в
        <code>16px</code> так и останется мелким для человека, которому нужен крупнее.
        Поэтому для доступного интерфейса размеры шрифтов и отступы задают в
        <code>rem</code>, а не в <code>px</code>.
      </p>

      <h2>Единицы в медиазапросах</h2>
      <p>
        В <code>@media</code> ширины тоже стоит задавать в <code>em</code> (или
        <code>rem</code>), а не в <code>px</code>. Важная деталь: в медиазапросах
        <code>em</code> всегда считается от <strong>размера шрифта по умолчанию в
        браузере</strong> (обычно 16px), а не от вашего <code>font-size</code> на
        <code>&lt;html&gt;</code>. Поэтому брейкпоинт <code>40em</code> ≈ 640px при
        стандартных настройках, но если пользователь увеличит шрифт, брейкпоинт
        сместится вместе с ним — и переключение макета произойдёт на ширине,
        соответствующей его комфортному размеру чтения. Брейкпоинты в <code>px</code>
        фиксированы и при крупном шрифте могут оставлять узкие колонки с нечитаемо
        большим текстом.
      </p>
      <pre><code>/* надёжно: подстраивается под размер шрифта пользователя */
@media (min-width: 40em) { /* около 640px при базовых 16px */ }

/* фиксировано: не реагирует на настройку шрифта */
@media (min-width: 640px) { /* ... */ }</code></pre>

      <h2>Типографика: rem для размера, безразмерный line-height</h2>
      <p>
        Хорошее правило — задавать <code>font-size</code> в <code>rem</code>, а
        <code>line-height</code> делать <strong>безразмерным</strong>:
        <code>line-height: 1.5</code>. Число без единицы трактуется как множитель от
        собственного размера шрифта элемента и корректно наследуется, тогда как
        <code>line-height: 24px</code> жёстко фиксирует интервал и ломается при
        изменении размера текста. Иногда встречается «трюк 62.5%»:
        <code>html { font-size: 62.5% }</code> делает <code>1rem = 10px</code>, чтобы
        считать в уме (<code>1.6rem = 16px</code>). Сегодня он почти не нужен — лучше
        оставить корневой размер по умолчанию (чтобы уважать настройку пользователя) и
        пересчитывать значения в
        <NuxtLink :to="localePath('/css-units-converter')">конвертере единиц CSS</NuxtLink>.
      </p>

      <h2>Коротко про другие единицы</h2>
      <p>
        Кроме этих трёх есть и другие относительные единицы: <code>%</code> (доля от
        размера родителя), <code>vw</code>/<code>vh</code> (1% ширины/высоты окна),
        <code>ch</code> (ширина символа «0» — удобно ограничивать длину строки, например
        <code>max-width: 60ch</code>). Но в большинстве случаев для типографики и отступов
        достаточно связки <code>rem</code> + <code>em</code>.
      </p>

      <h2>Когда что использовать</h2>
      <ul>
        <li>
          <strong>rem</strong> — для размеров шрифта, отступов и элементов раскладки,
          которые должны масштабироваться вместе с настройкой пользователя. Это
          «рабочая лошадка» для типографики и spacing.
        </li>
        <li>
          <strong>em</strong> — когда размер должен зависеть от собственного шрифта
          элемента. Классический пример — внутренние отступы кнопки относительно её
          подписи: <code>padding: 0.5em 1em</code> автоматически растёт вместе с
          размером текста кнопки.
        </li>
        <li>
          <strong>px</strong> — для тонких границ и деталей, которые должны оставаться
          фиксированными: <code>border: 1px solid</code>, hairline-разделители,
          точные смещения теней.
        </li>
      </ul>
      <p>
        Эти единицы напрямую связаны и с дизайном, и с доступностью: выбирая цвета,
        проверяйте их контраст, а форматы значений конвертируйте под нужный синтаксис.
        Для этого пригодятся
        <NuxtLink :to="localePath('/color-converter')">конвертер цветов</NuxtLink> и
        <NuxtLink :to="localePath('/contrast-checker')">проверка контрастности</NuxtLink>.
        А если работаете с расписаниями и серверной частью — загляните в гайд
        <NuxtLink :to="localePath('/guides/cron-expressions-explained')">«Cron-выражения: синтаксис и примеры»</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        CSS lets you size things with several units, and the three most common are
        <code>px</code>, <code>rem</code> and <code>em</code>. They look similar but
        behave differently: <code>px</code> is an <strong>absolute</strong> unit, while
        <code>rem</code> and <code>em</code> are <strong>relative</strong>. The choice
        decides whether your UI scales with the user’s settings and how predictably it
        behaves inside nested elements.
      </p>

      <h2>px — an absolute unit</h2>
      <p>
        <code>px</code> is a CSS device-independent pixel. It is not tied to a physical
        screen pixel: on high-density displays one CSS pixel maps to several physical
        ones. The key point is that a value in <code>px</code> is <em>fixed</em>:
        <code>16px</code> stays 16px no matter the parent’s or the root’s font-size. That
        is useful when you need a hard, exact size — a <code>1px</code> border, a
        fixed-size icon, a thin divider line.
      </p>

      <h2>rem — relative to the root</h2>
      <p>
        <code>rem</code> (root em) is measured against the <strong>root element’s
        font-size</strong> — that is, the <code>font-size</code> of the
        <code>&lt;html&gt;</code> element. Browsers default the root font-size to
        <strong>16px</strong>, so <code>1rem = 16px</code>. A quick reference:
      </p>
      <ul>
        <li><code>12px = 0.75rem</code></li>
        <li><code>14px = 0.875rem</code></li>
        <li><code>16px = 1rem</code></li>
        <li><code>18px = 1.125rem</code></li>
        <li><code>20px = 1.25rem</code></li>
        <li><code>24px = 1.5rem</code></li>
        <li><code>32px = 2rem</code></li>
      </ul>
      <p>
        Crucially, <code>rem</code> only ever looks at the root — it ignores nesting.
        Wherever you write <code>font-size: 1.5rem</code>, it is 24px (with a 16px root),
        at any depth in the DOM tree. That makes <code>rem</code> a predictable scale for
        typography and spacing. To convert specific values between px and rem, use the
        <NuxtLink :to="localePath('/css-units-converter')">CSS units converter</NuxtLink>.
      </p>

      <h2>em — relative to the current element</h2>
      <p>
        <code>em</code> is measured against the <code>font-size</code> of the
        <strong>current element</strong>. For the <code>font-size</code> property itself,
        <code>em</code> is based on the <em>parent’s</em> font-size. Because of this,
        <code>em</code> starts to <strong>compound (multiply)</strong> in nested
        elements. Look at this example:
      </p>
      <pre><code>html  { font-size: 16px; }      /* root */
.box  { font-size: 1.5em; }     /* 1.5 × 16px = 24px  */
.box .box { font-size: 1.5em; } /* 1.5 × 24px = 36px  — parent is already 24px! */
.box .box .box { font-size: 1.5em; } /* 1.5 × 36px = 54px */</code></pre>
      <p>
        Each nested <code>.box</code> takes <code>1.5em</code> not from the root but from
        its parent’s font-size, and the values multiply. <code>rem</code> never does
        this: <code>1.5rem</code> at any depth is always 24px. This compounding is both
        the strength of <code>em</code> (values adapt to their context) and a common
        cause of surprisingly large text in deeply nested markup.
      </p>

      <h2>Accessibility: why rem beats px for fonts</h2>
      <p>
        Users can change their default font-size in the browser settings — say, set 20px
        instead of 16px because it reads more comfortably. If your typography and spacing
        are in <code>rem</code>, that change makes the root 20px and
        <strong>the whole UI scales</strong>: <code>1rem</code> is now 20px,
        <code>1.5rem</code> is 30px. Values in <code>px</code>, however,
        <strong>do not respond</strong> to that preference: text set in <code>16px</code>
        stays small for someone who needs it larger. That is why an accessible interface
        sets font sizes and spacing in <code>rem</code>, not <code>px</code>.
      </p>

      <h2>Units in media queries</h2>
      <p>
        In <code>@media</code> rules, prefer <code>em</code> (or <code>rem</code>) widths
        over <code>px</code>. An important detail: inside media queries <code>em</code> is
        always measured against the <strong>browser’s default font-size</strong> (usually
        16px), not the <code>font-size</code> you set on <code>&lt;html&gt;</code>. So a
        <code>40em</code> breakpoint is ≈ 640px with default settings, but if the user
        enlarges their font the breakpoint shifts with them — the layout switches at the
        width that matches their comfortable reading size. <code>px</code> breakpoints are
        fixed and can leave narrow columns full of unreadably large text at big font
        sizes.
      </p>
      <pre><code>/* robust: adapts to the user’s font-size */
@media (min-width: 40em) { /* about 640px at a 16px default */ }

/* fixed: ignores the font-size preference */
@media (min-width: 640px) { /* ... */ }</code></pre>

      <h2>Typography: rem for size, unitless line-height</h2>
      <p>
        A good rule is to set <code>font-size</code> in <code>rem</code> and make
        <code>line-height</code> <strong>unitless</strong>: <code>line-height: 1.5</code>.
        A number with no unit is treated as a multiplier of the element’s own font-size
        and inherits correctly, whereas <code>line-height: 24px</code> locks the spacing
        and breaks when the text size changes. You may also see the “62.5% trick”:
        <code>html { font-size: 62.5% }</code> makes <code>1rem = 10px</code> for easy
        mental math (<code>1.6rem = 16px</code>). It is rarely needed today — better to
        leave the root at its default (so it respects the user’s preference) and convert
        values with the
        <NuxtLink :to="localePath('/css-units-converter')">CSS units converter</NuxtLink>.
      </p>

      <h2>A note on other units</h2>
      <p>
        Beyond these three there are other relative units: <code>%</code> (a fraction of
        the parent’s size), <code>vw</code>/<code>vh</code> (1% of the viewport width or
        height) and <code>ch</code> (the width of the “0” glyph — handy for limiting line
        length, e.g. <code>max-width: 60ch</code>). But for most typography and spacing,
        the <code>rem</code> + <code>em</code> pair is all you need.
      </p>

      <h2>When to use which</h2>
      <ul>
        <li>
          <strong>rem</strong> — for font sizes, spacing and layout that should scale
          with the user’s preference. It is the workhorse for typography and spacing.
        </li>
        <li>
          <strong>em</strong> — when a size should track the element’s own font-size. The
          classic case is button padding relative to its label:
          <code>padding: 0.5em 1em</code> grows automatically with the button’s text
          size.
        </li>
        <li>
          <strong>px</strong> — for hairline borders and details that must stay fixed:
          <code>border: 1px solid</code>, thin dividers, precise shadow offsets.
        </li>
      </ul>
      <p>
        These units sit at the intersection of design and accessibility: when you pick
        colors, check their contrast, and convert value formats to the syntax you need.
        The
        <NuxtLink :to="localePath('/color-converter')">color converter</NuxtLink> and the
        <NuxtLink :to="localePath('/contrast-checker')">contrast checker</NuxtLink> help
        with that. And if you also work with schedules on the backend, see the
        <NuxtLink :to="localePath('/guides/cron-expressions-explained')">“Cron expressions explained”</NuxtLink>
        guide.
      </p>
    </template>
  </GuidePage>
</template>
