import { useStoreActions, useStoreState } from "../state/store";
import { useUI } from "../state/ui";
import { useNav } from "../state/nav";
import { useTasks } from "../features/tasks/tasksState";
import { Empty } from "./ui/Empty";

/** Trash: recoverable accounts and sheets. Purging cascades to their tasks. */
export function TrashView() {
  const state = useStoreState();
  const { restoreAccount, purgeAccount, restoreSheet, purgeSheet, emptyTrash } = useStoreActions();
  const tasks = useTasks();
  const ui = useUI();
  const { setShowTrash } = useNav();

  const empty = state.trash.accounts.length === 0 && state.trash.sheets.length === 0;

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

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-sub">Deleted accounts and sheets are recoverable until purged.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!empty && (
            <button className="btn btn-danger" onClick={() => ui.confirm("Permanently delete everything in Trash?", emptyTrashDeep)}>
              Empty trash
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setShowTrash(false)}>
            Back to workspace
          </button>
        </div>
      </div>

      {empty ? (
        <Empty title="Trash is empty" sub="Deleted accounts and sheets appear here and can be restored." />
      ) : (
        <div className="list">
          {state.trash.accounts.map((account) => (
            <div key={account.id} className="list-row">
              <span className="chip">Account</span>
              <span className="grow">{account.name}</span>
              <button className="btn btn-ghost" onClick={() => restoreAccount(account.id)}>Restore</button>
              <button className="btn btn-danger" onClick={() => purgeAccountDeep(account.id)}>Delete</button>
            </div>
          ))}
          {state.trash.sheets.map((entry) => (
            <div key={entry.id} className="list-row">
              <span className="chip">Sheet</span>
              <span className="grow">
                {entry.sheet.name} <span className="faint">from {entry.accountName}</span>
              </span>
              <button className="btn btn-ghost" onClick={() => restoreSheet(entry.id)}>Restore</button>
              <button className="btn btn-danger" onClick={() => purgeSheetDeep(entry.id, entry.sheet.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
