describe("getSupabaseClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when the Supabase URL/anon key are not configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { getSupabaseClient } = await import("@/lib/supabase/client");

    expect(getSupabaseClient()).toBeNull();
  });

  it("returns a client once the Supabase URL/anon key are configured", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { getSupabaseClient } = await import("@/lib/supabase/client");

    expect(getSupabaseClient()).not.toBeNull();
  });

  it("reuses the same client instance across calls", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { getSupabaseClient } = await import("@/lib/supabase/client");

    expect(getSupabaseClient()).toBe(getSupabaseClient());
  });
});

describe("getServerSupabaseClient", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when no Supabase URL is configured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { getServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(getServerSupabaseClient()).toBeNull();
  });

  it("falls back to SUPABASE_URL and the anon key when the service role key is unset", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { getServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(getServerSupabaseClient()).not.toBeNull();
  });

  it("prefers the service role key over the anon key when both are set", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { getServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(getServerSupabaseClient()).not.toBeNull();
  });

  it("reuses the same client instance across calls", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { getServerSupabaseClient } = await import("@/lib/supabase/server");

    expect(getServerSupabaseClient()).toBe(getServerSupabaseClient());
  });
});
