<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const groups = toolsByCategory()

const { favorites } = useFavorites()
const favoriteTools = computed(() =>
  favorites.value.map((s) => getTool(s)).filter((tl): tl is NonNullable<typeof tl> => !!tl),
)

const { recent } = useRecent()
const recentTools = computed(() =>
  recent.value.map((s) => getTool(s)).filter((tl): tl is NonNullable<typeof tl> => !!tl),
)

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
    <section class="container-tool pt-14 pb-8 text-center sm:pt-20 sm:pb-10">
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

    <!-- Favorites + Recent (client-only: depend on localStorage) -->
    <ClientOnly>
      <section v-if="favoriteTools.length" class="container-tool pb-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
          <span class="text-amber-500">★</span> {{ t('home.favorites') }}
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard v-for="tool in favoriteTools" :key="tool.slug" :tool="tool" />
        </div>
      </section>
      <section v-if="recentTools.length" class="container-tool pb-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100">
          <span class="text-ink-400">🕘</span> {{ t('home.recent') }}
        </h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard v-for="tool in recentTools" :key="tool.slug" :tool="tool" />
        </div>
      </section>
    </ClientOnly>

    <!-- All tools by category -->
    <section class="container-tool pb-16">
      <h2 class="mb-6 mt-4 border-t border-ink-200 pt-8 text-lg font-semibold text-ink-900 dark:border-ink-800 dark:text-ink-100">{{ t('home.allTools') }}</h2>
      <div v-for="g in groups" :key="g.category" class="mb-10">
        <h3 class="text-base font-semibold text-ink-900 dark:text-ink-100">{{ t(`categories.${g.category}`) }}</h3>
        <p class="mb-4 mt-1 text-sm text-ink-500 dark:text-ink-400">{{ t(`categoryDesc.${g.category}`) }}</p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard v-for="tool in g.items" :key="tool.slug" :tool="tool" />
        </div>
      </div>
    </section>
  </div>
</template>
