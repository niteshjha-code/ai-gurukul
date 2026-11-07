import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Leaf } from '../components/Mascots';
import { shuffle } from './content';
import { play } from './sfx';

const MAX_PAIRS = 6;

function Card({ card, faceUp, matched, wrong, onFlip, index }) {
  const meaning = card.side === 'meaning';
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 20 }}
      onClick={onFlip}
      disabled={matched}
      className={`h-28 [perspective:900px] sm:h-36 ${wrong ? 'animate-shake' : ''}`}
      aria-label={faceUp || matched ? `${meaning ? 'Meaning' : 'Word'}: ${card.text}` : 'Hidden card. Tap to flip.'}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: faceUp || matched ? 180 : 0, scale: matched ? 0.95 : 1 }}
        transition={{ duration: 0.45 }}
      >
        {/* Back */}
        <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-jungle-700 to-jungle-900 shadow-[0_5px_0_var(--color-jungle-950)] [backface-visibility:hidden]">
          <Leaf className="absolute -top-2 -left-2 w-10 rotate-45 opacity-30" color="#56DB3A" />
          <Leaf className="absolute -right-2 -bottom-2 w-10 -rotate-135 opacity-30" color="#FFD54A" />
          <span className="font-display text-4xl font-bold text-sunny">?</span>
        </div>
        {/* Front */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl p-2 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            matched ? 'bg-leaf/25 ring-3 ring-leaf' : wrong ? 'bg-mango/15 ring-3 ring-mango' : meaning ? 'bg-cream ring-3 ring-sunny' : 'bg-white ring-3 ring-lagoon'
          }`}
        >
          {matched && <span className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-leaf-dark text-white"><Check size={13} /></span>}
          {meaning ? (
            <span className={`leading-snug font-bold text-jungle-900 ${card.text.length > 60 ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'}`}>{card.text}</span>
          ) : (
            <span className="font-display text-lg font-semibold break-words text-lagoon-dark sm:text-2xl">{card.text}</span>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}

export default function MemoryMatch({ pack, onFinish }) {
  const words = useMemo(() => shuffle(pack.words).slice(0, MAX_PAIRS), [pack]);
  const cards = useMemo(() => shuffle(words.flatMap((w, i) => [
    { id: `w${i}`, pair: i, side: 'word', text: w.word },
    { id: `m${i}`, pair: i, side: 'meaning', text: w.meaning },
  ])), [words]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState([]);
  const [tries, setTries] = useState(0);
  const [misses, setMisses] = useState(0);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const flip = (card) => {
    if (open.length === 2 || open.includes(card.id) || matched.includes(card.pair)) return;
    play('flip');
    const next = [...open, card.id];
    setOpen(next);
    if (next.length < 2) return;

    setTries((t) => t + 1);
    const [a, b] = next.map((id) => cards.find((c) => c.id === id));
    if (a.pair === b.pair) {
      const found = [...matched, a.pair];
      later(() => {
        play('correct');
        setMatched(found);
        setOpen([]);
      }, 350);
      if (found.length === words.length) {
        const n = words.length;
        // Missing up to one try per pair is free; after that each miss costs a point.
        const score = Math.max(1, n - Math.max(0, misses - n));
        later(() => onFinish({ score, total: n, line: `You matched all ${n} words in ${tries + 1} tries!` }), 1300);
      }
    } else {
      setMisses((m) => m + 1);
      later(() => { play('wrong'); setWrong(next); }, 500);
      later(() => { setOpen([]); setWrong([]); }, 1300);
    }
  };

  const cols = cards.length >= 12 ? 'grid-cols-3 sm:grid-cols-4' : cards.length === 8 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3';
  const lastFound = matched.length ? words[matched.at(-1)] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
        <p className="text-muted">Match each <span className="text-lagoon-dark">word</span> to its <span className="text-sunny-dark">meaning</span>.</p>
        <div className="flex gap-2">
          <span className="rounded-full bg-white px-3 py-1.5 text-jungle-800 shadow-sm">Pairs {matched.length}/{words.length}</span>
          <span className="rounded-full bg-white px-3 py-1.5 text-jungle-800 shadow-sm">Tries {tries}</span>
        </div>
      </div>

      <div className={`mt-4 grid gap-2.5 sm:gap-3 ${cols}`}>
        {cards.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            index={i}
            faceUp={open.includes(card.id)}
            matched={matched.includes(card.pair)}
            wrong={wrong.includes(card.id)}
            onFlip={() => flip(card)}
          />
        ))}
      </div>

      <div className="mt-5 min-h-16" aria-live="polite">
        <AnimatePresence mode="wait">
          {lastFound && (
            <motion.div key={lastFound.word} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-3 rounded-2xl bg-leaf/15 px-4 py-3">
              <span className="text-2xl" aria-hidden="true">🌟</span>
              <p className="text-jungle-900"><strong className="font-display text-lg">{lastFound.word}</strong> means {lastFound.meaning}.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
