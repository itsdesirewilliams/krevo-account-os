/*
 * Content state: React context + persistence via the storage abstraction.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STORAGE_PREFIX, loadSection, saveSection } from "../../state/persist";
import { contentRepository } from "./content.repository";
import type { ContentData, ContentPost, PostType, SocialAccount } from "./content.types";

const KEY = STORAGE_PREFIX + "content";

interface ContentStore {
  data: ContentData;
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
  updatePost: (id: string, patch: Partial<Omit<ContentPost, "id" | "createdAt">>) => void;
  deletePost: (id: string) => void;
}

const Ctx = createContext<ContentStore | null>(null);

export function ContentProvider({ initial, children }: { initial: ContentData; children: ReactNode }) {
  const [data, setData] = useState<ContentData>(initial);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => saveSection(KEY, data), 250);
    return () => window.clearTimeout(timer.current);
  }, [data]);

  const mutate = useCallback((fn: (d: ContentData) => void) => {
    setData((prev) => {
      const next: ContentData = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const store = useMemo<ContentStore>(
    () => ({
      data,
      createSocialAccount: (platform, handle, description) =>
        mutate((d) => contentRepository.createSocialAccount(d, platform, handle, description)),
      updateSocialAccount: (id, patch) => mutate((d) => contentRepository.updateSocialAccount(d, id, patch)),
      deleteSocialAccount: (id) => mutate((d) => contentRepository.deleteSocialAccount(d, id)),
      createPost: (input) => mutate((d) => contentRepository.createPost(d, input)),
      updatePost: (id, patch) => mutate((d) => contentRepository.updatePost(d, id, patch)),
      deletePost: (id) => mutate((d) => contentRepository.deletePost(d, id)),
    }),
    [data, mutate],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useContent(): ContentStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useContent must be used inside ContentProvider");
  return ctx;
}

export async function loadContent(): Promise<ContentData> {
  return contentRepository.normalize(await loadSection(KEY));
}

export type { ContentPost, SocialAccount, PostType };
export { POST_TYPES, POST_TYPE_LABELS } from "./content.types";
