<script setup lang="ts">
import type { ToolCategory } from '~/utils/tools'

const props = defineProps<{ category: ToolCategory }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const lc = computed(() => locale.value as 'en' | 'ru')

const items = getToolsInCategory(props.category)
const examples = computed(() => items.slice(0, 4).map((tl) => tl[lc.value].name).join(' · '))
</script>

<template>
  <NuxtLink
    :to="localePath(`/category/${category}`)"
    class="card group flex flex-col gap-2 p-5 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
  >
    <div class="flex items-center gap-3">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-lg" aria-hidden="true">{{ CATEGORY_ICON[category] }}</span>
      <h3 class="font-semibold group-hover:text-accent">{{ t(`categories.${category}`) }}</h3>
      <span class="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500 dark:bg-ink-800 dark:text-ink-400">{{ items.length }}</span>
    </div>
    <p class="text-sm text-ink-500 dark:text-ink-400">{{ t(`categoryDesc.${category}`) }}</p>
    <p class="mt-1 line-clamp-1 text-xs text-ink-400">{{ examples }}</p>
  </NuxtLink>
</template>
