export type PostType = "post" | "collab" | "repost" | "story" | "flyer";

export const POST_TYPES: PostType[] = ["post", "collab", "repost", "story", "flyer"];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  post: "Post",
  collab: "Collab",
  repost: "Repost",
  story: "Story",
  flyer: "Flyer",
};

export interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  description: string;
  createdAt: string;
}

export interface ContentPost {
  id: string;
  socialAccountId: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  type: PostType;
  /** Optional link into the Accounts module. */
  accountId: string | null;
  projectId: string | null;
  createdAt: string;
}

export interface ContentData {
  socialAccounts: SocialAccount[];
  posts: ContentPost[];
}
