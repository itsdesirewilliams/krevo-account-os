import { useState } from "react";
import { useContent } from "../contentState";
import { POST_TYPES, POST_TYPE_LABELS } from "../content.types";
import type { ContentPost, PostType } from "../content.types";
import { useStoreActions, useStoreState } from "../../../state/store";
import { useUI } from "../../../state/ui";
import { useNav } from "../../../state/nav";
import { isOverview } from "../../../types";
import { Modal } from "../../../components/modals/Modal";
import { ContentCalendar } from "./ContentCalendar";
import { formatDate, todayLocalIso } from "../../../lib/dates";
import type { DeliverableId } from "../../plans/plans.types";

const DELIVERABLE_FOR_TYPE: Partial<Record<PostType, DeliverableId>> = {
  collab: "collab-repost",
  repost: "collab-repost",
  flyer: "promo-flyer",
};

/** Projects + accounts across the app, for the optional post link. */
function useProjectOptions() {
  const state = useStoreState();
  const projects: {
    accountId: string;
    accountName: string;
    projectId: string;
    projectName: string;
    deliverables: { "collab-repost"?: boolean; "promo-flyer"?: boolean } | null;
  }[] = [];
  for (const a of state.accounts) {
    for (const s of a.sheets) {
      if (isOverview(s)) {
        for (const p of s.projects) {
          projects.push({
            accountId: a.id,
            accountName: a.name,
            projectId: p.id,
            projectName: p.projectName || p.eventName || "Untitled",
            deliverables: p.deliverables ?? null,
          });
        }
      }
    }
  }
  const accounts = projects.filter((p, i, arr) => arr.findIndex((x) => x.accountId === p.accountId) === i);
  const accountNameOf = (id: string | null): string =>
    id ? (state.accounts.find((a) => a.id === id)?.name ?? "") : "";
  const projectNameOf = (id: string | null): string =>
    id ? (projects.find((p) => p.projectId === id)?.projectName ?? "") : "";
  const projectById = (id: string | null) => (id ? projects.find((p) => p.projectId === id) : undefined);
  return { projects, accounts, accountNameOf, projectNameOf, projectById };
}

function PostForm({
  initial,
  submitLabel,
  onSubmit,
  onClose,
  onDelete,
}: {
  initial: {
    title: string;
    date: string;
    type: PostType;
    accountId: string | null;
    projectId: string | null;
  };
  submitLabel: string;
  onSubmit: (v: { title: string; date: string; type: PostType; accountId: string | null; projectId: string | null }) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { projects, accounts } = useProjectOptions();
  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [type, setType] = useState<PostType>(initial.type);
  const [accountId, setAccountId] = useState<string>(initial.accountId ?? "");
  const [projectId, setProjectId] = useState<string>(initial.projectId ?? "");

  const linkedProjects = accountId ? projects.filter((p) => p.accountId === accountId) : projects;
  const linkedProject = projects.find((p) => p.projectId === projectId);
  const effectiveAccountId = linkedProject ? linkedProject.accountId : accountId;

  return (
    <>
      <div className="field-form">
        <div className="modal-label">Title / Description</div>
        <input className="input w-full" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Date</div>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field-form">
        <div className="modal-label">Post Type</div>
        <div className="flex flex-wrap gap-1.5">
          {POST_TYPES.map((t: PostType) => (
            <button
              key={t}
              className={
                "btn btn-ghost !py-1 !px-2.5 " +
                (type === t ? "!border-[color:var(--accent)] !text-[color:var(--accent)]" : "")
              }
              onClick={() => setType(t)}
            >
              {POST_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="field-form">
        <div className="modal-label">Account (optional)</div>
        <select className="input w-full" value={effectiveAccountId} onChange={(e) => { setAccountId(e.target.value); setProjectId(""); }}>
          <option value="">No account</option>
          {accounts.map((a) => (
            <option key={a.accountId} value={a.accountId}>{a.accountName}</option>
          ))}
        </select>
      </div>
      <div className="field-form">
        <div className="modal-label">Project (optional)</div>
        <select className="input w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">No project</option>
          {linkedProjects.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        {onDelete && (
          <button className="btn btn-danger-ghost" onClick={onDelete}>Delete</button>
        )}
        <button
          className="btn btn-primary"
          disabled={!title.trim()}
          onClick={() =>
            onSubmit({
              title: title.trim(),
              date,
              type,
              accountId: effectiveAccountId || null,
              projectId: projectId || null,
            })
          }
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}
function SocialAccountDetail({
  content,
  acc,
  posts,
  accountNameOf,
  projectNameOf,
  onDelete,
  onClose,
}: {
  content: ReturnType<typeof useContent>;
  acc: { id: string; platform: string; handle: string; description: string };
  posts: ContentPost[];
  accountNameOf: (id: string | null) => string;
  projectNameOf: (id: string | null) => string;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const { projectById } = useProjectOptions();
  const { toggleProjectDeliverable } = useStoreActions();

  const submitNew = (v: { title: string; date: string; type: PostType; accountId: string | null; projectId: string | null }) => {
    content.createPost({ socialAccountId: acc.id, ...v });
    setAdding(false);
  };
  const submitEdit = (v: { title: string; date: string; type: PostType; accountId: string | null; projectId: string | null }) => {
    if (editing) {
      content.updatePost(editing.id, v);
      setEditing(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Social Account</div>
        <button className="btn btn-ghost" onClick={onClose}>Back</button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <input
          className="account-name-input text-[18px] flex-1"
          defaultValue={acc.platform}
          onBlur={(e) => content.updateSocialAccount(acc.id, { platform: e.target.value })}
        />
      </div>

      <div className="field-form">
        <div className="modal-label">Handle</div>
        <input
          className="input w-full"
          defaultValue={acc.handle}
          onBlur={(e) => content.updateSocialAccount(acc.id, { handle: e.target.value })}
        />
      </div>

      <div className="field-form">
        <div className="modal-label">Description</div>
        <textarea
          className="account-desc"
          rows={2}
          placeholder="Add a description..."
          defaultValue={acc.description}
          onBlur={(e) => content.updateSocialAccount(acc.id, { description: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between mt-6 mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-dim">Posts ({posts.length})</div>
        <div className="flex items-center gap-1.5">
          <button
            className={"btn btn-ghost !py-0.5 !px-2 " + (view === "list" ? "!text-[color:var(--accent)]" : "")}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={"btn btn-ghost !py-0.5 !px-2 " + (view === "calendar" ? "!text-[color:var(--accent)]" : "")}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
          <button className="btn btn-ghost" onClick={() => setAdding(true)}>+ Add Post</button>
        </div>
      </div>

      {view === "calendar" ? (
        <ContentCalendar posts={posts} />
      ) : posts.length === 0 ? (
        <div className="text-[13px] text-dim py-6">No posts yet. Content is about volume, not analytics.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((p) => {
            const mapped = DELIVERABLE_FOR_TYPE[p.type];
            const project = projectById(p.projectId);
            const fulfills =
              mapped && project?.accountId
                ? project.deliverables?.[mapped] === false
                  ? { accountId: project.accountId, deliverableId: mapped }
                  : null
                : null;
            return (
              <div key={p.id} className="project-card" onClick={() => setEditing(p)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="project-card-title">{p.title}</div>
                  <span className="badge">{POST_TYPE_LABELS[p.type]}</span>
                </div>
                <div className="project-card-meta">
                  {formatDate(p.date)}
                  {p.accountId ? `  ·  ${accountNameOf(p.accountId)}` : ""}
                  {p.projectId ? `  ·  ${projectNameOf(p.projectId)}` : ""}
                </div>
                {fulfills && p.projectId && (
                  <button
                    className="btn btn-ghost mt-2 !py-0.5 !px-2 !text-[11.5px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProjectDeliverable(fulfills.accountId, p.projectId ?? "", fulfills.deliverableId);
                    }}
                  >
                    Mark plan deliverable done
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {adding && (
        <Modal title="New Post" onClose={() => setAdding(false)}>
          <PostForm
            initial={{ title: "", date: todayLocalIso(), type: "post", accountId: null, projectId: null }}
            submitLabel="Add Post"
            onSubmit={submitNew}
            onClose={() => setAdding(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title="Edit Post" onClose={() => setEditing(null)}>
          <PostForm
            initial={{
              title: editing.title,
              date: editing.date,
              type: editing.type,
              accountId: editing.accountId,
              projectId: editing.projectId,
            }}
            submitLabel="Save"
            onSubmit={submitEdit}
            onClose={() => setEditing(null)}
            onDelete={() => {
              content.deletePost(editing.id);
              setEditing(null);
            }}
          />
        </Modal>
      )}

      <div className="mt-8">
        <button className="btn btn-danger-ghost" onClick={onDelete}>Delete Social Account</button>
      </div>
    </div>
  );
}
export function ContentView() {
  const content = useContent();
  const nav = useNav();
  const ui = useUI();
  const { accountNameOf, projectNameOf } = useProjectOptions();

  const [adding, setAdding] = useState(false);
  const [platform, setPlatform] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");

  const account = content.data.socialAccounts.find((a) => a.id === nav.socialAccountId) ?? null;
  const posts = account ? content.data.posts.filter((p) => p.socialAccountId === account.id) : [];

  if (!account) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dim">
          <div className="text-[14px]">No social account selected. Create one to start publishing content.</div>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>+ New Social Account</button>
        </div>
        {adding && (
          <Modal title="New Social Account" onClose={() => setAdding(false)}>
            <div className="field-form">
              <div className="modal-label">Platform</div>
              <input className="input w-full" autoFocus value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Instagram" />
            </div>
            <div className="field-form">
              <div className="modal-label">Handle</div>
              <input className="input w-full" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@krevomedia" />
            </div>
            <div className="field-form">
              <div className="modal-label">Description</div>
              <input className="input w-full" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!platform.trim() && !handle.trim()}
                onClick={() => {
                  content.createSocialAccount(platform.trim(), handle.trim(), description);
                  setAdding(false);
                  setPlatform("");
                  setHandle("");
                  setDescription("");
                }}
              >
                Create
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <SocialAccountDetail
      key={account.id}
      content={content}
      acc={account}
      posts={posts}
      accountNameOf={accountNameOf}
      projectNameOf={projectNameOf}
      onDelete={() =>
        ui.confirm("Delete this social account and all its posts?", () => {
          content.deleteSocialAccount(account.id);
          nav.selectSocialAccount(null);
        })
      }
      onClose={() => nav.selectSocialAccount(null)}
    />
  );
}
