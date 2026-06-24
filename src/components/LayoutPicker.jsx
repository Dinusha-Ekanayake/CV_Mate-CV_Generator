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
    case 'timeline':
      return (
        /* Timeline: coloured name, underline section titles, timeline dots */
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {bar(8, 8, 30, 4, accent)}
          {bar(8, 15, 18, 2, d)}
          <rect x="8" y="21" width="44" height="1.5" fill={accent} />
          {/* Section title with underline */}
          {bar(8, 27, 22, 2, accent)}
          <rect x="8" y="31" width="44" height="1" fill={`${accent}55`} />
          {/* Timeline rail + dots */}
          <rect x="12" y="35" width="1.5" height="36" fill={`${accent}33`} />
          <circle cx="12.75" cy="38" r="2.2" fill={accent} />
          {bar(18, 36, 26, 2, d)}{bar(18, 40, 20, 1.5, g)}{bar(18, 43, 22, 1.5, g)}
          <circle cx="12.75" cy="52" r="2.2" fill={accent} />
          {bar(18, 50, 26, 2, d)}{bar(18, 54, 18, 1.5, g)}{bar(18, 57, 20, 1.5, g)}
          <circle cx="12.75" cy="66" r="2.2" fill={accent} />
          {bar(18, 64, 26, 2, d)}{bar(18, 68, 16, 1.5, g)}
        </svg>
      );
    case 'compact-pro':
      return (
        /* Compact: letter-spaced section headers, underline rule, dense rows */
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {/* Bold name + subtitle */}
          {bar(8, 8, 28, 4, '#0f172a')}
          {bar(8, 15, 20, 2, accent)}
          <rect x="8" y="20" width="44" height="1.5" fill="#0f172a" />
          {/* Spaced section title */}
          {bar(8, 26, 30, 2, accent)}
          <rect x="8" y="30" width="44" height="0.75" fill="#e2e8f0" />
          {/* Item rows: title right date */}
          {bar(8, 34, 24, 2, '#0f172a')}{bar(40, 34, 12, 2, d)}
          {bar(8, 38, 40, 1.5, g)}{bar(8, 41, 36, 1.5, g)}
          <rect x="8" y="46" width="44" height="0.5" fill="#f1f5f9" />
          {bar(8, 50, 30, 2, accent)}
          <rect x="8" y="54" width="44" height="0.75" fill="#e2e8f0" />
          {bar(8, 58, 24, 2, '#0f172a')}{bar(40, 58, 12, 2, d)}
          {bar(8, 62, 40, 1.5, g)}{bar(8, 65, 34, 1.5, g)}
        </svg>
      );
    case 'modern':
      return (
        /* Modern: big name, coloured underline section titles, accent dates */
        <svg viewBox="0 0 60 80" className="layout-thumb-svg">
          <rect width="60" height="80" fill="#fff" />
          {/* Large name */}
          {bar(8, 7, 36, 5, '#0f172a')}
          {bar(8, 15, 20, 2, accent)}
          {/* Inline contact row */}
          {bar(8, 21, 10, 1.5, d)}{bar(22, 21, 10, 1.5, d)}{bar(36, 21, 10, 1.5, d)}
          {/* Coloured section title + full underline */}
          {bar(8, 28, 22, 2, accent)}
          <rect x="8" y="32" width="44" height="1.5" fill={accent} />
          {/* Work entries with accent date */}
          {bar(8, 36, 26, 2, '#0f172a')}{bar(42, 36, 10, 2, accent)}
          {bar(8, 40, 18, 1.5, d)}
          {bar(8, 44, 38, 1.5, g)}{bar(8, 47, 34, 1.5, g)}
          {bar(8, 54, 22, 2, accent)}
          <rect x="8" y="58" width="44" height="1.5" fill={accent} />
          {bar(8, 62, 26, 2, '#0f172a')}{bar(42, 62, 10, 2, accent)}
          {bar(8, 66, 38, 1.5, g)}{bar(8, 69, 30, 1.5, g)}
        </svg>
      );
    default:
      return null;
  }
};

const LAYOUTS = [
  { id: 'single',      name: 'Classic' },
  { id: 'two-column',  name: 'Sidebar' },
  { id: 'executive',   name: 'Executive' },
  { id: 'creative',    name: 'Creative' },
  { id: 'minimal',     name: 'Minimal' },
  { id: 'timeline',    name: 'Timeline' },
  { id: 'compact-pro', name: 'Compact' },
  { id: 'modern',      name: 'Modern' },
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
