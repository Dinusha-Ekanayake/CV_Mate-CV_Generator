import React from 'react';
import './CVPreview.css';

const CVPreview = ({ cvData }) => {
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

  return (
    <div className="cv-preview-container print-only">
      <div className="cv-header">
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
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
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
    </div>
  );
};

export default CVPreview;
