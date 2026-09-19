import { useEffect, useState } from "react";
import { useSettings } from "../settingsState";
import {
  checkForUpdate,
  currentVersion,
  errorMessage,
  installUpdate,
  relaunchApp,
  updatesSupported,
  type UpdateInfo,
} from "../updater";

type UpdateState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "up-to-date"; version: string }
  | { kind: "available"; info: UpdateInfo }
  | { kind: "installing"; info: UpdateInfo; downloaded: number; total: number | null }
  | { kind: "installed"; info: UpdateInfo }
  | { kind: "error"; message: string };

/** Settings: interface face, then the real updater. */
export function SettingsView() {
  const { settings, update } = useSettings();
  const [version, setVersion] = useState("");
  const [state, setState] = useState<UpdateState>({ kind: "idle" });

  const supported = updatesSupported();

  const runCheck = async () => {
    if (!supported) {
      setState({ kind: "error", message: "Auto-updates run in the installed desktop app." });
      return;
    }
    // A blank manifest URL is valid: the app falls back to its built-in endpoint.
    setState({ kind: "checking" });
    try {
      const info = await checkForUpdate(settings.manifestUrl, settings.publicKeyOverride);
      setState(info ? { kind: "available", info } : { kind: "up-to-date", version });
    } catch (cause) {
      setState({ kind: "error", message: errorMessage(cause) });
    }
  };

  const runInstall = async (info: UpdateInfo) => {
    setState({ kind: "installing", info, downloaded: 0, total: null });
    try {
      await installUpdate((event) => {
        if (event.event === "Started") {
          setState({ kind: "installing", info, downloaded: 0, total: event.data.contentLength });
        } else if (event.event === "Progress") {
          setState((current) =>
            current.kind === "installing" ? { ...current, downloaded: current.downloaded + event.data.chunkLength } : current,
          );
        }
      });
      setState({ kind: "installed", info });
    } catch (cause) {
      setState({ kind: "error", message: errorMessage(cause) });
    }
  };

  useEffect(() => {
    if (supported) void currentVersion().then(setVersion);
    if (supported && settings.autoUpdate && settings.checkOnLaunch) {
      void runCheck();
    }
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supported || !settings.autoUpdate || settings.checkIntervalMinutes <= 0) return;
    const timer = window.setInterval(() => void runCheck(), settings.checkIntervalMinutes * 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, settings.autoUpdate, settings.checkIntervalMinutes]);

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Interface and automatic updates.</p>
        </div>
      </div>

      <section className="section" style={{ marginTop: 0 }}>
        <div className="section-head">
          <span className="section-title">Interface</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="seg" role="group" aria-label="Interface face">
            <button
              className={"seg-btn" + (settings.interfaceFace === "geist" ? " on" : "")}
              onClick={() => update({ interfaceFace: "geist" })}
            >
              Midnight
            </button>
            <button
              className={"seg-btn" + (settings.interfaceFace === "bricolage" ? " on" : "")}
              onClick={() => update({ interfaceFace: "bricolage" })}
            >
              Bricolage
            </button>
          </div>
          <span className="face-preview">
            {settings.interfaceFace === "geist" ? "Precise, engineered" : "Warm, characterful"}
          </span>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
          One design system, two typographic personalities. Applies instantly and persists with your settings.
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-title">Updates</span>
          {version && <span className="faint" style={{ fontSize: 11 }}>v{version}</span>}
        </div>

        {!supported && (
          <div className="muted" style={{ marginBottom: 12 }}>
            Auto-updates run in the installed desktop app. You are using the browser build.
          </div>
        )}

        <label className="tag" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={settings.autoUpdate} onChange={(e) => update({ autoUpdate: e.target.checked })} />
          Enable automatic updates
        </label>

        <div className="field">
          <label className="field-label">Update manifest URL (optional override)</label>
          <input
            className="input"
            placeholder="Built-in Krevo endpoint"
            defaultValue={settings.manifestUrl}
            onBlur={(e) => update({ manifestUrl: e.target.value })}
          />
          <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>
            Leave empty to use the built-in Krevo update endpoint. Only set this to point at a
            different release manifest.
          </div>
        </div>

        <div className="field">
          <label className="field-label">Public key override (key rotation only)</label>
          <input
            className="input"
            placeholder="Leave empty to use the built-in key"
            defaultValue={settings.publicKeyOverride}
            onBlur={(e) => update({ publicKeyOverride: e.target.value })}
          />
          <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>
            The signing private key is never stored in the app or settings.
          </div>
        </div>

        <label className="tag" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={settings.checkOnLaunch} onChange={(e) => update({ checkOnLaunch: e.target.checked })} />
          Check for updates on launch
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="field-label" style={{ margin: 0 }}>Check every</span>
          <input
            className="input"
            style={{ width: 80 }}
            type="number"
            min={0}
            defaultValue={String(settings.checkIntervalMinutes)}
            onBlur={(e) => update({ checkIntervalMinutes: Number(e.target.value) })}
          />
          <span className="faint" style={{ fontSize: 11.5 }}>minutes (0 disables)</span>
        </div>

        <button className="btn btn-primary" disabled={state.kind === "checking"} onClick={() => void runCheck()}>
          {state.kind === "checking" ? "Checking…" : "Check now"}
        </button>

        <div style={{ marginTop: 14, fontSize: 12.5 }}>
          {state.kind === "idle" && <span className="muted">No update check yet.</span>}
          {state.kind === "up-to-date" && <span className="muted">You are up to date.</span>}
          {state.kind === "error" && <span className="error-text">{state.message}</span>}
          {state.kind === "available" && (
            <div>
              <div style={{ marginBottom: 8 }}>
                Version <strong>{state.info.version}</strong> is available.
                {state.info.notes ? <span className="muted"> {state.info.notes}</span> : null}
              </div>
              <button className="btn btn-primary" onClick={() => void runInstall(state.info)}>Download &amp; install</button>
            </div>
          )}
          {state.kind === "installing" && (
            <div>
              <div>
                Downloading…
                {state.total !== null
                  ? ` ${Math.round((state.downloaded / state.total) * 100)}%`
                  : ` ${state.downloaded} bytes`}
              </div>
              <div className="bar-track" style={{ marginTop: 8 }}>
                <div
                  className="bar-fill"
                  style={{ width: state.total ? `${Math.min(100, (state.downloaded / state.total) * 100)}%` : "30%" }}
                />
              </div>
            </div>
          )}
          {state.kind === "installed" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>Update installed.</span>
              <button className="btn btn-ghost" onClick={() => void relaunchApp()}>Restart to update</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
