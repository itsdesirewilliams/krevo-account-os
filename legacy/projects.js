(function (G) {
    'use strict';

    function overviewOf(accountId) {
        const a = G.findAccount(accountId);
        return a ? G.overviewOf(a) : null;
    }

    // Create a project from user-submitted, validated data (no fake defaults).
    function createProject(accountId, data) {
        const overview = overviewOf(accountId);
        if (!overview) return false;
        overview.projects.push({
            id: G.genId(),
            projectName: (data.projectName || '').trim(),
            eventName: (data.eventName || '').trim(),
            charges: (data.charges || '').trim(),
            eventDate: data.eventDate || '', // ISO yyyy-mm-dd
            tasks: []
        });
        G.save();
        G.render();
        return true;
    }

    // Inline autosave of a project field. No re-render so the caret survives.
    function setProjectField(accountId, projectId, field, value) {
        const overview = overviewOf(accountId);
        if (!overview) return;
        const p = overview.projects.find(function (x) { return x.id === projectId; });
        if (!p) return;
        if (field === 'projectName') p.projectName = value;
        else if (field === 'eventName') p.eventName = value;
        else if (field === 'charges') p.charges = value;
        else if (field === 'eventDate') p.eventDate = value;
        G.save();
    }

    function deleteProject(accountId, projectId) {
        const overview = overviewOf(accountId);
        if (!overview) return;
        overview.projects = overview.projects.filter(function (x) { return x.id !== projectId; });
        G.save();
        G.render();
    }

    G.createProject = createProject;
    G.setProjectField = setProjectField;
    G.deleteProject = deleteProject;
})(window.Krevo = window.Krevo || {});