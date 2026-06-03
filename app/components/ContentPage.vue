<script setup lang="ts">
// Lightweight wrapper for static content pages (About, Privacy). Unlike
// ToolPage it carries no tool/registry/SoftwareApplication schema — just
// localized title/meta + a breadcrumb and prose slot. Canonical + hreflang
// come from useLocaleHead() in the default layout.
const props = defineProps<{
  /** i18n key prefix, e.g. 'about' or 'privacy' (reads <page>.title/.heading/.description) */
  page: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t(`${props.page}.title`),
  description: () => t(`${props.page}.description`),
  ogTitle: () => t(`${props.page}.title`),
  ogDescription: () => t(`${props.page}.description`),
  ogType: 'website',
  ogSiteName: SITE_NAME,
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('tool.home'), item: SITE_URL + localePath('/') },
          { '@type': 'ListItem', position: 2, name: t(`${props.page}.heading`), item: SITE_URL + localePath(`/${props.page}`) },
        ],
      }),
    },
  ],
})
</script>

<template>
  <article class="container-tool py-8 sm:py-10">
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-ink-500 dark:text-ink-400">
      <NuxtLink :to="localePath('/')" class="hover:text-accent">{{ t('tool.home') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <span class="text-ink-700 dark:text-ink-200">{{ t(`${page}.heading`) }}</span>
    </nav>

    <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ t(`${page}.heading`) }}</h1>

    <div class="prose-tool mt-6 max-w-3xl">
      <slot />
    </div>
  </article>
</template>
