(function (G) {
    'use strict';

    function showTrash() {
        G.state.showTrash = true;
        G.state.activeAccountId = null;
        G.save();
        G.render();
    }

    function hideTrash() {
        G.state.showTrash = false;
        if (G.state.openTabs.length) {
            G.state.activeAccountId = G.state.openTabs[G.state.openTabs.length - 1];
        }
        G.save();
        G.render();
    }

    function restoreAccount(id) {
        const idx = (G.state.trash.accounts || []).findIndex(function (a) { return a.id === id; });
        if (idx < 0) return;
        const account = G.state.trash.accounts.splice(idx, 1)[0];
        G.state.accounts.push(account);
        if (!G.state.activeSheetByAccount[account.id]) {
            G.state.activeSheetByAccount[account.id] = account.sheets.length ? account.sheets[0].id : null;
        }
        G.openAccount(account.id);
    }

    function purgeAccount(id) {
        G.state.trash.accounts = (G.state.trash.accounts || []).filter(function (a) { return a.id !== id; });
        G.save();
        G.render();
    }

    function restoreSheet(entryId) {
        const idx = (G.state.trash.sheets || []).findIndex(function (e) { return e.id === entryId; });
        if (idx < 0) return;
        const entry = G.state.trash.sheets.splice(idx, 1)[0];
        const account = G.findAccount(entry.accountId);
        if (account) {
            account.sheets.push(entry.sheet);
            if (!G.state.activeSheetByAccount[account.id]) {
                G.state.activeSheetByAccount[account.id] = entry.sheet.id;
            }
        }
        G.save();
        G.render();
    }

    function purgeSheet(entryId) {
        G.state.trash.sheets = (G.state.trash.sheets || []).filter(function (e) { return e.id !== entryId; });
        G.save();
        G.render();
    }

    function emptyTrash() {
        if (G.confirm && typeof G.confirm === 'function') {
            if (!G.confirm('Permanently delete everything in Trash?')) return;
        }
        G.state.trash = { accounts: [], sheets: [] };
        G.save();
        G.render();
    }

    G.showTrash = showTrash;
    G.hideTrash = hideTrash;
    G.restoreAccount = restoreAccount;
    G.purgeAccount = purgeAccount;
    G.restoreSheet = restoreSheet;
    G.purgeSheet = purgeSheet;
    G.emptyTrash = emptyTrash;
})(window.Krevo = window.Krevo || {});