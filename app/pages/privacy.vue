<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <ContentPage page="privacy">
    <p class="text-sm text-ink-400">{{ t('privacy.updated') }}</p>

    <template v-if="locale === 'ru'">
      <p>
        Мы серьёзно относимся к приватности. Этот документ объясняет, какие данные
        DevTools обрабатывает, а какие — нет.
      </p>

      <h2>Данные инструментов остаются в браузере</h2>
      <p>
        Все инструменты работают на стороне клиента. Любой текст или файлы, которые
        вы вставляете, обрабатываются локально в вашем браузере и
        <strong>никогда не загружаются, не передаются, не логируются и не сохраняются</strong>
        нами. Мы физически не получаем эти данные.
      </p>

      <h2>Локальное хранилище</h2>
      <p>
        Мы сохраняем одну-единственную настройку — выбор светлой или тёмной темы — в
        локальном хранилище (localStorage) вашего браузера. Она остаётся на устройстве
        и никуда не отправляется. Очистить её можно в любой момент средствами браузера.
      </p>

      <h2>Cookie</h2>
      <p>Мы не устанавливаем отслеживающих cookie.</p>

      <h2>Хостинг</h2>
      <p>
        Сайт раздаётся как статические файлы через Cloudflare. Как и любой веб-хостинг,
        Cloudflare автоматически обрабатывает базовые технические данные запроса
        (например, IP-адрес и user-agent) для доставки контента и защиты от
        злоупотреблений — в соответствии с политикой конфиденциальности Cloudflare.
        Сами мы эти данные не получаем и не храним.
      </p>

      <h2>Аналитика</h2>
      <p>
        Мы используем <strong>Cloudflare Web Analytics</strong> — приватную аналитику
        <strong>без cookie</strong>. Она не задаёт идентификаторы, не отслеживает вас
        между сайтами и не строит профиль: фиксируются только обезличенные агрегированные
        показатели (просмотры страниц, тип устройства, страна, источник перехода). Это
        никак не затрагивает данные, которые вы вставляете в инструменты, — они по-прежнему
        не покидают браузер. Рекламы на сайте нет.
      </p>

      <h2>Внешние ссылки</h2>
      <p>
        Страницы могут вести на внешние сайты — их политики конфиденциальности
        действуют отдельно и от нас не зависят.
      </p>

      <h2>Дети</h2>
      <p>Сайт общего назначения и не предназначен специально для детей.</p>

      <h2>Изменения</h2>
      <p>
        Мы можем обновлять эту политику; дата вверху отражает последнюю редакцию.
      </p>

      <h2>Контакты</h2>
      <p>
        По вопросам конфиденциальности пишите на
        <a :href="`mailto:${SITE_CONTACT_EMAIL}`">{{ SITE_CONTACT_EMAIL }}</a>.
        Больше о проекте — на странице <NuxtLink :to="localePath('/about')">«О проекте»</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        Your privacy matters. This policy explains what data DevTools does and does
        not handle.
      </p>

      <h2>Tool data stays in your browser</h2>
      <p>
        All tools run client-side. Any text or files you paste are processed locally
        in your browser and are
        <strong>never uploaded, transmitted, logged, or stored</strong> by us. We never
        receive that data in the first place.
      </p>

      <h2>Local storage</h2>
      <p>
        We store a single preference — your light/dark theme choice — in your browser's
        local storage. It stays on your device and is not sent anywhere. You can clear
        it at any time through your browser.
      </p>

      <h2>Cookies</h2>
      <p>We do not set any tracking cookies.</p>

      <h2>Hosting</h2>
      <p>
        The site is served as static files by Cloudflare. Like any web host, Cloudflare
        automatically processes basic technical request data (such as IP address and
        user agent) to deliver content and protect against abuse, as described in
        Cloudflare's privacy policy. We do not receive or store this data ourselves.
      </p>

      <h2>Analytics</h2>
      <p>
        We use <strong>Cloudflare Web Analytics</strong>, a privacy-first,
        <strong>cookieless</strong> analytics service. It sets no identifiers, does not
        track you across sites and builds no profile — it records only anonymous,
        aggregate metrics (page views, device type, country, referrer). This never touches
        the data you paste into the tools, which still never leaves your browser. The site
        shows no ads.
      </p>

      <h2>Third-party links</h2>
      <p>
        Pages may link to external sites; their privacy practices are their own and
        outside our control.
      </p>

      <h2>Children</h2>
      <p>The site is general-purpose and is not directed at children.</p>

      <h2>Changes</h2>
      <p>
        We may update this policy; the date above reflects the latest revision.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, email
        <a :href="`mailto:${SITE_CONTACT_EMAIL}`">{{ SITE_CONTACT_EMAIL }}</a>.
        Learn more on the <NuxtLink :to="localePath('/about')">About</NuxtLink> page.
      </p>
    </template>
  </ContentPage>
</template>
