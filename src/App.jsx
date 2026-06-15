import { useState, useEffect, useRef } from 'react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import ATSAnalyzer from './components/ATSAnalyzer';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

// --- WCAG Contrast Helper Functions ---
const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const checkWCAGContrast = (hexColor) => {
  const rgb1 = hexToRgb(hexColor);
  const rgb2 = hexToRgb('#ffffff'); // Contrast against white background/text
  if (!rgb1 || !rgb2) return true; // default safe
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return ratio >= 4.5; // WCAG AA standard
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load data from Firestore on login
        setIsSyncing(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.cvData) setCvData(data.cvData);
            if (data.settings) setSettings(data.settings);
          }
        } catch (error) {
          console.error("Failed to load from cloud:", error);
        }
        setIsSyncing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save to LocalStorage & Firestore
  useEffect(() => {
    try {
      localStorage.setItem('cvData', JSON.stringify(cvData));
    } catch (error) {
      console.error("Local storage error:", error);
    }
    
    if (currentUser) {
      const timeout = setTimeout(() => {
        setIsSyncing(true);
        setDoc(doc(db, 'users', currentUser.uid), { cvData, settings }, { merge: true })
          .then(() => setIsSyncing(false))
          .catch(e => {
            console.error('Cloud sync failed:', e);
            setIsSyncing(false);
          });
      }, 1000); // Debounce cloud writes by 1 second
      return () => clearTimeout(timeout);
    }
  }, [cvData, settings, currentUser]);

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

  const hasGoodContrast = checkWCAGContrast(settings.themeColor);

  return (
    <div className="app-container">
      <header className="app-header no-print">
        <div className="app-logo">
          <div className="logo-icon">📄</div>
          <div>
            <h1>CV Mate</h1>
            <span className="app-subtitle">Elite Edition</span>
          </div>
        </div>
        <div className="app-controls">
          {currentUser ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <span style={{fontSize: '0.9rem', color: '#94a3b8'}}>
                {isSyncing ? '☁️ Syncing...' : '☁️ Cloud Synced'} | {currentUser.email}
              </span>
              <button onClick={() => signOut(auth)} className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.9rem'}}>Sign Out</button>
            </div>
          ) : (
            <button onClick={() => signInWithPopup(auth, provider)} className="btn-secondary" style={{padding: '6px 12px', fontSize: '0.9rem'}}>
              Sign in with Google
            </button>
          )}
          <button onClick={loadSample} className="btn-secondary">Load Sample</button>
          <button onClick={clearForm} className="btn-secondary danger">Clear</button>
          <button onClick={() => fileInputRef.current.click()} className="btn-secondary">Import JSON</button>
          <input type="file" accept=".json" ref={fileInputRef} style={{display: 'none'}} onChange={handleImport} />
          <button onClick={handleExport} className="btn-secondary">Export JSON</button>
          <button onClick={handleAutoFit} className="btn-secondary">✨ Auto-Fit</button>
          <button onClick={handlePrint} className="btn-primary">Print / PDF</button>
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
                <label>Theme Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})} />
                  {!hasGoodContrast && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="This color fails WCAG AA contrast standards against white text/backgrounds. It may be hard to read!">
                      ⚠️ Poor Contrast
                    </span>
                  )}
                </div>
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
