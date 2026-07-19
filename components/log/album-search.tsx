"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlbumSearchResult } from "@/lib/spotify/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlbumLogDialog } from "@/components/log/album-log-dialog";
import { parseApiErrorMessage } from "@/lib/http";

type AlbumSearchProps = {
  isAuthenticated: boolean;
};

export function AlbumSearch({ isAuthenticated }: AlbumSearchProps) {
  const [query, setQuery] = useState("");

  const search = useMutation({
    mutationFn: async (q: string) => {
      const isTestMode =
        typeof window !== "undefined" &&
        window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

      if (isTestMode) {
        const stub: AlbumSearchResult[] = [
          {
            id: "test-album-1",
            album_name: "Discovery",
            artist_name: "Daft Punk",
            cover_url: "https://example.com/cover.jpg",
            release_year: "2001",
          },
        ];
        return stub;
      }

      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(q)}`,
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(parseApiErrorMessage(text, "Search failed"));
      }

      const json = (await response.json()) as {
        albums: AlbumSearchResult[];
      };

      return json.albums;
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    search.reset();
    search.mutate(query.trim());
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          placeholder="Search for an album (e.g., Daft Punk - Discovery)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Button type="submit" className="shrink-0">
          Search
        </Button>
      </form>

      {search.isPending ? (
        <p className="text-sm text-muted-foreground">Searching…</p>
      ) : null}

      {search.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {(search.error as Error).message}
        </p>
      ) : null}

      {search.data && search.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No albums found.</p>
      ) : null}

      {search.data && search.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {search.data.map((album) => (
            <Card key={album.id} className="flex flex-col gap-2 p-3">
              {album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={album.cover_url}
                  alt={album.album_name}
                  className="h-40 w-full rounded object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  No cover
                </div>
              )}
              <div className="flex flex-1 flex-col justify-between gap-1">
                <div>
                  <div className="text-sm font-medium leading-tight">
                    {album.album_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {album.artist_name}
                    {album.release_year
                      ? ` • ${album.release_year}`
                      : null}
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <AlbumLogDialog
                    album={album}
                    disabled={!isAuthenticated}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
