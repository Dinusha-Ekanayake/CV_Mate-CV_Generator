import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Briefcase, GraduationCap, FolderDot, Wrench } from 'lucide-react';
import DOMPurify from 'dompurify';
import { usePaginatedLayout } from '../hooks/usePaginatedLayout';
import { legacyToHtml } from '../utils/richText';
import './CVPreview.css';

// Hoisted out of render so it isn't recreated each render (avoids state-reset
// and the react-hooks/static-components lint error).
const SectionHeader = ({ title, icon: Icon, showIcons }) => (
  <h3 className="cv-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {showIcons && Icon && <Icon size={20} className="section-icon" color="var(--theme-color)" />}
    {title}
  </h3>
);

const CVPreview = ({ cvData = {}, settings = {} }) => {
  const { personal = {}, summary = '', education = [], experience = [], projects = [], skills = {} } = cvData;
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  
  // Pagination State
  const masterRef = useRef(null);
  const rulerRef = useRef(null);
  const [pageHeightPx, setPageHeightPx] = useState(1122); // Fallback for 297mm

  // Visual gap shown between stacked page sheets on screen.
  const PAGE_GAP = 28;
  // Top/bottom margin inside each page (≈ the 20mm print margin at screen DPI).
  const pageMargin = pageHeightPx > 0 ? Math.round(pageHeightPx * (20 / 297)) : 75;
  const isTwoColumn = settings?.layout === 'two-column' || settings?.layout === 'creative';

  useEffect(() => {
    if (rulerRef.current) {
      setPageHeightPx(rulerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(prev => {
          let newZoom = prev - e.deltaY * 0.002;
          return Math.min(Math.max(0.3, newZoom), 2.5);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-Fit: scale the page so its full width fits the visible preview area.
  // Triggered by the toolbar button in App via a window event.
  useEffect(() => {
    const fit = () => {
      const wrapper = containerRef.current;
      const master = masterRef.current;
      if (!wrapper || !master) return;
      const available = wrapper.clientWidth - 40; // account for padding
      const naturalWidth = master.offsetWidth || 1;
      const next = Math.min(Math.max(0.3, available / naturalWidth), 2.5);
      setZoom(next);
    };
    window.addEventListener('cv-auto-fit', fit);
    return () => window.removeEventListener('cv-auto-fit', fit);
  }, []);

  // Fit-to-one-page: try densities from most spacious to most compact and pick the
  // first that fits a single A4 page. Measures by temporarily overriding the
  // spacing CSS variable on the live master node, then reports the winner back to App.
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
        // Allow layout to settle synchronously via offsetHeight read.
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
    // Normalize legacy markdown to HTML, then sanitize before injecting.
    const cleanHtml = DOMPurify.sanitize(legacyToHtml(text), { ADD_ATTR: ['target'] });
    return (
      <div
        className="rich-text-content"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  const layoutStyleName = settings?.layout || 'single';
  const layoutClass = `layout-${layoutStyleName} ${settings?.darkMode ? 'cv-dark-mode' : ''}`;
  const order = settings?.sectionOrder || ['summary', 'education', 'experience', 'projects', 'skills'];

  const fontScale = Number(settings?.fontScale) || 1;
  const previewStyle = {
    '--theme-color': settings?.themeColor || '#0f172a',
    '--heading-font': settings?.headingFont || "'Inter', sans-serif",
    '--body-font': settings?.bodyFont || "'Inter', sans-serif",
    '--spacing-multiplier': settings?.density === 'compact' ? 0.6 : settings?.density === 'spacious' ? 1.5 : 1,
    '--font-scale': fontScale,
    '--photo-radius': settings?.photoShape === 'square' ? '4px' : settings?.photoShape === 'rounded' ? '24px' : '50%',
    fontFamily: settings?.bodyFont || settings?.fontFamily || "'Inter', sans-serif"
  };

  const getHeadingFontName = () => settings?.headingFont ? settings.headingFont.split("'")[1] : 'Inter';
  const getBodyFontName = () => settings?.bodyFont ? settings.bodyFont.split("'")[1] : 'Inter';
  const fontLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(getHeadingFontName())}:wght@400;500;600;700&family=${encodeURIComponent(getBodyFontName())}:wght@400;500;600;700&display=swap`;

  const renderSkillBlock = (label, skillString, isSidebar = false) => {
    if (!skillString) return null;
    if (settings?.skillStyle === 'tags') {
      return (
        <div className={`cv-skill-group tags-mode ${isSidebar ? 'sidebar-style' : ''}`}>
          <strong style={{display: 'block', marginBottom: 'calc(4px * var(--spacing-multiplier))'}}>{label}</strong>
          <div className="skill-tags-container">
            {skillString.split(',').map(s => s.trim()).filter(s => s).map((s, i) => (
              <span key={i} className="skill-tag">{s}</span>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={isSidebar ? "cv-skill-group" : "cv-skill-row"}>
        <strong>{label}{!isSidebar && ':'}</strong> {isSidebar ? <div>{skillString}</div> : skillString}
      </div>
    );
  };

  const pageBreaks = Array.isArray(settings?.pageBreaks) ? settings.pageBreaks : [];

  // Each section is emitted as a flat list of pagination blocks: a section-title
  // block (kept with the following item to avoid orphan headings) followed by one
  // block per item. The paginator measures these to place real page breaks.
  const sectionData = {
    summary: {
      icon: Briefcase, title: 'Profile',
      items: summary ? [
        <div className="cv-summary-text" key="s">{renderRichText(summary)}</div>
      ] : []
    },
    education: {
      icon: GraduationCap, title: 'Education',
      items: (education || []).filter(e => !e.hidden).map((edu) => (
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
      items: (experience || []).filter(e => !e.hidden).map((exp) => (
        <div key={exp.id} className="cv-item">
          <div className="cv-item-header">
            <span className="cv-item-title">
              {exp.company}
              {exp.type && <span className="cv-type-badge">{exp.type}</span>}
            </span>
            <span className="cv-item-date">{exp.dates}</span>
          </div>
          <div className="cv-item-subheader">
            <span>{exp.role}</span>
          </div>
          <div className="cv-item-description">
            {renderRichText(exp.description)}
          </div>
        </div>
      ))
    },
    projects: {
      icon: FolderDot, title: 'Projects',
      items: (projects || []).filter(p => !p.hidden).map((proj) => (
        <div key={proj.id} className="cv-item">
          <div className="cv-item-header">
            <span className="cv-item-title">{proj.name}</span>
          </div>
          {proj.tech && (
            <div className="cv-item-subheader">
              <span className="cv-tech-stack">Stack: {proj.tech}</span>
            </div>
          )}
          <div className="cv-item-description">
            {renderRichText(proj.description)}
          </div>
        </div>
      ))
    },
    skills: {
      icon: Wrench, title: 'Skills',
      items: (Array.isArray(skills) && skills.filter(s => !s.hidden && s.items).length > 0) ? [
        <div className="cv-skills" key="sk">
          {skills.filter(s => !s.hidden && s.items).map((skill, idx) => (
            <React.Fragment key={skill.id || idx}>
              {renderSkillBlock(skill.category, skill.items)}
            </React.Fragment>
          ))}
        </div>
      ] : []
    }
  };

  // Produce the flat array of [data-block] elements for the body, in section order.
  const renderBodyBlocks = (sections) => {
    const blocks = [];
    sections.forEach((sec) => {
      const data = sectionData[sec];
      if (!data || data.items.length === 0) return;
      const forceBreak = pageBreaks.includes(sec);
      // Section heading — kept with the next block so it never sits alone at a
      // page bottom; carries the forced page break when requested.
      blocks.push(
        <div
          key={`${sec}-h`}
          className="cv-block cv-section-head"
          data-block
          data-keep-with-next
          {...(forceBreak ? { 'data-block-break': '' } : {})}
        >
          <SectionHeader title={data.title} icon={data.icon} showIcons={settings?.showIcons} />
        </div>
      );
      data.items.forEach((item, i) => {
        blocks.push(
          <div key={`${sec}-i-${i}`} className="cv-block cv-section-item" data-block>
            {item}
          </div>
        );
      });
    });
    return blocks;
  };

  // In two-column layouts, skills live in the sidebar, so exclude them from the
  // paginated main column.
  const bodyBlocks = renderBodyBlocks(isTwoColumn ? order.filter(sec => sec !== 'skills') : order);

  // Production paginator: measures the content blocks and distributes them across
  // real A4 page sheets with proper margins. For two-column it measures the main
  // column; the sidebar band spans all pages behind it.
  const { numPages } = usePaginatedLayout({
    contentRef: masterRef,
    enabled: true,
    pageHeightPx,
    pageMargin,
    pageGap: PAGE_GAP,
    deps: [cvData, settings, zoom, isTwoColumn]
  });

  const handleNativeExport = async () => {
    try {
      await window.cvmate.exportPdf();
    } catch (e) {
      console.error("Native export failed:", e);
      window.print(); // Fallback to browser print
    }
  };

  const isElectron = typeof window !== 'undefined' && window.cvmate?.isElectron === true;

  // Single-column layouts render a flat list of [data-block] siblings that the
  // paginator measures and distributes across real page sheets.
  const headerBlock = (
    <div className="cv-block" data-block key="header">
      <div className="cv-header single-col-header">
        <div className="cv-header-content">
          <h1 className="cv-name">{personal.name || 'Your Name'}</h1>
          <h2 className="cv-title">{personal.title || 'Professional Title'}</h2>
          <div className="cv-contact-info">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span><span className="bullet">&bull;</span> {personal.phone}</span>}
            {personal.linkedin && <span><span className="bullet">&bull;</span> {personal.linkedin}</span>}
            {personal.github && <span><span className="bullet">&bull;</span> {personal.github}</span>}
            {personal.portfolio && <span><span className="bullet">&bull;</span> {personal.portfolio}</span>}
          </div>
        </div>
        {personal.photo && (
          <div className="cv-photo">
            <img src={personal.photo} alt="Profile" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className="cv-preview-wrapper" 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0'
      }}
    >
      {/* Dynamic Google Fonts Injection */}
      <link href={fontLink} rel="stylesheet" />

      {/* Floating Zoom Controls */}
      <div 
        className="zoom-controls no-print"
        style={{
          position: 'sticky',
          top: '0px',
          zIndex: 50,
          display: 'flex',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '20px',
          alignItems: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} title="Zoom Out" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', width: '45px', textAlign: 'center', fontWeight: 600 }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} title="Zoom In" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <ZoomIn size={16} />
        </button>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}></div>
        <button onClick={() => setZoom(1)} title="Reset Zoom" style={{ background: 'transparent', border: 'none', color: '#f8fafc', cursor: 'pointer', display: 'flex', padding: '4px' }}>
          <Maximize size={16} />
        </button>
      </div>

      {isElectron && (
        <button 
          className="no-print"
          onClick={handleNativeExport}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 100
          }}
        >
          📥 Native PDF Export
        </button>
      )}

      {/* The actual scalable paper container */}
      <div
        className="scalable-paper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* Hidden Ruler for exact 297mm pixel calculation on user's monitor */}
        <div ref={rulerRef} style={{ height: '297mm', position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} />

        {/* Real stacked page sheets behind paginated content — for both single
            and two-column layouts. */}
        <div
          className="page-stack"
          style={{ position: 'relative', width: '210mm', height: `${numPages * pageHeightPx + (numPages - 1) * PAGE_GAP}px` }}
        >
          {/* White page sheets with visible gaps between them. In two-column mode
              each sheet carries its own sidebar-colored strip so the band breaks
              cleanly at every page gap instead of bleeding through it. */}
          <div className="page-sheets" aria-hidden="true">
            {Array.from({ length: numPages }).map((_, i) => (
              <div
                key={i}
                className="page-sheet"
                style={{
                  top: `${i * (pageHeightPx + PAGE_GAP)}px`,
                  height: `${pageHeightPx}px`
                }}
              >
                {isTwoColumn && <span className="page-sheet-sidebar" />}
                <span className="page-sheet-label no-print">Page {i + 1} / {numPages}</span>
              </div>
            ))}
          </div>

          {isTwoColumn ? (
            // Two-column: per-page sidebar strips (drawn in the sheet loop) with the
            // sidebar content on page 1 and the main column paginated alongside.
            <div
              className={`cv-preview-container is-paginated is-two-col ${layoutClass}`}
              style={{ ...previewStyle, position: 'relative', zIndex: 1, background: 'transparent', boxShadow: 'none' }}
            >
              {/* Sidebar content (lives on page 1). The colored strip behind it is
                  drawn per-page in the sheet loop above, so it breaks at each gap. */}
              <aside className="cv-sidebar cv-sidebar-content" style={{ height: `${pageHeightPx}px` }}>
                {personal.photo && (
                  <div className="cv-photo">
                    <img src={personal.photo} alt="Profile" />
                  </div>
                )}
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
                    <div className={settings?.skillStyle === 'tags' ? "cv-skills-stacked" : "cv-contact-list"}>
                      {skills.filter(s => !s.hidden && s.items).map((skill, idx) => (
                        <React.Fragment key={skill.id || idx}>
                          {renderSkillBlock(skill.category, skill.items, true)}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Paginated main column (measured by the paginator). padding-top
                  supplies the first page's top margin. */}
              <div ref={masterRef} className="cv-main-paginated" style={{ paddingTop: `${pageMargin}px` }}>
                {headerBlock}
                {bodyBlocks}
              </div>
            </div>
          ) : (
            // Single-column: paginated content overlaid on the sheets.
            <div
              ref={masterRef}
              className={`cv-preview-container is-paginated ${layoutClass}`}
              style={{
                ...previewStyle,
                position: 'relative',
                zIndex: 1,
                background: 'transparent',
                boxShadow: 'none',
                paddingTop: `${pageMargin}px`
              }}
            >
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
