import type { SupabaseClient } from "@supabase/supabase-js";
import { getFollowStatus, setFollowing } from "@/lib/follows";

type QueryResult = { data?: unknown; error: { message: string } | null };

function makeQuery(result: QueryResult) {
  const calls: { method: string; args: unknown[] }[] = [];
  const query: Record<string, unknown> = {};
  for (const method of ["select", "eq", "delete"]) {
    query[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return query;
    };
  }
  query.upsert = (...args: unknown[]) => {
    calls.push({ method: "upsert", args });
    return Promise.resolve(result);
  };
  query.maybeSingle = () => Promise.resolve(result);
  query.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  return { query, calls };
}

function makeClient(user: { id: string } | null, result: QueryResult = { error: null }) {
  const { query, calls } = makeQuery(result);
  const from = jest.fn(() => query);
  const client = {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user }, error: null }),
      ),
    },
    from,
  } as unknown as SupabaseClient;
  return { client, from, calls };
}

describe("getFollowStatus", () => {
  it("returns no viewer when signed out", async () => {
    const { client, from } = makeClient(null);
    await expect(getFollowStatus(client, "p1")).resolves.toEqual({
      viewerId: null,
      isFollowing: false,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("does not query follows when viewing your own profile", async () => {
    const { client, from } = makeClient({ id: "me" });
    await expect(getFollowStatus(client, "me")).resolves.toEqual({
      viewerId: "me",
      isFollowing: false,
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("reports following when a follows row exists", async () => {
    const { client, calls } = makeClient(
      { id: "me" },
      { data: { followed_id: "p1" }, error: null },
    );
    await expect(getFollowStatus(client, "p1")).resolves.toEqual({
      viewerId: "me",
      isFollowing: true,
    });
    expect(calls).toContainEqual({ method: "eq", args: ["follower_id", "me"] });
    expect(calls).toContainEqual({ method: "eq", args: ["followed_id", "p1"] });
  });

  it("reports not following when no row exists", async () => {
    const { client } = makeClient({ id: "me" }, { data: null, error: null });
    await expect(getFollowStatus(client, "p1")).resolves.toEqual({
      viewerId: "me",
      isFollowing: false,
    });
  });

  it("throws when the follows query fails", async () => {
    const { client } = makeClient({ id: "me" }, { data: null, error: { message: "boom" } });
    await expect(getFollowStatus(client, "p1")).rejects.toThrow("boom");
  });
});

describe("setFollowing", () => {
  it("upserts a follows row when following", async () => {
    const { client, calls } = makeClient({ id: "me" });
    await setFollowing(client, "me", "p1", true);
    expect(calls[0]).toEqual({
      method: "upsert",
      args: [
        { follower_id: "me", followed_id: "p1" },
        { onConflict: "follower_id,followed_id", ignoreDuplicates: true },
      ],
    });
  });

  it("deletes the follows row when unfollowing", async () => {
    const { client, calls } = makeClient({ id: "me" });
    await setFollowing(client, "me", "p1", false);
    expect(calls.map((c) => c.method)).toEqual(["delete", "eq", "eq"]);
  });

  it("refuses to follow yourself", async () => {
    const { client, from } = makeClient({ id: "me" });
    await expect(setFollowing(client, "me", "me", true)).rejects.toThrow(
      "You can't follow yourself.",
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("surfaces Supabase errors", async () => {
    const { client } = makeClient({ id: "me" }, { error: { message: "denied" } });
    await expect(setFollowing(client, "me", "p1", true)).rejects.toThrow("denied");
    await expect(setFollowing(client, "me", "p1", false)).rejects.toThrow("denied");
  });
});
