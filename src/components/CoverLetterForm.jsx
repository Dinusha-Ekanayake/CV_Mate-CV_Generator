import RichTextEditor from './RichTextEditor';
import { AICoverLetterButton } from './AIPanel';

const CoverLetterForm = ({ cvData, setCvData }) => {
  const { coverLetter } = cvData;

  const handleChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      coverLetter: { ...prev.coverLetter, [field]: value }
    }));
  };

  const handlePersonalChange = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
  };

  return (
    <div className="cv-form-container">
      <h2 className="section-title">Your Details</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-row">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={cvData.personal.name} onChange={e => handlePersonalChange('name', e.target.value)} placeholder="e.g. Alan Turing" />
          </div>
          <div className="form-group">
            <label>Professional Title</label>
            <input type="text" value={cvData.personal.title} onChange={e => handlePersonalChange('title', e.target.value)} placeholder="e.g. AI Software Engineer" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={cvData.personal.email} onChange={e => handlePersonalChange('email', e.target.value)} placeholder="alan@example.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" value={cvData.personal.phone} onChange={e => handlePersonalChange('phone', e.target.value)} placeholder="+1 234 567 890" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>LinkedIn URL</label>
            <input type="text" value={cvData.personal.linkedin} onChange={e => handlePersonalChange('linkedin', e.target.value)} placeholder="linkedin.com/in/alanturing" />
          </div>
          <div className="form-group">
            <label>Portfolio/Website URL</label>
            <input type="text" value={cvData.personal.portfolio} onChange={e => handlePersonalChange('portfolio', e.target.value)} placeholder="alanturing.dev" />
          </div>
        </div>
      </div>

      <h2 className="section-title">Letter Details</h2>
      <div className="glass-panel form-section-panel">
        <div className="form-row">
          <div className="form-group">
            <label>Recipient Name / Hiring Manager</label>
            <input
              type="text"
              value={coverLetter.recipientName || ''}
              onChange={e => handleChange('recipientName', e.target.value)}
              placeholder="e.g. Sarah Jenkins, Head of Engineering"
            />
          </div>
          <div className="form-group">
            <label>Company / Organization</label>
            <input
              type="text"
              value={coverLetter.companyName || ''}
              onChange={e => handleChange('companyName', e.target.value)}
              placeholder="e.g. Tech Innovators Inc."
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Position Applied For</label>
            <input
              type="text"
              value={coverLetter.position || ''}
              onChange={e => handleChange('position', e.target.value)}
              placeholder="e.g. Junior Software Engineer (optional)"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="text"
              value={coverLetter.date || ''}
              onChange={e => handleChange('date', e.target.value)}
              placeholder="e.g. June 16, 2026"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Greeting</label>
            <select value={coverLetter.greeting || 'Dear'} onChange={e => handleChange('greeting', e.target.value)}>
              <option value="Dear">Dear</option>
              <option value="Hello">Hello</option>
              <option value="To">To</option>
              <option value="Respected">Respected</option>
            </select>
          </div>
          <div className="form-group">
            <label>Closing / Sign-off</label>
            <select value={coverLetter.closing || 'Sincerely'} onChange={e => handleChange('closing', e.target.value)}>
              <option value="Sincerely">Sincerely</option>
              <option value="Best regards">Best regards</option>
              <option value="Kind regards">Kind regards</option>
              <option value="Yours faithfully">Yours faithfully</option>
              <option value="Respectfully">Respectfully</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
          <label>Letter Body</label>
          <AICoverLetterButton
            cvData={cvData}
            onResult={(html) => handleChange('body', html)}
          />
          <div style={{ minHeight: '300px' }}>
            <RichTextEditor
              value={coverLetter.body}
              onChange={(val) => handleChange('body', val)}
              placeholder="Write your cover letter here, or click Generate with AI above…"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterForm;
