type MonthDividerProps = {
  label: string;
};

export function MonthDivider({ label }: MonthDividerProps) {
  return (
    <div className="flex items-center gap-3 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
