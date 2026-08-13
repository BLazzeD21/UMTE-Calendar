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
   instead of throwing.
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
`normalizeICS` strips `DTSTAMP`, `SEQUENCE`, `LAST-MODIFIED`, `CREATED`, and `URL;VALUE=URI` before diffing, so those
must not be treated as real changes. Every write is followed by `backup`, which rotates the group's previous
`backup/<groupId>/ActualCalendar.ics` into `backup/<groupId>/Calendar <date>.ics`.

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

`.env` (gitignored, template in `.env.template`): `TELEGRAM_BOT_TOKEN`, `CALENDAR_BASE_URL` and `PROXY_URL`
(`socks5://user:pass@host:port`) are optional and shared by all groups. `UMTE_USERNAME`, `UMTE_PASSWORD`, `CHAT_ID`,
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
