import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft, Award, BookOpen, Brain, ChevronDown, Flame, Gamepad2, HelpCircle, KeyRound, Lightbulb, Lock, LogOut, Pencil,
  Play, Plus, Target, Trash2, TriangleAlert, CircleCheck, UserRound,
} from 'lucide-react';
import { api, timeAgo } from '../lib/api';
import { lastSevenDays } from '../lib/stats';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Avatar } from '../components/Mascots';
import { ChildFormModal } from '../components/ProfileModal';
import ParentGate from '../components/ParentGate';
import { CountUp, ErrorNote, PageLoader, RichText, Stars, SubjectChip } from '../components/ui';
import { useToast } from '../components/Toast';
import { KINDS, subjectById } from '../data/catalog';

const TONES = {
  good: { icon: CircleCheck, className: 'bg-leaf/15 text-leaf-dark' },
  warn: { icon: TriangleAlert, className: 'bg-mango/12 text-mango-dark' },
  info: { icon: Lightbulb, className: 'bg-lagoon/12 text-lagoon-dark' },
};
const AVATAR_BG = { lion: '#FFE7C2', elephant: '#DCEEFA', monkey: '#F3E1D2', owl: '#E9F3E0' };

function useParentApi() {
  const { parentToken } = useAuth();
  return useCallback((path, opts = {}) => api(path, { ...opts, token: parentToken }), [parentToken]);
}

function Insights({ items }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => {
        const tone = TONES[it.tone] ?? TONES.info;
        return (
          <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className={`flex gap-2 rounded-2xl px-3 py-2 text-sm font-bold ${tone.className}`}>
            <tone.icon size={18} className="mt-0.5 shrink-0" /> <span>{it.text}</span>
          </motion.li>
        );
      })}
    </ul>
  );
}

function WeekDots({ weekActivity }) {
  return (
    <div className="flex gap-1.5" aria-label="Days active this week">
      {lastSevenDays(weekActivity).map((d) => (
        <div key={d.key} className="flex flex-col items-center gap-1" title={`${d.label}: ${d.xp} XP`}>
          <span className={`h-3.5 w-3.5 rounded-full ${d.xp ? 'bg-leaf' : 'bg-jungle-800/10'} ${d.today ? 'ring-2 ring-sunny ring-offset-1' : ''}`} />
          <span className="text-[10px] font-bold text-muted">{d.label.slice(0, 2)}</span>
        </div>
      ))}
    </div>
  );
}

function Tile({ icon: Icon, label, value, suffix = '', color }) {
  return (
    <div className="card p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: color }}><Icon size={20} /></span>
      <p className="mt-2 font-display text-2xl font-bold text-jungle-900 sm:text-3xl">{value == null ? '—' : <CountUp value={value} suffix={suffix} />}</p>
      <p className="text-xs font-bold text-muted sm:text-sm">{label}</p>
    </div>
  );
}

function ChildCard({ child, index, onLearn }) {
  const p = child.profile;
  return (
    <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="card flex flex-col p-5">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: AVATAR_BG[p.avatar] }}>
          <Avatar name={p.avatar} className="w-13" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-semibold text-jungle-900">{p.childName}</h3>
          <p className="text-sm text-muted">Age {p.age}{p.grade ? ` • Grade ${p.grade}` : ''}</p>
          <p className="text-xs font-bold text-muted">Last active {timeAgo(child.lastActive)}</p>
        </div>
        <span className="hidden rounded-full bg-sunny/40 px-3 py-1 text-xs font-extrabold whitespace-nowrap text-jungle-900 sm:block">{child.rank.emoji} {child.rank.name}</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          ['Stories', child.totals.stories],
          ['Quizzes', child.totals.quizzes],
          ['Avg', child.totals.avgScore == null ? '—' : `${child.totals.avgScore}%`],
          ['Streak', `${child.streak}🔥`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-mint py-2">
            <p className="font-display text-lg font-bold text-jungle-900">{value}</p>
            <p className="text-[11px] font-bold text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-muted">This week</span>
        <WeekDots weekActivity={child.weekActivity} />
      </div>
      <div className="mt-4 flex-1"><Insights items={child.insights.slice(0, 2)} /></div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link to={`/parent/${p.id}`} className="btn-dark px-3 py-2.5 text-sm">Full report</Link>
        <button onClick={() => onLearn(p)} className="btn-light px-3 py-2.5 text-sm"><Play size={14} className="fill-current" /> Learn as {p.childName}</button>
      </div>
    </motion.article>
  );
}

function AccountSettings({ account, onSaved }) {
  const papi = useParentApi();
  const { toast } = useToast();
  const [name, setName] = useState(account.parentName);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await papi('/parent/account', { method: 'PATCH', body: { parentName: name } });
      onSaved(d.account);
      toast({ title: 'Name saved', emoji: '✅' });
    } catch (err) { setError(err.message); }
  };
  const savePassword = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await papi('/parent/password', { method: 'POST', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      toast({ title: 'Password changed', emoji: '🔐' });
    } catch (err) { setError(err.message); }
  };

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-jungle-900"><KeyRound size={20} /> Account settings</h2>
      <p className="text-sm text-muted">Signed in as {account.email}</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveName} className="space-y-3">
          <label className="block">
            <span className="label">Parent / guardian name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
          </label>
          <button className="btn-light">Save name</button>
        </form>
        <form onSubmit={savePassword} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Current password</span>
              <input className="input" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
            </label>
            <label className="block">
              <span className="label">New password</span>
              <input className="input" type="password" autoComplete="new-password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
            </label>
          </div>
          <button className="btn-light">Change password</button>
        </form>
      </div>
      <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
    </section>
  );
}

function Overview({ onLearn }) {
  const papi = useParentApi();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    papi('/parent/overview').then(setData).catch((err) => setError(err.message));
  }, [papi]);
  useEffect(load, [load]);

  if (error) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!data) return <PageLoader label="Gathering the family report..." />;
  const f = data.family;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-mango">Parent corner</p>
          <h1 className="text-3xl font-bold text-jungle-900 sm:text-4xl">Hello, {data.account.parentName} 👋</h1>
          <p className="text-muted">Here is how your explorers are learning.</p>
        </div>
        {data.children.length < 6 && <button onClick={() => setAdding(true)} className="btn-primary self-start"><Plus size={18} /> Add explorer</button>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile icon={UserRound} label="Explorers" value={f.explorers} color="#0B5A2E" />
        <Tile icon={BookOpen} label="Stories" value={f.stories} color="#2BB8BA" />
        <Tile icon={Target} label="Quizzes" value={f.quizzes} color="#8B5CF6" />
        <Tile icon={HelpCircle} label="Homework questions" value={f.homework} color="#F68B2F" />
        <Tile icon={Award} label="XP this week" value={f.xpThisWeek} color="#2E9A1C" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.children.map((c, i) => <ChildCard key={c.profile.id} child={c} index={i} onLearn={onLearn} />)}
      </div>

      <AccountSettings account={data.account} onSaved={(account) => setData((d) => ({ ...d, account }))} />

      <ChildFormModal
        open={adding}
        title="Add an explorer"
        submitLabel="Add explorer"
        onClose={() => setAdding(false)}
        onSubmit={async (values) => {
          const d = await papi('/parent/children', { method: 'POST', body: values });
          toast({ title: `${d.profile.childName} joined the jungle!`, emoji: '🎉' });
          load();
        }}
      />
    </div>
  );
}

const FEED = {
  story: { icon: BookOpen, color: '#2BB8BA', verb: 'Read a story' },
  quiz: { icon: Target, color: '#8B5CF6', verb: 'Took a quiz' },
  homework: { icon: HelpCircle, color: '#F68B2F', verb: 'Asked for homework help' },
  game: { icon: Gamepad2, color: '#EC5B8E', verb: 'Played a learning game' },
  badge: { icon: Award, color: '#E0AE10', verb: 'Earned a badge' },
};

function HomeworkItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl bg-mint">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 p-3 text-left" aria-expanded={open}>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-jungle-900">{item.question}</span>
          <span className="text-xs text-muted">{subjectById(item.subject)?.name ?? 'General'} • {item.mode} mode • {timeAgo(item.createdAt)}</span>
        </span>
        <ChevronDown size={18} className={`mt-1 shrink-0 text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-3 mb-3 rounded-xl bg-white p-3 text-sm"><RichText text={item.answer} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function ChildDetail({ id, onLearn }) {
  const papi = useParentApi();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    papi(`/parent/children/${id}`).then(setData).catch((err) => setError(err.message));
  }, [papi, id]);
  useEffect(load, [load]);

  const remove = async () => {
    if (!window.confirm(`Remove ${data.profile.childName}'s profile? All their stories, quiz scores and badges will be deleted. This cannot be undone.`)) return;
    try {
      await papi(`/parent/children/${id}`, { method: 'DELETE' });
      toast({ title: 'Profile removed', emoji: '🗑️', tone: 'mango' });
      navigate('/parent');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !data) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!data) return <PageLoader label="Preparing the report..." />;
  const p = data.profile;
  const week = lastSevenDays(data.weekActivity);
  const maxXP = Math.max(20, ...week.map((d) => d.xp));
  const earned = data.badges.filter((b) => b.earned);

  return (
    <div className="space-y-6">
      <Link to="/parent" className="inline-flex items-center gap-1 font-bold text-jungle-700 hover:underline"><ArrowLeft size={18} /> All explorers</Link>

      <section className="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-24 w-24 shrink-0 place-items-center self-center rounded-3xl" style={{ background: AVATAR_BG[p.avatar] }}>
          <Avatar name={p.avatar} className="w-20 animate-bob" />
        </span>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-jungle-900">{p.childName}'s report</h1>
          <p className="text-muted">Age {p.age}{p.grade ? ` • Grade ${p.grade}` : ''} • joined {timeAgo(p.createdAt)} • last active {timeAgo(data.lastActive)}</p>
          <div className="mx-auto mt-3 max-w-sm sm:mx-0">
            <div className="flex justify-between text-xs font-bold text-jungle-800">
              <span>{data.rank.emoji} {data.rank.name}</span>
              <span className="text-muted">{data.rank.nextAt ? `${p.xp} / ${data.rank.nextAt} XP` : `${p.xp} XP`}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mint">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf to-sunny" initial={{ width: 0 }} animate={{ width: `${data.rank.progress}%` }} transition={{ duration: 1 }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:flex-col">
          <button onClick={() => onLearn(p)} className="btn-primary px-4 py-2.5 text-sm"><Play size={14} className="fill-current" /> Learn as {p.childName}</button>
          <button onClick={() => setEditing(true)} className="btn-light px-4 py-2.5 text-sm"><Pencil size={14} /> Edit</button>
          <button onClick={remove} className="btn-ghost px-4 py-2.5 text-sm text-mango-dark"><Trash2 size={14} /> Remove</button>
        </div>
      </section>
      <ErrorNote>{data && error}</ErrorNote>

      {data.insights.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="mb-3 text-xl font-semibold text-jungle-900">What we noticed</h2>
          <Insights items={data.insights} />
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile icon={BookOpen} label="Stories" value={data.totals.stories} color="#2BB8BA" />
        <Tile icon={Target} label="Quizzes" value={data.totals.quizzes} color="#8B5CF6" />
        <Tile icon={Brain} label="Avg. quiz score" value={data.totals.avgScore} suffix="%" color="#2E9A1C" />
        <Tile icon={HelpCircle} label="Homework help" value={data.totals.homework} color="#F68B2F" />
        <Tile icon={Flame} label="Day streak" value={data.streak} color="#C9621A" />
        <Tile icon={Award} label="Active days (7d)" value={data.week.activeDays} color="#0B5A2E" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-jungle-900">Subject levels</h2>
          <p className="text-sm text-muted">Bars show the quiz average. Stars show the reading level, which adapts automatically.</p>
          <ul className="mt-4 space-y-3">
            {data.mastery.map((m) => {
              const s = subjectById(m.subject);
              return (
                <li key={m.subject}>
                  <div className="flex items-center justify-between gap-2 text-sm font-bold">
                    <span className="text-jungle-900">{s.emoji} {s.name} <span className="font-semibold text-muted">• {m.stories} {m.stories === 1 ? 'story' : 'stories'}</span></span>
                    <span className="flex items-center gap-2 text-muted">{m.avgScore != null ? `${m.avgScore}%` : '—'} <Stars level={m.level} /></span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-mint">
                    <motion.div className="h-full rounded-full" style={{ background: s.color }} initial={{ width: 0 }} animate={{ width: `${m.avgScore ?? 0}%` }} transition={{ duration: 0.9 }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-jungle-900">Quiz scores</h2>
            {data.recentAttempts.length === 0 ? (
              <p className="mt-2 text-muted">No quizzes yet.</p>
            ) : (
              <div className="mt-4 flex h-36 items-end gap-2">
                {data.recentAttempts.map((a, i) => {
                  const pct = Math.round((a.score / a.total) * 100);
                  return (
                    <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${a.title}: ${a.score}/${a.total}`}>
                      <span className="text-[11px] font-bold text-muted">{pct}%</span>
                      <motion.div className={`w-full rounded-t-lg ${pct >= 80 ? 'bg-leaf' : pct >= 50 ? 'bg-sunny' : 'bg-mango'}`} initial={{ height: 0 }} animate={{ height: `${Math.max(4, pct)}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} />
                    </div>
                  );
                })}
              </div>
            )}
            {data.recentAttempts.length > 0 && <p className="mt-2 text-xs text-muted">Last {data.recentAttempts.length} quizzes, oldest first</p>}
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-jungle-900">XP this week</h2>
            <div className="mt-4 flex h-28 items-end gap-2">
              {week.map((d, i) => (
                <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <motion.div className={`w-full rounded-t-lg ${d.today ? 'bg-mango' : 'bg-lagoon'}`} initial={{ height: 0 }} animate={{ height: `${Math.max(4, (d.xp / maxXP) * 100)}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} title={`${d.label}: ${d.xp} XP`} />
                  <span className="text-[11px] font-bold text-muted">{d.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-jungle-900">Recent activity</h2>
          {data.activity.length === 0 ? <p className="mt-2 text-muted">Nothing yet.</p> : (
            <ol className="mt-4 space-y-3">
              {data.activity.map((e, i) => {
                const f = FEED[e.type];
                return (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: f.color }}>{e.emoji ? <span>{e.emoji}</span> : <f.icon size={16} />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-jungle-900">
                        {f.verb}{(e.type === 'quiz' || e.type === 'game') && <span className="text-muted"> • {e.score}/{e.total}</span>}
                      </p>
                      <p className="truncate text-sm text-muted">{e.title}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold whitespace-nowrap text-muted">{timeAgo(e.at)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-jungle-900">Homework questions</h2>
          <p className="text-sm text-muted">What {p.childName} asked Guru Owl. Tap to see the answer.</p>
          {data.homework.length === 0 ? <p className="mt-3 text-muted">No questions yet.</p> : (
            <ul className="mt-4 space-y-2">{data.homework.map((h) => <HomeworkItem key={h.id} item={h} />)}</ul>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-jungle-900">Stories ({data.stories.length})</h2>
        {data.stories.length === 0 ? <p className="mt-2 text-muted">No stories yet.</p> : (
          <ul className="mt-4 divide-y divide-jungle-800/5">
            {data.stories.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block truncate font-bold text-jungle-900">{s.title}</span>
                  <span className="text-xs text-muted">{KINDS.find((k) => k.id === s.kind)?.name} about "{s.topic}" • {timeAgo(s.createdAt)}</span>
                </span>
                <SubjectChip subject={s.subject} />
                <Stars level={s.level} />
                <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${s.bestScore == null ? 'bg-mint text-muted' : 'bg-leaf/20 text-leaf-dark'}`}>
                  {s.bestScore == null ? 'No quiz yet' : `Best ${s.bestScore}%`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-jungle-900">Badges ({earned.length}/{data.badges.length})</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.badges.map((b) => (
            <span key={b.id} title={b.desc} className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold ${b.earned ? 'bg-sunny/40 text-jungle-900' : 'bg-mint text-muted/70'}`}>
              <span className={b.earned ? '' : 'grayscale opacity-50'}>{b.emoji}</span> {b.name}
            </span>
          ))}
        </div>
      </section>

      <ChildFormModal
        open={editing}
        title={`Edit ${p.childName}`}
        initial={p}
        onClose={() => setEditing(false)}
        onSubmit={async (values) => {
          await papi(`/parent/children/${id}`, { method: 'PATCH', body: values });
          toast({ title: 'Profile saved', emoji: '✅' });
          load();
        }}
      />
    </div>
  );
}

export default function Parent() {
  const { parentToken, user, lockParent, logout, switchProfile } = useAuth();
  const { childId } = useParams();
  const navigate = useNavigate();
  const backTo = user ? '/dashboard' : '/profiles';

  const learnAs = async (profile) => {
    await switchProfile(profile.id, parentToken);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 border-b border-jungle-800/5 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-18 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo to={backTo} />
            <span className="hidden rounded-full bg-jungle-800 px-3 py-1 text-xs font-extrabold tracking-wide text-sunny uppercase sm:block">Parent corner</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={backTo} className="btn-ghost px-3 py-2 text-sm"><ArrowLeft size={16} /> <span className="hidden sm:inline">Back to learning</span></Link>
            {parentToken && (
              <button onClick={() => { lockParent(); navigate(backTo); }} className="btn-ghost px-3 py-2 text-sm" title="Lock Parent corner">
                <Lock size={16} /> <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost px-3 py-2 text-sm" title="Log out">
              <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {!parentToken ? (
          <div className="py-8"><ParentGate onCancel={() => navigate(backTo)} /></div>
        ) : childId ? (
          <ChildDetail key={childId} id={childId} onLearn={learnAs} />
        ) : (
          <Overview onLearn={learnAs} />
        )}
      </main>
    </div>
  );
}
