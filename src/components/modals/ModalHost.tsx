import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { Modal } from "./Modal";
import { NewProjectDialog } from "./NewProjectDialog";
import { ProjectDialog } from "./ProjectDialog";

/* ---------------- Prompt (rename etc.) ---------------- */
function PromptDialog() {
  const ui = useUI();
  const d = ui.dialog;
  const [value, setValue] = useState(d?.kind === "prompt" ? d.value : "");
  if (!d || d.kind !== "prompt") return null;

  const submit = () => {
    if (value.trim()) {
      d.onSubmit(value);
      ui.closeDialog();
    }
  };

  return (
    <Modal title={d.title} onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">{d.label}</div>
        <input
          className="input w-full"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{d.submitLabel}</button>
      </div>
    </Modal>
  );
}

/* ---------------- Confirm ---------------- */
function ConfirmDialog() {
  const ui = useUI();
  const d = ui.dialog;
  if (!d || d.kind !== "confirm") return null;
  return (
    <Modal title="Please confirm" onClose={ui.closeDialog}>
      <div className="text-[13.5px] text-text">{d.message}</div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            d.onYes();
            ui.closeDialog();
          }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- New Account ---------------- */
function NewAccountDialog() {
  const { createAccount } = useStoreActions();
  const ui = useUI();
  const [name, setName] = useState("");
  return (
    <Modal title="New Account" onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Account name</div>
        <input
          className="input w-full"
          autoFocus
          placeholder="e.g. JK Entertainment"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              createAccount(name);
              ui.closeDialog();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            createAccount(name);
            ui.closeDialog();
          }}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- New Sheet ---------------- */
function NewSheetDialog({ accountId }: { accountId: string }) {
  const { createSheet } = useStoreActions();
  const ui = useUI();
  const [name, setName] = useState("");
  return (
    <Modal title="New Sheet" onClose={ui.closeDialog}>
      <div className="field-form">
        <div className="modal-label">Sheet name</div>
        <input
          className="input w-full"
          autoFocus
          placeholder="e.g. Content"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              createSheet(accountId, name);
              ui.closeDialog();
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            createSheet(accountId, name);
            ui.closeDialog();
          }}
        >
          Create
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- Host ---------------- */
export function ModalHost() {
  const ui = useUI();
  const d = ui.dialog;
  if (!d) return null;
  switch (d.kind) {
    case "prompt":
      return <PromptDialog />;
    case "confirm":
      return <ConfirmDialog />;
    case "new-account":
      return <NewAccountDialog />;
    case "new-sheet":
      return <NewSheetDialog accountId={d.accountId} />;
    case "new-project":
      return <NewProjectDialog accountId={d.accountId} />;
    case "project":
      // key={projectId}: reopens fresh when a different project is opened.
      return <ProjectDialog key={d.projectId} accountId={d.accountId} projectId={d.projectId} />;
  }
}
