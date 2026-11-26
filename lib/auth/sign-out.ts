import type { SupabaseClient } from "@supabase/supabase-js";

export const E2E_TEST_USER_KEY = "MUSICD_E2E_TEST_USER";

export type SignOutResult = { ok: true } | { ok: false; error: string };

/**
 * Signs the current user out.
 *
 * Clears the E2E test-mode user flag (if present) and ends the Supabase
 * session. Returns a result object instead of throwing so callers can
 * surface a message without a try/catch.
 */
export async function signOutUser(
  supabase: SupabaseClient | null,
  storage: Pick<Storage, "removeItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
): Promise<SignOutResult> {
  try {
    storage?.removeItem(E2E_TEST_USER_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data); ignore.
  }

  if (!supabase) {
    return { ok: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { ok: false, error: error.message || "Sign out failed." };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error && err.message ? err.message : "Sign out failed.",
    };
  }
}
