(function (G) {
    'use strict';

    // ---------- Project tasks (live inside a project on Overview) ----------
    function projectTasks(accountId, projectId) {
        const a = G.findAccount(accountId);
        if (!a) return null;
        const overview = G.overviewOf(a);
        const p = overview && overview.projects.find(function (x) { return x.id === projectId; });
        return p ? p.tasks : null;
    }

    function addProjectTask(event, accountId, projectId) {
        if (event.key !== 'Enter') return;
        const value = event.target.value.trim();
        if (!value) return;
        const list = projectTasks(accountId, projectId);
        if (!list) return;
        list.push({ id: G.genId(), text: value, completed: false });
        G.save();
        G.render();
        event.target.value = '';
    }

    function toggleProjectTask(accountId, projectId, taskId) {
        const list = projectTasks(accountId, projectId);
        if (!list) return;
        const t = list.find(function (x) { return x.id === taskId; });
        if (!t) return;
        t.completed = !t.completed;
        G.save();
        G.render();
    }

    function deleteProjectTask(accountId, projectId, taskId) {
        const list = projectTasks(accountId, projectId);
        if (!list) return;
        const idx = list.findIndex(function (x) { return x.id === taskId; });
        if (idx < 0) return;
        list.splice(idx, 1);
        G.save();
        G.render();
    }

    function setProjectTaskText(accountId, projectId, taskId, text) {
        const list = projectTasks(accountId, projectId);
        if (!list) return;
        const t = list.find(function (x) { return x.id === taskId; });
        if (!t) return;
        t.text = text;
        G.save();
    }

    // ---------- Block tasks (custom-sheet To-Do blocks) ----------
    function block(accountId, sheetId, blockId) {
        const a = G.findAccount(accountId);
        const s = a && G.findSheet(a, sheetId);
        if (!s) return null;
        return s.blocks.find(function (b) { return b.id === blockId; });
    }

    function addBlockTask(event, accountId, sheetId, blockId) {
        if (event.key !== 'Enter') return;
        const value = event.target.value.trim();
        if (!value) return;
        const b = block(accountId, sheetId, blockId);
        if (!b) return;
        b.tasks.push({ id: G.genId(), text: value, completed: false });
        G.save();
        G.render();
        event.target.value = '';
    }

    function toggleBlockTask(accountId, sheetId, blockId, taskId) {
        const b = block(accountId, sheetId, blockId);
        if (!b) return;
        const t = b.tasks.find(function (x) { return x.id === taskId; });
        if (!t) return;
        t.completed = !t.completed;
        G.save();
        G.render();
    }

    function deleteBlockTask(accountId, sheetId, blockId, taskId) {
        const b = block(accountId, sheetId, blockId);
        if (!b) return;
        const idx = b.tasks.findIndex(function (x) { return x.id === taskId; });
        if (idx < 0) return;
        b.tasks.splice(idx, 1);
        G.save();
        G.render();
    }

    function setBlockTaskText(accountId, sheetId, blockId, taskId, text) {
        const b = block(accountId, sheetId, blockId);
        if (!b) return;
        const t = b.tasks.find(function (x) { return x.id === taskId; });
        if (!t) return;
        t.text = text;
        G.save();
    }

    G.addProjectTask = addProjectTask;
    G.toggleProjectTask = toggleProjectTask;
    G.deleteProjectTask = deleteProjectTask;
    G.setProjectTaskText = setProjectTaskText;

    G.addBlockTask = addBlockTask;
    G.toggleBlockTask = toggleBlockTask;
    G.deleteBlockTask = deleteBlockTask;
    G.setBlockTaskText = setBlockTaskText;
})(window.Krevo = window.Krevo || {});