// Shared open-state for the keyboard-shortcuts modal, so the footer trigger,
// the "?" global shortcut and the ShortcutsHelp component (mounted once in the
// layout) all stay in sync.
export function useShortcutsHelp() {
  const open = useState('shortcuts-help-open', () => false)
  return { open }
}
