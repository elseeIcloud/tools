// vue-i18n runtime config. Messages themselves are loaded lazily per locale
// from i18n/locales/*.json (see nuxt.config i18n.locales[].file).
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
}))
