import { describe, expect, it } from "vitest";
import { first, present } from "../test-utils/assert";
import { defaultState, normalize } from "./normalize";
import { isOverview, overviewOf } from "../types";

/* Legacy (V2) payload: sheets carried notes/tasks directly. */
const legacy = {
  accounts: [
    {
      id: "acc1",
      name: "JK Entertainment",
      sheets: [
        {
          id: "ov1",
          name: "Overview",
          projects: [
            {
              id: "p1",
              eventName: "Summer Gala",
              charges: "25000",
              eventDate: "2026-10-29",
              tasks: [{ id: "t1", text: "Receive details", completed: true }],
            },
          ],
        },
        {
          id: "sh1",
          name: "Content",
          notes: "Client information",
          tasks: [{ id: "t2", text: "Create poster", completed: false }],
        },
      ],
    },
  ],
  openTabs: ["acc1", "ghost"],
  activeAccountId: "acc1",
  activeSheetByAccount: { acc1: "sh1", gone: "x" },
  trash: { accounts: [], sheets: [] },
};

describe("normalize - legacy migration", () => {
  const st = normalize(legacy);
  const account = first(st.accounts);

  it("keeps the account with its id and name", () => {
    expect(st.accounts.length).toBe(1);
    expect(account.name).toBe("JK Entertainment");
  });

  it("derives projectName from eventName", () => {
    const project = first(present(overviewOf(account)).projects);
    expect(project.projectName).toBe("Summer Gala");
    expect(project.eventDate).toBe("2026-10-29");
    expect(first(project.tasks).completed).toBe(true);
  });

  it("migrates V3 charges to a structured quoted amount (V4)", () => {
    const project = first(present(overviewOf(account)).projects);
    expect(project.charges).toBe("25000");
    expect(project.quotedAmount).toBe(25000);
    expect(project.status).toBe("confirmed");
    expect(project.payments).toEqual([]);
  });

  it("turns a notes+tasks sheet into two blocks", () => {
    const sheet = present(account.sheets[1]);
    if (isOverview(sheet)) throw new Error("expected a custom sheet");
    const notes = first(sheet.blocks);
    const todo = first(sheet.blocks.slice(1));
    expect(notes).toMatchObject({ type: "notes", text: "Client information" });
    expect(todo.type).toBe("todo");
    if (todo.type !== "todo") throw new Error("expected a todo block");
    expect(first(todo.tasks).text).toBe("Create poster");
  });

  it("drops stale tab and sheet-state references", () => {
    expect(st.openTabs).toEqual(["acc1"]);
    expect(st.activeSheetByAccount.acc1).toBe("sh1");
    expect("gone" in st.activeSheetByAccount).toBe(false);
  });
});

describe("normalize - baseline", () => {
  it("returns default state for null input", () => {
    expect(normalize(null)).toEqual(defaultState());
  });
});

describe("normalize - V4 projects", () => {
  it("keeps valid statuses, payments and quoted amounts", () => {
    const st = normalize({
      accounts: [
        {
          id: "a1",
          name: "A",
          sheets: [
            {
              id: "ov",
              name: "Overview",
              projects: [
                {
                  id: "p1",
                  projectName: "Gala",
                  charges: "25,000",
                  quotedAmount: 31000,
                  status: "delivered",
                  payments: [{ id: "pay1", amount: 10000, date: "2026-10-01", note: "Advance" }],
                  eventDate: "2026-10-29",
                  tasks: [],
                },
              ],
            },
          ],
        },
      ],
    });
    const project = first(present(overviewOf(first(st.accounts))).projects);
    expect(project.status).toBe("delivered");
    expect(project.quotedAmount).toBe(31000);
    expect(first(project.payments)).toMatchObject({ amount: 10000, note: "Advance" });
  });

  it("falls back to confirmed for unknown statuses", () => {
    const st = normalize({
      accounts: [
        {
          id: "a1",
          name: "A",
          sheets: [{ id: "ov", name: "Overview", projects: [{ id: "p1", status: "bogus", charges: "5,000" }] }],
        },
      ],
    });
    const project = first(present(overviewOf(first(st.accounts))).projects);
    expect(project.status).toBe("confirmed");
    expect(project.quotedAmount).toBe(5000);
  });
});

describe("normalize - invariants", () => {  it("gives every account an Overview sheet", () => {
    const st = normalize({
      accounts: [{ id: "a1", name: "No Overview", sheets: [{ id: "s1", name: "Notes", blocks: [] }] }],
    });
    const account = first(st.accounts);
    expect(account.sheets.some(isOverview)).toBe(true);
    expect(overviewOf(account)).not.toBeNull();
  });

  it("falls back to the first sheet when the remembered sheet is gone", () => {
    const st = normalize({
      accounts: [{ id: "a1", name: "A", sheets: [{ id: "ov", name: "Overview", projects: [] }] }],
      activeSheetByAccount: { a1: "missing" },
    });
    expect(st.activeSheetByAccount.a1).toBe("ov");
  });

  it("repairs non-string section ids", () => {
    const st = normalize({ activeAccountId: 42, openTabs: [1, "x"] });
    expect(st.activeAccountId).toBeNull();
    expect(st.openTabs).toEqual([]);
  });
});

describe("normalize - trash", () => {
  it("deep-normalizes trash sheets and drops Overview entries", () => {
    const st = normalize({
      trash: {
        accounts: [],
        sheets: [
          { id: "e1", accountId: "a1", accountName: "A", sheet: { id: "s1", name: "Old" } },
          { id: "e2", accountId: "a1", accountName: "A", sheet: { id: "s2", name: "Overview", projects: [] } },
        ],
      },
    });
    expect(st.trash.sheets.length).toBe(1);
    const entry = first(st.trash.sheets);
    expect(entry.id).toBe("e1");
    expect(entry.sheet.blocks).toEqual([]);
  });

  it("drops unrepairable trash entries", () => {
    const st = normalize({ trash: { accounts: [], sheets: [null, "junk"] } });
    expect(st.trash.sheets.length).toBe(0);
  });
});
