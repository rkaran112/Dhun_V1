"use client";

import { Button } from "@/components/ui/button";

type ShelfFilterProps = {
  value: "all" | "listened" | "want-to-listen";
  onChange: (value: "all" | "listened" | "want-to-listen") => void;
};

export function ShelfFilter({ value, onChange }: ShelfFilterProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-muted p-1 text-xs">
      <Button
        type="button"
        size="sm"
        variant={value === "all" ? "default" : "ghost"}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onChange("all")}
      >
        All
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "listened" ? "default" : "ghost"}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onChange("listened")}
      >
        Listened
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "want-to-listen" ? "default" : "ghost"}
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onChange("want-to-listen")}
      >
        Want to listen
      </Button>
    </div>
  );
}
