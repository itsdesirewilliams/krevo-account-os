import { useState } from "react";
import { useStore } from "../state/store";
import type { Account, Block, CustomSheet } from "../types";
import { CheckIcon, CloseIcon } from "./Icons";

function TaskRow({
  text,
  completed,
  onToggle,
  onSetText,
  onDelete,
}: {
  text: string;
  completed: boolean;
  onToggle: () => void;
  onSetText: (t: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1 group">
      <button className={"check" + (completed ? " on" : "")} onClick={onToggle} aria-label="Toggle task">
        <CheckIcon />
      </button>
      <input
        className={"flex-1 bg-transparent border-0 outline-none text-[13.5px] min-w-0 " + (completed ? "line-through text-dim" : "text-text")}
        defaultValue={text}
        onChange={(e) => onSetText(e.target.value)}
      />
      <button className="icon-btn task-del opacity-0 group-hover:opacity-100" onClick={onDelete} title="Delete task">
        <CloseIcon size={11} />
      </button>
    </div>
  );
}

function NotesBlockView({ account, sheet, block }: { account: Account; sheet: CustomSheet; block: Block }) {
  const { setBlockNotes, deleteBlock } = useStore();
  return (
    <div className="block">
      <div className="block-head">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Notes</div>
        <button className="icon-btn" title="Delete block" onClick={() => deleteBlock(account.id, sheet.id, block.id)}>
          <CloseIcon size={11} />
        </button>
      </div>
      <textarea
        className="notes-area"
        placeholder="Write something..."
        defaultValue={block.text ?? ""}
        onChange={(e) => setBlockNotes(account.id, sheet.id, block.id, e.target.value)}
      />
    </div>
  );
}

function TodoBlockView({ account, sheet, block }: { account: Account; sheet: CustomSheet; block: Block }) {
  const { addBlockTask, toggleBlockTask, deleteBlockTask, setBlockTaskText, deleteBlock } = useStore();
  const [draft, setDraft] = useState("");
  if (block.type !== "todo") return null;
  const tasks = block.tasks ?? [];

  const submit = () => {
    if (draft.trim()) {
      addBlockTask(account.id, sheet.id, block.id, draft);
      setDraft("");
    }
  };

  return (
    <div className="block">
      <div className="block-head">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">To-Do</div>
        <button className="icon-btn" title="Delete block" onClick={() => deleteBlock(account.id, sheet.id, block.id)}>
          <CloseIcon size={11} />
        </button>
      </div>
      <div className="flex flex-col">
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            text={t.text}
            completed={t.completed}
            onToggle={() => toggleBlockTask(account.id, sheet.id, block.id, t.id)}
            onSetText={(v) => setBlockTaskText(account.id, sheet.id, block.id, t.id, v)}
            onDelete={() => deleteBlockTask(account.id, sheet.id, block.id, t.id)}
          />
        ))}
      </div>
      <input
        className="task-input"
        placeholder="+ Add Task"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        onBlur={submit}
      />
    </div>
  );
}

export function CustomSheetView({ account, sheet }: { account: Account; sheet: CustomSheet }) {
  const { addBlock } = useStore();

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex flex-col gap-7">
        {sheet.blocks.map((b) =>
          b.type === "notes" ? (
            <NotesBlockView key={b.id} account={account} sheet={sheet} block={b} />
          ) : (
            <TodoBlockView key={b.id} account={account} sheet={sheet} block={b} />
          ),
        )}
      </div>

      {/* Creation controls always remain available, regardless of existing blocks. */}
      <div className="flex items-center gap-3 mt-8">
        <button className="btn btn-ghost" onClick={() => addBlock(account.id, sheet.id, "notes")}>
          <span className="text-base leading-none">+</span> Add Notes
        </button>
        <button className="btn btn-ghost" onClick={() => addBlock(account.id, sheet.id, "todo")}>
          <span className="text-base leading-none">+</span> Create To-Do
        </button>
      </div>
    </div>
  );
}
