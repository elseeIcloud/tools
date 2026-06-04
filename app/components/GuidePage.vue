<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const props = defineProps<{
  slug: string
  faq?: FaqItem[]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

// One call wires title, meta and JSON-LD for the whole guide (locale-aware).
const { meta, guide, tools, relatedGuides } = useGuideSeo(props.slug, { faq: props.faq })
const lc = computed(() => locale.value as 'en' | 'ru')
const dateLabel = computed(() => (guide ? formatGuideDate(guide.date, lc.value) : ''))
const updatedLabel = computed(() =>
  guide?.updated && guide.updated !== guide.date ? formatGuideDate(guide.updated, lc.value) : '',
)
</script>

<template>
  <article class="container-tool py-8 sm:py-10">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-ink-500 dark:text-ink-400">
      <NuxtLink :to="localePath('/')" class="hover:text-accent">{{ t('tool.home') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <NuxtLink :to="localePath('/guides')" class="hover:text-accent">{{ t('guides.heading') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <span class="text-ink-700 dark:text-ink-200">{{ meta?.h1 }}</span>
    </nav>

    <!-- Header -->
    <header class="mb-6 max-w-3xl">
      <div class="flex items-center gap-3">
        <span
          class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 font-mono text-lg text-accent"
          aria-hidden="true"
        >{{ guide?.icon }}</span>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ meta?.h1 }}</h1>
      </div>
      <p class="mt-3 text-ink-600 dark:text-ink-300">{{ meta?.description }}</p>
      <p class="mt-3 text-sm text-ink-400">
        <time :datetime="guide?.date">{{ t('guides.published') }}: {{ dateLabel }}</time>
        <template v-if="updatedLabel"> · {{ t('guides.updated') }}: {{ updatedLabel }}</template>
      </p>
    </header>

    <!-- Article body -->
    <section class="prose-tool max-w-3xl">
      <slot />
    </section>

    <!-- FAQ (native accordions; also emitted as FAQPage JSON-LD) -->
    <section v-if="faq?.length" class="mt-12 max-w-3xl">
      <h2 class="mb-4 text-xl font-semibold">{{ t('tool.faqHeading') }}</h2>
      <div class="space-y-2">
        <details
          v-for="(item, i) in faq"
          :key="i"
          class="group rounded-lg border border-ink-200 bg-white px-4 py-3 dark:border-ink-800 dark:bg-ink-900"
        >
          <summary class="cursor-pointer list-none font-medium marker:hidden">
            <span class="flex items-center justify-between gap-4">
              {{ item.q }}
              <span class="text-ink-400 transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">{{ item.a }}</p>
        </details>
      </div>
    </section>

    <!-- Tools referenced by this guide -->
    <section v-if="tools.length" class="mt-12 max-w-3xl">
      <h2 class="mb-4 text-xl font-semibold">{{ t('guides.toolsInGuide') }}</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <NuxtLink
          v-for="tl in tools"
          :key="tl.slug"
          :to="localePath(`/${tl.slug}`)"
          class="card flex items-center gap-3 p-3.5 transition-colors hover:border-accent"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-accent" aria-hidden="true">{{ tl.icon }}</span>
          <span class="font-medium">{{ tl[lc].name }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- More guides -->
    <section v-if="relatedGuides.length" class="mt-12 max-w-3xl">
      <h2 class="mb-4 text-xl font-semibold">{{ t('guides.moreGuides') }}</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <NuxtLink
          v-for="g in relatedGuides"
          :key="g.slug"
          :to="localePath(`/guides/${g.slug}`)"
          class="card flex items-start gap-3 p-3.5 transition-colors hover:border-accent"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-accent" aria-hidden="true">{{ g.icon }}</span>
          <span>
            <span class="block font-medium leading-snug">{{ g[lc].h1 }}</span>
            <span class="mt-0.5 block text-sm text-ink-500 dark:text-ink-400">{{ g[lc].excerpt }}</span>
          </span>
        </NuxtLink>
      </div>
    </section>
  </article>
</template>
