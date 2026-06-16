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

    // Geometry is expressed as flow-offset from the container's content-box top
    // (the container supplies the first page's top margin via padding-top).
    //   - Each page's usable content height = pageHeightPx - 2*pageMargin.
    //   - Moving to the next page costs: bottom margin of this page + visual gap +
    //     top margin of the next page  =  2*pageMargin + pageGap.
    const usable = pageHeightPx - pageMargin * 2;
    const pageStep = usable + pageMargin * 2 + pageGap;
    const pageFlowTop = (p) => p * pageStep;            // content top of page p (flow coords)
    const pageFlowBottom = (p) => p * pageStep + usable; // content bottom of page p

    let page = 0;
    let cursor = 0; // flow offset of the next block's content-box top

    blocks.forEach((block, idx) => {
      const { height, mt, mb } = metrics[idx];
      const forceBreak = block.hasAttribute('data-block-break');

      // A heading kept with the next block: test the combined height so it never
      // sits orphaned at a page bottom.
      let neededH = height;
      if (block.hasAttribute('data-keep-with-next') && idx + 1 < blocks.length) {
        neededH += metrics[idx + 1].mt + metrics[idx + 1].height;
      }

      const atPageTop = Math.abs(cursor - pageFlowTop(page)) < 1;

      if (idx === 0) {
        block.style.marginTop = '0px';
      } else if ((forceBreak || cursor + mt + neededH > pageFlowBottom(page) + 0.5) && !atPageTop) {
        // Push this block to the top of the next page.
        page += 1;
        const newTop = pageFlowTop(page);
        block.style.marginTop = `${newTop - cursor}px`;
        cursor = newTop + height + mb;
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

  // Re-run when fonts finish loading or a block's intrinsic size changes (images,
  // async fonts, edits). Coalesced via rAF; we observe only the blocks' content
  // boxes (not the container) so our own margin-top writes don't re-trigger it.
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => layout());
    };

    const ro = new ResizeObserver(schedule);
    Array.from(container.querySelectorAll(':scope > [data-block]')).forEach(c => ro.observe(c));

    let cancelled = false;
    if (document.fonts?.ready) document.fonts.ready.then(() => { if (!cancelled) schedule(); });

    return () => { cancelled = true; cancelAnimationFrame(frame); ro.disconnect(); };
  }, [contentRef, layout]);

  return { numPages, recalc: layout };
};
