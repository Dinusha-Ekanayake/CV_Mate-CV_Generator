import { useEffect, useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

import { SortableItem } from './SortableItem';
import RichTextEditor from './RichTextEditor';
import { safeId } from '../utils/id';
import './CVForm.css';

// ------------------------------------------------------------------
// Collapsible section wrapper
// ------------------------------------------------------------------
const CollapsibleSection = ({ id, title, children, openSections, toggleSection, badge }) => {
  const isOpen = openSections.has(id);
  return (
    <div className="cv-form-section">
      <button
        type="button"
        className="cv-form-section-header"
        onClick={() => toggleSection(id)}
        aria-expanded={isOpen}
      >
        <span className="cv-form-section-title">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {title}
        </span>
        {badge !== undefined && <span className="cv-form-section-badge">{badge}</span>}
      </button>
      {isOpen && <div className="cv-form-section-body glass-panel form-section-panel">{children}</div>}
    </div>
  );
};

// ------------------------------------------------------------------
// Validation helpers
// ------------------------------------------------------------------
const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidUrl = (v) => !v || /^(https?:\/\/|www\.|[a-zA-Z0-9-]+\.)/.test(v.trim());

// ------------------------------------------------------------------
// Main CVForm component
// ------------------------------------------------------------------
const CVForm = ({ cvData, setCvData, onAIRequest }) => {
  // Track which sections are expanded
  const [openSections, setOpenSections] = useState(() => new Set([
    'personal', 'summary', 'experience', 'education', 'projects', 'skills'
  ]));
  const [validationErrors, setValidationErrors] = useState({});

  const toggleSection = useCallback((id) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // One-time backfill: ensure all items have an id
  useEffect(() => {
    setCvData(prev => {
      let needsUpdate = false;
      const next = { ...prev };
      ['education', 'experience', 'projects', 'skills', 'certifications', 'languages', 'awards', 'customSections'].forEach(section => {
        if (Array.isArray(next[section])) {
          next[section] = next[section].map(item => {
            if (!item.id) { needsUpdate = true; return { ...item, id: safeId() }; }
            return item;
          });
        }
      });
      return needsUpdate ? next : prev;
    });
  }, [setCvData]);

  // ------ Handlers ------
  const handleChange = (section, field, value) =>
    setCvData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  const handleSimpleChange = (field, value) =>
    setCvData(prev => ({ ...prev, [field]: value }));

  const handleArrayChange = (section, id, field, value) =>
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));

  const addArrayItem = (section, emptyItem) =>
    setCvData(prev => ({
      ...prev,
      [section]: [...(Array.isArray(prev[section]) ? prev[section] : []), { ...emptyItem, id: safeId(), hidden: false }]
    }));

  const removeArrayItem = (section, id) =>
    setCvData(prev => ({ ...prev, [section]: prev[section].filter(item => item.id !== id) }));

  const duplicateArrayItem = (section, id) =>
    setCvData(prev => {
      const list = prev[section];
      const idx = list.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      const copy = { ...list[idx], id: safeId() };
      const next = [...list];
      next.splice(idx + 1, 0, copy);
      return { ...prev, [section]: next };
    });

  const toggleVisibility = (section, id) =>
    setCvData(prev => ({
      ...prev,
      [section]: prev[section].map(item => item.id === id ? { ...item, hidden: !item.hidden } : item)
    }));

  const handleDragEnd = (event, section) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCvData(prev => {
        const oldIndex = prev[section].findIndex(i => i.id === active.id);
        const newIndex = prev[section].findIndex(i => i.id === over.id);
        return { ...prev, [section]: arrayMove(prev[section], oldIndex, newIndex) };
      });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert('Image is too large! Please select an image under 2.5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => handleChange('personal', 'photo', reader.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => handleChange('personal', 'photo', null);

  const setError = (key, msg) => setValidationErrors(prev => ({ ...prev, [key]: msg }));
  const clearError = (key) => setValidationErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  // ------ Shared array controls ------
  const renderArrayControls = (section, id, isHidden) => (
    <div className="array-controls">
      <button type="button" className={`btn-toggle ${isHidden ? 'hidden' : ''}`}
        onClick={() => toggleVisibility(section, id)} title={isHidden ? 'Show in CV' : 'Hide from CV'}>
        {isHidden ? '🙈' : '👁️'}
      </button>
      <button type="button" className="btn-duplicate"
        onClick={() => duplicateArrayItem(section, id)} title="Duplicate">⧉</button>
      <button type="button" className="btn-remove"
        onClick={() => { if (window.confirm('Remove this entry?')) removeArrayItem(section, id); }} title="Remove">×</button>
    </div>
  );

  const skills = Array.isArray(cvData.skills) ? cvData.skills : [];
  const certifications = Array.isArray(cvData.certifications) ? cvData.certifications : [];
  const languages = Array.isArray(cvData.languages) ? cvData.languages : [];
  const awards = Array.isArray(cvData.awards) ? cvData.awards : [];
  const customSections = Array.isArray(cvData.customSections) ? cvData.customSections : [];

  return (
    <div className="cv-form-container">

      {/* ---- Personal Details ---- */}
      <CollapsibleSection id="personal" title="Personal Details" openSections={openSections} toggleSection={toggleSection}>
        <div className="form-group">
          <label>Profile Photo</label>
          <div className="photo-upload-row">
            {cvData.personal.photo
              ? <img src={cvData.personal.photo} alt="Profile preview" className="photo-preview" />
              : <div className="photo-preview photo-preview-empty">No photo</div>}
            <div className="photo-upload-actions">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
              {cvData.personal.photo && (
                <button type="button" className="btn btn-secondary photo-remove-btn" onClick={removePhoto}>Remove photo</button>
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
            <input
              type="email"
              value={cvData.personal.email}
              onChange={e => handleChange('personal', 'email', e.target.value)}
              onBlur={e => isValidEmail(e.target.value) ? clearError('email') : setError('email', 'Invalid email format')}
              placeholder="alan@example.com"
              className={validationErrors.email ? 'input-error' : ''}
            />
            {validationErrors.email && <span className="validation-hint">⚠️ {validationErrors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={cvData.personal.phone} onChange={e => handleChange('personal', 'phone', e.target.value)} placeholder="+1 234 567 890" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input
              type="text" value={cvData.personal.linkedin}
              onChange={e => handleChange('personal', 'linkedin', e.target.value)}
              onBlur={e => isValidUrl(e.target.value) ? clearError('linkedin') : setError('linkedin', 'Looks like an invalid URL')}
              placeholder="linkedin.com/in/alanturing"
              className={validationErrors.linkedin ? 'input-error' : ''}
            />
            {validationErrors.linkedin && <span className="validation-hint">⚠️ {validationErrors.linkedin}</span>}
          </div>
          <div className="form-group">
            <label>GitHub URL</label>
            <input type="text" value={cvData.personal.github} onChange={e => handleChange('personal', 'github', e.target.value)} placeholder="github.com/alanturing" />
          </div>
        </div>
        <div className="form-group">
          <label>Portfolio / Website URL</label>
          <input type="text" value={cvData.personal.portfolio} onChange={e => handleChange('personal', 'portfolio', e.target.value)} placeholder="alanturing.dev" />
        </div>
      </CollapsibleSection>

      {/* ---- Professional Summary ---- */}
      <CollapsibleSection id="summary" title="Professional Summary" openSections={openSections} toggleSection={toggleSection}>
        <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
          {onAIRequest && (
            <button type="button" className="btn-ai" onClick={() => onAIRequest('summary')}
              title="Generate summary with AI">
              <Sparkles size={14} /> Generate with AI
            </button>
          )}
          <RichTextEditor
            value={cvData.summary}
            onChange={(val) => handleSimpleChange('summary', val)}
            placeholder="Briefly describe your background, key strengths, and career goals..."
          />
        </div>
      </CollapsibleSection>

      {/* ---- Education ---- */}
      <CollapsibleSection id="education" title="Education" openSections={openSections} toggleSection={toggleSection}
        badge={cvData.education.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'education')}>
          <SortableContext items={cvData.education.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.education.map(edu => (
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
      </CollapsibleSection>

      {/* ---- Experience ---- */}
      <CollapsibleSection id="experience" title="Experience" openSections={openSections} toggleSection={toggleSection}
        badge={cvData.experience.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'experience')}>
          <SortableContext items={cvData.experience.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {cvData.experience.map(exp => (
              <SortableItem key={exp.id} id={exp.id} isHidden={exp.hidden}>
                {renderArrayControls('experience', exp.id, exp.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Company / Organization</label>
                    <input type="text" value={exp.company || ''} onChange={e => handleArrayChange('experience', exp.id, 'company', e.target.value)} placeholder="e.g. Tech Corp" />
                  </div>
                  <div className="form-group">
                    <label>Role / Position</label>
                    <input type="text" value={exp.role || ''} onChange={e => handleArrayChange('experience', exp.id, 'role', e.target.value)} placeholder="e.g. AI Intern" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Dates</label>
                    <input type="text" value={exp.dates || ''} onChange={e => handleArrayChange('experience', exp.id, 'dates', e.target.value)} placeholder="Jun 2023 - Aug 2023" />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" value={exp.location || ''} onChange={e => handleArrayChange('experience', exp.id, 'location', e.target.value)} placeholder="London, UK / Remote" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 calc(50% - 8px)' }}>
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
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label>Description</label>
                    {onAIRequest && (
                      <button type="button" className="btn-ai btn-ai-sm"
                        onClick={() => onAIRequest('bullet', exp.id, exp.description)}
                        title="Enhance bullet points with AI">
                        <Sparkles size={12} /> Enhance
                      </button>
                    )}
                  </div>
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
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('experience', { company: '', role: '', dates: '', location: '', type: '', description: '' })}>+ Add Experience</button>
      </CollapsibleSection>

      {/* ---- Projects ---- */}
      <CollapsibleSection id="projects" title="Projects" openSections={openSections} toggleSection={toggleSection}
        badge={cvData.projects.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'projects')}>
          <SortableContext items={cvData.projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {cvData.projects.map(proj => (
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
                <div className="form-group">
                  <label>Project URL (optional)</label>
                  <input
                    type="text" value={proj.url || ''}
                    onChange={e => handleArrayChange('projects', proj.id, 'url', e.target.value)}
                    onBlur={e => isValidUrl(e.target.value) ? clearError(`proj-url-${proj.id}`) : setError(`proj-url-${proj.id}`, 'Looks like an invalid URL')}
                    placeholder="github.com/user/project"
                    className={validationErrors[`proj-url-${proj.id}`] ? 'input-error' : ''}
                  />
                  {validationErrors[`proj-url-${proj.id}`] && <span className="validation-hint">⚠️ {validationErrors[`proj-url-${proj.id}`]}</span>}
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label>Description</label>
                    {onAIRequest && (
                      <button type="button" className="btn-ai btn-ai-sm"
                        onClick={() => onAIRequest('bullet', proj.id, proj.description)}
                        title="Enhance with AI">
                        <Sparkles size={12} /> Enhance
                      </button>
                    )}
                  </div>
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
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('projects', { name: '', tech: '', url: '', description: '' })}>+ Add Project</button>
      </CollapsibleSection>

      {/* ---- Skills ---- */}
      <CollapsibleSection id="skills" title="Skills" openSections={openSections} toggleSection={toggleSection}
        badge={skills.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'skills')}>
          <SortableContext items={skills.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {skills.map(skill => (
              <SortableItem key={skill.id} id={skill.id} isHidden={skill.hidden}>
                {renderArrayControls('skills', skill.id, skill.hidden)}
                <div className="form-row">
                  <div className="form-group" style={{ flex: '0 0 28%' }}>
                    <label>Category</label>
                    <input type="text" value={skill.category || ''} onChange={e => handleArrayChange('skills', skill.id, 'category', e.target.value)} placeholder="Languages" />
                  </div>
                  <div className="form-group" style={{ flex: '1' }}>
                    <label>Skills (comma separated)</label>
                    <input type="text" value={skill.items || ''} onChange={e => handleArrayChange('skills', skill.id, 'items', e.target.value)} placeholder="React, Node.js" />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 80px' }}>
                    <label>Level</label>
                    <select value={skill.level ?? 3} onChange={e => handleArrayChange('skills', skill.id, 'level', Number(e.target.value))}>
                      <option value={1}>★☆☆☆☆</option>
                      <option value={2}>★★☆☆☆</option>
                      <option value={3}>★★★☆☆</option>
                      <option value={4}>★★★★☆</option>
                      <option value={5}>★★★★★</option>
                    </select>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('skills', { category: '', items: '', level: 3 })}>+ Add Skill Category</button>
      </CollapsibleSection>

      {/* ---- Certifications ---- */}
      <CollapsibleSection id="certifications" title="Certifications" openSections={openSections} toggleSection={toggleSection}
        badge={certifications.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'certifications')}>
          <SortableContext items={certifications.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {certifications.map(cert => (
              <SortableItem key={cert.id} id={cert.id} isHidden={cert.hidden}>
                {renderArrayControls('certifications', cert.id, cert.hidden)}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Certification Name</label>
                    <input type="text" value={cert.name || ''} onChange={e => handleArrayChange('certifications', cert.id, 'name', e.target.value)} placeholder="AWS Certified Developer" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Issuing Organization</label>
                    <input type="text" value={cert.issuer || ''} onChange={e => handleArrayChange('certifications', cert.id, 'issuer', e.target.value)} placeholder="Amazon Web Services" />
                  </div>
                </div>
                <div className="form-group" style={{ flex: '0 0 120px' }}>
                  <label>Date Issued</label>
                  <input type="text" value={cert.date || ''} onChange={e => handleArrayChange('certifications', cert.id, 'date', e.target.value)} placeholder="Mar 2024" />
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        {certifications.length === 0 && <div className="section-empty">No certifications added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('certifications', { name: '', issuer: '', date: '' })}>+ Add Certification</button>
      </CollapsibleSection>

      {/* ---- Languages ---- */}
      <CollapsibleSection id="languages" title="Languages" openSections={openSections} toggleSection={toggleSection}
        badge={languages.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'languages')}>
          <SortableContext items={languages.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {languages.map(lang => (
              <SortableItem key={lang.id} id={lang.id} isHidden={lang.hidden}>
                {renderArrayControls('languages', lang.id, lang.hidden)}
                <div className="form-row">
                  <div className="form-group">
                    <label>Language</label>
                    <input type="text" value={lang.language || ''} onChange={e => handleArrayChange('languages', lang.id, 'language', e.target.value)} placeholder="English" />
                  </div>
                  <div className="form-group">
                    <label>Proficiency</label>
                    <select value={lang.proficiency || 'Fluent'} onChange={e => handleArrayChange('languages', lang.id, 'proficiency', e.target.value)}>
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        {languages.length === 0 && <div className="section-empty">No languages added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('languages', { language: '', proficiency: 'Fluent' })}>+ Add Language</button>
      </CollapsibleSection>

      {/* ---- Awards & Honors ---- */}
      <CollapsibleSection id="awards" title="Awards & Honors" openSections={openSections} toggleSection={toggleSection}
        badge={awards.length || undefined}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'awards')}>
          <SortableContext items={awards.map(a => a.id)} strategy={verticalListSortingStrategy}>
            {awards.map(award => (
              <SortableItem key={award.id} id={award.id} isHidden={award.hidden}>
                {renderArrayControls('awards', award.id, award.hidden)}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Award Title</label>
                    <input type="text" value={award.title || ''} onChange={e => handleArrayChange('awards', award.id, 'title', e.target.value)} placeholder="Dean's List" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Issuer</label>
                    <input type="text" value={award.issuer || ''} onChange={e => handleArrayChange('awards', award.id, 'issuer', e.target.value)} placeholder="University Name" />
                  </div>
                  <div className="form-group" style={{ flex: '0 0 80px' }}>
                    <label>Year</label>
                    <input type="text" value={award.year || ''} onChange={e => handleArrayChange('awards', award.id, 'year', e.target.value)} placeholder="2024" />
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
        {awards.length === 0 && <div className="section-empty">No awards added yet.</div>}
        <button className="btn btn-secondary w-100" onClick={() => addArrayItem('awards', { title: '', issuer: '', year: '' })}>+ Add Award</button>
      </CollapsibleSection>

      {/* ---- Custom Sections ---- */}
      {customSections.map(sec => (
        <CollapsibleSection key={sec.id} id={`custom-${sec.id}`} title={sec.name || 'Custom Section'}
          openSections={openSections} toggleSection={toggleSection}>
          <div className="form-group">
            <label>Section Title</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={sec.name || ''} onChange={e => handleArrayChange('customSections', sec.id, 'name', e.target.value)} placeholder="e.g. Publications" style={{ flex: 1 }} />
              <button type="button" className="btn-remove" style={{ padding: '0 12px' }}
                onClick={() => { if (window.confirm('Delete this custom section?')) removeArrayItem('customSections', sec.id); }}>×</button>
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <label>Content</label>
            <RichTextEditor
              value={sec.content || ''}
              onChange={(val) => handleArrayChange('customSections', sec.id, 'content', val)}
              placeholder="Write the content of this section..."
            />
          </div>
        </CollapsibleSection>
      ))}
      <button className="btn btn-secondary w-100"
        style={{ marginTop: '8px', borderStyle: 'dashed', opacity: 0.8 }}
        onClick={() => {
          const name = window.prompt('Section name:', 'Publications');
          if (name?.trim()) addArrayItem('customSections', { name: name.trim(), content: '' });
        }}>
        + Add Custom Section
      </button>
    </div>
  );
};

export default CVForm;
