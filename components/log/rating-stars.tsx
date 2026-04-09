"use client";

type RatingStarsProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
};

const STEP = 0.5;

export function RatingStars({ value, onChange, max = 5 }: RatingStarsProps) {
  const steps = Math.round((max / STEP));

  return (
    <div className="flex items-center gap-1" aria-label="Rating">
      {Array.from({ length: steps }).map((_, index) => {
        const stepValue = (index + 1) * STEP;
        const active = value >= stepValue;

        return (
          <button
            key={stepValue}
            type="button"
            onClick={onChange ? () => onChange(stepValue) : undefined}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent bg-transparent p-0 text-lg leading-none text-muted-foreground hover:text-yellow-400 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span className={active ? "text-yellow-400" : "text-muted-foreground"}>
              ★
            </span>
          </button>
        );
      })}
      <span className="ml-2 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}
