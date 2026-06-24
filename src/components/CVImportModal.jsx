import { useState, useRef, useCallback } from 'react';
import { X, FileText, ClipboardPaste, Sparkles, Loader, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { hydrateData } from '../data/cvDefaults';
import { safeId } from '../utils/id';
import './CVImportModal.css';

// ── pdf.js text extraction (CDN, no install needed) ─────────────────
const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.type = 'module';
      // Inject pdfjsLib into window via an inline module
      s.textContent = `
        import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.mjs';
        pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDF_WORKER_SRC}';
        window.pdfjsLib = pdfjsLib;
        window.dispatchEvent(new Event('pdfjs-ready'));
      `;
      document.head.appendChild(s);
      window.addEventListener('pdfjs-ready', resolve, { once: true });
      setTimeout(() => reject(new Error('PDF.js load timed out')), 15000);
    });
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  return pages.join('\n');
}

// ── AI extraction via OpenRouter ────────────────────────────────────
const OR_BASE = 'https://openrouter.ai/api/v1/chat/completions';
const OR_MODEL = 'google/gemini-2.5-flash';
const OR_FALLBACK = 'google/gemini-1.5-flash';

async function extractCVWithAI(rawText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('NO_KEY');

  const prompt = `You are a CV parser. Extract all information from the following CV/resume text and return it as a single JSON object matching this exact schema. Do not include any markdown, code fences, or explanation — output raw JSON only.

Schema:
{
  "personal": { "name": "", "title": "", "email": "", "phone": "", "linkedin": "", "github": "", "portfolio": "" },
  "summary": "",
  "education": [{ "id": "", "institution": "", "degree": "", "dates": "", "gpa": "", "hidden": false }],
  "experience": [{ "id": "", "company": "", "role": "", "dates": "", "location": "", "type": "", "description": "", "hidden": false }],
  "projects": [{ "id": "", "name": "", "tech": "", "url": "", "description": "", "hidden": false }],
  "skills": [{ "id": "", "category": "", "items": "", "level": 3, "hidden": false }],
  "certifications": [{ "id": "", "name": "", "issuer": "", "date": "", "hidden": false }],
  "languages": [{ "id": "", "language": "", "proficiency": "", "hidden": false }],
  "awards": [{ "id": "", "title": "", "issuer": "", "year": "", "hidden": false }]
}

Rules:
- Generate unique IDs for every array item (e.g. "edu-1", "exp-1", "proj-1", "sk-1", "cert-1", "lang-1", "awd-1")
- For experience.description: use bullet format with "- " prefix per line, keep it concise
- For projects.description: use HTML <ul><li>...</li></ul> format
- For skills: group into logical categories (Languages, Frameworks, Tools, etc.), items as comma-separated string
- summary: plain text paragraph, no HTML
- If a field has no data, use "" or [] — never null
- level: always 3 (default)

CV Text to parse:
---
${rawText.slice(0, 6000)}
---

Output raw JSON only:`;

  const models = [OR_MODEL, OR_FALLBACK];
  for (const model of models) {
    const res = await fetch(OR_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://cvmate.app',
        'X-Title': 'CV Mate'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty AI response');
      // Strip markdown code fences if model adds them anyway
      const clean = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const json = clean.match(/\{[\s\S]*\}/)?.[0];
      if (!json) throw new Error('PARSE_FAIL');
      return JSON.parse(json);
    }

    if (res.status === 401) throw new Error('AUTH');
    if (res.status === 402) throw new Error('CREDITS');
    if (res.status === 429 && model !== OR_FALLBACK) continue;
    if (res.status >= 500 && model !== OR_FALLBACK) continue;
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }
}

function friendlyErr(e) {
  switch (e.message) {
    case 'NO_KEY':      return 'Set VITE_OPENROUTER_API_KEY in your .env to enable AI import.';
    case 'AUTH':        return 'Invalid API key. Check VITE_OPENROUTER_API_KEY.';
    case 'CREDITS':     return 'OpenRouter credits exhausted. Top up at openrouter.ai.';
    case 'PARSE_FAIL':  return 'AI returned unexpected format. Try again or use the paste tab.';
    default:            return `AI error: ${e.message?.slice(0, 120) || 'Unknown'}`;
  }
}

// ── Normalise extracted data (ensure all IDs present) ────────────────
function normaliseExtracted(raw) {
  const addIds = (arr, prefix) =>
    (Array.isArray(arr) ? arr : []).map((item, i) => ({
      ...item,
      id: item.id || `${prefix}-${i + 1}`,
      hidden: false
    }));

  return {
    personal: raw.personal || {},
    summary: raw.summary || '',
    education: addIds(raw.education, 'edu'),
    experience: addIds(raw.experience, 'exp'),
    projects: addIds(raw.projects, 'proj'),
    skills: addIds(raw.skills, 'sk').map(s => ({ level: 3, ...s })),
    certifications: addIds(raw.certifications, 'cert'),
    languages: addIds(raw.languages, 'lang'),
    awards: addIds(raw.awards, 'awd'),
    customSections: []
  };
}

// ── Preview diff component ────────────────────────────────────────────
const PreviewSection = ({ title, items, renderItem }) => {
  const [open, setOpen] = useState(true);
  if (!items || (Array.isArray(items) ? items.length === 0 : !items)) return null;
  return (
    <div className="imp-preview-section">
      <button className="imp-preview-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span>{title}</span>
        {Array.isArray(items) && <span className="imp-preview-count">{items.length}</span>}
      </button>
      {open && (
        <div className="imp-preview-body">
          {Array.isArray(items) ? items.map((item, i) => (
            <div key={i} className="imp-preview-item">{renderItem(item)}</div>
          )) : <div className="imp-preview-item">{renderItem(items)}</div>}
        </div>
      )}
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────
export default function CVImportModal({ onClose, onImport }) {
  const [tab, setTab] = useState('paste'); // 'paste' | 'pdf'
  const [text, setText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [stage, setStage] = useState('idle'); // 'idle' | 'extracting' | 'preview' | 'done'
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState(null);
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }
    setPdfFile(file);
    setError('');
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const runExtraction = async () => {
    setError('');
    setStage('extracting');
    try {
      let rawText = text.trim();

      if (tab === 'pdf') {
        if (!pdfFile) { setError('Select a PDF file first.'); setStage('idle'); return; }
        rawText = await extractPdfText(pdfFile);
        if (!rawText.trim()) throw new Error('Could not extract text from this PDF. Try the paste tab instead.');
      } else {
        if (!rawText) { setError('Paste some text first.'); setStage('idle'); return; }
      }

      const parsed = await extractCVWithAI(rawText);
      const normalised = normaliseExtracted(parsed);
      setExtracted(normalised);
      setStage('preview');
    } catch (e) {
      setError(friendlyErr(e));
      setStage('idle');
    }
  };

  const confirmImport = () => {
    if (!extracted) return;
    onImport(hydrateData(extracted));
    onClose();
  };

  return (
    <div className="imp-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="imp-modal" role="dialog" aria-modal="true" aria-label="Import CV">
        {/* Header */}
        <div className="imp-header">
          <h2 className="imp-title">
            <Sparkles size={18} />
            AI CV Import
          </h2>
          <button className="imp-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="imp-subtitle">
          Paste your LinkedIn profile text or upload a PDF — AI will extract and fill in all your CV fields automatically.
        </p>

        {stage === 'idle' && (
          <>
            {/* Tabs */}
            <div className="imp-tabs">
              <button
                className={`imp-tab ${tab === 'paste' ? 'active' : ''}`}
                onClick={() => { setTab('paste'); setError(''); }}
              >
                <ClipboardPaste size={14} /> Paste Text
              </button>
              <button
                className={`imp-tab ${tab === 'pdf' ? 'active' : ''}`}
                onClick={() => { setTab('pdf'); setError(''); }}
              >
                <FileText size={14} /> Upload PDF
              </button>
            </div>

            {tab === 'paste' && (
              <div className="imp-paste-area">
                <p className="imp-hint">
                  Copy your full LinkedIn profile (or any CV text) and paste it below.
                  The more text you include, the better the extraction.
                </p>
                <textarea
                  className="imp-textarea"
                  placeholder="Paste LinkedIn profile text, CV text, or any resume content here…"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={12}
                  autoFocus
                />
                <div className="imp-char-count">{text.length.toLocaleString()} characters</div>
              </div>
            )}

            {tab === 'pdf' && (
              <div
                className={`imp-drop-zone ${pdfFile ? 'has-file' : ''}`}
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); dropRef.current?.classList.add('drag-over'); }}
                onDragLeave={() => dropRef.current?.classList.remove('drag-over')}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={e => handleFile(e.target.files[0])}
                />
                {pdfFile ? (
                  <>
                    <CheckCircle size={32} color="#10b981" />
                    <p className="imp-drop-name">{pdfFile.name}</p>
                    <p className="imp-drop-sub">{(pdfFile.size / 1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="#64748b" />
                    <p className="imp-drop-label">Drop your CV PDF here</p>
                    <p className="imp-drop-sub">or click to browse · PDF only</p>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="imp-error">
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div className="imp-actions">
              <button className="btn-secondary imp-cancel" onClick={onClose}>Cancel</button>
              <button
                className="btn-ai imp-extract-btn"
                onClick={runExtraction}
                disabled={tab === 'paste' ? !text.trim() : !pdfFile}
              >
                <Sparkles size={14} /> Extract with AI
              </button>
            </div>
          </>
        )}

        {stage === 'extracting' && (
          <div className="imp-loading">
            <Loader size={32} className="spin" color="#a855f7" />
            <p className="imp-loading-label">
              {tab === 'pdf' ? 'Reading PDF…' : 'Extracting CV data with AI…'}
            </p>
            <p className="imp-loading-sub">This takes 10–20 seconds</p>
          </div>
        )}

        {stage === 'preview' && extracted && (
          <>
            <div className="imp-preview-header">
              <CheckCircle size={16} color="#10b981" />
              <span>Review extracted data before importing</span>
            </div>

            <div className="imp-preview-scroll">
              {/* Personal */}
              <PreviewSection title="Personal Info" items={extracted.personal} renderItem={p => (
                <div className="imp-personal-grid">
                  {Object.entries(p).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="imp-personal-row">
                      <span className="imp-field-key">{k}</span>
                      <span className="imp-field-val">{v}</span>
                    </div>
                  ))}
                </div>
              )} />

              {extracted.summary && (
                <PreviewSection title="Summary" items={[extracted.summary]} renderItem={s => (
                  <span className="imp-summary-text">{s}</span>
                )} />
              )}

              <PreviewSection title="Experience" items={extracted.experience} renderItem={e => (
                <div>
                  <div className="imp-item-head">{e.role} <span className="imp-item-at">at</span> {e.company}</div>
                  {e.dates && <div className="imp-item-meta">{e.dates}{e.location ? ` · ${e.location}` : ''}</div>}
                </div>
              )} />

              <PreviewSection title="Education" items={extracted.education} renderItem={e => (
                <div>
                  <div className="imp-item-head">{e.degree}</div>
                  <div className="imp-item-meta">{e.institution}{e.dates ? ` · ${e.dates}` : ''}{e.gpa ? ` · GPA: ${e.gpa}` : ''}</div>
                </div>
              )} />

              <PreviewSection title="Projects" items={extracted.projects} renderItem={p => (
                <div>
                  <div className="imp-item-head">{p.name}</div>
                  {p.tech && <div className="imp-item-meta">{p.tech}</div>}
                </div>
              )} />

              <PreviewSection title="Skills" items={extracted.skills} renderItem={s => (
                <div>
                  <span className="imp-skill-cat">{s.category}: </span>
                  <span className="imp-skill-items">{s.items}</span>
                </div>
              )} />

              <PreviewSection title="Certifications" items={extracted.certifications} renderItem={c => (
                <div>
                  <div className="imp-item-head">{c.name}</div>
                  {c.issuer && <div className="imp-item-meta">{c.issuer}{c.date ? ` · ${c.date}` : ''}</div>}
                </div>
              )} />

              <PreviewSection title="Languages" items={extracted.languages} renderItem={l => (
                <span>{l.language} — {l.proficiency}</span>
              )} />

              <PreviewSection title="Awards" items={extracted.awards} renderItem={a => (
                <div>
                  <div className="imp-item-head">{a.title}</div>
                  {a.issuer && <div className="imp-item-meta">{a.issuer}{a.year ? ` · ${a.year}` : ''}</div>}
                </div>
              )} />
            </div>

            <div className="imp-warning">
              <AlertCircle size={13} />
              This will replace all current CV data. You can undo with Ctrl+Z after importing.
            </div>

            <div className="imp-actions">
              <button className="btn-secondary imp-cancel" onClick={() => { setStage('idle'); setExtracted(null); }}>
                ← Back
              </button>
              <button className="btn-ai imp-extract-btn" onClick={confirmImport}>
                <CheckCircle size={14} /> Import to CV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
