import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { Leaf, Monkey } from '../components/Mascots';
import { ErrorNote, PageLoader, SubjectChip } from '../components/ui';
import { GAMES, PACKS, packFromStory } from '../games/content';
import GameLinks from '../games/GameLinks';
import { subjectById } from '../data/catalog';

export default function Games() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api('/games/stats'), api('/stories')])
      .then(([stats, { stories }]) => setData({ stats, stories }))
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!data) return <PageLoader label="Opening the Game Zone..." />;
  const { stats, stories } = data;
  const xpPct = Math.min(100, Math.round((stats.xpToday / stats.xpCap) * 100));

  return (
    <div className="space-y-8">
      {/* Banner */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-berry to-[#A82A58] p-6 text-white sm:p-8">
        {[8, 30, 62, 90].map((left, i) => (
          <Leaf key={left} className="absolute w-10 opacity-20 animate-float" style={{ left: `${left}%`, top: `${(i * 29) % 75}%`, animationDelay: `${-i}s` }} color={i % 2 ? '#FFD54A' : '#56DB3A'} />
        ))}
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }} className="w-28 shrink-0 animate-bob">
            <Monkey />
          </motion.div>
          <div className="flex-1">
            <p className="eyebrow text-sunny">Game Zone</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Learn by playing! 🎮</h1>
            <p className="mt-1 max-w-lg text-white/85">Every game uses words and ideas from your stories, or from our jungle word packs. Play, practise and earn XP.</p>
          </div>
          <div className="w-full max-w-xs rounded-3xl bg-white/15 p-4 sm:w-64">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Game XP today</span>
              <span>{stats.xpToday} / {stats.xpCap}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-sunny to-leaf" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, delay: 0.3 }} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white/80"><Trophy size={14} /> {stats.played} {stats.played === 1 ? 'game' : 'games'} played</p>
          </div>
        </div>
      </section>

      {/* All games */}
      <section>
        <h2 className="text-2xl font-semibold text-jungle-900">Pick a game</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GAMES.map((g, i) => {
            const best = stats.games[g.id]?.best;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -6 }}>
                <Link to={`/games/${g.id}`} className="card group flex h-full flex-col overflow-hidden">
                  <div className="relative grid h-28 place-items-center" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.dark})` }}>
                    <span className="text-6xl transition group-hover:animate-wiggle" aria-hidden="true">{g.emoji}</span>
                    <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-extrabold" style={{ color: g.dark }}>{g.skill}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-display text-xl font-semibold text-jungle-900">{g.name}</h3>
                    <p className="mt-1 text-sm text-muted">{g.blurb}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-sm font-bold">
                      <span className="text-muted">{best != null ? `Best: ${best}%` : 'New!'}</span>
                      <span className="flex items-center gap-1" style={{ color: g.dark }}>Play <ArrowRight size={16} /></span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Latest stories */}
      <section>
        <h2 className="text-2xl font-semibold text-jungle-900">Play with your stories</h2>
        <p className="text-muted">Practise the new words from what you just read.</p>
        {stories.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center p-8 text-center">
            <p className="text-5xl" aria-hidden="true">📚</p>
            <p className="mt-3 font-display text-xl font-semibold text-jungle-800">No stories yet</p>
            <p className="text-muted">Each story you create comes with its own word games. Try a word pack below while you wait!</p>
            <Link to="/create" className="btn-primary mt-5">Create a story <Sparkles size={18} /></Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {stories.slice(0, 3).map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="card flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center">
                <div className="min-w-0 flex-1">
                  <SubjectChip subject={s.subject} />
                  <Link to={`/stories/${s.id}`} className="mt-1.5 block truncate font-display text-lg font-semibold text-jungle-900 hover:underline">{s.title}</Link>
                </div>
                <GameLinks storyId={s.id} pack={packFromStory(s)} size="sm" />
              </motion.div>
            ))}
            {stories.length > 3 && <Link to="/stories" className="inline-block font-bold text-jungle-700 hover:underline">See all my stories →</Link>}
          </div>
        )}
      </section>

      {/* Word packs */}
      <section>
        <h2 className="text-2xl font-semibold text-jungle-900">Jungle word packs</h2>
        <p className="text-muted">Ready-made words for every subject. No story needed!</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((p, i) => {
            const s = subjectById(p.subject);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.06 }} className="card flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: `${s.color}22` }} aria-hidden="true">{s.emoji}</span>
                  <div>
                    <h3 className="font-display text-lg leading-tight font-semibold text-jungle-900">{p.title}</h3>
                    <p className="text-xs font-bold" style={{ color: s.dark }}>{s.name}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs font-bold text-muted">{p.words.map((w) => w.word).join(' · ')}</p>
                <div className="mt-4 grid grid-cols-4 gap-1.5">
                  {GAMES.filter((g) => g.needsContent !== false).map((g) => (
                    <Link key={g.id} to={`/games/${g.id}?pack=${p.id}`} className="grid h-11 place-items-center rounded-xl text-xl transition hover:-translate-y-0.5" style={{ background: `${g.color}22` }} title={g.name} aria-label={`${g.name} with ${p.title}`}>
                      {g.emoji}
                    </Link>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <p className="text-center text-sm font-bold text-muted">
        Games earn up to {stats.xpCap} XP a day. Quizzes are still the way to level up your subjects!
      </p>
    </div>
  );
}
