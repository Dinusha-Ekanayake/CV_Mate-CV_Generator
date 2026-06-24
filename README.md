<div align="center">

# 📄 CV Mate — Elite Edition

**A professional, AI-powered CV & Resume builder built with React + Vite**

*Build stunning resumes, cover letters, and export them to PDF, DOCX, or ZIP — all from your browser or desktop.*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Cloud%20Sync-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Electron](https://img.shields.io/badge/Electron-Desktop%20App-47848F?style=flat-square&logo=electron)](https://www.electronjs.org)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=googlechrome)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## ✨ Features

### 📝 CV & Resume Builder
- **Live two-pane editor** — form on the left, real-time A4 preview on the right
- **Rich text editing** — bold, italic, bullet lists with a WYSIWYG toolbar
- **Drag-and-drop section reordering** — powered by `@dnd-kit`
- **Collapsible sections** — clean accordion UI with per-section item counts
- **Profile photo** — upload, preview, crop shape (circle / square / rounded)
- **Input validation** — real-time email and URL format checking

### 📋 Supported CV Sections
| Section | Fields |
|---|---|
| **Personal Info** | Name, title, email, phone, LinkedIn, GitHub, portfolio, photo |
| **Professional Summary** | Rich text paragraph |
| **Experience** | Company, role, dates, location, type (Full-time / Internship / etc.), rich description |
| **Education** | Institution, degree, dates, GPA |
| **Projects** | Name, tech stack, live URL, rich description |
| **Skills** | Category groups with proficiency level (1–5 stars) |
| **Certifications** | Name, issuer, date |
| **Languages** | Language + proficiency (Native / Fluent / Intermediate / Basic) |
| **Awards & Honors** | Title, issuer, year |
| **Custom Sections** | Unlimited user-named free-form sections |

### 🎨 Design & Customisation
- **5 layout templates**: Single Column, Two Column, Executive, Creative, Minimal
- **8 heading fonts** + **6 body fonts** (Inter, Poppins, Roboto, Montserrat, Raleway, Nunito…)
- **7 colour palettes**: Default, Ocean Blue, Forest Green, Deep Purple, Rose Gold, Deep Violet, Rose Noir
- **Custom theme colour** picker
- **Skill display styles**: Classic list, Tags (pills), or Bars (proficiency bars)
- **Header alignment**: Left or Centred
- **Section dividers**: Solid, Dashed, or None
- **Dark mode** resume output
- **Font size & line spacing** density controls (Compact / Normal / Relaxed)

### 🤖 AI Features *(requires Gemini API key)*
- **AI Summary Generator** — generates a professional summary from your CV data
- **AI Bullet Enhancer** — rewrites experience/project descriptions into strong, metric-rich ATS bullets
- **Job Description Matcher** — paste any JD → get a match score, matched keywords, missing keywords, and tailored tips

### 📊 ATS Analyzer
- Real-time ATS compatibility score (0–100)
- Per-section breakdown bars (Summary, Experience, Projects quality)
- Contact completeness checks (Email ✓, Phone ✓, LinkedIn ✓, Skills ✓)
- Keyword panel — shows 30 common tech keywords as found / missing chips
- Smart scoring engine accounting for section length and quality

### 📤 Export Options
| Format | Details |
|---|---|
| **PDF (Quick)** | `html2pdf.js` — one click in-browser PDF |
| **Print / PDF** | Native browser print dialog — highest quality |
| **DOCX (Word)** | Full `.docx` file via the `docx` library |
| **JSON** | Portable data backup for import/re-use |
| **ZIP** | All profiles bundled as JSON files in a single archive |

### 💾 Profiles & Data
- **Multiple CV profiles** — create, rename, duplicate, and delete profiles
- **Undo / Redo** — 50-step debounced history per profile (Ctrl+Z / Ctrl+Y)
- **Auto-save** — persisted to `localStorage` on every change with visible indicator
- **Import JSON** — restore from a previously exported file
- **Backward compatible** — old single-CV saves are automatically migrated

### ☁️ Cloud Sync *(optional)*
- **Google Sign-In** via Firebase Authentication
- All profiles synced to **Firestore** in real time
- Cloud data loaded on login; local data used when signed out
- Profile photos are stripped from cloud payloads to stay within Firestore's 1 MB document limit

### 💌 Cover Letter Builder
- Separate form for recipient, company, date, greeting, body, and closing
- Shares the same CV data (name, contact info auto-populated)
- Same live preview and export options as the CV

### ⌨️ Power User Features
- **Keyboard shortcuts** — press `?` to open the help modal:
  - `Ctrl+Z` / `Ctrl+Y` — Undo / Redo
  - `Ctrl+P` — Print / PDF
  - `Ctrl+E` — Export JSON
  - `Ctrl+D` — Download PDF
  - `Ctrl+W` — Export DOCX
- **Section reordering** — drag handles or ↑↓ buttons in Settings
- **Page breaks** — toggle forced page breaks before any section
- **Auto-Fit** — auto-scales the preview to fill the viewport
- **Fit 1 Page** — auto-adjusts density to fit all content on a single A4 page
- **Completion bar** — weighted progress indicator showing how filled-out your CV is
- **Onboarding wizard** — 4-step animated first-visit tour (localStorage gated, skippable)

### 📱 Mobile & PWA
- **Mobile view toggle** — Edit / Preview tab switcher on screens < 900px
- **Responsive layout** — full usability on tablets and phones
- **Installable PWA** — install to home screen, works offline
- **Desktop app** — ships as a native Windows `.exe` via Electron

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone & Install

```bash
git clone https://github.com/Dinusha-Ekanayake/CV_Generator.git
cd CV_Generator
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root. Copy `.env.example` (or create manually):

```env
# === Gemini AI (optional — enables AI features) ===
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# === Firebase (optional — enables cloud sync & Google login) ===
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Note:** All features work without any API keys. AI features require a Gemini key. Cloud sync requires a Firebase project.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🏗️ Build & Deploy

### Web (Production Build)

```bash
npm run build
npm run preview   # preview the production build locally
```

The output goes to `dist/`. Deploy the `dist/` folder to any static host (Firebase Hosting, Vercel, Netlify, GitHub Pages…).

### Desktop (Electron)

```bash
# Development (hot-reload)
npm run electron:dev

# Production installer (.exe for Windows)
npm run electron:build
```

The installer is output to `dist-electron/`.

### Quick-start scripts (Windows)

| Script | Action |
|---|---|
| `Start Development.bat` | Runs `npm run dev` |
| `Build Application.bat` | Runs `npm run electron:build` |

---

## 🔥 Firebase Setup *(for cloud sync)*

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Google** sign-in provider
3. Enable **Firestore Database** (start in production mode)
4. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Copy your project credentials into `.env`

The Firestore security model ensures each user can only read/write their own document at `users/{uid}`.

---

## 🤖 Gemini AI Setup

1. Get a free API key at [aistudio.google.com](https://aistudio.google.com)
2. Add it to your `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```
3. Restart the dev server. The AI buttons will become active.

---

## 📁 Project Structure

```
CV_Generator/
├── electron/                  # Electron main & preload scripts
│   ├── main.js                # BrowserWindow setup, auto-updater
│   └── preload.js             # Context bridge
├── public/                    # Static assets (logo, favicon)
├── src/
│   ├── components/            # All React UI components
│   │   ├── AIPanel.jsx        # AI Summary, Bullet Enhancer, JD Matcher
│   │   ├── ATSAnalyzer.jsx    # ATS scoring engine & UI
│   │   ├── AutosaveIndicator.jsx
│   │   ├── CompletionBar.jsx  # CV fill-out progress
│   │   ├── CoverLetterForm.jsx
│   │   ├── CoverLetterPreview.jsx
│   │   ├── CVForm.jsx         # Main CV editor form (1800+ lines)
│   │   ├── CVPreview.jsx      # Live A4 preview renderer
│   │   ├── KeyboardShortcuts.jsx
│   │   ├── LayoutPicker.jsx
│   │   ├── OnboardingWizard.jsx
│   │   ├── ProfileSwitcher.jsx
│   │   ├── RichTextEditor.jsx # WYSIWYG contenteditable editor
│   │   ├── SettingsPanel.jsx  # Fonts, palettes, layout, density
│   │   ├── SortableItem.jsx   # dnd-kit wrapper
│   │   └── UpdateToast.jsx    # PWA update notification
│   ├── data/
│   │   └── cvDefaults.js      # Schema, sample data, hydration helpers
│   ├── hooks/
│   │   ├── useHistory.js      # Debounced 50-step undo/redo
│   │   ├── usePaginatedLayout.js  # JS-driven A4 pagination engine
│   │   └── useProfiles.js     # Multi-profile state + localStorage sync
│   ├── utils/
│   │   ├── id.js              # Unique ID generator
│   │   ├── pdf.js             # html2pdf wrapper
│   │   └── richText.js        # HTML sanitiser helpers
│   ├── App.jsx                # Root component, exports, cloud sync
│   ├── App.css
│   ├── firebase.js            # Firebase initialisation
│   ├── index.css              # Global design tokens & base styles
│   └── main.jsx               # React entry point
├── .env                       # Environment variables (gitignored)
├── firebase.json              # Firebase hosting config
├── firestore.rules            # Firestore security rules
├── package.json
└── vite.config.js             # Vite + PWA plugin config
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Desktop** | Electron 42 + electron-builder |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **AI** | @google/generative-ai (Gemini) |
| **Cloud/Auth** | Firebase 12 (Firestore + Google Auth) |
| **PDF** | html2pdf.js |
| **DOCX** | docx |
| **ZIP** | jszip |
| **Icons** | lucide-react |
| **PWA** | vite-plugin-pwa + Workbox |
| **Sanitisation** | DOMPurify |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep commits scoped and descriptive. Follow the existing code style.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Developed with ❤️ by **Dinusha Ekanayake**

</div>
