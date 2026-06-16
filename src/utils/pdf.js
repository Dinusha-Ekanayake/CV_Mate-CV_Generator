// One-click PDF download for the browser. html2pdf is heavy (html2canvas + jsPDF),
// so it's lazy-imported only when the user actually clicks download — keeping it
// out of the initial bundle.
//
// Note: the browser Print dialog ("Print / PDF") still produces the highest-quality,
// vector-text PDF and respects print CSS / page breaks. This is the convenience path.
export const downloadPdf = async ({ fileName = 'My_CV.pdf' } = {}) => {
  const node = document.querySelector('.cv-preview-container');
  if (!node) {
    window.print();
    return;
  }

  const { default: html2pdf } = await import('html2pdf.js');

  // Temporarily neutralize the on-screen zoom transform so the capture is 1:1.
  const paper = node.closest('.scalable-paper');
  const prevTransform = paper?.style.transform;
  if (paper) paper.style.transform = 'none';

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      })
      .from(node)
      .save();
  } finally {
    if (paper) paper.style.transform = prevTransform || '';
  }
};
