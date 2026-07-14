import { initials } from '../utils/initials';
import './Avatar.css';

interface AvatarProps {
  name: string;
  color: string;
  size: number;
  fontSize: number;
  title?: string;
}

export function Avatar({ name, color, size, fontSize, title }: AvatarProps) {
  return (
    <div
      className="avatar"
      title={title}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize,
      }}
    >
      {initials(name)}
    </div>
  );
}
