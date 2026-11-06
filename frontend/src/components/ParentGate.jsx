import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Owl } from './Mascots';
import { ErrorNote } from './ui';
import { useAuth } from '../context/AuthContext';

// Asks for the account password before showing grown-up areas.
export default function ParentGate({ onUnlocked, onCancel, title = 'Grown-ups only' }) {
  const { unlockParent } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const token = await unlockParent(password);
      onUnlocked?.(token);
    } catch (err) {
      setError(err.status === 401 ? 'That password is not right. Please try again.' : err.message);
      setBusy(false);
    }
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card mx-auto w-full max-w-md p-6 text-center sm:p-8"
    >
      <div className="relative mx-auto w-24">
        <Owl />
        <span className="absolute -right-2 bottom-0 grid h-10 w-10 place-items-center rounded-full bg-jungle-800 text-sunny shadow-lg"><Lock size={18} /></span>
      </div>
      <h1 className="mt-4 text-3xl font-bold text-jungle-900">{title}</h1>
      <p className="mt-1 text-muted">Please enter the account password to continue.</p>
      <label className="mt-6 block text-left">
        <span className="label">Parent password</span>
        <input className="input" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
      <button className="btn-dark mt-5 w-full py-4" disabled={busy}>{busy ? 'Checking...' : 'Unlock'}</button>
      {onCancel && <button type="button" onClick={onCancel} className="btn-ghost mt-2 w-full">Go back</button>}
    </motion.form>
  );
}
