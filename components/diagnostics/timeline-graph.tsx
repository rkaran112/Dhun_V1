type TimelinePoint = {
  label: string;
  count: number;
};

type TimelineGraphProps = {
  points: TimelinePoint[];
};

export function TimelineGraph({ points }: TimelineGraphProps) {
  if (points.length === 0) {
    return (
      <pre className="rounded-md bg-muted p-3 text-[11px] font-mono text-muted-foreground">
        No timeline data yet.
      </pre>
    );
  }

  const max = Math.max(...points.map((p) => p.count));
  const height = 8;

  const grid: string[][] = Array.from({ length: height }, () =>
    Array(points.length).fill(" "),
  );

  points.forEach((point, x) => {
    const normalized = max === 0 ? 0 : Math.round((point.count / max) * (height - 1));
    for (let y = height - 1; y >= height - 1 - normalized; y -= 1) {
      grid[y][x] = "#";
    }
  });

  return (
    <pre className="rounded-md bg-muted p-3 text-[11px] font-mono leading-relaxed text-foreground">
Listening timeline (last 12 months)
-----------------------------------
{grid.map((row, rowIndex) => {
  const line = row.join(" ");
  // Use the bottom row for tooltips describing monthly counts.
  if (rowIndex === grid.length - 1) {
    return (
      <span key={`row-${rowIndex}`}>
        {line}
        {"\n"}
      </span>
    );
  }
  return (
    <span key={`row-${rowIndex}`}>
      {line}
      {"\n"}
    </span>
  );
})}
{points.map((point) => (
  <span
    key={point.label}
    title={`${point.count} logs in ${point.label}`}
  >
    {point.label.padStart(3, " ")}
    {" "}
  </span>
))}
    </pre>
  );
}
