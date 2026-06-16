import { useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

import { SortableItem } from './SortableItem';
import RichTextEditor from './RichTextEditor';
import { safeId } from '../utils/id';
import './CVForm.css';

const CVForm = ({ cvData, setCvData }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure all legacy items have an id (one-time backfill on mount).
  // Uses a functional update so it never depends on a stale `cvData` snapshot
  // and cannot clobber concurrent edits or loop on its own state change.
  useEffect(() => {
    setCvData(prev => {
      let needsUpdate = false;
      const next = { ...prev };
      ['education', 'experience', 'projects', 'skills'].forEach(section => {
        if (Array.isArray(next[section])) {
          next[section] = next[section].map(item => {
            if (!item.id) {
              needsUpdate = true;
              return { ...item, id: safeId() };
            }
            return item;
          });
        }
      });
      return needsUpdate ? next : prev;
    });
  }, [setCvData]);

  const handleChange = (section, field, value) => {
    setCvData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSimpleChange = (field, value) => {
    setCvData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert("Image is too large! Please select an image under 2.5MB to prevent storage quota issues.");
        e.target.value = ''; // clear input
        return;
      }
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
      [section]: [...prev[section], { ...emptyItem, id: safeId(), hidden: false }]
    }));
  };

  const removeArrayItem = (section, id) => {
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id)
    }));
  };

  const duplicateArrayItem = (section, id) => {
    setCvData(prev => {
      const list = prev[section];
      const idx = list.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const copy = { ...list[idx], id: safeId() };
      const next = [...list];
      next.splice(idx + 1, 0, copy); // insert right after the original
      return { ...prev, [section]: next };
    });
  };

  const removePhoto = () => handleChange('personal', 'photo', null);

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
        {isHidden ? '🙈' : '👁️'}
      </button>
      <button
        type="button"
        className="btn-duplicate"
        onClick={() => duplicateArrayItem(section, id)}
        title="Duplicate"
      >
        ⧉
      </button>
      <button
        type="button"
        className="btn-remove"
        onClick={() => { if (window.confirm('Remove this entry?')) removeArrayItem(section, id); }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );

  return (
    <div className="cv-form-container">
      <h2 className="section-title">Personal Details</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-group">
          <label>Profile Photo</label>
          <div className="photo-upload-row">
            {cvData.personal.photo ? (
              <img src={cvData.personal.photo} alt="Profile preview" className="photo-preview" />
            ) : (
              <div className="photo-preview photo-preview-empty">No photo</div>
            )}
            <div className="photo-upload-actions">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              {cvData.personal.photo && (
                <button type="button" className="btn btn-secondary photo-remove-btn" onClick={removePhoto}>
                  Remove photo
                </button>
              )}
            </div>
          </div>
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
          <RichTextEditor 
            value={cvData.summary} 
            onChange={(val) => handleSimpleChange('summary', val)} 
            placeholder="Briefly describe your background, key strengths, and career goals..."
          />
        </div>
      </div>

      <h2 className="section-title">Education</h2>
      <div className="glass-panel form-section-panel">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'education')}>
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
        {cvData.education.length === 0 && <div className="section-empty">No education added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('education', { institution: '', degree: '', dates: '', gpa: '' })}>+ Add Education</button>
      </div>

      <h2 className="section-title">Experience</h2>
      <div className="glass-panel form-section-panel">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'experience')}>
          <SortableContext items={cvData.experience.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.experience.map((exp) => (
              <SortableItem key={exp.id} id={exp.id} isHidden={exp.hidden}>
                {renderArrayControls('experience', exp.id, exp.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Company / Organization</label>
                    <input type="text" value={exp.company || ''} onChange={e => handleArrayChange('experience', exp.id, 'company', e.target.value)} placeholder="e.g. Tech Corp, IEEE Student Branch" />
                  </div>
                  <div className="form-group">
                    <label>Role / Position</label>
                    <input type="text" value={exp.role || ''} onChange={e => handleArrayChange('experience', exp.id, 'role', e.target.value)} placeholder="e.g. AI Intern, Club President, Volunteer" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Dates</label>
                    <input type="text" value={exp.dates || ''} onChange={e => handleArrayChange('experience', exp.id, 'dates', e.target.value)} placeholder="Jun 2023 - Aug 2023" />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={exp.type || ''} onChange={e => handleArrayChange('experience', exp.id, 'type', e.target.value)}>
                      <option value="">None</option>
                      <option value="Work">Work</option>
                      <option value="Internship">Internship</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Research">Research</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{display: 'flex', flexDirection: 'column'}}>
                  <label>Description</label>
                  <RichTextEditor
                    value={exp.description || ''}
                    onChange={(val) => handleArrayChange('experience', exp.id, 'description', val)}
                    placeholder="Describe your role and impact..."
                  />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        {cvData.experience.length === 0 && <div className="section-empty">No experience added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('experience', { company: '', role: '', dates: '', type: '', description: '' })}>+ Add Experience</button>
      </div>

      <h2 className="section-title">Projects</h2>
      <div className="glass-panel form-section-panel">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'projects')}>
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
                  <RichTextEditor 
                    value={proj.description || ''} 
                    onChange={(val) => handleArrayChange('projects', proj.id, 'description', val)} 
                    placeholder="Describe the project and technologies used..." 
                  />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        {cvData.projects.length === 0 && <div className="section-empty">No projects added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('projects', { name: '', tech: '', description: '' })}>+ Add Project</button>
      </div>

      <h2 className="section-title">Skills</h2>
      <div className="glass-panel form-section-panel">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'skills')}>
          <SortableContext items={(Array.isArray(cvData.skills) ? cvData.skills : []).map(s => s.id)} strategy={verticalListSortingStrategy}>
            {(Array.isArray(cvData.skills) ? cvData.skills : []).map((skill) => (
              <SortableItem key={skill.id} id={skill.id} isHidden={skill.hidden}>
                {renderArrayControls('skills', skill.id, skill.hidden)}
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 30%' }}>
                    <label>Category</label>
                    <input type="text" value={skill.category || ''} onChange={e => handleArrayChange('skills', skill.id, 'category', e.target.value)} placeholder="Languages" />
                  </div>
                  <div className="form-group" style={{ flex: '1' }}>
                    <label>Skills (comma separated)</label>
                    <input type="text" value={skill.items || ''} onChange={e => handleArrayChange('skills', skill.id, 'items', e.target.value)} placeholder="React, Node.js" />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('skills', { category: '', items: '' })}>+ Add Skill Category</button>
      </div>
    </div>
  );
};

export default CVForm;
