import { genId } from "../../lib/id";
import { nowIso } from "../../lib/dates";
import type { ContentData, ContentPost, PostType, SocialAccount } from "./content.types";

/** Pure logic over content data. No persistence, no React. */
export const contentRepository = {
  empty(): ContentData {
    return { socialAccounts: [], posts: [] };
  },

  normalize(input: unknown): ContentData {
    const d = (input && typeof input === "object" ? input : {}) as Partial<ContentData>;
    return {
      socialAccounts: Array.isArray(d.socialAccounts) ? d.socialAccounts : [],
      posts: Array.isArray(d.posts) ? d.posts : [],
    };
  },

  createSocialAccount(data: ContentData, platform: string, handle: string, description = ""): SocialAccount {
    const acc: SocialAccount = {
      id: genId(),
      platform: platform.trim() || "Platform",
      handle: handle.trim(),
      description: description.trim(),
      createdAt: nowIso(),
    };
    data.socialAccounts.push(acc);
    return acc;
  },

  updateSocialAccount(data: ContentData, id: string, patch: Partial<Omit<SocialAccount, "id" | "createdAt">>): void {
    const a = data.socialAccounts.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
  },

  deleteSocialAccount(data: ContentData, id: string): void {
    data.socialAccounts = data.socialAccounts.filter((a) => a.id !== id);
    data.posts = data.posts.filter((p) => p.socialAccountId !== id);
  },

  postsOf(data: ContentData, socialAccountId: string): ContentPost[] {
    return data.posts.filter((p) => p.socialAccountId === socialAccountId);
  },

  createPost(
    data: ContentData,
    input: {
      socialAccountId: string;
      title: string;
      date: string;
      type: PostType;
      accountId: string | null;
      projectId: string | null;
    },
  ): ContentPost {
    const post: ContentPost = { id: genId(), ...input, createdAt: nowIso() };
    data.posts.push(post);
    return post;
  },

  updatePost(data: ContentData, id: string, patch: Partial<Omit<ContentPost, "id" | "createdAt">>): void {
    const p = data.posts.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
  },

  deletePost(data: ContentData, id: string): void {
    data.posts = data.posts.filter((p) => p.id !== id);
  },

  /** Posts linked to a given project (used for plan deliverable status). */
  postsForProject(data: ContentData, projectId: string): ContentPost[] {
    return data.posts.filter((p) => p.projectId === projectId);
  },
};
