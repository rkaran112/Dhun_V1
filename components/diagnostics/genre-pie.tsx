type GenreSlice = {
  label: string;
  count: number;
};

type GenrePieProps = {
  slices: GenreSlice[];
  onSelectGenre?: (label: string) => void;
};

export function GenrePie({ slices, onSelectGenre }: GenrePieProps) {
  if (slices.length === 0) {
    return (
      <pre className="rounded-md bg-muted p-3 text-[11px] font-mono text-muted-foreground">
        No genre data yet.
      </pre>
    );
  }

  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const max = Math.max(...slices.map((s) => s.count));
  const barWidth = 20;

  const buildBar = (count: number) => {
    if (max === 0) return "";
    const filled = Math.round((count / max) * barWidth);
    return "*".repeat(filled).padEnd(barWidth, " ");
  };

  return (
    <pre className="rounded-md bg-muted p-3 text-[11px] font-mono leading-relaxed text-foreground">
Genre breakdown (pseudo-pie)
----------------------------
{slices
  .slice()
  .sort((a, b) => b.count - a.count)
  .map((slice) => {
    const percentage = total ? ((slice.count / total) * 100).toFixed(1) : "0.0";
    const bar = buildBar(slice.count);
    const label = slice.label.padEnd(14, " ");
    const line = `${label}| ${bar}  (${slice.count}, ${percentage}%)`;
    return onSelectGenre ? (
      <span
        key={slice.label}
        title={`${slice.count} logs for ${slice.label}`}
        onClick={() => onSelectGenre(slice.label)}
        className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-primary"
      >
        {line}
        {"\n"}
      </span>
    ) : (
      <span
        key={slice.label}
        title={`${slice.count} logs for ${slice.label}`}
      >
        {line}
        {"\n"}
      </span>
    );
  })}
    </pre>
  );
}
