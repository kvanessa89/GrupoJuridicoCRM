import { withAlpha } from '../utils/colors';
import './Badge.css';

interface BadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, size = 'md' }: BadgeProps) {
  return (
    <span
      className={`badge badge--${size}`}
      style={{ background: withAlpha(color), color }}
    >
      {label}
    </span>
  );
}
