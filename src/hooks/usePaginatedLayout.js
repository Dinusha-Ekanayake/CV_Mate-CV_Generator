import { useEffect, useState, useCallback, useLayoutEffect } from 'react';

// Production paginator for the single-column resume layouts.
//
// It measures every top-level block (elements tagged with [data-block]) inside
// the content container and greedily packs them onto fixed-height A4 pages. When
// a block would overflow the current page it is pushed to the top of the next
// page via margin-top, so each page gets a genuine top/bottom margin and an
// inter-page gap — i.e. real on-screen pagination, matching how the PDF prints.
//
// A block tagged [data-block-break] always starts a new page (user page breaks).
//
// Returns { numPages, recalc }. The caller renders the page sheets from numPages.
export const usePaginatedLayout = ({
  contentRef,
  enabled,
  pageHeightPx,
  pageMargin,
  pageGap,
  deps = []
}) => {
  const [numPages, setNumPages] = useState(1);

  const layout = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    const blocks = Array.from(container.querySelectorAll(':scope > [data-block]'));

    // Disabled (e.g. two-column) or nothing to measure: reset margins, single page.
    if (!enabled || pageHeightPx <= 0 || blocks.length === 0) {
      blocks.forEach(b => { b.style.marginTop = ''; });
      const h = container.scrollHeight;
      setNumPages(Math.max(1, Math.ceil(h / Math.max(1, pageHeightPx))));
      return;
    }

    // Reset any prior inline offset, then measure each block's full vertical
    // footprint: layout height + its own top/bottom margins (offsetHeight excludes
    // margins, which previously caused the cursor to drift and leave gaps). These
    // are layout pixels, unaffected by the parent zoom transform.
    blocks.forEach(b => { b.style.marginTop = ''; });
    const metrics = blocks.map(b => {
      const cs = getComputedStyle(b);
      const mt = parseFloat(cs.marginTop) || 0;
      const mb = parseFloat(cs.marginBottom) || 0;
      return { height: b.offsetHeight, mt, mb };
    });

    let page = 0;            // current page index (0-based)
    let cursor = pageMargin; // running y-offset where the next block's content-box top sits

    const pageContentTop = (p) => p * (pageHeightPx + pageGap) + pageMargin;
    const pageContentBottom = (p) => p * (pageHeightPx + pageGap) + (pageHeightPx - pageMargin);

    blocks.forEach((block, idx) => {
      const { height, mt, mb } = metrics[idx];
      const forceBreak = block.hasAttribute('data-block-break');

      // A heading kept with the next block: test the combined height so it never
      // sits orphaned at a page bottom.
      let neededH = height;
      if (block.hasAttribute('data-keep-with-next') && idx + 1 < blocks.length) {
        neededH += metrics[idx + 1].mt + metrics[idx + 1].height;
      }

      const atPageTop = Math.abs(cursor - pageContentTop(page)) < 1;

      if (idx === 0) {
        // First block: push it down by the top page margin from the sheet top.
        block.style.marginTop = `${pageMargin}px`;
      } else if ((forceBreak || cursor + mt + neededH > pageContentBottom(page) + 0.5) && !atPageTop) {
        // Push to the top of the next page.
        page += 1;
        const newTop = pageContentTop(page);
        block.style.marginTop = `${newTop - cursor}px`;
        cursor = newTop;
        cursor += height + mb;
        return;
      } else {
        block.style.marginTop = `${mt}px`;
        cursor += mt;
      }

      cursor += height + mb;
    });

    setNumPages(page + 1);
  }, [contentRef, enabled, pageHeightPx, pageMargin, pageGap]);

  // Run after every layout-affecting change, synchronously before paint to avoid flicker.
  useLayoutEffect(() => {
    layout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, ...deps]);

  // Re-run when fonts finish loading or the container resizes (images, async fonts).
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => layout());
    // Observe children so intra-block growth (e.g. an image load) re-triggers.
    Array.from(container.children).forEach(c => ro.observe(c));
    ro.observe(container);

    if (document.fonts?.ready) document.fonts.ready.then(() => layout());

    return () => ro.disconnect();
  }, [contentRef, layout]);

  return { numPages, recalc: layout };
};
