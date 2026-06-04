// Detects the OS once (client-side) so shortcut hints show the right modifier:
// ⌘ on macOS, Ctrl elsewhere. State starts as non-mac so any SSR/first-paint
// markup is stable; the real value is resolved in onMounted. Glyph-bearing UI
// (header hint kbd, shortcuts modal) is client-only, so there is no mismatch.
export function usePlatform() {
  const isMac = useState('platform-mac', () => false)
  const ready = useState('platform-ready', () => false)

  onMounted(() => {
    if (ready.value) return
    isMac.value = /Mac|iPhone|iPad|iPod/.test(navigator.platform)
    ready.value = true
  })

  const modKey = computed(() => (isMac.value ? '⌘' : 'Ctrl'))

  return { isMac, modKey }
}
