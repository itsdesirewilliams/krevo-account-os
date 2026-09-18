/*
 * Content repository: pure, immutable helpers over ContentData.
 * No React, no storage. Every function returns a new ContentData.
 */
import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import { POST_TYPES, type ContentData, type ContentPost, type PostType, type SocialAccount } from "./content.types";

export const CONTENT_KEY = "krevo_content";

export function defaultContentData(): ContentData {
  return { socialAccounts: [], posts: [] };
}

const isPostType = (value: unknown): value is PostType => POST_TYPES.includes(value as PostType);

function normalizeSocialAccount(raw: unknown): SocialAccount {
  const a = (raw && typeof raw === "object" ? raw : {}) as Partial<SocialAccount>;
  return {
    id: a.id || genId(),
    platform: a.platform == null ? "Platform" : a.platform,
    handle: a.handle == null ? "" : a.handle,
    description: a.description == null ? "" : a.description,
    createdAt: a.createdAt || nowIso(),
  };
}

function normalizePost(raw: unknown): ContentPost {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<ContentPost>;
  return {
    id: p.id || genId(),
    socialAccountId: p.socialAccountId || "",
    title: p.title == null ? "" : p.title,
    date: p.date == null ? "" : p.date,
    type: isPostType(p.type) ? p.type : "post",
    accountId: p.accountId == null ? null : p.accountId,
    projectId: p.projectId == null ? null : p.projectId,
    createdAt: p.createdAt || nowIso(),
  };
}

/** Repairs any missing fields and drops posts whose social account is gone. */
export function normalizeContentData(raw: unknown): ContentData {
  const d = (raw && typeof raw === "object" ? raw : {}) as { socialAccounts?: unknown; posts?: unknown };
  const socialAccounts = Array.isArray(d.socialAccounts) ? d.socialAccounts.map(normalizeSocialAccount) : [];
  const accountIds = new Set(socialAccounts.map((a) => a.id));
  const posts = Array.isArray(d.posts) ? d.posts.map(normalizePost).filter((p) => accountIds.has(p.socialAccountId)) : [];
  return { socialAccounts, posts };
}

export function createSocialAccount(
  data: ContentData,
  platform: string,
  handle: string,
  description = "",
): ContentData {
  const account: SocialAccount = {
    id: genId(),
    platform: platform.trim() || "Platform",
    handle: handle.trim(),
    description: description.trim(),
    createdAt: nowIso(),
  };
  return { ...data, socialAccounts: [...data.socialAccounts, account] };
}

export function updateSocialAccount(
  data: ContentData,
  id: string,
  patch: Partial<Pick<SocialAccount, "platform" | "handle" | "description">>,
): ContentData {
  return { ...data, socialAccounts: data.socialAccounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
}

export function deleteSocialAccount(data: ContentData, id: string): ContentData {
  return {
    socialAccounts: data.socialAccounts.filter((a) => a.id !== id),
    posts: data.posts.filter((p) => p.socialAccountId !== id),
  };
}

export function createPost(
  data: ContentData,
  input: {
    socialAccountId: string;
    title: string;
    date: string;
    type: PostType;
    accountId: string | null;
    projectId: string | null;
  },
): ContentData {
  const post: ContentPost = { id: genId(), ...input, createdAt: nowIso() };
  return { ...data, posts: [...data.posts, post] };
}

export function updatePost(
  data: ContentData,
  id: string,
  patch: Partial<Pick<ContentPost, "title" | "date" | "type" | "accountId" | "projectId">>,
): ContentData {
  return { ...data, posts: data.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
}

export function deletePost(data: ContentData, id: string): ContentData {
  return { ...data, posts: data.posts.filter((p) => p.id !== id) };
}
