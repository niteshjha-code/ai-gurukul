import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Leaf, Owl } from './Mascots';
import { FUN_FACTS, subjectById } from '../data/catalog';

export function celebrate(power = 1) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#56DB3A', '#FFD54A', '#F68B2F', '#2BB8BA', '#EC5B8E'];
  confetti({ particleCount: Math.round(90 * power), spread: 80, origin: { y: 0.65 }, colors, disableForReducedMotion: true });
  setTimeout(() => confetti({ particleCount: Math.round(50 * power), angle: 60, spread: 60, origin: { x: 0 }, colors }), 200);
  setTimeout(() => confetti({ particleCount: Math.round(50 * power), angle: 120, spread: 60, origin: { x: 1 }, colors }), 350);
}

// Fades/slides children in when scrolled into view.
export function Reveal({ children, delay = 0, y = 30, className = '', as = 'div' }) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

export function CountUp({ value = 0, duration = 1.2, suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, { duration, ease: 'easeOut', onUpdate: (v) => setDisplay(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, duration]);
  return <span ref={ref}>{display}{suffix}</span>;
}

export function Stars({ level = 1, max = 5, className = '' }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`Level ${level} of ${max}`} title={`Level ${level} of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i < level ? 'text-sunny' : 'text-jungle-800/15'}`} aria-hidden="true">
          <path fill="currentColor" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

export function SubjectChip({ subject, className = '' }) {
  const s = subjectById(subject);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${className}`}
      style={{ background: `${s.color}22`, color: s.dark }}
    >
      <span aria-hidden="true">{s.emoji}</span>
      {s.name}
    </span>
  );
}

export function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4" role="status">
      <div className="flex gap-2">
        {['#56DB3A', '#FFD54A', '#F68B2F'].map((c, i) => (
          <motion.div
            key={c}
            className="w-8"
            animate={{ y: [0, -16, 0], rotate: [0, 20, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          >
            <Leaf color={c} />
          </motion.div>
        ))}
      </div>
      <p className="font-display text-jungle-800">{label}</p>
    </div>
  );
}

// Shown while the AI is thinking: Guru Owl with sparkles and rotating fun facts.
export function MagicLoader({ title = 'Guru Owl is writing...', steps = [] }) {
  const [fact, setFact] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setFact((f) => (f + 1) % FUN_FACTS.length), 5000);
    const t2 = setInterval(() => setStep((s) => Math.min(s + 1, Math.max(steps.length - 1, 0))), 4000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card relative mx-auto flex max-w-xl flex-col items-center overflow-hidden px-6 py-10 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-lagoon/30 animate-pulse-ring" />
        <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 2, repeat: Infinity }}>
          <Owl className="relative w-32" />
        </motion.div>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{ top: `${[0, 20, 70, 50][i]}%`, left: `${[-20, 105, 110, -25][i]}%` }}
            animate={{ scale: [0, 1.2, 0], rotate: [0, 90, 180] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.45 }}
            aria-hidden="true"
          >
            ✨
          </motion.span>
        ))}
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-jungle-800">{title}</h2>
      {steps.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.p key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-1 text-muted">
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      )}
      <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-jungle-800/10">
        <motion.div className="h-2 rounded-full bg-gradient-to-r from-leaf via-sunny to-mango" animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
      <div className="mt-8 w-full rounded-2xl bg-cream p-4">
        <p className="eyebrow text-mango">Did you know?</p>
        <AnimatePresence mode="wait">
          <motion.p key={fact} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1 font-semibold text-jungle-800">
            {FUN_FACTS[fact]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function EmptyState({ mascot, title, children, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="w-28 animate-bob">{mascot}</div>
      <h3 className="mt-4 text-2xl font-semibold text-jungle-800">{title}</h3>
      <p className="mt-2 max-w-md text-muted">{children}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 rounded-2xl bg-mango/10 px-4 py-3 text-sm font-bold text-mango-dark" role="alert">
      <span aria-hidden="true">🙈</span>
      <span className="flex-1">{children}</span>
      {onRetry && <button onClick={onRetry} className="underline underline-offset-2">Try again</button>}
    </motion.div>
  );
}

// Turn stray LaTeX from the AI into plain text: \( \frac{3}{4} \) -> 3/4, \times -> x.
function plainMath(text) {
  return text
    .replace(/\\[()[\]]/g, '')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '$1')
    .replace(/ {2,}/g, ' ');
}

// Minimal, safe markdown: paragraphs, **bold**, numbered and bulleted lists.
export function RichText({ text: raw }) {
  const text = plainMath(raw);
  const bold = (line) => line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-jungle-800">{part.slice(2, -2)}</strong> : part);
  const blocks = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const ordered = line.match(/^\d+[.)]\s+(.*)/);
    const bullet = line.match(/^[-*•]\s+(.*)/);
    const last = blocks.at(-1);
    if (ordered || bullet) {
      const type = ordered ? 'ol' : 'ul';
      const item = (ordered ?? bullet)[1];
      if (last?.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else if (line) {
      blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') });
    }
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === 'p') return <p key={i}>{bold(b.text)}</p>;
        const List = b.type;
        return (
          <List key={i} className={`space-y-1 pl-5 ${b.type === 'ol' ? 'list-decimal' : 'list-disc'}`}>
            {b.items.map((it, j) => <li key={j}>{bold(it)}</li>)}
          </List>
        );
      })}
    </div>
  );
}
