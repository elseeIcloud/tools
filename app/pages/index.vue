<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const groups = toolsByCategory()

const homeUrl = computed(() => SITE_URL + localePath('/'))

useSeoMeta({
  title: () => t('home.metaTitle'),
  ogTitle: () => `${SITE_NAME} — ${t('home.metaTitle')}`,
  description: () => t('home.metaDescription'),
  ogDescription: () => t('home.metaDescription'),
  ogType: 'website',
  ogSiteName: SITE_NAME,
  twitterCard: 'summary_large_image',
})

// canonical + hreflang come from useLocaleHead() in the layout.
useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: homeUrl.value,
        inLanguage: locale.value,
        description: t('home.metaDescription'),
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: tools.map((tool, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: tool[locale.value as 'en' | 'ru'].name,
          url: SITE_URL + localePath(`/${tool.slug}`),
        })),
      }),
    },
  ],
}))
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-tool pt-14 pb-10 text-center sm:pt-20 sm:pb-14">
      <h1 class="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
        {{ t('home.heroPre') }}
        <span class="text-accent">{{ t('home.heroAccent') }}</span>
      </h1>
      <p class="mx-auto mt-4 max-w-xl text-ink-600 dark:text-ink-300">
        {{ t('home.heroSub') }}
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span class="rounded-full bg-green-500/10 px-3 py-1 font-medium text-green-700 dark:text-green-400">🔒 {{ t('home.badgeClientSide') }}</span>
        <span class="rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">⚡ {{ t('home.badgeInstant') }}</span>
        <span class="rounded-full bg-ink-200/60 px-3 py-1 font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">🆓 {{ t('home.badgeNoSignup') }}</span>
      </div>
    </section>

    <!-- Tool grid by category -->
    <section class="container-tool pb-16">
      <div v-for="g in groups" :key="g.category" class="mb-10">
        <h2 class="mb-4 text-lg font-semibold text-ink-900 dark:text-ink-100">{{ t(`categories.${g.category}`) }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="tool in g.items"
            :key="tool.slug"
            :to="localePath(`/${tool.slug}`)"
            class="card group flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
          >
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 font-mono text-lg text-accent" aria-hidden="true">{{ tool.icon }}</span>
              <span class="font-semibold group-hover:text-accent">{{ tool[locale].name }}</span>
            </div>
            <p class="line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{{ tool[locale].description }}</p>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
