import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, ChartNoAxesColumn, Flame, Gamepad2, HelpCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Leaf, Owl } from '../components/Mascots';
import { CountUp, ErrorNote, PageLoader, Stars, SubjectChip } from '../components/ui';
import StoryCard from '../components/StoryCard';
import { subjectById } from '../data/catalog';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTIONS = [
  { to: '/create', title: 'Create a story', text: 'Pick any topic and let the magic begin', icon: Sparkles, className: 'bg-lagoon text-white', shadow: '#13797B' },
  { to: '/games', title: 'Game Zone', text: 'Learn new words and maths by playing', icon: Gamepad2, className: 'bg-berry text-white', shadow: '#A82A58' },
  { to: '/homework', title: 'Ask Guru Owl', text: 'Get hints for tricky homework', icon: HelpCircle, className: 'bg-mango text-white', shadow: '#C9621A' },
  { to: '/progress', title: 'My progress', text: 'Levels, badges and scores', icon: ChartNoAxesColumn, className: 'bg-leaf text-jungle-900', shadow: '#2E9A1C' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    Promise.all([api('/progress'), api('/stories')])
      .then(([progress, { stories }]) => setData({ progress, stories }))
      .catch((err) => setError(err.message));
  };
  useEffect(load, []);

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!data) return <PageLoader label="Gathering your jungle..." />;
  const { progress, stories } = data;
  const rank = progress.rank;

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-jungle-800 to-jungle-950 p-6 text-white sm:p-8">
        {[12, 38, 70, 88].map((left, i) => (
          <Leaf key={left} className="absolute w-10 opacity-20 animate-float" style={{ left: `${left}%`, top: `${(i * 23) % 70}%`, animationDelay: `${-i}s` }} color={i % 2 ? '#FFD54A' : '#56DB3A'} />
        ))}
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }} className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-white/10 ring-4 ring-sunny/60">
            <Avatar name={user.avatar} className="w-24 animate-bob" />
          </motion.div>
          <div className="flex-1">
            <p className="font-display text-sunny">{greeting()},</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{user.childName}! 👋</h1>
            <p className="mt-1 text-white/70">What shall we explore today?</p>
            <div className="mt-4 max-w-md">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-bold sm:justify-between">
                <span>{rank.emoji} {rank.name}</span>
                <span className="text-white/70">{rank.nextAt ? `${rank.xp} / ${rank.nextAt} XP to ${rank.nextName}` : 'Top rank!'}</span>
              </div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/15">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf to-sunny" initial={{ width: 0 }} animate={{ width: `${rank.progress}%` }} transition={{ duration: 1.2, delay: 0.3 }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 lg:grid-cols-3">
            {[
              { label: 'Day streak', value: progress.streak, icon: <Flame className="text-mango" size={18} /> },
              { label: 'Stories', value: progress.totals.stories, icon: <BookOpen className="text-lagoon" size={18} /> },
              { label: 'XP', value: progress.xp, icon: <span className="text-sm">⭐</span> },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 font-display text-2xl font-bold">{s.icon}<CountUp value={s.value} /></div>
                <p className="text-xs font-bold text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a, i) => (
          <motion.div key={a.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={a.to} className={`group flex h-full items-center gap-4 rounded-[28px] p-5 transition hover:-translate-y-1 active:translate-y-1 ${a.className}`} style={{ boxShadow: `0 6px 0 ${a.shadow}` }}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/20 transition group-hover:animate-wiggle"><a.icon size={28} /></span>
              <span className="flex-1">
                <span className="block font-display text-xl font-semibold">{a.title}</span>
                <span className="block text-sm opacity-85">{a.text}</span>
              </span>
              <ArrowRight className="transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Recommendations */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-jungle-900">Picked for you</h2>
            <p className="text-muted">Guru Owl chose these from your progress.</p>
          </div>
          <div className="hidden w-14 animate-bob sm:block"><Owl /></div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {progress.recommendations.map((r, i) => {
            const s = subjectById(r.subject);
            return (
              <motion.div key={r.topic} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.08 }} whileHover={{ y: -6 }}>
                <Link to={`/create?topic=${encodeURIComponent(r.topic)}&subject=${r.subject}`} className="card flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: `${s.color}22` }}>{s.emoji}</span>
                    <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-extrabold text-mango-dark">{r.reason}</span>
                  </div>
                  <p className="mt-4 font-display text-lg leading-snug font-semibold text-jungle-900">{r.topic}</p>
                  <p className="mt-auto pt-3 text-sm font-bold" style={{ color: s.dark }}>{s.name} →</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent stories */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-jungle-900">Continue learning</h2>
            {stories.length > 0 && <Link to="/stories" className="font-bold text-jungle-700 hover:underline">See all</Link>}
          </div>
          {stories.length === 0 ? (
            <div className="card mt-4 flex flex-col items-center p-8 text-center">
              <p className="text-5xl">📚</p>
              <p className="mt-3 font-display text-xl font-semibold text-jungle-800">No stories yet</p>
              <p className="text-muted">Create your very first story and earn the Storyteller badge!</p>
              <Link to="/create" className="btn-primary mt-5">Create my first story <Sparkles size={18} /></Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {stories.slice(0, 4).map((s, i) => <StoryCard key={s.id} story={s} index={i} />)}
            </div>
          )}
        </section>

        {/* Subject levels */}
        <section>
          <h2 className="text-2xl font-semibold text-jungle-900">My levels</h2>
          <div className="card mt-4 divide-y divide-jungle-800/5 p-2">
            {progress.mastery.map((m) => (
              <div key={m.subject} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <SubjectChip subject={m.subject} />
                <Stars level={m.level} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
