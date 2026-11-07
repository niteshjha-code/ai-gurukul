import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, ChartNoAxesColumn, Gamepad2, HelpCircle, Home, LogOut, ShieldCheck, Sparkles, UserPen, Users } from 'lucide-react';
import Logo from './Logo';
import { Avatar } from './Mascots';
import ProfileModal from './ProfileModal';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/create', label: 'Create', icon: Sparkles },
  { to: '/stories', label: 'Library', icon: BookOpen, end: true },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/homework', label: 'Homework', icon: HelpCircle },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesColumn },
];

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 shadow-sm ring-1 ring-jungle-800/10 transition hover:ring-jungle-800/30"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-cream">
          <Avatar name={user.avatar} className="w-8" />
        </span>
        <span className="hidden max-w-28 truncate font-display font-semibold text-jungle-800 sm:block">{user.childName}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 mt-2 w-60 origin-top-right rounded-3xl bg-white p-2 shadow-xl ring-1 ring-jungle-800/10"
            role="menu"
          >
            <div className="px-3 py-2">
              <p className="font-display font-semibold text-jungle-800">{user.childName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <button role="menuitem" onClick={() => { setEditing(true); setOpen(false); }} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left font-bold text-jungle-800 hover:bg-mint">
              <UserPen size={18} /> Edit profile
            </button>
            <Link role="menuitem" to="/profiles" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 font-bold text-jungle-800 hover:bg-mint">
              <Users size={18} /> Switch explorer
            </Link>
            <Link role="menuitem" to="/parent" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 font-bold text-jungle-800 hover:bg-mint">
              <ShieldCheck size={18} /> Parent corner
            </Link>
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left font-bold text-mango-dark hover:bg-mango/10">
              <LogOut size={18} /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <ProfileModal open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="min-h-dvh bg-mint">
      <header className="sticky top-0 z-40 border-b border-jungle-800/5 bg-mint/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
          <Logo to="/dashboard" />
          <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-jungle-800/5 lg:flex" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="relative rounded-full px-3 py-2 font-display font-medium xl:px-4">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-jungle-800" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    <span className={`relative flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-jungle-800'}`}>
                      <Icon size={17} /> {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-sunny px-3 py-1.5 font-display text-sm font-semibold text-jungle-900 sm:flex" title={`${user.rank.name} rank`}>
              <span aria-hidden="true">{user.rank.emoji}</span> {user.xp} XP
            </span>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar for phones and tablets */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-jungle-800/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Main">
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className="relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold min-[400px]:text-[11px]">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="tab-dot" className="absolute top-0 h-1 w-10 rounded-b-full bg-leaf" />}
                    <motion.span animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -2 : 0 }} className={isActive ? 'text-jungle-800' : 'text-muted'}>
                      <Icon size={22} />
                    </motion.span>
                    <span className={isActive ? 'text-jungle-800' : 'text-muted'}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
