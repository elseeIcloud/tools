<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const props = defineProps<{
  slug: string
  faq?: FaqItem[]
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

// One call wires title, meta and JSON-LD for the whole page (locale-aware).
const { meta, related } = useToolSeo(props.slug, { faq: props.faq })
const tool = getTool(props.slug)
</script>

<template>
  <article class="container-tool py-8 sm:py-10">
    <!-- Breadcrumb -->
    <nav aria-label="Breadcrumb" class="mb-5 text-sm text-ink-500 dark:text-ink-400">
      <NuxtLink :to="localePath('/')" class="hover:text-accent">{{ t('tool.home') }}</NuxtLink>
      <span class="mx-1.5 text-ink-300 dark:text-ink-600">/</span>
      <span class="text-ink-700 dark:text-ink-200">{{ meta?.name }}</span>
    </nav>

    <!-- Header -->
    <header class="mb-6">
      <div class="flex items-center gap-3">
        <span
          class="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 font-mono text-lg text-accent"
          aria-hidden="true"
        >{{ tool?.icon }}</span>
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">{{ meta?.name }}</h1>
        <FavoriteButton :slug="slug" class="ml-auto shrink-0" />
      </div>
      <p class="mt-3 max-w-2xl text-ink-600 dark:text-ink-300">{{ meta?.description }}</p>
      <p class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
        🔒 {{ t('tool.privacy') }}
      </p>
    </header>

    <!-- Tool UI -->
    <section class="card p-4 sm:p-6">
      <slot />
    </section>

    <!-- Long-form content (how to use / about) -->
    <section v-if="$slots.content" class="prose-tool mt-12 max-w-3xl">
      <slot name="content" />
    </section>

    <!-- FAQ (rendered as native accordions; also emitted as FAQPage JSON-LD) -->
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

    <!-- Internal links to related tools -->
    <section v-if="related.length" class="mt-12">
      <h2 class="mb-4 text-xl font-semibold">{{ t('tool.seeAlso') }}</h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <NuxtLink
          v-for="r in related"
          :key="r.slug"
          :to="localePath(`/${r.slug}`)"
          class="card flex items-center gap-3 p-3.5 transition-colors hover:border-accent"
        >
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-accent" aria-hidden="true">{{ r.icon }}</span>
          <span class="font-medium">{{ r[locale].name }}</span>
        </NuxtLink>
      </div>
    </section>
  </article>
</template>
