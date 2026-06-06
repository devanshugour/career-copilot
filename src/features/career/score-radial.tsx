import { cn } from "@/lib/utils";

export function ScoreRadial({
  value,
  label,
  size = 120,
  stroke = 12,
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color =
    value >= 80 ? "text-success" : value >= 60 ? "text-primary" : value >= 40 ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-muted/40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className={cn("transition-[stroke-dashoffset] duration-700", color)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={cn("text-2xl font-bold", color)}>{Math.round(value)}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </div>
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}
