import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Lightbulb, Pause, Target, Volume2 } from 'lucide-react';
import { api } from '../lib/api';
import { StoryImage } from '../components/StoryCard';
import { Lion } from '../components/Mascots';
import { ErrorNote, MagicLoader, PageLoader, Stars, SubjectChip } from '../components/ui';
import { KINDS } from '../data/catalog';

function VocabCard({ word, meaning, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      onClick={() => setFlipped((f) => !f)}
      className="h-32 [perspective:800px]"
      aria-label={flipped ? `${word}: ${meaning}` : `Show meaning of ${word}`}
    >
      <motion.div className="relative h-full w-full [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-lagoon p-3 text-white [backface-visibility:hidden]">
          <span className="font-display text-xl font-semibold">{word}</span>
          <span className="mt-1 text-xs opacity-80">Tap to flip</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-sunny p-3 text-sm font-bold text-jungle-900 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {meaning}
        </div>
      </motion.div>
    </motion.button>
  );
}

// Reads the story aloud paragraph by paragraph using the browser's free speech engine.
function useReadAloud(paragraphs) {
  const [current, setCurrent] = useState(-1);
  const stopped = useRef(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = () => {
    stopped.current = true;
    if (supported) window.speechSynthesis.cancel();
    setCurrent(-1);
  };

  const speak = (i = 0) => {
    if (!supported || i >= paragraphs.length || stopped.current) return setCurrent(-1);
    setCurrent(i);
    const u = new SpeechSynthesisUtterance(paragraphs[i]);
    u.rate = 0.9;
    u.pitch = 1.1;
    u.onend = () => speak(i + 1);
    window.speechSynthesis.speak(u);
  };

  const start = () => {
    window.speechSynthesis.cancel();
    stopped.current = false;
    speak(0);
  };

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);
  return { supported, current, playing: current >= 0, start, stop };
}

export default function StoryView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    api(`/stories/${id}`).then((d) => setStory(d.story)).catch((err) => setError(err.message));
  }, [id]);

  const paragraphs = story?.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) ?? [];
  const reader = useReadAloud(paragraphs);

  const startQuiz = async () => {
    reader.stop();
    setQuizBusy(true);
    setQuizError('');
    try {
      const d = await api(`/stories/${id}/quiz`, { method: 'POST' });
      navigate(`/quiz/${d.quizId}`);
    } catch (err) {
      setQuizError(err.message);
      setQuizBusy(false);
    }
  };

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!story) return <PageLoader label="Opening your story..." />;
  if (quizBusy) return <MagicLoader title="Guru Owl is writing your quiz..." steps={['Reading your story carefully...', 'Thinking of fun questions...', 'Hiding the right answers...']} />;

  const kind = KINDS.find((k) => k.id === story.kind);
  const verse = story.kind !== 'story';

  return (
    <article className="mx-auto max-w-4xl">
      <Link to="/stories" className="inline-flex items-center gap-1 font-bold text-jungle-700 hover:underline"><ArrowLeft size={18} /> My library</Link>

      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mt-4 overflow-hidden">
        <StoryImage story={story} showStatus className="aspect-[16/9] sm:aspect-[21/9]" />
        <div className="p-5 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <SubjectChip subject={story.subject} />
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-extrabold text-jungle-800">{kind?.emoji} {kind?.name}</span>
            <span className="flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-xs font-extrabold text-jungle-800">Level <Stars level={story.level} /></span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4 text-3xl leading-tight font-bold text-jungle-900 sm:text-5xl">
            {story.title}
          </motion.h1>

          {reader.supported && (
            <button onClick={reader.playing ? reader.stop : reader.start} className={`mt-5 ${reader.playing ? 'btn-mango' : 'btn-light'}`}>
              {reader.playing ? <><Pause size={18} /> Stop reading</> : <><Volume2 size={18} /> Read it to me</>}
            </button>
          )}

          {story.source === 'offline' && (
            <p className="mt-4 rounded-2xl bg-sunny/25 px-4 py-3 text-sm font-bold text-jungle-900">
              🌙 Guru Owl's AI helpers were resting, so this is a practice story. Try creating it again in a minute for a brand-new AI story!
            </p>
          )}

          <div className={`mt-6 space-y-5 text-lg leading-relaxed text-ink/90 sm:text-xl ${verse ? 'text-center font-display' : ''}`}>
            {paragraphs.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.12 }}
                className={`rounded-2xl px-2 py-1 whitespace-pre-line transition-colors duration-300 ${reader.current === i ? 'bg-sunny/35' : ''} ${i === 0 && !verse ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-none first-letter:font-bold first-letter:text-mango' : ''}`}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {story.moral && (
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[28px] bg-jungle-800 p-6 text-white">
            <p className="eyebrow text-sunny">Remember this</p>
            <p className="mt-2 font-display text-xl">{story.moral}</p>
          </motion.div>
        )}
        {story.funFact && (
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[28px] bg-sunny p-6 text-jungle-900">
            <p className="eyebrow flex items-center gap-1"><Lightbulb size={16} /> Fun fact</p>
            <p className="mt-2 font-display text-xl">{story.funFact}</p>
          </motion.div>
        )}
      </div>

      {story.vocabulary?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-jungle-900">New words 📚</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {story.vocabulary.map((v, i) => <VocabCard key={v.word} {...v} index={i} />)}
          </div>
        </section>
      )}

      <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative mt-10 overflow-hidden rounded-[32px] bg-gradient-to-br from-lagoon to-lagoon-dark p-6 text-white sm:p-10">
        <div className="absolute -right-4 -bottom-6 w-32 animate-bob sm:w-40"><Lion /></div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold">Ready for the quiz?</h2>
          <p className="mt-2 text-white/85">Show what you learned and earn up to 35 XP. Ace it and your next {story.subject} stories level up!</p>
          <div className="mt-4"><ErrorNote>{quizError}</ErrorNote></div>
          <button onClick={startQuiz} className="btn-sunny mt-5 px-8 py-4 text-lg">
            <Target size={20} /> {story.quizId ? 'Play the quiz again' : 'Start the quiz'}
          </button>
        </div>
      </motion.section>
    </article>
  );
}
