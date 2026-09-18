import { describe, expect, it } from "vitest";
import { first } from "../../test-utils/assert";
import {
  createPost,
  createSocialAccount,
  defaultContentData,
  deleteSocialAccount,
  normalizeContentData,
} from "./content.repository";

describe("normalizeContentData", () => {
  it("returns empty data for junk input", () => {
    expect(normalizeContentData(null)).toEqual(defaultContentData());
  });

  it("repairs missing fields and invalid post types", () => {
    const data = normalizeContentData({
      socialAccounts: [{ id: "sa1" }],
      posts: [{ id: "po1", socialAccountId: "sa1", type: "bogus" }],
    });
    expect(data.socialAccounts[0]).toMatchObject({ platform: "Platform", handle: "", description: "" });
    expect(data.posts[0]).toMatchObject({
      id: "po1",
      title: "",
      date: "",
      type: "post",
      accountId: null,
      projectId: null,
    });  });

  it("drops posts whose social account is gone", () => {
    const data = normalizeContentData({
      socialAccounts: [{ id: "sa1" }],
      posts: [
        { id: "keep", socialAccountId: "sa1" },
        { id: "drop", socialAccountId: "gone" },
      ],
    });
    expect(data.posts.map((p) => p.id)).toEqual(["keep"]);
  });
});

describe("content operations", () => {
  it("creates accounts and posts immutably", () => {
    const empty = defaultContentData();
    const withAccount = createSocialAccount(empty, "Instagram", "@krevo");
    expect(empty.socialAccounts).toEqual([]);
    const socialAccountId = first(withAccount.socialAccounts).id;

    const withPost = createPost(withAccount, {
      socialAccountId,
      title: "Launch",
      date: "2026-10-29",
      type: "post",
      accountId: null,
      projectId: null,
    });
    expect(withPost.posts).toHaveLength(1);
    expect(withAccount.posts).toEqual([]);
  });

  it("cascades social-account deletion to its posts", () => {
    const withAccount = createSocialAccount(defaultContentData(), "Instagram", "@krevo");
    const id = first(withAccount.socialAccounts).id;
    const withPost = createPost(withAccount, {
      socialAccountId: id,
      title: "Launch",
      date: "2026-10-29",
      type: "post",
      accountId: null,
      projectId: null,
    });

    const next = deleteSocialAccount(withPost, id);
    expect(next.socialAccounts).toEqual([]);
    expect(next.posts).toEqual([]);
  });
});
