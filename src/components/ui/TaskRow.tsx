import { useState } from "react";
import { CheckIcon, CloseIcon } from "../Icons";

/** One task line: checkbox, inline-editable text (commits on blur), delete. */
export function TaskRow({
  text,
  completed,
  onToggle,
  onCommitText,
  onDelete,
}: {
  text: string;
  completed: boolean;
  onToggle: () => void;
  onCommitText: (text: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1 group">
      <button className={"check" + (completed ? " on" : "")} onClick={onToggle} aria-label="Toggle task">
        <CheckIcon />
      </button>
      <input
        className={
          "flex-1 bg-transparent border-0 outline-none text-[13.5px] min-w-0 " +
          (completed ? "line-through text-dim" : "text-text")
        }
        defaultValue={text}
        onBlur={(e) => {
          if (e.target.value !== text) onCommitText(e.target.value);
        }}
      />
      <button className="icon-btn task-del opacity-0 group-hover:opacity-100" onClick={onDelete} title="Delete task">
        <CloseIcon size={11} />
      </button>
    </div>
  );
}

/** "+ Add Task" input: creates on Enter or blur. */
export function TaskInput({ onAdd, placeholder = "+ Add Task" }: { onAdd: (text: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  return (
    <input
      className="task-input"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
      }}
      onBlur={submit}
    />
  );
}
