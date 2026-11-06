import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { assetUrl } from '../lib/api';
import { SubjectChip } from './ui';
import { Owl } from './Mascots';
import { KINDS, subjectById } from '../data/catalog';

const RETRY_MS = 15_000;
const MAX_RETRIES = 8;

// The backend draws each illustration once (free tier: ~1 image per 45s) and answers 202 until it is ready,
// so show the mascot artwork meanwhile and check back every few seconds.
export function StoryImage({ story, className = '', showStatus = false }) {
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const s = subjectById(story.subject);

  useEffect(() => {
    if (state !== 'waiting' || attempt >= MAX_RETRIES) return;
    const t = setTimeout(() => { setAttempt((a) => a + 1); setState('loading'); }, RETRY_MS);
    return () => clearTimeout(t);
  }, [state, attempt]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${s.color}33, #FFF8E5)` }}>
      {state !== 'waiting' && (
        <img
          src={`${assetUrl(story.imageUrl)}${attempt ? `&try=${attempt}` : ''}`}
          alt={`Illustration for ${story.title}`}
          loading="lazy"
          onLoad={() => setState('loaded')}
          onError={() => setState('waiting')}
          className={`h-full w-full object-cover transition duration-700 ${state === 'loaded' ? 'scale-100 opacity-100' : 'scale-105 opacity-0'}`}
        />
      )}
      {state === 'loading' && attempt === 0 && <div className="skeleton absolute inset-0" />}
      {(state === 'waiting' || (state === 'loading' && attempt > 0)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-3">
            <motion.span className="text-5xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>{s.emoji}</motion.span>
            <Owl className="w-16 animate-bob" />
          </div>
          {showStatus && attempt < MAX_RETRIES && (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-jungle-800">🎨 Guru Owl is painting your picture...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoryCard({ story, index = 0, onDelete }) {
  const kind = KINDS.find((k) => k.id === story.kind);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: Math.min(index, 8) * 0.05 }}
      whileHover={{ y: -6 }}
      className="card group relative flex flex-col overflow-hidden"
    >
      <Link to={`/stories/${story.id}`} className="flex flex-1 flex-col">
        <StoryImage story={story} className="aspect-[16/10]" />
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <SubjectChip subject={story.subject} />
            <span className="text-xs font-bold text-muted">{kind?.emoji} {kind?.name}</span>
          </div>
          <h3 className="mt-3 font-display text-lg leading-snug font-semibold text-jungle-900 group-hover:text-jungle-700">{story.title}</h3>
          {story.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{story.excerpt}</p>}
          <div className="mt-auto flex items-center justify-between pt-4 text-xs font-bold">
            <span className="text-muted">{new Date(story.createdAt + 'Z').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
            {story.bestScore != null
              ? <span className="rounded-full bg-leaf/20 px-2.5 py-1 text-leaf-dark">Best quiz: {story.bestScore}%</span>
              : <span className="rounded-full bg-sunny/40 px-2.5 py-1 text-jungle-900">Quiz waiting 🎯</span>}
          </div>
        </div>
      </Link>
      {onDelete && (
        <button
          onClick={() => onDelete(story)}
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-mango-dark opacity-100 shadow transition hover:bg-mango hover:text-white sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Delete ${story.title}`}
        >
          <Trash2 size={16} />
        </button>
      )}
    </motion.article>
  );
}
