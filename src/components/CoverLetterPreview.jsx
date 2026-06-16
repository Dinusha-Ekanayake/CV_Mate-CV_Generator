import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import DOMPurify from 'dompurify';
import './CVPreview.css';

const CoverLetterPreview = ({ cvData = {}, settings = {} }) => {
  const { personal = {}, coverLetter = {} } = cvData;
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(prev => {
          const newZoom = prev - e.deltaY * 0.002;
          return Math.min(Math.max(0.3, newZoom), 2.5);
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const renderRichText = (text) => {
    if (!text) return null;
    const cleanHtml = DOMPurify.sanitize(text, { ADD_ATTR: ['target'] });
    return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  const layoutClass = `layout-single ${settings?.darkMode ? 'cv-dark-mode' : ''}`;

  // Reuse the exact same CSS variables for perfectly matched branding
  const previewStyle = {
    '--theme-color': settings?.themeColor || '#0f172a',
    '--heading-font': settings?.headingFont || "'Inter', sans-serif",
    '--body-font': settings?.bodyFont || "'Inter', sans-serif",
    '--spacing-multiplier': settings?.density === 'compact' ? 0.6 : settings?.density === 'spacious' ? 1.5 : 1,
    '--font-scale': Number(settings?.fontScale) || 1,
    fontFamily: settings?.bodyFont || settings?.fontFamily || "'Inter', sans-serif"
  };

  const getHeadingFontName = () => settings?.headingFont ? settings.headingFont.split("'")[1] : 'Inter';
  const getBodyFontName = () => settings?.bodyFont ? settings.bodyFont.split("'")[1] : 'Inter';
  const fontLink = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(getHeadingFontName())}:wght@400;500;600;700&family=${encodeURIComponent(getBodyFontName())}:wght@400;500;600;700&display=swap`;

  const handleNativeExport = async () => {
    try {
      await window.cvmate.exportPdf();
    } catch {
      window.print();
    }
  };

  const isElectron = typeof window !== 'undefined' && window.cvmate?.isElectron === true;

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

      <div
        className="scalable-paper"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          borderRadius: '4px'
        }}
      >
        <div className={`cv-preview-container ${layoutClass}`} style={previewStyle}>
          {/* Header (matches the single-column resume header for consistent branding) */}
          <div className="cv-header single-col-header">
            <div className="cv-header-content">
              <h1 className="cv-name">{personal.name || 'Your Name'}</h1>
              <h2 className="cv-title">{personal.title || 'Professional Title'}</h2>
              <div className="cv-contact-info">
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span><span className="bullet">&bull;</span> {personal.phone}</span>}
                {personal.linkedin && <span><span className="bullet">&bull;</span> {personal.linkedin}</span>}
                {personal.portfolio && <span><span className="bullet">&bull;</span> {personal.portfolio}</span>}
              </div>
            </div>
            {personal.photo && (
              <div className="cv-photo">
                <img src={personal.photo} alt="Profile" />
              </div>
            )}
          </div>

          {/* Cover Letter Content */}
          <div className="cover-letter-body">
            <div className="cover-letter-meta">
              {coverLetter.date && <div>{coverLetter.date}</div>}
              {coverLetter.recipientName && <div className="cover-letter-recipient"><strong>{coverLetter.recipientName}</strong></div>}
              {coverLetter.companyName && <div>{coverLetter.companyName}</div>}
            </div>

            {coverLetter.position && (
              <div className="cover-letter-subject"><strong>Re: Application for {coverLetter.position}</strong></div>
            )}

            {coverLetter.recipientName && (
              <div className="cover-letter-greeting">{coverLetter.greeting || 'Dear'} {coverLetter.recipientName},</div>
            )}

            <div className="cv-item-description cover-letter-text">
              {renderRichText(coverLetter.body)}
            </div>

            <div className="cover-letter-signature">
              <div>{coverLetter.closing || 'Sincerely'},</div>
              <div className="cover-letter-signature-name">{personal.name || 'Your Name'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
