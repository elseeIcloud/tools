<script setup lang="ts">
import type { Tool } from '~/utils/tools'

defineProps<{ tool: Tool }>()

const { locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="card group relative flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg">
    <!-- Stretched link: covers the whole card for navigation. -->
    <NuxtLink
      :to="localePath(`/${tool.slug}`)"
      class="absolute inset-0 z-[1] rounded-xl"
      :aria-label="tool[locale].name"
    />
    <div class="flex items-center gap-3">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 font-mono text-lg text-accent" aria-hidden="true">{{ tool.icon }}</span>
      <span class="font-semibold group-hover:text-accent">{{ tool[locale].name }}</span>
      <!-- Star sits above the stretched link so its click toggles favorite. -->
      <FavoriteButton :slug="tool.slug" small class="relative z-[2] ml-auto" />
    </div>
    <p class="line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{{ tool[locale].description }}</p>
  </div>
</template>
