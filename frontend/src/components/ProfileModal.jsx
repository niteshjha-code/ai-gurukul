import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import AvatarPicker from './AvatarPicker';
import { ErrorNote } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const EMPTY = { childName: '', age: 8, grade: '', avatar: 'lion' };

// Add or edit a child profile. `onSubmit` receives the cleaned form values.
export function ChildFormModal({ open, title, initial, submitLabel = 'Save changes', onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial, grade: initial?.grade ?? '' });
    setError('');
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onClose]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({ childName: form.childName, age: Number(form.age), grade: form.grade, avatar: form.avatar });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-jungle-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-white p-6 sm:rounded-[32px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="child-form-title"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="child-form-title" className="text-2xl font-semibold text-jungle-800">{title}</h2>
              <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-mint" aria-label="Close"><X /></button>
            </div>
            <AvatarPicker value={form.avatar} onChange={(avatar) => setForm({ ...form, avatar })} />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="sm:col-span-3">
                <span className="label">Explorer's first name</span>
                <input className="input" value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} required maxLength={40} autoFocus={!initial?.childName} />
              </label>
              <label>
                <span className="label">Age</span>
                <select className="input" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}>
                  {Array.from({ length: 14 }, (_, i) => i + 3).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="label">Grade / class</span>
                <input className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} maxLength={20} placeholder="e.g. 3" />
              </label>
            </div>
            <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
            <button className="btn-primary mt-6 w-full" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// The signed-in child editing their own profile.
export default function ProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  return (
    <ChildFormModal
      open={open}
      title="Edit profile"
      initial={user}
      onClose={onClose}
      onSubmit={async (values) => {
        await updateProfile(values);
        toast({ title: 'Profile saved!', emoji: '✅' });
      }}
    />
  );
}
