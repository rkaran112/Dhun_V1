type FetchResponseStub = {
  ok: boolean;
  json?: unknown;
  text?: string;
};

function mockFetchSequence(responses: FetchResponseStub[]) {
  let call = 0;
  global.fetch = jest.fn(() => {
    const response = responses[call];
    call += 1;
    return Promise.resolve({
      ok: response.ok,
      json: () => Promise.resolve(response.json ?? {}),
      text: () => Promise.resolve(response.text ?? ""),
    }) as unknown as Promise<Response>;
  }) as unknown as typeof fetch;
}

describe("searchAlbums", () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env.SPOTIFY_CLIENT_ID = "test-client-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("throws when Spotify credentials are not configured", async () => {
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;

    const { searchAlbums } = await import("@/lib/spotify/service");

    await expect(searchAlbums("daft punk")).rejects.toThrow(
      "Spotify client ID/secret are not configured",
    );
  });

  it("rejects a query shorter than 2 characters before making any request", async () => {
    const { searchAlbums } = await import("@/lib/spotify/service");
    global.fetch = jest.fn();

    await expect(searchAlbums("a")).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("throws when the access token request fails", async () => {
    mockFetchSequence([{ ok: false, text: "invalid_client" }]);

    const { searchAlbums } = await import("@/lib/spotify/service");

    await expect(searchAlbums("daft punk")).rejects.toThrow(
      "Failed to fetch Spotify access token",
    );
  });

  it("throws when the album search request fails", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "token-1", expires_in: 3600 } },
      { ok: false, text: "rate limited" },
    ]);

    const { searchAlbums } = await import("@/lib/spotify/service");

    await expect(searchAlbums("daft punk")).rejects.toThrow(
      "Spotify search failed",
    );
  });

  it("maps Spotify albums to search results, applying fallbacks for missing fields", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "token-1", expires_in: 3600 } },
      {
        ok: true,
        json: {
          albums: {
            items: [
              {
                id: "1",
                name: "Discovery",
                artists: [{ name: "Daft Punk" }],
                images: [
                  { url: "https://example.com/cover.jpg", height: 300, width: 300 },
                ],
                release_date: "2001-03-07",
              },
              {
                id: "2",
                name: "Unreleased Sessions",
                artists: [],
                images: [],
              },
            ],
          },
        },
      },
    ]);

    const { searchAlbums } = await import("@/lib/spotify/service");

    await expect(searchAlbums("daft punk")).resolves.toEqual([
      {
        id: "1",
        album_name: "Discovery",
        artist_name: "Daft Punk",
        cover_url: "https://example.com/cover.jpg",
        release_year: "2001",
      },
      {
        id: "2",
        album_name: "Unreleased Sessions",
        artist_name: "Unknown Artist",
        cover_url: null,
        release_year: null,
      },
    ]);
  });

  it("returns an empty array when Spotify returns no album items", async () => {
    mockFetchSequence([
      { ok: true, json: { access_token: "token-1", expires_in: 3600 } },
      { ok: true, json: {} },
    ]);

    const { searchAlbums } = await import("@/lib/spotify/service");

    await expect(searchAlbums("daft punk")).resolves.toEqual([]);
  });

  it("reuses the cached access token for a subsequent search instead of re-authenticating", async () => {
    let tokenCalls = 0;
    let searchCalls = 0;
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("accounts.spotify.com")) {
        tokenCalls += 1;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: "token-1", expires_in: 3600 }),
          text: () => Promise.resolve(""),
        }) as unknown as Promise<Response>;
      }
      searchCalls += 1;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ albums: { items: [] } }),
        text: () => Promise.resolve(""),
      }) as unknown as Promise<Response>;
    }) as unknown as typeof fetch;

    const { searchAlbums } = await import("@/lib/spotify/service");

    await searchAlbums("daft punk");
    await searchAlbums("daft punk");

    expect(tokenCalls).toBe(1);
    expect(searchCalls).toBe(2);
  });
});
