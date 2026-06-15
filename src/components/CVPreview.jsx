import React from 'react';
import './CVPreview.css';

const CVPreview = ({ cvData, settings }) => {
  const { personal, summary, education, experience, projects, skills } = cvData;

  const parseMarkdown = (text) => {
    if (!text) return null;
    
    // Security: Escape raw HTML tags to prevent XSS injection
    let safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Simple markdown parser: **bold**, *italic*, [text](link)
    let html = safeText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderBullets = (text) => {
    if (!text) return null;
    return (
      <ul className="bullet-list">
        {text.split('\n').filter(line => line.trim().length > 0).map((line, i) => {
          const cleanLine = line.replace(/^-/, '').trim();
          return <li key={i}>{parseMarkdown(cleanLine)}</li>;
        })}
      </ul>
    );
  };

  const isTwoColumn = settings?.layout === 'two-column' || settings?.layout === 'creative';
  const layoutStyleName = settings?.layout || 'single';
  const layoutClass = `layout-${layoutStyleName}`;
  const order = settings?.sectionOrder || ['summary', 'education', 'experience', 'projects', 'skills'];

  const previewStyle = {
    '--theme-color': settings?.themeColor || '#0f172a',
    fontFamily: settings?.fontFamily || "'Inter', sans-serif"
  };

  const renderSkillBlock = (label, skillString, isSidebar = false) => {
    if (!skillString) return null;
    if (settings?.skillStyle === 'tags') {
      return (
        <div className={`cv-skill-group tags-mode ${isSidebar ? 'sidebar-style' : ''}`}>
          <strong style={{display: 'block', marginBottom: '4px'}}>{label}</strong>
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
        <h3 className="cv-section-title">Profile</h3>
        <p className="cv-summary-text">{parseMarkdown(summary)}</p>
      </div>
    ) : null,
    
    education: education.filter(e => !e.hidden).length > 0 ? (
      <div className="cv-section" key="education">
        <h3 className="cv-section-title">Education</h3>
        {education.filter(e => !e.hidden).map((edu, idx) => (
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

    experience: experience.filter(e => !e.hidden).length > 0 ? (
      <div className="cv-section" key="experience">
        <h3 className="cv-section-title">Experience</h3>
        {experience.filter(e => !e.hidden).map((exp, idx) => (
          <div key={idx} className="cv-item">
            <div className="cv-item-header">
              <span className="cv-item-title">{exp.company}</span>
              <span className="cv-item-date">{exp.dates}</span>
            </div>
            <div className="cv-item-subheader">
              <span>{exp.role}</span>
            </div>
            <div className="cv-item-description">
              {renderBullets(exp.description)}
            </div>
          </div>
        ))}
      </div>
    ) : null,

    projects: projects.filter(p => !p.hidden).length > 0 ? (
      <div className="cv-section" key="projects">
        <h3 className="cv-section-title">Projects</h3>
        {projects.filter(p => !p.hidden).map((proj, idx) => (
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
              {renderBullets(proj.description)}
            </div>
          </div>
        ))}
      </div>
    ) : null,

    skills: (skills.languages || skills.frameworks || skills.tools) ? (
      <div className="cv-section" key="skills">
        <h3 className="cv-section-title">Skills</h3>
        <div className="cv-skills">
          {renderSkillBlock('Languages', skills.languages)}
          {renderSkillBlock('Frameworks', skills.frameworks)}
          {renderSkillBlock('Tools', skills.tools)}
        </div>
      </div>
    ) : null
  };

  return (
    <div className={`cv-preview-container print-only ${layoutClass}`} style={previewStyle}>
      
      {isTwoColumn ? (
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

            {(skills.languages || skills.frameworks || skills.tools) && (
              <div className="cv-section sidebar-section">
                <h3 className="cv-section-title">Skills</h3>
                <div className="cv-skills-stacked">
                  {renderSkillBlock('Languages', skills.languages, true)}
                  {renderSkillBlock('Frameworks', skills.frameworks, true)}
                  {renderSkillBlock('Tools', skills.tools, true)}
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
      )}
    </div>
  );
};

export default CVPreview;
