import { useStoreActions, useStoreState } from "../state/store";
import { CloseIcon } from "./Icons";

export function AccountTabs() {
  const state = useStoreState();
  const { closeTab, openAccount } = useStoreActions();
  const activeId = !state.showTrash ? state.activeAccountId : null;

  return (
    <div className="h-9 shrink-0 flex items-stretch border-b hairline bg-panel overflow-x-auto">
      {state.openTabs.length === 0 ? (
        <div className="px-4 self-center text-[12px] text-dim">No open accounts</div>
      ) : (
        state.openTabs.map((id) => {
          const account = state.accounts.find((a) => a.id === id);
          if (!account) return null;
          const on = activeId === id;
          return (
            <div
              key={id}
              className={"ide-tab" + (on ? " active" : "")}
              onClick={() => openAccount(id)}
            >
              <span className="max-w-[200px] truncate">{account.name}</span>
              <span
                className="xi"
                title="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(id);
                }}
              >
                <CloseIcon />
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
