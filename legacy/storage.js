/*
 * Persistence layer.
 * The rest of the app talks only to Krevo.Storage (get/set/remove).
 * During development this uses browser localStorage. Later it can be
 * swapped for a TauriFileStorage with the exact same interface without
 * touching any application logic.
 */
(function (G) {
    'use strict';

    const BrowserStorage = {
        get(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw == null ? null : JSON.parse(raw);
            } catch (e) {
                return null;
            }
        },
        set(key, value) {
            try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
        },
        remove(key) {
            try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
        }
    };

    // TODO(tauri): replace with file-system backed adapter using the same API.
    G.Storage = BrowserStorage;
})(window.Krevo = window.Krevo || {});