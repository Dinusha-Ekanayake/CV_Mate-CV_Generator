# CV Mate — Elite Edition: Project Documentation

> **Document version:** 1.0  
> **Author:** Dinusha Ekanayake  
> **Stack:** React 19 · Vite 8 · Electron 42 · Firebase 12 · Gemini AI

---

## 1. Project Overview

**CV Mate** is a professional, AI-assisted CV and resume builder that runs as a modern web application (PWA) and as a native Windows desktop application (Electron). Users create and edit their CV data through a rich live-editor interface, see a real-time A4-formatted preview, and can export to PDF, DOCX, or JSON/ZIP.

### Design Principles

| Principle | Implementation |
|---|---|
| **Zero-server, offline-first** | All state persists to `localStorage`; the app works 100% offline |
| **Optional cloud** | Firebase sign-in layer is purely additive; local mode is the default |
| **Live preview fidelity** | JS-driven A4 paginator mirrors exactly how the document prints |
| **Backward-compatible** | Legacy save data is auto-migrated on load; no user action required |
| **Separation of concerns** | Data (hooks), rendering (CVPreview), editing (CVForm), and settings are fully decoupled |

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        App.jsx                               │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────┐  │
│  │ ProfileSwitcher│  │   SettingsPanel   │  │  Auth/Sync   │  │
│  └──────┬───────┘  └────────┬──────────┘  └──────┬───────┘  │
│         │                   │                     │          │
│         └──────────┬────────┘                     │          │
│                    ▼                               │          │
│            useProfiles (state)  ◄──────── Firebase Firestore │
│             localStorage sync                                │
│                    │                                         │
│         ┌──────────┴──────────┐                             │
│         ▼                     ▼                             │
│     CVForm.jsx           CVPreview.jsx                       │
│  (editor / input)    (live A4 renderer)                      │
│         │                     │                             │
│  RichTextEditor          usePaginatedLayout                  │
│  AIPanel (Gemini)        Page sheets (DOM)                   │
│  ATSAnalyzer                                                 │
└──────────────────────────────────────────────────────────────┘
```

**Data flow is strictly top-down:**

1. `useProfiles` holds the canonical state (`cvData` + `settings`) for every profile.
2. `App.jsx` reads the active profile and passes `cvData` / `setCvData` / `settings` / `setSettings` down as props.
3. `CVForm` calls `setCvData` on every field edit.
4. `CVPreview` is a pure renderer — it reads `cvData` + `settings` and produces the visual output.
5. `useHistory` observes `cvData` + `settings` changes and pushes debounced snapshots into a 50-entry undo/redo stack.

---

## 3. Data Model

All CV state lives in a single `cvData` object. The schema is defined in [`src/data/cvDefaults.js`](file:///e:/My%20Projects/CV_Generator/src/data/cvDefaults.js).

### 3.1 `cvData` Schema

```js
{
  personal: {
    name, title, email, phone,
    linkedin, github, portfolio,
    photo           // base64 string or null
  },
  summary: "",       // HTML string from rich-text editor
  education: [
    { id, institution, degree, dates, gpa, hidden }
  ],
  experience: [
    { id, company, role, dates, location, type, description, hidden }
  ],
  projects: [
    { id, name, tech, url, description, hidden }
  ],
  skills: [
    { id, category, items, level }   // level: 1–5
  ],
  certifications: [
    { id, name, issuer, date, hidden }
  ],
  languages: [
    { id, language, proficiency, hidden }
  ],
  awards: [
    { id, title, issuer, year, hidden }
  ],
  customSections: [
    { id, title, content, hidden }
  ],
  coverLetter: {
    recipientName, companyName, position,
    greeting, closing, date, body
  }
}
```

### 3.2 `settings` Schema

```js
{
  layout: 'single' | 'two-column' | 'executive' | 'creative' | 'minimal',
  themeColor: '#hex',
  palette: 'default' | 'ocean' | 'forest' | 'purple' | 'rose' | 'violet' | 'roseNoir',
  headingFont: "css font-family string",
  bodyFont: "css font-family string",
  sectionOrder: ['summary', 'education', ...],  // user-reordered
  skillStyle: 'classic' | 'tags' | 'bars',
  density: 'compact' | 'normal' | 'relaxed',
  fontScale: 0.8–1.2,
  darkMode: boolean,
  showIcons: boolean,
  photoShape: 'circle' | 'square' | 'rounded',
  headerAlign: 'left' | 'center',
  dividerStyle: 'solid' | 'dashed' | 'none',
  pageBreaks: ['experience', ...],  // sections to force page-break before
}
```

### 3.3 Hydration & Migration

`hydrateData(parsed)` and `hydrateSettings(parsed)` ensure any saved or cloud-loaded data is safe to use — missing fields are filled with defaults, and the old flat skills format (`{ languages, frameworks, tools }`) is auto-converted to the array format.

**Migration chain:**

```
Old localStorage (cvData / cvSettings keys)
  → normalizeProfilesState()
  → makeProfile(name, cvData, settings)
  → hydrateData() + hydrateSettings()
  → valid multi-profile state
```

---

## 4. Component Map

### 4.1 Core Components

#### `CVForm.jsx` *(~1800 lines)*
The primary editing surface. Key implementation details:
- **Accordion sections** — each top-level section (`experience`, `education`, etc.) is an independently collapsible card rendered from a shared `SectionHeader` component that shows the item count badge.
- **Drag-and-drop lists** — each section's items use `@dnd-kit/sortable` via the `SortableItem` wrapper. Drag handles are provided via `CSS.supports('touch-action', 'none')` detection.
- **Rich text fields** — description fields render the `RichTextEditor` component (a `contenteditable` div with a floating toolbar).
- **AI buttons** — each description field has an `AIBulletButton` that, when clicked, calls the Gemini API with the current text and replaces it with the enhanced version.
- **Validation** — email and URL fields validate on blur, storing error state per-field. Inline ⚠️ hints appear below invalid values without blocking saves.
- **Hidden items** — every item row has an eye-toggle that sets `hidden: true`. The preview skips hidden items.

#### `CVPreview.jsx` *(~600 lines)*
The A4 preview renderer. It applies `settings` as CSS custom properties on the root element, allowing the CSS to be data-driven:

```jsx
const previewStyle = {
  '--theme-color': settings.themeColor,
  '--font-scale': settings.fontScale,
  '--spacing-multiplier': densityMap[settings.density],
  '--divider-style': settings.dividerStyle,
  ...
};
```

The component distinguishes between **paginated** (single-column + executive + minimal + creative single-col) and **non-paginated** (classic two-column) modes. In paginated mode, `usePaginatedLayout` positions each `[data-block]` section via inline `margin-top`, producing real stacked page sheets on-screen. In print mode, all inline margins are reset and the browser's native engine handles page flow.

#### `SettingsPanel.jsx`
Exposes all design controls: font pickers, palette swatches, density sliders, section reorder list (with ↑↓ buttons), page-break toggles, and skill style selector.

#### `ATSAnalyzer.jsx`
Computes an ATS score without any server dependency, entirely in the browser:
1. **Contact score** — checks that name, email, phone, LinkedIn, and a skills section are present.
2. **Content score** — awards points for a summary, experience with descriptions, projects with descriptions.
3. **Length score** — experience bullet richness, project detail.
4. **Keyword score** — checks the combined text of the CV against a hard-coded list of 30 common tech keywords.

All four scores are weighted and combined into a single 0–100 value.

#### `AIPanel.jsx`
Contains three AI-powered widgets, all backed by the `@google/generative-ai` SDK (Gemini Flash model):

| Export | What it does |
|---|---|
| `AISummaryButton` | Collects `personal`, `education`, `experience`, `skills` from `cvData` and sends a structured prompt to generate a 3-sentence professional summary |
| `AIBulletButton` | Accepts the current description text, sends it with a prompt to rewrite as 3–4 strong STAR-format achievement bullets |
| `JDMatcherModal` | Accepts a job description, extracts keywords, cross-references against the full CV text, returns a match score and gap analysis |

The API key is read from `import.meta.env.VITE_GEMINI_API_KEY`. If missing, the buttons render as disabled with a tooltip.

---

### 4.2 UX Enhancement Components

| Component | Purpose |
|---|---|
| `ProfileSwitcher.jsx` | Dropdown listing all profiles; supports create, rename, duplicate, delete |
| `OnboardingWizard.jsx` | 4-step animated modal shown only on first visit (gated by `localStorage` key `cvmate_onboarded`) |
| `KeyboardShortcuts.jsx` | Listens to `window.keydown` for `Ctrl+P/E/D/W`. Pressing `?` opens a shortcut help modal |
| `CompletionBar.jsx` | Reads `cvData` and computes a weighted completion percentage: personal (30%), summary (15%), experience (20%), education (15%), skills (10%), extras (10%) |
| `AutosaveIndicator.jsx` | Watches `profilesState` via a `useEffect`; flashes a "✓ Saved" badge for 2 seconds after each change |
| `UpdateToast.jsx` | Listens for the `vite-plugin-pwa`'s `sw-updated` event and shows a "New version available — reload" toast |
| `RichTextEditor.jsx` | A `contenteditable` div. Exposes Bold, Italic, and Bullet List toolbar commands via `document.execCommand`. Sanitises output with DOMPurify before storing |
| `LayoutPicker.jsx` | Visual thumbnail grid for picking the layout template |

---

## 5. Custom Hooks

### `useProfiles` — Multi-Profile State Manager

```
useProfiles()
  → profiles[]         All loaded profiles
  → activeProfileId    ID of the active profile
  → cvData             Shortcut to activeProfile.cvData
  → settings           Shortcut to activeProfile.settings
  → setCvData(fn|val)  Updater (mirrors useState API)
  → setSettings(fn|val)
  → selectProfile(id)
  → addProfile(name)
  → duplicateProfile(id)
  → renameProfile(id, name)
  → deleteProfile(id)   (no-op if only 1 profile remains)
  → replaceAll(state)   Used after a cloud load
  → profilesState       Raw { profiles, activeProfileId } for cloud sync
```

Every mutation calls `persist()` which writes the full state to `localStorage` under the key `cvProfiles`.

### `useHistory` — Undo/Redo

- Snapshots `{ cvData, settings }` as a JSON string.
- Debounces rapid edits into a single history entry (default 600 ms).
- Maintains `past[]` and `future[]` ref stacks (max 50 entries in `past`).
- An `applying` ref flag prevents the restore call from being re-recorded as a new edit.
- Resets the stacks when `key` (the active profile ID) changes, so undo never crosses profiles.

### `usePaginatedLayout` — A4 Pagination Engine

The paginator runs after every layout-affecting change using `useLayoutEffect` (synchronous, before paint, to avoid flicker). It:

1. Resets all `[data-block]` elements' `marginTop` to empty.
2. Measures each block's `offsetHeight` plus computed `marginTop`/`marginBottom`.
3. Greedily packs blocks onto fixed-height virtual pages, injecting a `marginTop` override whenever a block would overflow the current page bottom.
4. Returns `numPages` so the parent can render the correct number of white page-sheet `<div>`s behind the content.

A `ResizeObserver` on the block elements + a `document.fonts.ready` hook ensures automatic re-runs as content changes or custom fonts finish loading. A block tagged `[data-block-break]` always starts a new page (the user-controlled forced page break feature).

---

## 6. Styling Architecture

All CSS uses **vanilla CSS with CSS custom properties** (no utility frameworks). The design system lives in `src/index.css`:

```css
:root {
  --bg-dark: #0f172a;
  --bg-panel: #1e293b;
  --accent-primary: #3b82f6;
  --accent-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6);
  --font-heading: 'Inter', sans-serif;
  ...
}
```

The CV preview is entirely separate — its custom properties are injected inline from `settings`:

```css
/* Example: density scaling */
.cv-item {
  margin-bottom: calc(20px * var(--spacing-multiplier));
}
```

Density values:

| Setting | `--spacing-multiplier` | `--font-scale` |
|---|---|---|
| Compact | `0.72` | `0.88` |
| Normal | `1.0` | `1.0` |
| Relaxed | `1.28` | `1.08` |

**Typography** is `font-size: calc(15px * var(--font-scale))` with `line-height: calc(1.2 + 0.4 * var(--spacing-multiplier))` — this keeps line spacing in a readable range at all density levels.

---

## 7. Export Pipeline

### PDF
`src/utils/pdf.js` wraps `html2pdf.js`. It targets `.cv-preview-container` and renders at A4 dimensions with `scale: 2` for retina-quality output. The `@media print` CSS ruleset strips all screen-only decoration (page sheets, shadows, labels).

### DOCX
`App.jsx` → `handleExportDocx()` dynamically imports the `docx` library and builds a `Document` object from `cvData`, writing each section as styled `Paragraph` objects. All HTML is stripped from rich-text fields with a `.replace(/<[^>]+>/g, '')` before being passed to DOCX.

### ZIP
`App.jsx` → `handleExportZip()` dynamically imports `jszip`, iterates all profiles in `useProfiles`, and adds each profile's `cvData` as a JSON file. The ZIP is generated in-memory and downloaded as a Blob URL.

### JSON Import
The file reader validates that the imported object has at least one of the known CV top-level keys before passing it through `hydrateData()` for safe ingestion.

---

## 8. Firebase / Cloud Sync

**Architecture:** each signed-in user has a single Firestore document at `users/{uid}`. The full `profilesState` (all profiles + active profile ID) is written there.

**Sync logic in `App.jsx`:**

1. `onAuthStateChanged` fires → load cloud doc → `normalizeProfilesState()` → `replaceAll()`.
2. A `useEffect` watching `profilesState` debounces writes back to Firestore (1 second delay).
3. If the serialised payload exceeds ~900 KB, profile photos (base64 strings) are stripped before upload to stay within Firestore's 1 MB document limit.

**Security:** Firestore rules enforce that each user can only read/write their own `users/{uid}` document. All other paths deny all access.

---

## 9. Electron Integration

`electron/main.js` creates a `BrowserWindow` pointing at either `http://localhost:5173` (dev) or `dist/index.html` (production). Auto-updates are configured via `electron-updater`:

```js
autoUpdater.checkForUpdatesAndNotify();
```

`electron/preload.js` exposes a minimal context bridge. The Vite build uses `base: './'` so all asset paths resolve correctly when loaded from the filesystem.

Build command: `npm run electron:build` → produces a Windows NSIS installer in `dist-electron/`.

---

## 10. PWA Configuration

`vite.config.js` uses `vite-plugin-pwa` with Workbox in `generateSW` mode:

- **Precache** — all build assets except `html2pdf-*.js` (excluded because it is a heavy, on-demand-only chunk).
- **skipWaiting + clientsClaim** — ensures users get new builds immediately after an update deploys.
- **Max cache file size** — 600 KB; larger chunks are fetched fresh from the network.

The `UpdateToast` component listens for the `sw-updated` event dispatched by the PWA plugin and prompts the user to reload.

---

## 11. Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Optional | Enables AI features (Summary, Bullets, JD Matcher) |
| `VITE_FIREBASE_API_KEY` | Optional | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase Storage bucket (not actively used) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase App ID |

> All Firebase variables must be set together or not at all. Missing variables cause a Firebase init error at startup.

---

## 12. Key Design Decisions

### Why CSS custom properties instead of Tailwind?
The CV preview needs to be styling-system-independent. A Tailwind purge pass could strip classes that are dynamically composed from settings. CSS custom properties let us express the entire design system as data-driven variables without any build-time coupling.

### Why `useLayoutEffect` for pagination?
`useEffect` runs after the browser has painted, causing a flicker where content momentarily overflows before margins are applied. `useLayoutEffect` runs synchronously before paint, so the paginated position is always correct on the first frame.

### Why store profiles in one localStorage key?
A single serialised blob (`cvProfiles`) is atomically written, preventing partial-write corruption. It also makes the Firebase sync straightforward — the cloud document mirrors the exact same structure.

### Why DOMPurify on rich text?
The WYSIWYG editor uses `contenteditable` + `document.execCommand`, which produces real HTML. Sanitising before storing prevents XSS if users paste content from external sources.

### Why dynamic imports for DOCX/JSZip?
These libraries are large (~350 KB + ~96 KB gzipped) and only needed on demand. Lazy imports via `await import('docx')` keep them out of the initial bundle, improving first-load time.

---

## 13. Known Limitations

- **Cloud photo sync**: Base64-encoded photos are stripped from Firestore payloads when they would push the document over ~900 KB. Users with large photos may find their photo is not synced across devices.
- **DOCX rich text**: HTML formatting from the WYSIWYG editor (bold, italic, bullet lists) is plain-text stripped in the DOCX output. Formatting-aware DOCX rendering would require parsing the HTML AST.
- **Electron auto-update**: Requires a release server (e.g. GitHub Releases). Without it configured, `autoUpdater.checkForUpdatesAndNotify()` silently fails.
- **ATS keyword list**: The 30-keyword panel is static. A production ATS analyzer would parse the job description for keywords dynamically — use the JD Matcher AI feature instead for per-JD analysis.

---

*© 2025 Dinusha Ekanayake — CV Mate Elite Edition*
