# Krevo Account OS — Agent Guide & Project Plan

**Read this file first.** It is the single source of truth for what this project is, how it is
structured, what is broken, and the plan for where it is going. Any agent working in this repo
must follow the Enforcement Rules at the bottom.

---

## 1. What this project is

**Krevo Account OS** is a single-user, internal business-operations app for a social/creative
agency. It tracks four things:

| Domain | Where it lives today |
|---|---|
| **Projects** | Accounts → Overview sheet → projects (name, event, charges, date, plan, tasks) |
| **Teams** | Team members (persons + tools) with monthly cost, jobs, job tasks, SOP refs |
| **Money** | Finance view deriving revenue from project charges and costs from team members |
| **Tasks** | Scattered: project tasks, sheet todo-blocks, job tasks (to be unified in Phase 2) |

Supporting modules: **Prospecting** (sales sprints → prospect pipeline), **Content** (social
accounts → scheduled posts, linked to projects), **Plans** (hardcoded pricing plans with social
deliverables).

**Locked-in product decisions** (made with the owner):
- **Browser-first**: ship a fully working browser app (localStorage) now; Tauri + SQLite desktop
  comes in Phase 4.
- **Money depth**: payments per project (advance/balance, paid/pending), one-off + recurring
  expenses in Finance, monthly AND yearly reports, per-account profitability. Currency is INR.
- **Unified tasks**: one task model with assignee (team member), due date, status, priority,
  links to project/job/sheet; plus a Tasks dashboard and a Home dashboard.
- **Single user, no auth.** Projects gain a status pipeline
  (`lead | confirmed | delivered | on_hold | cancelled`); Finance excludes unconfirmed deals
  from booked revenue by default.

---

## 2. Tech stack & commands

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS v4 · GSAP · Tauri 2 (dependency declared,
**no `src-tauri` backend exists yet** — see Critical Issues).

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server (browser build) |
| `npm run build` | `tsc -b && vite build` |
| `npm test` | esbuild-bundled node logic test (`scripts/logic-test.mts`) — will be replaced by vitest in Phase 0 |
| `npm run tauri:dev` / `tauri:build` | **Non-functional** — no `src-tauri` crate exists yet |

---

## 3. File map (current state)

```
src/
  main.tsx                    Entry; loads prospecting/content, mounts providers
  App.tsx                     Shell: header, AppNav, MainContent section switcher
  types.ts                    Core model V3: Account, Sheet (Overview|Custom), Block, Project, Task, Trash
  storage/index.ts            StorageDriver abstraction: BrowserStorageDriver (localStorage) +
                              TauriStorageDriver (BROKEN, see C1/C2)
  state/
    store.tsx                 Accounts store: single context, all mutations via update() →
                              structuredClone → normalize → 250ms debounced save
    ui.tsx                    UI context: dialogs (prompt/confirm), context menu
    nav.tsx                   Nav context: activeSection, teamMemberId, sprintId, socialAccountId
    persist.ts                usePersistentState hook (load + debounced autosave)
    normalize.ts              Deep normalization + V2→V3 migration for AppState
  app/
    AppNav.tsx                Sidebar: sections, accounts list, color filters, context menus
    navigation.ts             Nav state types
  features/
    team/                     team.types.ts · team.repository.ts (pure, immutable, deep-normalizing)
                              teamState.tsx (usePersistentState) · components/TeamView.tsx
    prospecting/              prospecting.types.ts · prospecting.repository.ts (mutable singleton!)
                              prospectingState.tsx (ad-hoc timer) · components/ProspectingView.tsx
    content/                  content.types.ts · content.repository.ts (mutable singleton!)
                              contentState.tsx (ad-hoc timer) · components/ContentView.tsx
    finance/                  finance.service.ts (pure derivation, owns NO data yet) · components/FinanceView.tsx
    plans/                    plans.ts — PLANS hardcoded; getPlan, planLabel, defaultDeliverables
  components/                 Workspace, SheetBar, AccountTabs, OverviewSheet, CustomSheet, TrashView,
                              ContextMenu, Icons, ui/SimpleModal, modals/ModalHost + Modal
  lib/                        id.ts (genId) · dates.ts · currency.ts (parseCharges — BUGGY)
scripts/                      logic-test.mts (+ mocks/) — esbuild/node harness
legacy/                       Old vanilla-JS app, REFERENCE ONLY — nothing imports it
```

**Architecture contract** — every feature follows (or must be brought to) this shape:
`*.types.ts` (pure data) · `*.repository.ts` (pure, immutable logic, deep normalize on load) ·
`*State.tsx` (context + `usePersistentState`) · `components/` (views only, no persistence).

---

## 4. Known issues (from the 2026-09-17 codebase review)

Severity: **C**ritical / **H**igh / **M**edium / **L**ow. Phase 0 addresses all of them.

### Critical
- **C1** `storage/index.ts:67-96` — Tauri driver ignores the storage key: all 5 persisted
  features map to one backend slot and would clobber each other.
- **C2** No `src-tauri/` exists; in a packaged app every save silently no-ops and state is lost.
  `@tauri-apps/plugin-sql` is a dead dependency for now.

### High
- **H1** `ContentView.tsx:321` — `SocialAccountDetail` has no `key`; uncontrolled inputs can
  write the previous social account's values onto the new one.
- **H2** Money parsing: `parseFloat("4,000")` → 4 (`TeamView.tsx:137,257`);
  `parseCharges("25,000-30,000")` → 2,500,030,000 (`lib/currency.ts:5-8`).
- **H3** 250 ms debounced saves with no flush-on-exit — last edits lost on every close.

### Medium
- **M1** `persist.ts:19-30` — load resolution overwrites edits made before it resolves (lost update).
- **M2** Trash sheets never normalized; `restoreSheet` (`store.tsx:393-406`) splices before
  checking the account exists.
- **M3** `overviewOf` (`types.ts:93-98`) unsafe cast of any first sheet to OverviewSheet.
- **M4** Whole-tree `structuredClone` + normalize per keystroke; single context re-renders everything.
- **M5** `AddMemberModal` never resets → duplicate member in one click.
- **M6** `MemberOverview` not keyed → modal state leaks across members.
- **M7** `useEscape` ignores its arg; Escape closes stacked dialogs at once.
- **M8** `todayIso()` uses UTC → default post date off by a day.

### Low (enforcer sweep list)
Dead exports (`Icons.tsx`, `PROSPECT_STATUSES`, `postsForProject`, `deliverablesForProject`);
committed build artifacts (`scripts/.logic-test.mjs`, `*.tsbuildinfo`); `genId` not
collision-proof; `sheet as never` + double casts (`store.tsx:204,292`); Google Fonts CDN + no CSP;
context-menu no viewport clamping + dead "Set Color →" item; missing "No Color" filter; SOP
"wired" copy is a stub; inconsistent feature triad (mutable singletons vs pure repos, shallow vs
deep normalize, ad-hoc timers vs `usePersistentState`); `{MainContent()}` called as a function;
duplicated dropdown-close effects, modal animations, task-row UI.

**Test coverage today:** V2→V3 migration, storage round-trip, date/charge formatting only.
Untested: all repositories, finance math, parsers, store actions.

---

## 5. The plan (5 phases)

Each phase ends with working software and green tests. Phases 0→1→2 are the critical path;
3 and 4 are independently schedulable afterward.

### Phase 0 — Remediation + test infrastructure
**Goal: no known data-loss or corruption path in the browser build.**

- **0.1 Persistence** (C1, C2, H3, M1): Tauri driver non-selectable until a backend exists
  (throw, never silent-swallow); dirty-flag flush on `pagehide`/`visibilitychange`; fix
  `usePersistentState` lost-update race (only replace if state still equals fallback initial;
  expose `ready`); prospecting/content migrate onto `usePersistentState` with deep normalizers;
  storage failures surface a banner, never `catch {}` silently.
- **0.2 Money parser** (H2): strict `parseAmount()` in `lib/currency.ts` (strip separators,
  first number only, stop at range dash); replace all `parseFloat` cost inputs and rewire
  `parseCharges`. Tests for `"4,000"`, `"25,000-30,000"`, `"₹25000"`, `""`, `"abc"`.
- **0.3 React correctness** (H1, M5–M8): key `SocialAccountDetail`/`MemberOverview` by id;
  reset `AddMemberModal` on submit; `useEscape` uses its arg, Escape routed through a dialog
  stack (topmost only); `todayLocalIso()` in `lib/dates.ts`.
- **0.4 Normalization** (M2, M3): deep-normalize `trash.sheets`; `restoreSheet` splices only
  after the account is found; honest `overviewOf` typing + `normalizeAccount` guarantees an
  Overview sheet exists; harden `normalizeNav`.
- **0.5 Performance** (M4): text fields commit on blur (pattern already in `Workspace.tsx:30`);
  split store into state + actions contexts.
- **0.6 Enforcer sweep** (all L items): see §6.
- **0.7 Tests**: replace esbuild harness with **vitest**; port existing suites; add parsers,
  repository normalizers + cascade deletes, `finance.service`, store actions, persist race.
- **Exit criteria:** `npm test` (vitest) green; no silent save/load failure exists anywhere.

### Phase 1 — Money (schema V4)
- `Project` gains `status` (pipeline), `quotedAmount: number` (migrated from `charges` via
  `parseAmount`; `charges` kept read-only for display), `payments: Payment[]`
  (`{ id, amount, date, note? }`); derived `paid`, `balance`, collection status.
- Finance gains its own persisted slice: `expenses: Expense[]`
  (`{ id, date, label, category, amount, recurringMonthly? }`) with editable categories.
- `finance.service.ts`: booked (event-month) vs collected (payment-date) revenue; status
  filter (exclude `lead`/`cancelled`/`on_hold` by default, toggleable); yearly 12-month grid;
  per-account profitability; expenses series.
- UI: payments panel in project modal; status chips + filters; expenses entry; Year view tab.
- `plans.ts`: PLANS become persisted, editable records; plan price seeds `quotedAmount`.
- **Exit criteria:** V3→V4 migration tested; all finance rollups unit-tested.

### Phase 2 — Unified tasks + dashboards
- New `features/tasks/`: `TaskRecord { id, title, notes?, status, priority, dueDate,
  assigneeId, links: { accountId? projectId? jobId? sheetId? }, createdAt, completedAt }`.
- Migration folds project tasks, job tasks, and sheet todo-block tasks into this store
  (existing IDs preserved); per-module task UIs become filtered views — kills the triplicated
  task-row UI.
- UI: Tasks section (filters: all / by assignee / overdue / this week / by project / by account;
  group-by toggle; quick-add); Home dashboard (overdue + today's tasks, upcoming events next
  14 days, month finance snapshot, recent payments) as the default section.
- **Exit criteria:** migration + selectors + overdue logic tested; no task list reads from the
  old locations.

### Phase 3 — Feature depth
- **Team**: utilization view (jobs, open assigned tasks, cost rollup); real SOP file
  attach/download/delete via `StorageDriver.saveBlob/loadBlob` (IndexedDB in browser).
- **Prospecting**: kanban board by status; "Convert to Account" action for interested prospects.
- **Content**: month calendar of posts (colored by type); deliverable auto-fulfillment offers
  to tick plan deliverables when a matching post type is linked to a project.
- Cross-links: "Open in…" navigation between task → project → account → content.

### Phase 4 — Tauri + SQLite desktop
- Add `src-tauri` + `tauri.conf.json` (CSP blocking remote origins, minimal invoke surface).
- SQLite via `@tauri-apps/plugin-sql` as **kv document store first**
  (`kv(key TEXT PRIMARY KEY, json TEXT)`, parameterized queries only) — repositories stay pure
  in-memory; full relational schema only if SQL reporting / multi-user ever needed.
- First-launch migration: localStorage JSON → SQLite; browser driver retires under Tauri.
- Window close event → synchronous flush (completes H3 on desktop); ship installer; keep the
  browser build working via `isTauri()` driver selection.

---

## 6. Enforcement Rules — THE ENFORCER

These rules apply to **every** change in this repo. When asked to "enforce" or "sweep", audit
the whole repo against this list and **remove** what violates it. Junk code that adds nothing
must not survive a sweep.

1. **No dead code.** Unused exports, unused files, unreachable branches, no-op handlers
   (e.g. `action: () => {}`), and stub features presented as wired get deleted — not commented
   out. `git`/version control is the archive, not the codebase.
2. **No committed build artifacts.** `*.tsbuildinfo`, `scripts/.logic-test.mjs`, `dist/`,
   anything generated → `.gitignore`, not the tree.
3. **One pattern per concern.** The feature triad must match: pure immutable repositories, deep
   normalization on load, `usePersistentState` for persistence, views that never touch storage.
   Mutable singletons, ad-hoc timers, and shallow `as Partial<T>` trusts are violations.
4. **No type lies.** No `as never`, no `X as unknown as Y`, no non-null assertions where a
   discriminated-union guard works. `noUncheckedIndexedAccess` is on; code must satisfy it.
5. **No silent failure.** Every persistence error path surfaces (banner/log), never swallowed.
   No bare `catch {}`.
6. **User input is hostile.** Money goes through the shared strict parser — never raw
   `parseFloat` on user text. Ids come from `crypto.randomUUID()`. No `dangerouslySetInnerHTML`,
   ever. (SQL when it arrives: parameterized queries only.)
7. **Key dynamic children.** Any component showing entity X whose form state must not leak to
   entity Y gets `key={x.id}`. Modal/form state resets on submit.
8. **No network on startup.** Fonts and assets are bundled locally; CSP forbids remote origins.
9. **File size discipline.** Views over ~400 lines split by dialog/section. Duplicated logic
   (dropdown dismiss, modal animation, task rows, overview detection) is extracted once, used
   everywhere.
10. **Tests ride along.** Pure logic (parsers, normalizers, repositories, finance math, store
    actions) ships with vitest coverage in the same change. The harness is vitest — the esbuild
    test script is removed once porting is done.
11. **Keep this file current.** Any change to structure, commands, the plan, or these rules must
    update `AGENTS.md` in the same change. A stale AGENTS.md is a bug.

---

## 7. Current status

- [ ] Phase 0 — Remediation + test infrastructure
- [ ] Phase 1 — Money (schema V4)
- [ ] Phase 2 — Unified tasks + dashboards
- [ ] Phase 3 — Feature depth
- [ ] Phase 4 — Tauri + SQLite desktop

*(Check off phases as they complete; add dated progress notes below.)*
