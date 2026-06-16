// Safe unique-id generator.
// crypto.randomUUID() is only available in secure contexts (https/localhost).
// Electron file:// loads and older/embedded webviews may not expose it, so fall back.
export const safeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};
