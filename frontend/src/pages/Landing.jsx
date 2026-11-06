import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { ArrowRight, BookOpen, Brain, HeartHandshake, HelpCircle, Lock, Play, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import JungleScene, { FallingLeaves } from '../components/JungleScene';
import Logo from '../components/Logo';
import { Bee, Elephant, Leaf, Lion, Monkey, Owl } from '../components/Mascots';
import { Reveal } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Sparkles, title: 'AI Story Generation', text: 'Type any topic and get a magical story, poem or rhyme made just for your reading level.', color: '#0B5A2E', bg: '#E3F3E8', mascot: Owl },
  { icon: HelpCircle, title: 'Interactive Quizzes', text: 'Every story becomes a fun quiz with instant feedback, cheers and friendly explanations.', color: '#13797B', bg: '#DDF4F4', mascot: Monkey },
  { icon: TrendingUp, title: 'Personalized Learning', text: 'Ace a quiz and stories get a little harder. Need practice? We slow down. Just right, every time.', color: '#C9621A', bg: '#FDEBDC', mascot: Lion },
  { icon: Brain, title: 'Homework Help', text: 'Stuck? Guru Owl gives hints first, then steps, so you learn how to solve it yourself.', color: '#06381F', bg: '#F2F0D6', mascot: Elephant },
];

const STEPS = [
  { n: '01', title: 'Join the jungle', text: 'Create an account with a grown-up', color: '#0B5A2E' },
  { n: '02', title: 'Dashboard', text: 'Your learning space and rewards', color: '#2BB8BA' },
  { n: '03', title: 'Pick a topic', text: 'Anything you are curious about', color: '#FFD54A', dark: true },
  { n: '04', title: 'AI story', text: 'A story made just for you', color: '#F68B2F' },
  { n: '05', title: 'Quiz time', text: 'Check what you learned', color: '#0B5A2E' },
  { n: '06', title: 'Grow', text: 'Track progress and level up', color: '#2BB8BA' },
];

function Hero() {
  const { user } = useAuth();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const words = ['Learning', 'is', 'a', 'jungle', 'adventure!'];

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-start overflow-hidden pt-28 pb-56 sm:pt-32 lg:items-center lg:pb-40">
      <JungleScene />
      <motion.div style={{ y: textY }} className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 font-display text-sm font-semibold text-jungle-800 shadow-sm backdrop-blur"
          >
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-leaf" /></span>
            AI-powered learning made playful
          </motion.span>
          <h1 className="mt-5 text-5xl leading-[1.05] font-bold text-jungle-900 sm:text-6xl xl:text-7xl">
            {words.map((w, i) => (
              <motion.span
                key={w}
                className={`mr-3 inline-block ${w === 'jungle' ? 'text-mango' : ''} ${w === 'adventure!' ? 'text-lagoon-dark' : ''}`}
                initial={{ opacity: 0, y: 40, rotate: -6 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.15 + i * 0.1, type: 'spring', stiffness: 200, damping: 14 }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mx-auto mt-5 max-w-xl text-lg text-jungle-900/75 sm:text-xl lg:mx-0">
            Stories, quizzes, homework help and progress tracking, all in one friendly jungle where curious kids love to learn.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary px-8 py-4 text-lg">
              Start your adventure <ArrowRight size={20} />
            </Link>
            <a href="#how" className="btn-light px-7 py-4 text-lg">
              <Play size={18} className="fill-current" /> See how it works
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-bold text-jungle-800/80 lg:justify-start">
            <span>✅ Free to use</span><span>🛡️ Kid-safe AI</span><span>📱 Works on any device</span>
          </motion.div>
        </div>
        <HeroDemo />
      </motion.div>
    </section>
  );
}

// A floating preview card that types a prompt and "generates" a story.
function HeroDemo() {
  const prompt = 'Tell me a story about the solar system';
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState('typing');

  useEffect(() => {
    if (phase === 'typing') {
      if (typed.length < prompt.length) {
        const t = setTimeout(() => setTyped(prompt.slice(0, typed.length + 1)), 55);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase('thinking'), 500);
      return () => clearTimeout(t);
    }
    if (phase === 'thinking') {
      const t = setTimeout(() => setPhase('done'), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setTyped(''); setPhase('typing'); }, 6000);
    return () => clearTimeout(t);
  }, [typed, phase]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 120 }}
      className="relative mx-auto hidden w-full max-w-md sm:block"
    >
      <div className="absolute -top-14 -right-6 z-10 w-28 animate-float"><Owl /></div>
      <div className="card rotate-1 overflow-hidden p-5">
        <div className="flex items-center gap-2 border-b border-jungle-800/10 pb-3">
          <span className="h-3 w-3 rounded-full bg-mango" /><span className="h-3 w-3 rounded-full bg-sunny" /><span className="h-3 w-3 rounded-full bg-leaf" />
          <span className="ml-2 font-display text-sm font-semibold text-muted">Story Studio</span>
        </div>
        <div className="mt-4 rounded-2xl bg-mint p-3 font-semibold text-jungle-800">
          {typed}
          {phase === 'typing' && <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-jungle-800" />}
        </div>
        <div className="mt-4 min-h-44">
          {phase === 'thinking' && (
            <div className="flex items-center gap-3 text-muted">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-lagoon" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
              Guru Owl is writing...
            </div>
          )}
          {phase === 'done' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.h3 initial={{ y: 10 }} animate={{ y: 0 }} className="text-xl font-semibold text-jungle-800">🪐 Leo's Trip Around the Sun</motion.h3>
              {[
                'Leo the lion zoomed past Mercury, the tiniest planet...',
                'Next came Venus, wrapped in thick, swirly clouds...',
              ].map((line, i) => (
                <motion.p key={line} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.4 }} className="mt-2 text-sm text-muted">
                  {line}
                </motion.p>
              ))}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mt-4 flex gap-2">
                <span className="rounded-full bg-lagoon/15 px-3 py-1 text-xs font-extrabold text-lagoon-dark">🪐 Space</span>
                <span className="rounded-full bg-sunny/40 px-3 py-1 text-xs font-extrabold text-jungle-900">Quiz ready! 🎯</span>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -bottom-6 -left-8 rounded-2xl bg-sunny px-4 py-3 font-display font-semibold text-jungle-900 shadow-lg"
      >
        +15 XP ⭐
      </motion.div>
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-mango">Core features</p>
          <h2 className="mt-3 text-4xl font-bold text-jungle-900 sm:text-5xl">Four ways we make learning fun</h2>
          <p className="mt-4 text-lg text-muted">Each feature has one simple goal: make kids <em>want</em> to keep learning.</p>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <motion.article
                whileHover={{ y: -10, rotate: i % 2 ? 1 : -1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="card group relative h-full overflow-hidden p-7"
              >
                <div className="absolute -right-6 -bottom-6 w-28 opacity-15 transition duration-500 group-hover:-translate-y-3 group-hover:opacity-100">
                  <f.mascot />
                </div>
                <div className="flex items-start justify-between">
                  <span className="grid h-16 w-16 place-items-center rounded-full text-white shadow-lg transition group-hover:animate-wiggle" style={{ background: f.color }}>
                    <f.icon size={28} />
                  </span>
                  <span className="font-display text-sm font-bold text-muted">0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-2xl leading-tight font-semibold" style={{ color: f.color }}>{f.title}</h3>
                <p className="relative mt-3 text-muted">{f.text}</p>
                <div className="mt-6 h-1.5 w-12 rounded-full transition-all duration-500 group-hover:w-full" style={{ background: f.color }} />
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Journey() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <section id="how" className="relative scroll-mt-20 overflow-hidden bg-mint py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-lagoon-dark">The learning journey</p>
          <h2 className="mt-3 text-4xl font-bold text-jungle-900 sm:text-5xl">From login to learning in six happy steps</h2>
          <p className="mt-4 text-lg text-muted">It is a loop, not a one-time activity, so every visit builds on the last one.</p>
        </Reveal>

        <div ref={ref} className="relative mt-16">
          {/* Connector line: horizontal on desktop, vertical on mobile */}
          <motion.div className="absolute top-12 right-[8%] left-[8%] hidden h-1 origin-left rounded-full bg-[repeating-linear-gradient(90deg,#0B5A2E55_0_10px,transparent_10px_18px)] lg:block" initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 1.6, ease: 'easeInOut' }} />
          <motion.div className="absolute top-0 bottom-0 left-12 w-1 origin-top rounded-full bg-[repeating-linear-gradient(180deg,#0B5A2E55_0_10px,transparent_10px_18px)] lg:hidden" initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : {}} transition={{ duration: 1.6, ease: 'easeInOut' }} />
          <ol className="relative grid gap-8 lg:grid-cols-6 lg:gap-4">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.25 * i, type: 'spring', stiffness: 220, damping: 15 }}
                className="flex items-center gap-5 lg:flex-col lg:text-center"
              >
                <motion.span
                  whileHover={{ scale: 1.12, rotate: 8 }}
                  className={`grid h-24 w-24 shrink-0 place-items-center rounded-full font-display text-3xl font-bold shadow-[0_8px_0_rgb(0_0_0/0.12)] ${s.dark ? 'text-jungle-900' : 'text-white'}`}
                  style={{ background: s.color }}
                >
                  {s.n}
                </motion.span>
                <div>
                  <h3 className="text-xl font-semibold text-jungle-900">{s.title}</h3>
                  <p className="mt-1 text-muted">{s.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
      <div className="mt-16 overflow-hidden border-y-2 border-jungle-800/10 bg-white py-4">
        <div className="flex w-max animate-marquee gap-10 font-display text-xl font-semibold whitespace-nowrap text-jungle-800 sm:text-2xl">
          {Array.from({ length: 2 }, (_, k) => (
            <div key={k} className="flex gap-10" aria-hidden={k === 1}>
              {['LEARN', 'CHECK', 'TRACK', 'PERSONALIZE', 'LEARN AGAIN', 'EXPLORE', 'PLAY', 'IMPROVE'].map((w, i) => (
                <span key={w} className="flex items-center gap-10">
                  <span style={{ color: ['#0B5A2E', '#13797B', '#C9621A', '#2E9A1C'][i % 4] }}>{w}</span>
                  <Leaf className="w-6" color="#FFD54A" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIMagic() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });
  const outputs = [
    { title: 'Story', text: 'Engaging learning content', color: '#2BB8BA', icon: BookOpen },
    { title: 'Quiz', text: 'Questions to check learning', color: '#FFD54A', icon: HelpCircle },
    { title: 'Help', text: 'Homework support', color: '#F68B2F', icon: Brain },
    { title: 'Progress', text: 'Learning pace & tracking', color: '#56DB3A', icon: TrendingUp },
  ];
  return (
    <section id="ai" className="relative scroll-mt-20 overflow-hidden bg-jungle-900 py-20 text-white sm:py-28">
      <FallingLeaves count={6} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-sunny">The AI experience</p>
          <h2 className="mt-3 text-4xl font-bold sm:text-5xl">One question. A whole world of learning.</h2>
          <p className="mt-4 text-lg text-white/70">Our AI learning engine turns a simple idea into stories, quizzes, help and progress, all tuned to your child.</p>
        </Reveal>

        <div ref={ref} className="mt-14 grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr_auto_1.3fr]">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }} className="rounded-[28px] bg-jungle-700 p-7">
            <p className="eyebrow text-sunny">You ask</p>
            <p className="mt-3 font-display text-2xl font-semibold">"Tell me a story about the solar system."</p>
            <p className="mt-4 text-sm text-white/60">Any topic • Any subject</p>
          </motion.div>
          <motion.div className="mx-auto h-12 w-1 bg-sunny lg:h-1 lg:w-12" initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: 0.5 }} />
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.6, type: 'spring' }} className="rounded-[32px] bg-white p-8 text-center text-jungle-900">
            <div className="relative mx-auto grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rounded-full bg-leaf/50 animate-pulse-ring" />
              <span className="absolute inset-0 rounded-full bg-leaf/40 animate-pulse-ring [animation-delay:1.2s]" />
              <span className="relative grid h-24 w-24 place-items-center rounded-full bg-leaf font-display text-3xl font-bold shadow-lg">AI</span>
            </div>
            <p className="mt-5 font-display text-xl font-bold text-jungle-800">AI Learning Engine</p>
            <p className="mt-1 text-muted">Generate • Understand • Adapt</p>
          </motion.div>
          <motion.div className="mx-auto h-12 w-1 bg-sunny lg:h-1 lg:w-12" initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: 1 }} />
          <div className="grid grid-cols-2 gap-4">
            {outputs.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1 + i * 0.15 }}
                whileHover={{ scale: 1.05 }}
                className="rounded-3xl bg-jungle-700 p-5"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full text-jungle-900" style={{ background: o.color }}>
                  <o.icon size={20} />
                </span>
                <p className="mt-3 font-display text-lg font-semibold">{o.title}</p>
                <p className="text-sm text-white/65">{o.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ForParents() {
  const items = [
    { icon: ShieldCheck, title: 'Kid-safe AI', text: 'Topics are checked and the AI is told to keep everything friendly, accurate and age-appropriate.' },
    { icon: Lock, title: 'Grown-up consent', text: 'Accounts are created by a parent or guardian. No ads, and we never sell data.' },
    { icon: HeartHandshake, title: 'Learning, not cheating', text: 'Homework help gives hints and steps first, so children understand the "why".' },
  ];
  return (
    <section id="safe" className="scroll-mt-20 bg-cream py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="eyebrow text-jungle-700">For parents & teachers</p>
          <h2 className="mt-3 text-4xl font-bold text-jungle-900 sm:text-5xl">A safe jungle to grow in</h2>
          <p className="mt-4 text-lg text-muted">AI Gurukul adapts to each child's pace, and the progress page shows exactly where they shine and where they need a little more practice.</p>
          <div className="mt-8 space-y-4">
            {items.map((it, i) => (
              <Reveal key={it.title} delay={0.1 * i} className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-jungle-800/5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-jungle-800 text-sunny"><it.icon size={24} /></span>
                <div>
                  <h3 className="text-lg font-semibold text-jungle-900">{it.title}</h3>
                  <p className="text-muted">{it.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.2} className="relative mx-auto w-full max-w-md">
          <div className="card p-6">
            <p className="font-display text-lg font-semibold text-jungle-800">Aarav's week 🌟</p>
            <div className="mt-5 space-y-4">
              {[['Science', 86, '#2BB8BA'], ['Math', 64, '#F68B2F'], ['Space', 92, '#3B6FD9'], ['English', 75, '#8B5CF6']].map(([name, pct, color], i) => (
                <div key={name}>
                  <div className="flex justify-between text-sm font-bold text-jungle-800"><span>{name}</span><span>{pct}%</span></div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-mint">
                    <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.15 }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              {['📖', '🎯', '🔥', '🧭'].map((b, i) => (
                <motion.span key={b} initial={{ rotateY: 90 }} whileInView={{ rotateY: 0 }} viewport={{ once: true }} transition={{ delay: 0.8 + i * 0.15 }} className="grid h-12 w-12 place-items-center rounded-2xl bg-sunny/40 text-2xl">{b}</motion.span>
              ))}
            </div>
          </div>
          <div className="absolute -top-10 -right-4 w-24 animate-float"><Bee /></div>
        </Reveal>
      </div>
    </section>
  );
}

function CTA() {
  const { user } = useAuth();
  return (
    <section className="bg-cream px-4 pb-20 sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-gradient-to-br from-jungle-800 to-jungle-950 px-6 py-16 text-center text-white sm:px-12">
        <FallingLeaves count={5} />
        <div className="absolute -bottom-4 -left-4 w-28 animate-bob sm:w-36"><Lion /></div>
        <div className="absolute -right-4 -bottom-4 w-28 animate-bob [animation-delay:-1.5s] sm:w-36"><Elephant /></div>
        <div className="relative">
          <h2 className="text-4xl font-bold sm:text-5xl">Ready for your adventure?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">Join AI Gurukul for free and turn curiosity into a daily learning habit.</p>
          <Link to={user ? '/dashboard' : '/register'} className="btn-sunny mt-8 px-9 py-4 text-lg">
            {user ? 'Go to my jungle' : 'Create a free account'} <ArrowRight size={20} />
          </Link>
        </div>
        <div className="h-16 sm:h-0" />
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-jungle-950 py-10 text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <Logo light />
        <p className="text-sm">Learn • Explore • Enjoy — © {new Date().getFullYear()} AI Gurukul</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <>
      <PublicNavbar />
      <main>
        <Hero />
        <Features />
        <Journey />
        <AIMagic />
        <ForParents />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
