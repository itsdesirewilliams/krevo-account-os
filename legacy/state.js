/*
 * State container + persistence glue.
 * Owns the single mutable application state. Data modules read/write
 * Krevo.state and call Krevo.save() after every mutation, and Krevo.render()
 * (or renderChrome) to refresh the UI.
 *
 * Data shape (V3):
 *   state.accounts: [ { id, name, description, sheets: [ sheet ] } ]
 *     Overview sheet -> { id, name, projects: [ Project ] }
 *       Project       -> { id, projectName, eventName, charges, eventDate(ISO), tasks: [Task] }
 *     Custom sheet   -> { id, name, blocks: [ Block ] }
 *       Block         -> { id, type: 'notes'|'todo', text?, tasks? }
 *   state.trash:     { accounts: [...Account], sheets: [{ id, accountId, accountName, sheet }] }
 *   state.openTabs:  [accountId]
 *   state.activeAccountId: accountId | null
 *   state.showTrash: boolean
 *   state.activeSheetByAccount: { accountId: sheetId }
 */
(function (G) {
    'use strict';

    G.genId = function () {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    };

    function defaultState() {
        return {
            accounts: [],
            trash: { accounts: [], sheets: [] },
            openTabs: [],
            activeAccountId: null,
            showTrash: false,
            activeSheetByAccount: {}
        };
    }

    // Normalize a project (Overview children).
    function normalizeProject(p) {
        p.id = p.id || G.genId();
        p.projectName = p.projectName == null ? (p.eventName || '') : p.projectName;
        p.eventName = p.eventName == null ? '' : p.eventName;
        p.charges = p.charges == null ? '' : p.charges;
        p.eventDate = p.eventDate == null ? '' : p.eventDate; // ISO yyyy-mm-dd
        p.tasks = Array.isArray(p.tasks) ? p.tasks : [];
        p.tasks.forEach(function (t) {
            t.id = t.id || G.genId();
            t.text = t.text == null ? '' : t.text;
            t.completed = !!t.completed;
        });
        return p;
    }

    // Normalize a block (notes / to-do) on a custom sheet.
    function normalizeBlock(b) {
        b.id = b.id || G.genId();
        if (b.type === 'notes') {
            b.text = b.text == null ? '' : b.text;
        } else if (b.type === 'todo' || b.type === 'task') {
            b.type = 'todo';
            b.tasks = Array.isArray(b.tasks) ? b.tasks : [];
            b.tasks.forEach(function (t) {
                t.id = t.id || G.genId();
                t.text = t.text == null ? '' : t.text;
                t.completed = !!t.completed;
            });
        } else {
            b.type = 'notes'; // default
            b.text = b.text == null ? '' : b.text;
        }
        return b;
    }

    // Ensure every sheet matches the V3 model (overview vs custom freeform).
    function normalizeSheet(s) {
        if (!s || typeof s !== 'object') return s;
        s.id = s.id || G.genId();
        s.name = s.name == null ? 'Untitled' : s.name;
        if (Object.prototype.hasOwnProperty.call(s, 'projects')) {
            s.projects = Array.isArray(s.projects) ? s.projects.map(normalizeProject) : [];
        } else {
            // custom freeform sheet -> blocks array
            if (!Array.isArray(s.blocks)) s.blocks = [];
            // Migrate V2 legacy: a sheet may have carried notes/tasks directly.
            if (s.notes != null) {
                s.blocks.push({ id: G.genId(), type: 'notes', text: s.notes });
            }
            if (Array.isArray(s.tasks) && s.tasks.length) {
                s.blocks.push({ id: G.genId(), type: 'todo', tasks: s.tasks });
            }
            if (Object.prototype.hasOwnProperty.call(s, 'notes')) delete s.notes;
            if (Object.prototype.hasOwnProperty.call(s, 'tasks')) delete s.tasks;
            s.blocks = s.blocks.map(normalizeBlock);
        }
        return s;
    }
    function normalize(st) {
        if (!st || typeof st !== 'object') st = defaultState();
        st.trash = st.trash && typeof st.trash === 'object' ? st.trash : { accounts: [], sheets: [] };
        if (!Array.isArray(st.trash.accounts)) st.trash.accounts = [];
        if (!Array.isArray(st.trash.sheets)) st.trash.sheets = [];
        st.accounts = Array.isArray(st.accounts) ? st.accounts : [];
        st.accounts.forEach(function (a) {
            a.id = a.id || G.genId();
            a.name = a.name == null ? 'Untitled' : a.name;
            a.description = a.description == null ? '' : a.description;
            a.sheets = Array.isArray(a.sheets) ? a.sheets.map(normalizeSheet) : [];
        });
        st.openTabs = Array.isArray(st.openTabs) ? st.openTabs : [];
        st.activeAccountId = st.activeAccountId || null;
        st.showTrash = !!st.showTrash;
        st.activeSheetByAccount = st.activeSheetByAccount || {};
        // Drop stale references.
        st.openTabs = st.openTabs.filter(function (id) { return st.accounts.some(function (a) { return a.id === id; }); });
        if (st.activeAccountId && !st.accounts.some(function (a) { return a.id === st.activeAccountId; })) {
            st.activeAccountId = st.openTabs[st.openTabs.length - 1] || null;
        }
        Object.keys(st.activeSheetByAccount).forEach(function (accountId) {
            const a = st.accounts.find(function (x) { return x.id === accountId; });
            if (!a) { delete st.activeSheetByAccount[accountId]; return; }
            if (!a.sheets.some(function (s) { return s.id === st.activeSheetByAccount[accountId]; })) {
                st.activeSheetByAccount[accountId] = a.sheets.length ? a.sheets[0].id : null;
            }
        });
        return st;
    }

    G.load = function () {
        const data = G.Storage.get(G.STORAGE_KEY);
        G.state = normalize(data);
    };

    G.save = function () {
        G.Storage.set(G.STORAGE_KEY, G.state);
    };

    G.findAccount = function (id) {
        return (G.state.accounts || []).find(function (a) { return a.id === id; });
    };
    G.findSheet = function (account, sheetId) {
        if (!account) return null;
        return account.sheets.find(function (s) { return s.id === sheetId; });
    };
    // The Overview sheet is the one that carries projects.
    G.overviewOf = function (account) {
        if (!account) return null;
        return account.sheets.find(function (s) {
            return Object.prototype.hasOwnProperty.call(s, 'projects');
        }) || (account.sheets.length ? account.sheets[0] : null);
    };

    G.STORAGE_KEY = 'krevo_state_v2';
})(window.Krevo = window.Krevo || {});