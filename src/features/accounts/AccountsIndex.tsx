import { useMemo, useState } from "react";
import { useStoreState } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import { balanceOf, overviewOf, paidOf, type AccountColorFilter } from "../../types";
import { Money } from "../../components/ui/Money";
import { Empty } from "../../components/ui/Empty";
import { SearchIcon } from "../../components/Icons";

const COLOR_FILTERS: { label: string; value: AccountColorFilter }[] = [
  { label: "All", value: "all" },
  { label: "Green", value: "green" },
  { label: "Yellow", value: "yellow" },
  { label: "Red", value: "red" },
  { label: "None", value: "none" },
];

/** The full client roster: a real table, filterable and searchable. */
export function AccountsIndex() {
  const state = useStoreState();
  const ui = useUI();
  const { selectAccount } = useNav();
  const [query, setQuery] = useState("");
  const [color, setColor] = useState<AccountColorFilter>("all");

  const rows = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return state.accounts
      .filter((account) => (color === "all" ? true : (account.color ?? "none") === color))
      .filter((account) => (needle ? account.name.toLowerCase().includes(needle) : true))
      .map((account) => {
        const overview = overviewOf(account);
        const projects = overview?.projects ?? [];
        const quoted = projects.reduce((sum, p) => sum + p.quotedAmount, 0);
        const collected = projects.reduce((sum, p) => sum + paidOf(p), 0);
        const outstanding = projects.reduce((sum, p) => sum + balanceOf(p), 0);
        return { account, projectCount: projects.length, quoted, collected, outstanding };
      })
      .sort((a, b) => a.account.name.localeCompare(b.account.name));
  }, [state.accounts, query, color]);

  return (
    <div className="page-wide">
      <div className="page-head">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-sub">
            {state.accounts.length} {state.accounts.length === 1 ? "client" : "clients"} ·{" "}
            {rows.length} shown
          </p>
        </div>
        <button className="btn btn-primary" onClick={ui.newAccount}>
          New account
        </button>
      </div>

      <div className="filter-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div className="seg" role="group" aria-label="Color filter">
          {COLOR_FILTERS.map((filter) => (
            <button
              key={filter.value}
              className={"seg-btn" + (color === filter.value ? " on" : "")}
              onClick={() => setColor(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", width: 240 }}>
          <span style={{ position: "absolute", left: 9, top: 7, color: "var(--text-3)" }}>
            <SearchIcon size={14} />
          </span>
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Filter accounts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {state.accounts.length === 0 ? (
        <Empty
          title="No accounts yet"
          sub="An account is a client workspace: projects, money and work in one place."
          action={
            <button className="btn btn-primary" onClick={ui.newAccount}>
              Create your first account
            </button>
          }
        />
      ) : rows.length === 0 ? (
        <Empty title="No accounts match" sub="Try a different search or color filter." mark={false} />
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Account</th>
              <th className="num">Projects</th>
              <th className="num">Quoted</th>
              <th className="num">Collected</th>
              <th className="num">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.account.id} className="clickable" onClick={() => selectAccount(row.account.id)}>
                <td>
                  <span className="flex items-center gap-2">
                    <span
                      className="nav-icon"
                      style={{
                        color:
                          row.account.color === "green"
                            ? "var(--ok)"
                            : row.account.color === "yellow"
                              ? "var(--warn)"
                              : row.account.color === "red"
                                ? "var(--danger)"
                                : "var(--text-3)",
                      }}
                    >
                      ●
                    </span>
                    <span className="t-strong">{row.account.name}</span>
                  </span>
                </td>
                <td className="num t-muted">{row.projectCount}</td>
                <td className="num"><Money value={row.quoted} /></td>
                <td className="num"><Money value={row.collected} /></td>
                <td className="num">
                  {row.outstanding > 0 ? (
                    <Money value={row.outstanding} tone="neg" />
                  ) : (
                    <span className="t-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
