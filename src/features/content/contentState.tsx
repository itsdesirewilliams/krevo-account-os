/*
 * Content state: React context over the pure repository, persisted through the
 * shared persistence helper (same pattern as every other feature slice).
 */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePersistentState } from "../../state/persist";
import {
  CONTENT_KEY,
  createPost,
  createSocialAccount,
  defaultContentData,
  deletePost,
  deleteSocialAccount,
  normalizeContentData,
  updatePost,
  updateSocialAccount,
} from "./content.repository";
import type { ContentData, ContentPost, PostType, SocialAccount } from "./content.types";

interface ContentStore {
  data: ContentData;
  ready: boolean;
  createSocialAccount: (platform: string, handle: string, description?: string) => void;
  updateSocialAccount: (id: string, patch: Partial<Pick<SocialAccount, "platform" | "handle" | "description">>) => void;
  deleteSocialAccount: (id: string) => void;
  createPost: (input: {
    socialAccountId: string;
    title: string;
    date: string;
    type: PostType;
    accountId: string | null;
    projectId: string | null;
  }) => void;
  updatePost: (
    id: string,
    patch: Partial<Pick<ContentPost, "title" | "date" | "type" | "accountId" | "projectId">>,
  ) => void;
  deletePost: (id: string) => void;
}

const Ctx = createContext<ContentStore | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [data, setData, ready] = usePersistentState<ContentData>(
    CONTENT_KEY,
    defaultContentData,
    normalizeContentData,
  );

  const store = useMemo<ContentStore>(
    () => ({
      data,
      ready,
      createSocialAccount: (platform, handle, description) =>
        setData((d) => createSocialAccount(d, platform, handle, description)),
      updateSocialAccount: (id, patch) => setData((d) => updateSocialAccount(d, id, patch)),
      deleteSocialAccount: (id) => setData((d) => deleteSocialAccount(d, id)),
      createPost: (input) => setData((d) => createPost(d, input)),
      updatePost: (id, patch) => setData((d) => updatePost(d, id, patch)),
      deletePost: (id) => setData((d) => deletePost(d, id)),
    }),
    [data, ready, setData],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useContent(): ContentStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}
