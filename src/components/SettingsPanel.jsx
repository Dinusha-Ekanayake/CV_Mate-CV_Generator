import { useState } from 'react';
import { ChevronDown, Palette, Type, LayoutGrid, ListOrdered, Sun, Moon } from 'lucide-react';
import LayoutPicker from './LayoutPicker';
import './SettingsPanel.css';

const PALETTES = [
  { id: 'default', color: '#3b82f6', bg: '#0f172a', name: 'Slate Blue' },
  { id: 'midnight', color: '#fbbf24', bg: '#1e293b', name: 'Midnight Gold' },
  { id: 'forest', color: '#10b981', bg: '#064e3b', name: 'Forest Sage' },
  { id: 'cyberpunk', color: '#06b6d4', bg: '#2e1065', name: 'Cyberpunk Neon' },
  { id: 'crimson', color: '#e11d48', bg: '#1c1917', name: 'Crimson Ash' }
];

const HEADING_FONTS = [
  { value: "'Inter', sans-serif", label: 'Modern Sans (Inter)' },
  { value: "'Playfair Display', serif", label: 'Classic Serif (Playfair)' },
  { value: "'Space Grotesk', sans-serif", label: 'Tech (Space Grotesk)' },
  { value: "'Georgia', serif", label: 'Formal Serif (Georgia)' }
];

const BODY_FONTS = [
  { value: "'Inter', sans-serif", label: 'Modern Sans (Inter)' },
  { value: "'Lato', sans-serif", label: 'Clean Sans (Lato)' },
  { value: "'Merriweather', serif", label: 'Formal Serif (Merriweather)' }
];

// Reusable labelled segmented control.
const Segmented = ({ value, onChange, options }) => (
  <div className="seg-control" role="group">
    {options.map(opt => (
      <button
        key={opt.value}
        type="button"
        className={`seg-btn ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}
        title={opt.hint || opt.label}
      >
        {opt.icon}{opt.label}
      </button>
    ))}
  </div>
);

const Group = ({ icon, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`settings-group ${open ? 'open' : ''}`}>
      <button type="button" className="settings-group-header" onClick={() => setOpen(o => !o)}>
        <span className="settings-group-title">{icon}{title}</span>
        <ChevronDown size={16} className="settings-group-chevron" />
      </button>
      {open && <div className="settings-group-body">{children}</div>}
    </div>
  );
};

const SettingsPanel = ({ settings, setSettings, activeTab, sectionOrder, onMoveSection, onTogglePageBreak }) => {
  const set = (patch) => setSettings({ ...settings, ...patch });
  const isResume = activeTab === 'resume';

  return (
    <div className="settings-panel-v2 glass-panel">
      <h2 className="settings-panel-heading">Document Settings &amp; Layout</h2>

      {isResume && (
        <Group icon={<LayoutGrid size={15} />} title="Layout">
          <LayoutPicker
            value={settings.layout}
            accent={settings.themeColor}
            onChange={(layout) => set({ layout })}
          />
        </Group>
      )}

      <Group icon={<Palette size={15} />} title="Theme & Color">
        <div className="setting-field">
          <label className="setting-label">Color Palette</label>
          <div className="palette-row">
            {PALETTES.map(pal => (
              <button
                key={pal.id}
                className={`palette-swatch ${settings.palette === pal.id ? 'selected' : ''}`}
                onClick={() => set({ palette: pal.id, themeColor: pal.color })}
                title={pal.name}
                style={{
                  background: `linear-gradient(135deg, ${pal.bg} 50%, ${pal.color} 50%)`,
                  '--swatch-ring': pal.color
                }}
              />
            ))}
            <label className={`palette-swatch palette-custom ${settings.palette === 'custom' ? 'selected' : ''}`} title="Custom color" style={{ '--swatch-ring': settings.themeColor }}>
              <span style={{ background: settings.themeColor }} />
              <input
                type="color"
                value={settings.themeColor}
                onChange={e => set({ palette: 'custom', themeColor: e.target.value })}
              />
            </label>
          </div>
          <span className="setting-hint mono">{settings.themeColor.toUpperCase()}</span>
        </div>

        <div className="setting-field">
          <label className="setting-label">Document Mode</label>
          <Segmented
            value={settings.darkMode ? 'dark' : 'light'}
            onChange={(v) => set({ darkMode: v === 'dark' })}
            options={[
              { value: 'light', label: 'Light', icon: <Sun size={14} /> },
              { value: 'dark', label: 'Dark', icon: <Moon size={14} /> }
            ]}
          />
        </div>
      </Group>

      <Group icon={<Type size={15} />} title="Typography">
        <div className="setting-field">
          <label className="setting-label">Heading Font</label>
          <select className="setting-select" value={settings.headingFont} onChange={e => set({ headingFont: e.target.value })}>
            {HEADING_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="setting-field">
          <label className="setting-label">Body Font</label>
          <select className="setting-select" value={settings.bodyFont} onChange={e => set({ bodyFont: e.target.value })}>
            {BODY_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div className="setting-field">
          <label className="setting-label">Density</label>
          <Segmented
            value={settings.density}
            onChange={(density) => set({ density })}
            options={[
              { value: 'compact', label: 'Compact', hint: 'Fit more per page' },
              { value: 'normal', label: 'Standard', hint: 'Balanced' },
              { value: 'spacious', label: 'Spacious', hint: 'Airy & elegant' }
            ]}
          />
        </div>
        <div className="setting-field">
          <label className="setting-label">
            Font Size
            <span className="font-size-value">{Math.round((Number(settings.fontScale) || 1) * 100)}%</span>
          </label>
          <input
            type="range"
            className="font-size-range"
            min="0.85"
            max="1.2"
            step="0.05"
            value={Number(settings.fontScale) || 1}
            onChange={e => set({ fontScale: parseFloat(e.target.value) })}
          />
          <span className="setting-hint">Line &amp; letter spacing adjust automatically.</span>
        </div>
      </Group>

      {isResume && (
        <Group icon={<LayoutGrid size={15} />} title="Resume Options">
          <div className="setting-field">
            <label className="setting-label">Skill Style</label>
            <Segmented
              value={settings.skillStyle}
              onChange={(skillStyle) => set({ skillStyle })}
              options={[
                { value: 'classic', label: 'Classic' },
                { value: 'tags', label: 'Tags' }
              ]}
            />
          </div>
          <div className="setting-field">
            <label className="setting-label">Photo Shape</label>
            <Segmented
              value={settings.photoShape}
              onChange={(photoShape) => set({ photoShape })}
              options={[
                { value: 'circle', label: 'Circle' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'square', label: 'Square' }
              ]}
            />
          </div>
          <div className="setting-field setting-field-row">
            <label className="setting-label" htmlFor="showIcons">Section Icons</label>
            <label className="switch">
              <input
                id="showIcons"
                type="checkbox"
                checked={settings.showIcons}
                onChange={e => set({ showIcons: e.target.checked })}
              />
              <span className="switch-slider" />
            </label>
          </div>
        </Group>
      )}

      {isResume && (
        <Group icon={<ListOrdered size={15} />} title="Section Order & Page Breaks" defaultOpen={false}>
          <div className="section-order-list">
            {sectionOrder.map((sec, i) => {
              const hasBreak = Array.isArray(settings.pageBreaks) && settings.pageBreaks.includes(sec);
              return (
                <div key={sec} className="section-order-item">
                  <span className="section-order-name">{sec}</span>
                  <div className="section-order-actions">
                    <button
                      className={`page-break-chip ${hasBreak ? 'active' : ''}`}
                      onClick={() => onTogglePageBreak(sec)}
                      title={hasBreak ? 'Remove page break before this section' : 'Start this section on a new page'}
                    >
                      ⤓ Break
                    </button>
                    <button className="order-arrow" disabled={i === 0} onClick={() => onMoveSection(i, 'up')} title="Move up">↑</button>
                    <button className="order-arrow" disabled={i === sectionOrder.length - 1} onClick={() => onMoveSection(i, 'down')} title="Move down">↓</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Group>
      )}
    </div>
  );
};

export default SettingsPanel;
