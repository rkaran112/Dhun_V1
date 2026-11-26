import type { SupabaseClient } from "@supabase/supabase-js";
import { E2E_TEST_USER_KEY, signOutUser } from "@/lib/auth/sign-out";

function fakeSupabase(signOut: jest.Mock): SupabaseClient {
  return { auth: { signOut } } as unknown as SupabaseClient;
}

describe("signOutUser", () => {
  it("clears the E2E test user flag and succeeds without Supabase", async () => {
    const storage = { removeItem: jest.fn() };
    await expect(signOutUser(null, storage)).resolves.toEqual({ ok: true });
    expect(storage.removeItem).toHaveBeenCalledWith(E2E_TEST_USER_KEY);
  });

  it("ends the Supabase session", async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    await expect(signOutUser(fakeSupabase(signOut), null)).resolves.toEqual({ ok: true });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("returns the Supabase error message on failure", async () => {
    const signOut = jest.fn().mockResolvedValue({ error: { message: "Network down" } });
    await expect(signOutUser(fakeSupabase(signOut), null)).resolves.toEqual({
      ok: false,
      error: "Network down",
    });
  });

  it("returns a fallback message when signOut throws", async () => {
    const signOut = jest.fn().mockRejectedValue("boom");
    await expect(signOutUser(fakeSupabase(signOut), null)).resolves.toEqual({
      ok: false,
      error: "Sign out failed.",
    });
  });

  it("still signs out when storage throws", async () => {
    const storage = {
      removeItem: jest.fn(() => {
        throw new Error("blocked");
      }),
    };
    const signOut = jest.fn().mockResolvedValue({ error: null });
    await expect(signOutUser(fakeSupabase(signOut), storage)).resolves.toEqual({ ok: true });
    expect(signOut).toHaveBeenCalled();
  });
});
