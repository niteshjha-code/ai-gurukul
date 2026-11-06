import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import AvatarPicker from '../components/AvatarPicker';
import { celebrate, ErrorNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ parentName: '', email: '', password: '', childName: '', age: '8', grade: '', avatar: 'lion', consent: false });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const next = (e) => {
    e.preventDefault();
    if (!form.parentName.trim()) return setError("Please enter the parent or guardian's name.");
    if (!EMAIL.test(form.email.trim())) return setError('Please enter a valid email address.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setError('');
    setStep(1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consent) return setError('A parent or guardian needs to tick the consent box.');
    setBusy(true);
    setError('');
    try {
      const user = await register({ ...form, age: Number(form.age) });
      celebrate();
      toast({ title: `Welcome, ${user.childName}!`, body: 'Your jungle adventure begins now.', emoji: '🎉' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      if (/email/i.test(err.message)) setStep(0);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Join the jungle!"
      subtitle={step === 0 ? 'Step 1 of 2: for the grown-up' : 'Step 2 of 2: for the young explorer'}
      side={{ title: 'Every great explorer starts with one step.', text: 'Create an account in under a minute. A parent or guardian sets it up, the child picks a buddy.' }}
    >
      <div className="mb-5 flex gap-2" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-2 flex-1 overflow-hidden rounded-full bg-jungle-800/10">
            <motion.div className="h-full bg-leaf" animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.form key="parent" onSubmit={next} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="card space-y-5 p-6 sm:p-8" noValidate>
            <label className="block">
              <span className="label">Parent / guardian name</span>
              <input className="input" autoComplete="name" value={form.parentName} onChange={set('parentName')} placeholder="e.g. Priya Sharma" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="parent@example.com" />
            </label>
            <label className="block">
              <span className="label">Password</span>
              <span className="relative block">
                <input className="input pr-12" type={show ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </span>
            </label>
            <ErrorNote>{error}</ErrorNote>
            <button className="btn-primary w-full py-4 text-lg">Next <ArrowRight size={20} /></button>
            <p className="text-center text-muted">
              Already have an account? <Link to="/login" className="font-extrabold text-jungle-800 underline decoration-leaf decoration-4 underline-offset-4">Log in</Link>
            </p>
          </motion.form>
        ) : (
          <motion.form key="child" onSubmit={submit} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="card space-y-5 p-6 sm:p-8">
            <AvatarPicker value={form.avatar} onChange={(avatar) => setForm({ ...form, avatar })} />
            <label className="block">
              <span className="label">Explorer's first name</span>
              <input className="input" required maxLength={40} value={form.childName} onChange={set('childName')} placeholder="e.g. Aarav" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="label">Age</span>
                <select className="input" value={form.age} onChange={set('age')}>
                  {Array.from({ length: 14 }, (_, i) => i + 3).map((a) => <option key={a} value={a}>{a} years</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Grade / class</span>
                <input className="input" maxLength={20} value={form.grade} onChange={set('grade')} placeholder="e.g. 3" />
              </label>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-mint p-4">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-jungle-800" checked={form.consent} onChange={set('consent')} />
              <span className="text-sm text-jungle-900">
                I am the parent or guardian of this child and I agree to them using AI Gurukul, including AI-generated content.
              </span>
            </label>
            <ErrorNote>{error}</ErrorNote>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setError(''); setStep(0); }} className="btn-light px-5" aria-label="Back"><ArrowLeft size={20} /></button>
              <button className="btn-primary flex-1 py-4 text-lg" disabled={busy}>
                {busy ? 'Planting your seed...' : <>Start the adventure <Sparkles size={20} /></>}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
