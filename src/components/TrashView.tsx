import { useStoreActions, useStoreState } from "../state/store";
import { useUI } from "../state/ui";
import { useTasks } from "../features/tasks/tasksState";

export function TrashView() {
  const state = useStoreState();
  const { hideTrash, restoreAccount, purgeAccount, restoreSheet, purgeSheet, emptyTrash } = useStoreActions();
  const tasks = useTasks();
  const ui = useUI();

  const purgeAccountDeep = (id: string) => {
    purgeAccount(id);
    tasks.removeByLinks({ accountId: id });
  };
  const purgeSheetDeep = (entryId: string, sheetId: string) => {
    purgeSheet(entryId);
    tasks.removeByLinks({ sheetId });
  };
  const emptyTrashDeep = () => {
    for (const account of state.trash.accounts) tasks.removeByLinks({ accountId: account.id });
    for (const entry of state.trash.sheets) tasks.removeByLinks({ sheetId: entry.sheet.id });
    emptyTrash();
  };
  const empty = state.trash.accounts.length === 0 && state.trash.sheets.length === 0;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">Trash</h2>
        {state.trash.accounts.length + state.trash.sheets.length > 0 && (
          <button
            className="btn btn-danger-ghost"
            onClick={() => ui.confirm("Permanently delete everything in Trash?", emptyTrashDeep)}
          >
            Empty Trash
          </button>
        )}
      </div>

      {empty ? (
        <div className="text-[13px] text-dim py-8">Trash is empty. Deleted accounts and sheets appear here.</div>
      ) : (
        <>
          {state.trash.accounts.map((a) => (
            <div key={a.id} className="trash-row">
              <span className="kind">Account</span>
              <span className="flex-1 truncate">{a.name}</span>
              <button className="btn btn-ghost" onClick={() => restoreAccount(a.id)}>Restore</button>
              <button className="btn btn-danger-ghost" onClick={() => purgeAccountDeep(a.id)}>Delete</button>
            </div>
          ))}
          {state.trash.sheets.map((e) => (
            <div key={e.id} className="trash-row">
              <span className="kind">Sheet</span>
              <span className="flex-1 truncate">
                {e.sheet.name} <span className="text-dim">from {e.accountName}</span>
              </span>
              <button
                className="btn btn-ghost"
                disabled={!state.accounts.some((a) => a.id === e.accountId)}
                onClick={() => restoreSheet(e.id)}
              >
                Restore
              </button>
              <button className="btn btn-danger-ghost" onClick={() => purgeSheetDeep(e.id, e.sheet.id)}>Delete</button>
            </div>
          ))}
        </>
      )}

      <button className="btn btn-ghost mt-2" onClick={hideTrash}>Back to workspace</button>
    </div>
  );
}
