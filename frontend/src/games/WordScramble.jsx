import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { scrambleWords, shuffle, shuffleChanged } from './content';
import { play } from './sfx';

const MAX_WORDS = 5;
const TILE_COLORS = ['#2BB8BA', '#F68B2F', '#8B5CF6', '#4CC433', '#EC5B8E', '#3B6FD9'];

function Puzzle({ entry, number, count, onSolved }) {
  const answer = entry.word.toUpperCase();
  const tiles = useMemo(
    () => shuffleChanged(answer.split('').map((ch, id) => ({ id, ch, color: TILE_COLORS[id % TILE_COLORS.length] })), (a, b) => a.ch === b.ch),
    [answer],
  );
  const [slots, setSlots] = useState(() => Array(answer.length).fill(null));
  const [locked, setLocked] = useState(0); // the first `locked` slots were filled by hints
  const [status, setStatus] = useState('play'); // play | wrong | solved | shown
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const used = new Set(slots.filter((id) => id != null));
  const tileById = (id) => tiles.find((t) => t.id === id);
  const finished = status === 'solved' || status === 'shown';

  const check = (filled) => {
    if (filled.map((id) => tileById(id).ch).join('') === answer) {
      play('correct');
      setStatus('solved');
    } else {
      play('wrong');
      setStatus('wrong');
      timer.current = setTimeout(() => {
        setSlots((s) => s.map((id, i) => (i < locked ? id : null)));
        setStatus('play');
      }, 750);
    }
  };

  const place = (tile) => {
    if (status !== 'play' || used.has(tile.id)) return;
    const i = slots.indexOf(null);
    if (i < 0) return;
    play('pop');
    const next = [...slots];
    next[i] = tile.id;
    setSlots(next);
    if (!next.includes(null)) check(next);
  };

  const removeAt = (i) => {
    if (status !== 'play' || i < locked || slots[i] == null) return;
    setSlots((s) => s.map((id, j) => (j === i ? null : id)));
  };

  // Each hint locks in one more correct letter from the start of the word.
  const hint = () => {
    if (status !== 'play' || locked >= answer.length - 1) return;
    const k = locked + 1;
    const next = Array(answer.length).fill(null);
    const taken = new Set();
    for (let i = 0; i < k; i++) {
      const t = tiles.find((x) => x.ch === answer[i] && !taken.has(x.id));
      taken.add(t.id);
      next[i] = t.id;
    }
    play('pop');
    setSlots(next);
    setLocked(k);
  };

  const showAnswer = () => {
    if (finished) return;
    clearTimeout(timer.current);
    const taken = new Set();
    setSlots(answer.split('').map((ch) => {
      const t = tiles.find((x) => x.ch === ch && !taken.has(x.id));
      taken.add(t.id);
      return t.id;
    }));
    setStatus('shown');
  };

  const clear = () => status === 'play' && setSlots((s) => s.map((id, i) => (i < locked ? id : null)));
  const moved = useRef(false);
  const next = () => {
    if (moved.current) return;
    moved.current = true;
    onSolved(status === 'solved' ? (locked === 0 ? 2 : 1) : 0, status === 'solved');
  };

  // Typing works too: letters place tiles, Backspace removes, Enter moves on.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Enter on a focused button already clicks it.
      if (e.key === 'Enter' && e.target instanceof Element && e.target.closest('button, a, input')) return;
      if (finished && e.key === 'Enter') return next();
      if (/^[a-z]$/i.test(e.key)) {
        const tile = tiles.find((t) => t.ch === e.key.toUpperCase() && !used.has(t.id));
        if (tile) place(tile);
      } else if (e.key === 'Backspace') {
        const last = slots.findLastIndex((id) => id != null);
        if (last >= locked) { e.preventDefault(); removeAt(last); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const size = answer.length > 9 ? 'h-11 w-8 text-xl sm:h-14 sm:w-11 sm:text-2xl' : 'h-12 w-10 text-2xl sm:h-16 sm:w-14 sm:text-3xl';

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-muted">
        <span>Word {number} of {count}</span>
        <span>{answer.length} letters</span>
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-2xl bg-sunny/30 p-4">
        <Lightbulb className="mt-0.5 shrink-0 text-sunny-dark" size={22} />
        <p className="font-display text-lg leading-snug text-jungle-900 sm:text-xl"><span className="font-semibold">Clue:</span> {entry.meaning}</p>
      </div>

      {/* Answer slots */}
      <div className={`mt-6 flex flex-wrap justify-center gap-1.5 sm:gap-2 ${status === 'wrong' ? 'animate-shake' : ''}`}>
        {slots.map((id, i) => {
          const tile = id != null ? tileById(id) : null;
          const ok = status === 'solved' || status === 'shown' || i < locked;
          return (
            <button
              key={i}
              onClick={() => removeAt(i)}
              disabled={!tile || ok || status !== 'play'}
              className={`grid place-items-center rounded-xl border-3 font-display font-bold uppercase transition-colors ${size} ${
                status === 'wrong' ? 'border-mango bg-mango/15 text-mango-dark'
                  : status === 'solved' ? 'border-leaf bg-leaf/25 text-jungle-900'
                    : status === 'shown' ? 'border-sunny-dark bg-sunny/30 text-jungle-900'
                      : i < locked ? 'border-sunny-dark bg-sunny/40 text-jungle-900'
                        : tile ? 'border-lagoon bg-white text-jungle-900' : 'border-dashed border-jungle-800/20 bg-white/60'
              }`}
              aria-label={tile ? `Letter ${tile.ch}${ok ? '' : ', tap to remove'}` : `Empty space ${i + 1}`}
            >
              {tile && (
                <motion.span initial={{ scale: 0.3, y: 12 }} animate={{ scale: status === 'solved' ? [1, 1.25, 1] : 1, y: 0 }} transition={{ delay: status === 'solved' ? i * 0.05 : 0 }}>
                  {tile.ch}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {!finished ? (
        <>
          {/* Letter tiles */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            {tiles.map((t) => (
              <motion.button
                key={t.id}
                onClick={() => place(t)}
                disabled={used.has(t.id) || status !== 'play'}
                whileHover={!used.has(t.id) ? { y: -4 } : {}}
                whileTap={{ scale: 0.9 }}
                animate={{ opacity: used.has(t.id) ? 0.15 : 1, scale: used.has(t.id) ? 0.85 : 1 }}
                className={`grid place-items-center rounded-2xl font-display font-bold text-white uppercase ${size}`}
                style={{ background: t.color, boxShadow: used.has(t.id) ? 'none' : `0 4px 0 rgb(0 0 0 / 0.2)` }}
                aria-label={`Letter ${t.ch}`}
              >
                {t.ch}
              </motion.button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button onClick={hint} disabled={status !== 'play' || locked >= answer.length - 1} className="btn-sunny px-4 py-2 text-sm"><Lightbulb size={16} /> Hint</button>
            <button onClick={clear} disabled={status !== 'play'} className="btn-light px-4 py-2 text-sm"><RotateCcw size={16} /> Clear</button>
            <button onClick={showAnswer} className="btn-light px-4 py-2 text-sm"><Eye size={16} /> Show me</button>
          </div>
          <p className="mt-3 text-center text-xs font-bold text-muted">Solve it with no hints for 2 points. Tap a letter in the boxes to take it back.</p>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 rounded-2xl p-4 ${status === 'solved' ? 'bg-leaf/15' : 'bg-sunny/25'}`}>
          <p className="font-display text-xl font-semibold text-jungle-900">
            {status === 'solved' ? (locked === 0 ? 'Brilliant! You did it all by yourself! 🎉' : 'You got it! 🎉') : `The word is “${entry.word}”.`}
          </p>
          <p className="mt-1 text-jungle-900/80"><strong>{entry.word}</strong>: {entry.meaning}</p>
          {entry.example && <p className="mt-1 text-sm text-muted italic">“{entry.example}”</p>}
          <button onClick={next} className="btn-primary mt-4 w-full py-3.5 text-lg">
            {number < count ? <>Next word <ArrowRight size={20} /></> : <>See my score <Sparkles size={20} /></>}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function WordScramble({ pack, onFinish }) {
  const words = useMemo(() => shuffle(scrambleWords(pack)).slice(0, MAX_WORDS), [pack]);
  const [index, setIndex] = useState(0);
  const tally = useRef({ points: 0, solved: 0 });

  const solved = (points, ok) => {
    tally.current.points += points;
    tally.current.solved += ok ? 1 : 0;
    if (index + 1 < words.length) return setIndex((i) => i + 1);
    const { points: score, solved: count } = tally.current;
    onFinish({ score, total: words.length * 2, line: `You unscrambled ${count} of ${words.length} words!` });
  };

  return <Puzzle key={index} entry={words[index]} number={index + 1} count={words.length} onSolved={solved} />;
}
