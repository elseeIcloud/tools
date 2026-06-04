<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()
const lc = computed(() => locale.value as 'en' | 'ru')

const groups = changelogByDate()

useSeoMeta({
  title: () => t('changelog.title'),
  ogTitle: () => t('changelog.title'),
  description: () => t('changelog.description'),
  ogDescription: () => t('changelog.description'),
  ogType: 'website',
  ogSiteName: SITE_NAME,
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
          { '@type': 'ListItem', position: 1, name: t('tool.home'), item: SITE_URL + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t('changelog.heading'), item: SITE_URL + localePath('/changelog') },
        ],
      }),
    },
  ],
}))

function tagLabel(tag: 'new' | 'improved') {
  return tag === 'new' ? t('changelog.tagNew') : t('changelog.tagImproved')
}
</script>

<template>
  <div class="container-tool py-8 sm:py-10">
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-ink-500 dark:text-ink-400">
      <NuxtLink :to="localePath('/')" class="hover:text-accent">{{ t('tool.home') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <span class="text-ink-700 dark:text-ink-200">{{ t('changelog.heading') }}</span>
    </nav>

    <header class="mb-8 max-w-2xl">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t('changelog.heading') }}</h1>
      <p class="mt-3 text-ink-600 dark:text-ink-300">{{ t('changelog.intro') }}</p>
    </header>

    <div class="max-w-2xl space-y-10">
      <section v-for="group in groups" :key="group.date">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          <time :datetime="group.date">{{ formatGuideDate(group.date, lc) }}</time>
        </h2>
        <ul class="space-y-4 border-l border-ink-200 pl-5 dark:border-ink-800">
          <li v-for="(e, i) in group.entries" :key="i" class="relative">
            <span class="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-ink-50 dark:ring-ink-950" aria-hidden="true" />
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="e.tag === 'new'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-green-500/10 text-green-700 dark:text-green-400'"
              >{{ tagLabel(e.tag) }}</span>
              <span class="font-semibold text-ink-900 dark:text-ink-100">{{ e[lc].title }}</span>
            </div>
            <p class="mt-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ e[lc].description }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
