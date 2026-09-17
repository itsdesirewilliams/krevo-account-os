import { useStore } from "../state/store";
import { useUI } from "../state/ui";

export function TrashView() {
  const { state, hideTrash, restoreAccount, purgeAccount, restoreSheet, purgeSheet, emptyTrash } = useStore();
  const ui = useUI();
  const empty = state.trash.accounts.length === 0 && state.trash.sheets.length === 0;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold">Trash</h2>
        {state.trash.accounts.length + state.trash.sheets.length > 0 && (
          <button
            className="btn btn-danger-ghost"
            onClick={() => ui.confirm("Permanently delete everything in Trash?", emptyTrash)}
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
              <button className="btn btn-danger-ghost" onClick={() => purgeAccount(a.id)}>Delete</button>
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
              <button className="btn btn-danger-ghost" onClick={() => purgeSheet(e.id)}>Delete</button>
            </div>
          ))}
        </>
      )}

      <button className="btn btn-ghost mt-2" onClick={hideTrash}>Back to workspace</button>
    </div>
  );
}
