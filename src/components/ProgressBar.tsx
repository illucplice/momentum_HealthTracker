interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  className?: string;
}

export function ProgressBar({ percentage, color = '#6366f1', height = 6, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className={`progress-bar ${className}`} style={{ height }} >
      <div
        className="progress-fill"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
