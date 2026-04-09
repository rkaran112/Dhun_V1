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
