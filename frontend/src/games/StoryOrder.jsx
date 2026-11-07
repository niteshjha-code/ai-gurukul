import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Owl } from '../components/Mascots';
import { shuffleChanged } from './content';
import { play } from './sfx';

const CARD_COLORS = ['#2BB8BA', '#F68B2F', '#8B5CF6', '#4CC433', '#EC5B8E', '#3B6FD9'];

export default function StoryOrder({ pack, onFinish }) {
  const { title, steps } = pack.sequence;
  const items = useMemo(() => steps.map((text, id) => ({ id, text, color: CARD_COLORS[id % CARD_COLORS.length] })), [steps]);
  const [pool, setPool] = useState(() => shuffleChanged(items, (a, b) => a.id === b.id));
  const [placed, setPlaced] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const [tip, setTip] = useState('');
  const timers = useRef([]);
  const shakeTimer = useRef();
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(shakeTimer.current); }, []);

  const complete = placed.length === items.length;

  const pick = (item) => {
    if (complete) return;
    if (item.id !== placed.length) {
      play('wrong');
      setMistakes((m) => m + 1);
      setWrongId(item.id);
      clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setWrongId(null), 500);
      const before = placed.length ? items[placed.at(-1)].text : null;
      setTip(before ? `Not yet! What comes right after “${before.length > 60 ? `${before.slice(0, 57)}…` : before}”?` : 'Hmm, what happens at the very start?');
      return;
    }
    play('correct');
    setTip('');
    setWrongId(null);
    const nextPlaced = [...placed, item.id];
    const nextPool = pool.filter((p) => p.id !== item.id);
    setPlaced(nextPlaced);
    setPool(nextPool);
    if (nextPool.length === 1) {
      // The last card can only go in one place.
      later(() => { setPlaced([...nextPlaced, nextPool[0].id]); setPool([]); }, 550);
    }
    if (nextPool.length <= 1) {
      const n = items.length;
      later(() => onFinish({
        score: Math.max(0, n - mistakes),
        total: n,
        line: mistakes === 0 ? `You put all ${n} cards in order with no mistakes!` : `You put all ${n} cards in order with ${mistakes} ${mistakes === 1 ? 'oops' : 'oopses'}.`,
      }), 1700);
    }
  };

  return (
    <LayoutGroup>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-xl font-semibold text-jungle-900">{title}</p>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-jungle-800 shadow-sm">Oops: {mistakes}</span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {/* Cards still to place */}
        <section aria-label="Cards to place">
          <p className="eyebrow text-mango">{complete ? 'All done!' : placed.length === 0 ? 'Tap what comes first' : 'Tap what comes next'}</p>
          <ul className="mt-3 space-y-2.5">
            {pool.map((item) => (
              <motion.li key={item.id} layout>
                <motion.button
                  layoutId={`order-${item.id}`}
                  onClick={() => pick(item)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex w-full items-center gap-3 rounded-2xl border-3 bg-white p-3 text-left font-bold text-jungle-900 shadow-sm sm:p-4 ${wrongId === item.id ? 'animate-shake border-mango bg-mango/10' : 'border-jungle-800/10 hover:border-lagoon'}`}
                >
                  <span className="h-8 w-2 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden="true" />
                  <span className="flex-1">{item.text}</span>
                </motion.button>
              </motion.li>
            ))}
          </ul>
          <AnimatePresence>
            {tip && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-3 rounded-2xl bg-sunny/30 p-3">
                <Owl className="w-10 shrink-0" />
                <p className="text-sm font-bold text-jungle-900">{tip}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* The order built so far */}
        <section aria-label="Your order">
          <p className="eyebrow text-lagoon-dark">Your order</p>
          <ol className="mt-3 space-y-2.5">
            {items.map((_, slot) => {
              const id = placed[slot];
              const item = id != null ? items[id] : null;
              return (
                <li key={slot} className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold ${item ? 'bg-leaf-dark text-white' : 'bg-jungle-800/10 text-jungle-800/50'}`}>
                    {item ? <Check size={18} /> : slot + 1}
                  </span>
                  {item ? (
                    <motion.div layoutId={`order-${item.id}`} className="flex flex-1 items-center gap-3 rounded-2xl border-3 border-leaf bg-leaf/15 p-3 font-bold text-jungle-900 sm:p-4">
                      <span className="flex-1">{item.text}</span>
                    </motion.div>
                  ) : (
                    <div className="h-14 flex-1 rounded-2xl border-3 border-dashed border-jungle-800/15" />
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </LayoutGroup>
  );
}
