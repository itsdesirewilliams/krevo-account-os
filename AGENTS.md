# Krevo Account OS — Agent Guide & Project Plan

**Read this file first.** It is the single source of truth for what this project is, how it is
structured, what is broken, and the plan for where it is going. Any agent working in this repo
must follow the Enforcement Rules at the bottom.

---

## 1. What this project is

**Krevo Account OS** is a single-user, internal business-operations app for a social/creative
agency. It tracks four things:

| Domain | Where it lives today (after Phase 5) |
|---|---|
| **Projects** | Accounts → project ledger → **project workspace** (identity, status pipeline, quoted/paid/balance, tasks, payments, deliverables, plan) |
| **Teams** | Team roster + member workspace (jobs, SOP files, open work); weekly work + value views |
| **Money** | Finance workspace: money line + month/year/expenses/plans **ledgers** (booked vs collected, costs, expenses) |
| **Tasks** | Unified `features/tasks` store — assignee, due date, status, priority, links to project/job/sheet; Tasks **execution queue** (Overdue/Today/Upcoming/No date) + Overview briefing |

Supporting modules: **Plans** (persisted pricing plans, seeded into quoted amounts).
**Prospecting and Content were removed in Phase 5** — the product is a focused business OS
(operate accounts, projects, tasks, team and money), not a CRM/CMS.

**Locked-in product decisions** (made with the owner):
- **Desktop-only.** The shipping form is a Tauri desktop executable. The Vite browser app remains
  the development/test environment. Hosted web deployment (Vercel) is **not** a target.
- **Money depth**: payments per project (advance/balance, paid/pending), one-off + recurring
  expenses in Finance, monthly AND yearly reports, per-account profitability. Currency is INR.
- **Unified tasks**: one task model with assignee (team member), due date, status, priority,
  links to project/job/sheet; plus the Tasks queue and the Overview briefing.
- **Single user, no auth.** Projects carry a status pipeline
  (`lead | confirmed | delivered | on_hold | cancelled`); Finance excludes unconfirmed deals
  from booked revenue by default.
- **Weekly team work + value tracking** (see §5): derived entirely from unified tasks — no
  work-log, no timesheet, no hours, no new entities. Revenue is shown as project context only,
  never attributed to an individual member.
- **One design system, two interface faces** (see §8): dark-only "Krevo Midnight" with acid lime
  as a **signal**, switchable Geist/Bricolage typographic personality, persisted in Settings.

---

## 2. Tech stack & commands

React 18 · TypeScript (strict, `noUncheckedIndexedAccess`) · Vite 6 · Tailwind CSS v4 · GSAP ·
**vitest** for tests · **Tauri 2** (desktop shell: SQLite key/value storage, fs blobs, updater) ·
**Geist Sans / Geist Mono** + **Bricolage Grotesque Variable** (bundled locally) ·
**Tabler Icons** (MIT). The browser build remains the development/test environment; the shipping
form is the Tauri desktop executable.

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (browser build) |
| `npm run build` | `tsc -b && vite build` (typecheck + production bundle to `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm test` | `vitest run` — the full suite (CI gate) |
| `npm run test:watch` | vitest in watch mode |
| `npm run typecheck` | `tsc -b` only |
| `npm run tauri:dev` | Desktop dev window (requires the Rust toolchain) |
| `npm run tauri:build` | Windows installer + updater artifacts (`createUpdaterArtifacts`) |

---

## 3. File map (current state)

```
src/
  main.tsx                    Entry; loads accounts state + one-time legacy-task migration,
                              mounts providers, imports bundled fonts
  App.tsx                     Shell: sidebar, WorkspaceHeader, storage banner, section switch,
                              first-run Overview, command palette hosts; face + title effects
  types.ts                    Core model V4: Account, Sheet (Overview|Custom), Block (union),
                              Project (status/quotedAmount/payments), Payment, Trash, money helpers.
                              Tasks live in features/tasks, not here.
  storage/index.ts            StorageDriver (load/save/flush + blobs) + BrowserStorageDriver +
                              onStorageError; blobs.ts (IndexedDB); tauri.ts (SQLite kv + fs);
                              migrate.ts (pure localStorage→SQLite)
  state/
    store.tsx                 DOMAIN store (accounts + trash) with separate state/actions
                              contexts; update() → structuredClone → normalize → debounced save
    ui.tsx                    UI context: dialogs, context menu, command palette open state
    nav.tsx                   Navigation slice (see §8): section, account/project/sheet context,
                              trash view, pins, recents, session history for Back
    persist.ts                usePersistentState (+ ready) and useFlushOnExit
    flush.ts                  Exit-flush registry (flushAll) awaited by the Tauri close handler
    normalize.ts              Domain-only normalization + V2→V3 migration (accounts + trash)
  app/
    AppSidebar.tsx            Persistent nav: Overview/Tasks/Team/Finance + curated Accounts
                              (Pinned + Recent) + Trash/Settings footer
    WorkspaceHeader.tsx       Breadcrumbs, intelligent Back, version chip, palette entry
    CommandPalette.tsx        Ctrl/Cmd+K universal navigation layer (navigate/accounts/projects/faces)
    paletteSearch.ts          Pure ranking + grouping for the palette (+ tests)
    navigation.ts             Section ids, labels, NavData contract
  lib/
    id.ts                     genId → crypto.randomUUID()
    dates.ts                  formatDate · nowIso · todayLocalIso · dueLabel · shortDate · isOverdue
    currency.ts               formatINR · parseAmount (strict)
    useEscapeLayer.ts         Stacked Escape handling (topmost overlay only)
  components/
    TrashView · ContextMenu · Icons · StorageBanner
    ui/Empty (knight states) · ui/Money (single money renderer) · ui/MonthBars ·
       ui/TaskItem (TaskItem + TaskInput, the single task row everywhere)
    modals/Modal (single modal impl) · modals/ModalHost (prompt/confirm/new account/sheet)
      modals/NewProjectDialog (creation only; editing lives in the project workspace)
  features/
    accounts/                 AccountsIndex (roster table) · AccountWorkspace (identity + money +
                              Projects/Sheets surfaces) · ProjectsTable · ProjectWorkspace ·
                              SheetWorkspace
    tasks/                    tasks.types · tasks.repository (pure CRUD/cascades/selectors) ·
                              tasksState · taskContext (labels + Open cross-links) · TasksView
    team/                     team.types · team.repository (pure) · teamState · teamValue.service
                              (pure weekly value) · TeamView · MemberDetail (jobs + SOP) ·
                              MemberForm · MemberWeeklyPanel · TeamWeeklyBoard · WeekNav
    finance/                  finance.types · finance.repository (expenses) · financeState ·
                              finance.service (pure: booked/collected/rows/expenses/year) ·
                              FinanceView · MonthPanel (ledger) · YearPanel · ExpensesPanel · PlansPanel
    plans/                    plans.types · plans.repository · plansState
    home/                     components/HomeView (Overview briefing)
    settings/                 settings.types (interfaceFace) · settings.repository · settingsState ·
                              updater.ts (Tauri facade) · components/SettingsView
  test-utils/assert.ts        Test-only `first()` / `present()` narrowing helpers
tests                         Co-located as src/**/*.test.ts (vitest)
vitest.config.ts
src-tauri/                    Tauri 2 desktop shell · src/lib.rs = updater commands + exit flush;
                              app-icon.svg (source; regenerate with
                              `npx tauri icon src-tauri/app-icon.svg`)
legacy/                       Old vanilla-JS app, REFERENCE ONLY — nothing imports it
```

**Architecture contract** — every feature follows this shape:
`*.types.ts` (pure data) · `*.repository.ts` (pure, immutable logic, deep normalize on load) ·
`*State.tsx` (context + `usePersistentState`) · `components/` (views only, no persistence).
Feature state files expose a `ready` flag from `usePersistentState` for load-gated UI.

---

## 4. Remediation status — Phase 0 (complete)

All findings from the 2026-09-17 review are resolved:

- **C1/C2** Tauri driver + dead Tauri deps removed; browser driver is the only implementation and
  every failure surfaces via `onStorageError` → `StorageBanner`. No silent save/load failure.
- **H1** `SocialAccountDetail` keyed by social-account id.
- **H2** Strict `parseAmount()` (strip separators, first number only, stop at range). No raw
  `parseFloat` on user input anywhere.
- **H3** Dirty flush on `pagehide`/`visibilitychange` via `useFlushOnExit`.
- **M1** `usePersistentState` no longer clobbers edits made before load resolves; exposes `ready`.
- **M2** Trash sheets deep-normalized; `restoreSheet` only removes the entry once the target
  account is found.
- **M3** `overviewOf` returns honestly; `normalizeAccount` guarantees an Overview sheet exists.
- **M4** Text fields commit on blur; store split into state + actions contexts.
- **M5/M6/M7/M8** Modal reset on open, keyed dynamic views, stacked-Escape layer, `todayLocalIso`.
- **L-items** dead exports/CSS removed; `crypto.randomUUID()`; no `as never`/double casts;
  `noUncheckedIndexedAccess` on; bundled fonts + CSP (no network on startup); context-menu
  clamping + "No Color" filter; unified `Modal`; shared `TaskRow`/`TaskInput`.

**Residual limitations (intentional):**
- `structuredClone` + `normalize` still runs per mutation (frequency is now low — blur commits).
- `legacy/` is reference-only and must stay unimported.

---

## 5. Weekly team work + value (locked requirement)

The owner needs to see, per team member and per week: what was worked on, assigned/completed
tasks, workload/output, and monthly cost — to judge value for money.

**Capture model: task-derived only.** The Phase 2 `TaskRecord` is the single source of truth. No
work-log, no timesheet, no hours/effort fields, no extra entities, no added manual reporting. If
work is not task-shaped, it does not appear in weekly output for now.

**Metrics (locked):** completed tasks · assigned tasks · completion rate · overdue/open backlog ·
tasks completed per day · weekly + monthly team cost · cost per completed task · project
contribution/context · output vs cost over multiple weeks. **No hours or cost-per-hour.**

**Definitions (locked):**
- **Completed (week)** = `completedAt` within the ISO week (Mon–Sun).
- **Assigned (week)** = `dueDate` in week, or `completedAt` in week.
- **Open backlog** = assigned tasks with `status !== "done"`; **Overdue** = backlog with
  `dueDate < today`.
- **Completion rate** = completed ÷ (completed + week-assigned still open); "—" if denominator 0.
- **Tasks/day** = completed ÷ 7 (elapsed days for the current week).
- **Weekly cost** = `monthlyCost × 12 / 52`; monthly cost shown alongside.

**Revenue is context only:** show the projects a member contributed to (via task links) and the
project's quoted/collected amounts as context. Never compute or display per-member revenue
("Geeta generated ₹X") — that would be false precision.

**Views (locked):** a per-member weekly view AND a team-wide weekly board (all members side by
side for the selected week), plus multi-week output-vs-cost trend.

Implemented as pure derivation (a `teamValue.service` following the `finance.service` pattern)
over Team + Tasks + Projects + Finance. No new data ownership.

---

## 6. The plan (5 phases)

Each phase ends with working software and green tests.

### Phase 0 — Remediation + test infrastructure ✅ COMPLETE
See §4. Test harness replaced with vitest; 44 tests across parsers, normalizers, repositories,
finance math, and the storage driver.

### Phase 1 — Money (schema V4) ✅ COMPLETE
- `Project` gains `status` (pipeline), `quotedAmount: number` (migrated from `charges` via
  `parseAmount`; `charges` kept read-only for display), `payments: Payment[]`
  (`{ id, amount, date, note? }`); derived `paid`, `balance`, collection status in `types.ts`.
- Finance owns a persisted slice: `expenses: Expense[]`
  (`{ id, date, label, category, amount, recurringMonthly? }`) with editable categories.
- `finance.service.ts`: booked (event-month) vs collected (payment-date) revenue; status filter
  (excludes `lead`/`cancelled`/`on_hold` by default, toggleable); yearly 12-month grid;
  per-account breakdown; expenses series; net.
- UI: payments panel + status chips in the project modal; quoted amount; status chips on
  Overview; Finance tabs Month / Year / Expenses / Plans.
- `plans/` is now a full feature slice (types + pure repository + state); plan price seeds
  `quotedAmount`; plans are editable in Finance → Plans.
- **Exit criteria met:** V3→V4 migration tested; all finance rollups unit-tested (66 tests).

### Phase 2 — Unified tasks + dashboards ✅ COMPLETE
- New `features/tasks/`: pure repository + `usePersistentState` slice.
  ```ts
  interface TaskRecord {
    id: string; title: string; notes?: string;
    status: "todo" | "in_progress" | "done";
    priority: "low" | "normal" | "high";
    dueDate: string | null;       // ISO yyyy-mm-dd
    assigneeId: string | null;    // team member id
    links: { accountId?: string; projectId?: string; jobId?: string; sheetId?: string; blockId?: string };
    createdAt: string; completedAt: string | null;
  }
  ```
  (`blockId` scopes tasks to a specific freeform to-do block.)
- Legacy tasks were migrated once at bootstrap (`extractLegacyTasks` reads raw persisted
  payloads): project tasks → `links.projectId`; job tasks → `links.jobId` +
  `assigneeId = job.teamMemberId`; sheet block/V2 sheet tasks → `links.sheetId`/`blockId`.
  Ids preserved; `completedAt` backfilled from job-task `updatedAt`, project/sheet → null.
  Embedded task arrays were then removed from the model (`Project.tasks`, `Job.tasks`,
  `TodoBlock.tasks`) so the unified store is the only source.
- Selectors: `openTasks`, `overdueTasks`, `tasksDueOn`, `tasksByAssignee`, `tasksByProject`,
  `tasksByJob`, `tasksByBlock`, `completedInRange`, `sortedTasks`.
- ISO-week utilities in `lib/dates.ts` (`startOfIsoWeek`, `addDays`, `addWeeks`, `weekRange`,
  `weekKey`).
- UI: Tasks section (status/assignee filters, group-by status/assignee/context, quick-add);
  Home dashboard (overdue + today's tasks, upcoming events next 14 days, month finance
  snapshot, recent payments) as the default section. Project/job/sheet task lists are filtered
  views of the one store; deletes/trashes cascade to tasks.
- **Exit criteria met:** extraction + selectors + overdue/week logic tested; no task list reads
  from the old locations (84 tests).

### Phase 3 — Feature depth ✅ COMPLETE
- **Team weekly work + value** (§5): pure `teamValue.service` (per-member week metrics, team
  totals, output-vs-cost trend) + per-member weekly panel + team-wide weekly board (WeekNav
  shared), derived entirely from Team + Tasks + Projects. Revenue shown as project context only.
- **Team**: SOP files are real now — attach/download/delete via
  `StorageDriver.saveBlob/loadBlob/removeBlob` (IndexedDB in the browser).
- **Prospecting**: kanban board by status (drag to move) + "Convert to Account".
- **Content**: month calendar of posts + deliverable auto-fulfillment ("Mark plan deliverable
  done" when a post type matches a plan requirement on the linked project).
- Cross-links: tasks expose "Open" to jump to the linked project/account or team member.
- **Exit criteria met:** weekly value/trend + ISO-week logic tested; blob round-trip tested;
  build + 96 tests green.

### Phase 4 — Tauri desktop shell + SQLite + in-app auto-update ✅ COMPLETE
- **4.1 Shell** — `src-tauri` crate, `tauri.conf.json` (strict CSP, no remote origins; NSIS
  target; `createUpdaterArtifacts`), minimal `capabilities/default.json`, icons
  (`npx tauri icon src-tauri/app-icon.png`), 1280×820 window.
- **4.2 Storage** — `@tauri-apps/plugin-sql` SQLite key/value store behind the existing
  `StorageDriver` (`load`/`save`/`flush`), parameterized queries only; first-launch
  localStorage→SQLite migration (`storage/migrate.ts` + `storage/tauri.ts`); window-close flush
  via the `request-flush` event + `exit_app` command (completes H3 on desktop).
- **4.3 Blobs** — `saveBlob`/`loadBlob`/`removeBlob`: IndexedDB in the browser, app-data fs on
  desktop.
- **4.4 Updater** — baked fallback public key + `createUpdaterArtifacts`; runtime-configurable
  endpoints/pubkey via custom Rust commands `check_for_update` / `install_update` (progress
  channel); `plugin-process` relaunch; `on_before_exit` exit flush; `installMode: "passive"`.
- **4.5 Settings module** — persisted `manifestUrl`, public-key override (rotation only),
  auto-update toggle, check-on-launch, check interval; "Check now", download progress,
  "Restart to update", current version.
- **4.6 Release** — see the release runbook in §7.
- **Note:** the Rust side requires the Tauri/Rust toolchain (not present on the authoring
  machine); the JS side is fully typechecked/built/tested here.

### Phase 5 — Interface & information-architecture overhaul ✅ COMPLETE
- **Modules**: **Prospecting and Content were removed** (code, providers, nav fields, tests) —
  the product is accounts/projects/tasks/team/money. Sections are now
  `overview | accounts | tasks | team | finance | settings`.
- **Navigation**: a persistent sidebar (primary surfaces + a **curated Accounts launchpad**:
  Pinned + Recent ≤5 + All accounts) replaces the old module dropdown, IDE tabs and sheet bar.
  A **global command palette** (`Ctrl/Cmd+K`) searches sections, accounts, projects and
  interface faces, with keyboard nav, focus trap and focus restore.
- **Workspaces**: Accounts, Projects and Sheets became **workspaces** instead of modals/tabs;
  `ProjectDialog` was deleted, editing is in-place, creation stays modal. Context is preserved
  (breadcrumbs + an in-memory Back stack: Task → Project → Account).
- **Design system**: dark-only **Krevo Midnight** token layer; **two interface faces**
  (`interfaceFace: "geist" | "bricolage"`, persisted); Geist Sans/Mono + Bricolage Grotesque;
  Tabler icon system; chess-knight brand mark (sidebar, favicon, empty states, app icon);
  rows/tables over cards; `Money` + operational date language (`dueLabel`) as shared primitives.
- **Exit criteria met:** typecheck clean, 99 vitest tests green, production build green, Tauri
  dev window launches.

---

## 7. Updater security (locked)

- The **private signing key must NEVER be exposed in the app or stored in user-editable
  settings.** It lives only in the build environment (`TAURI_SIGNING_PRIVATE_KEY`).
- A **fallback public key is baked into the build** (trust anchor). The Settings UI may allow a
  **public-key override for key rotation only** — never the private key.
- The update manifest is hosted on **GitHub Releases**; the app checks
  `.../releases/latest/download/latest.json`. TLS is enforced.
- Because a mutable public key weakens the trust chain, keep the baked fallback authoritative
  and treat any runtime override as an explicit rotation action.

**Keypair status:** a fallback keypair was generated during Phase 4. The **public key is baked**
into `src-tauri/tauri.conf.json`; the **private key is NOT in the repo** (it lives outside the
working tree, in the owner's secure storage, with its password). To rotate:
`npm run tauri signer generate -- -w <secure-path>`, then paste the `.pub` content into
`plugins.updater.pubkey`.

**Release runbook**
1. Set `src-tauri/tauri.conf.json` `plugins.updater.endpoints` to the real
   `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`.
2. Build with the signing key in the environment (never a file in the repo):
   `$env:TAURI_SIGNING_PRIVATE_KEY = "<key>"` and
   `$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<pw>"`, then `npm run tauri:build`.
3. Upload the NSIS installer, its `.sig`, and `latest.json` to the GitHub Release. Tauri Action
   (`tauri-action`) can generate `latest.json`; otherwise hand-write it in the documented format
   (`version`, `pub_date`, `platforms["windows-x86_64"].{signature,url}`).
4. Windows may show a SmartScreen warning unless the installer is Authenticode code-signed; the
   updater signature above is separate and always required.

---

## 8. Design system & interaction principles (locked)

**Krevo Midnight** — the visual identity. Dark-only by design decision: one deeply tuned theme
beats two compromised ones; the token layer is structured so a light face could be added later
without touching components.

- **Palette**: near-black base `#050608`, graphite surfaces, hairlines at ~7% white. **Acid lime
  `#C6F24E` is a SIGNAL, never decoration** — active/selected states, focus, key deltas, one
  primary action, the knight accent. Semantic colours (ok/warn/danger/info/violet) are
  desaturated to sit beside it. No gradients, no glow, no decorative noise.
- **Type roles**: **Geist Sans** (UI/display), **Geist Mono** (all numerals, labels, timestamps —
  tabular), **Bricolage Grotesque Variable** (second interface face). Money and metrics always
  tabular; never format money or dates ad hoc — use `ui/Money` and `lib/dates` (`dueLabel`).
- **Interface faces**: one system, two typographic personalities, switched by
  `html[data-face]` + the `interfaceFace` setting (see §Settings). They must share IA, spacing,
  components, behaviour and density — only character changes.
- **Icons**: Tabler (MIT), one 24-grid geometry, consistent stroke/size; no mixed icon styles.
- **Knight**: the brand mark (Tabler chess-knight) — sidebar, favicon, empty states, desktop icon.
  Never redraw it by hand.
- **Surfaces**: rows, tables, grouped sections and workspaces first. A card exists only when
  information needs elevation (modals, menus, the money line). No card-in-card, no KPI-box grids.
- **Motion**: communicates state only — one staggered `reveal` on workspace mount, hover/focus
  transitions, GSAP for modals. `prefers-reduced-motion` disables it. No confetti/count-ups.
- **Accessibility**: keyboard-first palette (↑↓ Enter Esc, trapped + restored focus), visible
  focus rings, `aria` roles on dialogs/listbox, tooltips on truncated labels, AA contrast.
- **Navigation model**: sections are `overview | accounts | tasks | team | finance | settings`.
  Accounts are a **curated launchpad** (Pinned + Recent ≤5 + All accounts) — never the full
  roster, never nested projects. Projects live in account workspaces.
- **Context preservation (first-class)**: workspaces are entered in place, never via modal.
  Back returns exactly where you came from (session history). Inline actions (payment, task,
  expense) never move the user. `document.title` follows the workspace.
- **Progressive disclosure**: sidebar → account → project → task. Show only what each level needs.

---

## 9. Enforcement Rules — THE ENFORCER

These rules apply to **every** change. When asked to "enforce" or "sweep", audit the whole repo
and **remove** what violates them.

1. **No dead code.** Unused exports, unused files, unreachable branches, no-op handlers, unused
   CSS, and stub features presented as wired get deleted — not commented out. Git is the archive.
2. **No committed build artifacts.** `*.tsbuildinfo`, `dist/`, generated bundles → `.gitignore`.
3. **One pattern per concern.** Feature triad: pure immutable repositories, deep normalization on
   load, `usePersistentState` for persistence, views that never touch storage. No mutable
   singletons, no ad-hoc timers, no shallow `as Partial<T>` trusts.
4. **No type lies.** No `as never`, no `X as unknown as Y`, no non-null assertions where a
   discriminated-union guard works. `noUncheckedIndexedAccess` is on; code must satisfy it
   (tests may use `src/test-utils/assert.ts`).
5. **No silent failure.** Every persistence error path surfaces (banner/log). No bare `catch {}`.
6. **User input is hostile.** Money goes through `parseAmount` — never `parseFloat` on user text.
   Ids come from `crypto.randomUUID()`. No `dangerouslySetInnerHTML`, ever. SQL (Phase 4):
   parameterized queries only.
7. **Key dynamic children.** Any component showing entity X whose form state must not leak to
   entity Y gets `key={x.id}`. Modal/form state resets on open/submit.
8. **No network on startup.** Fonts and assets are bundled locally; CSP forbids remote origins.
9. **File size discipline.** Views over ~400 lines split by dialog/section. Duplicated logic
   (dropdown dismiss, modal animation, task rows, overview detection) extracted once.
10. **Tests ride along.** Pure logic ships with vitest coverage in the same change. The harness is
    vitest.
11. **Never weaken update security.** See §7.
12. **Keep this file current.** Structure/commands/plan/rule changes must update `AGENTS.md` in
    the same change. A stale AGENTS.md is a bug.
13. **Style flows through tokens (§8).** No raw hex/rgba in components; no ad-hoc money/date
    formatting (use `Money` / `dueLabel`); one task row (`ui/TaskItem`); surfaces (rows/tables)
    before cards; acid lime stays a signal.

---

## 10. Current status

- [x] Phase 0 — Remediation + test infrastructure
- [x] Phase 1 — Money (schema V4)
- [x] Phase 2 — Unified tasks + dashboards
- [x] Phase 3 — Feature depth (incl. Team weekly work + value)
- [x] Phase 4 — Tauri desktop shell + SQLite + in-app auto-update
- [x] Phase 5 — Interface & information-architecture overhaul

*(Check off phases as they complete; add dated progress notes below.)*

**2026-09-18 — Phase 0 complete.** Build green, 44 vitest tests green. Tauri deps/driver
removed pending Phase 4; desktop-only deployment confirmed; weekly work/value requirement locked
(§5); updater security model locked (§7).

**2026-09-18 — Phase 1 complete.** Schema V4 (project status/quotedAmount/payments, V3→V4
migration); persisted Finance expenses/categories + persisted editable Plans; booked vs
collected revenue, status filter, yearly grid, by-account breakdown; Finance Month/Year/Expenses/
Plans tabs; payments panel in the project modal. Build green, 66 vitest tests green.

**2026-09-18 — Phase 2 complete.** Unified task store (`features/tasks`) with assignee/due/status/
priority and project/job/sheet links; one-time raw-payload migration folded every embedded task
in and the embedded arrays were removed from the model. ISO-week date utilities; Tasks section
(filters/group-by/quick-add); Home dashboard (default section). Task cascades on project/job/block
delete and account/sheet purge. Build green, 84 vitest tests green.

**2026-09-18 — Phase 3 complete.** Weekly work + value (`teamValue.service`, per-member panel,
team-wide board, trend) derived from Team + Tasks + Projects with revenue as context only; real
SOP file attach/download/delete via IndexedDB blobs; prospecting kanban + convert-to-account;
content month calendar + deliverable fulfillment; task "Open" cross-links. Build green, 96 vitest
tests green.

**2026-09-18 — Phase 4 complete.** Tauri 2 desktop shell (`src-tauri`) with strict CSP and minimal
capabilities; SQLite key/value storage behind the unchanged `StorageDriver` with first-launch
localStorage→SQLite migration; window-close flush (`request-flush` + `exit_app`); fs blob storage;
baked fallback updater public key with runtime endpoint/pubkey commands; Settings module with a
real updater UI (manifest URL, key-rotation override, check-on-launch/interval, progress,
restart). Fallback keypair generated (private key held outside the repo). JS side build + 105
vitest tests green; the Rust crate is authored but not compiled here (no Rust toolchain on the
authoring machine).

**2026-09-18 — Phase 5 complete (interface & IA overhaul).** Prospecting and Content removed.
Navigation rebuilt around a persistent sidebar (primary surfaces + curated Accounts launchpad
with Pinned/Recent and a full roster table) plus a Ctrl/Cmd+K command palette with a pure,
tested ranking module. Accounts and Projects became in-place **workspaces** (project editing no
longer a modal; inline payments/tasks/deliverables; breadcrumbs + session Back stack). Domain
state (`AppState`) is now pure (`accounts` + `trash`); all navigation/UI state moved to the
`NavData` slice (section, active account/project/sheet, trash view, pins, recents, history) —
`openTabs`/IDE tabs and the sheet bar were deleted. Design system rebuilt as **Krevo Midnight**
(dark-only, acid-lime signal) with two persisted interface faces (Geist / Bricolage) and a
Tabler icon set; knight brand assets regenerated. Overview is an operations briefing, Tasks an
execution queue, Finance a ledger, Team a roster + value board. Typecheck clean, 99 vitest tests
green, production build green.
