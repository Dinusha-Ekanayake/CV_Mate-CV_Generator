// Converts the app's legacy markdown-ish text (used in older saved CVs and the
// bundled sample data) into HTML. Modern content is already HTML produced by the
// WYSIWYG editor and is returned untouched.
//
// Shared by RichTextEditor (so the editor shows formatted content, not raw
// asterisks) and CVPreview (so any still-legacy stored value renders correctly).
export const legacyToHtml = (text) => {
  if (!text) return '';

  // Already HTML — leave as-is.
  if (text.includes('<')) return text;

  const inline = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  const isBulletList = lines.every(l => l.startsWith('-'));
  if (isBulletList) {
    const lis = lines.map(line => `<li>${inline(line.replace(/^-\s?/, ''))}</li>`).join('');
    return `<ul>${lis}</ul>`;
  }
  return lines.map(inline).join('<br>');
};
