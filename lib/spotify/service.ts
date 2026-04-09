import { albumSearchSchema } from "@/lib/validation/search";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

type SpotifyAlbumItem = {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string; height: number; width: number }[];
  release_date?: string;
};

export type AlbumSearchResult = {
  id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  release_year: string | null;
};

let cachedAccessToken: {
  token: string;
  expiresAt: number;
} | null = null;

async function getSpotifyAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error(
      "Spotify client ID/secret are not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your environment.",
    );
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.token;
  }

  const basic = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch Spotify access token: ${text}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedAccessToken.token;
}

export async function searchAlbums(rawQuery: string): Promise<AlbumSearchResult[]> {
  const { q } = albumSearchSchema.parse({ q: rawQuery });

  const token = await getSpotifyAccessToken();

  const params = new URLSearchParams({
    q,
    type: "album",
    limit: "10",
  });

  const response = await fetch(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify search failed: ${text}`);
  }

  const json = (await response.json()) as {
    albums?: { items?: SpotifyAlbumItem[] };
  };

  const items = json.albums?.items ?? [];

  return items.map((album) => {
    const artistName = album.artists?.[0]?.name ?? "Unknown Artist";
    const cover = album.images?.[0]?.url ?? null;
    const releaseYear = album.release_date
      ? album.release_date.slice(0, 4)
      : null;

    return {
      id: album.id,
      album_name: album.name,
      artist_name: artistName,
      cover_url: cover,
      release_year: releaseYear,
    } satisfies AlbumSearchResult;
  });
}
