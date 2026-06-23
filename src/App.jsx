import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Download, Upload, Trash2, Wand2, Maximize, Printer, Cloud, Undo2, Redo2, FileDown, FileText, Archive, BrainCircuit, Search } from 'lucide-react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import ProfileSwitcher from './components/ProfileSwitcher';
import SettingsPanel from './components/SettingsPanel';
import CompletionBar from './components/CompletionBar';
import AutosaveIndicator from './components/AutosaveIndicator';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { OnboardingGate } from './components/OnboardingWizard';
import './components/OnboardingWizard.css';
import './components/AIPanel.css';

const CoverLetterForm = lazy(() => import('./components/CoverLetterForm'));
const CoverLetterPreview = lazy(() => import('./components/CoverLetterPreview'));
const ATSAnalyzer = lazy(() => import('./components/ATSAnalyzer'));
const JDMatcherModal = lazy(() => import('./components/AIPanel').then(m => ({ default: m.JDMatcherModal })));

import UpdateToast from './components/UpdateToast';
import { useProfiles, normalizeProfilesState } from './hooks/useProfiles';
import { useHistory } from './hooks/useHistory';
import { sampleData, hydrateData } from './data/cvDefaults';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [cloudReady, setCloudReady] = useState(false);
  const [showJDMatcher, setShowJDMatcher] = useState(false);
  const [mobileView, setMobileView] = useState('form'); // 'form' | 'preview'
  const [formWidth, setFormWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

  const {
    profiles, activeProfileId, cvData, settings,
    setCvData, setSettings, selectProfile, addProfile,
    duplicateProfile, renameProfile, deleteProfile, replaceAll, profilesState
  } = useProfiles();

  const fileInputRef = useRef(null);

  const { undo, redo, canUndo, canRedo } = useHistory({
    cvData, settings, setCvData, setSettings, key: activeProfileId
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setCloudReady(false);
        setIsSyncing(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const normalized = normalizeProfilesState(docSnap.data());
            if (normalized) replaceAll(normalized);
          }
        } catch (error) {
          console.error('Failed to load from cloud:', error);
        }
        setIsSyncing(false);
        setCloudReady(true);
      } else {
        setCloudReady(false);
      }
    });
    return () => unsubscribe();
  }, [replaceAll]);

  // Cloud sync
  useEffect(() => {
    if (!currentUser || !cloudReady) return;
    const timeout = setTimeout(() => {
      setIsSyncing(true);
      let payload = profilesState;
      if (JSON.stringify(profilesState).length > 900_000) {
        payload = {
          ...profilesState,
          profiles: profilesState.profiles.map(p => ({
            ...p,
            cvData: { ...p.cvData, personal: { ...p.cvData.personal, photo: null } }
          }))
        };
      }
      setDoc(doc(db, 'users', currentUser.uid), payload, { merge: false })
        .then(() => setIsSyncing(false))
        .catch(e => { console.error('Cloud sync failed:', e); setIsSyncing(false); });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [profilesState, currentUser, cloudReady]);

  useEffect(() => {
    const apply = (e) => setSettings(prev => ({ ...prev, density: e.detail }));
    window.addEventListener('cv-set-density', apply);
    return () => window.removeEventListener('cv-set-density', apply);
  }, [setSettings]);

  // Resizer logic
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e) => {
      // Constrain width between 320px and 60% of viewport width
      const newWidth = Math.max(320, Math.min(e.clientX, window.innerWidth * 0.6));
      setFormWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handlePrint = () => window.print();



  const loadSample = () => setCvData(sampleData);
  const clearForm = () => {
    if (window.confirm('Clear all data in this profile?')) setCvData(hydrateData(null));
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
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
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
          throw new Error('Not a CV data object.');
        const looksLikeCV = ['personal', 'summary', 'education', 'experience', 'projects', 'skills', 'coverLetter']
          .some(key => key in parsed);
        if (!looksLikeCV) throw new Error('This file does not look like exported CV data.');
        setCvData(hydrateData(parsed));
      } catch (err) {
        alert(`Could not import file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // DOCX Export
  const handleExportDocx = async () => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
      const { personal, summary, education, experience, projects, skills, certifications, languages, awards } = cvData;

      const makeHeading = (text) => new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '334155', space: 4 } }
      });

      const makeItem = (title, sub, date, desc) => [
        new Paragraph({
          children: [
            new TextRun({ text: title, bold: true, size: 22 }),
            date ? new TextRun({ text: `   ${date}`, color: '475569', size: 20 }) : new TextRun('')
          ]
        }),
        sub && new Paragraph({ children: [new TextRun({ text: sub, italics: true, size: 20, color: '334155' })] }),
        desc && new Paragraph({ children: [new TextRun({ text: desc.replace(/<[^>]+>/g, ''), size: 20, color: '374151' })], spacing: { after: 120 } })
      ].filter(Boolean);

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Name + contact
            new Paragraph({ children: [new TextRun({ text: personal.name || 'Your Name', bold: true, size: 52 })], spacing: { after: 80 } }),
            new Paragraph({ children: [new TextRun({ text: personal.title || '', color: '334155', size: 28 })], spacing: { after: 80 } }),
            new Paragraph({
              children: [new TextRun({ text: [personal.email, personal.phone, personal.linkedin, personal.github, personal.portfolio].filter(Boolean).join(' | '), size: 18, color: '475569' })],
              spacing: { after: 200 }
            }),
            // Summary
            ...(summary ? [makeHeading('Profile'), new Paragraph({ children: [new TextRun({ text: summary.replace(/<[^>]+>/g, ''), size: 20 })], spacing: { after: 160 } })] : []),
            // Experience
            ...(experience?.length ? [makeHeading('Experience'), ...experience.filter(e => !e.hidden).flatMap(e => makeItem(e.company, e.role + (e.location ? ` · ${e.location}` : ''), e.dates, e.description))] : []),
            // Education
            ...(education?.length ? [makeHeading('Education'), ...education.filter(e => !e.hidden).flatMap(e => makeItem(e.institution, e.degree, e.dates, e.gpa ? `GPA: ${e.gpa}` : null))] : []),
            // Projects
            ...(projects?.length ? [makeHeading('Projects'), ...projects.filter(p => !p.hidden).flatMap(p => makeItem(p.name, p.tech ? `Stack: ${p.tech}` : '', '', p.description))] : []),
            // Skills
            ...(Array.isArray(skills) && skills.length ? [
              makeHeading('Skills'),
              ...skills.filter(s => !s.hidden && s.items).map(s => new Paragraph({ children: [new TextRun({ text: `${s.category}: `, bold: true, size: 20 }), new TextRun({ text: s.items, size: 20 })], spacing: { after: 80 } }))
            ] : []),
            // Certifications
            ...(certifications?.length ? [makeHeading('Certifications'), ...certifications.filter(c => !c.hidden).flatMap(c => makeItem(c.name, c.issuer, c.date))] : []),
            // Languages
            ...(languages?.length ? [
              makeHeading('Languages'),
              new Paragraph({ children: languages.filter(l => !l.hidden).map(l => new TextRun({ text: `${l.language} (${l.proficiency})   `, size: 20 })) })
            ] : []),
            // Awards
            ...(awards?.length ? [makeHeading('Awards & Honors'), ...awards.filter(a => !a.hidden).flatMap(a => makeItem(a.title, a.issuer, a.year))] : []),
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const name = (personal.name || 'My_CV').trim().replace(/\s+/g, '_');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${name}.docx`;
      link.click();
    } catch (e) {
      console.error('DOCX export failed:', e);
      alert('DOCX export failed. Please try again.');
    }
  };

  // ZIP Export (all profiles)
  const handleExportZip = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      profiles.forEach(p => {
        zip.file(`${p.name.replace(/\s+/g, '_')}.json`, JSON.stringify(p.cvData, null, 2));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'CV_Mate_Profiles.zip';
      link.click();
    } catch (e) {
      console.error('ZIP export failed:', e);
      alert('ZIP export failed.');
    }
  };

  const moveSection = (index, direction) => {
    setSettings(prev => {
      const newOrder = [...prev.sectionOrder];
      if (direction === 'up' && index > 0)
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      else if (direction === 'down' && index < newOrder.length - 1)
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
      return { ...prev, sectionOrder: newOrder };
    });
  };

  const handleAutoFit = () => window.dispatchEvent(new CustomEvent('cv-auto-fit'));
  const togglePageBreak = (section) => {
    setSettings(prev => {
      const current = Array.isArray(prev.pageBreaks) ? prev.pageBreaks : [];
      const next = current.includes(section) ? current.filter(s => s !== section) : [...current, section];
      return { ...prev, pageBreaks: next };
    });
  };
  const handleFitOnePage = () => window.dispatchEvent(new CustomEvent('cv-fit-one-page'));

  // AI request handler from CVForm
  const handleAIRequest = async (type, itemId, currentText) => {
    if (type === 'summary') {
      try {
        const { AISummaryButton } = await import('./components/AIPanel');
        // Trigger via DOM event since AISummaryButton is self-contained
      } catch (e) { /* handled by button */ }
    }
    if (type === 'bullet' && itemId && currentText) {
      try {
        const { AIBulletButton } = await import('./components/AIPanel');
      } catch (e) { /* handled */ }
    }
  };

  return (
    <OnboardingGate>
      <div className="app-container">
        <header className="app-header no-print">
          <div className="logo-container">
            <img src="/logo.png" alt="CV Mate Logo" className="logo-img" />
            <div className="logo-text-wrapper">
              <span className="logo-text">CV <span className="accent">Mate</span></span>
              <span className="app-subtitle">Elite Edition</span>
            </div>
          </div>

          <div className="app-controls">
            <ProfileSwitcher
              profiles={profiles} activeProfileId={activeProfileId}
              onSelect={selectProfile} onAdd={addProfile}
              onRename={renameProfile} onDuplicate={duplicateProfile} onDelete={deleteProfile}
            />

            {/* Auth Group */}
            <div className="auth-group glass-pill">
              {currentUser ? (
                <>
                  <div className="auth-user-info">
                    {isSyncing ? <Cloud size={14} className="sync-pulse" color="#06b6d4" /> : <Cloud size={14} color="#10b981" />}
                    <span className="auth-email">
                      {(currentUser.email || currentUser.displayName || 'Account').split('@')[0]}
                    </span>
                  </div>
                  <AutosaveIndicator profilesState={profilesState} />
                  <div className="divider-vertical" />
                  <button onClick={() => signOut(auth)} className="btn-signout">Sign Out</button>
                </>
              ) : (
                <button onClick={() => signInWithPopup(auth, provider)} className="btn-signin">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
                  Sign in
                </button>
              )}
            </div>

            {/* Actions group */}
            <div className="actions-group glass-panel-sm">
              <button onClick={loadSample} className="action-btn" title="Load Sample Data (shows all features)">
                <Wand2 size={14} color="#a855f7" className="btn-icon" /> <span>Sample</span>
              </button>
              <button onClick={() => fileInputRef.current.click()} className="action-btn" title="Import JSON">
                <Upload size={14} color="#3b82f6" className="btn-icon" /> <span>Import</span>
              </button>
              <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
              <button onClick={handleExport} className="action-btn" title="Export JSON (Ctrl+E)">
                <Download size={14} color="#3b82f6" className="btn-icon" /> <span>Export</span>
              </button>
              <button onClick={handleExportDocx} className="action-btn" title="Export as Word DOCX (Ctrl+W)">
                <FileText size={14} color="#06b6d4" className="btn-icon" /> <span>DOCX</span>
              </button>
              <button onClick={handleExportZip} className="action-btn" title="Export all profiles as ZIP">
                <Archive size={14} color="#f59e0b" className="btn-icon" /> <span>ZIP</span>
              </button>
              <button onClick={clearForm} className="action-btn action-btn-danger" title="Clear All Data">
                <Trash2 size={14} className="btn-icon" /> <span>Clear</span>
              </button>
            </div>

            {/* Primary group */}
            <div className="primary-group">
              <div className="undo-redo-group glass-panel-sm">
                <button onClick={undo} disabled={!canUndo} className="action-btn icon-only" title="Undo (Ctrl+Z)">
                  <Undo2 size={15} />
                </button>
                <button onClick={redo} disabled={!canRedo} className="action-btn icon-only" title="Redo (Ctrl+Shift+Z)">
                  <Redo2 size={15} />
                </button>
              </div>
              {activeTab === 'resume' && (
                <button onClick={() => setShowJDMatcher(true)} className="btn btn-secondary btn-sm" title="Job Description Matcher (AI)">
                  <Search size={14} /> JD Match
                </button>
              )}
              <button onClick={handleAutoFit} className="btn btn-secondary btn-sm">
                <Maximize size={14} /> Auto-Fit
              </button>
              {activeTab === 'resume' && (
                <button onClick={handleFitOnePage} className="btn btn-secondary btn-sm" title="Auto-adjust density to fit one A4 page">
                  <FileDown size={14} /> Fit 1 Page
                </button>
              )}

              <button onClick={handlePrint} className="btn btn-primary btn-sm print-btn" title="Print / PDF (Ctrl+P)">
                <Printer size={16} /> Print / PDF
              </button>
            </div>
          </div>
        </header>

        {/* Mobile View Switcher */}
        <div className="mobile-view-toggle no-print">
          <button className={`mobile-tab ${mobileView === 'form' ? 'active' : ''}`} onClick={() => setMobileView('form')}>✏️ Edit</button>
          <button className={`mobile-tab ${mobileView === 'preview' ? 'active' : ''}`} onClick={() => setMobileView('preview')}>👁️ Preview</button>
        </div>

        <main className="main-content">
          <section 
            className={`form-section no-print ${mobileView === 'preview' ? 'mobile-hidden' : ''}`}
            style={{ width: `${formWidth}px` }}
          >
            {/* Doc Type Toggle */}
            <div className="doc-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '12px', background: 'rgba(15,23,42,0.4)', padding: '6px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="action-btn" onClick={() => setActiveTab('resume')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'resume' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'resume' ? '#60a5fa' : '#94a3b8', fontWeight: activeTab === 'resume' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                📄 Resume / CV
              </button>
              <button className="action-btn" onClick={() => setActiveTab('cover-letter')}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'cover-letter' ? 'rgba(59,130,246,0.2)' : 'transparent', color: activeTab === 'cover-letter' ? '#60a5fa' : '#94a3b8', fontWeight: activeTab === 'cover-letter' ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}>
                💌 Cover Letter
              </button>
            </div>

            {activeTab === 'resume' && <CompletionBar cvData={cvData} />}

            {activeTab === 'resume' && (
              <Suspense fallback={null}>
                <ATSAnalyzer cvData={cvData} />
              </Suspense>
            )}

            <SettingsPanel
              settings={settings} setSettings={setSettings}
              activeTab={activeTab} sectionOrder={settings.sectionOrder}
              onMoveSection={moveSection} onTogglePageBreak={togglePageBreak}
            />

            {activeTab === 'resume' ? (
              <CVForm cvData={cvData} setCvData={setCvData} onAIRequest={handleAIRequest} />
            ) : (
              <Suspense fallback={<div className="lazy-fallback">Loading…</div>}>
                <CoverLetterForm cvData={cvData} setCvData={setCvData} />
              </Suspense>
            )}

            <footer className="app-credit no-print">
              Developed by <span className="app-credit-name">© Dinusha Ekanayake</span>
              <span style={{ marginLeft: '10px', color: '#475569', fontSize: '0.72rem' }}>Press ? for shortcuts</span>
            </footer>
          </section>

          <div 
            className={`resizer no-print ${mobileView !== 'form' && mobileView !== 'preview' ? '' : 'mobile-hidden'} ${isResizing ? 'active' : ''}`}
            onMouseDown={() => setIsResizing(true)}
          />

          <section className={`preview-section ${mobileView === 'form' ? 'mobile-hidden' : ''}`}>
            {activeTab === 'resume' ? (
              <CVPreview cvData={cvData} settings={settings} />
            ) : (
              <Suspense fallback={<div className="lazy-fallback">Loading…</div>}>
                <CoverLetterPreview cvData={cvData} settings={settings} />
              </Suspense>
            )}
          </section>
        </main>

        {/* JD Matcher Modal */}
        {showJDMatcher && (
          <Suspense fallback={null}>
            <JDMatcherModal cvData={cvData} onClose={() => setShowJDMatcher(false)} />
          </Suspense>
        )}

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          onUndo={undo} onRedo={redo}
          onPrint={handlePrint} onExport={handleExport}
          onDocx={handleExportDocx}
        />

        <UpdateToast />
      </div>
    </OnboardingGate>
  );
}

export default App;
