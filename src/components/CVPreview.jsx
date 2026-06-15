import React from 'react';
import './CVPreview.css';

const CVPreview = ({ cvData, settings }) => {
  const { personal, summary, education, experience, projects, skills } = cvData;

  const renderBullets = (text) => {
    if (!text) return null;
    return (
      <ul className="bullet-list">
        {text.split('\n').filter(line => line.trim().length > 0).map((line, i) => {
          const cleanLine = line.replace(/^-/, '').trim();
          return <li key={i}>{cleanLine}</li>;
        })}
      </ul>
    );
  };

  const isTwoColumn = settings?.layout === 'two-column';

  const previewStyle = {
    '--theme-color': settings?.themeColor || '#0f172a',
    fontFamily: settings?.fontFamily || "'Inter', sans-serif"
  };

  const layoutClass = isTwoColumn ? 'layout-two-column' : 'layout-single';

  return (
    <div className={`cv-preview-container print-only ${layoutClass}`} style={previewStyle}>
      
      {isTwoColumn ? (
        <>
          {/* TWO COLUMN LAYOUT */}
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
                  {skills.languages && (
                    <div className="cv-skill-group">
                      <strong>Languages</strong>
                      <div>{skills.languages}</div>
                    </div>
                  )}
                  {skills.frameworks && (
                    <div className="cv-skill-group">
                      <strong>Frameworks</strong>
                      <div>{skills.frameworks}</div>
                    </div>
                  )}
                  {skills.tools && (
                    <div className="cv-skill-group">
                      <strong>Tools</strong>
                      <div>{skills.tools}</div>
                    </div>
                  )}
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

            {summary && (
              <div className="cv-section">
                <h3 className="cv-section-title">Profile</h3>
                <p className="cv-summary-text">{summary}</p>
              </div>
            )}

            {education.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Education</h3>
                {education.map((edu, idx) => (
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
            )}

            {experience.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Experience</h3>
                {experience.map((exp, idx) => (
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
            )}

            {projects.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Projects</h3>
                {projects.map((proj, idx) => (
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
            )}
          </main>
        </>
      ) : (
        <>
          {/* SINGLE COLUMN LAYOUT (Classic) */}
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
            {summary && (
              <div className="cv-section">
                <h3 className="cv-section-title">Professional Summary</h3>
                <p className="cv-summary-text">{summary}</p>
              </div>
            )}

            {education.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Education</h3>
                {education.map((edu, idx) => (
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
            )}

            {experience.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Experience</h3>
                {experience.map((exp, idx) => (
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
            )}

            {projects.length > 0 && (
              <div className="cv-section">
                <h3 className="cv-section-title">Projects</h3>
                {projects.map((proj, idx) => (
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
            )}

            {(skills.languages || skills.frameworks || skills.tools) && (
              <div className="cv-section">
                <h3 className="cv-section-title">Skills</h3>
                <div className="cv-skills">
                  {skills.languages && (
                    <div className="cv-skill-row">
                      <strong>Languages:</strong> {skills.languages}
                    </div>
                  )}
                  {skills.frameworks && (
                    <div className="cv-skill-row">
                      <strong>Frameworks:</strong> {skills.frameworks}
                    </div>
                  )}
                  {skills.tools && (
                    <div className="cv-skill-row">
                      <strong>Tools:</strong> {skills.tools}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CVPreview;
