/*
 * UI layer: renders state into the DOM and wires interactions.
 * Reads Krevo.state; calls back into the data modules / render after changes.
 * All icons are inline SVG (ASCII only) to guarantee clean rendering.
 */
(function (G) {
    'use strict';

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = (str == null ? '' : String(str));
        return div.innerHTML;
    }

    // --- Inline SVG icons (ASCII) ---
    const ICON_FOLDER = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H7l2 2h7.5A1.5 1.5 0 0 1 18 7.5v7A1.5 1.5 0 0 1 16.5 16h-13A1.5 1.5 0 0 1 2 14.5z"/></svg>';
    const ICON_X = '<svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l8 8M14 6l-8 8"/></svg>';
    const ICON_MORE = '<svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><circle cx="6" cy="10" r="1.4"/><circle cx="10" cy="10" r="1.4"/><circle cx="14" cy="10" r="1.4"/></svg>';
    const ICON_TRASH = '<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h14M8 5V3.5A1.5 1.5 0 0 1 9.5 2h1A1.5 1.5 0 0 1 12 3.5V5M5 5l1 10a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l1-10"/></svg>';
    const ICON_CHECK = '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3.5 3.5L13 5"/></svg>';

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function renderSidebar() {
        const list = document.getElementById('account-list');
        const countEl = document.getElementById('trash-count');
        const trashCount = (G.state.trash.accounts || []).length + (G.state.trash.sheets || []).length;
        if (countEl) countEl.textContent = trashCount;

        if (G.state.accounts.length === 0) {
            list.innerHTML = '<div class="px-3 py-6 text-[12.5px] text-[color:var(--dim)]">No accounts yet.</div>';
            return;
        }

        list.innerHTML = G.state.accounts.map(function (a) {
            const active = !G.state.showTrash && G.state.activeAccountId === a.id;
            return '<div class="sidebar-item' + (active ? ' active' : '') + '" onclick="Krevo.openAccount(\'' + a.id + '\')">' +
                '<span class="ficon">' + ICON_FOLDER + '</span>' +
                '<span class="flex-1 truncate">' + esc(a.name) + '</span>' +
                '<span class="chev" title="Options" onclick="event.stopPropagation(); Krevo.accountMenu(event,\'' + a.id + '\')">' + ICON_MORE + '</span>' +
                '</div>';
        }).join('');
    }

    function renderTabs() {
        const tabs = document.getElementById('account-tabs');
        const activeId = !G.state.showTrash ? G.state.activeAccountId : null;

        if (!G.state.openTabs.length) {
            tabs.innerHTML = '<div class="px-4 self-center text-[12px] text-[color:var(--dim)]">No open accounts</div>';
            return;
        }
        tabs.innerHTML = G.state.openTabs.map(function (id) {
            const a = G.findAccount(id);
            if (!a) return '';
            const on = activeId === id;
            return '<div class="ide-tab' + (on ? ' active' : '') + '" onclick="Krevo.openAccount(\'' + a.id + '\')">' +
                '<span class="truncate max-w-[180px]">' + esc(a.name) + '</span>' +
                '<span class="xi" title="Close tab" onclick="event.stopPropagation(); Krevo.closeTab(\'' + a.id + '\')">' + ICON_X + '</span>' +
                '</div>';
        }).join('');
    }

    function renderSheetBar() {
        const tabs = document.getElementById('sheet-tabs');
        const bar = document.getElementById('sheet-bar');
        const newBtn = document.getElementById('new-sheet-btn');

        if (G.state.showTrash || !G.state.activeAccountId) {
            bar.style.display = 'none';
            tabs.innerHTML = '';
            return;
        }
        bar.style.display = 'flex';
        if (newBtn) newBtn.style.display = 'inline-block';

        const account = G.findAccount(G.state.activeAccountId);
        if (!account) { tabs.innerHTML = ''; return; }
        const activeSheetId = G.state.activeSheetByAccount[account.id];

        tabs.innerHTML = account.sheets.map(function (s) {
            const on = s.id === activeSheetId;
            const isOverview = Object.prototype.hasOwnProperty.call(s, 'projects');
            const menuIcon = isOverview ? '' :
                '<span class="xi" title="Options" onclick="event.stopPropagation(); Krevo.sheetMenu(event,\'' + account.id + '\',\'' + s.id + '\')">' + ICON_MORE + '</span>';
            return '<div class="sheet-tab' + (on ? ' active' : '') + '" onclick="Krevo.activateSheet(\'' + account.id + '\',\'' + s.id + '\')">' +
                '<span class="truncate max-w-[160px]">' + esc(s.name) + '</span>' + menuIcon +
                '</div>';
        }).join('');
    }

    G.renderChrome = function () {
        renderSidebar();
        renderTabs();
        renderSheetBar();
    };

    G.render = function () {
        G.renderChrome();
        renderContent();
        if (G._openProject) renderProjectModal();
    };

    // Account header shared at the top of every sheet: name + editable description
    function accountHeader(account) {
        const descEmpty = !(account.description || '').trim();
        return '<div class="pb-5 border-b hairline mb-5">' +
            '<div class="field-label" style="width:auto;margin-bottom:6px">Account</div>' +
            '<div class="text-2xl font-semibold text-[color:var(--text)] editable" contenteditable="true" ' +
            'oninput="Krevo.renameAccount(\'' + account.id + '\', this.innerText)">' + esc(account.name) + '</div>' +
            '<div class="mt-1 text-[13px] text-[color:var(--dim)] editable desc' + (descEmpty ? ' empty' : '') + '" contenteditable="true" ' +
            'oninput="this.classList.toggle(\'empty\', !this.innerText.trim()); Krevo.setDescription(\'' + account.id + '\', this.innerText)">' + esc(account.description) + '</div>' +
            '</div>';
    }

    // --- Project task rows (used in the Project modal) ---
    function projectTaskRow(accountId, projectId, t) {
        return '<div class="task-row">' +
            '<button class="check' + (t.completed ? ' on' : '') + '" onclick="Krevo.toggleProjectTask(\'' + accountId + '\',\'' + projectId + '\',\'' + t.id + '\')" aria-label="toggle">' + ICON_CHECK + '</button>' +
            '<span class="task-text' + (t.completed ? ' done' : '') + '" contenteditable="true" ' +
            'oninput="Krevo.setProjectTaskText(\'' + accountId + '\',\'' + projectId + '\',\'' + t.id + '\', this.innerText)">' + esc(t.text) + '</span>' +
            '<span class="task-del light" onclick="Krevo.deleteProjectTask(\'' + accountId + '\',\'' + projectId + '\',\'' + t.id + '\')">' + ICON_TRASH + '</span>' +
            '</div>';
    }

    // --- Block task rows (used on custom To-Do blocks) ---
    function blockTaskRow(accountId, sheetId, blockId, t) {
        return '<div class="task-row">' +
            '<button class="check' + (t.completed ? ' on' : '') + '" onclick="Krevo.toggleBlockTask(\'' + accountId + '\',\'' + sheetId + '\',\'' + blockId + '\',\'' + t.id + '\')" aria-label="toggle">' + ICON_CHECK + '</button>' +
            '<span class="task-text' + (t.completed ? ' done' : '') + '" contenteditable="true" ' +
            'oninput="Krevo.setBlockTaskText(\'' + accountId + '\',\'' + sheetId + '\',\'' + blockId + '\',\'' + t.id + '\', this.innerText)">' + esc(t.text) + '</span>' +
            '<span class="task-del" onclick="Krevo.deleteBlockTask(\'' + accountId + '\',\'' + sheetId + '\',\'' + blockId + '\',\'' + t.id + '\')">' + ICON_TRASH + '</span>' +
            '</div>';
    }

    // --- Overview: project summary card (clickable, no tasks shown) ---
    function projectCard(account, project) {
        const title = esc(project.projectName) || 'Untitled Project';
        const parts = [];
        if (project.eventName) parts.push(esc(project.eventName));
        if (project.charges) parts.push(esc(project.charges));
        const fd = formatDate(project.eventDate);
        if (fd) parts.push(esc(fd));
        const meta = parts.length ? parts.join('  /  ') : esc('No details yet');

        return '<div class="project-card" onclick="Krevo.openProject(\'' + account.id + '\',\'' + project.id + '\')">' +
            '<div class="project-card-title">' + title + '</div>' +
            (meta ? '<div class="project-card-meta">' + meta + '</div>' : '') +
            '</div>';
    }

    function overviewContent(account, overview) {
        const header =
            '<div class="flex items-center justify-between gap-3 mb-1">' +
            '<h1 class="text-[13px] font-semibold tracking-[0.08em] uppercase text-[color:var(--accent)]">Projects</h1>' +
            '<button class="btn btn-ghost text-[12.5px]" onclick="Krevo.openNewProject(\'' + account.id + '\')"><span class="text-base leading-none mr-1">+</span>Add Project</button>' +
            '</div>';

        const list = (overview.projects && overview.projects.length)
            ? overview.projects.map(function (p) { return projectCard(account, p); }).join('')
            : '<div class="text-[13px] text-[color:var(--dim)] py-2">No projects yet. Add your first project to this account.</div>';

        return '<div class="max-w-3xl mx-auto px-6 py-6">' +
            accountHeader(account) +
            header +
            '<div class="mt-3 space-y-3">' + list + '</div>' +
            '</div>';
    }

    // --- Custom-sheet freeform blocks ---
    function notesBlock(account, sheet, b) {
        return '<div class="block panel">' +
            '<div class="block-head">' +
            '<span class="section-title" style="margin:0">Notes</span>' +
            '<button class="icon-btn" title="Delete block" onclick="Krevo.deleteBlock(\'' + account.id + '\',\'' + sheet.id + '\',\'' + b.id + '\')">' + ICON_TRASH + '</button>' +
            '</div>' +
            '<textarea class="input" rows="3" placeholder="Write something..." ' +
            'oninput="Krevo.setBlockNotes(\'' + account.id + '\',\'' + sheet.id + '\',\'' + b.id + '\', this.value)">' + esc(b.text) + '</textarea>' +
            '</div>';
    }

    function todoBlock(accountId, sheetId, b) {
        const rows = (b.tasks || []).map(function (t) { return blockTaskRow(accountId, sheetId, b.id, t); }).join('')
            || '<div class="text-[12.5px] text-[color:var(--dim)] py-1">No tasks yet.</div>';
        return '<div class="block panel">' +
            '<div class="block-head">' +
            '<span class="section-title" style="margin:0">To-Do</span>' +
            '<button class="icon-btn" title="Delete block" onclick="Krevo.deleteBlock(\'' + account.id + '\',\'' + sheet.id + '\',\'' + b.id + '\')">' + ICON_TRASH + '</button>' +
            '</div>' +
            rows +
            '<input type="text" class="input add-task-input" placeholder="Add a task..." ' +
            'onkeydown="Krevo.addBlockTask(event,\'' + accountId + '\',\'' + sheetId + '\',\'' + b.id + '\')">' +
            '</div>';
    }

    function customSheet(account, sheet) {
        // Creation controls remain available no matter how many blocks exist.
        const actions =
            '<div class="flex gap-2">' +
            '<button class="btn btn-ghost" onclick="Krevo.addBlock(\'' + account.id + '\',\'' + sheet.id + '\',\'notes\')"><span class="text-base leading-none mr-1">+</span>Add Notes</button>' +
            '<button class="btn btn-ghost" onclick="Krevo.addBlock(\'' + account.id + '\',\'' + sheet.id + '\',\'todo\')"><span class="text-base leading-none mr-1">+</span>Create To-Do</button>' +
            '</div>';

        const blocks = (sheet.blocks || []).map(function (b) {
            return b.type === 'todo' ? todoBlock(account.id, sheet.id, b) : notesBlock(account.id, sheet.id, b);
        }).join('');

        return '<div class="max-w-3xl mx-auto px-6 py-6">' +
            accountHeader(account) +
            '<div class="mb-5">' + actions + '</div>' +
            (blocks ? '<div class="mt-2 space-y-4">' + blocks + '</div>'
                : '<div class="mt-6 text-[13px] text-[color:var(--dim)]">This sheet is blank. Add notes or a to-do list to get started.</div>') +
            '</div>';
    }

    function renderContent() {
        const content = document.getElementById('content-area');

        if (G.state.showTrash) {
            content.innerHTML = trashView();
            return;
        }

        if (!G.state.activeAccountId) {
            content.innerHTML =
                '<div class="h-full flex flex-col items-center justify-center gap-2 text-center px-8">' +
                '<div class="text-[15px] font-semibold text-[color:var(--dim)]">No account open</div>' +
                '<div class="text-[13px] text-[color:var(--dim)] mb-3">Open an account from the sidebar or create one to start.</div>' +
                '<button class="btn btn-primary" onclick="Krevo.newAccount()">+ New Account</button>' +
                '</div>';
            return;
        }

        const account = G.findAccount(G.state.activeAccountId);
        if (!account) { content.innerHTML = ''; return; }

        let sheetId = G.state.activeSheetByAccount[account.id];
        const sheet = account.sheets.find(function (s) { return s.id === sheetId; }) || account.sheets[0];
        if (sheet && sheetId !== sheet.id) {
            G.state.activeSheetByAccount[account.id] = sheet.id;
            G.save();
        }
        if (!sheet) { content.innerHTML = ''; return; }

        if (Object.prototype.hasOwnProperty.call(sheet, 'projects')) {
            content.innerHTML = overviewContent(account, sheet);
        } else {
            content.innerHTML = customSheet(account, sheet);
        }
    }

    function trashView() {
        const acc = (G.state.trash.accounts || []);
        const sheets = (G.state.trash.sheets || []);

        if (!acc.length && !sheets.length) {
            return '<div class="max-w-2xl mx-auto px-6 py-8 text-[13px] text-[color:var(--dim)]">Trash is empty.</div>';
        }

        const accRows = acc.map(function (a) {
            return '<div class="trash-row">' +
                '<span class="kind">Account</span>' +
                '<span class="flex-1 truncate">' + esc(a.name) + '</span>' +
                '<button class="btn text-[12px]" onclick="Krevo.restoreAccount(\'' + a.id + '\')">Restore</button>' +
                '<button class="btn btn-danger-ghost text-[12px]" onclick="Krevo.purgeAccount(\'' + a.id + '\')">Delete</button>' +
                '</div>';
        }).join('');

        const sheetRows = sheets.map(function (e) {
            return '<div class="trash-row">' +
                '<span class="kind">Sheet</span>' +
                '<span class="flex-1 truncate">' + esc(e.accountName) + ' / ' + esc(e.sheet.name) + '</span>' +
                '<button class="btn text-[12px]" onclick="Krevo.restoreSheet(\'' + e.id + '\')">Restore</button>' +
                '<button class="btn btn-danger-ghost text-[12px]" onclick="Krevo.purgeSheet(\'' + e.id + '\')">Delete</button>' +
                '</div>';
        }).join('');

        return '<div class="max-w-2xl mx-auto px-6 py-8">' +
            '<div class="flex items-center justify-between mb-4">' +
            '<h2 class="text-lg font-semibold text-[color:var(--text)]">Trash</h2>' +
            '<button class="btn btn-danger-ghost text-[12.5px]" onclick="Krevo.emptyTrash()">Empty Trash</button>' +
            '</div>' +
            accRows + sheetRows +
            '</div>';
    }

    /* ---- Modal plumbing ---- */
    function closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    }
    G.closePrompt = closeModal;

    // Simple one-field prompt (accounts/sheets).
    function prompt(title, label, initial, onSubmit, submitText) {
        const submitLabel = submitText || 'Create';
        const safeInit = esc(initial || '');
        const c = document.getElementById('modal-container');
        c.innerHTML =
            '<div class="overlay" onclick="Krevo.closePrompt()">' +
            '<div class="modal" onclick="event.stopPropagation()">' +
            '<div class="modal-title">' + esc(title) + '</div>' +
            '<label class="modal-label">' + esc(label) + '</label>' +
            '<input id="kref-input" type="text" class="input" value="' + safeInit + '" autofocus>' +
            '<div class="flex justify-end gap-2 mt-4">' +
            '<button class="btn" onclick="Krevo.closePrompt()">Cancel</button>' +
            '<button class="btn btn-primary" id="kref-ok">' + esc(submitLabel) + '</button>' +
            '</div></div></div>';

        const input = document.getElementById('kref-input');
        input.focus();
        input.select();

        function submit() {
            const value = input.value.trim();
            if (value) { closeModal(); onSubmit(value); }
        }
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') submit();
            else if (e.key === 'Escape') closeModal();
        });
        document.getElementById('kref-ok').addEventListener('click', submit);
    }

    /* ---- New Project form (multi-field modal, native date picker) ---- */
    G.openNewProject = function (accountId) {
        const c = document.getElementById('modal-container');
        c.innerHTML =
            '<div class="overlay" onclick="Krevo.closePrompt()">' +
            '<div class="modal modal-wide" onclick="event.stopPropagation()">' +
            '<div class="modal-title">New Project</div>' +
            '<form id="new-project-form">' +
            fieldRow('Project Name', 'text', 'np-projectName') +
            fieldRow('Event Name', 'text', 'np-eventName') +
            fieldRow('Charges', 'text', 'np-charges') +
            '<div class="field-form">' +
            '<label class="modal-label">Event Date</label>' +
            '<input id="np-eventDate" type="date" class="input">' +
            '</div>' +
            '<div class="flex justify-end gap-2 mt-5">' +
            '<button type="button" class="btn" onclick="Krevo.closePrompt()">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">Create Project</button>' +
            '</div>' +
            '</form>' +
            '</div></div>';

        function fieldRow(label, type, id) {
            return '<div class="field-form">' +
                '<label class="modal-label">' + esc(label) + '</label>' +
                '<input id="' + id + '" type="' + type + '" class="input" autofocus>' +
                '</div>';
        }

        const form = document.getElementById('new-project-form');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const data = {
                projectName: document.getElementById('np-projectName').value,
                eventName: document.getElementById('np-eventName').value,
                charges: document.getElementById('np-charges').value,
                eventDate: document.getElementById('np-eventDate').value
            };
            if (!data.projectName.trim()) {
                document.getElementById('np-projectName').focus();
                return;
            }
            closeModal();
            G.createProject(accountId, data);
        });
        document.getElementById('np-projectName').focus();
    };

    G.prompt = prompt;
    G.alert = function (msg) { if (window.alert) window.alert(msg); };
    G.confirm = function (msg) { return window.confirm ? window.confirm(msg) : true; };

    /* ---- Project modal (clicked from Overview, dimmed overlay) ---- */
    G.closeProject = function () {
        G._openProject = null;
        closeModal();
    };

    function renderProjectModal() {
        if (!G._openProject) return;
        const account = G.findAccount(G._openProject.accountId);
        const overview = account && G.overviewOf(account);
        const p = overview && overview.projects.find(function (x) { return x.id === G._openProject.projectId; });
        if (!overview || !p) { G._openProject = null; return; }

        const rows = (p.tasks || []).map(function (t) { return projectTaskRow(account.id, p.id, t); }).join('')
            || '<div class="text-[12.5px] text-[color:var(--dim)] py-1">No tasks yet.</div>';
        const fd = formatDate(p.eventDate);

        const c = document.getElementById('modal-container');
        c.innerHTML =
            '<div class="overlay" onclick="Krevo.closeProject()">' +
            '<div class="modal modal-project" onclick="event.stopPropagation()">' +
            '<div class="flex items-start justify-between gap-3 mb-2">' +
            '<div class="project-card-title text-[15px] editable" contenteditable="true" ' +
            'oninput="Krevo.setProjectField(\'' + account.id + '\',\'' + p.id + '\',\'projectName\', this.innerText)">' + esc(p.projectName) + '</div>' +
            '<button class="icon-btn" title="Close" onclick="Krevo.closeProject()">' + ICON_X + '</button>' +
            '</div>' +
            '<div class="field-row"><span class="field-label">Event Name</span>' +
            '<span class="field-value editable" contenteditable="true" ' +
            'oninput="Krevo.setProjectField(\'' + account.id + '\',\'' + p.id + '\',\'eventName\', this.innerText)">' + esc(p.eventName) + '</span></div>' +
            '<div class="field-row"><span class="field-label">Charges</span>' +
            '<span class="field-value editable" contenteditable="true" ' +
            'oninput="Krevo.setProjectField(\'' + account.id + '\',\'' + p.id + '\',\'charges\', this.innerText)">' + esc(p.charges) + '</span></div>' +
            '<div class="field-row"><span class="field-label">Event Date</span>' +
            '<input type="date" class="input inline" value="' + esc(p.eventDate) + '" ' +
            'onchange="Krevo.setProjectField(\'' + account.id + '\',\'' + p.id + '\',\'eventDate\', this.value)">' +
            (fd ? '<span class="formatted-date">' + esc(fd) + '</span>' : '') +
            '</div>' +
            '<div class="border-t hairline my-3 pt-3">' +
            '<div class="section-title" style="margin-bottom:6px">To-Do</div>' +
            rows +
            '<input type="text" class="input add-task-input" placeholder="+ Add Task" ' +
            'onkeydown="Krevo.addProjectTask(event,\'' + account.id + '\',\'' + p.id + '\')">' +
            '</div>' +
            '<div class="flex justify-end mt-4">' +
            '<button class="btn btn-danger-ghost text-[12.5px]" onclick="Krevo.deleteProject(\'' + account.id + '\',\'' + p.id + '\')">Delete Project</button>' +
            '</div>' +
            '</div></div>';
    }

    G.openProject = function (accountId, projectId) {
        G._openProject = { accountId: accountId, projectId: projectId };
        renderProjectModal();
        render(); // refresh chrome/content; modal repainted at the end
    };

    // --- Context menu ---
    function removeMenu() {
        const m = document.querySelector('.menu');
        if (m) m.remove();
        document.removeEventListener('click', handleDocClick);
    }
    function handleDocClick(e) { if (!e.target.closest('.menu')) removeMenu(); }
    function showMenu(x, y, items) {
        removeMenu();
        const menu = document.createElement('div');
        menu.className = 'menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        items.forEach(function (it) {
            const div = document.createElement('div');
            div.className = 'menu-item' + (it.danger ? ' danger' : '');
            div.textContent = it.label;
            div.addEventListener('click', function () { menu.remove(); it.action(); });
            menu.appendChild(div);
        });
        document.body.appendChild(menu);
        setTimeout(function () { document.addEventListener('click', handleDocClick); }, 0);
    }

    G.accountMenu = function (event, id) {
        const r = event.currentTarget.getBoundingClientRect();
        event.stopPropagation();
        showMenu(r.right, r.bottom, [
            { label: 'Rename', action: function () { G.promptRenameAccount(id); } },
            { label: 'Move to Trash', danger: true, action: function () {
                if (G.confirm('Move this account and its sheets to Trash?')) G.moveAccountToTrash(id);
            } }
        ]);
    };

    G.sheetMenu = function (event, accountId, sheetId) {
        const r = event.currentTarget.getBoundingClientRect();
        event.stopPropagation();
        showMenu(r.right, r.bottom, [
            { label: 'Rename', action: function () { G.promptRenameSheet(accountId, sheetId); } },
            { label: 'Move to Trash', danger: true, action: function () { G.promptDeleteSheet(accountId, sheetId); } }
        ]);
    };

    G.newAccount = function () {
        G.prompt('New Account', 'Account name', '', function (name) { G.createAccount(name); }, 'Create');
    };

    G.wire = function () {
        const b = document.getElementById('new-account-btn');
        if (b && !b.dataset.wired) {
            b.dataset.wired = '1';
            b.addEventListener('click', G.newAccount);
        }
        const t = document.getElementById('trash-btn');
        if (t && !t.dataset.wired) {
            t.dataset.wired = '1';
            t.addEventListener('click', function () {
                if (G.state.showTrash) G.hideTrash(); else G.showTrash();
            });
        }
        const ns = document.getElementById('new-sheet-btn');
        if (ns && !ns.dataset.wired) {
            ns.dataset.wired = '1';
            ns.addEventListener('click', function () { G.promptNewSheet(G.state.activeAccountId); });
        }
    };
})(window.Krevo = window.Krevo || {});