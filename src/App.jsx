import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Trash2, Wand2, Maximize, Printer, Cloud, CloudOff } from 'lucide-react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import CoverLetterForm from './components/CoverLetterForm';
import CoverLetterPreview from './components/CoverLetterPreview';
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
  skills: { languages: '', frameworks: '', tools: '' },
  coverLetter: {
    recipientName: 'Hiring Manager',
    companyName: 'Tech Innovators Inc.',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    body: 'I am writing to express my strong interest in the open position at your company. With my background in software engineering and passion for building scalable applications, I believe I would be a great fit for your team.<br><br>In my previous roles, I have successfully delivered high-impact projects while maintaining a focus on clean, maintainable code. I am particularly drawn to your company\'s mission and the innovative work your team is doing.<br><br>Thank you for considering my application. I look forward to the possibility of discussing this exciting opportunity with you.'
  }
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
    { id: 'proj-2', name: 'Resume Builder', tech: 'React, Firebase, Electron', description: '<ul><li>Built a cross-platform desktop & web resume builder.</li><li>Implemented drag-and-drop components and real-time PDF generation.</li></ul>' }
  ],
  skills: {
    languages: 'Python, JavaScript, TypeScript, Java, C++',
    frameworks: 'React, Node.js, PyTorch, TensorFlow, Next.js',
    tools: 'Git, Docker, AWS, Firebase, MongoDB'
  },
  coverLetter: {
    recipientName: 'Sarah Jenkins, Head of Engineering',
    companyName: 'OpenAI',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    body: 'Dear Sarah,<br><br>I am writing to express my profound interest in the AI Software Engineer position at OpenAI. As a passionate developer with a deep background in machine learning and scalable web infrastructure, I have followed OpenAI’s breakthroughs closely and am inspired by your mission to ensure artificial general intelligence benefits all of humanity.<br><br>During my time at University of Moratuwa and my subsequent internships, I architected neural network visualizers and deployed deep learning models that processed real-time data. My recent project, a React-based application that integrates generative AI, gave me hands-on experience dealing with latency optimizations and complex state management—challenges I know your team tackles daily.<br><br>What excites me most about this role is the opportunity to work at the bleeding edge of AI while ensuring robust, user-centric software design. I bring a blend of rigorous academic research and practical, shipping-focused software engineering.<br><br>I would welcome the opportunity to discuss how my background in both frontend engineering and AI model integration aligns with your engineering goals. Thank you for your time and consideration.<br><br>Best regards,<br>Alan Turing'
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

const hydrateData = (parsed) => {
  if (!parsed) return initialData;
  return {
    ...initialData,
    ...parsed,
    personal: { ...initialData.personal, ...(parsed.personal || {}) },
    skills: { ...initialData.skills, ...(parsed.skills || {}) },
    coverLetter: { ...initialData.coverLetter, ...(parsed.coverLetter || {}) }
  };
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');

  const [cvData, setCvData] = useState(() => {
    try {
      const saved = localStorage.getItem('cvData');
      if (saved) return hydrateData(JSON.parse(saved));
      return initialData;
    } catch { return initialData; }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cvSettings');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        layout: parsed.layout || 'single',
        themeColor: parsed.themeColor || '#0f172a', // kept for legacy fallback
        palette: parsed.palette || 'default',
        headingFont: parsed.headingFont || "'Inter', sans-serif",
        bodyFont: parsed.bodyFont || "'Inter', sans-serif",
        fontFamily: parsed.fontFamily || "'Inter', sans-serif", // kept for legacy
        sectionOrder: parsed.sectionOrder || defaultSectionOrder,
        skillStyle: parsed.skillStyle || 'classic',
        density: parsed.density || 'normal',
        darkMode: parsed.darkMode || false,
        showIcons: parsed.showIcons || false,
        photoShape: parsed.photoShape || 'circle'
      };
    } catch {
      return { 
        layout: 'single', themeColor: '#0f172a', palette: 'default',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", fontFamily: "'Inter', sans-serif", 
        sectionOrder: defaultSectionOrder, skillStyle: 'classic',
        density: 'normal', darkMode: false, showIcons: false, photoShape: 'circle'
      };
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
            if (data.cvData) setCvData(hydrateData(data.cvData));
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
        setCvData(hydrateData(parsed));
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
        <div className="logo" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <img src="/logo.png" alt="CV Mate Logo" style={{width: '32px', height: '32px', borderRadius: '6px'}} />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CV <span className="accent">Mate</span></span>
            <span className="app-subtitle" style={{ display: 'block', fontSize: '0.8rem', color: '#10b981', marginTop: '-4px' }}>Elite Edition</span>
          </div>
        </div>
        <div className="app-controls" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {/* Auth Group */}
          <div className="auth-group" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(15, 23, 42, 0.4)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
            {currentUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSyncing ? <Cloud size={14} className="sync-pulse" color="#06b6d4" /> : <Cloud size={14} color="#10b981" />}
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                    {currentUser.email.split('@')[0]}
                  </span>
                </div>
                <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }}></div>
                <button onClick={() => signOut(auth)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: 'none', color: '#ef4444' }}>Sign Out</button>
              </>
            ) : (
              <button onClick={() => signInWithPopup(auth, provider)} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none' }}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{ width: '14px' }} />
                Sign in
              </button>
            )}
          </div>

          {/* MacOS Style Segmented Action Bar */}
          <div className="actions-group" style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
            <button onClick={loadSample} className="action-btn" title="Load Sample Data" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', borderRight: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}>
              <Wand2 size={14} color="#a855f7" /> Sample
            </button>
            
            <button onClick={() => fileInputRef.current.click()} className="action-btn" title="Import JSON" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', borderRight: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}>
              <Upload size={14} color="#3b82f6" /> Import
            </button>
            <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
            
            <button onClick={handleExport} className="action-btn" title="Export JSON" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '0.85rem', borderRight: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.2s' }}>
              <Download size={14} color="#3b82f6" /> Export
            </button>
            
            <button onClick={clearForm} className="action-btn" title="Clear All Data" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}>
              <Trash2 size={14} /> Clear
            </button>
          </div>

          {/* Primary Group */}
          <div className="primary-group" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAutoFit} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}>
              <Maximize size={14} /> Auto-Fit
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '0.85rem' }}>
              <Printer size={16} /> Print / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="form-section no-print">
          
          {/* Document Type Toggle */}
          <div className="doc-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(15,23,42,0.4)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button 
              className="action-btn"
              onClick={() => setActiveTab('resume')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'resume' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'resume' ? '#60a5fa' : '#94a3b8', fontWeight: activeTab === 'resume' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              📄 Resume / CV
            </button>
            <button 
              className="action-btn"
              onClick={() => setActiveTab('cover-letter')}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'cover-letter' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'cover-letter' ? '#60a5fa' : '#94a3b8', fontWeight: activeTab === 'cover-letter' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              💌 Cover Letter
            </button>
          </div>

          {activeTab === 'resume' && <ATSAnalyzer cvData={cvData} />}

          <div className="settings-panel glass-panel" style={{marginBottom: '2rem'}}>
            <h2 className="section-title" style={{marginTop: 0, marginBottom: '1rem'}}>Document Settings & Layout</h2>
            <div className="settings-grid">
              {activeTab === 'resume' && (
                <div className="form-group">
                  <label>Layout Style</label>
                  <select value={settings.layout} onChange={e => setSettings({...settings, layout: e.target.value})}>
                    <option value="single">Single Column</option>
                    <option value="two-column">Two Column</option>
                    <option value="executive">Executive (Classic)</option>
                    <option value="creative">Creative (Timeline)</option>
                  </select>
                </div>
              )}
              {/* Option 4: Color Palettes */}
              <div className="form-group">
                <label>Theme Color Palette</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { id: 'default', color: '#3b82f6', bg: '#0f172a', name: 'Slate Blue' },
                    { id: 'midnight', color: '#fbbf24', bg: '#1e293b', name: 'Midnight Gold' },
                    { id: 'forest', color: '#10b981', bg: '#064e3b', name: 'Forest Sage' },
                    { id: 'cyberpunk', color: '#06b6d4', bg: '#2e1065', name: 'Cyberpunk Neon' },
                    { id: 'crimson', color: '#e11d48', bg: '#1c1917', name: 'Crimson Ash' }
                  ].map(pal => (
                    <button 
                      key={pal.id}
                      onClick={() => setSettings({...settings, palette: pal.id, themeColor: pal.color})}
                      title={pal.name}
                      style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${pal.bg} 50%, ${pal.color} 50%)`,
                        border: settings.palette === pal.id ? '2px solid white' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: settings.palette === pal.id ? `0 0 0 2px ${pal.color}` : 'none'
                      }}
                    />
                  ))}
                  <input type="color" title="Custom Color" value={settings.themeColor} onChange={e => setSettings({...settings, palette: 'custom', themeColor: e.target.value})} style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
                </div>
              </div>

              {/* Option 1: Advanced Typography */}
              <div className="form-group">
                <label>Heading Font</label>
                <select value={settings.headingFont} onChange={e => setSettings({...settings, headingFont: e.target.value})}>
                  <option value="'Inter', sans-serif">Modern Sans (Inter)</option>
                  <option value="'Playfair Display', serif">Classic Serif (Playfair)</option>
                  <option value="'Space Grotesk', sans-serif">Tech (Space Grotesk)</option>
                  <option value="'Georgia', serif">Formal Serif (Georgia)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Body Font</label>
                <select value={settings.bodyFont} onChange={e => setSettings({...settings, bodyFont: e.target.value})}>
                  <option value="'Inter', sans-serif">Modern Sans (Inter)</option>
                  <option value="'Lato', sans-serif">Clean Sans (Lato)</option>
                  <option value="'Merriweather', serif">Formal Serif (Merriweather)</option>
                </select>
              </div>

              {/* Option 2: Density Slider */}
              <div className="form-group">
                <label>Document Density</label>
                <select value={settings.density} onChange={e => setSettings({...settings, density: e.target.value})}>
                  <option value="compact">Compact (Fit more per page)</option>
                  <option value="normal">Standard (Balanced)</option>
                  <option value="spacious">Spacious (Airy & Elegant)</option>
                </select>
              </div>

              {/* Option 3: Dark Mode */}
              <div className="form-group">
                <label>Document Mode</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setSettings({...settings, darkMode: false})} style={{ flex: 1, padding: '8px', background: !settings.darkMode ? '#e2e8f0' : 'transparent', color: !settings.darkMode ? '#0f172a' : '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>☀️ Light</button>
                  <button onClick={() => setSettings({...settings, darkMode: true})} style={{ flex: 1, padding: '8px', background: settings.darkMode ? '#1e293b' : 'transparent', color: settings.darkMode ? '#f8fafc' : '#94a3b8', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>🌙 Dark</button>
                </div>
              </div>

              {activeTab === 'resume' && (
                <>
                  {/* Option 5: Section Icons */}
                  <div className="form-group">
                    <label>Section Icons</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '36px' }}>
                      <input type="checkbox" id="showIcons" checked={settings.showIcons} onChange={e => setSettings({...settings, showIcons: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor="showIcons" style={{ margin: 0, cursor: 'pointer', display: 'inline', width: 'auto' }}>Show premium icons</label>
                    </div>
                  </div>
                  
                  {/* Option 5: Photo Shapes */}
                  <div className="form-group">
                    <label>Profile Photo Shape</label>
                    <select value={settings.photoShape} onChange={e => setSettings({...settings, photoShape: e.target.value})}>
                      <option value="circle">Circle</option>
                      <option value="rounded">Rounded Square</option>
                      <option value="square">Square</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Skill Style</label>
                    <select value={settings.skillStyle} onChange={e => setSettings({...settings, skillStyle: e.target.value})}>
                      <option value="classic">Classic (Comma Separated)</option>
                      <option value="tags">Modern Tags</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            
            {activeTab === 'resume' && (
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
            )}
          </div>
          {activeTab === 'resume' ? (
            <CVForm cvData={cvData} setCvData={setCvData} />
          ) : (
            <CoverLetterForm cvData={cvData} setCvData={setCvData} />
          )}
        </section>
        <section className="preview-section">
          {activeTab === 'resume' ? (
            <CVPreview cvData={cvData} settings={settings} />
          ) : (
            <CoverLetterPreview cvData={cvData} settings={settings} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
