import { useStoreActions, useStoreState } from "../state/store";
import { useUI } from "../state/ui";
import { isOverview } from "../types";

export function SheetBar() {
  const state = useStoreState();
  const { activateSheet, deleteSheet, renameSheet } = useStoreActions();
  const ui = useUI();
  const account = state.accounts.find((a) => a.id === state.activeAccountId);
  if (!account || state.showTrash) return null;

  const activeSheetId = state.activeSheetByAccount[account.id] ?? null;

  return (
    <div className="h-9 shrink-0 flex items-center border-t hairline bg-panel px-1 overflow-x-auto">
      <div className="flex items-stretch h-full">
        {account.sheets.map((sheet) => {
          const on = sheet.id === activeSheetId;
          const overview = isOverview(sheet);
          return (
            <div
              key={sheet.id}
              className={"sheet-tab" + (on ? " active" : "")}
              onClick={() => activateSheet(account.id, sheet.id)}
            >
              <span className="max-w-[180px] truncate">{sheet.name}</span>
              {!overview && (
                <span
                  className="xi"
                  title="Sheet options"
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    ui.openMenu(r.right, r.bottom, [
                      {
                        label: "Rename",
                        action: () =>
                          ui.prompt("Rename sheet", "Sheet name", sheet.name, (v) => renameSheet(account.id, sheet.id, v), "Save"),
                      },
                      {
                        label: "Move to Trash",
                        danger: true,
                        action: () =>
                          ui.confirm("Move this sheet to Trash?", () => deleteSheet(account.id, sheet.id)),
                      },
                    ]);
                  }}
                >
                  ×
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="ml-1 px-2 text-dim hover:text-accent text-lg leading-none"
        title="New Sheet"
        onClick={() => ui.newSheet(account.id)}
      >
        +
      </button>
    </div>
  );
}
