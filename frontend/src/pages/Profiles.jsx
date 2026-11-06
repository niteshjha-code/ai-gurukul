import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogOut, Plus, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { FallingLeaves } from '../components/JungleScene';
import { Avatar } from '../components/Mascots';
import { ChildFormModal } from '../components/ProfileModal';
import ParentGate from '../components/ParentGate';
import { ErrorNote, PageLoader } from '../components/ui';
import { useToast } from '../components/Toast';

const TILE_COLORS = ['#2BB8BA', '#F68B2F', '#56DB3A', '#8B5CF6', '#EC5B8E', '#FFD54A'];

// "Who's learning today?" - pick a child profile.
export default function Profiles() {
  const { user, parentToken, switchProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    api('/auth/profiles', { token: parentToken ?? undefined })
      .then((d) => setProfiles(d.profiles))
      .catch((err) => setError(err.message));
  }, [parentToken]);

  const pick = async (p) => {
    setBusyId(p.id);
    try {
      await switchProfile(p.id);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setBusyId(null);
    }
  };

  const addExplorer = async (values, token = parentToken) => {
    const d = await api('/parent/children', { method: 'POST', body: values, token });
    setProfiles((list) => [...list, d.profile]);
    toast({ title: `Welcome, ${d.profile.childName}!`, emoji: '🎉' });
  };

  if (gate) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream px-4">
        <ParentGate title="Add an explorer" onUnlocked={() => { setGate(false); setAdding(true); }} onCancel={() => setGate(false)} />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-jungle-800 to-jungle-950 text-white">
      <FallingLeaves count={8} />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo light to={user ? '/dashboard' : '/profiles'} />
        <div className="flex gap-2">
          <button onClick={() => navigate('/parent')} className="btn bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            <ShieldCheck size={16} /> <span className="hidden sm:inline">Parent corner</span>
          </button>
          <button onClick={() => { logout(); navigate('/'); }} className="btn bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pt-8 pb-16 text-center sm:px-6 sm:pt-14">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold sm:text-6xl">
          Who's learning today?
        </motion.h1>
        <p className="mt-3 text-lg text-white/70">Tap your jungle buddy to start your adventure.</p>
        <div className="mx-auto mt-6 max-w-md"><ErrorNote>{error}</ErrorNote></div>

        {!profiles ? (
          <PageLoader label="Finding the explorers..." />
        ) : (
          <div className="mt-10 flex flex-wrap justify-center gap-5 sm:gap-8">
            {profiles.map((p, i) => (
              <motion.button
                key={p.id}
                onClick={() => pick(p)}
                disabled={busyId !== null}
                initial={{ opacity: 0, y: 40, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 16 }}
                whileHover={{ y: -10, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                className="group flex w-36 flex-col items-center sm:w-44"
              >
                <span
                  className={`relative grid aspect-square w-full place-items-center rounded-[32px] shadow-[0_8px_0_rgb(0_0_0/0.25)] ring-4 ring-transparent transition group-hover:ring-sunny ${busyId === p.id ? 'ring-sunny' : ''}`}
                  style={{ background: TILE_COLORS[i % TILE_COLORS.length] }}
                >
                  <Avatar name={p.avatar} className={`w-3/4 ${busyId === p.id ? 'animate-bob' : ''}`} />
                </span>
                <span className="mt-3 font-display text-xl font-semibold">{p.childName}</span>
                <span className="text-sm text-white/60">{p.rank.emoji} {p.rank.name} • {p.xp} XP</span>
              </motion.button>
            ))}
            {profiles.length < 6 && (
              <motion.button
                onClick={() => (parentToken ? setAdding(true) : setGate(true))}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: profiles.length * 0.08 }}
                whileHover={{ y: -10 }}
                className="flex w-36 flex-col items-center sm:w-44"
              >
                <span className="grid aspect-square w-full place-items-center rounded-[32px] border-4 border-dashed border-white/30 text-white/70 transition hover:border-sunny hover:text-sunny">
                  <Plus size={48} />
                </span>
                <span className="mt-3 font-display text-xl font-semibold">Add explorer</span>
                <span className="text-sm text-white/60">Grown-ups only</span>
              </motion.button>
            )}
          </div>
        )}
      </main>

      <ChildFormModal open={adding} title="Add an explorer" submitLabel="Add explorer" onClose={() => setAdding(false)} onSubmit={(v) => addExplorer(v)} />
    </div>
  );
}
