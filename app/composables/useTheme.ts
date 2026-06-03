// Light/dark theme toggle. The actual <html class="dark"> is applied by an
// inline head script (see nuxt.config) before paint to avoid a flash; this
// composable just keeps the button state in sync and persists the choice.
export function useTheme() {
  const isDark = useState('theme-dark', () => false)

  onMounted(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })

  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    try {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    } catch {
      /* ignore storage errors (private mode etc.) */
    }
  }

  return { isDark, toggle }
}
