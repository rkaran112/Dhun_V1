"use client";

import { useState } from "react";
import { ShelfFilter } from "@/components/profile/shelf-filter";
import { LogsGrid, ProfileLog } from "@/components/profile/logs-grid";
import { filterLogs } from "./utils";

type ShelfFilterWithLogsProps = {
  logs: ProfileLog[];
};

export function ShelfFilterWithLogs({ logs }: ShelfFilterWithLogsProps) {
  const [shelf, setShelf] = useState<"all" | "listened" | "want-to-listen">(
    "all",
  );

  const filtered = filterLogs(logs, shelf);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex justify-end">
        <ShelfFilter value={shelf} onChange={setShelf} />
      </div>
      <LogsGrid logs={filtered} />
    </div>
  );
}
