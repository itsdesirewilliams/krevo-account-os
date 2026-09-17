import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { StoreProvider } from "./state/store";
import { UIProvider } from "./state/ui";
import { NavProvider } from "./state/nav";
import { defaultState, normalize } from "./state/normalize";
import { STORAGE_KEY, storage } from "./storage";
import { TeamProvider } from "./features/team/teamState";
import { ProspectingProvider, loadProspecting } from "./features/prospecting/prospectingState";
import { ContentProvider, loadContent } from "./features/content/contentState";

async function bootstrap() {
  // Accounts state (persisted via the storage abstraction).
  const raw = await storage.load(STORAGE_KEY);
  const initial = normalize(raw ?? defaultState());
  if (JSON.stringify(raw) !== JSON.stringify(initial)) {
    void storage.save(STORAGE_KEY, initial);
  }

  // Feature-section state (loaded in parallel; each owns its own key).
  const [prospectingInitial, contentInitial] = await Promise.all([loadProspecting(), loadContent()]);

  const container = document.getElementById("root")!;
  createRoot(container).render(
    <StrictMode>
      <StoreProvider initialState={initial}>
        <UIProvider>
          <NavProvider>
            <TeamProvider>
              <ProspectingProvider initial={prospectingInitial}>
                <ContentProvider initial={contentInitial}>
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
