<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <ContentPage page="about">
    <template v-if="locale === 'ru'">
      <p>
        <strong>DevTools</strong> — это бесплатный набор небольших и быстрых
        утилит для разработчиков: форматирование JSON, кодирование и
        декодирование, разбор JWT, генерация хешей и UUID, работа с cron и
        временными метками. Без лишнего, без регистрации, без навязчивой рекламы.
      </p>

      <h2>Приватность по умолчанию</h2>
      <p>
        Каждый инструмент работает <strong>целиком в вашем браузере</strong>.
        Данные, которые вы вставляете — ответы API, токены, конфиги — обрабатываются
        локально на JavaScript и никогда не отправляются на сервер и не сохраняются
        у нас. Поэтому инструментами безопасно пользоваться даже с конфиденциальной
        информацией. Подробнее — в
        <NuxtLink :to="localePath('/privacy')">политике конфиденциальности</NuxtLink>.
      </p>

      <h2>Быстро и бесплатно</h2>
      <p>
        Сайт собран статически и раздаётся с глобальной edge-сети, поэтому страницы
        открываются мгновенно и работают на любом устройстве. Пользоваться можно
        бесплатно и без ограничений.
      </p>

      <h2>Два языка</h2>
      <p>
        Интерфейс и материалы доступны на русском и английском — язык переключается
        в шапке в любой момент.
      </p>

      <h2>Связаться</h2>
      <p>
        Нашли ошибку или хотите предложить инструмент? Напишите на
        <a :href="`mailto:${SITE_CONTACT_EMAIL}`">{{ SITE_CONTACT_EMAIL }}</a>.
        Начать можно с <NuxtLink :to="localePath('/')">списка всех инструментов</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        <strong>DevTools</strong> is a free collection of small, fast utilities for
        developers — JSON formatting, encoding and decoding, JWT inspection, hash and
        UUID generation, cron and timestamp helpers. No clutter, no sign-up, no
        intrusive ads.
      </p>

      <h2>Privacy by design</h2>
      <p>
        Every tool runs <strong>entirely in your browser</strong>. The data you paste
        — API responses, tokens, config files — is processed locally with JavaScript
        and is never sent to or stored on a server. That makes the tools safe to use
        even with sensitive information. See our
        <NuxtLink :to="localePath('/privacy')">privacy policy</NuxtLink> for details.
      </p>

      <h2>Fast and free</h2>
      <p>
        The site is statically generated and served from a global edge network, so
        pages load instantly and work on any device. It is free to use with no limits.
      </p>

      <h2>Available in two languages</h2>
      <p>
        The interface and content are available in English and Russian — switch the
        language anytime from the header.
      </p>

      <h2>Get in touch</h2>
      <p>
        Found a bug or want a tool added? Email
        <a :href="`mailto:${SITE_CONTACT_EMAIL}`">{{ SITE_CONTACT_EMAIL }}</a>.
        You can start from the <NuxtLink :to="localePath('/')">list of all tools</NuxtLink>.
      </p>
    </template>
  </ContentPage>
</template>
