(function (G) {
    'use strict';

    function createSheet(account, name) {
        const sheet = { id: G.genId(), name: (name || '').trim() || 'Untitled Sheet', blocks: [] };
        account.sheets.push(sheet);
        G.state.activeSheetByAccount[account.id] = sheet.id;
        G.save();
        G.render();
        return sheet;
    }

    function promptNewSheet(accountId) {
        const account = G.findAccount(accountId);
        if (!account) return;
        G.prompt('New Sheet', 'Sheet name', '', function (name) {
            createSheet(account, name);
        }, 'Create');
    }

    function activateSheet(accountId, sheetId) {
        G.state.activeSheetByAccount[accountId] = sheetId;
        G.save();
        G.render();
    }

    function renameSheet(accountId, sheetId, name) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (s && name.trim()) {
            s.name = name.trim();
            G.save();
            G.render();
        }
    }

    function promptRenameSheet(accountId, sheetId) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return;
        G.prompt('Rename sheet', 'Sheet name', s.name, function (name) {
            renameSheet(accountId, sheetId, name);
        }, 'Save');
    }

    // Delete a custom sheet (Overview, i.e. projects, cannot be deleted).
    function deleteSheet(accountId, sheetId) {
        const a = G.findAccount(accountId);
        if (!a) return;
        const idx = a.sheets.findIndex(function (s) { return s.id === sheetId; });
        if (idx < 0) return;
        const sheet = a.sheets[idx];
        // Never remove the last sheet, and never allow deleting the Overview (projects) sheet.
        if (a.sheets.length <= 1) return;
        if (Object.prototype.hasOwnProperty.call(sheet, 'projects')) return;
        a.sheets.splice(idx, 1);
        if (G.state.activeSheetByAccount[accountId] === sheetId) {
            G.state.activeSheetByAccount[accountId] = a.sheets[0].id;
        }
        G.state.trash.sheets.push({
            id: G.genId(),
            accountId: accountId,
            accountName: a.name,
            sheet: sheet
        });
        G.save();
        G.render();
    }

    function promptDeleteSheet(accountId, sheetId) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return;
        if (Object.prototype.hasOwnProperty.call(s, 'projects')) {
            G.alert('The Overview sheet cannot be deleted.');
            return;
        }
        if (G.confirm('Move this sheet to Trash?')) deleteSheet(accountId, sheetId);
    }

    // --- Freeform blocks (custom sheets) ---

    // Add a block of the given type ('notes' | 'todo'). Creation choices stay available.
    function addBlock(accountId, sheetId, type) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return;
        const id = G.genId();
        if (type === 'todo') s.blocks.push({ id: id, type: 'todo', tasks: [] });
        else s.blocks.push({ id: id, type: 'notes', text: '' });
        G.save();
        G.render();
    }

    function deleteBlock(accountId, sheetId, blockId) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return;
        s.blocks = s.blocks.filter(function (b) { return b.id !== blockId; });
        G.save();
        G.render();
    }

    // Block notes autosave.
    function setBlockNotes(accountId, sheetId, blockId, text) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return;
        const b = s.blocks.find(function (x) { return x.id === blockId; });
        if (b && b.type === 'notes') { b.text = text; G.save(); }
    }

    G.createSheet = createSheet;
    G.promptNewSheet = promptNewSheet;
    G.activateSheet = activateSheet;
    G.renameSheet = renameSheet;
    G.promptRenameSheet = promptRenameSheet;
    G.deleteSheet = deleteSheet;
    G.promptDeleteSheet = promptDeleteSheet;
    G.addBlock = addBlock;
    G.deleteBlock = deleteBlock;
    G.setBlockNotes = setBlockNotes;
})(window.Krevo = window.Krevo || {});