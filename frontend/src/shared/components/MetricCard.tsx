import './MetricCard.css';

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export function MetricCard({ label, value, sub, color }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-label">{label}</div>
      <div className="metric-card-value" style={{ color }}>
        {value}
      </div>
      <div className="metric-card-sub">{sub}</div>
    </div>
  );
}
