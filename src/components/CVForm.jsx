import React, { useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

import { SortableItem } from './SortableItem';
import MarkdownToolbar from './MarkdownToolbar';
import './CVForm.css';

const CVForm = ({ cvData, setCvData }) => {

  // Ensure all legacy items have an id on mount
  useEffect(() => {
    let needsUpdate = false;
    const newData = { ...cvData };
    ['education', 'experience', 'projects'].forEach(section => {
      newData[section] = newData[section].map(item => {
        if (!item.id) {
          needsUpdate = true;
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });
    });
    if (needsUpdate) {
      setCvData(newData);
    }
  }, [cvData, setCvData]);

  const handleChange = (section, field, value) => {
    setCvData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSimpleChange = (field, value) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('personal', 'photo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleArrayChange = (section, id, field, value) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addArrayItem = (section, emptyItem) => {
    setCvData(prev => ({
      ...prev,
      [section]: [...prev[section], { ...emptyItem, id: crypto.randomUUID(), hidden: false }]
    }));
  };

  const removeArrayItem = (section, id) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const toggleVisibility = (section, id) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, hidden: !item.hidden } : item)
    }));
  };

  const handleDragEnd = (event, section) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCvData((prev) => {
        const oldIndex = prev[section].findIndex(item => item.id === active.id);
        const newIndex = prev[section].findIndex(item => item.id === over.id);
        return {
          ...prev,
          [section]: arrayMove(prev[section], oldIndex, newIndex),
        };
      });
    }
  };

  const renderArrayControls = (section, id, isHidden) => (
    <div className="array-controls">
      <button 
        type="button"
        className={`btn-toggle ${isHidden ? 'hidden' : ''}`} 
        onClick={() => toggleVisibility(section, id)}
        title={isHidden ? "Show in CV" : "Hide from CV"}
      >
        {isHidden ? '👁️‍🗨️' : '👁️'}
      </button>
      <button type="button" className="btn-remove" onClick={() => removeArrayItem(section, id)} title="Remove">×</button>
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
        <div className="form-group" style={{display: 'flex', flexDirection: 'column'}}>
          <MarkdownToolbar value={cvData.summary} onChange={(val) => handleSimpleChange('summary', val)} />
          <textarea 
            style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
            value={cvData.summary} 
            onChange={e => handleSimpleChange('summary', e.target.value)} 
            placeholder="Briefly describe your background, focus in AI/SE, and career goals..." 
          />
        </div>
      </div>

      <h2 className="section-title">Education</h2>
      <div className="glass-panel form-section-panel">
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'education')}>
          <SortableContext items={cvData.education.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.education.map((edu) => (
              <SortableItem key={edu.id} id={edu.id} isHidden={edu.hidden}>
                {renderArrayControls('education', edu.id, edu.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Institution</label>
                    <input type="text" value={edu.institution || ''} onChange={e => handleArrayChange('education', edu.id, 'institution', e.target.value)} placeholder="University Name" />
                  </div>
                  <div className="form-group">
                    <label>Degree</label>
                    <input type="text" value={edu.degree || ''} onChange={e => handleArrayChange('education', edu.id, 'degree', e.target.value)} placeholder="BSc Computer Science" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Dates</label>
                    <input type="text" value={edu.dates || ''} onChange={e => handleArrayChange('education', edu.id, 'dates', e.target.value)} placeholder="Sep 2020 - May 2024" />
                  </div>
                  <div className="form-group">
                    <label>Results / GPA</label>
                    <input type="text" value={edu.gpa || ''} onChange={e => handleArrayChange('education', edu.id, 'gpa', e.target.value)} placeholder="AAB or 3.8 / 4.0" />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('education', { institution: '', degree: '', dates: '', gpa: '' })}>+ Add Education</button>
      </div>

      <h2 className="section-title">Experience</h2>
      <div className="glass-panel form-section-panel">
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'experience')}>
          <SortableContext items={cvData.experience.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.experience.map((exp) => (
              <SortableItem key={exp.id} id={exp.id} isHidden={exp.hidden}>
                {renderArrayControls('experience', exp.id, exp.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Company</label>
                    <input type="text" value={exp.company || ''} onChange={e => handleArrayChange('experience', exp.id, 'company', e.target.value)} placeholder="Tech Corp" />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input type="text" value={exp.role || ''} onChange={e => handleArrayChange('experience', exp.id, 'role', e.target.value)} placeholder="AI Intern" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Dates</label>
                  <input type="text" value={exp.dates || ''} onChange={e => handleArrayChange('experience', exp.id, 'dates', e.target.value)} placeholder="Jun 2023 - Aug 2023" />
                </div>
                <div className="form-group" style={{display: 'flex', flexDirection: 'column'}}>
                  <label>Description</label>
                  <MarkdownToolbar value={exp.description || ''} onChange={(val) => handleArrayChange('experience', exp.id, 'description', val)} />
                  <textarea 
                    style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
                    value={exp.description || ''} 
                    onChange={e => handleArrayChange('experience', exp.id, 'description', e.target.value)} 
                    placeholder="- Developed a **machine learning** model...&#10;- Improved accuracy by 15%..." 
                  />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('experience', { company: '', role: '', dates: '', description: '' })}>+ Add Experience</button>
      </div>

      <h2 className="section-title">AI / SE Projects</h2>
      <div className="glass-panel form-section-panel">
        <DndContext collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'projects')}>
          <SortableContext items={cvData.projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {cvData.projects.map((proj) => (
              <SortableItem key={proj.id} id={proj.id} isHidden={proj.hidden}>
                {renderArrayControls('projects', proj.id, proj.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Project Name</label>
                    <input type="text" value={proj.name || ''} onChange={e => handleArrayChange('projects', proj.id, 'name', e.target.value)} placeholder="Neural Network Visualizer" />
                  </div>
                  <div className="form-group">
                    <label>Tech Stack</label>
                    <input type="text" value={proj.tech || ''} onChange={e => handleArrayChange('projects', proj.id, 'tech', e.target.value)} placeholder="Python, PyTorch, React" />
                  </div>
                </div>
                <div className="form-group" style={{display: 'flex', flexDirection: 'column'}}>
                  <label>Description</label>
                  <MarkdownToolbar value={proj.description || ''} onChange={(val) => handleArrayChange('projects', proj.id, 'description', val)} />
                  <textarea 
                    style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
                    value={proj.description || ''} 
                    onChange={e => handleArrayChange('projects', proj.id, 'description', e.target.value)} 
                    placeholder="- Built a CNN for image classification...&#10;- Deployed via Docker..." 
                  />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
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
