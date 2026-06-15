import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import DOMPurify from 'dompurify';
import './CVPreview.css';

const CoverLetterPreview = ({ cvData, settings }) => {
  const { personal, coverLetter } = cvData;
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

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
    const cleanHtml = DOMPurify.sanitize(text);
    return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
  };

  const layoutClass = `layout-${settings.layout}`;
  
  // Reuse the exact same CSS variables for perfectly matched branding
  const previewStyle = {
    '--theme-color': settings.themeColor,
    '--font-family': `"${settings.font}", sans-serif`,
    padding: '40px'
  };

  const handleNativeExport = async () => {
    try {
      const electron = window.require('electron');
      const { ipcRenderer } = electron;
      await ipcRenderer.invoke('export-pdf');
    } catch (e) {
      window.print();
    }
  };

  const isElectron = typeof window !== 'undefined' && window.require;

  return (
    <div 
      className="cv-preview-wrapper no-print" 
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
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          borderRadius: '4px'
        }}
      >
        <div className={`cv-preview-container print-only ${layoutClass}`} style={previewStyle}>
          {/* Header (Reused from Resume for perfect match) */}
          <header className="cv-header">
            {settings.layout !== 'two-column' && personal.photo && (
              <div className="cv-photo-top">
                <img src={personal.photo} alt="Profile" />
              </div>
            )}
            <div className="cv-header-text">
              <h1 className="cv-name">{personal.name || 'Your Name'}</h1>
              <h2 className="cv-title">{personal.title || 'Professional Title'}</h2>
              <div className="cv-contact">
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span>{personal.phone}</span>}
                {personal.linkedin && <span>{personal.linkedin}</span>}
                {personal.portfolio && <span>{personal.portfolio}</span>}
              </div>
            </div>
          </header>

          {/* Cover Letter Content */}
          <div className="cv-main" style={{ marginTop: '40px' }}>
            <div style={{ marginBottom: '30px', fontSize: '11pt', color: '#333' }}>
              <div>{coverLetter.date}</div>
              <br />
              {coverLetter.recipientName && <div><strong>{coverLetter.recipientName}</strong></div>}
              {coverLetter.companyName && <div>{coverLetter.companyName}</div>}
            </div>

            <div className="cv-item-description" style={{ fontSize: '11pt', lineHeight: '1.6', color: '#222' }}>
              {renderRichText(coverLetter.body)}
            </div>
            
            <div style={{ marginTop: '40px', fontSize: '11pt', color: '#333' }}>
              <div>Sincerely,</div>
              <br />
              <div style={{ fontWeight: 'bold' }}>{personal.name || 'Your Name'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPreview;
