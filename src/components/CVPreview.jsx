import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Briefcase, GraduationCap, FolderDot, Wrench } from 'lucide-react';
import DOMPurify from 'dompurify';
import './CVPreview.css';

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
      for (let entry of entries) {
        const h = entry.contentRect.height;
        const pagesNeeded = Math.max(1, Math.ceil(h / pageHeightPx));
        if (pagesNeeded !== numPages) {
          setNumPages(pagesNeeded);
        }
      }
    });
    observer.observe(masterRef.current);
    return () => observer.disconnect();
  }, [pageHeightPx, numPages, cvData, settings]);

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

  const renderRichText = (text) => {
    if (!text) return null;
    
    // Check if it's legacy text (no HTML tags)
    const isLegacy = !text.includes('<');
    
    let html = text;
    if (isLegacy) {
      // Convert legacy markdown bullets to HTML
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0 && lines[0].trim().startsWith('-')) {
        const lis = lines.map(line => `<li>${line.replace(/^-/, '').trim()}</li>`).join('');
        html = `<ul>${lis}</ul>`;
      }
      
      // Simple legacy markdown parser: **bold**, *italic*, [text](link)
      html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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

  // Icon Helper
  const SectionHeader = ({ title, icon: Icon }) => (
    <h3 className="cv-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {settings?.showIcons && <Icon size={20} className="section-icon" color="var(--theme-color)" />}
      {title}
    </h3>
  );

  // Component Map for dynamic ordering
  const sectionsMap = {
    summary: summary ? (
      <div className="cv-section" key="summary">
        <SectionHeader title="Profile" icon={Briefcase} />
        <div className="cv-summary-text">{renderRichText(summary)}</div>
      </div>
    ) : null,
    
    education: (education || []).filter(e => !e.hidden).length > 0 ? (
      <div className="cv-section" key="education">
        <SectionHeader title="Education" icon={GraduationCap} />
        {(education || []).filter(e => !e.hidden).map((edu, idx) => (
          <div key={idx} className="cv-item">
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
        <SectionHeader title="Experience" icon={Briefcase} />
        {(experience || []).filter(e => !e.hidden).map((exp, idx) => (
          <div key={idx} className="cv-item">
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
        <SectionHeader title="Projects" icon={FolderDot} />
        {(projects || []).filter(p => !p.hidden).map((proj, idx) => (
          <div key={idx} className="cv-item">
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
        <SectionHeader title="Skills" icon={Wrench} />
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

  const handleNativeExport = async () => {
    try {
      const electron = window.require('electron');
      const { ipcRenderer } = electron;
      await ipcRenderer.invoke('export-pdf');
    } catch (e) {
      console.error("Not running in Electron:", e);
      window.print(); // Fallback to browser print
    }
  };

  const isElectron = typeof window !== 'undefined' && window.require;

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
          {order.filter(sec => sec !== 'skills').map(sec => sectionsMap[sec])}
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
              {personal.phone && <span> • {personal.phone}</span>}
              {personal.linkedin && <span> • {personal.linkedin}</span>}
              {personal.github && <span> • {personal.github}</span>}
              {personal.portfolio && <span> • {personal.portfolio}</span>}
            </div>
          </div>
          {personal.photo && (
            <div className="cv-photo">
              <img src={personal.photo} alt="Profile" />
            </div>
          )}
        </div>

        <div className="cv-body">
          {order.map(sec => sectionsMap[sec])}
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
          transition: 'transform 0.1s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}
      >
        {/* Hidden Ruler for exact 297mm pixel calculation on user's monitor */}
        <div ref={rulerRef} style={{ height: '297mm', position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }} />

        {/* Master Pageless Content */}
        <div 
          ref={masterRef}
          className={`cv-preview-container ${layoutClass}`} 
          style={{ 
            ...previewStyle, 
            height: 'auto', 
            minHeight: '297mm',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}
        >
          {/* Visual Page Break Indicators */}
          {Array.from({ length: numPages - 1 }).map((_, i) => (
            <div
              key={i}
              className="no-print page-break-indicator"
              style={{
                position: 'absolute',
                top: `calc(${i + 1} * 297mm)`,
                left: 0,
                width: '100%',
                borderBottom: '2px dashed rgba(239, 68, 68, 0.6)', /* Subtle Red Dashed Line */
                zIndex: 10
              }}
            >
              <span style={{
                position: 'absolute',
                right: '10px',
                top: '-20px',
                color: 'rgba(239, 68, 68, 0.6)',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                background: 'rgba(255,255,255,0.9)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>Page {i + 2} Break</span>
            </div>
          ))}

          {renderContent()}
        </div>
      </div>
    </div>
  );
};
export default CVPreview;
