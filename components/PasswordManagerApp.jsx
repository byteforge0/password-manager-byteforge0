'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Plus,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Download,
  Upload,
  LogOut,
  RefreshCw,
  Globe,
  User,
} from 'lucide-react';
import { AUTO_LOCK_MS, loadStoredVault, saveStoredVault } from '@/lib/storage';
import {
  decryptVault,
  encryptVault,
  generatePassword,
  getPasswordStrength,
  PBKDF2_ITERATIONS,
} from '@/lib/crypto';
import Toast from '@/components/Toast';
import StrengthBar from '@/components/StrengthBar';

const emptyEntry = {
  id: '',
  title: '',
  username: '',
  password: '',
  website: '',
  notes: '',
  category: 'General',
};

const categories = ['General', 'Work', 'Social', 'Finance', 'Shopping', 'Developer', 'Other'];

export default function PasswordManagerApp() {
  const [mode, setMode] = useState('loading');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [showMaster, setShowMaster] = useState(false);
  const [showVaultPasswords, setShowVaultPasswords] = useState({});
  const [form, setForm] = useState(emptyEntry);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [storedMeta, setStoredMeta] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const timerRef = useRef(null);

  const pushToast = (message, type = 'info') => setToast({ message, type, id: crypto.randomUUID() });

  useEffect(() => {
    const vault = loadStoredVault();
    if (!vault) {
      setMode('setup');
      return;
    }
    setStoredMeta(vault);
    setLastSaved(vault.updatedAt || '');
    setMode('unlock');
  }, []);

  useEffect(() => {
    if (!toast?.message) return;
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const lockVault = (showNotice = false) => {
    setEntries([]);
    setSelectedId(null);
    setForm(emptyEntry);
    setShowVaultPasswords({});
    setMasterPassword('');
    setConfirmPassword('');
    setMode(storedMeta ? 'unlock' : 'setup');
    if (showNotice) pushToast('Vault auto-locked after inactivity', 'info');
  };

  const resetIdleTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (mode !== 'vault') return;
    timerRef.current = setTimeout(() => {
      lockVault(true);
    }, AUTO_LOCK_MS);
  };

  useEffect(() => {
    if (mode !== 'vault') return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const onActivity = () => resetIdleTimer();
    resetIdleTimer();
    events.forEach((event) => window.addEventListener(event, onActivity));

    return () => {
      events.forEach((event) => window.removeEventListener(event, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode]);

  async function persist(nextEntries, passwordOverride) {
    const passwordToUse = passwordOverride || masterPassword;
    if (!passwordToUse) return;

    setIsSaving(true);
    setError('');

    try {
      const encrypted = await encryptVault(passwordToUse, nextEntries, storedMeta?.salt);
      saveStoredVault(encrypted);
      setStoredMeta(encrypted);
      setLastSaved(encrypted.updatedAt);
    } catch {
      setError('Saving failed. Please try again.');
      pushToast('Saving failed', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateVault() {
    setError('');
    if (!masterPassword || masterPassword.length < 10) {
      setError('Use a master password with at least 10 characters.');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError('Master passwords do not match.');
      return;
    }

    const starterEntries = [];
    await persist(starterEntries, masterPassword);
    setEntries(starterEntries);
    setMode('vault');
    pushToast('Encrypted vault created', 'success');
  }

  async function handleUnlock() {
    setError('');
    try {
      const stored = loadStoredVault();
      if (!stored) throw new Error('Vault missing');
      const vault = await decryptVault(masterPassword, stored);
      setEntries(vault.entries || []);
      setStoredMeta(stored);
      setLastSaved(stored.updatedAt || '');
      setMode('vault');
      pushToast('Vault unlocked', 'success');
    } catch {
      setError('Wrong password or corrupted local vault.');
      pushToast('Unlock failed', 'error');
    }
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) =>
      [entry.title, entry.username, entry.website, entry.category, entry.notes].join(' ').toLowerCase().includes(q)
    );
  }, [entries, search]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedId) || null,
    [entries, selectedId]
  );

  useEffect(() => {
    if (selectedEntry) {
      setForm(selectedEntry);
    } else {
      setForm(emptyEntry);
    }
  }, [selectedEntry]);

  async function addOrUpdateEntry() {
    setError('');
    if (!form.title || !form.username || !form.password) {
      setError('Title, username and password are required.');
      return;
    }

    const entry = {
      ...form,
      id: form.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };

    const exists = entries.some((item) => item.id === entry.id);
    const nextEntries = exists
      ? entries.map((item) => (item.id === entry.id ? entry : item))
      : [entry, ...entries];

    setEntries(nextEntries);
    setSelectedId(entry.id);
    await persist(nextEntries);
    pushToast(exists ? 'Entry updated' : 'Entry added', 'success');
  }

  async function deleteEntry(id) {
    const nextEntries = entries.filter((entry) => entry.id !== id);
    setEntries(nextEntries);
    if (selectedId === id) setSelectedId(null);
    await persist(nextEntries);
    pushToast('Entry deleted', 'success');
  }

  async function copyText(text, label) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    pushToast(label, 'success');
  }

  function exportVault() {
    const raw = localStorage.getItem('yazen_password_manager_v2');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast('Encrypted backup exported', 'success');
  }

  function importVault(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.salt || !parsed.iv || !parsed.ciphertext) throw new Error('Invalid');
        saveStoredVault(parsed);
        setStoredMeta(parsed);
        setEntries([]);
        setSelectedId(null);
        setMode('unlock');
        pushToast('Encrypted vault imported', 'success');
      } catch {
        setError('Import failed. Invalid backup file.');
        pushToast('Import failed', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function resetFormToNew() {
    setSelectedId(null);
    setForm({ ...emptyEntry, password: generatePassword(18) });
  }

  const stats = {
    total: entries.length,
    categories: new Set(entries.map((entry) => entry.category).filter(Boolean)).size,
    weak: entries.filter((entry) => getPasswordStrength(entry.password).label === 'Weak').length,
  };

  const strength = getPasswordStrength(form.password || '');

  return (
    <div className="page-shell">
      <div className="page-glow" />
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero"
        >
          <div>
            <div className="pill">
              <Shield size={16} />
              Local encrypted vault
            </div>
            <h1>Password Manager</h1>
            <p>
              A smooth local-first vault with browser-side encryption, auto-lock after inactivity, and zero backend.
            </p>
          </div>
          {mode === 'vault' ? (
            <div className="hero-actions">
              <button className="secondary-btn" onClick={exportVault}><Download size={16} /> Export</button>
              <label className="secondary-btn file-btn">
                <Upload size={16} /> Import
                <input type="file" accept="application/json" onChange={importVault} hidden />
              </label>
              <button className="danger-btn" onClick={() => lockVault(false)}><LogOut size={16} /> Lock</button>
            </div>
          ) : null}
        </motion.div>

        <AnimatePresence mode="wait">
          {(mode === 'setup' || mode === 'unlock') && (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="auth-wrap"
            >
              <section className="card auth-card">
                <div className="card-header">
                  <h2>{mode === 'setup' ? 'Create your vault' : 'Unlock your vault'}</h2>
                  <p>
                    {mode === 'setup'
                      ? 'Your vault is encrypted locally before it is saved in the browser.'
                      : 'Enter your master password to decrypt your entries locally.'}
                  </p>
                </div>

                <div className="field">
                  <label>Master password</label>
                  <div className="input-icon-wrap">
                    <input
                      type={showMaster ? 'text' : 'password'}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Enter your master password"
                    />
                    <button className="icon-btn" onClick={() => setShowMaster((value) => !value)}>
                      {showMaster ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'setup' ? (
                  <div className="field">
                    <label>Confirm master password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm master password"
                    />
                  </div>
                ) : null}

                <div className="info-box">
                  Encryption uses <strong>PBKDF2 ({PBKDF2_ITERATIONS.toLocaleString()} iterations)</strong> to derive the key and <strong>AES-GCM 256-bit</strong> to encrypt the vault.
                </div>

                {error ? <p className="error-text">{error}</p> : null}

                <button className="primary-btn wide-btn" onClick={mode === 'setup' ? handleCreateVault : handleUnlock}>
                  <Lock size={16} />
                  {mode === 'setup' ? 'Create encrypted vault' : 'Unlock vault'}
                </button>
              </section>
            </motion.div>
          )}

          {mode === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="vault-grid"
            >
              <section className="card side-panel">
                <div className="card-header">
                  <h2>Vault overview</h2>
                  <p>Auto-lock activates after 2 minutes without activity.</p>
                </div>
                <div className="stats-grid">
                  <div className="stat-box"><span>Entries</span><strong>{stats.total}</strong></div>
                  <div className="stat-box"><span>Categories</span><strong>{stats.categories}</strong></div>
                  <div className="stat-box"><span>Weak</span><strong>{stats.weak}</strong></div>
                </div>
                <div className="actions-stack">
                  <button className="primary-btn wide-btn" onClick={resetFormToNew}><Plus size={16} /> New entry</button>
                  <button className="secondary-btn wide-btn" onClick={() => {
                    setForm((current) => ({ ...current, password: generatePassword(20) }));
                    pushToast('Generated a secure password', 'success');
                  }}><RefreshCw size={16} /> Generate password</button>
                  <p className="muted-small">Last saved: {lastSaved ? new Date(lastSaved).toLocaleString() : 'Not saved yet'}</p>
                  {isSaving ? <p className="saving-text">Saving encrypted vault…</p> : null}
                </div>
              </section>

              <section className="card entries-panel">
                <div className="card-header header-row">
                  <div>
                    <h2>Stored entries</h2>
                    <p>Search, preview and manage your saved logins.</p>
                  </div>
                  <div className="search-wrap">
                    <Search size={16} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search entries"
                    />
                  </div>
                </div>

                <div className="entry-list">
                  {filteredEntries.length === 0 ? (
                    <div className="empty-state">No entries yet. Create your first one.</div>
                  ) : null}
                  {filteredEntries.map((entry) => {
                    const currentStrength = getPasswordStrength(entry.password);
                    const revealed = Boolean(showVaultPasswords[entry.id]);
                    return (
                      <button
                        key={entry.id}
                        className={`entry-card ${selectedId === entry.id ? 'entry-card-active' : ''}`}
                        onClick={() => setSelectedId(entry.id)}
                      >
                        <div className="entry-card-head">
                          <div>
                            <strong>{entry.title}</strong>
                            <p>{entry.username}</p>
                          </div>
                          <span className={`mini-badge ${currentStrength.tone}`}>{currentStrength.label}</span>
                        </div>
                        <div className="entry-card-meta">
                          <span>{entry.website || 'No website'}</span>
                          <span className="entry-toggle" onClick={(e) => {
                            e.stopPropagation();
                            setShowVaultPasswords((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }));
                          }}>
                            {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                          </span>
                        </div>
                        <code>{revealed ? entry.password : '••••••••••••••••'}</code>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="card form-panel">
                <div className="card-header">
                  <h2>{selectedId ? 'Edit entry' : 'Create entry'}</h2>
                  <p>Save credentials securely into the encrypted local vault.</p>
                </div>

                <div className="form-grid two-col">
                  <div className="field">
                    <label>Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="GitHub"
                    />
                  </div>
                  <div className="field">
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Username / Email</label>
                  <div className="copy-row">
                    <div className="leading-icon-field">
                      <User size={16} />
                      <input
                        value={form.username}
                        onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))}
                        placeholder="name@example.com"
                      />
                    </div>
                    <button className="secondary-btn icon-only" onClick={() => copyText(form.username, 'Username copied')}><Copy size={16} /></button>
                  </div>
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="copy-row">
                    <input
                      value={form.password}
                      onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                      placeholder="Strong password"
                    />
                    <button className="secondary-btn icon-only" onClick={() => setForm((current) => ({ ...current, password: generatePassword(20) }))}><KeyRound size={16} /></button>
                    <button className="secondary-btn icon-only" onClick={() => copyText(form.password, 'Password copied')}><Copy size={16} /></button>
                  </div>
                  {form.password ? <StrengthBar strength={strength} /> : null}
                </div>

                <div className="field">
                  <label>Website</label>
                  <div className="copy-row">
                    <div className="leading-icon-field">
                      <Globe size={16} />
                      <input
                        value={form.website}
                        onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
                        placeholder="https://example.com"
                      />
                    </div>
                    <button className="secondary-btn icon-only" onClick={() => copyText(form.website, 'Website copied')}><Copy size={16} /></button>
                  </div>
                </div>

                <div className="field">
                  <label>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                    placeholder="Recovery codes, hints, extra info"
                  />
                </div>

                {error ? <p className="error-text">{error}</p> : null}

                <div className="form-actions">
                  <button className="primary-btn" onClick={addOrUpdateEntry}>{selectedId ? 'Save changes' : 'Add entry'}</button>
                  <button className="secondary-btn" onClick={resetFormToNew}>New blank entry</button>
                  {selectedId ? <button className="danger-btn" onClick={() => deleteEntry(selectedId)}><Trash2 size={16} /> Delete</button> : null}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
