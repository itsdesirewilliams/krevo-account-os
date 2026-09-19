import { useState } from "react";
import { useTeam } from "../teamState";
import type { MemberType } from "../team.types";
import { MEMBER_TYPES } from "../team.types";
import { Modal } from "../../../components/modals/Modal";
import { parseAmount } from "../../../lib/currency";

/** Add-member form (creation is modal-natured). */
export function MemberForm() {
  const { closeMemberForm, createMember } = useTeam();
  const [type, setType] = useState<MemberType>("person");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    createMember({ type, name, description, monthlyCost: parseAmount(cost) });
    closeMemberForm();
  };

  return (
    <Modal title="Add team member" onClose={closeMemberForm}>
      <div className="field">
        <label className="field-label">Type</label>
        <div className="seg">
          {MEMBER_TYPES.map((option) => (
            <button key={option} className={"seg-btn" + (type === option ? " on" : "")} onClick={() => setType(option)}>
              {option === "person" ? "Person" : "Tool"}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label className="field-label">Name</label>
        <input
          className="input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <div className="field">
        <label className="field-label">Description (optional)</label>
        <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label">Monthly cost (INR)</label>
        <input className="input" placeholder="e.g. 4000" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={closeMemberForm}>Cancel</button>
        <button className="btn btn-primary" disabled={!name.trim()} onClick={submit}>Create member</button>
      </div>
    </Modal>
  );
}
