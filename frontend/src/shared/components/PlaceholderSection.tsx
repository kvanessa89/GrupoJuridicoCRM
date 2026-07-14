import './PlaceholderSection.css';

export function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="placeholder-section">
      <div className="placeholder-section-card">{label} — se construye en el próximo paso.</div>
    </div>
  );
}
