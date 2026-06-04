<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const lc = computed(() => locale.value as 'en' | 'ru')

const list = getGuidesSorted()

const pageUrl = computed(() => SITE_URL + localePath('/guides'))
const homeUrl = computed(() => SITE_URL + localePath('/'))

useSeoMeta({
  title: () => t('guides.title'),
  ogTitle: () => t('guides.title'),
  description: () => t('guides.metaDescription'),
  ogDescription: () => t('guides.metaDescription'),
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
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('tool.home'), item: homeUrl.value },
          { '@type': 'ListItem', position: 2, name: t('guides.heading'), item: pageUrl.value },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: list.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g[lc.value].h1,
          url: SITE_URL + localePath(`/guides/${g.slug}`),
        })),
      }),
    },
  ],
}))
</script>

<template>
  <div class="container-tool py-8 sm:py-10">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-ink-500 dark:text-ink-400">
      <NuxtLink :to="localePath('/')" class="hover:text-accent">{{ t('tool.home') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <span class="text-ink-700 dark:text-ink-200">{{ t('guides.heading') }}</span>
    </nav>

    <header class="mb-8 max-w-2xl">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t('guides.heading') }}</h1>
      <p class="mt-3 text-ink-600 dark:text-ink-300">{{ t('guides.subtitle') }}</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="g in list"
        :key="g.slug"
        :to="localePath(`/guides/${g.slug}`)"
        class="card group flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
      >
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 font-mono text-lg text-accent" aria-hidden="true">{{ g.icon }}</span>
          <h2 class="font-semibold leading-snug group-hover:text-accent">{{ g[lc].h1 }}</h2>
        </div>
        <p class="text-sm text-ink-500 dark:text-ink-400">{{ g[lc].excerpt }}</p>
        <time :datetime="g.date" class="mt-1 text-xs text-ink-400">{{ formatGuideDate(g.date, lc) }}</time>
      </NuxtLink>
    </div>
  </div>
</template>
