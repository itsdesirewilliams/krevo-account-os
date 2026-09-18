# Krevo Account OS — Agent Guide & Project Plan

**Read this file first.** It is the single source of truth for what this project is, how it is
structured, what is broken, and the plan for where it is going. Any agent working in this repo
must follow the Enforcement Rules at the bottom.

---

## 1. What this project is

**Krevo Account OS** is a single-user, internal business-operations app for a social/creative
agency. It tracks four things:

| Domain | Where it lives today (after Phase 2) |
|---|---|
| **Projects** | Accounts → Overview sheet → projects (name, event, quoted amount, status pipeline, payments, date, plan) |
| **Teams** | Team members (persons + tools) with monthly cost, jobs, SOP refs |
| **Money** | Finance view: booked vs collected revenue from projects/payments, costs from team members, expenses slice |
| **Tasks** | Unified `features/tasks` store — assignee, due date, status, priority, links to project/job/sheet; Tasks section + Home dashboard |

Supporting modules: **Prospecting** (sales sprints → prospect pipeline), **Content** (social
accounts → scheduled posts, linked to projects), **Plans** (hardcoded pricing plans with social
deliverables).

**Locked-in product decisions** (made with the owner):
- **Desktop-only.** The shipping form is a Tauri desktop executable (Phase 4). The Vite browser
  app remains the development/test environment. Vercel/hosted web deployment is **not** a target.
- **Money depth**: payments per project (advance/balance, paid/pending), one-off + recurring
  expenses in Finance, monthly AND yearly reports, per-account profitability. Currency is INR.
- **Unified tasks**: one task model with assignee (team member), due date, status, priority,
  links to project/job/sheet; plus a Tasks dashboard and a Home dashboard.
- **Single user, no auth.** Projects gain a status pipeline
  (`lead | confirmed | delivered | on_hold | cancelled`); Finance excludes unconfirmed deals
  from booked revenue by default.
- **Weekly team work + value tracking** (see §5): derived entirely from unified tasks — no
  work-log, no timesheet, no hours, no new entities. Revenue is shown as project context only,
  never attributed to an individual member.

---

## 2. Tech stack & commands

React 18 · TypeScript (strict, `noUncheckedIndexedAccess`) · Vite 6 · Tailwind CSS v4 · GSAP ·
**vitest** for tests. **Tauri is not a dependency right now**: the Phase 0 remediation removed
the broken Tauri storage driver and its unused deps (`@tauri-apps/api`, `plugin-sql`, `cli`);
Phase 4 adds the real desktop shell back.

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (browser build) |
| `npm run build` | `tsc -b && vite build` (typecheck + production bundle to `dist/`) |
| `npm run preview` | Serve the production build locally |
| `npm test` | `vitest run` — the full suite (CI gate) |
| `npm run test:watch` | vitest in watch mode |
| `npm run typecheck` | `tsc -b` only |

---

## 3. File map (current state)

```
src/
  main.tsx                    Entry; loads accounts state + one-time legacy-task migration,
                              mounts providers, imports bundled fonts
  App.tsx                     Shell: header, StorageBanner, AppNav, MainContent section switcher
  types.ts                    Core model V4: Account, Sheet (Overview|Custom), Block (union),
                              Project (status/quotedAmount/payments), Payment, Trash, money helpers.
                              Tasks live in features/tasks, not here.
  storage/index.ts            StorageDriver (load/save/flush) + BrowserStorageDriver + onStorageError
  state/
    store.tsx                 StoreProvider with SEPARATE state + actions contexts
                              (useStoreState / useStoreActions). Mutations via update() →
                              structuredClone → normalize → debounced save; flush on exit.
    ui.tsx                    UI context: dialogs (prompt/confirm), context menu
    nav.tsx                   Nav context: activeSection, teamMemberId, sprintId, socialAccountId
    persist.ts                usePersistentState (+ ready) and useFlushOnExit
    normalize.ts              Deep normalization + V2→V3 migration for AppState
  app/
    AppNav.tsx                Sidebar: sections, accounts list, color filters, context menus
    navigation.ts             Nav state types
  lib/
    id.ts                     genId → crypto.randomUUID()
    dates.ts                  formatDate · nowIso · todayLocalIso
    currency.ts               formatINR · parseAmount (strict) · formatCharges
    useEscapeLayer.ts         Stacked Escape handling (topmost dialog only)
    useDismissOnOutsideClick.ts
  components/
    Workspace · SheetBar · AccountTabs · OverviewSheet · CustomSheet · TrashView · ContextMenu
    Icons · StorageBanner
    ui/FeatureEmpty · ui/TaskRow (TaskRow + TaskInput, shared everywhere)
    modals/Modal (single modal impl) · modals/ModalHost (generic dialogs)
      modals/ProjectDialog (money + status + tasks) · modals/NewProjectDialog
  features/
    team/                     team.types · team.repository (pure, immutable, deep-normalizing)
                              teamState (usePersistentState) · components/TeamView
    prospecting/              prospecting.types · prospecting.repository (pure, immutable)
                              prospectingState (usePersistentState) · components/ProspectingView
    content/                  content.types · content.repository (pure, immutable)
                              contentState (usePersistentState) · components/ContentView
    finance/                  finance.types · finance.repository (pure: expenses + categories)
                              financeState (usePersistentState) · finance.service (pure derivation:
                              booked/collected/expenses/year) · components/FinanceView +
                              MonthPanel · YearPanel · ExpensesPanel · PlansPanel
    plans/                    plans.types · plans.repository (pure, persisted default PLANS A/B,
                              deliverable defaults) · plansState (usePersistentState)
    tasks/                    tasks.types · tasks.repository (pure: CRUD, cascades, selectors,
                              legacy extraction) · tasksState (usePersistentState) ·
                              taskContext (context labels) · components/TasksView
    home/                     components/HomeView (overdue/today tasks, upcoming events,
                              month finance snapshot, recent payments)
  test-utils/assert.ts        Test-only `first()` / `present()` narrowing helpers
tests                         Co-located as src/**/*.test.ts (vitest)
vitest.config.ts
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

**Residual limitations (intentional, later phases):**
- `structuredClone` + `normalize` still runs per mutation (frequency is now low — blur commits).
- SOP file attach/download is still a stub, presented honestly; implemented in Phase 3.
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

### Phase 3 — Feature depth
- **Team weekly work + value** (§5): `teamValue.service` + per-member weekly view + team-wide
  weekly board + output-vs-cost trend.
- **Team**: utilization view (jobs, open assigned tasks, cost rollup); real SOP file
  attach/download/delete via `StorageDriver.saveBlob/loadBlob` (IndexedDB in browser, fs under
  Tauri).
- **Prospecting**: kanban board by status; "Convert to Account" for interested prospects.
- **Content**: month calendar of posts; deliverable auto-fulfillment offers when a matching post
  type is linked to a project.
- Cross-links: "Open in…" navigation between task → project → account → content.

### Phase 4 — Tauri desktop shell + SQLite + in-app auto-update
- **4.1 Shell** — `src-tauri` crate, `tauri.conf.json` with strict CSP (no remote origins),
  minimal capabilities, icons, window config.
- **4.2 Storage** — SQLite (`@tauri-apps/plugin-sql`) as a key/value document store behind the
  existing `StorageDriver` (`load`/`save`/`flush`); first-launch localStorage→SQLite migration;
  window-close flush (completes H3 on desktop).
- **4.3 Blobs** — `saveBlob`/`loadBlob`; fs plugin on desktop.
- **4.4 Updater** — signing keypair, `createUpdaterArtifacts`, fallback pubkey/endpoint in
  config, custom Rust `check_for_update` / `install_update` (progress channel),
  `plugin-process` relaunch, `on_before_exit` flush, `installMode: "passive"`.
- **4.5 Settings module** (`features/settings/`) — persisted: enable auto-updates, manifest URL,
  public-key override, check-on-launch/interval; plus "Check now", progress, "Restart to update",
  current version.
- **4.6 Release** — build/signing instructions, GitHub Releases manifest layout
  (`https://github.com/<owner>/<repo>/releases/latest/download/latest.json`), Windows installer,
  SmartScreen note.
- **Exit criteria:** kv round-trip tested with mocked `invoke`; migration tested; executable
  installs and updates from GitHub Releases.

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

---

## 8. Enforcement Rules — THE ENFORCER

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

---

## 9. Current status

- [x] Phase 0 — Remediation + test infrastructure
- [x] Phase 1 — Money (schema V4)
- [x] Phase 2 — Unified tasks + dashboards
- [ ] Phase 3 — Feature depth (incl. Team weekly work + value)
- [ ] Phase 4 — Tauri desktop shell + SQLite + in-app auto-update

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
