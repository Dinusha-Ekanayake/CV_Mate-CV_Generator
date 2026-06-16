import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Briefcase, GraduationCap, FolderDot, Wrench } from 'lucide-react';
import DOMPurify from 'dompurify';
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
  const [numPages, setNumPages] = useState(1);
  const masterRef = useRef(null);
  const rulerRef = useRef(null);
  const [pageHeightPx, setPageHeightPx] = useState(1122); // Fallback for 297mm

  useEffect(() => {
    if (rulerRef.current) {
      setPageHeightPx(rulerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (!masterRef.current || pageHeightPx <= 0) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        const pagesNeeded = Math.max(1, Math.ceil(h / pageHeightPx));
        // Functional update avoids re-subscribing the observer on every page change.
        setNumPages(prev => (prev !== pagesNeeded ? pagesNeeded : prev));
      }
    });
    observer.observe(masterRef.current);
    return () => observer.disconnect();
  }, [pageHeightPx]);

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
    
    // Check if it's legacy text (no HTML tags)
    const isLegacy = !text.includes('<');
    
    let html = text;
    if (isLegacy) {
      // Inline markdown first (bold before italic so ** isn't eaten by *),
      // then links. Done before block conversion so it applies inside bullets too.
      const inline = (s) => s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const isBulletList = lines.length > 0 && lines.every(l => l.startsWith('-'));

      if (isBulletList) {
        const lis = lines.map(line => `<li>${inline(line.replace(/^-\s?/, ''))}</li>`).join('');
        html = `<ul>${lis}</ul>`;
      } else {
        // Preserve line breaks for non-list legacy text.
        html = lines.map(inline).join('<br>');
      }
    }

    // Secure the HTML
    const cleanHtml = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
    
    return (
      <div 
        className="rich-text-content" 
        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
      />
    );
  };

  const isTwoColumn = settings?.layout === 'two-column' || settings?.layout === 'creative';
  const layoutStyleName = settings?.layout || 'single';
  const layoutClass = `layout-${layoutStyleName} ${settings?.darkMode ? 'cv-dark-mode' : ''}`;
  const order = settings?.sectionOrder || ['summary', 'education', 'experience', 'projects', 'skills'];

  const previewStyle = {
    '--theme-color': settings?.themeColor || '#0f172a',
    '--heading-font': settings?.headingFont || "'Inter', sans-serif",
    '--body-font': settings?.bodyFont || "'Inter', sans-serif",
    '--spacing-multiplier': settings?.density === 'compact' ? 0.6 : settings?.density === 'spacious' ? 1.5 : 1,
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

  // Component Map for dynamic ordering
  const sectionsMap = {
    summary: summary ? (
      <div className="cv-section" key="summary">
        <SectionHeader title="Profile" icon={Briefcase} showIcons={settings?.showIcons} />
        <div className="cv-summary-text">{renderRichText(summary)}</div>
      </div>
    ) : null,

    education: (education || []).filter(e => !e.hidden).length > 0 ? (
      <div className="cv-section" key="education">
        <SectionHeader title="Education" icon={GraduationCap} showIcons={settings?.showIcons} />
        {(education || []).filter(e => !e.hidden).map((edu) => (
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
        ))}
      </div>
    ) : null,

    experience: (experience || []).filter(e => !e.hidden).length > 0 ? (
      <div className="cv-section" key="experience">
        <SectionHeader title="Experience" icon={Briefcase} showIcons={settings?.showIcons} />
        {(experience || []).filter(e => !e.hidden).map((exp) => (
          <div key={exp.id} className="cv-item">
            <div className="cv-item-header">
              <span className="cv-item-title">{exp.company}</span>
              <span className="cv-item-date">{exp.dates}</span>
            </div>
            <div className="cv-item-subheader">
              <span>{exp.role}</span>
            </div>
            <div className="cv-item-description">
              {renderRichText(exp.description)}
            </div>
          </div>
        ))}
      </div>
    ) : null,

    projects: (projects || []).filter(p => !p.hidden).length > 0 ? (
      <div className="cv-section" key="projects">
        <SectionHeader title="Projects" icon={FolderDot} showIcons={settings?.showIcons} />
        {(projects || []).filter(p => !p.hidden).map((proj) => (
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
        ))}
      </div>
    ) : null,

    skills: (Array.isArray(skills) && skills.filter(s => !s.hidden && s.items).length > 0) ? (
      <div className="cv-section" key="skills">
        <SectionHeader title="Skills" icon={Wrench} showIcons={settings?.showIcons} />
        <div className="cv-skills">
          {skills.filter(s => !s.hidden && s.items).map((skill, idx) => (
            <React.Fragment key={skill.id || idx}>
              {renderSkillBlock(skill.category, skill.items)}
            </React.Fragment>
          ))}
        </div>
      </div>
    ) : null
  };

  // Wrap a rendered section so it starts on a new printed page when the user
  // requested a page break before it. Wrapping (rather than cloning) keeps the
  // section element's own `key` intact.
  const pageBreaks = Array.isArray(settings?.pageBreaks) ? settings.pageBreaks : [];
  const renderSection = (sec) => {
    const el = sectionsMap[sec];
    if (!el) return null;
    if (pageBreaks.includes(sec)) {
      return <div key={sec} className="cv-page-break-before">{el}</div>;
    }
    return el;
  };

  const handleNativeExport = async () => {
    try {
      await window.cvmate.exportPdf();
    } catch (e) {
      console.error("Native export failed:", e);
      window.print(); // Fallback to browser print
    }
  };

  const isElectron = typeof window !== 'undefined' && window.cvmate?.isElectron === true;

  const renderContent = () => {
    return isTwoColumn ? (
      <>
        <aside className="cv-sidebar">
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

        <main className="cv-main-content">
          <div className="cv-header">
            <div className="cv-header-content">
              <h1 className="cv-name">{personal.name || 'Your Name'}</h1>
              <h2 className="cv-title">{personal.title || 'Professional Title'}</h2>
            </div>
          </div>
          
          {/* Render sections according to order, excluding skills which is in sidebar */}
          {order.filter(sec => sec !== 'skills').map(sec => renderSection(sec))}
        </main>
      </>
    ) : (
      <>
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

        <div className="cv-body">
          {order.map(sec => renderSection(sec))}
        </div>
      </>
    );
  };

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

        {/* Page stack: the continuous content sits on top of contiguous A4 page
            frames. The frames align 1:1 with the content (no offset), and each
            page boundary is drawn as a clear divider with a shadow + gutter label
            so the preview reads as discrete pages — while staying honest that the
            real break is decided by the print engine. */}
        <div className="page-stack" style={{ position: 'relative' }}>
          {/* One divider band at each internal page boundary. */}
          <div className="page-dividers no-print" aria-hidden="true">
            {Array.from({ length: Math.max(0, numPages - 1) }).map((_, i) => (
              <div
                key={i}
                className="page-divider"
                style={{ top: `${(i + 1) * pageHeightPx}px` }}
              >
                <span className="page-divider-label">Page {i + 2}</span>
              </div>
            ))}
          </div>

          <div
            ref={masterRef}
            className={`cv-preview-container ${layoutClass}`}
            style={{
              ...previewStyle,
              height: 'auto',
              minHeight: '297mm',
              position: 'relative',
              zIndex: 1,
              backgroundColor: 'white',
              borderRadius: '4px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CVPreview;
