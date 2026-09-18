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
import { STORAGE_KEY, storage } from "./storage";
import { TeamProvider } from "./features/team/teamState";
import { ProspectingProvider } from "./features/prospecting/prospectingState";
import { ContentProvider } from "./features/content/contentState";
import type { AppState } from "./types";

async function loadInitialState(): Promise<{ state: AppState; loaded: boolean }> {
  try {
    return { state: normalize(await storage.load(STORAGE_KEY)), loaded: true };
  } catch {
    // storage.load already reported the failure. Start from defaults but do not
    // overwrite the unreadable payload, so it can still be recovered by hand.
    return { state: defaultState(), loaded: false };
  }
}

async function bootstrap() {
  const { state, loaded } = await loadInitialState();
  if (loaded) void storage.save(STORAGE_KEY, state);

  const container = document.getElementById("root");
  if (!container) throw new Error("Root container #root is missing from index.html");

  createRoot(container).render(
    <StrictMode>
      <StoreProvider initialState={state}>
        <UIProvider>
          <NavProvider>
            <TeamProvider>
              <ProspectingProvider>
                <ContentProvider>
                  <App />
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
