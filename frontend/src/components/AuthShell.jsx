import { motion } from 'motion/react';
import Logo from './Logo';
import { FallingLeaves } from './JungleScene';
import { Bee, Elephant, Lion, Monkey, Owl } from './Mascots';

// Two-panel layout for login/register: illustrated jungle on the left (desktop), form on the right.
export default function AuthShell({ title, subtitle, children, side }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-jungle-800 to-jungle-950 p-10 text-white lg:flex lg:flex-col">
        <FallingLeaves count={7} />
        <Logo light />
        <div className="relative my-auto">
          <h2 className="text-4xl leading-tight font-bold xl:text-5xl">{side.title}</h2>
          <p className="mt-4 max-w-sm text-lg text-white/70">{side.text}</p>
        </div>
        <div className="relative flex items-end justify-center gap-2">
          <Lion className="w-28 animate-bob" />
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 2.5, repeat: Infinity }}><Owl className="w-36" /></motion.div>
          <Elephant className="w-28 animate-bob [animation-delay:-1s]" />
        </div>
        <div className="absolute top-24 right-10 w-16 animate-float"><Bee /></div>
        <div className="absolute top-1/3 -right-6 w-20 rotate-12 animate-swing"><Monkey /></div>
      </aside>

      <main className="flex flex-col bg-cream px-4 py-6 sm:px-8">
        <div className="lg:hidden"><Logo /></div>
        <div className="mx-auto my-auto w-full max-w-lg py-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="w-16 shrink-0 animate-bob lg:hidden"><Owl /></div>
              <div>
                <h1 className="text-3xl font-bold text-jungle-900 sm:text-4xl">{title}</h1>
                <p className="mt-1 text-muted">{subtitle}</p>
              </div>
            </div>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
