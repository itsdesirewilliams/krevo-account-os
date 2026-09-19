/*
 * Krevo Account OS desktop shell.
 *
 * Storage is handled by the frontend through the SQL and fs plugins; this crate
 * adds the window-exit flush hook and the runtime-configurable updater commands.
 *
 * Security: the private signing key never exists in this crate. Updates are
 * verified against the baked fallback public key (tauri.conf.json) unless the
 * user provides an override for key rotation.
 */
use std::sync::Mutex;

use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Emitter, Manager, State, WindowEvent};
use tauri_plugin_updater::{Update, UpdaterExt};

#[derive(Serialize, Clone)]
pub struct UpdateMetadata {
    version: String,
    current_version: String,
    notes: String,
    date: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(tag = "event", content = "data")]
pub enum DownloadEvent {
    #[serde(rename_all = "camelCase")]
    Started { content_length: Option<u64> },
    #[serde(rename_all = "camelCase")]
    Progress { chunk_length: usize },
    #[serde(rename_all = "camelCase")]
    Finished,
}

#[derive(Default)]
struct PendingUpdate(Mutex<Option<Update>>);

fn metadata(update: &Update) -> UpdateMetadata {
    UpdateMetadata {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
        notes: update.body.clone().unwrap_or_default(),
        date: None,
    }
}

/// Check for an update.
///
/// `endpoint` is an optional user override. When it is absent or blank the
/// updater uses the endpoints configured in `tauri.conf.json`
/// (`plugins.updater.endpoints`) - the single authoritative definition - so a
/// production install never needs the URL typed in. `pubkey` is an optional
/// key-rotation override; otherwise the baked fallback public key is used.
#[tauri::command]
async fn check_for_update(
    app: AppHandle,
    endpoint: Option<String>,
    pubkey: Option<String>,
    pending: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let mut builder = app.updater_builder();

    if let Some(value) = endpoint {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            let url = url::Url::parse(trimmed).map_err(|error| error.to_string())?;
            builder = builder.endpoints(vec![url]).map_err(|error| error.to_string())?;
        }
    }

    if let Some(key) = pubkey {
        let trimmed = key.trim();
        if !trimmed.is_empty() {
            builder = builder.pubkey(trimmed.to_string());
        }
    }

    let updater = builder.build().map_err(|error| error.to_string())?;
    let update = updater.check().await.map_err(|error| error.to_string())?;
    let result = update.as_ref().map(metadata);
    *pending.0.lock().unwrap() = update;
    Ok(result)
}

/// Download and install the pending update, emitting progress events.
#[tauri::command]
async fn install_update(
    pending: State<'_, PendingUpdate>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let update = pending
        .0
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| "No pending update".to_string())?;

    let mut started = false;
    update
        .download_and_install(
            |chunk_length, content_length| {
                if !started {
                    let _ = on_event.send(DownloadEvent::Started { content_length });
                    started = true;
                }
                let _ = on_event.send(DownloadEvent::Progress { chunk_length });
            },
            || {
                let _ = on_event.send(DownloadEvent::Finished);
            },
        )
        .await
        .map_err(|error| error.to_string())
}

/// Exits the app after the frontend has flushed pending writes.
#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            app.manage(PendingUpdate::default());
            Ok(())
        })
        // Ask the frontend to flush, then exit explicitly (completes H3 on desktop).
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.emit("request-flush", ());
            }
        })
        .invoke_handler(tauri::generate_handler![
            check_for_update,
            install_update,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Krevo Account OS desktop app");
}
