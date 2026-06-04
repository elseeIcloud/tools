<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const groups = toolsByCategory()
const categories = groups.map((g) => g.category)

const { favorites } = useFavorites()
const favoriteTools = computed(() =>
  favorites.value.map((s) => getTool(s)).filter((tl): tl is NonNullable<typeof tl> => !!tl),
)

const { recent } = useRecent()
const recentTools = computed(() =>
  recent.value.map((s) => getTool(s)).filter((tl): tl is NonNullable<typeof tl> => !!tl),
)

// Collapsible "Recent" section; the choice persists in localStorage. The
// section is client-only, but localStorage is still touched only in onMounted.
const RECENT_COLLAPSED_KEY = 'devtools:recent-collapsed'
const recentCollapsed = ref(false)
onMounted(() => {
  try {
    recentCollapsed.value = localStorage.getItem(RECENT_COLLAPSED_KEY) === '1'
  } catch {
    /* ignore unavailable storage */
  }
})
function toggleRecent() {
  recentCollapsed.value = !recentCollapsed.value
  try {
    localStorage.setItem(RECENT_COLLAPSED_KEY, recentCollapsed.value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

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
        itemListElement: categories.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t(`categories.${c}`),
          url: SITE_URL + localePath(`/category/${c}`),
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
        <button
          type="button"
          class="group mb-4 flex w-full items-center gap-2 text-lg font-semibold text-ink-900 dark:text-ink-100"
          :aria-expanded="!recentCollapsed"
          :title="recentCollapsed ? t('home.expand') : t('home.collapse')"
          @click="toggleRecent"
        >
          <span class="text-ink-400">🕘</span> {{ t('home.recent') }}
          <span class="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">{{ recentTools.length }}</span>
          <span
            class="ml-auto text-sm text-ink-400 transition-transform group-hover:text-accent"
            :class="recentCollapsed ? '' : 'rotate-180'"
            aria-hidden="true"
          >▾</span>
        </button>
        <div v-show="!recentCollapsed" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard v-for="tool in recentTools" :key="tool.slug" :tool="tool" />
        </div>
      </section>
    </ClientOnly>

    <!-- Browse by category -->
    <section class="container-tool pb-16">
      <h2 class="mb-6 mt-4 border-t border-ink-200 pt-8 text-lg font-semibold text-ink-900 dark:border-ink-800 dark:text-ink-100">{{ t('home.categoriesHeading') }}</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard v-for="c in categories" :key="c" :category="c" />
      </div>
    </section>
  </div>
</template>
