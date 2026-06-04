<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// The three permission classes and the three permission bits, in canonical
// chmod order. Read = 4, Write = 2, Execute = 1. Pure data, SSG-safe.
type ClassKey = 'owner' | 'group' | 'others'
type BitKey = 'r' | 'w' | 'x'

const CLASSES: ClassKey[] = ['owner', 'group', 'others']
const BITS: { key: BitKey; value: number; char: string }[] = [
  { key: 'r', value: 4, char: 'r' },
  { key: 'w', value: 2, char: 'w' },
  { key: 'x', value: 1, char: 'x' },
]

// Special bits, encoded as the optional leading 4th octal digit (setuid 4,
// setgid 2, sticky 1).
const SPECIAL: { key: 'setuid' | 'setgid' | 'sticky'; value: number }[] = [
  { key: 'setuid', value: 4 },
  { key: 'setgid', value: 2 },
  { key: 'sticky', value: 1 },
]

// Live state: a checkbox per class/bit, plus the three special bits.
const perms = reactive<Record<ClassKey, Record<BitKey, boolean>>>({
  owner: { r: true, w: true, x: false },
  group: { r: true, w: false, x: false },
  others: { r: true, w: false, x: false },
})
const special = reactive({ setuid: false, setgid: false, sticky: false })

// Target file/dir name used only to build the example command.
const target = ref('file')

// Tool-specific labels (common verbs like Copy/Clear come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        permissions: 'Права доступа',
        owner: 'Владелец',
        group: 'Группа',
        others: 'Остальные',
        read: 'Чтение',
        write: 'Запись',
        execute: 'Выполнение',
        special: 'Специальные биты',
        setuid: 'setuid',
        setgid: 'setgid',
        sticky: 'sticky',
        octal: 'Восьмеричная запись',
        symbolic: 'Символьная запись',
        command: 'Команда',
        octalInput: 'Ввести восьмеричное число',
        octalHint: '3 или 4 цифры (0–7), напр. 755 или 4755',
        invalidOctal: 'Допустимы только цифры 0–7, всего 3 или 4 цифры.',
        targetLabel: 'Имя файла',
        presets: 'Быстрые шаблоны',
        reset: 'Сбросить',
        p644: 'обычные файлы',
        p755: 'каталоги / скрипты',
        p600: 'приватные файлы',
        p777: 'полный доступ всем',
      }
    : {
        permissions: 'Permissions',
        owner: 'Owner',
        group: 'Group',
        others: 'Others',
        read: 'Read',
        write: 'Write',
        execute: 'Execute',
        special: 'Special bits',
        setuid: 'setuid',
        setgid: 'setgid',
        sticky: 'sticky',
        octal: 'Octal notation',
        symbolic: 'Symbolic notation',
        command: 'Command',
        octalInput: 'Enter octal',
        octalHint: '3 or 4 digits (0–7), e.g. 755 or 4755',
        invalidOctal: 'Only digits 0–7 are allowed, 3 or 4 of them.',
        targetLabel: 'File name',
        presets: 'Quick presets',
        reset: 'Reset',
        p644: 'regular files',
        p755: 'directories / scripts',
        p600: 'private files',
        p777: 'full access for everyone',
      },
)

// Numeric value (0..7) of a single permission class from its checkboxes.
function classValue(cls: ClassKey): number {
  return BITS.reduce((sum, b) => sum + (perms[cls][b.key] ? b.value : 0), 0)
}

const specialValue = computed(
  () => SPECIAL.reduce((sum, b) => sum + (special[b.key] ? b.value : 0), 0),
)

// Three-digit octal for the permission classes (owner, group, others).
const octalCore = computed(
  () => `${classValue('owner')}${classValue('group')}${classValue('others')}`,
)

// Full octal, prefixed with the special digit only when it is non-zero.
const octal = computed(() =>
  specialValue.value > 0 ? `${specialValue.value}${octalCore.value}` : octalCore.value,
)

// Symbolic string (rwxr-xr-x), honoring setuid/setgid/sticky on the x slot:
// an executable special bit shows s/t, a non-executable one shows S/T.
function symbolicFor(cls: ClassKey): string {
  const p = perms[cls]
  let xChar = p.x ? 'x' : '-'
  if (cls === 'owner' && special.setuid) xChar = p.x ? 's' : 'S'
  else if (cls === 'group' && special.setgid) xChar = p.x ? 's' : 'S'
  else if (cls === 'others' && special.sticky) xChar = p.x ? 't' : 'T'
  return `${p.r ? 'r' : '-'}${p.w ? 'w' : '-'}${xChar}`
}

const symbolic = computed(
  () => `${symbolicFor('owner')}${symbolicFor('group')}${symbolicFor('others')}`,
)

const safeTarget = computed(() => target.value.trim() || 'file')
const command = computed(() => `chmod ${octal.value} ${safeTarget.value}`)

// Reverse direction: a typed octal string drives the checkboxes.
const octalDraft = ref(octal.value)
const octalError = ref<string | null>(null)

// Apply a (validated) 3- or 4-digit octal string to the checkbox/special state.
function applyOctal(raw: string) {
  const digits = raw.split('').map(Number)
  let core = digits
  if (digits.length === 4) {
    const s = digits[0]!
    special.setuid = (s & 4) !== 0
    special.setgid = (s & 2) !== 0
    special.sticky = (s & 1) !== 0
    core = digits.slice(1)
  } else {
    special.setuid = special.setgid = special.sticky = false
  }
  CLASSES.forEach((cls, i) => {
    const v = core[i]!
    perms[cls].r = (v & 4) !== 0
    perms[cls].w = (v & 2) !== 0
    perms[cls].x = (v & 1) !== 0
  })
}

function onOctalInput() {
  const raw = octalDraft.value.trim()
  if (!/^[0-7]{3,4}$/.test(raw)) {
    octalError.value = ui.value.invalidOctal
    return
  }
  octalError.value = null
  applyOctal(raw)
}

// Keep the octal input field in sync when checkboxes drive the state, but never
// fight the user while they are typing an invalid value.
watch(octal, (val) => {
  if (!octalError.value) octalDraft.value = val
})

function applyPreset(value: string) {
  octalError.value = null
  octalDraft.value = value
  applyOctal(value)
}

const presets = computed(() => [
  { value: '644', label: ui.value.p644 },
  { value: '755', label: ui.value.p755 },
  { value: '600', label: ui.value.p600 },
  { value: '777', label: ui.value.p777 },
])

function reset() {
  applyPreset('644')
}

const faqEn: FaqItem[] = [
  {
    q: 'Does this calculator send my permissions anywhere?',
    a: 'No. The chmod calculator is pure arithmetic and runs entirely in your browser. Nothing you toggle or type is uploaded, logged or stored, so you can plan permissions for sensitive files and servers without anything leaving your device.',
  },
  {
    q: 'How is the octal number worked out?',
    a: 'Each permission class (owner, group, others) gets a digit from 0 to 7. Read adds 4, write adds 2 and execute adds 1, so rwx = 4+2+1 = 7 and r-x = 4+1 = 5. The three digits are simply concatenated, for example 755.',
  },
  {
    q: 'What is the optional fourth digit?',
    a: 'A leading fourth digit sets the special bits: setuid (4), setgid (2) and the sticky bit (1). For example 4755 turns on setuid plus rwxr-xr-x. In the symbolic view those bits replace the execute slot with s, S, t or T.',
  },
  {
    q: 'What do 644, 755, 600 and 777 mean?',
    a: '644 (rw-r--r--) is the usual choice for regular files, 755 (rwxr-xr-x) for directories and executable scripts, 600 (rw-------) for private files only the owner may touch, and 777 (rwxrwxrwx) grants full access to everyone — convenient but rarely safe.',
  },
  {
    q: 'Why does the symbolic string sometimes show s, S, t or T?',
    a: 'Those letters appear in the execute position when a special bit is set. A lowercase s or t means the special bit and execute are both on; an uppercase S or T means the special bit is on but execute is off, exactly as ls -l displays it.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляет ли калькулятор мои права куда-либо?',
    a: 'Нет. Калькулятор chmod — это чистая арифметика, всё считается прямо в браузере. Ничего из того, что вы переключаете или вводите, не загружается, не логируется и не сохраняется, поэтому можно планировать права для важных файлов и серверов, не передавая данные наружу.',
  },
  {
    q: 'Как получается восьмеричное число?',
    a: 'Каждый класс (владелец, группа, остальные) получает цифру от 0 до 7. Чтение даёт 4, запись — 2, выполнение — 1, поэтому rwx = 4+2+1 = 7, а r-x = 4+1 = 5. Три цифры просто записываются подряд, например 755.',
  },
  {
    q: 'Что за необязательная четвёртая цифра?',
    a: 'Ведущая четвёртая цифра задаёт специальные биты: setuid (4), setgid (2) и sticky (1). Например, 4755 включает setuid плюс rwxr-xr-x. В символьной записи эти биты заменяют позицию выполнения на s, S, t или T.',
  },
  {
    q: 'Что означают 644, 755, 600 и 777?',
    a: '644 (rw-r--r--) — стандарт для обычных файлов, 755 (rwxr-xr-x) — для каталогов и исполняемых скриптов, 600 (rw-------) — приватные файлы, доступные только владельцу, а 777 (rwxrwxrwx) даёт полный доступ всем — удобно, но почти всегда небезопасно.',
  },
  {
    q: 'Почему в символьной записи иногда видны s, S, t или T?',
    a: 'Эти буквы появляются в позиции выполнения, когда установлен специальный бит. Строчные s или t означают, что специальный бит и выполнение включены оба; заглавные S или T — что специальный бит включён, а выполнение выключено, ровно как это показывает ls -l.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="chmod-calculator" :faq="faq">
    <!-- Permission grid -->
    <div class="label">{{ ui.permissions }}</div>
    <div class="overflow-x-auto">
      <table class="w-full min-w-[20rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr class="text-left text-ink-500 dark:text-ink-400">
            <th class="pb-2 pr-4 font-medium"></th>
            <th class="pb-2 px-4 text-center font-medium">{{ ui.read }} <span class="text-ink-400">(4)</span></th>
            <th class="pb-2 px-4 text-center font-medium">{{ ui.write }} <span class="text-ink-400">(2)</span></th>
            <th class="pb-2 px-4 text-center font-medium">{{ ui.execute }} <span class="text-ink-400">(1)</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cls in CLASSES" :key="cls">
            <th class="py-1.5 pr-4 text-left font-medium text-ink-700 dark:text-ink-200">{{ ui[cls] }}</th>
            <td v-for="bit in BITS" :key="bit.key" class="px-4 py-1.5 text-center">
              <input
                v-model="perms[cls][bit.key]"
                type="checkbox"
                class="h-5 w-5 cursor-pointer rounded border-ink-300 text-accent accent-accent dark:border-ink-600"
                :aria-label="`${ui[cls]} — ${bit.key === 'r' ? ui.read : bit.key === 'w' ? ui.write : ui.execute}`"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Special bits -->
    <div class="mt-4">
      <div class="label">{{ ui.special }}</div>
      <div class="flex flex-wrap gap-4 text-sm">
        <label v-for="b in SPECIAL" :key="b.key" class="flex cursor-pointer items-center gap-2">
          <input
            v-model="special[b.key]"
            type="checkbox"
            class="h-4 w-4 cursor-pointer rounded border-ink-300 text-accent accent-accent dark:border-ink-600"
          >
          <span class="font-mono text-ink-700 dark:text-ink-200">{{ ui[b.key] }}</span>
          <span class="text-ink-400">({{ b.value }})</span>
        </label>
      </div>
    </div>

    <!-- Quick presets -->
    <div class="mt-4">
      <div class="label">{{ ui.presets }}</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in presets"
          :key="p.value"
          type="button"
          class="btn-ghost flex-col !items-start !gap-0 !py-1.5"
          @click="applyPreset(p.value)"
        >
          <span class="font-mono font-semibold">{{ p.value }}</span>
          <span class="text-xs text-ink-500 dark:text-ink-400">{{ p.label }}</span>
        </button>
        <button type="button" class="btn-ghost ml-auto" @click="reset">{{ ui.reset }}</button>
      </div>
    </div>

    <!-- Reverse: octal input drives the checkboxes -->
    <div class="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr]">
      <div>
        <label class="label" for="chmod-octal">{{ ui.octalInput }}</label>
        <input
          id="chmod-octal"
          v-model="octalDraft"
          class="field font-mono"
          inputmode="numeric"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          maxlength="4"
          :placeholder="ui.octalHint"
          :aria-label="ui.octalInput"
          @input="onOctalInput"
        >
        <p class="mt-1 min-h-[1.25rem] text-xs" :class="octalError ? 'text-red-600 dark:text-red-400' : 'text-ink-400'">
          {{ octalError || ui.octalHint }}
        </p>
      </div>
      <div>
        <label class="label" for="chmod-target">{{ ui.targetLabel }}</label>
        <input
          id="chmod-target"
          v-model="target"
          class="field font-mono"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          placeholder="file"
          :aria-label="ui.targetLabel"
        >
      </div>
    </div>

    <!-- Outputs -->
    <div class="mt-5 space-y-2">
      <!-- Octal -->
      <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <span class="w-44 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.octal }}</span>
        <input class="field font-mono" readonly :value="octal" :aria-label="ui.octal">
        <CopyButton :text="() => octal" small />
      </div>
      <!-- Symbolic -->
      <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <span class="w-44 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.symbolic }}</span>
        <input class="field font-mono" readonly :value="symbolic" :aria-label="ui.symbolic">
        <CopyButton :text="() => symbolic" small />
      </div>
      <!-- Command -->
      <div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
        <span class="w-44 shrink-0 text-sm font-medium text-ink-600 dark:text-ink-300">{{ ui.command }}</span>
        <input class="field font-mono" readonly :value="command" :aria-label="ui.command">
        <CopyButton :text="() => command" small />
      </div>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Калькулятор chmod: восьмеричные и символьные права</h2>
        <p>
          Этот бесплатный <strong>калькулятор chmod</strong> переводит права
          доступа Unix в обе стороны: отметьте чтение, запись и выполнение для
          владельца, группы и остальных — и сразу получите <strong>восьмеричную
          запись</strong> (например, 755), <strong>символьную запись</strong>
          (rwxr-xr-x) и готовую команду <code>chmod 755 file</code>. Можно
          действовать и наоборот — ввести восьмеричное число, и галочки обновятся
          автоматически.
        </p>
        <p>
          Всё работает <strong>полностью в браузере</strong>. Это обычная
          арифметика, и ничего из введённого не отправляется на сервер, поэтому
          инструмент безопасен для планирования прав на любых файлах и серверах.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Отмечайте галочки чтения, записи и выполнения для владельца, группы и остальных.</li>
          <li>Смотрите восьмеричную и символьную запись и команду <code>chmod</code> в реальном времени.</li>
          <li>Введите восьмеричное число (3 или 4 цифры 0–7) — галочки подстроятся под него.</li>
          <li>При необходимости включите специальные биты <code>setuid</code>, <code>setgid</code> или <code>sticky</code>.</li>
          <li>Используйте быстрые шаблоны 644, 755, 600 и 777 и копируйте нужный результат.</li>
        </ul>

        <h2>Специальные биты: setuid, setgid и sticky</h2>
        <p>
          Необязательная четвёртая цифра задаёт специальные биты:
          <code>setuid</code> (4) запускает файл с правами его владельца,
          <code>setgid</code> (2) — с правами группы или наследует группу для
          новых файлов в каталоге, а <code>sticky</code> (1) разрешает удалять
          файлы в общем каталоге только их владельцам. В символьной записи эти
          биты заменяют букву <code>x</code> на <code>s</code>/<code>S</code> или
          <code>t</code>/<code>T</code> — заглавная буква означает, что бит
          включён, а выполнение выключено.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Настраиваете доступ к сайту? Соберите файл паролей в
          <NuxtLink :to="localePath('/htpasswd-generator')">генераторе .htpasswd</NuxtLink>,
          поиграйте с разрядами в
          <NuxtLink :to="localePath('/number-base-converter')">конвертере систем счисления</NuxtLink>
          или посчитайте контрольную сумму в
          <NuxtLink :to="localePath('/hash-generator')">генераторе хешей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>Chmod calculator: octal and symbolic permissions</h2>
        <p>
          This free <strong>chmod calculator</strong> converts Unix file
          permissions both ways: tick read, write and execute for the owner,
          group and others and instantly get the <strong>octal notation</strong>
          (e.g. 755), the <strong>symbolic notation</strong> (rwxr-xr-x) and a
          ready-to-run <code>chmod 755 file</code> command. You can also go in
          reverse — type an octal number and the checkboxes update by themselves.
        </p>
        <p>
          Everything runs <strong>entirely in your browser</strong>. It is plain
          arithmetic and nothing you enter is sent to a server, so it is safe for
          planning permissions on any files and servers.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Tick the read, write and execute boxes for owner, group and others.</li>
          <li>Read the octal, symbolic notation and the <code>chmod</code> command in real time.</li>
          <li>Type an octal value (3 or 4 digits, 0–7) and the checkboxes follow it.</li>
          <li>Enable the <code>setuid</code>, <code>setgid</code> or <code>sticky</code> special bits when needed.</li>
          <li>Use the 644, 755, 600 and 777 quick presets and copy whichever output you need.</li>
        </ul>

        <h2>Special bits: setuid, setgid and sticky</h2>
        <p>
          The optional fourth digit sets the special bits: <code>setuid</code> (4)
          runs a file with its owner's privileges, <code>setgid</code> (2) runs it
          with the group's privileges or makes a directory inherit its group for
          new files, and the <code>sticky</code> bit (1) lets only file owners
          delete entries in a shared directory. In the symbolic notation these
          bits replace the <code>x</code> with <code>s</code>/<code>S</code> or
          <code>t</code>/<code>T</code> — an uppercase letter means the special
          bit is on while execute is off.
        </p>

        <h2>Related tools</h2>
        <p>
          Locking down a site? Build a password file with the
          <NuxtLink :to="localePath('/htpasswd-generator')">.htpasswd generator</NuxtLink>,
          play with bit values in the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>,
          or compute a checksum with the
          <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
