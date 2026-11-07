import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GAMES, canPlay } from './content';

// Buttons that open each word game for one story or pack. Games without enough material are left out.
export default function GameLinks({ storyId, packId, pack, exclude, size = 'md', className = '' }) {
  const query = storyId != null ? `story=${storyId}` : `pack=${packId}`;
  const games = GAMES.filter((g) => g.needsContent !== false && g.id !== exclude && (!pack || canPlay(g.id, pack)));
  if (games.length === 0) return null;

  if (size === 'sm') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {games.map((g) => (
          <Link key={g.id} to={`/games/${g.id}?${query}`} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ background: g.dark }}>
            <span aria-hidden="true">{g.emoji}</span> {g.name}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`}>
      {games.map((g, i) => (
        <motion.div key={g.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} whileHover={{ y: -5 }}>
          <Link to={`/games/${g.id}?${query}`} className="flex h-full flex-col items-center rounded-3xl p-4 text-center text-white" style={{ background: g.color, boxShadow: `0 6px 0 ${g.dark}` }}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/25 text-3xl" aria-hidden="true">{g.emoji}</span>
            <span className="mt-2 font-display text-lg leading-tight font-semibold">{g.name}</span>
            <span className="mt-0.5 text-xs font-bold opacity-90">{g.skill}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
