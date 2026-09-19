import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useStoreState } from "../state/store";
import { useUI } from "../state/ui";
import { useNav } from "../state/nav";
import { useSettings } from "../features/settings/settingsState";
import { overviewOf } from "../types";
import { SECTIONS, SECTION_LABELS, type Section } from "./navigation";
import { groupCandidates, rankCandidates, type Candidate } from "./paletteSearch";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  FinanceIcon,
  HomeIcon,
  SearchIcon,
  SettingsIcon,
  TasksIcon,
  UsersIcon,
} from "../components/Icons";

/** Sidebar/header entry point for the command palette. */
export function PaletteButton() {
  const ui = useUI();
  return (
    <button className="icon-btn" title="Search (Ctrl+K)" aria-label="Open command palette" onClick={ui.openPalette}>
      <SearchIcon size={15} />
    </button>
  );
}

/**
 * Global command/navigation surface (Cmd/Ctrl+K): sections, accounts, projects
 * and interface preferences. Keyboard-first with a trapped + restored focus.
 */
export function CommandPalette() {
  const { paletteOpen, openPalette, closePalette } = useUI();
  const state = useStoreState();
  const nav = useNav();
  const { settings, update } = useSettings();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<Element | null>(null);

  // Global shortcut + reset/focus on open, restore on close.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (paletteOpen) closePalette();
        else openPalette();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, openPalette, closePalette]);

  useEffect(() => {
    if (paletteOpen) {
      restoreFocus.current = document.activeElement;
      setQuery("");
      setActive(0);
      inputRef.current?.focus();
    } else if (restoreFocus.current instanceof HTMLElement) {
      restoreFocus.current.focus();
    }
  }, [paletteOpen]);

  const candidates = useMemo<Candidate[]>(() => {
    const items: Candidate[] = SECTIONS.map((section) => ({
      id: `nav:${section}`,
      group: "Navigate",
      label: SECTION_LABELS[section],
      keywords: section,
    }));

    for (const account of state.accounts) {
      const overview = overviewOf(account);
      const count = overview?.projects.length ?? 0;
      items.push({
        id: `acc:${account.id}`,
        group: "Accounts",
        label: account.name,
        hint: `${count} ${count === 1 ? "project" : "projects"}`,
      });
      for (const project of overview?.projects ?? []) {
        items.push({
          id: `proj:${account.id}:${project.id}`,
          group: "Projects",
          label: project.projectName || project.eventName || "Untitled",
          hint: account.name,
          keywords: project.eventName,
        });
      }
    }

    items.push({
      id: "pref:face",
      group: "Preferences",
      label: `Interface face: ${settings.interfaceFace === "geist" ? "Bricolage" : "Geist"}`,
      hint: `Now ${settings.interfaceFace}`,
      keywords: "theme font typography bricolage geist",
    });

    return items;
  }, [state.accounts, settings.interfaceFace]);

  const flat = useMemo(() => rankCandidates(candidates, query), [candidates, query]);
  const grouped = useMemo(() => groupCandidates(flat), [flat]);

  useEffect(() => {
    if (!paletteOpen) return;
    document.getElementById(`palette-item-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, paletteOpen]);

  if (!paletteOpen) return null;

  const run = (id: string) => {
    if (id.startsWith("nav:")) nav.setSection(id.slice(4) as Section);
    else if (id.startsWith("acc:")) nav.selectAccount(id.slice(4));
    else if (id.startsWith("proj:")) {
      const [, accountId, projectId] = id.split(":");
      if (accountId && projectId) nav.openProject(projectId, accountId);
    } else if (id === "pref:face") {
      update({ interfaceFace: settings.interfaceFace === "geist" ? "bricolage" : "geist" });
    }
    closePalette();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePalette();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i + 1) % flat.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (flat.length === 0 ? 0 : (i - 1 + flat.length) % flat.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flat[active];
      if (item) run(item.id);
    }
  };

  const iconFor = (group: Candidate["group"], id: string) => {
    if (group === "Navigate") {
      if (id === "nav:overview") return <HomeIcon size={15} />;
      if (id === "nav:accounts") return <BriefcaseIcon size={15} />;
      if (id === "nav:tasks") return <TasksIcon size={15} />;
      if (id === "nav:team") return <UsersIcon size={15} />;
      if (id === "nav:finance") return <FinanceIcon size={15} />;
      return <SettingsIcon size={15} />;
    }
    if (group === "Accounts") return <BriefcaseIcon size={15} />;
    if (group === "Projects") return <ArrowUpRightIcon size={15} />;
    return <SettingsIcon size={15} />;
  };

  let index = -1;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && closePalette()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Search accounts, projects, sections…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="palette-body" role="listbox">
          {flat.length === 0 ? (
            <div className="palette-empty">No matches for “{query}”.</div>
          ) : (
            grouped.map((entry) => (
              <div key={entry.group}>
                <div className="palette-group">{entry.group}</div>
                {entry.items.map((item) => {
                  index += 1;
                  const rowIndex = index;
                  return (
                    <div
                      key={item.id}
                      id={`palette-item-${rowIndex}`}
                      role="option"
                      aria-selected={rowIndex === active}
                      className={"palette-item" + (rowIndex === active ? " on" : "")}
                      onMouseMove={() => setActive(rowIndex)}
                      onClick={() => run(item.id)}
                    >
                      <span className="p-icon">{iconFor(item.group, item.id)}</span>
                      <span className="grow">{item.label}</span>
                      {item.hint && <span className="p-hint">{item.hint}</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="palette-foot">
          <span>
            <span className="kbd">↑↓</span> navigate
          </span>
          <span>
            <span className="kbd">↵</span> open
          </span>
          <span>
            <span className="kbd">esc</span> close
          </span>
          <span style={{ marginLeft: "auto" }}>
            <span className="kbd">ctrl</span> <span className="kbd">K</span>
          </span>
        </div>
      </div>
    </div>
  );
}
