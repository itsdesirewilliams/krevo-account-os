import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/mona-sans/400.css";
import "@fontsource/mona-sans/500.css";
import "@fontsource/mona-sans/600.css";
import "@fontsource/mona-sans/700.css";
import "./index.css";
import { App } from "./App";
import { StoreProvider } from "./state/store";
import { UIProvider } from "./state/ui";
import { NavProvider } from "./state/nav";
import { defaultState, normalize } from "./state/normalize";
import { STORAGE_KEY, isTauri, storage } from "./storage";
import { flushAll } from "./state/flush";
import { TeamProvider } from "./features/team/teamState";
import { TEAM_KEY } from "./features/team/team.repository";
import { ProspectingProvider } from "./features/prospecting/prospectingState";
import { ContentProvider } from "./features/content/contentState";
import { FinanceProvider } from "./features/finance/financeState";
import { PlansProvider } from "./features/plans/plansState";
import { TasksProvider } from "./features/tasks/tasksState";
import { SettingsProvider } from "./features/settings/settingsState";
import {
  TASKS_KEY,
  extractLegacyTasks,
  mergeTasks,
  normalizeTasksData,
} from "./features/tasks/tasks.repository";
import type { AppState } from "./types";

/**
 * One-time migration: fold tasks embedded in the pre-unification stores
 * (project tasks, sheet to-do blocks/V2 sheet tasks, job tasks) into the
 * unified task store. Accounts/team are normalized afterwards, which drops
 * the embedded copies.
 */
async function migrateLegacyTasks(rawAccounts: unknown): Promise<void> {
  let rawTeam: unknown = null;
  let rawTasks: unknown = null;
  try {
    [rawTeam, rawTasks] = await Promise.all([storage.load(TEAM_KEY), storage.load(TASKS_KEY)]);
  } catch {
    return; // storage already reported; skip migration rather than risk partial state
  }

  const legacy = extractLegacyTasks(rawAccounts, rawTeam);
  if (legacy.length === 0) return;

  const merged = mergeTasks(normalizeTasksData(rawTasks), legacy);
  await storage.save(TASKS_KEY, merged);
}

async function installDesktopExitFlush(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const { invoke } = await import("@tauri-apps/api/core");
    // The Rust close handler prevents the window close and asks the frontend to
    // flush pending writes; we then exit explicitly.
    await listen("request-flush", () => {
      void flushAll().finally(() => void invoke("exit_app"));
    });
  } catch (cause) {
    console.error("[desktop] could not install the exit-flush handler", cause);
  }
}

async function bootstrap() {
  let initial: AppState = defaultState();
  let loaded = false;
  let rawAccounts: unknown = null;
  try {
    rawAccounts = await storage.load(STORAGE_KEY);
    initial = normalize(rawAccounts);
    loaded = true;
  } catch {
    // storage.load already reported the failure. Start from defaults but do not
    // overwrite the unreadable payload, so it can still be recovered by hand.
  }

  await migrateLegacyTasks(rawAccounts);
  if (loaded) void storage.save(STORAGE_KEY, initial);
  await installDesktopExitFlush();

  const container = document.getElementById("root");
  if (!container) throw new Error("Root container #root is missing from index.html");

  createRoot(container).render(
    <StrictMode>
      <StoreProvider initialState={initial}>
        <UIProvider>
          <NavProvider>
            <TeamProvider>
              <ProspectingProvider>
                <ContentProvider>
                  <FinanceProvider>
                    <PlansProvider>
                      <TasksProvider>
                        <SettingsProvider>
                          <App />
                        </SettingsProvider>
                      </TasksProvider>
                    </PlansProvider>
                  </FinanceProvider>
                </ContentProvider>
              </ProspectingProvider>
            </TeamProvider>
          </NavProvider>
        </UIProvider>
      </StoreProvider>
    </StrictMode>,
  );
}

void bootstrap();
