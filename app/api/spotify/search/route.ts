import { NextResponse } from "next/server";
import { searchAlbums } from "@/lib/spotify/service";
import { describeSearchError } from "@/lib/spotify/search-error";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const albums = await searchAlbums(query);
    return NextResponse.json({ albums });
  } catch (error) {
    const { message, status } = describeSearchError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
