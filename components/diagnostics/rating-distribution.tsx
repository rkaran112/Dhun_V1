type RatingBucket = {
  rating: number;
  count: number;
};

type RatingDistributionProps = {
  buckets: RatingBucket[];
};

export function RatingDistribution({ buckets }: RatingDistributionProps) {
  if (buckets.length === 0) {
    return (
      <pre className="rounded-md bg-muted p-3 text-[11px] font-mono text-muted-foreground">
        No rating data yet.
      </pre>
    );
  }

  const max = Math.max(...buckets.map((b) => b.count));
  const barWidth = 24;

  const buildBar = (count: number) => {
    if (max === 0) return "";
    const filled = Math.round((count / max) * barWidth);
    return "#".repeat(filled).padEnd(barWidth, " ");
  };

  const sorted = buckets.slice().sort((a, b) => a.rating - b.rating);

  return (
    <pre className="rounded-md bg-muted p-3 text-[11px] font-mono leading-relaxed text-foreground">
Rating distribution
-------------------
{sorted.map((bucket) => {
  const label = bucket.rating.toFixed(1).padStart(3, " ");
  const bar = buildBar(bucket.count);
  const line = `${label} | ${bar}  (${bucket.count})`;
  return (
    <span
      key={bucket.rating}
      title={`${bucket.count} logs at ${bucket.rating.toFixed(1)} stars`}
    >
      {line}
      {"\n"}
    </span>
  );
})}
    </pre>
  );
}
