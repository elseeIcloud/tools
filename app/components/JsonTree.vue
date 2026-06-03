<script setup lang="ts">
// Recursive, collapsible JSON tree viewer. Renders itself for nested
// objects/arrays (Nuxt auto-imports allow self-reference by name).
const props = withDefaults(
  defineProps<{
    data: unknown
    name?: string
    depth?: number
    last?: boolean
  }>(),
  { depth: 0, last: true },
)

const open = ref(props.depth < 2) // auto-expand the first couple of levels

const kind = computed<'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'>(() => {
  if (Array.isArray(props.data)) return 'array'
  if (props.data === null) return 'null'
  const t = typeof props.data
  if (t === 'object') return 'object'
  return t as 'string' | 'number' | 'boolean'
})

const collapsible = computed(() => kind.value === 'object' || kind.value === 'array')

const entries = computed<[string, unknown][]>(() => {
  if (kind.value === 'array') return (props.data as unknown[]).map((v, i) => [String(i), v])
  if (kind.value === 'object') return Object.entries(props.data as Record<string, unknown>)
  return []
})

const size = computed(() => entries.value.length)
const bracket = computed(() => (kind.value === 'array' ? ['[', ']'] : ['{', '}']))
</script>

<template>
  <div class="font-mono text-[13px] leading-6">
    <div class="flex items-start">
      <button
        v-if="collapsible && size > 0"
        type="button"
        class="mr-1 w-4 shrink-0 select-none text-ink-400 hover:text-accent"
        :aria-expanded="open"
        @click="open = !open"
      >{{ open ? '▾' : '▸' }}</button>
      <span v-else class="mr-1 w-4 shrink-0" />

      <span class="break-all">
        <span v-if="name !== undefined" class="text-sky-600 dark:text-sky-400">"{{ name }}"</span>
        <span v-if="name !== undefined" class="text-ink-400">: </span>

        <template v-if="collapsible">
          <span class="text-ink-400">{{ bracket[0] }}</span>
          <span v-if="!open" class="text-ink-400">
            <span class="mx-0.5 text-ink-300 dark:text-ink-500">{{ size }} {{ kind === 'array' ? 'items' : 'keys' }}</span>{{ bracket[1] }}<span v-if="!last">,</span>
          </span>
        </template>

        <template v-else>
          <span v-if="kind === 'string'" class="text-green-600 dark:text-green-400">"{{ data }}"</span>
          <span v-else-if="kind === 'number'" class="text-amber-600 dark:text-amber-400">{{ data }}</span>
          <span v-else-if="kind === 'boolean'" class="text-purple-600 dark:text-purple-400">{{ data }}</span>
          <span v-else class="text-ink-400">null</span><span v-if="!last">,</span>
        </template>
      </span>
    </div>

    <div v-if="collapsible && open && size > 0" class="border-l border-ink-200 pl-4 dark:border-ink-800" :class="{ 'ml-1.5': true }">
      <JsonTree
        v-for="([k, v], i) in entries"
        :key="k"
        :data="v"
        :name="kind === 'array' ? undefined : k"
        :depth="depth + 1"
        :last="i === entries.length - 1"
      />
      <div class="text-ink-400">{{ bracket[1] }}<span v-if="!last">,</span></div>
    </div>
  </div>
</template>
