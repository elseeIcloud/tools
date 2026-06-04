<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { t, locale } = useI18n()
const localePath = useLocalePath()

// Fixed default input so SSR output matches client hydration (no clock/random).
// The whole calculation is pure 32-bit bitwise math evaluated in computeds.
const ipInput = ref('192.168.1.10')
const prefixInput = ref('24')

// --- 32-bit unsigned IPv4 helpers (RegExp + Math exist in the Node build env) ---

interface Parsed {
  ip: number // unsigned 32-bit network-order integer
  prefix: number // 0..32
}

// Parse either "a.b.c.d" or "a.b.c.d/NN". When a /NN is embedded in the IP
// field, it wins over the separate prefix select.
function parseIp(text: string): { octets: number[]; embeddedPrefix: number | null } | null {
  const trimmed = text.trim()
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(trimmed)
  if (!m) return null
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
  for (const o of octets) {
    if (o < 0 || o > 255) return null
  }
  let embeddedPrefix: number | null = null
  if (m[5] !== undefined) {
    const p = Number(m[5])
    if (p < 0 || p > 32) return null
    embeddedPrefix = p
  }
  return { octets, embeddedPrefix }
}

function octetsToInt(octets: number[]): number {
  // >>> 0 keeps the result an unsigned 32-bit integer.
  return ((octets[0]! << 24) | (octets[1]! << 16) | (octets[2]! << 8) | octets[3]!) >>> 0
}

function intToIp(n: number): string {
  const u = n >>> 0
  return [(u >>> 24) & 0xff, (u >>> 16) & 0xff, (u >>> 8) & 0xff, u & 0xff].join('.')
}

// Netmask for a prefix length, as an unsigned 32-bit integer.
// /0 is a special case because shifting by 32 is undefined in JS.
function prefixToMaskInt(prefix: number): number {
  if (prefix <= 0) return 0
  if (prefix >= 32) return 0xffffffff
  return (0xffffffff << (32 - prefix)) >>> 0
}

// --- Validation + the single derived result -------------------------------

type ErrorKind = 'ip' | 'prefix'

const result = computed<
  | { ok: true; data: SubnetData }
  | { ok: false; kind: ErrorKind }
  | null
>(() => {
  const parsed = parseIp(ipInput.value)
  if (!parsed) return { ok: false, kind: 'ip' }

  // Embedded /NN (if any) overrides the separate prefix field.
  const prefix = parsed.embeddedPrefix ?? Number(prefixInput.value)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return { ok: false, kind: 'prefix' }
  }

  const ipInt = octetsToInt(parsed.octets)
  const maskInt = prefixToMaskInt(prefix)
  const wildcardInt = (~maskInt) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0

  // Total addresses in the block. 2**32 overflows a 32-bit int, so compute
  // with Math.pow to keep it exact for /0.
  const totalAddresses = Math.pow(2, 32 - prefix)

  // Usable-host range, handling the /31 and /32 edge cases sensibly.
  let usableHosts: number
  let firstHost: string
  let lastHost: string
  if (prefix === 32) {
    // Single host: the address itself, no network/broadcast distinction.
    usableHosts = 1
    firstHost = intToIp(networkInt)
    lastHost = intToIp(networkInt)
  } else if (prefix === 31) {
    // RFC 3021 point-to-point link: both addresses are usable.
    usableHosts = 2
    firstHost = intToIp(networkInt)
    lastHost = intToIp(broadcastInt)
  } else {
    usableHosts = totalAddresses - 2
    firstHost = intToIp((networkInt + 1) >>> 0)
    lastHost = intToIp((broadcastInt - 1) >>> 0)
  }

  return {
    ok: true,
    data: {
      cidr: `${intToIp(networkInt)}/${prefix}`,
      prefix,
      network: intToIp(networkInt),
      broadcast: intToIp(broadcastInt),
      mask: intToIp(maskInt),
      wildcard: intToIp(wildcardInt),
      firstHost,
      lastHost,
      totalAddresses,
      usableHosts,
    },
  }
})

interface SubnetData {
  cidr: string
  prefix: number
  network: string
  broadcast: string
  mask: string
  wildcard: string
  firstHost: string
  lastHost: string
  totalAddresses: number
  usableHosts: number
}

const data = computed(() => (result.value?.ok ? result.value.data : null))
const errorKind = computed(() => (result.value && !result.value.ok ? result.value.kind : null))

// A /NN inside the IP field disables the separate select (it would be ignored).
const prefixLocked = computed(() => parseIp(ipInput.value)?.embeddedPrefix != null)

// Tool-specific labels (common verbs like Copy/Clear/Sample come from t()).
const ui = computed(() =>
  locale.value === 'ru'
    ? {
        address: 'IPv4-адрес',
        prefix: 'Префикс (CIDR)',
        addressAria: 'IPv4-адрес или a.b.c.d/NN',
        invalidIp: '✗ Некорректный IPv4-адрес (каждый октет 0–255, например 192.168.1.10)',
        invalidPrefix: '✗ Некорректный префикс (должен быть /0–/32)',
        valid: '✓ Подсеть рассчитана',
        startHint: 'Введите IPv4-адрес и выберите префикс, чтобы рассчитать подсеть.',
        cidr: 'CIDR',
        network: 'Адрес сети',
        broadcast: 'Broadcast',
        mask: 'Маска подсети',
        wildcard: 'Wildcard-маска',
        firstHost: 'Первый хост',
        lastHost: 'Последний хост',
        totalAddresses: 'Всего адресов',
        usableHosts: 'Доступно хостов',
        ptpNote: '/31 — канал точка-точка (RFC 3021): оба адреса используются как хосты.',
        singleNote: '/32 — один хост: сеть и broadcast совпадают с самим адресом.',
      }
    : {
        address: 'IPv4 address',
        prefix: 'Prefix (CIDR)',
        addressAria: 'IPv4 address or a.b.c.d/NN',
        invalidIp: '✗ Invalid IPv4 address (each octet 0–255, e.g. 192.168.1.10)',
        invalidPrefix: '✗ Invalid prefix (must be /0–/32)',
        valid: '✓ Subnet calculated',
        startHint: 'Enter an IPv4 address and pick a prefix to calculate the subnet.',
        cidr: 'CIDR',
        network: 'Network address',
        broadcast: 'Broadcast',
        mask: 'Subnet mask',
        wildcard: 'Wildcard mask',
        firstHost: 'First usable host',
        lastHost: 'Last usable host',
        totalAddresses: 'Total addresses',
        usableHosts: 'Usable hosts',
        ptpNote: '/31 is a point-to-point link (RFC 3021): both addresses are used as hosts.',
        singleNote: '/32 is a single host: network and broadcast equal the address itself.',
      },
)

// Rows for the result table. `mono` formats values in the code font; numeric
// rows (total/usable) are localized with toLocaleString and not copyable.
const rows = computed(() => {
  const d = data.value
  if (!d) return []
  return [
    { key: 'cidr', label: ui.value.cidr, value: d.cidr, copy: true },
    { key: 'network', label: ui.value.network, value: d.network, copy: true },
    { key: 'broadcast', label: ui.value.broadcast, value: d.broadcast, copy: true },
    { key: 'mask', label: ui.value.mask, value: d.mask, copy: true },
    { key: 'wildcard', label: ui.value.wildcard, value: d.wildcard, copy: true },
    { key: 'firstHost', label: ui.value.firstHost, value: d.firstHost, copy: true },
    { key: 'lastHost', label: ui.value.lastHost, value: d.lastHost, copy: true },
    { key: 'total', label: ui.value.totalAddresses, value: d.totalAddresses.toLocaleString(), copy: false },
    { key: 'usable', label: ui.value.usableHosts, value: d.usableHosts.toLocaleString(), copy: false },
  ]
})

// One-line summary, handy to copy as a whole.
const summary = computed(() => {
  const d = data.value
  if (!d) return ''
  return [
    `CIDR: ${d.cidr}`,
    `Network: ${d.network}`,
    `Broadcast: ${d.broadcast}`,
    `Mask: ${d.mask}`,
    `Wildcard: ${d.wildcard}`,
    `Host range: ${d.firstHost} - ${d.lastHost}`,
    `Total addresses: ${d.totalAddresses}`,
    `Usable hosts: ${d.usableHosts}`,
  ].join('\n')
})

function clear() {
  ipInput.value = ''
}

function loadSample() {
  ipInput.value = '10.0.0.1'
  prefixInput.value = '8'
}

const prefixOptions = Array.from({ length: 33 }, (_, i) => i)

const faqEn: FaqItem[] = [
  {
    q: 'Is my IP address sent to a server?',
    a: 'No. Every calculation — network, broadcast, mask, wildcard and the host range — is done entirely in your browser with 32-bit bitwise math in JavaScript. Nothing is uploaded, logged or stored, so it is safe to use with internal or private addressing plans.',
  },
  {
    q: 'How do I read a CIDR prefix like /24?',
    a: 'The prefix is the number of leading 1-bits in the subnet mask. /24 means the first 24 bits identify the network (255.255.255.0) and the remaining 8 bits address hosts, giving 256 total addresses and 254 usable hosts after reserving the network and broadcast addresses.',
  },
  {
    q: 'What is a wildcard mask?',
    a: 'A wildcard mask is the bitwise inverse of the subnet mask: where the mask has a 1, the wildcard has a 0, and vice versa. For /24 the mask is 255.255.255.0 and the wildcard is 0.0.0.255. Cisco ACLs and OSPF use wildcard masks to match a range of addresses.',
  },
  {
    q: 'Why do /31 and /32 not subtract two hosts?',
    a: 'For a normal subnet the first address is the network and the last is the broadcast, so the usable count is total minus two. A /32 describes a single host (one usable address), and a /31 is a point-to-point link defined by RFC 3021 where both addresses are usable, giving exactly two hosts.',
  },
  {
    q: 'Can I paste the CIDR in one field?',
    a: 'Yes. Type the address with the prefix attached, like 192.168.1.10/26, into the address field and the embedded /NN takes over the separate prefix selector. You can also leave the prefix off and choose it from the dropdown.',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Отправляется ли мой IP-адрес на сервер?',
    a: 'Нет. Все расчёты — сеть, broadcast, маска, wildcard и диапазон хостов — выполняются полностью в браузере 32-битной побитовой математикой на JavaScript. Ничего не загружается, не логируется и не сохраняется, поэтому инструмент безопасен для внутренних и приватных планов адресации.',
  },
  {
    q: 'Как читать префикс CIDR вроде /24?',
    a: 'Префикс — это число ведущих единичных бит в маске подсети. /24 означает, что первые 24 бита определяют сеть (255.255.255.0), а оставшиеся 8 бит адресуют хосты, что даёт 256 адресов всего и 254 доступных хоста после резервирования адреса сети и broadcast.',
  },
  {
    q: 'Что такое wildcard-маска?',
    a: 'Wildcard-маска — это побитовая инверсия маски подсети: где в маске стоит 1, в wildcard стоит 0, и наоборот. Для /24 маска равна 255.255.255.0, а wildcard — 0.0.0.255. ACL Cisco и OSPF используют wildcard-маски для сопоставления диапазона адресов.',
  },
  {
    q: 'Почему у /31 и /32 не вычитаются два хоста?',
    a: 'У обычной подсети первый адрес — это сеть, а последний — broadcast, поэтому число доступных хостов равно «всего минус два». /32 описывает один хост (один доступный адрес), а /31 — это канал точка-точка по RFC 3021, где используются оба адреса, что даёт ровно два хоста.',
  },
  {
    q: 'Можно ли вставить CIDR одним полем?',
    a: 'Да. Введите адрес вместе с префиксом, например 192.168.1.10/26, прямо в поле адреса — встроенный /NN перекроет отдельный селектор префикса. Префикс также можно не указывать и выбрать его из выпадающего списка.',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <ToolPage slug="ip-subnet-calculator" :faq="faq">
    <!-- Inputs -->
    <div class="flex flex-wrap items-end gap-4">
      <div class="min-w-[16rem] flex-1">
        <label class="label" for="ip-addr">{{ ui.address }}</label>
        <input
          id="ip-addr"
          v-model="ipInput"
          class="field"
          spellcheck="false"
          autocapitalize="off"
          autocomplete="off"
          inputmode="decimal"
          placeholder="192.168.1.10 / 192.168.1.10/24"
          :aria-label="ui.addressAria"
        >
      </div>

      <div class="w-40">
        <label class="label" for="ip-prefix">{{ ui.prefix }}</label>
        <select
          id="ip-prefix"
          v-model="prefixInput"
          class="field"
          :disabled="prefixLocked"
          :aria-label="ui.prefix"
        >
          <option v-for="p in prefixOptions" :key="p" :value="String(p)">/{{ p }}</option>
        </select>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="btn-ghost" @click="loadSample">{{ t('common.sample') }}</button>
        <button type="button" class="btn-ghost" @click="clear">{{ t('common.clear') }}</button>
      </div>
    </div>

    <!-- Status line -->
    <div class="mt-3 flex min-h-[1.5rem] flex-wrap items-center gap-2 text-sm">
      <template v-if="errorKind === 'ip'">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalidIp }}</span>
      </template>
      <template v-else-if="errorKind === 'prefix'">
        <span class="font-medium text-red-600 dark:text-red-400">{{ ui.invalidPrefix }}</span>
      </template>
      <template v-else-if="data">
        <span class="font-medium text-green-600 dark:text-green-400">{{ ui.valid }}</span>
        <span class="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200">{{ data.cidr }}</span>
      </template>
      <span v-else class="text-ink-400">{{ ui.startHint }}</span>
    </div>

    <!-- Results -->
    <div v-if="data" class="mt-5">
      <div class="mb-2 flex items-center justify-end">
        <CopyButton :text="() => summary" :label="t('common.copyAll')" small />
      </div>
      <div class="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-700">
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="(r, i) in rows"
              :key="r.key"
              :class="i % 2 ? 'bg-ink-50 dark:bg-ink-900' : 'bg-white dark:bg-ink-950'"
            >
              <td class="whitespace-nowrap px-3 py-2 font-medium text-ink-700 dark:text-ink-200">{{ r.label }}</td>
              <td class="w-full px-3 py-2 font-mono text-ink-600 dark:text-ink-300">{{ r.value }}</td>
              <td class="px-3 py-2 text-right">
                <CopyButton v-if="r.copy" :text="() => r.value" small />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="data.prefix === 31" class="mt-2 text-sm text-ink-500 dark:text-ink-400">{{ ui.ptpNote }}</p>
      <p v-else-if="data.prefix === 32" class="mt-2 text-sm text-ink-500 dark:text-ink-400">{{ ui.singleNote }}</p>
    </div>

    <!-- Long-form content (RU / EN) -->
    <template #content>
      <template v-if="locale === 'ru'">
        <h2>Калькулятор подсетей IPv4 онлайн</h2>
        <p>
          Этот бесплатный <strong>калькулятор подсетей</strong> по IPv4-адресу и
          префиксу <strong>CIDR</strong> мгновенно вычисляет адрес сети, broadcast,
          маску подсети, wildcard-маску, первый и последний доступный хост, общее
          число адресов и количество полезных хостов. Введите адрес и префикс
          отдельно или вставьте всё одной строкой в формате <code>a.b.c.d/NN</code> —
          инструмент сам разберёт CIDR. Сделан для сетевых инженеров, администраторов
          и разработчиков, которые планируют адресацию и пишут ACL или правила
          фаервола.
        </p>
        <p>
          Все вычисления выполняются <strong>полностью в браузере</strong> с помощью
          32-битной побитовой арифметики. IP-адрес не отправляется на сервер, поэтому
          инструмент безопасен для внутренних и приватных схем адресации.
        </p>

        <h2>Как пользоваться</h2>
        <ul>
          <li>Введите IPv4-адрес, например <code>192.168.1.10</code>, в поле адреса.</li>
          <li>Выберите префикс CIDR из списка (<code>/0</code>–<code>/32</code>) или впишите его прямо в поле как <code>192.168.1.10/24</code>.</li>
          <li>Если каждый октет в диапазоне 0–255, а префикс корректен, появляется таблица результатов.</li>
          <li>Нажмите <code>Копировать</code> рядом со строкой, чтобы взять отдельное значение, или <code>Копировать всё</code> для сводки.</li>
          <li>Используйте <code>Пример</code> для быстрого старта или <code>Очистить</code>, чтобы начать заново.</li>
        </ul>

        <h2>Что считает калькулятор</h2>
        <p>
          <strong>Маска подсети</strong> получается из префикса: <code>/24</code> — это
          24 ведущих единичных бита, то есть <code>255.255.255.0</code>.
          <strong>Адрес сети</strong> — это побитовое И адреса и маски, а
          <strong>broadcast</strong> — побитовое ИЛИ сети и wildcard-маски.
          <strong>Wildcard-маска</strong> — инверсия маски подсети. Для обычной сети
          первый адрес — это сеть, последний — broadcast, поэтому полезных хостов на
          два меньше общего числа адресов. Особые случаи: <code>/32</code> — один хост,
          а <code>/31</code> по RFC 3021 — канал точка-точка, где используются оба адреса.
        </p>

        <h2>Похожие инструменты</h2>
        <p>
          Нужна побитовая логика наглядно? Переведите адрес в двоичный вид в
          <NuxtLink :to="localePath('/number-base-converter')">конвертере систем счисления</NuxtLink>,
          сверьтесь со <NuxtLink :to="localePath('/http-status-codes')">справочником HTTP-кодов</NuxtLink>
          или посчитайте контрольную сумму в <NuxtLink :to="localePath('/hash-generator')">генераторе хешей</NuxtLink>.
        </p>
      </template>

      <template v-else>
        <h2>IPv4 subnet calculator online</h2>
        <p>
          This free <strong>subnet calculator</strong> takes an IPv4 address and a
          <strong>CIDR</strong> prefix and instantly computes the network address,
          broadcast address, subnet mask, wildcard mask, first and last usable host,
          total addresses and the number of usable hosts. Enter the address and prefix
          separately, or paste everything as one <code>a.b.c.d/NN</code> string and the
          tool parses the CIDR for you. It is built for network engineers, admins and
          developers planning addressing or writing ACLs and firewall rules.
        </p>
        <p>
          Every calculation runs <strong>entirely in your browser</strong> with 32-bit
          bitwise arithmetic. Your IP address is never sent to a server, so it is safe
          to use with internal and private addressing schemes.
        </p>

        <h2>How to use it</h2>
        <ul>
          <li>Type an IPv4 address, for example <code>192.168.1.10</code>, into the address field.</li>
          <li>Pick a CIDR prefix from the list (<code>/0</code>–<code>/32</code>) or write it inline as <code>192.168.1.10/24</code>.</li>
          <li>When every octet is 0–255 and the prefix is valid, the result table appears.</li>
          <li>Click <code>Copy</code> next to a row to grab a single value, or <code>Copy all</code> for the full summary.</li>
          <li>Use <code>Sample</code> for a quick start, or <code>Clear</code> to begin again.</li>
        </ul>

        <h2>What the calculator computes</h2>
        <p>
          The <strong>subnet mask</strong> comes from the prefix: <code>/24</code> is 24
          leading 1-bits, i.e. <code>255.255.255.0</code>. The <strong>network
          address</strong> is the bitwise AND of the address and the mask, and the
          <strong>broadcast</strong> is the bitwise OR of the network and the wildcard
          mask. The <strong>wildcard mask</strong> is the inverse of the subnet mask. For
          a normal subnet the first address is the network and the last is the broadcast,
          so usable hosts is total minus two. The edge cases: <code>/32</code> is a single
          host, and <code>/31</code> is a point-to-point link under RFC 3021 where both
          addresses are usable.
        </p>

        <h2>Related tools</h2>
        <p>
          Want to see the bitwise logic? Convert the address to binary in the
          <NuxtLink :to="localePath('/number-base-converter')">number base converter</NuxtLink>,
          check the <NuxtLink :to="localePath('/http-status-codes')">HTTP status code reference</NuxtLink>,
          or compute a checksum with the <NuxtLink :to="localePath('/hash-generator')">hash generator</NuxtLink>.
        </p>
      </template>
    </template>
  </ToolPage>
</template>
