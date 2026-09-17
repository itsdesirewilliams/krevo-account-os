(function (G) {
    'use strict';

    function createAccount(name) {
        const overview = { id: G.genId(), name: 'Overview', projects: [] };
        const account = { id: G.genId(), name: (name || '').trim() || 'Untitled Account', description: '', sheets: [overview] };
        G.state.accounts.push(account);
        G.state.activeSheetByAccount[account.id] = overview.id;
        openAccount(account.id);
        return account;
    }

    function openAccount(id) {
        if (!G.state.openTabs.includes(id)) G.state.openTabs.push(id);
        G.state.activeAccountId = id;
        G.state.showTrash = false;
        G.save();
        G.render();
    }

    function closeTab(id) {
        G.state.openTabs = G.state.openTabs.filter(function (t) { return t !== id; });
        if (G.state.activeAccountId === id) {
            G.state.activeAccountId = G.state.openTabs[G.state.openTabs.length - 1] || null;
        }
        G.save();
        G.render();
    }

    // Autosave inline rename of account name (no full re-render so caret survives).
    function renameAccount(id, name) {
        const a = G.findAccount(id);
        if (a && name.trim()) {
            a.name = name.trim();
            G.save();
            G.renderChrome();
        }
    }

    // Autosave inline edit of account description.
    function setDescription(id, text) {
        const a = G.findAccount(id);
        if (a) {
            a.description = text;
            G.save();
        }
    }

    function renameAccountModal(id) {
        const a = G.findAccount(id);
        if (!a) return;
        G.prompt('Rename Account', 'Account name', a.name, function (name) {
            renameAccount(id, name);
        }, 'Save');
    }

    function moveAccountToTrash(id) {
        const idx = (G.state.accounts || []).findIndex(function (a) { return a.id === id; });
        if (idx < 0) return;
        const account = G.state.accounts.splice(idx, 1)[0];
        G.state.openTabs = G.state.openTabs.filter(function (t) { return t !== id; });
        if (G.state.activeAccountId === id) {
            G.state.activeAccountId = G.state.openTabs[G.state.openTabs.length - 1] || null;
        }
        delete G.state.activeSheetByAccount[id];
        // Remove any sheet-trash entries that belonged to this account.
        G.state.trash.sheets = (G.state.trash.sheets || []).filter(function (e) { return e.accountId !== id; });
        G.state.trash.accounts.push(account);
        G.save();
        G.render();
    }

    G.createAccount = createAccount;
    G.openAccount = openAccount;
    G.closeTab = closeTab;
    G.renameAccount = renameAccount;
    G.setDescription = setDescription;
    G.promptRenameAccount = renameAccountModal;
    G.moveAccountToTrash = moveAccountToTrash;
})(window.Krevo = window.Krevo || {});