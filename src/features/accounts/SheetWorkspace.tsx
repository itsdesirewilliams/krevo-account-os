import { useStoreActions } from "../../state/store";
import { useTasks } from "../tasks/tasksState";
import { sortedTasks, tasksByBlock } from "../tasks/tasks.repository";
import type { Account, CustomSheet, NotesBlock, TodoBlock } from "../../types";
import { TaskInput, TaskItem } from "../../components/ui/TaskItem";
import { CloseIcon } from "../../components/Icons";

function NotesBlock({ account, sheet, block }: { account: Account; sheet: CustomSheet; block: NotesBlock }) {
  const { setBlockNotes, deleteBlock } = useStoreActions();
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-head">
        <span className="section-title">Notes</span>
        <button className="icon-btn" title="Delete block" onClick={() => deleteBlock(account.id, sheet.id, block.id)}>
          <CloseIcon size={12} />
        </button>
      </div>
      <textarea
        className="textarea"
        defaultValue={block.text}
        placeholder="Write something…"
        onBlur={(e) => setBlockNotes(account.id, sheet.id, block.id, e.target.value)}
        aria-label="Notes"
      />
    </div>
  );
}

function TodoBlock({ account, sheet, block }: { account: Account; sheet: CustomSheet; block: TodoBlock }) {
  const { deleteBlock } = useStoreActions();
  const tasks = useTasks();
  const list = sortedTasks(tasksByBlock(tasks.tasks, block.id));

  const removeBlock = () => {
    deleteBlock(account.id, sheet.id, block.id);
    tasks.removeByLinks({ blockId: block.id });
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div className="section-head">
        <span className="section-title">To-do</span>
        <button className="icon-btn" title="Delete block" onClick={removeBlock}>
          <CloseIcon size={12} />
        </button>
      </div>
      <div className="list">
        {list.map((task) => (
          <TaskItem key={task.id} task={task} context={account.name} />
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <TaskInput
          placeholder="Add task…"
          onAdd={(title) => tasks.createTask({ title, links: { accountId: account.id, sheetId: sheet.id, blockId: block.id } })}
        />
      </div>
    </div>
  );
}

/** A freeform sheet: notes and to-do blocks. */
export function SheetWorkspace({ account, sheet }: { account: Account; sheet: CustomSheet }) {
  const { addBlock } = useStoreActions();

  return (
    <div className="reveal">
      {sheet.blocks.map((block) =>
        block.type === "notes" ? (
          <NotesBlock key={block.id} account={account} sheet={sheet} block={block} />
        ) : (
          <TodoBlock key={block.id} account={account} sheet={sheet} block={block} />
        ),
      )}

      {sheet.blocks.length === 0 && (
        <div className="muted" style={{ marginBottom: 14 }}>Empty sheet. Add a notes or to-do block.</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-ghost" onClick={() => addBlock(account.id, sheet.id, "notes")}>
          Add notes
        </button>
        <button className="btn btn-ghost" onClick={() => addBlock(account.id, sheet.id, "todo")}>
          Add to-do
        </button>
      </div>
    </div>
  );
}
