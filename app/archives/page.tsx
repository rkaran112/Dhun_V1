"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabase/client";

import { AlbumLogDialog } from "@/components/log/album-log-dialog";
import { RatingStars } from "@/components/log/rating-stars";

import type { AlbumSearchResult } from "@/lib/spotify/service";

type RankedListItem = {
  id: string;
  list_id: string;
  album_id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rank: number;
};

type RankedList = {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  items: RankedListItem[];
};

type ShelfLog = {
  id: string;
  album_id: string;
  album_name: string;
  artist_name: string;
  cover_url: string | null;
  rating: number;
  shelves: string[];
  created_at: string | null;
};

async function fetchRankedLists(): Promise<RankedList[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return [];

  const { data: listsData, error: listsError } = await supabase
    .from("ranked_lists")
    .select("id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (listsError || !listsData || listsData.length === 0) {
    return [];
  }

  const listIds = listsData.map((list) => list.id as string);

  const { data: itemsData, error: itemsError } = await supabase
    .from("ranked_list_items")
    .select(
      "id, list_id, album_id, album_name, artist_name, cover_url, rank",
    )
    .in("list_id", listIds)
    .order("rank", { ascending: true });

  if (itemsError || !itemsData) {
    return listsData.map((list) => ({
      id: list.id as string,
      name: list.name as string,
      description: (list.description as string | null) ?? null,
      created_at: (list.created_at as string | null) ?? null,
      items: [],
    }));
  }

  const itemsByList = new Map<string, RankedListItem[]>();

  for (const item of itemsData as RankedListItem[]) {
    const key = item.list_id;
    const existing = itemsByList.get(key) ?? [];
    existing.push(item);
    itemsByList.set(key, existing);
  }

  return listsData.map((list) => ({
    id: list.id as string,
    name: list.name as string,
    description: (list.description as string | null) ?? null,
    created_at: (list.created_at as string | null) ?? null,
    items: (itemsByList.get(list.id as string) ?? []).sort(
      (a, b) => a.rank - b.rank,
    ),
  }));
}

async function createListOnServer(payload: {
  name: string;
  description: string;
}): Promise<RankedList | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("ranked_lists")
    .insert({
      user_id: user.id,
      name: payload.name,
      description: payload.description || null,
    })
    .select("id, name, description, created_at")
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    description: (data.description as string | null) ?? null,
    created_at: (data.created_at as string | null) ?? null,
    items: [],
  };
}

async function addListItemOnServer(payload: {
  listId: string;
  album: AlbumSearchResult;
  nextRank: number;
}): Promise<RankedListItem | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ranked_list_items")
    .insert({
      list_id: payload.listId,
      album_id: payload.album.id,
      album_name: payload.album.album_name,
      artist_name: payload.album.artist_name,
      cover_url: payload.album.cover_url,
      rank: payload.nextRank,
    })
    .select(
      "id, list_id, album_id, album_name, artist_name, cover_url, rank",
    )
    .single();

  if (error || !data) return null;

  return data as RankedListItem;
}

async function reorderListItemsOnServer(payload: {
  listId: string;
  orderedIds: string[];
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const updates = payload.orderedIds.map((id, index) => ({
    id,
    list_id: payload.listId,
    rank: index + 1,
  }));

  await supabase
    .from("ranked_list_items")
    .upsert(updates, { onConflict: "id" });
}

async function fetchShelfLogs(): Promise<ShelfLog[]> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as ShelfLog[];
      return parsed.filter((log) => log.shelves.includes("want to listen"));
    } catch {
      return [];
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return [];

  const { data, error } = await supabase
    .from("logs")
    .select(
      "id, album_id, album_name, artist_name, cover_url, rating, shelves, created_at",
    )
    .eq("user_id", user.id)
    .contains("shelves", ["want to listen"]);

  if (error || !data) return [];

  return data as ShelfLog[];
}

async function logShelfItemOnServer(log: ShelfLog): Promise<void> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ShelfLog[];
      const next = parsed.map((entry) => {
        if (entry.id !== log.id) return entry;
        const shelves = Array.from(
          new Set([
            ...entry.shelves.filter((s) => s !== "want to listen"),
            "listened",
          ]),
        );
        return { ...entry, shelves };
      });
      window.localStorage.setItem("MUSICD_E2E_LOGS", JSON.stringify(next));
    } catch {
      // ignore
    }
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  const shelves = Array.from(
    new Set([
      ...log.shelves.filter((s) => s !== "want to listen"),
      "listened",
    ]),
  );

  await supabase
    .from("logs")
    .update({ shelves })
    .eq("id", log.id)
    .eq("user_id", user.id);
}

async function removeShelfItemOnServer(id: string): Promise<void> {
  const isBrowser = typeof window !== "undefined";
  const isTestMode =
    isBrowser && window.localStorage.getItem("MUSICD_E2E_TEST_USER") === "true";

  if (isTestMode) {
    const raw = isBrowser ? window.localStorage.getItem("MUSICD_E2E_LOGS") : null;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ShelfLog[];
      const next = parsed.filter((entry) => entry.id !== id);
      window.localStorage.setItem("MUSICD_E2E_LOGS", JSON.stringify(next));
    } catch {
      // ignore
    }
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return;

  await supabase.from("logs").delete().eq("id", id).eq("user_id", user.id);
}

function SortableListItem({ item }: { item: RankedListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-xs hover:bg-muted"
    >
      <span className="w-6 text-center text-[11px] font-semibold text-muted-foreground">
        {item.rank}
      </span>
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.cover_url}
          alt={item.album_name}
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded bg-background text-[9px] text-muted-foreground">
          No cover
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium leading-tight">
          {item.album_name}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {item.artist_name}
        </div>
      </div>
    </li>
  );
}

function RankedListCard({ list }: { list: RankedList }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<AlbumSearchResult[]>([]);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const reorderMutation = useMutation({
    mutationFn: reorderListItemsOnServer,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const items = React.useMemo(
    () => list.items.slice().sort((a, b) => a.rank - b.rank),
    [list.items],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = items.slice();
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const withRanks = reordered.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    queryClient.setQueryData<RankedList[]>(["ranked-lists"], (current) => {
      if (!current) return current;
      return current.map((existing) =>
        existing.id === list.id ? { ...existing, items: withRanks } : existing,
      );
    });

    reorderMutation.mutate({
      listId: list.id,
      orderedIds: withRanks.map((item) => item.id),
    });
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchError(null);
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(searchQuery.trim())}`,
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Search failed");
      }

      const json = (await response.json()) as { albums: AlbumSearchResult[] };
      setSearchResults(json.albums ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to search albums.";
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: addListItemOnServer,
    onSuccess: (created) => {
      if (!created) return;
      queryClient.setQueryData<RankedList[]>(["ranked-lists"], (current) => {
        if (!current) return current;
        return current.map((existing) =>
          existing.id === list.id
            ? { ...existing, items: [...existing.items, created] }
            : existing,
        );
      });
    },
  });

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{list.name}</h3>
          {list.description ? (
            <p className="text-xs text-muted-foreground">{list.description}</p>
          ) : null}
        </div>
        {list.created_at ? (
          <p className="text-[11px] text-muted-foreground">
            {new Date(list.created_at).toLocaleDateString()}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            placeholder="Search to append albums…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Button type="submit" size="sm" disabled={isSearching}>
            {isSearching ? "Searching…" : "Search"}
          </Button>
        </form>
        {searchError ? (
          <p className="text-xs text-destructive" role="alert">
            {searchError}
          </p>
        ) : null}
        {searchResults.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {searchResults.map((album) => (
              <button
                key={album.id}
                type="button"
                onClick={() =>
                  addMutation.mutate({
                    listId: list.id,
                    album,
                    nextRank: items.length + 1,
                  })
                }
                className="flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-left text-xs hover:bg-muted"
              >
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.cover_url}
                    alt={album.album_name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-[9px] text-muted-foreground">
                    No cover
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium leading-tight">
                    {album.album_name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {album.artist_name}
                    {album.release_year ? ` • ${album.release_year}` : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="space-y-1">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No albums yet. Search above to start building this list.
              </p>
            ) : (
              items.map((item) => <SortableListItem key={item.id} item={item} />)
            )}
          </ol>
        </SortableContext>
      </DndContext>
    </Card>
  );
}

function ShelfGrid({
  logs,
  onLog,
  onRemove,
  isMutating,
}: {
  logs: ShelfLog[];
  onLog: (log: ShelfLog) => void;
  onRemove: (id: string) => void;
  isMutating: boolean;
}) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your shelf is empty. Add albums you want to listen to when logging.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="group relative overflow-hidden rounded-md border bg-card"
        >
          {log.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={log.cover_url}
              alt={log.album_name}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <div className="absolute inset-0 flex flex-col justify-between bg-linear-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex justify-end p-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              On shelf
            </div>
            <div className="space-y-2 p-2">
              <div className="text-xs font-semibold leading-tight text-foreground">
                {log.album_name}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {log.artist_name}
              </div>
              <div className="mt-1 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-7 flex-1 text-[11px]"
                  disabled={isMutating}
                  onClick={() => onLog(log)}
                >
                  Log it
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 text-[11px]"
                  disabled={isMutating}
                  onClick={() => onRemove(log.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArchivesPage() {
  const queryClient = useQueryClient();
  const [listName, setListName] = React.useState("");
  const [listDescription, setListDescription] = React.useState("");

  const {
    data: lists,
    isLoading: listsLoading,
  } = useQuery<RankedList[]>({
    queryKey: ["ranked-lists"],
    queryFn: fetchRankedLists,
  });

  const {
    data: shelfLogs,
    isLoading: shelfLoading,
  } = useQuery<ShelfLog[]>({
    queryKey: ["shelf-logs"],
    queryFn: fetchShelfLogs,
  });

  const createListMutation = useMutation({
    mutationFn: createListOnServer,
    onSuccess: (created) => {
      if (!created) return;
      queryClient.setQueryData<RankedList[]>(["ranked-lists"], (current) => {
        if (!current) return [created];
        return [created, ...current];
      });
      setListName("");
      setListDescription("");
    },
  });

  const logMutation = useMutation({
    mutationFn: logShelfItemOnServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf-logs"] });
      queryClient.invalidateQueries({ queryKey: ["logbook-logs"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeShelfItemOnServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shelf-logs"] });
    },
  });

  const handleCreateList = (event: React.FormEvent) => {
    event.preventDefault();
    if (!listName.trim()) return;

    createListMutation.mutate({
      name: listName.trim(),
      description: listDescription.trim(),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Archives</h1>
        <p className="text-sm text-muted-foreground">
          Curate ranked lists and manage your want-to-listen shelf.
        </p>
      </header>

      <Tabs defaultValue="lists" className="flex flex-1 flex-col gap-4">
        <TabsList>
          <TabsTrigger value="lists">Ranked lists</TabsTrigger>
          <TabsTrigger value="shelf">The shelf</TabsTrigger>
        </TabsList>
        <TabsContent value="lists" className="space-y-4">
          <Card className="p-4">
            <form
              onSubmit={handleCreateList}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <Input
                placeholder="List name (e.g., Best of 2024)"
                value={listName}
                onChange={(event) => setListName(event.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={listDescription}
                onChange={(event) => setListDescription(event.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                disabled={createListMutation.isPending}
              >
                {createListMutation.isPending ? "Creating…" : "Create list"}
              </Button>
            </form>
          </Card>

          {listsLoading ? (
            <p className="text-sm text-muted-foreground">Loading your lists…</p>
          ) : !lists || lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ranked lists yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <RankedListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shelf" className="space-y-4">
          {shelfLoading ? (
            <p className="text-sm text-muted-foreground">Loading your shelf…</p>
          ) : (
            <ShelfGrid
              logs={shelfLogs ?? []}
              onLog={(log) => logMutation.mutate(log)}
              onRemove={(id) => removeMutation.mutate(id)}
              isMutating={logMutation.isPending || removeMutation.isPending}
            />
          )}
        </TabsContent>
      </Tabs>

      <section className="hidden">
        {/* Placeholder to ensure AlbumLogDialog tree-shakes correctly when unused here */}
        <AlbumLogDialog
          album={{
            id: "placeholder",
            album_name: "",
            artist_name: "",
            cover_url: null,
          }}
          disabled
        />
      </section>
    </div>
  );
}
