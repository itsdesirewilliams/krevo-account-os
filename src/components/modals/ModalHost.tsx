import { useState } from "react";
import { useStoreActions } from "../../state/store";
import { useUI } from "../../state/ui";
import { useNav } from "../../state/nav";
import { Modal } from "./Modal";
import { NewProjectDialog } from "./NewProjectDialog";

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
      <div className="field">
        <label className="field-label">{d.label}</label>
        <input
          className="input"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" onClick={submit}>{d.submitLabel}</button>
      </div>
    </Modal>
  );
}

function ConfirmDialog() {
  const ui = useUI();
  const d = ui.dialog;
  if (!d || d.kind !== "confirm") return null;
  return (
    <Modal title="Confirm" onClose={ui.closeDialog} width={400}>
      <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>{d.message}</div>
      <div className="form-actions">
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

function NewAccountDialog() {
  const { createAccount } = useStoreActions();
  const ui = useUI();
  const { selectAccount } = useNav();
  const [name, setName] = useState("");

  const create = () => {
    const id = createAccount(name);
    ui.closeDialog();
    selectAccount(id);
  };

  return (
    <Modal title="New account" onClose={ui.closeDialog}>
      <div className="field">
        <label className="field-label">Account name</label>
        <input
          className="input"
          autoFocus
          placeholder="e.g. JK Entertainment"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) create();
          }}
        />
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={create}>
          Create account
        </button>
      </div>
    </Modal>
  );
}

function NewSheetDialog({ accountId }: { accountId: string }) {
  const { createSheet } = useStoreActions();
  const ui = useUI();
  const [name, setName] = useState("");
  return (
    <Modal title="New sheet" onClose={ui.closeDialog}>
      <div className="field">
        <label className="field-label">Sheet name</label>
        <input
          className="input"
          autoFocus
          placeholder="e.g. Content plan"
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
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={ui.closeDialog}>Cancel</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            createSheet(accountId, name);
            ui.closeDialog();
          }}
        >
          Create sheet
        </button>
      </div>
    </Modal>
  );
}

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
  }
}
