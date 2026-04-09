import { NextResponse } from "next/server";
import { searchAlbums } from "@/lib/spotify/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const albums = await searchAlbums(query);
    return NextResponse.json({ albums });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Spotify.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
