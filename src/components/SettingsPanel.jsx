import { useState } from 'react';
import {
  ChevronDown, Palette, Type, LayoutGrid, ListOrdered,
  Sun, Moon, AlignLeft, AlignCenter, Minus,
  Square, Layers, CaseSensitive, Calendar, Heading,
  Stamp, Sparkles
} from 'lucide-react';
import LayoutPicker from './LayoutPicker';
import './SettingsPanel.css';

const PALETTES = [
  { id: 'default',   color: '#3b82f6', bg: '#0f172a', name: 'Slate Blue' },
  { id: 'midnight',  color: '#fbbf24', bg: '#1e293b', name: 'Midnight Gold' },
  { id: 'forest',    color: '#10b981', bg: '#064e3b', name: 'Forest Sage' },
  { id: 'cyberpunk', color: '#06b6d4', bg: '#2e1065', name: 'Cyberpunk Neon' },
  { id: 'crimson',   color: '#e11d48', bg: '#1c1917', name: 'Crimson Ash' },
  { id: 'violet',    color: '#8b5cf6', bg: '#1e1b4b', name: 'Deep Violet' },
  { id: 'rose',      color: '#f43f5e', bg: '#4c0519', name: 'Rose Noir' },
];

const HEADING_FONTS = [
  { value: "'Inter', sans-serif",            label: 'Inter (Modern)' },
  { value: "'Playfair Display', serif",      label: 'Playfair Display (Classic)' },
  { value: "'Space Grotesk', sans-serif",    label: 'Space Grotesk (Tech)' },
  { value: "'Montserrat', sans-serif",       label: 'Montserrat (Bold)' },
  { value: "'Raleway', sans-serif",          label: 'Raleway (Elegant)' },
  { value: "'Georgia', serif",              label: 'Georgia (Formal)' },
  { value: "'Roboto', sans-serif",           label: 'Roboto (Clean)' },
  { value: "'Poppins', sans-serif",          label: 'Poppins (Friendly)' },
];

const BODY_FONTS = [
  { value: "'Inter', sans-serif",            label: 'Inter (Modern)' },
  { value: "'Lato', sans-serif",             label: 'Lato (Clean)' },
  { value: "'Roboto', sans-serif",           label: 'Roboto (Clean)' },
  { value: "'Merriweather', serif",          label: 'Merriweather (Formal)' },
  { value: "'Source Serif 4', serif",        label: 'Source Serif (Academic)' },
  { value: "'Nunito', sans-serif",           label: 'Nunito (Rounded)' },
];

// Reusable segmented control
const Segmented = ({ value, onChange, options }) => (
  <div className="seg-control" role="group">
    {options.map(opt => (
      <button key={opt.value} type="button"
        className={`seg-btn ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)} title={opt.hint || opt.label}>
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

const SettingField = ({ label, children, hint }) => (
  <div className="setting-field">
    <label className="setting-label">{label}</label>
    {children}
    {hint && <span className="setting-hint">{hint}</span>}
  </div>
);

const SettingRow = ({ label, children }) => (
  <div className="setting-field setting-field-row">
    <label className="setting-label">{label}</label>
    {children}
  </div>
);

const Switch = ({ id, checked, onChange }) => (
  <label className="switch">
    <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span className="switch-slider" />
  </label>
);

const SECTION_LABELS = {
  summary: 'Summary / Profile',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
  awards: 'Awards & Honors',
};

const SettingsPanel = ({ settings, setSettings, activeTab, sectionOrder, onMoveSection, onTogglePageBreak }) => {
  const set = (patch) => setSettings({ ...settings, ...patch });
  const isResume = activeTab === 'resume';

  return (
    <div className="settings-panel-v2 glass-panel">
      <h2 className="settings-panel-heading">Document Settings &amp; Layout</h2>

      {/* ── Layout ──────────────────────────────────── */}
      {isResume && (
        <Group icon={<LayoutGrid size={15} />} title="Layout">
          <LayoutPicker
            value={settings.layout}
            accent={settings.themeColor}
            onChange={(layout) => set({ layout })}
          />
        </Group>
      )}

      {/* ── Theme & Color ───────────────────────────── */}
      <Group icon={<Palette size={15} />} title="Theme & Color">
        <SettingField label="Color Palette">
          <div className="palette-row">
            {PALETTES.map(pal => (
              <button key={pal.id}
                className={`palette-swatch ${settings.palette === pal.id ? 'selected' : ''}`}
                onClick={() => set({ palette: pal.id, themeColor: pal.color })}
                title={pal.name}
                style={{ background: `linear-gradient(135deg, ${pal.bg} 50%, ${pal.color} 50%)`, '--swatch-ring': pal.color }}
              />
            ))}
            <label className={`palette-swatch palette-custom ${settings.palette === 'custom' ? 'selected' : ''}`}
              title="Custom color" style={{ '--swatch-ring': settings.themeColor }}>
              <span style={{ background: settings.themeColor }} />
              <input type="color" value={settings.themeColor}
                onChange={e => set({ palette: 'custom', themeColor: e.target.value })} />
            </label>
          </div>
          <span className="setting-hint mono">{settings.themeColor.toUpperCase()}</span>
        </SettingField>

        <SettingField label="Document Mode">
          <Segmented
            value={settings.darkMode ? 'dark' : 'light'}
            onChange={(v) => set({ darkMode: v === 'dark' })}
            options={[
              { value: 'light', label: 'Light', icon: <Sun size={14} /> },
              { value: 'dark',  label: 'Dark',  icon: <Moon size={14} /> }
            ]}
          />
        </SettingField>
      </Group>

      {/* ── Typography ──────────────────────────────── */}
      <Group icon={<Type size={15} />} title="Typography">
        <SettingField label="Heading Font">
          <select className="setting-select" value={settings.headingFont} onChange={e => set({ headingFont: e.target.value })}>
            {HEADING_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </SettingField>
        <SettingField label="Body Font">
          <select className="setting-select" value={settings.bodyFont} onChange={e => set({ bodyFont: e.target.value })}>
            {BODY_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </SettingField>
        <SettingField label="Density">
          <Segmented
            value={settings.density}
            onChange={(density) => set({ density })}
            options={[
              { value: 'compact',  label: 'Compact',  hint: 'Fit more per page' },
              { value: 'normal',   label: 'Standard', hint: 'Balanced' },
              { value: 'spacious', label: 'Spacious', hint: 'Airy & elegant' }
            ]}
          />
        </SettingField>
        <SettingField label={<>Font Size <span className="font-size-value">{Math.round((Number(settings.fontScale) || 1) * 100)}%</span></>}>
          <input type="range" className="font-size-range" min="0.85" max="1.2" step="0.05"
            value={Number(settings.fontScale) || 1}
            onChange={e => set({ fontScale: parseFloat(e.target.value) })} />
        </SettingField>
      </Group>

      {/* ── Resume-only groups ──────────────────────── */}
      {isResume && (
        <>
          {/* ── Group A: Header Decoration ──────────── */}
          <Group icon={<Layers size={15} />} title="Header Decoration" defaultOpen={false}>
            <SettingField label="Header Background" hint="Color band behind your name & title">
              <Segmented
                value={settings.headerBg || 'none'}
                onChange={(headerBg) => set({ headerBg })}
                options={[
                  { value: 'none',       label: 'None' },
                  { value: 'solid',      label: 'Solid' },
                  { value: 'gradient',   label: 'Gradient' },
                  { value: 'full-bleed', label: 'Full Bleed' },
                ]}
              />
            </SettingField>
            <SettingField label="Header Text Color">
              <Segmented
                value={settings.headerTextColor || 'auto'}
                onChange={(headerTextColor) => set({ headerTextColor })}
                options={[
                  { value: 'auto',  label: 'Auto' },
                  { value: 'white', label: 'White' },
                  { value: 'dark',  label: 'Dark' },
                ]}
              />
            </SettingField>
            <SettingField label="Accent Line Weight">
              <Segmented
                value={settings.accentLineWeight || 'medium'}
                onChange={(accentLineWeight) => set({ accentLineWeight })}
                options={[
                  { value: 'none',   label: 'None' },
                  { value: 'thin',   label: 'Thin' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'thick',  label: 'Thick' },
                ]}
              />
            </SettingField>
            <SettingField label="Accent Line Position">
              <Segmented
                value={settings.accentLinePos || 'below'}
                onChange={(accentLinePos) => set({ accentLinePos })}
                options={[
                  { value: 'below', label: 'Below' },
                  { value: 'left',  label: 'Left Bar' },
                  { value: 'both',  label: 'Both' },
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Skills Display ───────────────────────── */}
          <Group icon={<Sparkles size={15} />} title="Skills Display" defaultOpen={false}>
            <SettingField label="Skill Style" hint="How skills appear on the CV">
              <Segmented
                value={settings.skillStyle || 'classic'}
                onChange={(skillStyle) => set({ skillStyle })}
                options={[
                  { value: 'classic', label: 'Classic' },
                  { value: 'tags',    label: 'Tags' },
                  { value: 'bars',    label: 'Bars' }
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Group B: Cards & Borders ─────────────── */}
          <Group icon={<Square size={15} />} title="Cards & Borders" defaultOpen={false}>
            <SettingField label="Item Card Style" hint="Applied to experience, education & project items">
              <Segmented
                value={settings.itemCardStyle || 'flat'}
                onChange={(itemCardStyle) => set({ itemCardStyle })}
                options={[
                  { value: 'flat',   label: 'Flat' },
                  { value: 'border', label: 'Border' },
                  { value: 'shadow', label: 'Shadow' },
                  { value: 'pill',   label: 'Pill' },
                ]}
              />
            </SettingField>
            <SettingField label="Corner Radius">
              <Segmented
                value={settings.cornerRadius || 'soft'}
                onChange={(cornerRadius) => set({ cornerRadius })}
                options={[
                  { value: 'sharp',   label: 'Sharp' },
                  { value: 'soft',    label: 'Soft' },
                  { value: 'rounded', label: 'Rounded' },
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Group C: Typography Fine-tuning ─────── */}
          <Group icon={<CaseSensitive size={15} />} title="Typography Details" defaultOpen={false}>
            <SettingField label="Name Style">
              <Segmented
                value={settings.nameCase || 'normal'}
                onChange={(nameCase) => set({ nameCase })}
                options={[
                  { value: 'normal',     label: 'Normal' },
                  { value: 'uppercase',  label: 'UPPER' },
                  { value: 'capitalize', label: 'Title' },
                  { value: 'small-caps', label: 'Sm Caps' },
                ]}
              />
            </SettingField>
            <SettingField label="Letter Spacing">
              <Segmented
                value={settings.letterSpacing || 'normal'}
                onChange={(letterSpacing) => set({ letterSpacing })}
                options={[
                  { value: 'tight',  label: 'Tight' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'wide',   label: 'Wide' },
                  { value: 'wider',  label: 'Wider' },
                ]}
              />
            </SettingField>
            <SettingField label="Line Height">
              <Segmented
                value={settings.lineHeight || 'normal'}
                onChange={(lineHeight) => set({ lineHeight })}
                options={[
                  { value: 'compact',  label: 'Compact' },
                  { value: 'normal',   label: 'Normal' },
                  { value: 'relaxed',  label: 'Relaxed' },
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Group D: Date & Contact Format ──────── */}
          <Group icon={<Calendar size={15} />} title="Date & Contact Style" defaultOpen={false}>
            <SettingField label="Date Style">
              <Segmented
                value={settings.dateStyle || 'default'}
                onChange={(dateStyle) => set({ dateStyle })}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'pill',    label: 'Pill' },
                  { value: 'icon',    label: 'Icon' },
                ]}
              />
            </SettingField>
            <SettingField label="Contact Layout">
              <Segmented
                value={settings.contactLayout || 'inline'}
                onChange={(contactLayout) => set({ contactLayout })}
                options={[
                  { value: 'inline',  label: 'Inline' },
                  { value: 'stacked', label: 'Stacked' },
                  { value: 'grid',    label: 'Grid' },
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Group E: Section Title Style ─────────── */}
          <Group icon={<Heading size={15} />} title="Section Titles & Header" defaultOpen={false}>
            <SettingField label="Title Style">
              <Segmented
                value={settings.sectionTitleStyle || 'line-below'}
                onChange={(sectionTitleStyle) => set({ sectionTitleStyle })}
                options={[
                  { value: 'line-below', label: 'Line ↓' },
                  { value: 'line-above', label: 'Line ↑' },
                  { value: 'filled',     label: 'Filled' },
                  { value: 'allcaps',    label: 'ALL CAPS' },
                ]}
              />
            </SettingField>
            <SettingField label="Title Size">
              <Segmented
                value={settings.sectionTitleSize || 'normal'}
                onChange={(sectionTitleSize) => set({ sectionTitleSize })}
                options={[
                  { value: 'small',  label: 'Small' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'large',  label: 'Large' },
                ]}
              />
            </SettingField>
            <SettingField label="Header Alignment">
              <Segmented
                value={settings.headerAlign || 'left'}
                onChange={(headerAlign) => set({ headerAlign })}
                options={[
                  { value: 'left',   label: 'Left',   icon: <AlignLeft size={13} /> },
                  { value: 'center', label: 'Center', icon: <AlignCenter size={13} /> }
                ]}
              />
            </SettingField>
            <SettingField label="Section Dividers">
              <Segmented
                value={settings.dividerStyle || 'solid'}
                onChange={(dividerStyle) => set({ dividerStyle })}
                options={[
                  { value: 'solid',  label: 'Solid',  icon: <Minus size={13} /> },
                  { value: 'dashed', label: 'Dashed' },
                  { value: 'none',   label: 'None' }
                ]}
              />
            </SettingField>
            <SettingField label="Photo Shape">
              <Segmented
                value={settings.photoShape}
                onChange={(photoShape) => set({ photoShape })}
                options={[
                  { value: 'circle',  label: 'Circle' },
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'square',  label: 'Square' }
                ]}
              />
            </SettingField>
            <SettingRow label="Section Icons">
              <Switch id="showIcons" checked={settings.showIcons} onChange={(v) => set({ showIcons: v })} />
            </SettingRow>
          </Group>

          {/* ── Group F: Extras ───────────────────────── */}
          <Group icon={<Stamp size={15} />} title="Extras & Branding" defaultOpen={false}>
            <SettingField label="Draft Watermark" hint="Visible in PDF export">
              <Segmented
                value={settings.watermark || 'none'}
                onChange={(watermark) => set({ watermark })}
                options={[
                  { value: 'none',         label: 'Off' },
                  { value: 'draft',        label: 'DRAFT' },
                  { value: 'confidential', label: 'CONFIDENTIAL' },
                ]}
              />
            </SettingField>
            <SettingField label="Page Footer">
              <Segmented
                value={settings.pageFooter || 'none'}
                onChange={(pageFooter) => set({ pageFooter })}
                options={[
                  { value: 'none',         label: 'None' },
                  { value: 'page-numbers', label: 'Page №' },
                  { value: 'name',         label: 'Your Name' },
                ]}
              />
            </SettingField>
          </Group>

          {/* ── Section Order & Page Breaks ───────────── */}
          <Group icon={<ListOrdered size={15} />} title="Section Order & Page Breaks" defaultOpen={false}>
            <div className="section-order-list">
              {sectionOrder.map((sec, i) => {
                const hasBreak = Array.isArray(settings.pageBreaks) && settings.pageBreaks.includes(sec);
                const label = SECTION_LABELS[sec] || sec;
                return (
                  <div key={sec} className="section-order-item">
                    <span className="section-order-name">{label}</span>
                    <div className="section-order-actions">
                      <button className={`page-break-chip ${hasBreak ? 'active' : ''}`}
                        onClick={() => onTogglePageBreak(sec)}
                        title={hasBreak ? 'Remove page break' : 'Start on new page'}>⤓ Break</button>
                      <button className="order-arrow" disabled={i === 0} onClick={() => onMoveSection(i, 'up')} title="Move up">↑</button>
                      <button className="order-arrow" disabled={i === sectionOrder.length - 1} onClick={() => onMoveSection(i, 'down')} title="Move down">↓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Group>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;
