import { useState } from 'react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';

function App() {
  const [cvData, setCvData] = useState({
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
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      <header className="app-header no-print">
        <div className="logo">
          <span className="accent">AI</span>/SE CV Generator
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Export PDF
        </button>
      </header>

      <main className="main-content">
        <section className="form-section no-print">
          <CVForm cvData={cvData} setCvData={setCvData} />
        </section>
        <section className="preview-section">
          <CVPreview cvData={cvData} />
        </section>
      </main>
    </div>
  );
}

export default App;
