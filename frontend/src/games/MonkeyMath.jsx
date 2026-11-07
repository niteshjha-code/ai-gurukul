import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, Timer } from 'lucide-react';
import { Monkey } from '../components/Mascots';
import { shuffle } from './content';
import { play } from './sfx';

const SECONDS = 60;
const BUTTON_COLORS = ['#2BB8BA', '#F68B2F', '#8B5CF6', '#4CC433'];

export const MATH_LEVELS = [
  { level: 1, label: 'Sums to 10' },
  { level: 2, label: 'Sums to 20' },
  { level: 3, label: 'To 100, ×2 ×5 ×10' },
  { level: 4, label: 'Times tables, ÷' },
  { level: 5, label: 'Big sums, ×12, ?' },
];

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (list) => list[rand(0, list.length - 1)];

// Problems are made up on the spot, so the game never runs out.
const MAKERS = {
  add10: () => { const a = rand(1, 8); const b = rand(1, 10 - a); return [`${a} + ${b}`, a + b]; },
  sub10: () => { const a = rand(3, 10); const b = rand(1, a - 1); return [`${a} − ${b}`, a - b]; },
  add20: () => { const a = rand(4, 16); const b = rand(2, 20 - a); return [`${a} + ${b}`, a + b]; },
  sub20: () => { const a = rand(11, 20); const b = rand(2, a - 2); return [`${a} − ${b}`, a - b]; },
  add100: () => { const a = rand(12, 80); const b = rand(5, 99 - a); return [`${a} + ${b}`, a + b]; },
  sub100: () => { const a = rand(25, 99); const b = rand(5, a - 5); return [`${a} − ${b}`, a - b]; },
  mul2510: () => { const a = pick([2, 5, 10]); const b = rand(1, 10); return [`${b} × ${a}`, a * b]; },
  mul: () => { const a = rand(2, 10); const b = rand(2, 10); return [`${a} × ${b}`, a * b]; },
  div: () => { const b = rand(2, 10); const c = rand(1, 10); return [`${b * c} ÷ ${b}`, c]; },
  mul12: () => { const a = rand(3, 12); const b = rand(3, 12); return [`${a} × ${b}`, a * b]; },
  div12: () => { const b = rand(3, 12); const c = rand(2, 12); return [`${b * c} ÷ ${b}`, c]; },
  add200: () => { const a = rand(25, 150); const b = rand(25, 199 - a); return [`${a} + ${b}`, a + b]; },
  sub200: () => { const a = rand(60, 200); const b = rand(15, a - 10); return [`${a} − ${b}`, a - b]; },
  missing: () => { const a = rand(5, 50); const b = rand(5, 40); return [`${a} + ? = ${a + b}`, b]; },
};

const LEVEL_MIX = {
  1: ['add10', 'add10', 'sub10'],
  2: ['add20', 'add20', 'sub20'],
  3: ['add100', 'sub100', 'mul2510'],
  4: ['mul', 'mul', 'div', 'add100'],
  5: ['mul12', 'div12', 'add200', 'sub200', 'missing'],
};

function makeProblem(level, previous) {
  for (let tries = 0; tries < 6; tries++) {
    const [text, answer] = MAKERS[pick(LEVEL_MIX[level] ?? LEVEL_MIX[1])]();
    if (text === previous) continue;
    const options = new Set([answer]);
    // Near misses first (one or two off), then bigger slips like ten off.
    for (const d of [...shuffle([1, -1, 2, -2]), ...shuffle([3, -3, 10, -10])]) {
      if (options.size === 4) break;
      if (answer + d >= 0) options.add(answer + d);
    }
    return { text, answer, options: shuffle([...options]) };
  }
  return makeProblem(level, null);
}

export default function MonkeyMath({ level = 1, onFinish }) {
  const [problem, setProblem] = useState(() => makeProblem(level, null));
  const [left, setLeft] = useState(SECONDS);
  const [feedback, setFeedback] = useState(null); // { choice, right }
  const [stats, setStats] = useState({ correct: 0, attempted: 0, combo: 0, best: 0 });
  const statsRef = useRef(stats);
  statsRef.current = stats;
  const ended = useRef(false);
  const timer = useRef();

  useEffect(() => {
    const endAt = Date.now() + SECONDS * 1000;
    let lastTick = SECONDS;
    const id = setInterval(() => {
      const remaining = Math.max(0, (endAt - Date.now()) / 1000);
      setLeft(remaining);
      const whole = Math.ceil(remaining);
      if (whole <= 5 && whole < lastTick && whole > 0) play('tick');
      lastTick = whole;
      if (remaining <= 0 && !ended.current) {
        ended.current = true;
        clearInterval(id);
        const { correct, attempted, best } = statsRef.current;
        onFinish({
          score: correct,
          total: Math.max(attempted, 5),
          line: `You solved ${correct} of ${attempted} ${attempted === 1 ? 'problem' : 'problems'} in 60 seconds${best >= 3 ? `, with a best streak of ${best}` : ''}!`,
        });
      }
    }, 100);
    return () => { clearInterval(id); clearTimeout(timer.current); };
  }, []);

  const answer = (choice) => {
    if (feedback || ended.current) return;
    const right = choice === problem.answer;
    setFeedback({ choice, right });
    setStats((s) => {
      const combo = right ? s.combo + 1 : 0;
      return { correct: s.correct + (right ? 1 : 0), attempted: s.attempted + 1, combo, best: Math.max(s.best, combo) };
    });
    const combo = right ? stats.combo + 1 : 0;
    play(right ? (combo > 0 && combo % 5 === 0 ? 'combo' : 'correct') : 'wrong');
    timer.current = setTimeout(() => {
      setFeedback(null);
      setProblem((p) => makeProblem(level, p.text));
    }, right ? 380 : 1100);
  };

  // Number keys 1-4 pick an answer.
  useEffect(() => {
    const onKey = (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= problem.options.length) answer(problem.options[n - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pct = (left / SECONDS) * 100;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display font-semibold ${left <= 10 ? 'bg-mango text-white' : 'bg-white text-jungle-800 shadow-sm'}`}>
          <Timer size={18} /> {Math.ceil(left)}s
        </span>
        <AnimatePresence>
          {stats.combo >= 3 && (
            <motion.span key="combo" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1 rounded-full bg-berry px-3 py-1.5 font-display font-semibold text-white">
              <Flame size={18} /> Combo ×{stats.combo}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="flex items-center gap-1 rounded-full bg-sunny px-3 py-1.5 font-display font-semibold text-jungle-900">
          <motion.span key={stats.correct} animate={{ scale: [1, 1.6, 1], rotate: [0, -20, 0] }} aria-hidden="true">🍌</motion.span> {stats.correct}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-jungle-800/10" aria-hidden="true">
        <div className="h-full rounded-full bg-gradient-to-r from-berry to-mango transition-[width] duration-100 ease-linear" style={{ width: `${pct}%` }} />
      </div>

      <div className="card relative mt-5 overflow-hidden p-6 text-center sm:p-8">
        <motion.div
          className="mx-auto w-20 sm:w-24"
          animate={feedback ? (feedback.right ? { y: [0, -24, 0], rotate: [0, -8, 8, 0] } : { x: [0, -8, 8, -8, 0] }) : { y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Monkey />
        </motion.div>
        {/* The sum and its answer buttons always change together. */}
        <motion.p
          key={problem.text}
          initial={{ opacity: 0, y: 16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.18 }}
          className="mt-3 font-display text-5xl font-bold tracking-wide text-jungle-900 sm:text-6xl"
          aria-live="polite"
        >
          {problem.text.includes('?') ? problem.text : `${problem.text} = ?`}
        </motion.p>
        <p className={`mt-2 h-6 font-bold ${feedback?.right ? 'text-leaf-dark' : 'text-mango-dark'}`}>
          {feedback && (feedback.right ? 'Yes! 🎉' : `Oops! It's ${problem.answer}.`)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          {problem.options.map((opt, i) => {
            const isAnswer = feedback && opt === problem.answer;
            const isWrong = feedback && !feedback.right && opt === feedback.choice;
            return (
              <motion.button
                key={`${problem.text}-${opt}`}
                onClick={() => answer(opt)}
                whileTap={{ scale: 0.94 }}
                className={`relative rounded-2xl py-4 font-display text-3xl font-bold text-white transition-colors sm:py-5 sm:text-4xl ${isWrong ? 'animate-shake' : ''}`}
                style={{
                  background: isAnswer ? '#2E9A1C' : isWrong ? '#C9621A' : feedback ? '#B7C4BB' : BUTTON_COLORS[i],
                  boxShadow: '0 5px 0 rgb(0 0 0 / 0.18)',
                }}
                aria-label={`Answer ${opt}`}
              >
                <span className="absolute top-1.5 left-2.5 text-xs font-bold opacity-70" aria-hidden="true">{i + 1}</span>
                {opt}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
