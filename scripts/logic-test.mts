/*
 * Headless data-layer test: normalization, legacy V2 -> V3 migration,
 * browser storage driver round-trip, date/charges formatting.
 * Run: node scripts/run-logic-test.mjs
 */
import assert from "node:assert/strict";
import { localStorage } from "./mocks/localstorage.mjs";

// Provide browser globals expected by the storage module.
(globalThis as unknown as { window: unknown; localStorage: unknown }).window = globalThis;
(globalThis as unknown as { localStorage: unknown }).localStorage = localStorage;

const { normalize, defaultState } = await import("../src/state/normalize");
const { storage, STORAGE_KEY } = await import("../src/storage");
const { formatDate, formatCharges } = await import("../src/lib/dates");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log("PASS - " + name);
}

/* 1. Legacy V2 payload migrates cleanly */
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

const st = normalize(legacy);
test("legacy account kept with id/name", () => {
  assert.equal(st.accounts.length, 1);
  assert.equal(st.accounts[0].name, "JK Entertainment");
});
test("legacy project gains projectName derived from eventName", () => {
  const overview = st.accounts[0].sheets[0];
  assert.ok("projects" in overview);
  assert.equal(overview.projects[0].projectName, "Summer Gala");
  assert.equal(overview.projects[0].eventDate, "2026-10-29");
  assert.equal(overview.projects[0].tasks[0].completed, true);
});
test("legacy notes+tasks sheet becomes two blocks", () => {
  const sheet = st.accounts[0].sheets[1];
  assert.ok("blocks" in sheet);
  assert.equal(sheet.blocks.length, 2);
  assert.equal(sheet.blocks[0].type, "notes");
  assert.equal(sheet.blocks[0].text, "Client information");
  assert.equal(sheet.blocks[1].type, "todo");
  assert.equal(sheet.blocks[1].tasks![0].text, "Create poster");
});
test("stale tab and sheet-state references dropped", () => {
  assert.deepEqual(st.openTabs, ["acc1"]);
  assert.equal(st.activeSheetByAccount.acc1, "sh1");
  assert.ok(!("gone" in st.activeSheetByAccount));
});

/* 2. Fresh empty state */
const empty = normalize(null);
test("null input yields default state", () => {
  assert.deepEqual(empty, { ...defaultState() });
});

/* 3. Storage round-trip (async, run at top level) */
try {
  await storage.save(STORAGE_KEY, st);
  const loaded = await storage.load(STORAGE_KEY);
  const re = normalize(loaded);
  assert.equal(re.accounts[0].sheets[1].blocks.length, 2);
  const overview = re.accounts[0].sheets[0] as { projects: { projectName: string }[] };
  assert.equal(overview.projects[0].projectName, "Summer Gala");
  passed++;
  console.log("PASS - browser storage driver round-trip");
} catch (e) {
  console.error("FAIL - browser storage driver round-trip", e);
  process.exit(1);
}

/* 4. Formatting */
test("formatDate renders 29 October 2026", () => {
  assert.equal(formatDate("2026-10-29"), "29 October 2026");
});
test("formatCharges adds rupee symbol with Indian grouping", () => {
  assert.equal(formatCharges("25000"), "\u20B925,000");
  assert.equal(formatCharges("custom"), "custom");
  assert.equal(formatCharges(""), "");
});

console.log("\nAll " + passed + " tests passed.");
