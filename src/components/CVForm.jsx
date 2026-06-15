import React from 'react';
import './CVForm.css';

const CVForm = ({ cvData, setCvData }) => {

  const handleChange = (section, field, value) => {
    setCvData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSimpleChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('personal', 'photo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleArrayChange = (section, index, field, value) => {
    setCvData(prev => {
      const newArray = [...prev[section]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [section]: newArray };
    });
  };

  const addArrayItem = (section, emptyItem) => {
    setCvData(prev => ({
      ...prev,
      [section]: [...prev[section], emptyItem]
    }));
  };

  const removeArrayItem = (section, index) => {
    setCvData(prev => {
      const newArray = [...prev[section]];
      newArray.splice(index, 1);
      return { ...prev, [section]: newArray };
    });
  };

  const moveArrayItem = (section, index, direction) => {
    setCvData(prev => {
      const newArray = [...prev[section]];
      if (direction === 'up' && index > 0) {
        [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      } else if (direction === 'down' && index < newArray.length - 1) {
        [newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
      }
      return { ...prev, [section]: newArray };
    });
  };

  const renderArrayControls = (section, index, arrayLength) => (
    <div className="array-controls">
      {index > 0 && <button className="btn-move" onClick={() => moveArrayItem(section, index, 'up')}>↑</button>}
      {index < arrayLength - 1 && <button className="btn-move" onClick={() => moveArrayItem(section, index, 'down')}>↓</button>}
      <button className="btn-remove" onClick={() => removeArrayItem(section, index)}>×</button>
    </div>
  );

  return (
    <div className="cv-form-container">
      <h2 className="section-title">Personal Details</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={cvData.personal.name} onChange={e => handleChange('personal', 'name', e.target.value)} placeholder="e.g. Alan Turing" />
          </div>
          <div className="form-group">
            <label>Professional Title</label>
            <input type="text" value={cvData.personal.title} onChange={e => handleChange('personal', 'title', e.target.value)} placeholder="e.g. AI Software Engineer" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={cvData.personal.email} onChange={e => handleChange('personal', 'email', e.target.value)} placeholder="alan@example.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={cvData.personal.phone} onChange={e => handleChange('personal', 'phone', e.target.value)} placeholder="+1 234 567 890" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input type="text" value={cvData.personal.linkedin} onChange={e => handleChange('personal', 'linkedin', e.target.value)} placeholder="linkedin.com/in/alanturing" />
          </div>
          <div className="form-group">
            <label>GitHub URL</label>
            <input type="text" value={cvData.personal.github} onChange={e => handleChange('personal', 'github', e.target.value)} placeholder="github.com/alanturing" />
          </div>
        </div>
        <div className="form-group">
          <label>Portfolio/Website URL</label>
          <input type="text" value={cvData.personal.portfolio} onChange={e => handleChange('personal', 'portfolio', e.target.value)} placeholder="alanturing.dev" />
        </div>
      </div>

      <h2 className="section-title">Professional Summary</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-group">
          <textarea value={cvData.summary} onChange={e => handleSimpleChange('summary', e.target.value)} placeholder="Briefly describe your background, focus in AI/SE, and career goals..." />
        </div>
      </div>

      <h2 className="section-title">Education</h2>
      <div className="glass-panel form-section-panel">
        {cvData.education.map((edu, index) => (
          <div key={index} className="dynamic-item">
            {renderArrayControls('education', index, cvData.education.length)}
            <div className="form-row">
              <div className="form-group">
                <label>Institution</label>
                <input type="text" value={edu.institution} onChange={e => handleArrayChange('education', index, 'institution', e.target.value)} placeholder="University Name" />
              </div>
              <div className="form-group">
                <label>Degree</label>
                <input type="text" value={edu.degree} onChange={e => handleArrayChange('education', index, 'degree', e.target.value)} placeholder="BSc Computer Science" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dates</label>
                <input type="text" value={edu.dates} onChange={e => handleArrayChange('education', index, 'dates', e.target.value)} placeholder="Sep 2020 - May 2024" />
              </div>
              <div className="form-group">
                <label>Results / GPA</label>
                <input type="text" value={edu.gpa} onChange={e => handleArrayChange('education', index, 'gpa', e.target.value)} placeholder="AAB or 3.8 / 4.0" />
              </div>
            </div>
          </div>
        ))}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('education', { institution: '', degree: '', dates: '', gpa: '' })}>+ Add Education</button>
      </div>

      <h2 className="section-title">Experience</h2>
      <div className="glass-panel form-section-panel">
        {cvData.experience.map((exp, index) => (
          <div key={index} className="dynamic-item">
            {renderArrayControls('experience', index, cvData.experience.length)}
            <div className="form-row">
              <div className="form-group">
                <label>Company</label>
                <input type="text" value={exp.company} onChange={e => handleArrayChange('experience', index, 'company', e.target.value)} placeholder="Tech Corp" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input type="text" value={exp.role} onChange={e => handleArrayChange('experience', index, 'role', e.target.value)} placeholder="AI Intern" />
              </div>
            </div>
            <div className="form-group">
              <label>Dates</label>
              <input type="text" value={exp.dates} onChange={e => handleArrayChange('experience', index, 'dates', e.target.value)} placeholder="Jun 2023 - Aug 2023" />
            </div>
            <div className="form-group">
              <label>Description (bullet points)</label>
              <textarea value={exp.description} onChange={e => handleArrayChange('experience', index, 'description', e.target.value)} placeholder="- Developed a machine learning model...&#10;- Improved accuracy by 15%..." />
            </div>
          </div>
        ))}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('experience', { company: '', role: '', dates: '', description: '' })}>+ Add Experience</button>
      </div>

      <h2 className="section-title">AI / SE Projects</h2>
      <div className="glass-panel form-section-panel">
        {cvData.projects.map((proj, index) => (
          <div key={index} className="dynamic-item">
            {renderArrayControls('projects', index, cvData.projects.length)}
            <div className="form-row">
              <div className="form-group">
                <label>Project Name</label>
                <input type="text" value={proj.name} onChange={e => handleArrayChange('projects', index, 'name', e.target.value)} placeholder="Neural Network Visualizer" />
              </div>
              <div className="form-group">
                <label>Tech Stack</label>
                <input type="text" value={proj.tech} onChange={e => handleArrayChange('projects', index, 'tech', e.target.value)} placeholder="Python, PyTorch, React" />
              </div>
            </div>
            <div className="form-group">
              <label>Description (bullet points)</label>
              <textarea value={proj.description} onChange={e => handleArrayChange('projects', index, 'description', e.target.value)} placeholder="- Built a CNN for image classification...&#10;- Deployed via Docker..." />
            </div>
          </div>
        ))}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('projects', { name: '', tech: '', description: '' })}>+ Add Project</button>
      </div>

      <h2 className="section-title">Skills</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-group">
          <label>Languages</label>
          <input type="text" value={cvData.skills.languages} onChange={e => handleChange('skills', 'languages', e.target.value)} placeholder="Python, JavaScript, C++, SQL" />
        </div>
        <div className="form-group">
          <label>AI/ML Frameworks</label>
          <input type="text" value={cvData.skills.frameworks} onChange={e => handleChange('skills', 'frameworks', e.target.value)} placeholder="TensorFlow, PyTorch, Scikit-Learn" />
        </div>
        <div className="form-group">
          <label>Tools & Platforms</label>
          <input type="text" value={cvData.skills.tools} onChange={e => handleChange('skills', 'tools', e.target.value)} placeholder="Git, Docker, AWS, Linux" />
        </div>
      </div>
    </div>
  );
};

export default CVForm;
