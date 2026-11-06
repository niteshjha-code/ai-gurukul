import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, Brain, Flame, Target } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Mascots';
import { CountUp, ErrorNote, PageLoader, Stars } from '../components/ui';
import { subjectById } from '../data/catalog';
import { lastSevenDays } from '../lib/stats';

const RANKS = [
  { name: 'Seedling', emoji: '🌱' }, { name: 'Sprout', emoji: '🌿' }, { name: 'Explorer', emoji: '🧭' },
  { name: 'Ranger', emoji: '🏕️' }, { name: 'Guardian', emoji: '🛡️' }, { name: 'Jungle Legend', emoji: '👑' },
];

function Section({ title, children, className = '' }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} className={`card p-5 sm:p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-jungle-900">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/progress').then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <PageLoader label="Counting your stars..." />;

  const week = lastSevenDays(data.weekActivity);
  const maxXP = Math.max(20, ...week.map((d) => d.xp));
  const earned = data.badges.filter((b) => b.earned).length;

  const tiles = [
    { label: 'Day streak', value: data.streak, icon: Flame, color: '#F68B2F' },
    { label: 'Stories', value: data.totals.stories, icon: BookOpen, color: '#2BB8BA' },
    { label: 'Quizzes', value: data.totals.quizzes, icon: Target, color: '#8B5CF6' },
    { label: 'Avg. quiz score', value: data.totals.avgScore, suffix: '%', icon: Brain, color: '#2E9A1C' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 animate-bob sm:w-20"><Avatar name={user.avatar} /></div>
        <div>
          <p className="eyebrow text-lagoon-dark">My progress</p>
          <h1 className="text-3xl font-bold text-jungle-900 sm:text-4xl">Look how far you've come!</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div key={t.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: t.color }}><t.icon size={22} /></span>
            <p className="mt-3 font-display text-3xl font-bold text-jungle-900 sm:text-4xl">{t.value == null ? '—' : <CountUp value={t.value} suffix={t.suffix} />}</p>
            <p className="text-sm font-bold text-muted">{t.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Rank journey */}
      <Section title={`Jungle rank: ${data.rank.emoji} ${data.rank.name}`}>
        <p className="text-sm text-muted">
          {data.rank.nextAt ? `${data.rank.nextAt - data.xp} XP to become a ${data.rank.nextName}.` : 'You reached the top rank. Legendary!'} You have {data.xp} XP.
        </p>
        <div className="relative mt-8 mb-2">
          <div className="absolute top-6 right-6 left-6 h-2 rounded-full bg-jungle-800/10" />
          <motion.div
            className="absolute top-6 left-6 h-2 rounded-full bg-gradient-to-r from-leaf to-sunny"
            initial={{ width: 0 }}
            whileInView={{ width: `calc((100% - 3rem) * ${(data.rank.index + data.rank.progress / 100) / (RANKS.length - 1)})` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4 }}
          />
          <ol className="relative flex justify-between">
            {RANKS.map((r, i) => {
              const reached = i <= data.rank.index;
              return (
                <li key={r.name} className="flex w-12 flex-col items-center text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.12, type: 'spring' }}
                    className={`grid h-14 w-14 place-items-center rounded-full text-2xl ${i === data.rank.index ? 'bg-sunny ring-4 ring-sunny/40' : reached ? 'bg-leaf/30' : 'bg-mint grayscale'}`}
                  >
                    {r.emoji}
                  </motion.span>
                  <span className={`mt-2 hidden text-xs font-bold sm:block ${reached ? 'text-jungle-800' : 'text-muted/70'}`}>{r.name}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Subject levels">
          <p className="text-sm text-muted">Score 80% or more in a quiz to level up a subject.</p>
          <ul className="mt-4 space-y-4">
            {data.mastery.map((m, i) => {
              const s = subjectById(m.subject);
              return (
                <li key={m.subject}>
                  <div className="flex items-center justify-between gap-2 text-sm font-bold">
                    <span className="text-jungle-900">{s.emoji} {s.name}</span>
                    <span className="flex items-center gap-2 text-muted">{m.avgScore != null ? `${m.avgScore}% avg` : 'Not tried yet'} <Stars level={m.level} /></span>
                  </div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-mint">
                    <motion.div className="h-full rounded-full" style={{ background: s.color }} initial={{ width: 0 }} whileInView={{ width: `${m.avgScore ?? 0}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.06 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <div className="space-y-6">
          <Section title="This week">
            <div className="mt-4 flex h-40 items-end gap-2 sm:gap-3">
              {week.map((d, i) => (
                <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-muted">{d.xp || ''}</span>
                  <motion.div
                    className={`w-full rounded-t-xl ${d.today ? 'bg-mango' : 'bg-lagoon'}`}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${Math.max(4, (d.xp / maxXP) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.06 }}
                    title={`${d.label}: ${d.xp} XP`}
                  />
                  <span className={`text-xs font-bold ${d.today ? 'text-mango-dark' : 'text-muted'}`}>{d.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">XP earned each day</p>
          </Section>

          <Section title="Recent quiz scores">
            {data.recentAttempts.length === 0 ? (
              <p className="mt-3 text-muted">No quizzes yet. <Link to="/create" className="font-bold text-jungle-700 underline">Create a story</Link> and take its quiz!</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {[...data.recentAttempts].reverse().slice(0, 5).map((a, i) => {
                  const pct = Math.round((a.score / a.total) * 100);
                  return (
                    <li key={i}>
                      <Link to={`/stories/${a.storyId}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-mint">
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display font-bold text-white ${pct >= 80 ? 'bg-leaf-dark' : pct >= 50 ? 'bg-sunny-dark' : 'bg-mango'}`}>{pct}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-jungle-900">{a.title}</span>
                          <span className="text-xs text-muted">{a.score}/{a.total} correct • {subjectById(a.subject).name}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>

      <Section title={`Badges (${earned}/${data.badges.length})`}>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.badges.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, rotateY: 90 }}
              whileInView={{ opacity: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              whileHover={b.earned ? { scale: 1.06, rotate: -2 } : {}}
              className={`flex flex-col items-center rounded-3xl p-4 text-center ${b.earned ? 'bg-gradient-to-br from-sunny/50 to-cream ring-2 ring-sunny' : 'bg-mint'}`}
            >
              <span className={`text-4xl ${b.earned ? '' : 'opacity-40 grayscale'}`}>{b.earned ? b.emoji : '🔒'}</span>
              <span className="mt-2 font-display font-semibold text-jungle-900">{b.name}</span>
              <span className="text-xs text-muted">{b.desc}</span>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
