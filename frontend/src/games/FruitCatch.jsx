import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { Leaf, Monkey } from '../components/Mascots';
import { distractors, shuffle, wordRegExp } from './content';
import { play } from './sfx';

const FRUITS = ['🍎', '🍌', '🍇', '🍊', '🥭', '🍓', '🍍', '🍉'];
const MAX_ROUNDS = 8;
const LIVES = 3;

// Two kinds of round per word: "which word means..." and "fill the gap" (when the story uses the word).
function buildRounds(words) {
  const all = [];
  for (const w of words) {
    all.push({ type: 'meaning', clue: w.meaning, answer: w.word, entry: w });
    if (w.example) {
      const re = new RegExp(wordRegExp(w.word).source, 'giu');
      all.push({ type: 'gap', clue: w.example.replace(re, '$1_____'), answer: w.word, entry: w });
    }
  }
  const rounds = shuffle(all).slice(0, MAX_ROUNDS);
  // Avoid asking about the same word twice in a row.
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i].answer !== rounds[i - 1].answer) continue;
    const j = rounds.findIndex((r, k) => k > i && r.answer !== rounds[i - 1].answer);
    if (j > 0) [rounds[i], rounds[j]] = [rounds[j], rounds[i]];
  }
  return rounds.map((r) => {
    const others = shuffle(words.map((w) => w.word).filter((x) => x.toLowerCase() !== r.answer.toLowerCase())).slice(0, 3);
    const options = shuffle([r.answer, ...others, ...distractors([r.answer, ...others], 3 - others.length)]);
    return { ...r, options, fruits: shuffle(FRUITS).slice(0, options.length) };
  });
}

function Basket() {
  return (
    <svg viewBox="0 0 120 64" className="w-full" aria-hidden="true">
      <path d="M22 24 Q60 -12 98 24" stroke="#8A4209" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M12 28 H108 L98 58 Q96 63 89 63 H31 Q24 63 22 58 Z" fill="#C9621A" />
      <path d="M16 40 H104 M19 51 H101" stroke="#8A4209" strokeWidth="3" opacity="0.6" />
      {[30, 46, 60, 74, 90].map((x) => <path key={x} d={`M${x} 30 V61`} stroke="#8A4209" strokeWidth="2.5" opacity="0.35" />)}
      <rect x="6" y="20" width="108" height="11" rx="5.5" fill="#8A4209" />
    </svg>
  );
}

export default function FruitCatch({ pack, onFinish }) {
  const rounds = useMemo(() => buildRounds(pack.words), [pack]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | falling | right | missed | over
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [gone, setGone] = useState([]); // fruits caught by mistake this round
  const [ouch, setOuch] = useState(null);
  const arenaRef = useRef(null);
  const basketRef = useRef(null);
  const fruitRefs = useRef([]);
  const sim = useRef({ x: 0.5, target: 0.5, left: false, right: false, lives: LIVES, score: 0, ended: false });

  const round = rounds[index];
  const fallSeconds = 8 - Math.min(index, 4) * 0.5; // a little faster each round

  const end = () => {
    const s = sim.current;
    if (s.ended) return;
    s.ended = true;
    onFinish({
      score: s.score,
      total: rounds.length,
      line: s.lives > 0 ? `You caught ${s.score} of ${rounds.length} right fruits!` : `You caught ${s.score} right ${s.score === 1 ? 'fruit' : 'fruits'} before your hearts ran out.`,
    });
  };

  // Round flow: get ready -> fruits fall -> show the answer -> next round.
  useEffect(() => {
    let t;
    if (phase === 'ready') {
      // Keep the whole play area (and the basket) on screen, above the phone tab bar.
      arenaRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      t = setTimeout(() => setPhase('falling'), 1300);
    }
    if (phase === 'right' || phase === 'missed') {
      t = setTimeout(() => {
        if (index + 1 >= rounds.length) return end();
        setIndex((i) => i + 1);
        setGone([]);
        setOuch(null);
        setPhase('ready');
      }, 2200);
    }
    if (phase === 'over') t = setTimeout(end, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!ouch) return;
    const t = setTimeout(() => setOuch(null), 1400);
    return () => clearTimeout(t);
  }, [ouch]);

  // The game loop: move the basket, drop the fruit, check catches.
  useEffect(() => {
    if (phase !== 'falling') return;
    const arena = arenaRef.current;
    const basket = basketRef.current;
    const s = sim.current;
    const n = round.options.length;
    const order = shuffle(round.options.map((_, i) => i));
    const fruits = round.options.map((word, i) => {
      const el = fruitRefs.current[i];
      return { i, word, el, w: el.offsetWidth, h: el.offsetHeight, y: -el.offsetHeight - 20 - order.indexOf(i) * 80, active: true };
    });
    let raf;
    let last = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const width = arena.clientWidth;
      const height = arena.clientHeight;
      const bw = basket.offsetWidth;
      const half = bw / 2 / width;
      if (s.left) s.target -= 1.2 * dt;
      if (s.right) s.target += 1.2 * dt;
      s.target = Math.min(1 - half, Math.max(half, s.target));
      s.x += (s.target - s.x) * Math.min(1, dt * 14);
      basket.style.left = `${s.x * 100}%`;

      const mouth = basket.offsetTop + basket.offsetHeight * 0.3;
      const speed = (height + 120) / fallSeconds;
      for (const f of fruits) {
        if (!f.active) continue;
        f.y += speed * dt;
        f.el.style.transform = `translate(-50%, ${f.y}px)`;
        const bottom = f.y + f.h;
        const cx = ((f.i + 0.5) / n) * width;
        if (bottom >= mouth && bottom <= mouth + 40 && Math.abs(cx - s.x * width) < bw / 2 + f.w * 0.15) {
          f.active = false;
          if (f.word === round.answer) {
            s.score += 1;
            setScore(s.score);
            play('correct');
            setPhase('right');
            return;
          }
          play('wrong');
          s.lives -= 1;
          setLives(s.lives);
          setGone((g) => [...g, f.i]);
          setOuch(f.word);
          if (s.lives <= 0) {
            setPhase('over');
            return;
          }
        } else if (f.y > height) {
          f.active = false;
          if (f.word === round.answer) {
            play('wrong');
            setPhase('missed');
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, index]);

  // Arrow keys (or A / D) move the basket.
  useEffect(() => {
    const handler = (on) => (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { sim.current.left = on; e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { sim.current.right = on; e.preventDefault(); }
    };
    const down = handler(true);
    const up = handler(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const aim = (e) => {
    const r = arenaRef.current.getBoundingClientRect();
    sim.current.target = (e.clientX - r.left) / r.width;
  };

  const showFruit = phase !== 'ready';
  const n = round.options.length;

  return (
    <div>
      {/* Scoreboard */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-jungle-800 shadow-sm">Round {index + 1}/{rounds.length}</span>
        <div className="flex items-center gap-1" aria-label={`${lives} hearts left`}>
          {Array.from({ length: LIVES }, (_, i) => (
            <motion.span key={i} animate={{ scale: i < lives ? 1 : 0.8 }}>
              <Heart size={24} className={i < lives ? 'fill-berry text-berry' : 'text-jungle-800/20'} />
            </motion.span>
          ))}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-sunny px-3 py-1.5 font-display font-semibold text-jungle-900">
          <motion.span key={score} animate={{ scale: [1, 1.5, 1] }} aria-hidden="true">🍎</motion.span> {score}
        </span>
      </div>

      {/* Clue */}
      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-jungle-800/5">
          <p className="eyebrow text-xs text-leaf-dark">{round.type === 'gap' ? 'Catch the missing word' : 'Catch the word that means…'}</p>
          <p className="mt-1 font-display text-lg leading-snug font-semibold text-jungle-900 sm:text-2xl">{round.clue}</p>
        </motion.div>
      </AnimatePresence>

      {/* Play area */}
      <div
        ref={arenaRef}
        onPointerDown={aim}
        onPointerMove={aim}
        className="relative mt-3 h-[clamp(250px,calc(100dvh-390px),460px)] scroll-mb-24 touch-none overflow-hidden lg:h-[min(58vh,460px)] lg:min-h-[330px] lg:scroll-mb-4 rounded-[28px] bg-gradient-to-b from-[#CFF3F4] via-[#E6F8EA] to-[#D6F5C9] select-none"
        role="application"
        aria-label="Fruit catching area. Use the left and right arrow keys to move the basket."
      >
        {/* Jungle canopy and grass */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-jungle-700/90" style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }} />
        {[4, 22, 44, 66, 86].map((left, i) => (
          <Leaf key={left} className="pointer-events-none absolute top-1 w-10 sm:w-12" style={{ left: `${left}%`, transform: `rotate(${150 + i * 25}deg)` }} color={i % 2 ? '#56DB3A' : '#2E9A1C'} />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-leaf" />
        <Monkey className={`pointer-events-none absolute bottom-3 left-2 w-12 sm:w-16 ${phase === 'right' ? 'animate-bob' : ''}`} />

        {/* Fruit */}
        {showFruit && round.options.map((word, i) => (
          <div
            key={`${index}-${i}`}
            ref={(el) => { fruitRefs.current[i] = el; }}
            className={`pointer-events-none absolute top-0 flex flex-col items-center transition-[opacity,scale] duration-300 ${gone.includes(i) ? 'scale-0 opacity-0' : phase === 'falling' ? '' : word === round.answer ? 'scale-110' : 'opacity-30'}`}
            style={{ left: `${((i + 0.5) / n) * 100}%`, width: `calc(${100 / n}% - 8px)`, transform: 'translate(-50%, -200px)' }}
          >
            <span className="text-3xl drop-shadow-sm sm:text-5xl" aria-hidden="true">{round.fruits[i]}</span>
            <span className="-mt-1 max-w-full rounded-xl bg-white px-1.5 py-1 text-center font-display text-xs leading-tight font-semibold break-words text-jungle-900 shadow-md ring-2 ring-jungle-800/10 sm:px-3 sm:text-base">
              {word}
            </span>
          </div>
        ))}

        {/* Basket */}
        <div ref={basketRef} className="pointer-events-none absolute bottom-4 w-24 -translate-x-1/2 sm:w-32" style={{ left: '50%' }}>
          <Basket />
        </div>

        {/* Messages */}
        <AnimatePresence>
          {ouch && phase === 'falling' && (
            <motion.p key={`ouch-${ouch}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-14 mx-auto w-fit rounded-full bg-mango px-4 py-1.5 text-sm font-bold text-white shadow">
              Oops! “{ouch}” isn't it. −1 ❤️
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {phase !== 'falling' && (
            <motion.div key={`${phase}-${index}`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-x-4 top-1/2 mx-auto max-w-md -translate-y-1/2 rounded-3xl bg-white/95 p-5 text-center shadow-xl" aria-live="polite">
              {phase === 'ready' && (
                <>
                  <motion.p className="text-5xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 0.8, repeat: Infinity }} aria-hidden="true">{round.fruits[0]}</motion.p>
                  <p className="mt-2 font-display text-2xl font-semibold text-jungle-900">{index === 0 ? 'Get ready…' : `Round ${index + 1}!`}</p>
                  <p className="text-sm text-muted">Read the clue, then catch the right fruit.</p>
                </>
              )}
              {phase === 'right' && (
                <>
                  <p className="font-display text-2xl font-semibold text-leaf-dark">Yum! That's right! 🎉</p>
                  <p className="mt-1 text-jungle-900"><strong>{round.entry.word}</strong> means {round.entry.meaning}.</p>
                </>
              )}
              {phase === 'missed' && (
                <>
                  <p className="font-display text-2xl font-semibold text-mango-dark">It got away! 🙈</p>
                  <p className="mt-1 text-jungle-900">The answer was <strong>{round.answer}</strong>: {round.entry.meaning}.</p>
                </>
              )}
              {phase === 'over' && (
                <>
                  <p className="font-display text-2xl font-semibold text-mango-dark">Out of hearts!</p>
                  <p className="mt-1 text-jungle-900">Great effort. Let's see your score…</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-center text-xs font-bold text-muted">Slide your finger or mouse to move the basket. On a keyboard, use ← and →.</p>
    </div>
  );
}
