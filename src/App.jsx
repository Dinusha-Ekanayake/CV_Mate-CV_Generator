import { useState, useEffect } from 'react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';

const initialData = {
  personal: {
    name: '',
    title: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    photo: null,
  },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: {
    languages: '',
    frameworks: '',
    tools: '',
  }
};

const sampleData = {
  personal: {
    name: 'Alan Turing',
    title: 'AI Software Engineer',
    email: 'alan@example.com',
    phone: '+1 234 567 8900',
    linkedin: 'linkedin.com/in/alanturing',
    github: 'github.com/alanturing',
    portfolio: 'alanturing.dev',
    photo: null,
  },
  summary: 'Passionate Artificial Intelligence undergraduate with a strong foundation in machine learning, deep neural networks, and scalable software engineering. Proven ability to build intelligent systems and optimize complex algorithms. Seeking an internship to apply research-driven solutions to real-world products.',
  education: [
    { institution: 'University of Moratuwa', degree: 'BSc. (Hons) in Artificial Intelligence', dates: 'Sep 2020 - May 2024', gpa: 'GPA: 3.8 / 4.0' }
  ],
  experience: [
    { company: 'TechNova Solutions', role: 'Machine Learning Intern', dates: 'Jun 2023 - Aug 2023', description: '- Engineered a computer vision pipeline using PyTorch that improved defect detection accuracy by 18%.\n- Deployed models to AWS SageMaker and created a REST API with FastAPI.\n- Collaborated with senior engineers to optimize data preprocessing scripts, reducing latency by 30%.' }
  ],
  projects: [
    { name: 'Neural Network Visualizer', tech: 'React, D3.js, TensorFlow.js', description: '- Developed an interactive web application that allows users to build and visualize neural networks directly in the browser.\n- Implemented real-time training animations and gradient flow charts.' },
    { name: 'NLP Sentiment Analyzer', tech: 'Python, Hugging Face Transformers', description: '- Fine-tuned a BERT model on a custom dataset of 50,000 product reviews to achieve 92% sentiment classification accuracy.\n- Containerized the application using Docker for consistent deployment.' }
  ],
  skills: {
    languages: 'Python, JavaScript (ES6+), C++, SQL',
    frameworks: 'PyTorch, TensorFlow, React, Node.js, FastAPI',
    tools: 'Git, Docker, AWS (EC2, S3), Linux, Jupyter',
  }
};

function App() {
  const [cvData, setCvData] = useState(() => {
    const saved = localStorage.getItem('cvData');
    return saved ? JSON.parse(saved) : initialData;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cvSettings');
    return saved ? JSON.parse(saved) : {
      layout: 'single', // 'single' or 'two-column'
      themeColor: '#0f172a', // Default dark
      fontFamily: "'Inter', sans-serif"
    };
  });

  useEffect(() => {
    localStorage.setItem('cvData', JSON.stringify(cvData));
  }, [cvData]);

  useEffect(() => {
    localStorage.setItem('cvSettings', JSON.stringify(settings));
  }, [settings]);

  const handlePrint = () => {
    window.print();
  };

  const loadSample = () => setCvData(sampleData);
  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      setCvData(initialData);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header no-print">
        <div className="logo">
          <span className="accent">AI</span>/SE CV Generator
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={clearForm} style={{marginRight: '10px'}}>Clear</button>
          <button className="btn btn-secondary" onClick={loadSample} style={{marginRight: '10px'}}>Load Sample</button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Export PDF
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="form-section no-print">
          <div className="settings-panel glass-panel" style={{marginBottom: '2rem'}}>
            <h2 className="section-title" style={{marginTop: 0, marginBottom: '1rem'}}>CV Settings</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Layout Style</label>
                <select value={settings.layout} onChange={e => setSettings({...settings, layout: e.target.value})}>
                  <option value="single">Single Column</option>
                  <option value="two-column">Two Column</option>
                </select>
              </div>
              <div className="form-group">
                <label>Accent Color</label>
                <select value={settings.themeColor} onChange={e => setSettings({...settings, themeColor: e.target.value})}>
                  <option value="#0f172a">Classic Slate (Default)</option>
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
