import { useStoreActions } from "../state/store";
import { useTasks } from "../features/tasks/tasksState";
import { sortedTasks, tasksByBlock } from "../features/tasks/tasks.repository";
import type { Account, CustomSheet, NotesBlock, TodoBlock } from "../types";
import { CloseIcon } from "./Icons";
import { TaskInput, TaskRow } from "./ui/TaskRow";

function NotesBlockView({
  accountId,
  sheetId,
  block,
}: {
  accountId: string;
  sheetId: string;
  block: NotesBlock;
}) {
  const { setBlockNotes, deleteBlock } = useStoreActions();
  return (
    <div className="block">
      <div className="block-head">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Notes</div>
        <button className="icon-btn" title="Delete block" onClick={() => deleteBlock(accountId, sheetId, block.id)}>
          <CloseIcon size={11} />
        </button>
      </div>
      <textarea
        className="notes-area"
        placeholder="Write something..."
        defaultValue={block.text}
        onBlur={(e) => setBlockNotes(accountId, sheetId, block.id, e.target.value)}
      />
    </div>
  );
}

function TodoBlockView({ accountId, sheetId, block }: { accountId: string; sheetId: string; block: TodoBlock }) {
  const { deleteBlock } = useStoreActions();
  const tasks = useTasks();
  const list = sortedTasks(tasksByBlock(tasks.tasks, block.id));

  const removeBlock = () => {
    deleteBlock(accountId, sheetId, block.id);
    tasks.removeByLinks({ blockId: block.id });
  };

  return (
    <div className="block">
      <div className="block-head">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">To-Do</div>
        <button className="icon-btn" title="Delete block" onClick={removeBlock}>
          <CloseIcon size={11} />
        </button>
      </div>
      <div className="flex flex-col">
        {list.map((task) => (
          <TaskRow
            key={task.id}
            text={task.title}
            completed={task.status === "done"}
            onToggle={() => tasks.toggle(task.id)}
            onCommitText={(v) => tasks.updateTask(task.id, { title: v })}
            onDelete={() => tasks.removeTask(task.id)}
          />
        ))}
      </div>
      <TaskInput
        onAdd={(text) => tasks.createTask({ title: text, links: { accountId, sheetId, blockId: block.id } })}
      />
    </div>
  );
}

export function CustomSheetView({ account, sheet }: { account: Account; sheet: CustomSheet }) {
  const { addBlock } = useStoreActions();

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex flex-col gap-7">
        {sheet.blocks.map((b) =>
          b.type === "notes" ? (
            <NotesBlockView key={b.id} accountId={account.id} sheetId={sheet.id} block={b} />
          ) : (
            <TodoBlockView key={b.id} accountId={account.id} sheetId={sheet.id} block={b} />
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
