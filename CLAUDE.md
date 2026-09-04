# CLAUDE.md

Node/TypeScript service that scrapes UMTE (umeos.ru) student schedules with Playwright, renders each one into
`calendar/<groupId>.ics`, and notifies a Telegram chat when a schedule changes. It tracks **many groups**, one umeos.ru
account per group, configured in `groups.json`. Runs long-lived under PM2 on a VPS; nginx serves the `.ics` files (see
`README.md`).

## Commands

| Command                              | Notes                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `npm run build`                      | `tsc` → `build/`, then `tsc-alias` rewrites `@/` paths. Required before running.    |
| `npm run dev`                        | build + `NODE_ENV=development node build/index.js` (adds timestamps to log output). |
| `npm run start`                      | build + `pm2 start build/index.js --name UMTE-schedule -i 1`.                       |
| `npm run stop` / `reload` / `delete` | PM2 process control.                                                                |
| `npm run type`                       | `tsc --noEmit`.                                                                     |
| `npm run lint`                       | `eslint --fix`.                                                                     |
| `npm run prettier`                   | Format everything.                                                                  |
| `npm run patch`/`minor`/`major`      | Version bump, commit message `version: %s`.                                         |

There are no tests. The husky `pre-commit` hook runs `npm run type` then `lint-staged` (eslint + prettier on staged
files) — keep `tsc --noEmit` clean.

Playwright needs browsers installed: `npx playwright install`.

## Runtime flow (`src/index.ts`)

1. `loadGroups` reads `groups.json` into `GroupConfig[]`, skipping (and logging) invalid entries. If the file is absent
   it falls back to a single group with id `calendar` built from `UMTE_USERNAME` / `UMTE_PASSWORD` / `CHAT_ID` /
   `TOPIC_ID`, for backwards compatibility. No valid groups → exit early.
2. If `TELEGRAM_BOT_TOKEN` is set _and_ at least one group has a `chatId`, validate `PROXY_URL` via `validateSocksProxy`
   (a failing proxy degrades to a direct connection rather than aborting) and start the bot. Otherwise `bot` stays
   `null` and the pipeline runs notification-free — every downstream function must tolerate `bot === null`.
3. `runGroups` iterates groups **sequentially**, each inside its own `try/catch` — one group's failure must never abort
   the rest of the cycle or kill the process.
4. Per group, `parseSchedule` launches a browser with a fresh `BrowserContext` (sessions must not leak between
   accounts), logs into umeos.ru and scrapes the schedule table into `ScheduleEntry[]`. It returns `[]` on any error
   instead of throwing. A failed login is detected by reading `#loginerrormessage` when the redirect to `/my/` never
   happens — otherwise wrong credentials surface only as an opaque navigation timeout.

   The schedule itself is **not** taken from the rendered page. The `umerasp` block fills `#sched` from a click handler
   in `rasper_0.17.js`, which needs the `jQuery` global that Moodle's `jquery-private.js` deletes with
   `noConflict(true)`; the two load in a race, so the block silently fails to bind and `#sched_tabs` never appears.
   Instead `parseSchedule` POSTs `type=group` + the `#groupselect` value to
   `/blocks/umerasp/json_rasper.php` — the endpoint that handler would have called — and injects the returned HTML into
   `#sched`. `page.request` shares the context's cookies, so the session from the login step carries over. The markup is
   the same one the button produces (the group schedule gets no `rowspanizer` pass), which is why the row parsing below
   it is unchanged. Do not "fix" this by clicking `#groupsubmit`: the click works only when jQuery happens to win.

5. If `calendar/<groupId>.ics` exists → `updateCalendar`, else `createCalendar` (only on the first pass;
   scheduled passes skip a group whose calendar is missing).
6. After a one-hour delay (`CONFIG.schedulerDelay`), `node-schedule` runs the cycle every hour
   (`CONFIG.schedulerRule`).

Everything downstream of `runGroup` takes a `GroupContext` (`{ group, paths, log }`): `paths` comes from
`getGroupPaths(group.id)` and `log` from `createGroupLogger(group.name)`, which prefixes every line with `[<name>]` so
interleaved per-group logs stay readable. Never log a per-group message through the bare `logger`.

`updateCalendar` rebuilds the calendar as _past events preserved from the existing ics_ + _future events from the fresh
scrape_ (`getOldEvents` / `getNewEvents`, split at today 00:00), compares against the content already read by
`runGroup` with `hasICSChanges`, and only writes + notifies when something actually differs. The write and its backup
happen **before** the Telegram notification, so users are never told about a change that failed to land. Comparison
ignores volatile ics fields —
`normalizeICS` **unfolds RFC 5545 line folding first** and only then strips `DTSTAMP`, `SEQUENCE`, `LAST-MODIFIED` and
`CREATED`, so those must not be treated as real changes. The unfolding step is load-bearing: values longer than 75
octets are folded onto a continuation line, and stripping line by line would leave that tail behind, so a changed
webinar link would read as a change in a property that is supposed to be ignored.

`URL;VALUE=URI` is **not** volatile — a changed webinar link is a real change: it is compared, it triggers a write, and
`formatDiffForUser` renders it as its own line (`lexicon.webinarLink`, a link rather than two unreadable URLs) instead
of the generic `old → new`. `getCurrentCalendarEvents` therefore flattens node-ical's `{ params, val }` url object into
a plain string — comparing the raw objects would report every url-bearing event as changed on every cycle. As a guard,
the notification is skipped when `formatDiffForUser` comes back empty: a difference that no user-facing field explains
must never produce a "schedule changed" message with nothing in it. Every write is followed by `backup`, which rotates
the group's previous `backup/<groupId>/ActualCalendar.ics` into `backup/<groupId>/Calendar <date>.ics`.

`cleanupBackups` deletes rotated `.ics` files older than `CONFIG.backupRetentionDays`. It runs on its own
`node-schedule` job (`CONFIG.cleanupRule`, monthly) rather than inside the hourly pipeline — it is housekeeping, not
part of producing a calendar, and must not cost a `readdir` + `stat` sweep every hour. There is no run at startup, so
the first sweep on a fresh deploy happens on the 1st.

Two invariants: `ActualCalendar.ics` is the live copy and is never a candidate, and **the newest rotated backup always
survives regardless of age** — a group whose schedule went quiet for a year must not end up with zero history. Files
are selected by **mtime, not by the date in the file name**: names are not a reliable clock and legacy backups were
written with a Cyrillic `С`. Cleanup failures are logged and swallowed; a missing directory is ignored silently.

Event identity is the UID built in `prepareEventData`: `${classNumber}-${subject.name}-${YYYY}${M}${D}@umte1`. The
added/removed/changed diff in `compareCalendarsJSON` keys entirely off it — changing the UID format invalidates all
existing calendars and would surface as a mass remove+add notification.

## Bot commands

`/start` and `/help` are public; `/help` prints the command list and, for the admin, the admin section on top of it.
The menu Telegram suggests is set in `registerCommands` **per scope**, not globally: `all_private_chats` and
`all_group_chats` get the public pair, and the admin's own chat (`{ type: "chat", chat_id }`) additionally gets
`/test` and `/send`, so nobody else is even offered them. Registering the admin scope fails when the admin has never
opened a chat with the bot — that is caught separately so the public menu still lands. Telegram keeps a chat scope
until it is overwritten, so clearing `TELEGRAM_ADMIN_ID` leaves the old admin's menu showing commands the handlers
now refuse.

## Admin commands

The bot answers two more commands, both gated on `TELEGRAM_ADMIN_ID` (`getAdminId`, digits only): `/test`
sends a fixed test message to every group that has a `chatId`, and `/send <text>` asks which chat to send `<text>` to
via an inline keyboard, then delivers it. Both report per-group delivery back to the admin.

Unset `TELEGRAM_ADMIN_ID` means **there is no admin** — `isAdmin` returns false for everyone and both commands answer
with the ordinary `replyMessage`, so they are invisible to regular users rather than refused. Never gate them on
anything else (a chat id, a username): the numeric user id is the only check.

The chosen text lives in a single `pendingMessage` field between the command and the button press, which is correct
only because there is exactly one admin — a second admin would need a per-user map. Callback data is
`send:<group id>`, plus `send:*` (all chats) and `send:!` (cancel); `*` and `!` are outside `groupIdPattern`, so they
can never collide with a real group. Admin text is sent with `parse_mode: HTML` like every other message, so a broken
tag fails the preview reply — that is caught in `askTarget` and reported instead of silently losing the message.

## Layout & conventions

```
src/
  index.ts      entry point + per-group runner + scheduler
  bot/          TelegramBot class (grammy, optional SOCKS proxy, 3 retries on send)
  config/       CONFIG constants, getGroupPaths, loadGroups, winston logger + createGroupLogger
  lexicon/      ALL user-facing and log strings
  scripts/      pipeline steps (parse, generate, create, update, backup)
  types/        shared interfaces
  utils/        pure helpers, grouped: events/ ics/ changes/ date/ proxy/
```

- **Imports go through barrels** (`@/config`, `@/scripts`, `@/utils`, `@/types`, `@/lexicon`, `@/bot`). A new file is
  not usable until it is re-exported from its directory's `index.ts`.
- **Import order is enforced by prettier** (`@trivago/prettier-plugin-sort-imports`): third-party, then `@/config`,
  `@/scripts`, `@/utils`, `@/types`, `@/lexicon`, `@/bot`, then relative — each group separated by a blank line. Write
  new imports in that order.
- **No string literals in logic.** Messages live in `src/lexicon/lexicon.ts`: Telegram text is Russian HTML
  (`parse_mode: "HTML"`), log strings under `lexicon.log` are English. Dynamic ones are functions.
- Logging is always the winston `logger` from `@/config` — never `console.*`. Errors also land in `logs/error.log`.
- Formatting: tabs, width 120, double quotes, trailing commas. `strict` is off in tsconfig, and `removeComments` is on.
- Path alias `@/*` → `src/*`, resolved at build time by `tsc-alias`; running raw `tsc` output without it breaks imports.

## Environment

`groups.json` (gitignored, template in `groups.template.json`) is the primary config: an array of groups, each with
`id` (required, `^[a-zA-Z0-9_-]+$`), `username`, `password` (both required), and optional `name`, `chatId`, `topicId`.

`id` is the single source of truth for everything named after a group — `calendar/<id>.ics`, `backup/<id>/`, and the
public subscription link. The link is **derived, never configured per group**: `getCalendarUrl` builds
`<CALENDAR_BASE_URL>/<id>.ics` from `.env`, tolerating a missing scheme and a trailing slash, and returns `undefined`
when the variable is unset (`lexicon.message` then omits the link). Don't reintroduce a per-group URL field — it would
let the link drift away from the file actually being written.

`.env` (gitignored, template in `.env.template`): `TELEGRAM_BOT_TOKEN`, `CALENDAR_BASE_URL`, `TELEGRAM_ADMIN_ID` and
`PROXY_URL` (`socks5://user:pass@host:port`) are optional and shared by all groups. `UMTE_USERNAME`, `UMTE_PASSWORD`, `CHAT_ID`,
`TOPIC_ID` are the legacy single-group fallback, read only when `groups.json` does not exist.

Never commit real credentials — the values in `.env.template` and `groups.template.json` are dummies.

`calendar/`, `backup/`, `logs/`, and `build/` are generated and gitignored; don't hand-edit them.

## Deployment

The supported deployment is `docker-compose.yml`: the `app` container (built from the Playwright base image, so the
browser and its system libraries come with it) plus `caddy`, which terminates TLS and serves the files. PM2 is only
used by the manual install documented in the second half of `README.md`.

The VPS sits in Russia, where `api.telegram.org` is blocked, so the bot reaches it through `TELEGRAM_API_ROOT`
(`getApiRoot` → grammy's `client.apiRoot`): a mirror of the Bot API — the Cloudflare Worker in `cloudflare/worker.js`
— reached over plain HTTPS, with nothing on the wire for DPI to classify. It is passed to grammy only when set,
because grammy spreads its defaults over the given options and an explicit `apiRoot: undefined` would erase the
default endpoint rather than fall back to it. The bot token travels in the request path, so the mirror must be an
endpoint the operator controls. `PROXY_URL` is an **alternative** to it, never a second layer. Only the bot uses
either — Playwright must keep scraping umeos.ru from the server's own Russian IP, so never route the whole container
out.

Caddy serves `calendar/` at the root and `backup/` under `/backup/` **as directories, read-only** — there are no
symlinks and no per-group web server config, which is what keeps `id` the single source of truth for the public link.
Adding a group must never require touching `Caddyfile`. Backups are intentionally public with directory browsing.

`DOMAIN` in `.env` drives Caddy's certificate and must stay in sync with `CALENDAR_BASE_URL`; certificates live in the
`caddy_data` volume and are renewed by Caddy itself.

`TZ` (default `Europe/Moscow`) is load-bearing, not cosmetic: `prepareEventData` builds `new Date(...)` in the
process's local time while `generatorCalendar` / `getUpdatedCalendar` declare `timezone: "Europe/Moscow"` in the ics.
A container running in UTC shifts every event by three hours, which surfaces as the entire schedule being reported as
changed. The Dockerfile pins the Playwright image tag to the `playwright` version in `package.json` — bump both
together, or the browsers in the image won't match the client.
