import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Dices, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../lib/api';
import { Owl } from '../components/Mascots';
import { ErrorNote, MagicLoader, Stars } from '../components/ui';
import { useToast } from '../components/Toast';
import { KINDS, SUBJECTS, TOPIC_IDEAS, subjectById } from '../data/catalog';

const PLACEHOLDERS = ['How do volcanoes erupt?', 'A story about the solar system', 'Why do cats purr?', 'The life of a raindrop', 'How do we count money?'];

export default function StoryStudio() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { reward } = useToast();
  const [topic, setTopic] = useState(params.get('topic') ?? '');
  const [subject, setSubject] = useState(SUBJECTS.some((s) => s.id === params.get('subject')) ? params.get('subject') : 'science');
  const [kind, setKind] = useState('story');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState(0);
  const [levels, setLevels] = useState({});
  const [dice, setDice] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPlaceholder((p) => (p + 1) % PLACEHOLDERS.length), 3000);
    api('/progress').then((p) => setLevels(Object.fromEntries(p.mastery.map((m) => [m.subject, m.level])))).catch(() => {});
    return () => clearInterval(t);
  }, []);

  const surprise = () => {
    const s = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
    const ideas = TOPIC_IDEAS[s.id];
    setSubject(s.id);
    setTopic(ideas[Math.floor(Math.random() * ideas.length)]);
    setDice((d) => d + 1);
  };

  const generate = async (e) => {
    e.preventDefault();
    if (topic.trim().length < 2) return setError('Type a topic you want to learn about first!');
    setBusy(true);
    setError('');
    try {
      const d = await api('/stories/generate', { method: 'POST', body: { topic: topic.trim(), subject, kind } });
      reward(d);
      navigate(`/stories/${d.story.id}`, { state: { fresh: true } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <div className="py-6">
        <MagicLoader
          title={`Guru Owl is writing your ${kind}...`}
          steps={['Opening the big book of knowledge...', `Collecting facts about "${topic}"...`, 'Adding a sprinkle of jungle magic...', 'Choosing just-right words for you...', 'Almost there, polishing the last page...']}
        />
      </div>
    );
  }

  const current = subjectById(subject);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-4">
        <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} className="w-20 shrink-0 animate-bob sm:w-24"><Owl /></motion.div>
        <div>
          <p className="eyebrow text-mango">Story Studio</p>
          <h1 className="text-3xl font-bold text-jungle-900 sm:text-4xl">What do you want to learn today?</h1>
        </div>
      </div>

      <form onSubmit={generate} className="card mt-6 space-y-7 p-5 sm:p-8">
        <div>
          <label htmlFor="topic" className="label">1. Type a topic or a question</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={120}
              placeholder={PLACEHOLDERS[placeholder]}
              className="input py-4 text-lg"
              autoFocus
            />
            <motion.button type="button" onClick={surprise} whileTap={{ scale: 0.9 }} className="btn-sunny shrink-0">
              <motion.span key={dice} animate={{ rotate: dice ? 360 : 0 }} transition={{ duration: 0.5 }}><Dices size={20} /></motion.span>
              Surprise me
            </motion.button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOPIC_IDEAS[subject].slice(0, 4).map((idea) => (
              <motion.button
                type="button"
                key={idea}
                onClick={() => setTopic(idea)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-mint px-3 py-1.5 text-sm font-bold text-jungle-800 ring-1 ring-jungle-800/10 hover:bg-white"
              >
                {idea}
              </motion.button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="label">2. Choose a subject</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {SUBJECTS.map((s) => {
              const active = s.id === subject;
              return (
                <motion.button
                  type="button"
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  aria-pressed={active}
                  className="relative flex items-center gap-2 rounded-2xl p-3 text-left font-bold transition"
                  style={active ? { background: s.color, color: '#fff', boxShadow: `0 5px 0 ${s.dark}` } : { background: `${s.color}18`, color: s.dark }}
                >
                  <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                  <span className="text-sm leading-tight">{s.name}</span>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            Your {current.name} level: <Stars level={levels[subject] ?? 1} />
            <span className="hidden sm:inline">• stories get harder as you ace quizzes</span>
          </p>
        </fieldset>

        <fieldset>
          <legend className="label">3. Story, poem or rhyme?</legend>
          <div className="inline-flex w-full rounded-full bg-mint p-1.5 sm:w-auto">
            {KINDS.map((k) => (
              <button type="button" key={k.id} onClick={() => setKind(k.id)} aria-pressed={kind === k.id} className="relative flex-1 rounded-full px-5 py-2.5 font-display font-semibold sm:flex-none">
                {kind === k.id && <motion.span layoutId="kind-pill" className="absolute inset-0 rounded-full bg-jungle-800 shadow" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span className={`relative ${kind === k.id ? 'text-white' : 'text-jungle-800'}`}>{k.emoji} {k.name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <AnimatePresence>{error && <ErrorNote>{error}</ErrorNote>}</AnimatePresence>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-primary w-full py-5 text-xl">
          <Wand2 size={24} /> Create my {kind}! <Sparkles size={20} />
        </motion.button>
      </form>
    </div>
  );
}
