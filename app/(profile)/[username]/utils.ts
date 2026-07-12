import { ProfileLog } from "@/components/profile/logs-grid";

export function filterLogs(
  logs: ProfileLog[],
  shelf: "all" | "listened" | "want-to-listen",
) {
  if (shelf === "all") return logs;
  if (shelf === "listened") {
    return logs.filter((log) => log.shelves.includes("listened"));
  }
  return logs.filter((log) => log.shelves.includes("want to listen"));
}

export function computeStats(logs: ProfileLog[]) {
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
