import { useRef, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { legacyToHtml } from '../utils/richText';
import './MarkdownToolbar.css'; // We'll reuse the toolbar styles for now

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);

  // We only set innerHTML on mount or when the external value changes
  // substantially (e.g. loading a different CV) — not on every keystroke, which
  // would reset the caret. Legacy markdown values are converted to HTML first so
  // the editor shows formatted text instead of raw `**asterisks**`.
  useEffect(() => {
    if (!editorRef.current) return;
    const html = legacyToHtml(value);
    if (html !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = html;
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    let html = editorRef.current.innerHTML;
    // Normalize "empty" content (contenteditable often leaves <br> or empty tags)
    // so the placeholder shows and we don't persist junk.
    if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') html = '';
    onChange(html);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const handleAction = (e, action, value = null) => {
    e.preventDefault(); // prevent losing focus
    execCommand(action, value);
  };

  return (
    <div className="wysiwyg-container" style={{ border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', background: '#1e293b' }}>
      <div className="md-toolbar" style={{ borderBottom: '1px solid #334155', borderRadius: 0, flexWrap: 'wrap' }}>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'bold')} title="Bold (Ctrl+B)">B</button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'italic')} title="Italic (Ctrl+I)" style={{fontStyle: 'italic'}}>I</button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'underline')} title="Underline (Ctrl+U)" style={{textDecoration: 'underline'}}>U</button>
        
        <div className="md-divider"></div>
        
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'justifyLeft')} title="Align Left"><AlignLeft size={14} /></button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'justifyCenter')} title="Align Center"><AlignCenter size={14} /></button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'justifyRight')} title="Align Right"><AlignRight size={14} /></button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'justifyFull')} title="Justify"><AlignJustify size={14} /></button>

        <div className="md-divider"></div>
        
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'insertUnorderedList')} title="Bullet List">• List</button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'insertOrderedList')} title="Numbered List">1. List</button>
        
        <div className="md-divider"></div>
        
        <button type="button" className="md-btn" onMouseDown={(e) => {
          e.preventDefault();
          const url = prompt("Enter link URL:");
          if (url) execCommand('createLink', url);
        }} title="Insert Link">🔗</button>
        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'unlink')} title="Remove Link">🚫</button>

        <div className="md-divider"></div>

        <button type="button" className="md-btn" onMouseDown={(e) => handleAction(e, 'removeFormat')} title="Clear formatting">⌫ Clear</button>
      </div>
      
      <div 
        ref={editorRef}
        className="wysiwyg-editor-area"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{
          minHeight: '100px',
          padding: '12px',
          color: '#e2e8f0',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
