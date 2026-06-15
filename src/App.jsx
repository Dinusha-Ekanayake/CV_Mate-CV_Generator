import { useState, useEffect, useRef } from 'react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import ATSAnalyzer from './components/ATSAnalyzer';

const initialData = {
  personal: {
    name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', photo: null,
  },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: { languages: '', frameworks: '', tools: '' }
};

const sampleData = {
  personal: {
    name: 'Alan Turing', title: 'AI Software Engineer', email: 'alan@example.com', phone: '+1 234 567 8900',
    linkedin: 'linkedin.com/in/alanturing', github: 'github.com/alanturing', portfolio: 'alanturing.dev', photo: null,
  },
  summary: 'Passionate Artificial Intelligence undergraduate with a strong foundation in machine learning, deep neural networks, and scalable software engineering. Proven ability to build intelligent systems and optimize complex algorithms.',
  education: [
    { id: 'edu-1', institution: 'University of Moratuwa', degree: 'BSc. (Hons) in Artificial Intelligence', dates: 'Sep 2020 - May 2024', gpa: '3.8 / 4.0' }
  ],
  experience: [
    { id: 'exp-1', company: 'TechNova Solutions', role: 'Machine Learning Intern', dates: 'Jun 2023 - Aug 2023', description: '- Engineered a computer vision pipeline using **PyTorch** that improved defect detection accuracy by 18%.\n- Deployed models to AWS SageMaker and created a REST API with FastAPI.' }
  ],
  projects: [
    { id: 'proj-1', name: 'Neural Network Visualizer', tech: 'React, D3.js, TensorFlow.js', description: '- Developed an interactive web application that allows users to build and visualize neural networks directly in the browser.\n- See it live at [nn-viz.dev](https://example.com)' }
  ],
  skills: {
    languages: 'Python, JavaScript (ES6+), C++, SQL',
    frameworks: 'PyTorch, TensorFlow, React, Node.js',
    tools: 'Git, Docker, AWS (EC2, S3), Linux',
  }
};

const defaultSectionOrder = ['summary', 'education', 'experience', 'projects', 'skills'];

function App() {
  const [cvData, setCvData] = useState(() => {
    try {
      const saved = localStorage.getItem('cvData');
      return saved ? JSON.parse(saved) : initialData;
    } catch { return initialData; }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cvSettings');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        layout: parsed.layout || 'single',
        themeColor: parsed.themeColor || '#0f172a',
        fontFamily: parsed.fontFamily || "'Inter', sans-serif",
        sectionOrder: parsed.sectionOrder || defaultSectionOrder,
        skillStyle: parsed.skillStyle || 'classic'
      };
    } catch {
      return { layout: 'single', themeColor: '#0f172a', fontFamily: "'Inter', sans-serif", sectionOrder: defaultSectionOrder, skillStyle: 'classic' };
    }
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('cvData', JSON.stringify(cvData));
    } catch (error) {
      console.error("Local storage error:", error);
      alert("Failed to save CV data to local storage. You may have exceeded the storage quota (e.g., image too large).");
    }
  }, [cvData]);

  useEffect(() => {
    try {
      localStorage.setItem('cvSettings', JSON.stringify(settings));
    } catch (error) {
      console.error("Local storage error:", error);
    }
  }, [settings]);

  const handlePrint = () => window.print();

  const loadSample = () => setCvData(sampleData);
  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data?")) setCvData(initialData);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'my_cv_data.json';
    link.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setCvData(parsed);
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const moveSection = (index, direction) => {
    setSettings(prev => {
      const newOrder = [...prev.sectionOrder];
      if (direction === 'up' && index > 0) {
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      } else if (direction === 'down' && index < newOrder.length - 1) {
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
      }
      return { ...prev, sectionOrder: newOrder };
    });
  };

  const handleAutoFit = () => {
    const container = document.querySelector('.cv-preview-container');
    if (!container) return;
    
    container.style.zoom = '1';
    
    setTimeout(() => {
      const MAX_HEIGHT = 1120; // Approx 297mm at 96dpi
      let zoomLevel = 1.0;
      
      while (container.scrollHeight > MAX_HEIGHT && zoomLevel > 0.5) {
        zoomLevel -= 0.02;
        container.style.zoom = zoomLevel.toString();
      }
    }, 50);
  };

  return (
    <div className="app-container">
      <header className="app-header no-print">
        <div className="logo" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <img src="/logo.png" alt="CV Mate Logo" style={{width: '32px', height: '32px', borderRadius: '6px'}} />
          <span>CV <span className="accent">Mate</span> - CV Generator</span>
        </div>
        <div className="header-actions">
          <input type="file" accept=".json" style={{display: 'none'}} ref={fileInputRef} onChange={handleImport} />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()} style={{marginRight: '10px'}}>Import JSON</button>
          <button className="btn btn-secondary" onClick={handleExport} style={{marginRight: '10px'}}>Export JSON</button>
          <button className="btn btn-secondary" onClick={clearForm} style={{marginRight: '10px'}}>Clear</button>
          <button className="btn btn-secondary" onClick={loadSample} style={{marginRight: '10px'}}>Load Sample</button>
          <button className="btn btn-secondary" onClick={handleAutoFit} style={{marginRight: '10px'}}>✨ Auto-Fit</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            Export PDF
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="form-section no-print">
          <ATSAnalyzer cvData={cvData} />
          <div className="settings-panel glass-panel" style={{marginBottom: '2rem'}}>
            <h2 className="section-title" style={{marginTop: 0, marginBottom: '1rem'}}>CV Settings & Layout</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Layout Style</label>
                <select value={settings.layout} onChange={e => setSettings({...settings, layout: e.target.value})}>
                  <option value="single">Single Column</option>
                  <option value="two-column">Two Column</option>
                  <option value="executive">Executive (Classic)</option>
                  <option value="creative">Creative (Timeline)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Accent Color</label>
                <select value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})}>
                  <option value="#0f172a">Classic Slate</option>
                  <option value="#0ea5e9">Ocean Blue</option>
                  <option value="#10b981">Emerald Green</option>
                  <option value="#8b5cf6">Royal Purple</option>
                  <option value="#f43f5e">Rose Red</option>
                </select>
              </div>
              <div className="form-group">
                <label>Typography</label>
                <select value={settings.fontFamily} onChange={e => setSettings({...settings, fontFamily: e.target.value})}>
                  <option value="'Inter', sans-serif">Modern Sans (Inter)</option>
                  <option value="'Georgia', serif">Classic Serif (Georgia)</option>
                  <option value="'Courier New', monospace">Code (Monospace)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Skill Style</label>
                <select value={settings.skillStyle} onChange={e => setSettings({...settings, skillStyle: e.target.value})}>
                  <option value="classic">Classic (Comma Separated)</option>
                  <option value="tags">Modern Tags</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{marginTop: '1rem'}}>
              <label>Section Order (Global)</label>
              <div className="section-reorder-list">
                {settings.sectionOrder.map((sec, i) => (
                  <div key={sec} className="section-reorder-item">
                    <span style={{textTransform: 'capitalize'}}>{sec}</span>
                    <div>
                      {i > 0 && <button onClick={() => moveSection(i, 'up')}>↑</button>}
                      {i < settings.sectionOrder.length - 1 && <button onClick={() => moveSection(i, 'down')}>↓</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <CVForm cvData={cvData} setCvData={setCvData} />
        </section>
        <section className="preview-section">
          <CVPreview cvData={cvData} settings={settings} />
        </section>
      </main>
    </div>
  );
}

export default App;
