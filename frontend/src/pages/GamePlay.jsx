import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Gamepad2, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Lion, Monkey, Owl } from '../components/Mascots';
import { celebrate, CountUp, ErrorNote, PageLoader, SubjectChip } from '../components/ui';
import { subjectById } from '../data/catalog';
import { GAMES, PACKS, canPlay, gameById, packById, packFromStory } from '../games/content';
import { isMuted, onMuteChange, play, setMuted } from '../games/sfx';
import GameLinks from '../games/GameLinks';
import MemoryMatch from '../games/MemoryMatch';
import WordScramble from '../games/WordScramble';
import StoryOrder from '../games/StoryOrder';
import FruitCatch from '../games/FruitCatch';
import MonkeyMath, { MATH_LEVELS } from '../games/MonkeyMath';

const COMPONENTS = { memory: MemoryMatch, scramble: WordScramble, order: StoryOrder, catch: FruitCatch, math: MonkeyMath };

function MuteButton() {
  const [muted, setState] = useState(isMuted);
  useEffect(() => onMuteChange(setState), []);
  return (
    <button onClick={() => setMuted(!muted)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-jungle-800 shadow-sm ring-1 ring-jungle-800/10 hover:bg-mint" aria-label={muted ? 'Turn sound on' : 'Turn sound off'} title={muted ? 'Sound off' : 'Sound on'}>
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

function BigStars({ count }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.svg key={i} viewBox="0 0 24 24" className={`h-14 w-14 sm:h-16 sm:w-16 ${i === 1 ? '-mt-3' : ''}`} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring', stiffness: 220 }} aria-hidden="true">
          <path fill={i < count ? '#FFD54A' : '#E3ECE5'} stroke={i < count ? '#E0AE10' : '#CFDCD2'} strokeWidth="1.2" strokeLinejoin="round" d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </motion.svg>
      ))}
    </div>
  );
}

function Results({ game, outcome, pack, storyId, onAgain }) {
  const pct = Math.round((outcome.score / outcome.total) * 100);
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  const Mascot = stars === 3 ? Lion : stars === 2 ? Monkey : Owl;
  const server = outcome.server;
  const newBest = server && server.previousBest != null && server.percent > server.previousBest;
  useEffect(() => {
    play(stars >= 2 ? 'win' : 'correct');
    if (stars >= 2) celebrate(stars === 3 ? 1.3 : 0.7);
  }, [stars]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto max-w-2xl p-6 text-center sm:p-10">
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="mx-auto w-24 animate-bob"><Mascot /></motion.div>
      <h1 className="mt-2 text-3xl font-bold text-jungle-900 sm:text-4xl">
        {stars === 3 ? 'Jungle superstar! 🏆' : stars === 2 ? 'Great playing! 🌟' : 'Good try, explorer! 🌱'}
      </h1>
      <p className="mt-1 text-muted">{outcome.line}</p>
      <div className="mt-5"><BigStars count={stars} /></div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-sunny/30 p-4">
          {outcome.saving ? (
            <p className="font-display text-xl font-semibold text-jungle-900">Saving your stars…</p>
          ) : server ? (
            <>
              <p className="font-display text-3xl font-bold text-jungle-900">+<CountUp value={server.xpGained} /> XP</p>
              <p className="text-sm font-bold text-jungle-800/70">
                {server.capped ? `You've collected today's ${server.xpCap} game XP. Keep playing for fun!` : `Game XP today: ${server.xpToday} / ${server.xpCap}`}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-mango-dark">{outcome.error || "Your score couldn't be saved."}</p>
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ background: `${game.color}1f` }}>
          <p className="font-display text-3xl font-bold" style={{ color: game.dark }}><CountUp value={pct} suffix="%" /></p>
          <p className="text-sm font-bold text-muted">{newBest ? 'New personal best! 🏅' : `${game.emoji} ${game.name}`}</p>
        </div>
      </div>

      {server?.newBadges?.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow text-mango">New badge!</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {server.newBadges.map((b, i) => (
              <motion.div key={b.id} initial={{ rotateY: 180, scale: 0 }} animate={{ rotateY: 0, scale: 1 }} transition={{ delay: 0.8 + i * 0.25, type: 'spring' }} className="flex items-center gap-2 rounded-2xl bg-jungle-800 px-4 py-2 text-white">
                <span className="text-2xl">{b.emoji}</span><span className="font-display font-semibold">{b.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onAgain} className="btn-primary"><RotateCcw size={18} /> Play again</button>
        {storyId ? (
          <Link to={`/stories/${storyId}`} className="btn-light"><BookOpen size={18} /> Read the story</Link>
        ) : (
          <Link to="/games" className="btn-light"><Gamepad2 size={18} /> Game Zone</Link>
        )}
      </div>

      {pack && GAMES.some((g) => g.needsContent !== false && g.id !== game.id && canPlay(g.id, pack)) && (
        <div className="mt-8 border-t border-jungle-800/10 pt-6">
          <p className="font-display font-semibold text-jungle-800">Try another game with these words</p>
          <GameLinks storyId={storyId} packId={pack.id} pack={pack} exclude={game.id} size="sm" className="mt-3 justify-center" />
        </div>
      )}
    </motion.div>
  );
}

// Shown when a word game is opened without a story or pack: choose what to play with.
function ContentPicker({ game }) {
  const [stories, setStories] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/stories').then((d) => setStories(d.stories)).catch((err) => setError(err.message));
  }, []);
  const playable = (stories ?? []).filter((s) => canPlay(game.id, packFromStory(s)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-jungle-900">{game.emoji} {game.name}</h1>
        <p className="mt-1 text-muted">What shall we play with?</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-jungle-900">Words from my stories</h2>
        <ErrorNote>{error}</ErrorNote>
        {!stories && !error && <div className="skeleton mt-3 h-20 rounded-2xl" />}
        {stories && playable.length === 0 && (
          <div className="card mt-3 flex flex-wrap items-center gap-4 p-5">
            <span className="text-4xl" aria-hidden="true">📚</span>
            <p className="flex-1 text-muted">{stories.length ? 'Your stories don’t have enough new words for this game yet.' : 'Make a story first and its new words become a game!'}</p>
            <Link to="/create" className="btn-primary">Create a story</Link>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playable.slice(0, 9).map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/games/${game.id}?story=${s.id}`} className="card flex h-full items-center gap-3 p-4 transition hover:-translate-y-1">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${subjectById(s.subject).color}22` }}>{subjectById(s.subject).emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display font-semibold text-jungle-900">{s.title}</span>
                  <span className="block truncate text-xs font-bold text-muted">{s.vocabulary.map((v) => v.word).join(' · ')}</span>
                </span>
                <Play size={18} className="shrink-0 text-jungle-700" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-jungle-900">Jungle word packs</h2>
        <p className="text-sm text-muted">Ready-made words from every subject.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.filter((p) => canPlay(game.id, p)).map((p, i) => {
            const s = subjectById(p.subject);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }} whileHover={{ y: -4 }}>
                <Link to={`/games/${game.id}?pack=${p.id}`} className="card flex h-full flex-col p-4">
                  <span className="text-3xl" aria-hidden="true">{s.emoji}</span>
                  <span className="mt-2 font-display text-lg font-semibold text-jungle-900">{p.title}</span>
                  <span className="text-xs font-bold" style={{ color: s.dark }}>{s.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Intro({ game, pack, level, onLevel, onStart }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-2xl overflow-hidden">
      <div className="relative p-6 text-center text-white sm:p-8" style={{ background: `linear-gradient(135deg, ${game.color}, ${game.dark})` }}>
        <motion.span className="inline-block text-6xl" animate={{ rotate: [0, -10, 10, 0], y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }} aria-hidden="true">{game.emoji}</motion.span>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{game.name}</h1>
        <p className="mt-1 text-white/90">{game.blurb}</p>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="font-display text-lg font-semibold text-jungle-900">How to play</h2>
        <ol className="mt-3 space-y-2">
          {game.howTo.map((step, i) => (
            <li key={step} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white" style={{ background: game.color }}>{i + 1}</span>
              <span className="pt-0.5 text-jungle-900">{step}</span>
            </li>
          ))}
        </ol>

        {game.id === 'math' && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold text-jungle-900">Pick your level</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {MATH_LEVELS.map((l) => (
                <button key={l.level} onClick={() => onLevel(l.level)} className={`rounded-2xl border-3 p-3 text-center transition ${level === l.level ? 'border-berry bg-berry/10' : 'border-jungle-800/10 bg-white hover:border-berry/50'}`} aria-pressed={level === l.level}>
                  <span className="block font-display text-2xl font-bold text-jungle-900">{l.level}</span>
                  <span className="block text-xs font-bold text-muted">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pack && (
          <div className="mt-6 rounded-2xl bg-mint p-4">
            <p className="text-sm font-bold text-muted">Playing with</p>
            <p className="font-display text-lg font-semibold text-jungle-900">{pack.title}</p>
            {game.id !== 'order' && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pack.words.map((w) => <span key={w.word} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-jungle-800">{w.word}</span>)}
              </div>
            )}
          </div>
        )}

        <button onClick={onStart} className="btn-primary mt-6 w-full py-4 text-lg"><Play size={20} /> Let's play!</button>
      </div>
    </motion.div>
  );
}

export default function GamePlay() {
  const { game: gameId } = useParams();
  const [params] = useSearchParams();
  const storyId = params.get('story');
  const packId = params.get('pack');
  const game = gameById(gameId);
  const needsContent = game?.needsContent !== false;
  const { refresh } = useAuth();

  const [pack, setPack] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('intro'); // intro | play | done
  const [run, setRun] = useState(0);
  const [level, setLevel] = useState(null);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    setStage('intro');
    setOutcome(null);
    setError('');
    setPack(null);
    if (!game || !needsContent) return;
    if (storyId) {
      api(`/stories/${storyId}`).then((d) => setPack(packFromStory(d.story))).catch((err) => setError(err.message));
    } else if (packId) {
      const p = packById(packId);
      if (p) setPack(p);
      else setError("We couldn't find that word pack.");
    }
  }, [game, needsContent, storyId, packId]);

  // Monkey Math starts at the child's maths level.
  useEffect(() => {
    if (gameId !== 'math') return;
    api('/games/stats').then((s) => setLevel((l) => l ?? s.mathLevel)).catch(() => setLevel((l) => l ?? 1));
  }, [gameId]);

  // Each new screen (how to play, the game, the score) starts at the top.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [stage, run]);

  const finish = (result) => {
    setOutcome({ ...result, saving: true });
    setStage('done');
    api('/games/finish', {
      method: 'POST',
      body: { game: game.id, score: result.score, total: result.total, storyId: pack?.storyId ?? undefined, subject: pack?.subject },
    })
      .then((server) => {
        setOutcome((o) => ({ ...o, saving: false, server }));
        refresh().catch(() => {});
      })
      .catch((err) => setOutcome((o) => ({ ...o, saving: false, error: err.message })));
  };

  const again = () => {
    setRun((r) => r + 1);
    setOutcome(null);
    setStage('play');
  };

  if (!game) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-5xl">🙈</p>
        <h1 className="mt-3 text-2xl font-semibold text-jungle-900">We couldn't find that game</h1>
        <Link to="/games" className="btn-primary mt-5">Go to the Game Zone</Link>
      </div>
    );
  }

  const back = storyId ? { to: `/stories/${storyId}`, label: 'Back to story' } : { to: '/games', label: 'Game Zone' };
  const header = (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <Link to={back.to} className="inline-flex items-center gap-1 font-bold text-jungle-700 hover:underline"><ArrowLeft size={18} /> {back.label}</Link>
      <div className="flex items-center gap-2">
        {pack && <span className="hidden sm:block"><SubjectChip subject={pack.subject} /></span>}
        {stage !== 'intro' && <span className="rounded-full bg-white px-3 py-1.5 font-display text-sm font-semibold whitespace-nowrap text-jungle-800 shadow-sm">{game.emoji} {game.name}</span>}
        <MuteButton />
      </div>
    </div>
  );

  if (needsContent && !storyId && !packId) return <div>{header}<ContentPicker game={game} /></div>;
  if (error) return <div>{header}<ErrorNote>{error}</ErrorNote></div>;
  if (needsContent && !pack) return <PageLoader label="Setting up the game..." />;
  if (game.id === 'math' && level == null) return <PageLoader label="Setting up the game..." />;

  if (needsContent && !canPlay(game.id, pack)) {
    const others = GAMES.filter((g) => g.needsContent !== false && g.id !== game.id && canPlay(g.id, pack));
    return (
      <div>
        {header}
        <div className="card mx-auto max-w-xl p-8 text-center">
          <Owl className="mx-auto w-24 animate-bob" />
          <h1 className="mt-3 text-2xl font-semibold text-jungle-900">This one needs a few more words</h1>
          <p className="mt-1 text-muted">“{pack.title}” doesn't have enough material for {game.name}.{others.length ? ' Try one of these instead:' : ''}</p>
          {others.length > 0 && <GameLinks storyId={storyId} packId={pack.id} pack={pack} exclude={game.id} size="sm" className="mt-4 justify-center" />}
          <Link to={`/games/${game.id}`} className="btn-light mt-6">Pick other words</Link>
        </div>
      </div>
    );
  }

  const Game = COMPONENTS[game.id];
  return (
    <div>
      {header}
      {stage === 'intro' && <Intro game={game} pack={pack} level={level} onLevel={setLevel} onStart={() => setStage('play')} />}
      {stage === 'play' && (
        <div className={game.id === 'order' || game.id === 'memory' ? 'mx-auto max-w-5xl' : 'mx-auto max-w-3xl'}>
          <Game key={run} pack={pack} level={level} onFinish={finish} />
        </div>
      )}
      {stage === 'done' && outcome && <Results game={game} outcome={outcome} pack={pack} storyId={storyId} onAgain={again} />}
    </div>
  );
}
