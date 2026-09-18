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
    if (!settings.manifestUrl.trim()) {
      setState({ kind: "error", message: "Set the update manifest URL first." });
      return;
    }
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
            current.kind === "installing"
              ? { ...current, downloaded: current.downloaded + event.data.chunkLength }
              : current,
          );
        }
      });
      // On Windows the app exits automatically during install; this covers
      // macOS/Linux and the "restart later" path.
      setState({ kind: "installed", info });
    } catch (cause) {
      setState({ kind: "error", message: errorMessage(cause) });
    }
  };

  useEffect(() => {
    if (supported) void currentVersion().then(setVersion);
    if (supported && settings.autoUpdate && settings.checkOnLaunch && settings.manifestUrl.trim()) {
      void runCheck();
    }
    // Runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supported || !settings.autoUpdate || settings.checkIntervalMinutes <= 0 || !settings.manifestUrl.trim()) {
      return;
    }
    const timer = window.setInterval(() => void runCheck(), settings.checkIntervalMinutes * 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, settings.autoUpdate, settings.checkIntervalMinutes, settings.manifestUrl]);

  return (
    <div className="p-6 max-w-2xl overflow-y-auto">
      <div className="text-[15px] font-semibold uppercase tracking-[0.08em] mb-5">Settings</div>

      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Updates</div>

      {!supported && (
        <div className="text-[12.5px] text-dim mb-3">
          Auto-updates run in the installed desktop app. You are using the browser build.
        </div>
      )}

      <div className="field-form flex items-center gap-2">
        <input
          id="auto-update"
          type="checkbox"
          checked={settings.autoUpdate}
          onChange={(e) => update({ autoUpdate: e.target.checked })}
        />
        <label htmlFor="auto-update" className="text-[13px]">Enable automatic updates</label>
      </div>

      <div className="field-form">
        <div className="modal-label">Update manifest URL (GitHub Releases)</div>
        <input
          className="input w-full"
          placeholder="https://github.com/<owner>/<repo>/releases/latest/download/latest.json"
          defaultValue={settings.manifestUrl}
          onBlur={(e) => update({ manifestUrl: e.target.value })}
        />
      </div>

      <div className="field-form">
        <div className="modal-label">Public key override (key rotation only)</div>
        <input
          className="input w-full"
          placeholder="Leave empty to use the built-in key"
          defaultValue={settings.publicKeyOverride}
          onBlur={(e) => update({ publicKeyOverride: e.target.value })}
        />
        <div className="formatted-date mt-1">
          The signing private key is never stored in the app or settings.
        </div>
      </div>

      <div className="field-form flex items-center gap-2">
        <input
          id="check-on-launch"
          type="checkbox"
          checked={settings.checkOnLaunch}
          onChange={(e) => update({ checkOnLaunch: e.target.checked })}
        />
        <label htmlFor="check-on-launch" className="text-[13px]">Check for updates on launch</label>
      </div>

      <div className="field-form flex items-center gap-2">
        <label htmlFor="check-interval" className="modal-label mb-0">Check every</label>
        <input
          id="check-interval"
          className="input"
          style={{ width: 80 }}
          type="number"
          min={0}
          defaultValue={String(settings.checkIntervalMinutes)}
          onBlur={(e) => update({ checkIntervalMinutes: Number(e.target.value) })}
        />
        <span className="text-[12.5px] text-dim">minutes (0 disables)</span>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button className="btn btn-primary" disabled={state.kind === "checking"} onClick={() => void runCheck()}>
          {state.kind === "checking" ? "Checking…" : "Check now"}
        </button>
        {version && <span className="text-[12.5px] text-dim">Current version {version}</span>}
      </div>

      <div className="mt-4 text-[13px]">
        {state.kind === "idle" && <span className="text-dim">No update check yet.</span>}
        {state.kind === "up-to-date" && <span className="text-dim">You are up to date.</span>}
        {state.kind === "error" && <span style={{ color: "#ff8585" }}>{state.message}</span>}
        {state.kind === "available" && (
          <div>
            <div className="mb-1">
              Version <strong>{state.info.version}</strong> is available.
              {state.info.notes ? <span className="text-dim"> {state.info.notes}</span> : null}
            </div>
            <button className="btn btn-primary" onClick={() => void runInstall(state.info)}>
              Download &amp; install
            </button>
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
            <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "#263241" }}>
              <div
                className="h-1.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  width: state.total ? `${Math.min(100, (state.downloaded / state.total) * 100)}%` : "30%",
                }}
              />
            </div>
          </div>
        )}
        {state.kind === "installed" && (
          <div className="flex items-center gap-3">
            <span>Update installed.</span>
            <button className="btn btn-ghost" onClick={() => void relaunchApp()}>Restart to update</button>
          </div>
        )}
      </div>
    </div>
  );
}
