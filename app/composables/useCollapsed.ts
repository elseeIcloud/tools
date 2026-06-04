// Collapsible-section state persisted in localStorage. SSG-safe: starts
// expanded (false) and reads the saved value only in onMounted, so it is used
// inside client-only sections without a hydration mismatch.
export function useCollapsed(key: string) {
  const storageKey = `devtools:${key}-collapsed`
  const collapsed = ref(false)

  onMounted(() => {
    try {
      collapsed.value = localStorage.getItem(storageKey) === '1'
    } catch {
      /* ignore unavailable storage */
    }
  })

  function toggle() {
    collapsed.value = !collapsed.value
    try {
      localStorage.setItem(storageKey, collapsed.value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }

  return { collapsed, toggle }
}
