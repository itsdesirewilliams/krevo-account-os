/*
 * Entry point. Bootstrap the persistence -> state -> UI chain.
 * The load/save path is intentionally thin: the persistence adapter lives in
 * storage.js so a Tauri file adapter can be dropped in later without changes.
 */
(function (G) {
    'use strict';

    function boot() {
        G.load();          // hydrate state from persistence layer
        G.render();        // paint it
        G.wire();          // static control bindings
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window.Krevo = window.Krevo || {});