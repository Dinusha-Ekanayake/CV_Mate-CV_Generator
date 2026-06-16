import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Download, Upload, Trash2, Wand2, Maximize, Printer, Cloud, Undo2, Redo2, FileDown } from 'lucide-react';
import './App.css';
import CVForm from './components/CVForm';
import CVPreview from './components/CVPreview';
import ProfileSwitcher from './components/ProfileSwitcher';
import SettingsPanel from './components/SettingsPanel';

// Lazy-loaded: only needed on the cover-letter tab, so they stay out of the
// initial bundle.
const CoverLetterForm = lazy(() => import('./components/CoverLetterForm'));
const CoverLetterPreview = lazy(() => import('./components/CoverLetterPreview'));
const ATSAnalyzer = lazy(() => import('./components/ATSAnalyzer'));
import { useProfiles, normalizeProfilesState } from './hooks/useProfiles';
import { useHistory } from './hooks/useHistory';
import { downloadPdf } from './utils/pdf';
import { sampleData, hydrateData } from './data/cvDefaults';
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('resume');
  // Gates cloud writes until the initial cloud load for the signed-in user has
  // finished, so local default state can never overwrite existing cloud data.
  const [cloudReady, setCloudReady] = useState(false);

  const {
    profiles,
    activeProfileId,
    cvData,
    settings,
    setCvData,
    setSettings,
    selectProfile,
    addProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    replaceAll,
    profilesState
  } = useProfiles();

  const fileInputRef = useRef(null);

  // Undo/redo timeline for the active profile's content + settings.
  const { undo, redo, canUndo, canRedo } = useHistory({
    cvData, settings, setCvData, setSettings, key: activeProfileId
  });

  // Auth Listener — loads the full multi-profile document from Firestore on login.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setCloudReady(false); // block writes until this load completes
        setIsSyncing(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // normalizeProfilesState handles both the new {profiles,...} shape and
            // the legacy {cvData, settings} cloud shape.
            const normalized = normalizeProfilesState(docSnap.data());
            if (normalized) replaceAll(normalized);
          }
        } catch (error) {
          console.error("Failed to load from cloud:", error);
        }
        setIsSyncing(false);
        setCloudReady(true); // safe to sync local changes back from here on
      } else {
        setCloudReady(false);
      }
    });
    return () => unsubscribe();
  }, [replaceAll]);

  // Cloud sync — localStorage is handled inside useProfiles; this debounces a
  // Firestore write of the entire profiles state whenever it changes. Gated on
  // cloudReady so the initial local state can't clobber freshly-loaded cloud data.
  useEffect(() => {
    if (!currentUser || !cloudReady) return;
    const timeout = setTimeout(() => {
      setIsSyncing(true);
      // Firestore documents are capped at ~1 MiB. Large base64 photos across many
      // profiles can exceed this, so drop photos from the cloud payload when the
      // serialized doc would be too big — text data stays in sync regardless.
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
        .catch(e => {
          console.error('Cloud sync failed:', e);
          setIsSyncing(false);
        });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [profilesState, currentUser, cloudReady]);

  // The preview computes the best density for one-page fit and reports it here.
  useEffect(() => {
    const apply = (e) => setSettings(prev => ({ ...prev, density: e.detail }));
    window.addEventListener('cv-set-density', apply);
    return () => window.removeEventListener('cv-set-density', apply);
  }, [setSettings]);

  const handlePrint = () => window.print();

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const base = (cvData.personal?.name || 'My_CV').trim().replace(/\s+/g, '_');
      await downloadPdf({ fileName: `${base}.pdf` });
    } catch (e) {
      console.error('PDF download failed:', e);
      alert('Could not generate the PDF. Try the Print / PDF button instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  const loadSample = () => setCvData(sampleData);
  const clearForm = () => {
    if (window.confirm("Are you sure you want to clear all data in this profile?")) {
      setCvData(hydrateData(null));
    }
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
        // Basic shape validation so a valid-but-unrelated JSON can't silently wipe the CV.
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Not a CV data object.');
        }
        const looksLikeCV = ['personal', 'summary', 'education', 'experience', 'projects', 'skills', 'coverLetter']
          .some(key => key in parsed);
        if (!looksLikeCV) {
          throw new Error('This file does not look like exported CV data.');
        }
        setCvData(hydrateData(parsed));
      } catch (err) {
        alert(`Could not import file: ${err.message}`);
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
    // The preview owns its zoom state, so signal it to fit the page to the viewport.
    window.dispatchEvent(new CustomEvent('cv-auto-fit'));
  };

  // Toggle a forced page break before a given section in the printed PDF.
  const togglePageBreak = (section) => {
    setSettings(prev => {
      const current = Array.isArray(prev.pageBreaks) ? prev.pageBreaks : [];
      const next = current.includes(section)
        ? current.filter(s => s !== section)
        : [...current, section];
      return { ...prev, pageBreaks: next };
    });
  };

  // Fit-to-one-page: pick the densest spacing that still fits on a single A4 page,
  // falling back to the most compact option. The preview measures and reports back.
  const handleFitOnePage = () => {
    window.dispatchEvent(new CustomEvent('cv-fit-one-page'));
  };

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
          {/* Profile Switcher */}
          <ProfileSwitcher
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={selectProfile}
            onAdd={addProfile}
            onRename={renameProfile}
            onDuplicate={duplicateProfile}
            onDelete={deleteProfile}
          />

          {/* Auth Group */}
          <div className="auth-group" style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(15, 23, 42, 0.4)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
            {currentUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSyncing ? <Cloud size={14} className="sync-pulse" color="#06b6d4" /> : <Cloud size={14} color="#10b981" />}
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                    {(currentUser.email || currentUser.displayName || 'Account').split('@')[0]}
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
            <div className="undo-redo-group" style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
              <button onClick={undo} disabled={!canUndo} className="action-btn" title="Undo (Ctrl+Z)" style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)', color: canUndo ? '#f8fafc' : '#475569', cursor: canUndo ? 'pointer' : 'not-allowed' }}>
                <Undo2 size={15} />
              </button>
              <button onClick={redo} disabled={!canRedo} className="action-btn" title="Redo (Ctrl+Shift+Z)" style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', background: 'transparent', border: 'none', color: canRedo ? '#f8fafc' : '#475569', cursor: canRedo ? 'pointer' : 'not-allowed' }}>
                <Redo2 size={15} />
              </button>
            </div>
            <button onClick={handleAutoFit} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}>
              <Maximize size={14} /> Auto-Fit
            </button>
            {activeTab === 'resume' && (
              <button onClick={handleFitOnePage} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }} title="Auto-adjust density to fit one A4 page">
                <FileDown size={14} /> Fit 1 Page
              </button>
            )}
            <button onClick={handleDownloadPdf} disabled={isDownloading} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }} title="Download a PDF file directly">
              <Download size={15} /> {isDownloading ? 'Saving…' : 'Download PDF'}
            </button>
            <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '0.85rem' }} title="Open print dialog (best quality, vector text)">
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

          {activeTab === 'resume' && (
            <Suspense fallback={null}>
              <ATSAnalyzer cvData={cvData} />
            </Suspense>
          )}

          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            activeTab={activeTab}
            sectionOrder={settings.sectionOrder}
            onMoveSection={moveSection}
            onTogglePageBreak={togglePageBreak}
          />
          {activeTab === 'resume' ? (
            <CVForm cvData={cvData} setCvData={setCvData} />
          ) : (
            <Suspense fallback={<div className="lazy-fallback">Loading…</div>}>
              <CoverLetterForm cvData={cvData} setCvData={setCvData} />
            </Suspense>
          )}

          <footer className="app-credit no-print">
            Developed by <span className="app-credit-name">&copy; Dinusha Ekanayake</span>
          </footer>
        </section>
        <section className="preview-section">
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
  );
}

export default App;
