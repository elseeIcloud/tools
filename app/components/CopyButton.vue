<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Text to copy. Can be a string or a getter for lazy/large values. */
    text: string | (() => string)
    /** Override the button label; defaults to the localized "Copy". */
    label?: string
    small?: boolean
  }>(),
  { label: undefined, small: false },
)

const { t } = useI18n()
const idleLabel = computed(() => props.label ?? t('common.copy'))
const doneLabel = computed(() => t('common.copied'))

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  const value = typeof props.text === 'function' ? props.text() : props.text
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Fallback for browsers without the async clipboard API
    const ta = document.createElement('textarea')
    ta.value = value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1500)
}

onBeforeUnmount(() => timer && clearTimeout(timer))
</script>

<template>
  <button
    type="button"
    class="btn-ghost"
    :class="small ? '!px-2.5 !py-1.5 text-xs' : ''"
    :aria-label="copied ? doneLabel : idleLabel"
    @click="copy"
  >
    <span v-if="copied" class="text-green-600 dark:text-green-400">✓ {{ doneLabel }}</span>
    <span v-else>{{ idleLabel }}</span>
  </button>
</template>
