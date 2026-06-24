import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Briefcase, GraduationCap, FolderDot, Wrench, Award, Languages, BadgeCheck, LayoutList } from 'lucide-react';
import DOMPurify from 'dompurify';
import { usePaginatedLayout } from '../hooks/usePaginatedLayout';
import { legacyToHtml } from '../utils/richText';
import './CVPreview.css';

// Hoisted out of render so it isn't recreated each render.
const SectionHeader = ({ title, icon: Icon, showIcons }) => (
  <h3 className="cv-section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {showIcons && Icon && <Icon size={14} className="section-icon" color="var(--theme-color)" style={{ flexShrink: 0 }} />}
    {title}
  </h3>
);

const PROFICIENCY_COLORS = {
  Native: '#10b981',
  Fluent: '#3b82f6',
  Intermediate: '#f59e0b',
  Basic: '#94a3b8',
};

const CVPreview = ({ cvData = {}, settings = {} }) => {
  const {
    personal = {}, summary = '', education = [], experience = [],
    projects = [], skills = {},
    certifications = [], languages = [], awards = [], customSections = []
  } = cvData;

  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  const masterRef = useRef(null);
  const rulerRef = useRef(null);
  const [pageHeightPx, setPageHeightPx] = useState(1122);

  const PAGE_GAP = 28;
  const pageMargin = pageHeightPx > 0 ? Math.round(pageHeightPx * (20 / 297)) : 75;
  const isTwoColumn = settings?.layout === 'two-column' || settings?.layout === 'creative';

  useEffect(() => {
    if (rulerRef.current) setPageHeightPx(rulerRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(prev => Math.min(Math.max(0.3, prev - e.deltaY * 0.002), 2.5));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const fit = () => {
      const wrapper = containerRef.current;
      const master = masterRef.current;
      if (!wrapper || !master) return;
      const available = wrapper.clientWidth - 40;
      const naturalWidth = master.offsetWidth || 1;
      setZoom(Math.min(Math.max(0.3, available / naturalWidth), 2.5));
    };
    window.addEventListener('cv-auto-fit', fit);
    return () => window.removeEventListener('cv-auto-fit', fit);
  }, []);

  useEffect(() => {
    const fitOnePage = () => {
      const master = masterRef.current;
      if (!master || pageHeightPx <= 0) return;
      const candidates = [
        { density: 'spacious', mult: 1.5 },
        { density: 'normal', mult: 1 },
        { density: 'compact', mult: 0.6 }
      ];
      const original = master.style.getPropertyValue('--spacing-multiplier');
      let chosen = 'compact';
      for (const c of candidates) {
        master.style.setProperty('--spacing-multiplier', String(c.mult));
        if (master.offsetHeight <= pageHeightPx) { chosen = c.density; break; }
      }
      master.style.setProperty('--spacing-multiplier', original);
      window.dispatchEvent(new CustomEvent('cv-set-density', { detail: chosen }));
    };
    window.addEventListener('cv-fit-one-page', fitOnePage);
    return () => window.removeEventListener('cv-fit-one-page', fitOnePage);
  }, [pageHeightPx]);

  const renderRichText = (text) => {
    if (!text) return null;
    const cleanHtml = DOMPurify.sanitize(legacyToHtml(text), { ADD_ATTR: ['target', 'style', 'align'] });
    return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  const layoutStyleName = settings?.layout || 'single';
  const layoutClass = `layout-${layoutStyleName} ${settings?.darkMode ? 'cv-dark-mode' : ''}`;
  const order = settings?.sectionOrder || ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'languages', 'awards'];

  const fontScale     = Number(settings?.fontScale) || 1;
  const headerAlign   = settings?.headerAlign || 'left';
  const dividerStyle  = settings?.dividerStyle || 'solid';

  // Map enum values → CSS values
  const cornerRadiusMap = { sharp: '0px', soft: '4px', rounded: '10px' };
  const accentLineMap   = { none: '0px', thin: '1px', medium: '3px', thick: '6px' };
  const letterSpaceMap  = { tight: '-0.02em', normal: '0em', wide: '0.04em', wider: '0.1em' };
  const lineHeightMap   = { compact: '1.3', normal: '1.5', relaxed: '1.7' };
  const titleSizeMap    = { small: '0.75em', normal: '0.88em', large: '1.05em' };

  const previewStyle = {
    '--theme-color':         settings?.themeColor || '#0f172a',
    '--heading-font':        settings?.headingFont || "'Inter', sans-serif",
    '--body-font':           settings?.bodyFont || "'Inter', sans-serif",
    '--spacing-multiplier':  settings?.density === 'compact' ? 0.6 : settings?.density === 'spacious' ? 1.5 : 1,
    '--font-scale':          fontScale,
    '--photo-radius':        settings?.photoShape === 'square' ? '4px' : settings?.photoShape === 'rounded' ? '24px' : '50%',
    '--divider-style':       dividerStyle === 'dashed' ? 'dashed' : dividerStyle === 'none' ? 'none' : 'solid',
    // New Group B
    '--corner-radius':       cornerRadiusMap[settings?.cornerRadius] || '4px',
    // New Group A
    '--accent-line-weight':  accentLineMap[settings?.accentLineWeight] || '3px',
    // New Group C
    '--letter-spacing':      letterSpaceMap[settings?.letterSpacing] || '0em',
    '--line-height-body':    lineHeightMap[settings?.lineHeight] || '1.5',
    '--name-text-transform': settings?.nameCase === 'uppercase' ? 'uppercase'
                           : settings?.nameCase === 'capitalize' ? 'capitalize' : 'none',
    '--name-font-variant':   settings?.nameCase === 'small-caps' ? 'small-caps' : 'normal',
    // New Group E
    '--section-title-size':  titleSizeMap[settings?.sectionTitleSize] || '0.88em',
    fontFamily: settings?.bodyFont || settings?.fontFamily || "'Inter', sans-serif"
  };

  // Derive compound class string for container
  const containerClasses = [
    'cv-preview-container is-paginated',
    layoutClass,
    settings?.headerBg && settings.headerBg !== 'none' ? `header-bg-${settings.headerBg}` : '',
    settings?.itemCardStyle && settings.itemCardStyle !== 'flat' ? `item-card-${settings.itemCardStyle}` : '',
    settings?.sectionTitleStyle ? `section-title-${settings.sectionTitleStyle}` : 'section-title-line-below',
    settings?.accentLinePos === 'left' ? 'accent-left' : settings?.accentLinePos === 'both' ? 'accent-both' : '',
    settings?.contactLayout ? `contact-${settings.contactLayout}` : 'contact-inline',
    settings?.dateStyle && settings.dateStyle !== 'default' ? `date-style-${settings.dateStyle}` : '',
    settings?.headerTextColor && settings.headerTextColor !== 'auto' ? `header-text-${settings.headerTextColor}` : '',
  ].filter(Boolean).join(' ');

  const getHeadingFontName = () => settings?.headingFont ? settings.headingFont.split("'")[1] : 'Inter';
  const getBodyFontName    = () => settings?.bodyFont     ? settings.bodyFont.split("'")[1]    : 'Inter';
  const fontLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(getHeadingFontName())}:wght@400;500;600;700&family=${encodeURIComponent(getBodyFontName())}:wght@400;500;600;700&display=swap`;


  const renderSkillBlock = (label, skillString, level, isSidebar = false) => {
    if (!skillString) return null;
    if (settings?.skillStyle === 'bars') {
      const pct = Math.round(((level ?? 3) / 5) * 100);
      return (
        <div className={`cv-skill-group bars-mode ${isSidebar ? 'sidebar-style' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <strong>{label}</strong>
            <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{skillString}</span>
          </div>
          <div className="skill-bar-track">
            <div className="skill-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    if (settings?.skillStyle === 'tags') {
      return (
        <div className={`cv-skill-group tags-mode ${isSidebar ? 'sidebar-style' : ''}`}>
          <strong style={{ display: 'block', marginBottom: 'calc(4px * var(--spacing-multiplier))' }}>{label}</strong>
          <div className="skill-tags-container">
            {skillString.split(',').map(s => s.trim()).filter(s => s).map((s, i) => (
              <span key={i} className="skill-tag">{s}</span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={isSidebar ? 'cv-skill-group' : 'cv-skill-row'}>
        <strong>{label}{!isSidebar && ':'}</strong> {isSidebar ? <div>{skillString}</div> : skillString}
      </div>
    );
  };

  const pageBreaks = Array.isArray(settings?.pageBreaks) ? settings.pageBreaks : [];

  // Build section data map — extended with new sections
  const sectionData = {
    summary: {
      icon: Briefcase, title: 'Profile',
      items: summary ? [<div className="cv-summary-text" key="s">{renderRichText(summary)}</div>] : []
    },
    education: {
      icon: GraduationCap, title: 'Education',
      items: (education || []).filter(e => !e.hidden).map(edu => (
        <div key={edu.id} className="cv-item">
          <div className="cv-item-header">
            <span className="cv-item-title">{edu.institution}</span>
            <span className="cv-item-date">{edu.dates}</span>
          </div>
          <div className="cv-item-subheader">
            <span>{edu.degree}</span>
            {edu.gpa && <span>{edu.gpa}</span>}
          </div>
        </div>
      ))
    },
    experience: {
      icon: Briefcase, title: 'Experience',
      items: (experience || []).filter(e => !e.hidden).map(exp => (
        <div key={exp.id} className="cv-item">
          <div className="cv-item-header">
            <span className="cv-item-title">
              {exp.company}
              {exp.type && <span className="cv-type-badge">{exp.type}</span>}
            </span>
            <span className="cv-item-date">{exp.dates}</span>
          </div>
          <div className="cv-item-subheader">
            <span>{exp.role}{exp.location && <span className="cv-item-location"> · {exp.location}</span>}</span>
          </div>
          <div className="cv-item-description">{renderRichText(exp.description)}</div>
        </div>
      ))
    },
    projects: {
      icon: FolderDot, title: 'Projects',
      items: (projects || []).filter(p => !p.hidden).map(proj => (
        <div key={proj.id} className="cv-item">
          <div className="cv-item-header">
            <span className="cv-item-title">
              {proj.name}
              {proj.url && (
                <a href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`}
                  className="cv-project-link" target="_blank" rel="noopener noreferrer">↗</a>
              )}
            </span>
          </div>
          {proj.tech && (
            <div className="cv-item-subheader">
              <span className="cv-tech-stack">{proj.tech}</span>
            </div>
          )}
          <div className="cv-item-description">{renderRichText(proj.description)}</div>
        </div>
      ))
    },
    skills: {
      icon: Wrench, title: 'Skills',
      items: (Array.isArray(skills) && skills.filter(s => !s.hidden && s.items).length > 0) ? [
        <div className="cv-skills" key="sk">
          {skills.filter(s => !s.hidden && s.items).map((skill, idx) => (
            <React.Fragment key={skill.id || idx}>
              {renderSkillBlock(skill.category, skill.items, skill.level)}
            </React.Fragment>
          ))}
        </div>
      ] : []
    },
    certifications: {
      icon: BadgeCheck, title: 'Certifications',
      items: (certifications || []).filter(c => !c.hidden).map(cert => (
        <div key={cert.id} className="cv-item cv-cert-item">
          <div className="cv-item-header">
            <span className="cv-item-title">{cert.name}</span>
            <span className="cv-item-date">{cert.date}</span>
          </div>
          {cert.issuer && <div className="cv-item-subheader"><span>{cert.issuer}</span></div>}
        </div>
      ))
    },
    languages: {
      icon: Languages, title: 'Languages',
      items: (languages || []).filter(l => !l.hidden).length > 0 ? [
        <div className="cv-languages-grid" key="langs">
          {languages.filter(l => !l.hidden).map(lang => (
            <div key={lang.id} className="cv-language-item">
              <span className="cv-language-name">{lang.language}</span>
              <span className="cv-language-badge"
                style={{ background: (PROFICIENCY_COLORS[lang.proficiency] || '#94a3b8') + '22', color: PROFICIENCY_COLORS[lang.proficiency] || '#94a3b8' }}>
                {lang.proficiency}
              </span>
            </div>
          ))}
        </div>
      ] : []
    },
    awards: {
      icon: Award, title: 'Awards & Honors',
      items: (awards || []).filter(a => !a.hidden).map(award => (
        <div key={award.id} className="cv-item cv-award-item">
          <div className="cv-item-header">
            <span className="cv-item-title">{award.title}</span>
            <span className="cv-item-date">{award.year}</span>
          </div>
          {award.issuer && <div className="cv-item-subheader"><span>{award.issuer}</span></div>}
        </div>
      ))
    },
  };

  // Add custom sections dynamically
  (customSections || []).forEach(sec => {
    sectionData[sec.id] = {
      icon: LayoutList, title: sec.name || 'Custom Section',
      items: sec.content ? [<div key="cs" className="cv-summary-text">{renderRichText(sec.content)}</div>] : []
    };
  });

  const renderBodyBlocks = (sections) => {
    const blocks = [];
    sections.forEach(sec => {
      const data = sectionData[sec];
      if (!data || data.items.length === 0) return;
      const forceBreak = pageBreaks.includes(sec);
      blocks.push(
        <div key={`${sec}-h`} className="cv-block cv-section-head" data-block data-keep-with-next
          {...(forceBreak ? { 'data-block-break': '' } : {})}>
          <SectionHeader title={data.title} icon={data.icon} showIcons={settings?.showIcons} />
        </div>
      );
      data.items.forEach((item, i) => {
        blocks.push(
          <div key={`${sec}-i-${i}`} className="cv-block cv-section-item" data-block>{item}</div>
        );
      });
    });
    return blocks;
  };

  // Full section list including custom section ids
  const fullSectionOrder = [
    ...order,
    ...(customSections || []).map(s => s.id).filter(id => !order.includes(id))
  ];

  const bodyBlocks = renderBodyBlocks(isTwoColumn ? fullSectionOrder.filter(sec => sec !== 'skills') : fullSectionOrder);

  const { numPages } = usePaginatedLayout({
    contentRef: masterRef,
    enabled: true,
    pageHeightPx,
    pageMargin,
    pageGap: PAGE_GAP,
    deps: [cvData, settings, zoom, isTwoColumn]
  });

  const handleNativeExport = async () => {
    try { await window.cvmate.exportPdf(); }
    catch (e) { console.error('Native export failed:', e); window.print(); }
  };

  const isElectron = typeof window !== 'undefined' && window.cvmate?.isElectron === true;

  // Header block — supports centered alignment
  const headerAlignClass = headerAlign === 'center' ? 'header-centered' : '';
  const headerBlock = (
    <div className="cv-block" data-block key="header">
      <div className={`cv-header single-col-header ${headerAlignClass}`}>
        <div className="cv-header-content">
          <h1 className="cv-name">{personal.name || 'Your Name'}</h1>
          <h2 className="cv-title">{personal.title || 'Professional Title'}</h2>
          <div className={`cv-contact-info ${headerAlignClass}`}>
            {personal.email && <span><a href={`mailto:${personal.email}`} className="cv-contact-link">{personal.email}</a></span>}
            {personal.phone && <span><span className="bullet" aria-hidden="true">&bull;</span> {personal.phone}</span>}
            {personal.linkedin && <span><span className="bullet" aria-hidden="true">&bull;</span> <a href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} className="cv-contact-link" target="_blank" rel="noopener noreferrer">{personal.linkedin}</a></span>}
            {personal.github && <span><span className="bullet" aria-hidden="true">&bull;</span> <a href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`} className="cv-contact-link" target="_blank" rel="noopener noreferrer">{personal.github}</a></span>}
            {personal.portfolio && <span><span className="bullet" aria-hidden="true">&bull;</span> <a href={personal.portfolio.startsWith('http') ? personal.portfolio : `https://${personal.portfolio}`} className="cv-contact-link" target="_blank" rel="noopener noreferrer">{personal.portfolio}</a></span>}
          </div>
        </div>
        {personal.photo && !headerAlignClass && (
          <div className="cv-photo"><img src={personal.photo} alt="Profile" /></div>
        )}
        {personal.photo && headerAlignClass && (
          <div className="cv-photo cv-photo-centered"><img src={personal.photo} alt="Profile" /></div>
        )}
      </div>
    </div>
  );

  return (
    <div className="cv-preview-wrapper" ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>

      <link href={fontLink} rel="stylesheet" />

      {/* Floating Zoom Controls */}
      <div className="zoom-controls no-print"
        style={{ position: 'sticky', top: '0px', zIndex: 50, display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '45px', textAlign: 'center', fontWeight: 600 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} title="Zoom In" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <ZoomIn size={16} />
        </button>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
        <button onClick={() => setZoom(1)} title="Reset Zoom" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <Maximize size={16} />
        </button>
      </div>

      {isElectron && (
        <button className="no-print" onClick={handleNativeExport}
          style={{ position: 'absolute', top: '20px', right: '20px', background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', zIndex: 100 }}>
          📥 Native PDF Export
        </button>
      )}

      {/* Scalable paper container */}
      <div className="scalable-paper" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }}>
        <div ref={rulerRef} style={{ height: '297mm', position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} />

        <div className="page-stack" style={{ ...previewStyle, position: 'relative', width: '210mm', height: `${numPages * pageHeightPx + (numPages - 1) * PAGE_GAP}px` }}>

          {/* Watermark */}
          {settings?.watermark && settings.watermark !== 'none' && (
            <div className={`cv-watermark cv-watermark-${settings.watermark}`} aria-hidden="true">
              {settings.watermark === 'draft' ? 'DRAFT' : 'CONFIDENTIAL'}
            </div>
          )}

          <div className="page-sheets" aria-hidden="true">
            {Array.from({ length: numPages }).map((_, i) => (
              <div key={i} className={`page-sheet ${settings?.darkMode ? 'is-dark' : ''}`} style={{ top: `${i * (pageHeightPx + PAGE_GAP)}px`, height: `${pageHeightPx}px` }}>
                {isTwoColumn && <span className={`page-sheet-sidebar ${settings?.darkMode ? 'is-dark' : ''} ${settings?.layout === 'creative' ? 'is-creative' : ''}`} />}
                <span className="page-sheet-label no-print">Page {i + 1} / {numPages}</span>
                {/* Page footer */}
                {settings?.pageFooter && settings.pageFooter !== 'none' && (
                  <div className="cv-page-footer">
                    {settings.pageFooter === 'page-numbers'
                      ? `${i + 1} / ${numPages}`
                      : (personal?.name || '')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {isTwoColumn ? (
            <div className={`${containerClasses} is-two-col`}
              style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}>
              <aside className="cv-sidebar cv-sidebar-content" style={{ height: `${pageHeightPx}px`, paddingTop: `${pageMargin}px` }}>
                {personal.photo && <div className="cv-photo"><img src={personal.photo} alt="Profile" /></div>}
                <div className="cv-section sidebar-section">
                  <h3 className="cv-section-title">Contact</h3>
                  <div className="cv-contact-list">
                    {personal.email && <div>{personal.email}</div>}
                    {personal.phone && <div>{personal.phone}</div>}
                    {personal.linkedin && <div>{personal.linkedin}</div>}
                    {personal.github && <div>{personal.github}</div>}
                    {personal.portfolio && <div>{personal.portfolio}</div>}
                  </div>
                </div>
                {(Array.isArray(skills) && skills.filter(s => !s.hidden && s.items).length > 0) && (
                  <div className="cv-section sidebar-section">
                    <h3 className="cv-section-title">Skills</h3>
                    <div className={settings?.skillStyle === 'tags' ? 'cv-skills-stacked' : 'cv-contact-list'}>
                      {skills.filter(s => !s.hidden && s.items).map((skill, idx) => (
                        <React.Fragment key={skill.id || idx}>
                          {renderSkillBlock(skill.category, skill.items, skill.level, true)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
              <div ref={masterRef} className="cv-main-paginated" style={{ paddingTop: `${pageMargin}px` }}>
                {headerBlock}
                {bodyBlocks}
              </div>
            </div>
          ) : (
            <div ref={masterRef} className={containerClasses}
              style={{ position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none', paddingTop: `${pageMargin}px` }}>
              {headerBlock}
              {bodyBlocks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
