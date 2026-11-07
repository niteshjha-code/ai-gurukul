import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BookOpen, Check, RotateCcw, Sparkles, X } from 'lucide-react';
import { api } from '../lib/api';
import { Lion, Monkey, Owl } from '../components/Mascots';
import { celebrate, CountUp, ErrorNote, PageLoader, SubjectChip } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { subjectById } from '../data/catalog';
import GameLinks from '../games/GameLinks';

const LETTERS = ['A', 'B', 'C', 'D'];
const LETTER_COLORS = ['#2BB8BA', '#F68B2F', '#8B5CF6', '#56DB3A'];
const CHEERS = ['Awesome!', 'You got it!', 'Brilliant!', 'Super smart!', 'Roar-some!'];

function ScoreRing({ percent }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const color = percent >= 80 ? '#56DB3A' : percent >= 50 ? '#FFD54A' : '#F68B2F';
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#EFF7F0" strokeWidth="14" />
        <motion.circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - percent / 100) }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-5xl font-bold text-jungle-900"><CountUp value={percent} suffix="%" /></span>
      </div>
    </div>
  );
}

function Results({ result, quiz, onRetry }) {
  const subject = subjectById(result.subject);
  const great = result.percent >= 80;
  const ok = result.percent >= 50;
  const Mascot = great ? Lion : ok ? Monkey : Owl;
  useEffect(() => { if (ok) celebrate(great ? 1.4 : 0.7); }, [ok, great]);

  return (
    <div className="mx-auto max-w-3xl">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card relative overflow-hidden p-6 text-center sm:p-10">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mx-auto w-24 animate-bob"><Mascot /></motion.div>
        <h1 className="mt-2 text-3xl font-bold text-jungle-900 sm:text-4xl">
          {great ? 'Jungle champion! 🏆' : ok ? 'Great effort! 🌟' : 'Nice try, explorer! 🌱'}
        </h1>
        <p className="mt-1 text-muted">You got {result.score} out of {result.total} right.</p>
        <div className="mt-6"><ScoreRing percent={result.percent} /></div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="rounded-2xl bg-sunny/30 p-4">
            <p className="font-display text-3xl font-bold text-jungle-900">+<CountUp value={result.xpGained} /> XP</p>
            <p className="text-sm font-bold text-jungle-800/70">{result.score === result.total ? 'Includes a perfect-score bonus!' : '5 XP for every right answer'}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="rounded-2xl p-4" style={{ background: `${subject.color}22` }}>
            {result.level.after > result.level.before ? (
              <><p className="font-display text-2xl font-bold" style={{ color: subject.dark }}>Level up! ⬆️ {result.level.before} → {result.level.after}</p><p className="text-sm font-bold text-muted">{subject.name} stories get a bit more challenging</p></>
            ) : result.level.after < result.level.before ? (
              <><p className="font-display text-2xl font-bold" style={{ color: subject.dark }}>Practice mode 🌱</p><p className="text-sm font-bold text-muted">Next {subject.name} stories will be a little easier</p></>
            ) : (
              <><p className="font-display text-2xl font-bold" style={{ color: subject.dark }}>{subject.name} level {result.level.after}</p><p className="text-sm font-bold text-muted">Score 80% or more to level up</p></>
            )}
          </motion.div>
        </div>

        {result.newBadges.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow text-mango">New badges!</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {result.newBadges.map((b, i) => (
                <motion.div key={b.id} initial={{ rotateY: 180, scale: 0 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 1.2 + i * 0.25, type: 'spring' }} className="flex items-center gap-2 rounded-2xl bg-jungle-800 px-4 py-2 text-white">
                  <span className="text-2xl">{b.emoji}</span><span className="font-display font-semibold">{b.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={onRetry} className="btn-light"><RotateCcw size={18} /> Try again</button>
          <Link to={`/stories/${quiz.storyId}`} className="btn-light"><BookOpen size={18} /> Read the story</Link>
          <Link to={`/create?subject=${result.subject}`} className="btn-primary"><Sparkles size={18} /> New story</Link>
        </div>

        <div className="mt-8 border-t border-jungle-800/10 pt-6">
          <p className="font-display font-semibold text-jungle-800">Keep learning with a game 🎮</p>
          <GameLinks storyId={quiz.storyId} size="sm" className="mt-3 justify-center" />
        </div>
      </motion.div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-jungle-900">Let's review</h2>
        <ol className="mt-4 space-y-3">
          {result.review.map((q, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="card p-5">
              <div className="flex gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${q.correct ? 'bg-leaf-dark' : 'bg-mango'}`}>{q.correct ? <Check size={18} /> : <X size={18} />}</span>
                <div>
                  <p className="font-bold text-jungle-900">{q.question}</p>
                  <p className="mt-1 text-sm"><span className="font-bold text-leaf-dark">Answer: {q.options[q.answer]}</span>{!q.correct && <span className="text-muted"> • You chose: {q.options[q.choice]}</span>}</p>
                  {q.explanation && <p className="mt-1 text-sm text-muted">{q.explanation}</p>}
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default function Quiz() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null); // { choice, correct, answer, explanation }
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api(`/quizzes/${id}`).then((d) => setQuiz(d.quiz)).catch((err) => setError(err.message));
  }, [id]);

  const choose = async (choice) => {
    if (feedback || checking) return;
    setChecking(true);
    try {
      const d = await api(`/quizzes/${id}/check`, { method: 'POST', body: { index, choice } });
      setFeedback({ choice, ...d, cheer: CHEERS[Math.floor(Math.random() * CHEERS.length)] });
      setAnswers((a) => [...a, choice]);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const next = async () => {
    if (index + 1 < quiz.questions.length) {
      setIndex((i) => i + 1);
      setFeedback(null);
      return;
    }
    setSubmitting(true);
    try {
      const d = await api(`/quizzes/${id}/submit`, { method: 'POST', body: { answers } });
      setResult(d);
      refresh().catch(() => {}); // update header XP; the results screen shows the rewards
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setIndex(0);
    setAnswers([]);
    setFeedback(null);
    setResult(null);
  };

  if (error && !quiz) return <ErrorNote>{error}</ErrorNote>;
  if (!quiz) return <PageLoader label="Getting your quiz ready..." />;
  if (result) return <Results result={result} quiz={quiz} onRetry={retry} />;

  const q = quiz.questions[index];
  const total = quiz.questions.length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SubjectChip subject={quiz.subject} />
          <h1 className="mt-2 font-display text-xl font-semibold text-jungle-900 sm:text-2xl">{quiz.title}</h1>
        </div>
        <span className="rounded-full bg-white px-4 py-2 font-display font-semibold text-jungle-800 shadow-sm">
          Question {index + 1} / {total}
        </span>
      </div>
      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {quiz.questions.map((_, i) => (
          <div key={i} className="h-3 flex-1 overflow-hidden rounded-full bg-jungle-800/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-leaf to-lagoon" initial={false} animate={{ width: i < index || (i === index && feedback) ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }} className="card mt-6 p-5 sm:p-8">
          <h2 className="text-2xl leading-snug font-semibold text-jungle-900 sm:text-3xl">{q.question}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const isAnswer = feedback && i === feedback.answer;
              const isWrongPick = feedback && i === feedback.choice && !feedback.correct;
              return (
                <motion.button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={!!feedback || checking}
                  whileHover={!feedback ? { y: -4, scale: 1.01 } : {}}
                  whileTap={!feedback ? { scale: 0.97 } : {}}
                  animate={isAnswer ? { scale: [1, 1.06, 1] } : {}}
                  className={`flex items-center gap-3 rounded-2xl border-3 p-4 text-left font-bold transition-colors ${
                    isAnswer ? 'border-leaf bg-leaf/20 text-jungle-900' : isWrongPick ? 'animate-shake border-mango bg-mango/15 text-mango-dark' : feedback ? 'border-transparent bg-mint text-muted opacity-70' : 'border-jungle-800/10 bg-white text-jungle-900 hover:border-lagoon'
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-lg text-white" style={{ background: isAnswer ? '#2E9A1C' : isWrongPick ? '#F68B2F' : LETTER_COLORS[i] }}>
                    {isAnswer ? <Check size={20} /> : isWrongPick ? <X size={20} /> : LETTERS[i]}
                  </span>
                  <span>{opt}</span>
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                <div className={`mt-6 flex items-center gap-4 rounded-2xl p-4 ${feedback.correct ? 'bg-leaf/15' : 'bg-sunny/30'}`}>
                  <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="w-16 shrink-0">
                    {feedback.correct ? <Lion /> : <Owl />}
                  </motion.div>
                  <div className="flex-1">
                    <p className="font-display text-xl font-semibold text-jungle-900">{feedback.correct ? feedback.cheer : 'Almost! Here is the answer:'}</p>
                    {feedback.explanation && <p className="text-sm text-jungle-900/80">{feedback.explanation}</p>}
                  </div>
                </div>
                <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>
                <button onClick={next} disabled={submitting} className="btn-primary mt-5 w-full py-4 text-lg">
                  {index + 1 < total ? <>Next question <ArrowRight size={20} /></> : submitting ? 'Counting your stars...' : <>See my score <Sparkles size={20} /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
