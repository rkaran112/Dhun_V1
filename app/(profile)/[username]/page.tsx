import { notFound } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileLog } from "@/components/profile/logs-grid";
import { Suspense } from "react";
import { ShelfFilterWithLogs } from "./shelf-filter-with-logs";

type ProfilePageProps = {
  params: { username: string };
};

async function getProfileData(username: string) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: logs, error: logsError } = await supabase
    .from("logs")
    .select(
      "id, album_name, artist_name, cover_url, rating, shelves, created_at",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (logsError || !logs) {
    return {
      profile,
      logs: [] as ProfileLog[],
    };
  }

  return {
    profile,
    logs: logs as ProfileLog[],
  };
}

function computeStats(logs: ProfileLog[]) {
  const totalLogs = logs.length;
  const averageRating =
    totalLogs === 0
      ? null
      : logs.reduce((sum, log) => sum + log.rating, 0) / totalLogs;

  let listenedCount = 0;
  let wantToListenCount = 0;

  for (const log of logs) {
    if (log.shelves.includes("listened")) listenedCount += 1;
    if (log.shelves.includes("want to listen")) wantToListenCount += 1;
  }

  return { totalLogs, averageRating, listenedCount, wantToListenCount };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const username = decodeURIComponent(params.username);
  const data = await getProfileData(username);

  if (!data) {
    notFound();
  }

  const { profile, logs } = data;
  const stats = computeStats(logs);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
      <ProfileHeader
        username={profile.username}
        totalLogs={stats.totalLogs}
        averageRating={stats.averageRating}
        listenedCount={stats.listenedCount}
        wantToListenCount={stats.wantToListenCount}
      />
      <section className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Logs</h2>
        <Suspense fallback={null}>
          <ShelfFilterWithLogs logs={logs} />
        </Suspense>
      </section>
    </div>
  );
}

