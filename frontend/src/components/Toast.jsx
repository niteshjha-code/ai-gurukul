import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

const ToastContext = createContext(() => {});

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { refresh } = useAuth();

  const toast = useCallback(({ title, body, emoji = '🌟', tone = 'leaf', duration = 3800 }) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, title, body, emoji, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  // Show XP and any new badges returned by the API, and refresh the XP shown in the header.
  const reward = useCallback(({ xpGained, newBadges = [] }) => {
    refresh().catch(() => {});
    if (xpGained) toast({ title: `+${xpGained} XP`, body: 'Great learning!', emoji: '⭐', tone: 'sunny' });
    newBadges.forEach((b, i) => setTimeout(() => toast({ title: `New badge: ${b.name}`, body: b.desc, emoji: b.emoji, tone: 'leaf', duration: 5000 }), 600 * (i + 1)));
  }, [toast, refresh]);

  const tones = { leaf: 'bg-jungle-800 text-white', sunny: 'bg-sunny text-jungle-900', mango: 'bg-mango text-white' };

  return (
    <ToastContext.Provider value={{ toast, reward }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 shadow-xl ${tones[t.tone]}`}
            >
              <motion.span className="text-3xl" animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.7 }} aria-hidden="true">
                {t.emoji}
              </motion.span>
              <div>
                <p className="font-display text-lg leading-tight font-semibold">{t.title}</p>
                {t.body && <p className="text-sm opacity-90">{t.body}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
