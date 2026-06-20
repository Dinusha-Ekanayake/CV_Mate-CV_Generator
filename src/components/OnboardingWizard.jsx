import { useState } from 'react';
import { Wand2, FileText, Palette, Download, X, ChevronRight } from 'lucide-react';
import './OnboardingWizard.css';

const STEPS = [
  {
    icon: <Wand2 size={40} />,
    color: '#8b5cf6',
    title: 'Welcome to CV Mate 🎉',
    description: 'Build a professional, ATS-optimized CV in minutes. This quick tour shows you the key features.',
    hint: null,
  },
  {
    icon: <FileText size={40} />,
    color: '#3b82f6',
    title: 'Fill In Your Details',
    description: 'Use the form on the left to add your personal info, experience, education, and skills. Everything updates live in the preview.',
    hint: '💡 Try clicking "Sample" in the toolbar to see a pre-filled example.',
  },
  {
    icon: <Palette size={40} />,
    color: '#10b981',
    title: 'Customize Your Design',
    description: 'Pick from 5 layouts, 7 color palettes, and multiple fonts. Toggle dark mode, adjust density, and set header alignment.',
    hint: '💡 The "Fit 1 Page" button auto-adjusts spacing to fill exactly one A4 page.',
  },
  {
    icon: <Download size={40} />,
    color: '#f59e0b',
    title: 'Download Your CV',
    description: 'Export as PDF (highest quality), DOCX (Word), or JSON. Sign in with Google to sync across all your devices.',
    hint: '💡 Use "Print / PDF" for the sharpest vector-quality PDF.',
  },
];

const OnboardingWizard = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem('cvmate_onboarded', '1');
    onDone();
  };

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal">
        <button className="onboarding-skip" onClick={finish} title="Skip tour"><X size={16} /></button>

        <div className="onboarding-icon" style={{ color: current.color, background: current.color + '18' }}>
          {current.icon}
        </div>

        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.description}</p>
        {current.hint && <div className="onboarding-hint">{current.hint}</div>}

        {/* Dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`}
              style={{ background: i === step ? current.color : undefined }}
              onClick={() => setStep(i)} />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button
            className="btn btn-primary"
            style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}bb)` }}
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
          >
            {isLast ? '🚀 Get Started' : 'Next'} {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Only show on first visit
export const OnboardingGate = ({ children }) => {
  const [done, setDone] = useState(() => !!localStorage.getItem('cvmate_onboarded'));
  if (!done) return <><OnboardingWizard onDone={() => setDone(true)} />{children}</>;
  return children;
};

export default OnboardingWizard;
