import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  Download, Upload, Trash2, Wand2, Maximize, Printer, Cloud,
  Undo2, Redo2, FileDown, FileText, Archive, Search, Sparkles,
  Pencil, Palette, Bot, FolderDown, ChevronLeft, ChevronRight,
  FileInput, Zap, BrainCircuit, ScanSearch, FileStack,
  LogOut, LogIn
} from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './App.css';
import './components/OnboardingWizard.css';
import './components/AIPanel.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import ProfileSwitcher from './components/ProfileSwitcher';
import SettingsPanel from './components/SettingsPanel';
import CompletionBar from './components/CompletionBar';
import AutosaveIndicator from './components/AutosaveIndicator';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import UpdateToast from './components/UpdateToast';
import CVImportModal from './components/CVImportModal';
import InterviewPrepModal from './components/InterviewPrepModal';
import AIPageFitModal from './components/AIPageFitModal';
import { OnboardingGate } from './components/OnboardingWizard';
import { useProfiles, normalizeProfilesState } from './hooks/useProfiles';
import { useHistory } from './hooks/useHistory';
import { sampleData, hydrateData } from './data/cvDefaults';
import { auth, provider, db } from './firebase';

const CoverLetterForm = lazy(() => import('./components/CoverLetterForm'));
const CoverLetterPreview = lazy(() => import('./components/CoverLetterPreview'));
const ATSAnalyzer = lazy(() => import('./components/ATSAnalyzer'));
// AIPanel is already statically imported by CVForm, so import it directly here
// rather than lazy-loading (which would be ineffective anyway).
import { JDMatcherModal } from './components/AIPanel';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  const [cloudReady, setCloudReady] = useState(false);
  const [showJDMatcher, setShowJDMatcher] = useState(false);
  const [showCVImport, setShowCVImport] = useState(false);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [showPageFit, setShowPageFit] = useState(false);
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

  // AI request handler — AI buttons are self-contained in CVForm/AIPanel; this
  // hook point is kept for future orchestration (e.g. opening a modal with context).
  const handleAIRequest = (_type, _itemId, _currentText) => {};

  // Sidebar panel state: null | 'style' | 'ai' | 'export'
  const [sidePanel, setSidePanel] = useState(null);
  const togglePanel = (name) => setSidePanel(p => p === name ? null : name);

  return (
    <OnboardingGate>
      <div className="app-container">

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <header className="app-header no-print">
          <div className="header-left">
            <div className="logo-container">
              <img src="/logo.png" alt="CV Mate Logo" className="logo-img" />
              <div className="logo-text-wrapper">
                <span className="logo-text">CV <span className="accent">Mate</span></span>
              </div>
            </div>

            {/* Doc type toggle — always visible in header */}
            <div className="doc-type-toggle">
              <button
                className={`doc-tab ${activeTab === 'resume' ? 'active' : ''}`}
                onClick={() => setActiveTab('resume')}
              >
                <FileText size={13} /> Resume
              </button>
              <button
                className={`doc-tab ${activeTab === 'cover-letter' ? 'active' : ''}`}
                onClick={() => setActiveTab('cover-letter')}
              >
                <FileStack size={13} /> Cover Letter
              </button>
            </div>
          </div>

          <div className="header-center">
            <ProfileSwitcher
              profiles={profiles} activeProfileId={activeProfileId}
              onSelect={selectProfile} onAdd={addProfile}
              onRename={renameProfile} onDuplicate={duplicateProfile} onDelete={deleteProfile}
            />
          </div>

          <div className="header-right">
            {/* Cloud / auth */}
            <div className="auth-group glass-pill">
              {currentUser ? (
                <>
                  <div className="auth-user-info">
                    {isSyncing
                      ? <Cloud size={13} className="sync-pulse" color="#06b6d4" />
                      : <Cloud size={13} color="#10b981" />}
                    <span className="auth-email">
                      {(currentUser.email || currentUser.displayName || 'Account').split('@')[0]}
                    </span>
                  </div>
                  <AutosaveIndicator profilesState={profilesState} />
                  <div className="divider-vertical" />
                  <button onClick={() => signOut(auth)} className="btn-signout" title="Sign out">
                    <LogOut size={13} />
                  </button>
                </>
              ) : (
                <button onClick={() => signInWithPopup(auth, provider)} className="btn-signin">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="google-icon" />
                  Sign in
                </button>
              )}
            </div>

            {/* Undo / Redo */}
            <div className="undo-redo-group glass-panel-sm">
              <button onClick={undo} disabled={!canUndo} className="hdr-icon-btn" title="Undo (Ctrl+Z)">
                <Undo2 size={15} />
              </button>
              <button onClick={redo} disabled={!canRedo} className="hdr-icon-btn" title="Redo (Ctrl+Shift+Z)">
                <Redo2 size={15} />
              </button>
            </div>

            {/* Auto-fit zoom */}
            <button onClick={handleAutoFit} className="hdr-icon-btn glass-panel-sm" title="Auto-fit zoom">
              <Maximize size={15} />
            </button>

            {/* Print — always prominent */}
            <button onClick={handlePrint} className="btn-print" title="Print / Save as PDF (Ctrl+P)">
              <Printer size={15} /> Print / PDF
            </button>
          </div>
        </header>

        {/* ── Mobile tab switcher ──────────────────────────────── */}
        <div className="mobile-view-toggle no-print">
          <button className={`mobile-tab ${mobileView === 'form' ? 'active' : ''}`} onClick={() => setMobileView('form')}>Edit</button>
          <button className={`mobile-tab ${mobileView === 'preview' ? 'active' : ''}`} onClick={() => setMobileView('preview')}>Preview</button>
        </div>

        {/* ── Body: sidebar + form + preview ──────────────────── */}
        <div className="app-body">

          {/* ── Left sidebar icon rail ─────────────────────────── */}
          <nav className="sidebar-rail no-print" aria-label="Tools">
            <div className="rail-top">
              <button
                className={`rail-btn ${sidePanel === 'style' ? 'active' : ''}`}
                onClick={() => togglePanel('style')}
                title="Appearance"
              >
                <Palette size={18} />
                <span>Style</span>
              </button>
              <button
                className={`rail-btn ${sidePanel === 'ai' ? 'active' : ''}`}
                onClick={() => togglePanel('ai')}
                title="AI Tools"
              >
                <Bot size={18} />
                <span>AI</span>
              </button>
              <button
                className={`rail-btn ${sidePanel === 'export' ? 'active' : ''}`}
                onClick={() => togglePanel('export')}
                title="Export & Data"
              >
                <FolderDown size={18} />
                <span>Export</span>
              </button>
            </div>
            <div className="rail-bottom">
              <CompletionBar cvData={cvData} compact />
            </div>
          </nav>

          {/* ── Slide-out panels ──────────────────────────────── */}
          {sidePanel && (
            <aside className="side-panel no-print" aria-label={sidePanel}>
              <div className="side-panel-header">
                <span className="side-panel-title">
                  {sidePanel === 'style'  && <><Palette size={14} /> Appearance</>}
                  {sidePanel === 'ai'     && <><Bot size={14} /> AI Tools</>}
                  {sidePanel === 'export' && <><FolderDown size={14} /> Export & Data</>}
                </span>
                <button className="side-panel-close" onClick={() => setSidePanel(null)} aria-label="Close panel">
                  <ChevronLeft size={16} />
                </button>
              </div>

              <div className="side-panel-body">

                {/* ── Style panel ───────────────────────────────── */}
                {sidePanel === 'style' && (
                  <SettingsPanel
                    settings={settings} setSettings={setSettings}
                    activeTab={activeTab} sectionOrder={settings.sectionOrder}
                    onMoveSection={moveSection} onTogglePageBreak={togglePageBreak}
                  />
                )}

                {/* ── AI panel ──────────────────────────────────── */}
                {sidePanel === 'ai' && activeTab === 'resume' && (
                  <div className="ai-tools-panel">
                    <p className="ai-tools-intro">
                      AI-powered tools that read your CV and help you get more interviews.
                    </p>

                    <div className="ai-tool-card" onClick={() => { setShowJDMatcher(true); setSidePanel(null); }}>
                      <span className="ai-tool-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}><ScanSearch size={18} /></span>
                      <div>
                        <div className="ai-tool-name">JD Matcher</div>
                        <div className="ai-tool-desc">Score your CV against a job description and find keyword gaps</div>
                      </div>
                      <ChevronRight size={15} className="ai-tool-arrow" />
                    </div>

                    <div className="ai-tool-card" onClick={() => { setShowInterviewPrep(true); setSidePanel(null); }}>
                      <span className="ai-tool-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc' }}><BrainCircuit size={18} /></span>
                      <div>
                        <div className="ai-tool-name">Interview Prep</div>
                        <div className="ai-tool-desc">Predict likely interview questions grouped by type with hints</div>
                      </div>
                      <ChevronRight size={15} className="ai-tool-arrow" />
                    </div>

                    <div className="ai-tool-card" onClick={() => { setShowPageFit(true); setSidePanel(null); }}>
                      <span className="ai-tool-icon" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee' }}><FileStack size={18} /></span>
                      <div>
                        <div className="ai-tool-name">Page Fit</div>
                        <div className="ai-tool-desc">Rewrite content to hit an exact page count (1–4 pages)</div>
                      </div>
                      <ChevronRight size={15} className="ai-tool-arrow" />
                    </div>

                    <div className="ai-tool-card" onClick={() => { setShowCVImport(true); setSidePanel(null); }}>
                      <span className="ai-tool-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}><FileInput size={18} /></span>
                      <div>
                        <div className="ai-tool-name">CV Import</div>
                        <div className="ai-tool-desc">Paste LinkedIn text or upload a PDF — AI fills all fields</div>
                      </div>
                      <ChevronRight size={15} className="ai-tool-arrow" />
                    </div>

                    <div className="ai-panel-divider" />

                    <p className="ai-tools-section-label">Inline CV analysis</p>
                    <Suspense fallback={<div className="lazy-fallback" style={{ padding: '16px 0' }}>Loading…</div>}>
                      <ATSAnalyzer cvData={cvData} />
                    </Suspense>
                  </div>
                )}

                {sidePanel === 'ai' && activeTab === 'cover-letter' && (
                  <div className="ai-tools-panel">
                    <p className="ai-tools-intro">AI tools for your cover letter are inside the Cover Letter editor — look for the Generate with AI button.</p>
                  </div>
                )}

                {/* ── Export panel ───────────────────────────────── */}
                {sidePanel === 'export' && (
                  <div className="export-panel">
                    <p className="export-section-label">Import</p>
                    <button className="export-row-btn" onClick={() => { setShowCVImport(true); setSidePanel(null); }}>
                      <Sparkles size={15} color="#a855f7" />
                      <div><div className="erb-name">AI Import</div><div className="erb-desc">From PDF or LinkedIn text</div></div>
                    </button>
                    <button className="export-row-btn" onClick={() => fileInputRef.current.click()}>
                      <Upload size={15} color="#3b82f6" />
                      <div><div className="erb-name">Import JSON</div><div className="erb-desc">Restore a previous backup</div></div>
                    </button>
                    <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />

                    <p className="export-section-label">Export</p>
                    <button className="export-row-btn" onClick={handleExport}>
                      <Download size={15} color="#3b82f6" />
                      <div><div className="erb-name">Export JSON</div><div className="erb-desc">Backup all CV data</div></div>
                    </button>
                    <button className="export-row-btn" onClick={handleExportDocx}>
                      <FileText size={15} color="#06b6d4" />
                      <div><div className="erb-name">Export DOCX</div><div className="erb-desc">Word document format</div></div>
                    </button>
                    <button className="export-row-btn" onClick={handleExportZip}>
                      <Archive size={15} color="#f59e0b" />
                      <div><div className="erb-name">Export ZIP</div><div className="erb-desc">All profiles as a bundle</div></div>
                    </button>

                    <p className="export-section-label">Data</p>
                    <button className="export-row-btn" onClick={() => { loadSample(); setSidePanel(null); }}>
                      <Wand2 size={15} color="#a855f7" />
                      <div><div className="erb-name">Load Sample</div><div className="erb-desc">Demo all features with sample data</div></div>
                    </button>
                    <button className="export-row-btn export-row-danger" onClick={clearForm}>
                      <Trash2 size={15} />
                      <div><div className="erb-name">Clear Profile</div><div className="erb-desc">Wipe all data in this profile</div></div>
                    </button>

                    <p className="export-section-label">View</p>
                    <button className="export-row-btn" onClick={handleFitOnePage}>
                      <FileDown size={15} color="#10b981" />
                      <div><div className="erb-name">Fit 1 Page</div><div className="erb-desc">Auto-adjust density to one page</div></div>
                    </button>

                    <div className="export-footer">
                      <span>Press <kbd>?</kbd> for all keyboard shortcuts</span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ── Form pane ────────────────────────────────────────── */}
          <main className="main-content">
            <section
              className={`form-section no-print ${mobileView === 'preview' ? 'mobile-hidden' : ''}`}
              style={{ width: `${formWidth}px` }}
            >
              {activeTab === 'resume' ? (
                <CVForm cvData={cvData} setCvData={setCvData} onAIRequest={handleAIRequest} />
              ) : (
                <Suspense fallback={<div className="lazy-fallback">Loading…</div>}>
                  <CoverLetterForm cvData={cvData} setCvData={setCvData} />
                </Suspense>
              )}

              <footer className="app-credit no-print">
                © Dinusha Ekanayake
              </footer>
            </section>

            <div
              className={`resizer no-print ${isResizing ? 'active' : ''}`}
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
        </div>

        {/* ── Modals ───────────────────────────────────────────── */}
        {showJDMatcher && (
          <JDMatcherModal cvData={cvData} onClose={() => setShowJDMatcher(false)} />
        )}
        {showCVImport && (
          <CVImportModal
            onClose={() => setShowCVImport(false)}
            onImport={(data) => { setCvData(data); setShowCVImport(false); }}
          />
        )}
        {showInterviewPrep && (
          <InterviewPrepModal cvData={cvData} onClose={() => setShowInterviewPrep(false)} />
        )}
        {showPageFit && (
          <AIPageFitModal
            cvData={cvData}
            onClose={() => setShowPageFit(false)}
            onApply={(newData) => setCvData(newData)}
          />
        )}

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
