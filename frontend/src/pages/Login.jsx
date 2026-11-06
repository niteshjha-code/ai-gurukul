import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { ErrorNote } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await login(form.email, form.password);
      navigate(next === '/dashboard' && location.state?.from ? location.state.from : next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back!"
      subtitle="Your jungle friends missed you."
      side={{ title: 'Your adventure continues here.', text: 'Pick up where you left off: new stories, quizzes and badges are waiting.' }}
    >
      <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
        <label className="block">
          <span className="label">Email</span>
          <input className="input" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="parent@example.com" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <span className="relative block">
            <input className="input pr-12" type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>
        <ErrorNote>{error}</ErrorNote>
        <button className="btn-primary w-full py-4 text-lg" disabled={busy}>
          {busy ? 'Opening the jungle gate...' : <>Log in <LogIn size={20} /></>}
        </button>
        <p className="text-center text-muted">
          New here? <Link to="/register" className="font-extrabold text-jungle-800 underline decoration-leaf decoration-4 underline-offset-4">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
