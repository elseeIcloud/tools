<script setup lang="ts">
import type { ToolCategory } from '~/utils/tools'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const lc = computed(() => locale.value as 'en' | 'ru')

const slug = String(route.params.category)
if (!isToolCategory(slug)) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}
const category = slug as ToolCategory
const items = getToolsInCategory(category)
const others = CATEGORY_ORDER.filter((c) => c !== category)

const meta = computed(() => CATEGORY_META[category][lc.value])
const name = computed(() => t(`categories.${category}`))
const countLabel = computed(() => toolCountLabel(items.length, lc.value))

const pageUrl = computed(() => SITE_URL + localePath(`/category/${category}`))
const homeUrl = computed(() => SITE_URL + localePath('/'))

useSeoMeta({
  title: () => meta.value.title,
  ogTitle: () => meta.value.title,
  description: () => meta.value.description,
  ogDescription: () => meta.value.description,
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
          { '@type': 'ListItem', position: 2, name: name.value, item: pageUrl.value },
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: meta.value.title,
        itemListElement: items.map((tl, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: tl[lc.value].name,
          url: SITE_URL + localePath(`/${tl.slug}`),
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
      <span class="text-ink-700 dark:text-ink-200">{{ name }}</span>
    </nav>

    <header class="mb-8 max-w-2xl">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-xl" aria-hidden="true">{{ CATEGORY_ICON[category] }}</span>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ name }}</h1>
        <span class="ml-1 rounded-full bg-ink-100 px-2.5 py-0.5 text-sm font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">{{ countLabel }}</span>
      </div>
      <p class="mt-3 text-ink-600 dark:text-ink-300">{{ meta.description }}</p>
    </header>

    <!-- Tools in this category -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ToolCard v-for="tool in items" :key="tool.slug" :tool="tool" />
    </div>

    <!-- Other categories -->
    <section class="mt-12 border-t border-ink-200 pt-8 dark:border-ink-800">
      <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">{{ t('category.otherCategories') }}</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="c in others"
          :key="c"
          :to="localePath(`/category/${c}`)"
          class="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent dark:border-ink-700"
        >
          <span aria-hidden="true">{{ CATEGORY_ICON[c] }}</span>
          {{ t(`categories.${c}`) }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
