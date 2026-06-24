import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Copy, Pencil, Trash2, Check, FileText, X } from 'lucide-react';
import './ProfileSwitcher.css';

const ProfileSwitcher = ({
  profiles,
  activeProfileId,
  onSelect,
  onAdd,
  onRename,
  onDuplicate,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const rootRef = useRef(null);
  const newInputRef = useRef(null);

  const active = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setEditingId(null);
        setAddingNew(false);
        setNewProfileName('');
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (addingNew) { setAddingNew(false); setNewProfileName(''); }
        else { setOpen(false); setEditingId(null); }
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, addingNew]);

  // Focus the new-profile input when it appears
  useEffect(() => {
    if (addingNew && newInputRef.current) newInputRef.current.focus();
  }, [addingNew]);

  const commitNewProfile = () => {
    const name = newProfileName.trim();
    if (name) { onAdd(name); setOpen(false); }
    setAddingNew(false);
    setNewProfileName('');
  };

  const startEditing = (profile) => {
    setEditingId(profile.id);
    setDraftName(profile.name);
  };

  const commitRename = () => {
    if (editingId) onRename(editingId, draftName);
    setEditingId(null);
  };

  return (
    <div className="profile-switcher" ref={rootRef}>
      <button
        className="profile-trigger"
        onClick={() => setOpen(o => !o)}
        title="Switch CV profile"
      >
        <FileText size={14} color="#60a5fa" />
        <span className="profile-trigger-name">{active?.name || 'My CV'}</span>
        <ChevronDown size={14} className={`profile-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            Profiles <span className="profile-count">{profiles.length}</span>
          </div>

          <div className="profile-list">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`profile-item ${profile.id === activeProfileId ? 'active' : ''}`}
              >
                {editingId === profile.id ? (
                  <input
                    className="profile-rename-input"
                    value={draftName}
                    autoFocus
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={commitRename}
                  />
                ) : (
                  <button
                    className="profile-name-btn"
                    onClick={() => { onSelect(profile.id); setOpen(false); }}
                  >
                    {profile.id === activeProfileId && <Check size={14} className="profile-check" />}
                    <span className="profile-name-text">{profile.name}</span>
                  </button>
                )}

                <div className="profile-actions">
                  <button title="Rename" onClick={() => startEditing(profile)}><Pencil size={13} /></button>
                  <button title="Duplicate" onClick={() => { onDuplicate(profile.id); setOpen(false); }}><Copy size={13} /></button>
                  <button
                    title={profiles.length <= 1 ? 'Cannot delete the only profile' : 'Delete'}
                    disabled={profiles.length <= 1}
                    className="profile-delete"
                    onClick={() => {
                      if (window.confirm(`Delete profile "${profile.name}"? This cannot be undone.`)) {
                        onDelete(profile.id);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {addingNew ? (
            <div className="profile-add-row">
              <input
                ref={newInputRef}
                className="profile-rename-input profile-new-input"
                placeholder="Profile name…"
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitNewProfile();
                  if (e.key === 'Escape') { setAddingNew(false); setNewProfileName(''); }
                }}
              />
              <button className="profile-add-confirm" onClick={commitNewProfile} title="Create profile">
                <Check size={14} />
              </button>
              <button className="profile-add-cancel" onClick={() => { setAddingNew(false); setNewProfileName(''); }} title="Cancel">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button className="profile-add" onClick={() => setAddingNew(true)}>
              <Plus size={14} /> New profile
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSwitcher;
