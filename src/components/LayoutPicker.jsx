import './LayoutPicker.css';

// Tiny SVG thumbnails approximating each layout. `accent` is the live theme color
// so the previews update as the user changes the palette.
const Thumb = ({ variant, accent }) => {
  const bar = (x, y, w, h, fill) => <rect x={x} y={y} width={w} height={h} rx="1" fill={fill} />;
  const g = '#cbd5e1';
  const d = '#94a3b8';

  switch (variant) {
    case 'single':
      return (
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {bar(8, 8, 30, 5, accent)}
          {bar(8, 16, 20, 2, d)}
          <rect x="8" y="22" width="44" height="1.5" fill={accent} />
          {bar(8, 27, 44, 2, g)}{bar(8, 31, 40, 2, g)}
          {bar(8, 39, 44, 2, g)}{bar(8, 43, 38, 2, g)}
          {bar(8, 51, 44, 2, g)}{bar(8, 55, 42, 2, g)}
        </svg>
      );
    case 'two-column':
      return (
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          <rect width="22" height="80" fill="#f1f5f9" />
          <circle cx="11" cy="14" r="6" fill={accent} />
          {bar(4, 26, 14, 2, d)}{bar(4, 31, 12, 2, g)}{bar(4, 35, 13, 2, g)}
          {bar(28, 10, 24, 5, accent)}
          {bar(28, 22, 26, 2, g)}{bar(28, 26, 22, 2, g)}
          {bar(28, 34, 26, 2, g)}{bar(28, 38, 20, 2, g)}
        </svg>
      );
    case 'executive':
      return (
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {bar(8, 9, 44, 6, '#0f172a')}
          <rect x="8" y="17" width="44" height="2" fill={accent} />
          <rect x="8" y="26" width="2" height="10" fill={accent} />
          {bar(13, 26, 30, 2, d)}{bar(13, 30, 26, 2, g)}
          <rect x="8" y="42" width="2" height="10" fill={accent} />
          {bar(13, 42, 30, 2, d)}{bar(13, 46, 24, 2, g)}
        </svg>
      );
    case 'creative':
      return (
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          <rect width="22" height="80" fill={accent} />
          <circle cx="11" cy="14" r="6" fill="#fff" opacity="0.9" />
          {bar(4, 26, 14, 2, '#fff')}{bar(4, 31, 12, 2, '#ffffffaa')}
          <line x1="30" y1="10" x2="30" y2="60" stroke={accent} strokeWidth="1.5" />
          <circle cx="30" cy="20" r="2.5" fill={accent} />
          {bar(35, 18, 18, 2, d)}{bar(35, 22, 15, 2, g)}
          <circle cx="30" cy="38" r="2.5" fill={accent} />
          {bar(35, 36, 18, 2, d)}{bar(35, 40, 13, 2, g)}
        </svg>
      );
    case 'minimal':
      return (
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {bar(8, 10, 26, 4, '#0f172a')}
          {bar(8, 17, 18, 2, d)}
          {bar(8, 28, 44, 2, g)}{bar(8, 32, 42, 2, g)}
          {bar(8, 42, 44, 2, g)}{bar(8, 46, 40, 2, g)}
          {bar(8, 56, 44, 2, g)}
        </svg>
      );
    default:
      return null;
  }
};

const LAYOUTS = [
  { id: 'single', name: 'Single Column' },
  { id: 'two-column', name: 'Two Column' },
  { id: 'executive', name: 'Executive' },
  { id: 'creative', name: 'Creative' },
  { id: 'minimal', name: 'Minimal' }
];

const LayoutPicker = ({ value, accent, onChange }) => (
  <div className="layout-picker">
    {LAYOUTS.map(l => (
      <button
        key={l.id}
        type="button"
        className={`layout-card ${value === l.id ? 'selected' : ''}`}
        onClick={() => onChange(l.id)}
        title={l.name}
      >
        <Thumb variant={l.id} accent={accent || '#3b82f6'} />
        <span className="layout-card-name">{l.name}</span>
      </button>
    ))}
  </div>
);

export default LayoutPicker;
