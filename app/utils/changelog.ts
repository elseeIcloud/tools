// Public "What's new" changelog. Newest entries first. Bilingual; dates are
// ISO 'YYYY-MM-DD' strings (SSG-safe, formatted with formatGuideDate).

export interface ChangelogEntry {
  date: string
  tag: 'new' | 'improved'
  en: { title: string; description: string }
  ru: { title: string; description: string }
}

export const changelog: ChangelogEntry[] = [
  {
    date: '2026-06-04',
    tag: 'improved',
    en: { title: 'Smarter ⌘K command palette', description: 'Search now covers guides and quick actions (theme, language, random tool), and smart paste recognises JWTs, JSON, Base64 and more.' },
    ru: { title: 'Палитра ⌘K стала умнее', description: 'Поиск теперь охватывает гайды и быстрые действия (тема, язык, случайный инструмент), а «умная вставка» распознаёт JWT, JSON, Base64 и другое.' },
  },
  {
    date: '2026-06-04',
    tag: 'improved',
    en: { title: 'Guides linked from tools', description: 'Relevant tools now link to the guides that explain them, in both directions.' },
    ru: { title: 'Гайды на страницах инструментов', description: 'Под подходящими инструментами появились ссылки на профильные гайды — связь стала двусторонней.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Installable app & offline', description: 'DevTools can be installed as an app and used offline — handy for the tools you reach for daily.' },
    ru: { title: 'Установка как приложение и офлайн', description: 'DevTools можно установить как приложение и пользоваться без интернета — удобно для ежедневных инструментов.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Link preview images', description: 'Links to the site now unfurl with a branded preview image on social media and chats.' },
    ru: { title: 'Превью при шаринге ссылок', description: 'Ссылки на сайт теперь разворачиваются фирменной картинкой в соцсетях и мессенджерах.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Security tools', description: 'Added bcrypt (hash & verify), HMAC, AES text encryption, a Basic Auth header generator and a password-strength checker.' },
    ru: { title: 'Инструменты безопасности', description: 'Добавлены bcrypt (хеш и проверка), HMAC, AES-шифрование текста, генератор заголовка Basic Auth и проверка надёжности пароля.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Image tools', description: 'A new category: compress, resize and convert PNG/JPG/WebP — right in your browser, nothing uploaded.' },
    ru: { title: 'Работа с изображениями', description: 'Новая категория: сжатие, ресайз и конвертация PNG/JPG/WebP — прямо в браузере, без загрузки на сервер.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Guides section', description: 'Practical, example-driven articles: JWT, cron, Base64, UUID, CSS units and HTTP status codes.' },
    ru: { title: 'Раздел «Гайды»', description: 'Практические статьи с примерами: JWT, cron, Base64, UUID, единицы CSS и HTTP-коды.' },
  },
  {
    date: '2026-06-04',
    tag: 'improved',
    en: { title: 'Category pages & refreshed home', description: 'Tools are grouped into dedicated category pages and the homepage is now a compact, scannable overview.' },
    ru: { title: 'Категории и обновлённая главная', description: 'Инструменты сгруппированы по отдельным страницам категорий, а главная стала компактным обзором.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'Search, favorites & shortcuts', description: 'A ⌘K command palette, favorite and recent tools, and full keyboard navigation.' },
    ru: { title: 'Поиск, избранное и горячие клавиши', description: 'Командная палитра ⌘K, избранные и недавние инструменты и навигация с клавиатуры.' },
  },
  {
    date: '2026-06-04',
    tag: 'new',
    en: { title: 'DevTools launch', description: 'Dozens of fast developer tools in Russian and English, dark mode, and a strict privacy promise — everything runs in your browser.' },
    ru: { title: 'Запуск DevTools', description: 'Десятки быстрых инструментов для разработчиков на русском и английском, тёмная тема и строгая приватность — всё работает в браузере.' },
  },
]

export function changelogByDate(): { date: string; entries: ChangelogEntry[] }[] {
  const groups: { date: string; entries: ChangelogEntry[] }[] = []
  for (const e of changelog) {
    const g = groups.find((x) => x.date === e.date)
    if (g) g.entries.push(e)
    else groups.push({ date: e.date, entries: [e] })
  }
  return groups
}
