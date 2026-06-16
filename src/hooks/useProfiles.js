import { useState, useCallback, useMemo } from 'react';
import { safeId } from '../utils/id';
import { hydrateData, hydrateSettings, initialData, defaultSettings } from '../data/cvDefaults';

const STORAGE_KEY = 'cvProfiles';
const LEGACY_DATA_KEY = 'cvData';
const LEGACY_SETTINGS_KEY = 'cvSettings';

const makeProfile = (name, cvData = initialData, settings = defaultSettings) => ({
  id: safeId(),
  name,
  cvData: hydrateData(cvData),
  settings: hydrateSettings(settings)
});

// Normalize any persisted/cloud shape into { profiles, activeProfileId }.
// Accepts the new multi-profile shape, or migrates the old single-document shape.
export const normalizeProfilesState = (raw) => {
  // New shape
  if (raw && Array.isArray(raw.profiles) && raw.profiles.length > 0) {
    const profiles = raw.profiles.map(p => ({
      id: p.id || safeId(),
      name: p.name || 'Untitled',
      cvData: hydrateData(p.cvData),
      settings: hydrateSettings(p.settings)
    }));
    const activeProfileId = profiles.some(p => p.id === raw.activeProfileId)
      ? raw.activeProfileId
      : profiles[0].id;
    return { profiles, activeProfileId };
  }

  // Legacy single-document shape: { cvData, settings }
  if (raw && (raw.cvData || raw.settings)) {
    const profile = makeProfile('My CV', raw.cvData || initialData, raw.settings || defaultSettings);
    return { profiles: [profile], activeProfileId: profile.id };
  }

  return null;
};

const loadInitialState = () => {
  // 1) Try the new profiles store.
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const normalized = normalizeProfilesState(JSON.parse(saved));
      if (normalized) return normalized;
    }
  } catch { /* ignore corrupt store */ }

  // 2) Migrate from the legacy single-CV keys, if present.
  try {
    const legacyData = localStorage.getItem(LEGACY_DATA_KEY);
    const legacySettings = localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (legacyData || legacySettings) {
      const profile = makeProfile(
        'My CV',
        legacyData ? JSON.parse(legacyData) : initialData,
        legacySettings ? JSON.parse(legacySettings) : defaultSettings
      );
      return { profiles: [profile], activeProfileId: profile.id };
    }
  } catch { /* ignore */ }

  // 3) Fresh start.
  const profile = makeProfile('My CV');
  return { profiles: [profile], activeProfileId: profile.id };
};

export const useProfiles = () => {
  const [{ profiles, activeProfileId }, setState] = useState(loadInitialState);

  const activeProfile = useMemo(
    () => profiles.find(p => p.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId]
  );

  // Persist to localStorage on every change.
  const persist = useCallback((next) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Local storage error:', error);
    }
    return next;
  }, []);

  const updateActiveProfile = useCallback((mutator) => {
    setState(prev => persist({
      ...prev,
      profiles: prev.profiles.map(p =>
        p.id === prev.activeProfileId ? { ...p, ...mutator(p) } : p
      )
    }));
  }, [persist]);

  // cvData / settings setters mirror React's useState signature (value or updater)
  // so existing child components work unchanged.
  const setCvData = useCallback((valueOrFn) => {
    updateActiveProfile(p => ({
      cvData: typeof valueOrFn === 'function' ? valueOrFn(p.cvData) : valueOrFn
    }));
  }, [updateActiveProfile]);

  const setSettings = useCallback((valueOrFn) => {
    updateActiveProfile(p => ({
      settings: typeof valueOrFn === 'function' ? valueOrFn(p.settings) : valueOrFn
    }));
  }, [updateActiveProfile]);

  const selectProfile = useCallback((id) => {
    setState(prev => persist({ ...prev, activeProfileId: id }));
  }, [persist]);

  const addProfile = useCallback((name = 'New CV') => {
    const profile = makeProfile(name);
    setState(prev => persist({
      profiles: [...prev.profiles, profile],
      activeProfileId: profile.id
    }));
    return profile.id;
  }, [persist]);

  const duplicateProfile = useCallback((id) => {
    setState(prev => {
      const src = prev.profiles.find(p => p.id === id);
      if (!src) return prev;
      const copy = {
        id: safeId(),
        name: `${src.name} (Copy)`,
        cvData: JSON.parse(JSON.stringify(src.cvData)),
        settings: JSON.parse(JSON.stringify(src.settings))
      };
      return persist({
        profiles: [...prev.profiles, copy],
        activeProfileId: copy.id
      });
    });
  }, [persist]);

  const renameProfile = useCallback((id, name) => {
    const clean = (name || '').trim();
    if (!clean) return;
    setState(prev => persist({
      ...prev,
      profiles: prev.profiles.map(p => (p.id === id ? { ...p, name: clean } : p))
    }));
  }, [persist]);

  const deleteProfile = useCallback((id) => {
    setState(prev => {
      if (prev.profiles.length <= 1) return prev; // never delete the last profile
      const remaining = prev.profiles.filter(p => p.id !== id);
      const activeProfileId = prev.activeProfileId === id
        ? remaining[0].id
        : prev.activeProfileId;
      return persist({ profiles: remaining, activeProfileId });
    });
  }, [persist]);

  // Replace the full state (used after a cloud load).
  const replaceAll = useCallback((normalized) => {
    if (!normalized) return;
    setState(persist(normalized));
  }, [persist]);

  return {
    profiles,
    activeProfileId,
    activeProfile,
    cvData: activeProfile.cvData,
    settings: activeProfile.settings,
    setCvData,
    setSettings,
    selectProfile,
    addProfile,
    duplicateProfile,
    renameProfile,
    deleteProfile,
    replaceAll,
    // raw state for cloud sync
    profilesState: { profiles, activeProfileId }
  };
};
