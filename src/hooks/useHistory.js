import { useRef, useState, useEffect, useCallback } from 'react';

// Tracks an undo/redo timeline for a (cvData, settings) snapshot pair.
//
// It debounces rapid edits into single history entries, and uses an "applying"
// guard so that restoring a snapshot via undo/redo doesn't get recorded as a new
// edit (which would otherwise create a feedback loop / wipe the redo stack).
//
// `key` identifies the active profile — when it changes we reset the timeline so
// undo never crosses from one profile into another.
export const useHistory = ({ cvData, settings, setCvData, setSettings, key, debounceMs = 600 }) => {
  const past = useRef([]);
  const future = useRef([]);
  const applying = useRef(false);
  const debounceTimer = useRef(null);
  const lastSnapshot = useRef(null);
  const lastKey = useRef(key);

  const [counts, setCounts] = useState({ canUndo: false, canRedo: false });

  const syncCounts = useCallback(() => {
    setCounts({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });
  }, []);

  const snapshotOf = useCallback(() => JSON.stringify({ cvData, settings }), [cvData, settings]);

  // Reset timeline when the active profile changes.
  useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key;
      past.current = [];
      future.current = [];
      lastSnapshot.current = snapshotOf();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      syncCounts();
    }
  }, [key, snapshotOf, syncCounts]);

  // Record edits (debounced) into the past stack.
  useEffect(() => {
    const current = snapshotOf();

    // First run for this profile: establish a baseline without recording.
    if (lastSnapshot.current === null) {
      lastSnapshot.current = current;
      return;
    }

    // Ignore programmatic restores triggered by undo/redo.
    if (applying.current) {
      applying.current = false;
      lastSnapshot.current = current;
      return;
    }

    if (current === lastSnapshot.current) return;

    const previous = lastSnapshot.current;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      past.current.push(previous);
      if (past.current.length > 50) past.current.shift();
      future.current = []; // a fresh edit invalidates the redo stack
      syncCounts();
    }, debounceMs);

    lastSnapshot.current = current;
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [snapshotOf, debounceMs, syncCounts]);

  const restore = useCallback((snapshotStr) => {
    try {
      const snap = JSON.parse(snapshotStr);
      applying.current = true;
      setCvData(snap.cvData);
      setSettings(snap.settings);
    } catch (e) {
      console.error('Failed to restore history snapshot:', e);
    }
  }, [setCvData, setSettings]);

  const undo = useCallback(() => {
    // Flush any pending debounce so the very latest edit is undoable.
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (past.current.length === 0) return;
    const current = snapshotOf();
    const prev = past.current.pop();
    future.current.push(current);
    restore(prev);
    syncCounts();
  }, [snapshotOf, restore, syncCounts]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const current = snapshotOf();
    const next = future.current.pop();
    past.current.push(current);
    restore(next);
    syncCounts();
  }, [snapshotOf, restore, syncCounts]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo.
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      // Don't hijack undo inside the rich-text contenteditable editors.
      const target = e.target;
      const inEditor = target?.closest?.('.wysiwyg-editor-area, input, textarea');
      if (inEditor) return;

      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { undo, redo, canUndo: counts.canUndo, canRedo: counts.canRedo };
};
