// Default CV content, default document settings, and the hydration/migration
// helper. Extracted so both App and the profiles hook share one source of truth.

export const initialData = {
  personal: {
    name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', photo: null,
  },
  summary: '',
  education: [],
  experience: [],
  projects: [],
  skills: [
    { id: 'sk-1', category: 'Languages', items: '', level: 3 },
    { id: 'sk-2', category: 'Frameworks', items: '', level: 3 },
    { id: 'sk-3', category: 'Tools', items: '', level: 3 }
  ],
  certifications: [],
  languages: [],
  awards: [],
  customSections: [],
  coverLetter: {
    recipientName: 'Hiring Manager',
    companyName: 'Tech Innovators Inc.',
    position: '',
    greeting: 'Dear',
    closing: 'Sincerely',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    body: 'I am writing to express my strong interest in the open position at your company. With my background in software engineering and passion for building scalable applications, I believe I would be a great fit for your team.<br><br>In my previous roles, I have successfully delivered high-impact projects while maintaining a focus on clean, maintainable code. I am particularly drawn to your company\'s mission and the innovative work your team is doing.<br><br>Thank you for considering my application. I look forward to the possibility of discussing this exciting opportunity with you.'
  }
};

export const sampleData = {
  personal: {
    name: 'Alan Turing', title: 'AI Software Engineer', email: 'alan@example.com', phone: '+1 234 567 8900',
    linkedin: 'linkedin.com/in/alanturing', github: 'github.com/alanturing', portfolio: 'alanturing.dev', photo: null,
  },
  summary: 'Passionate Artificial Intelligence undergraduate with a strong foundation in machine learning, deep neural networks, and scalable software engineering. Proven ability to build intelligent systems and optimize complex algorithms.',
  education: [
    { id: 'edu-1', institution: 'University of Moratuwa', degree: 'BSc. (Hons) in Artificial Intelligence', dates: 'Sep 2020 - May 2024', gpa: '3.8 / 4.0' }
  ],
  experience: [
    { id: 'exp-1', company: 'TechNova Solutions', role: 'Machine Learning Intern', dates: 'Jun 2023 - Aug 2023', location: 'Remote', type: 'Internship', description: '- Engineered a computer vision pipeline using **PyTorch** that improved defect detection accuracy by 18%.\n- Deployed models to AWS SageMaker and created a REST API with FastAPI.' }
  ],
  projects: [
    { id: 'proj-1', name: 'Neural Network Visualizer', tech: 'Python, D3.js, React', url: 'github.com/alanturing/nn-viz', description: '<ul><li>Built an interactive visualization tool for neural network architectures used by 500+ students.</li><li>Implemented real-time forward-pass animation with WebGL rendering.</li></ul>' },
    { id: 'proj-2', name: 'Resume Builder', tech: 'React, Firebase, Electron', url: '', description: '<ul><li>Built a cross-platform desktop & web resume builder.</li><li>Implemented drag-and-drop components and real-time PDF generation.</li></ul>' }
  ],
  skills: [
    { id: 'sk-1', category: 'Languages', items: 'Python, JavaScript, TypeScript, Java, C++', level: 5 },
    { id: 'sk-2', category: 'Frameworks', items: 'React, Node.js, PyTorch, TensorFlow, Next.js', level: 4 },
    { id: 'sk-3', category: 'Tools', items: 'Git, Docker, AWS, Firebase, MongoDB', level: 4 }
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', date: 'Mar 2024', hidden: false },
    { id: 'cert-2', name: 'TensorFlow Developer Certificate', issuer: 'Google', date: 'Nov 2023', hidden: false }
  ],
  languages: [
    { id: 'lang-1', language: 'English', proficiency: 'Fluent', hidden: false },
    { id: 'lang-2', language: 'Sinhala', proficiency: 'Native', hidden: false }
  ],
  awards: [
    { id: 'awd-1', title: 'Dean\'s List — Academic Excellence', issuer: 'University of Moratuwa', year: '2023', hidden: false }
  ],
  customSections: [],
  coverLetter: {
    recipientName: 'Sarah Jenkins, Head of Engineering',
    companyName: 'OpenAI',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    body: 'Dear Sarah,<br><br>I am writing to express my profound interest in the AI Software Engineer position at OpenAI. As a passionate developer with a deep background in machine learning and scalable web infrastructure, I have followed OpenAI\'s breakthroughs closely and am inspired by your mission to ensure artificial general intelligence benefits all of humanity.<br><br>During my time at University of Moratuwa and my subsequent internships, I architected neural network visualizers and deployed deep learning models that processed real-time data. My recent project, a React-based application that integrates generative AI, gave me hands-on experience dealing with latency optimizations and complex state management—challenges I know your team tackles daily.<br><br>What excites me most about this role is the opportunity to work at the bleeding edge of AI while ensuring robust, user-centric software design. I bring a blend of rigorous academic research and practical, shipping-focused software engineering.<br><br>I would welcome the opportunity to discuss how my background in both frontend engineering and AI model integration aligns with your engineering goals. Thank you for your time and consideration.<br><br>Best regards,<br>Alan Turing'
  }
};

export const defaultSectionOrder = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'languages', 'awards'];

export const defaultSettings = {
  layout: 'single',
  themeColor: '#0f172a',
  palette: 'default',
  headingFont: "'Inter', sans-serif",
  bodyFont: "'Inter', sans-serif",
  fontFamily: "'Inter', sans-serif", // kept for legacy
  sectionOrder: defaultSectionOrder,
  skillStyle: 'classic',
  density: 'normal',
  fontScale: 1,
  darkMode: false,
  showIcons: false,
  photoShape: 'circle',
  headerAlign: 'left',
  dividerStyle: 'solid',

  // ── Group A: Header Decoration ───────────────────────────
  headerBg: 'none',           // 'none' | 'solid' | 'gradient' | 'full-bleed'
  headerTextColor: 'auto',    // 'auto' | 'white' | 'dark'
  accentLineWeight: 'medium', // 'none' | 'thin' | 'medium' | 'thick'
  accentLinePos: 'below',     // 'below' | 'left' | 'both'

  // ── Group B: Cards & Borders ─────────────────────────────
  itemCardStyle: 'flat',      // 'flat' | 'border' | 'shadow' | 'pill'
  cornerRadius: 'soft',       // 'sharp' | 'soft' | 'rounded'

  // ── Group C: Typography Fine-tuning ──────────────────────
  nameCase: 'normal',         // 'normal' | 'uppercase' | 'capitalize' | 'small-caps'
  letterSpacing: 'normal',    // 'tight' | 'normal' | 'wide' | 'wider'
  lineHeight: 'normal',       // 'compact' | 'normal' | 'relaxed'

  // ── Group D: Date & Contact Format ───────────────────────
  dateStyle: 'default',       // 'default' | 'pill' | 'icon'
  contactLayout: 'inline',    // 'inline' | 'stacked' | 'grid'

  // ── Group E: Section Title Style ─────────────────────────
  sectionTitleStyle: 'line-below', // 'line-below' | 'line-above' | 'filled' | 'allcaps'
  sectionTitleSize: 'normal',      // 'small' | 'normal' | 'large'

  // ── Group F: Extras ──────────────────────────────────────
  watermark: 'none',          // 'none' | 'draft' | 'confidential'
  pageFooter: 'none',         // 'none' | 'page-numbers' | 'name'
};


export const hydrateSettings = (parsed = {}) => {
  // Merge parsed sectionOrder, adding any new default sections that aren't present yet
  let sectionOrder = Array.isArray(parsed.sectionOrder) ? parsed.sectionOrder : defaultSectionOrder;
  defaultSectionOrder.forEach(sec => {
    if (!sectionOrder.includes(sec)) {
      sectionOrder = [...sectionOrder, sec];
    }
  });
  // Also preserve any custom section IDs that are in the parsed order
  return {
    ...defaultSettings,
    ...parsed,
    sectionOrder,
  };
};

export const hydrateData = (parsed) => {
  if (!parsed) return initialData;

  let migratedSkills = parsed.skills || initialData.skills;
  if (!Array.isArray(migratedSkills)) {
    migratedSkills = [
      { id: 'sk-lang', category: 'Languages', items: migratedSkills.languages || '', level: 3 },
      { id: 'sk-fram', category: 'Frameworks', items: migratedSkills.frameworks || '', level: 3 },
      { id: 'sk-tool', category: 'Tools', items: migratedSkills.tools || '', level: 3 }
    ];
  } else {
    // Ensure every skill has a level field
    migratedSkills = migratedSkills.map(s => ({ level: 3, ...s }));
  }

  return {
    ...initialData,
    ...parsed,
    personal: { ...initialData.personal, ...(parsed.personal || {}) },
    skills: migratedSkills,
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    awards: Array.isArray(parsed.awards) ? parsed.awards : [],
    customSections: Array.isArray(parsed.customSections) ? parsed.customSections : [],
    coverLetter: { ...initialData.coverLetter, ...(parsed.coverLetter || {}) }
  };
};
