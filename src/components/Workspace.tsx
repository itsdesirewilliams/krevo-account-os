import { useStoreActions, useStoreState } from "../state/store";
import { isOverview } from "../types";
import { OverviewSheet } from "./OverviewSheet";
import { CustomSheetView } from "./CustomSheet";

/**
 * The workspace is fully derived from the unique account ID.
 * App passes only `accountId`; the account record is looked up from the
 * store on every render, so nothing can go stale or leak across accounts.
 * (App additionally keys this component by account.id so uncontrolled
 * inputs remount with the correct account's data.)
 */
export function Workspace({ accountId }: { accountId: string }) {
  const state = useStoreState();
  const { renameAccount, setDescription } = useStoreActions();
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return null;

  const sheetId = state.activeSheetByAccount[account.id] ?? null;
  const sheet = account.sheets.find((s) => s.id === sheetId) ?? account.sheets[0];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {/* Account header: editable name + description (this account's record) */}
      <div key={account.id} className="px-6 pt-6 pb-2 max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">Account</div>
        <input
          className="account-name-input"
          defaultValue={account.name}
          onBlur={(e) => renameAccount(account.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
        <textarea
          className="account-desc"
          rows={2}
          placeholder="Add an account description..."
          defaultValue={account.description}
          onBlur={(e) => setDescription(account.id, e.target.value)}
        />
      </div>

      <div className="border-t hairline mt-3" />

      {/* key={sheet.id}: sheet content remounts when the active sheet changes */}
      {sheet && (
        <div key={sheet.id}>
          {isOverview(sheet) ? <OverviewSheet account={account} /> : <CustomSheetView account={account} sheet={sheet} />}
        </div>
      )}
    </div>
  );
}
