<script setup lang="ts">
import type { FaqItem } from '~/composables/useToolSeo'

const { locale } = useI18n()
const localePath = useLocalePath()

const faqEn: FaqItem[] = [
  {
    q: 'What is the cron expression for "every 5 minutes"?',
    a: 'Use */5 * * * *. The */5 in the minute field means "every fifth minute" — it fires at :00, :05, :10 and so on. The four stars leave hour, day-of-month, month and day-of-week unrestricted, so it runs every hour of every day. Do not confuse it with 5 * * * *, which fires only once per hour, at minute 5.',
  },
  {
    q: 'What timezone does cron use?',
    a: 'Classic Unix cron runs in the server’s local timezone (the TZ of the cron daemon or the machine). If your server is on UTC, 0 9 * * * means 09:00 UTC, not 09:00 in your city. Many managed schedulers and CI systems default to UTC and let you set a timezone explicitly. When in doubt, convert your local time to the server’s zone before writing the schedule.',
  },
  {
    q: 'Is Sunday 0 or 7 in cron?',
    a: 'In the day-of-week field both 0 and 7 mean Sunday in most cron implementations (Vixie/cron and its derivatives). Monday is 1 and Saturday is 6. You can also use the names SUN through SAT. So 0 0 * * 0 and 0 0 * * 7 both run at midnight every Sunday.',
  },
  {
    q: 'How do I schedule a job only on weekdays (Mon–Fri)?',
    a: 'Use a range in the day-of-week field: 0 9 * * 1-5 runs at 09:00 Monday through Friday. 1 is Monday and 5 is Friday. You could also write it with names as 0 9 * * MON-FRI on systems that support named days.',
  },
  {
    q: 'What is the difference between */5 and 5 in the minute field?',
    a: '5 is a single value — it matches only minute 5, so the job runs once per hour. */5 is a step — it matches 0, 5, 10, 15 … 55, so the job runs twelve times per hour. The slash means "every N", not "at minute N".',
  },
]

const faqRu: FaqItem[] = [
  {
    q: 'Какое cron-выражение для «каждые 5 минут»?',
    a: 'Пишите */5 * * * *. Запись */5 в поле минут означает «каждую пятую минуту» — запуск в :00, :05, :10 и так далее. Четыре звёздочки оставляют час, день, месяц и день недели без ограничений, поэтому задача выполняется круглосуточно. Не путайте с 5 * * * *, которое срабатывает лишь раз в час, на 5-й минуте.',
  },
  {
    q: 'В каком часовом поясе работает cron?',
    a: 'Классический Unix-cron работает в локальном часовом поясе сервера (TZ демона cron или машины). Если сервер в UTC, то 0 9 * * * — это 09:00 по UTC, а не по вашему городу. Многие облачные планировщики и CI по умолчанию используют UTC, но позволяют задать часовой пояс явно. Если сомневаетесь — переведите своё локальное время в пояс сервера перед написанием расписания.',
  },
  {
    q: 'Воскресенье в cron — это 0 или 7?',
    a: 'В поле дня недели и 0, и 7 означают воскресенье в большинстве реализаций (Vixie cron и производные). Понедельник — 1, суббота — 6. Можно использовать и имена от SUN до SAT. Так что 0 0 * * 0 и 0 0 * * 7 оба запускают задачу в полночь каждое воскресенье.',
  },
  {
    q: 'Как запускать задачу только по будням (Пн–Пт)?',
    a: 'Используйте диапазон в поле дня недели: 0 9 * * 1-5 запускает задачу в 09:00 с понедельника по пятницу. 1 — понедельник, 5 — пятница. На системах с поддержкой имён можно написать и 0 9 * * MON-FRI.',
  },
  {
    q: 'В чём разница между */5 и 5 в поле минут?',
    a: '5 — это одно значение: совпадает только с 5-й минутой, то есть задача выполняется раз в час. */5 — это шаг: совпадает с 0, 5, 10, 15 … 55, то есть двенадцать раз в час. Косая черта означает «каждые N», а не «на минуте N».',
  },
]

const faq = computed(() => (locale.value === 'ru' ? faqRu : faqEn))
</script>

<template>
  <GuidePage slug="cron-expressions-explained" :faq="faq">
    <template v-if="locale === 'ru'">
      <p>
        <strong>Cron</strong> — это планировщик задач по расписанию. Классический Unix-cron
        читает таблицу <code>crontab</code> и запускает команды в указанное время. Тот же
        синтаксис вы встретите далеко за пределами Linux: в CI/CD (GitHub Actions, GitLab CI),
        в Kubernetes (<code>CronJob</code>), в облачных планировщиках и в библиотеках вроде
        Quartz или Spring <code>@Scheduled</code>. Поэтому уметь читать cron-выражение —
        базовый навык для любого разработчика.
      </p>

      <h2>Пять полей</h2>
      <p>
        Классическое cron-выражение — это <strong>пять полей</strong>, разделённых пробелами.
        Порядок строго фиксирован:
      </p>
      <pre><code>┌───────────── минута        (0–59)
│ ┌─────────── час           (0–23)
│ │ ┌───────── день месяца   (1–31)
│ │ │ ┌─────── месяц         (1–12)
│ │ │ │ ┌───── день недели   (0–6, 0 и 7 = воскресенье)
│ │ │ │ │
* * * * *</code></pre>
      <ul>
        <li><strong>Минута</strong> — от 0 до 59.</li>
        <li><strong>Час</strong> — от 0 до 23 (24-часовой формат).</li>
        <li><strong>День месяца</strong> — от 1 до 31.</li>
        <li><strong>Месяц</strong> — от 1 до 12; допустимы имена <code>JAN</code>–<code>DEC</code>.</li>
        <li><strong>День недели</strong> — от 0 до 6, где и 0, и 7 означают воскресенье; допустимы имена <code>SUN</code>–<code>SAT</code>.</li>
      </ul>
      <p>
        Некоторые системы добавляют дополнительные поля. Quartz и Spring ставят
        <em>секунды</em> первым полем (получается шесть полей), а ряд реализаций добавляет
        необязательный <em>год</em> в конце. Но «по умолчанию» cron — это именно пять полей,
        и в большинстве crontab вы увидите их.
      </p>

      <h2>Спецсимволы</h2>
      <p>
        В любом поле вместо одного числа можно использовать специальные символы:
      </p>
      <ul>
        <li><code>*</code> — <strong>любое</strong> значение («каждую минуту», «каждый день» и т. д.).</li>
        <li><code>,</code> — <strong>список</strong>: <code>0,15,30,45</code> — на 0, 15, 30 и 45-й минутах.</li>
        <li><code>-</code> — <strong>диапазон</strong>: <code>1-5</code> в дне недели — с понедельника по пятницу.</li>
        <li><code>/</code> — <strong>шаг</strong>: <code>*/15</code> — каждые 15 единиц; можно совмещать с диапазоном: <code>0-30/10</code>.</li>
      </ul>
      <p>
        Символы <code>?</code>, <code>L</code> и <code>#</code> — это расширения
        <strong>Quartz/Spring</strong>, а не классического Unix-cron. Например, <code>L</code>
        в дне месяца — «последний день месяца», а <code>5#3</code> в дне недели — «третий
        четверг месяца». На обычном Linux-cron они не работают, поэтому не копируйте их в
        системный crontab.
      </p>

      <h2>Готовые примеры</h2>
      <p>Самые частые расписания — можно копировать как есть:</p>
      <pre><code>*/5 * * * *     # каждые 5 минут
0 * * * *       # в начале каждого часа (на 0-й минуте)
0 0 * * *       # ежедневно в полночь
0 9 * * 1-5     # в 09:00 по будням (Пн–Пт)
30 8 1 * *      # в 08:30 первого числа каждого месяца
0 0 * * 0       # еженедельно, в полночь воскресенья</code></pre>
      <p>
        Не уверены, что выражение делает то, что нужно? Соберите и проверьте его в
        <NuxtLink :to="localePath('/cron-generator')">генераторе cron</NuxtLink> — он покажет
        ближайшие запуски на человеческом языке.
      </p>

      <h2>Подводные камни</h2>
      <h3>День месяца и день недели объединяются по ИЛИ</h3>
      <p>
        Это самая частая ошибка. Если ограничены <strong>оба</strong> поля — день месяца и
        день недели, — cron запускает задачу, когда совпадает <em>хотя бы одно</em> из них,
        а не оба сразу. Например, <code>0 0 13 * 5</code> сработает <strong>каждое</strong>
        13-е число <em>и</em> <strong>каждую</strong> пятницу, а вовсе не «в пятницу 13-го».
        Чтобы получить «пятницу 13-го», обычной cron-синтаксис не подходит — нужна проверка
        внутри самой задачи.
      </p>
      <h3>Cron работает в часовом поясе сервера</h3>
      <p>
        Выражение <code>0 9 * * *</code> запустит задачу в 09:00 <em>по времени сервера</em>.
        Если сервер в UTC, а вы в Москве, это будет 12:00 по вашему времени. Перед написанием
        расписания переведите своё локальное время в пояс сервера
        <NuxtLink :to="localePath('/timezone-converter')">конвертером часовых поясов</NuxtLink>,
        а ближайшие даты запуска удобно проверять
        <NuxtLink :to="localePath('/unix-timestamp-converter')">конвертером Unix timestamp</NuxtLink>.
      </p>
      <h3>*/5 — это не то же самое, что 5</h3>
      <p>
        <code>5</code> в поле минут — одно значение: запуск раз в час, на 5-й минуте.
        <code>*/5</code> — это шаг: запуск каждые 5 минут (0, 5, 10 … 55). Косая черта всегда
        означает «каждые N», и эта разница меняет частоту в двенадцать раз.
      </p>
      <p>
        Когда сомневаетесь в любом из полей, не угадывайте — вставьте выражение в
        <NuxtLink :to="localePath('/cron-generator')">генератор cron</NuxtLink> и прочитайте
        его расшифровку. Если вам интересны и другие практические темы, посмотрите гайд
        <NuxtLink :to="localePath('/guides/uuid-v4-vs-v7')">«UUID v4 vs v7»</NuxtLink>.
      </p>
    </template>

    <template v-else>
      <p>
        <strong>Cron</strong> is a time-based job scheduler. Classic Unix cron reads a
        <code>crontab</code> table and runs commands at the times you specify. You will meet
        the same syntax far beyond Linux: in CI/CD (GitHub Actions, GitLab CI), in Kubernetes
        (<code>CronJob</code>), in cloud schedulers, and in libraries like Quartz or Spring
        <code>@Scheduled</code>. Reading a cron expression is therefore a basic skill for any
        developer.
      </p>

      <h2>The five fields</h2>
      <p>
        A classic cron expression is <strong>five fields</strong> separated by spaces, in a
        strict order:
      </p>
      <pre><code>┌───────────── minute        (0–59)
│ ┌─────────── hour          (0–23)
│ │ ┌───────── day of month  (1–31)
│ │ │ ┌─────── month         (1–12)
│ │ │ │ ┌───── day of week   (0–6, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *</code></pre>
      <ul>
        <li><strong>Minute</strong> — 0 to 59.</li>
        <li><strong>Hour</strong> — 0 to 23 (24-hour clock).</li>
        <li><strong>Day of month</strong> — 1 to 31.</li>
        <li><strong>Month</strong> — 1 to 12; the names <code>JAN</code>–<code>DEC</code> are allowed.</li>
        <li><strong>Day of week</strong> — 0 to 6, where both 0 and 7 mean Sunday; the names <code>SUN</code>–<code>SAT</code> are allowed.</li>
      </ul>
      <p>
        Some systems add extra fields. Quartz and Spring put <em>seconds</em> first (six
        fields in total), and a few implementations add an optional <em>year</em> at the end.
        But the default cron is five fields, and that is what you will see in most crontabs.
      </p>

      <h2>Special characters</h2>
      <p>
        In any field you can use special characters instead of a single number:
      </p>
      <ul>
        <li><code>*</code> — <strong>any</strong> value ("every minute", "every day", and so on).</li>
        <li><code>,</code> — a <strong>list</strong>: <code>0,15,30,45</code> fires at minutes 0, 15, 30 and 45.</li>
        <li><code>-</code> — a <strong>range</strong>: <code>1-5</code> in day-of-week means Monday through Friday.</li>
        <li><code>/</code> — a <strong>step</strong>: <code>*/15</code> means every 15 units; you can combine it with a range, e.g. <code>0-30/10</code>.</li>
      </ul>
      <p>
        The characters <code>?</code>, <code>L</code> and <code>#</code> are
        <strong>Quartz/Spring</strong> extensions, not classic Unix cron. For example,
        <code>L</code> in day-of-month means "the last day of the month", and <code>5#3</code>
        in day-of-week means "the third Thursday of the month". They do not work in ordinary
        Linux cron, so do not copy them into a system crontab.
      </p>

      <h2>Ready-to-copy examples</h2>
      <p>The most common schedules — copy them as is:</p>
      <pre><code>*/5 * * * *     # every 5 minutes
0 * * * *       # at the top of every hour (minute 0)
0 0 * * *       # daily at midnight
0 9 * * 1-5     # 09:00 on weekdays (Mon–Fri)
30 8 1 * *      # 08:30 on the 1st of every month
0 0 * * 0       # weekly, midnight on Sunday</code></pre>
      <p>
        Not sure an expression does what you want? Build and check it in the
        <NuxtLink :to="localePath('/cron-generator')">cron generator</NuxtLink> — it shows the
        next run times in plain language.
      </p>

      <h2>Gotchas</h2>
      <h3>Day-of-month and day-of-week are combined with OR</h3>
      <p>
        This is the classic mistake. When <strong>both</strong> the day-of-month and the
        day-of-week fields are restricted, cron runs the job when <em>either</em> one matches,
        not both at once. For example, <code>0 0 13 * 5</code> fires on <strong>every</strong>
        13th of the month <em>and</em> on <strong>every</strong> Friday — it does not mean
        "Friday the 13th". To get a true "Friday the 13th", plain cron syntax is not enough;
        you need a check inside the job itself.
      </p>
      <h3>Cron runs in the server's timezone</h3>
      <p>
        The expression <code>0 9 * * *</code> runs the job at 09:00 <em>server time</em>. If
        the server is on UTC and you are in New York, that is 04:00 or 05:00 your time
        depending on daylight saving. Convert your local time into the server's zone with the
        <NuxtLink :to="localePath('/timezone-converter')">timezone converter</NuxtLink> before
        writing the schedule, and check the next run dates with the
        <NuxtLink :to="localePath('/unix-timestamp-converter')">Unix timestamp converter</NuxtLink>.
      </p>
      <h3>*/5 is not the same as 5</h3>
      <p>
        <code>5</code> in the minute field is a single value: it runs once per hour, at minute
        5. <code>*/5</code> is a step: it runs every 5 minutes (0, 5, 10 … 55). The slash
        always means "every N", and this distinction changes the frequency twelvefold.
      </p>
      <p>
        Whenever you are unsure about any field, do not guess — paste the expression into the
        <NuxtLink :to="localePath('/cron-generator')">cron generator</NuxtLink> and read its
        explanation. If you enjoy practical deep-dives, see the
        <NuxtLink :to="localePath('/guides/uuid-v4-vs-v7')">"UUID v4 vs v7"</NuxtLink> guide.
      </p>
    </template>
  </GuidePage>
</template>
