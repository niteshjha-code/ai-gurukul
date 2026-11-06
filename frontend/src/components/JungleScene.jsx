import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bee, Elephant, Leaf, Lion, Monkey } from './Mascots';

function Tree({ x, scale = 1, color = '#2F9A55', delay = 0 }) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`}>
      <g className="origin-fill-bottom animate-sway" style={{ animationDelay: `${delay}s` }}>
        <rect x="-7" y="150" width="14" height="110" rx="6" fill="#7A5133" />
        <circle cx="0" cy="130" r="48" fill={color} />
        <circle cx="-38" cy="160" r="34" fill={color} />
        <circle cx="38" cy="160" r="34" fill={color} />
        <circle cx="-14" cy="112" r="20" fill="#fff" opacity="0.08" />
      </g>
    </g>
  );
}

function Palm({ x, scale = 1, delay = 0 }) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`}>
      <g className="origin-fill-bottom animate-sway" style={{ animationDelay: `${delay}s`, animationDuration: '6s' }}>
        <path d="M0 260 C 4 210 -6 160 6 110" stroke="#8B6239" strokeWidth="12" fill="none" strokeLinecap="round" />
        {[-150, -110, -60, -20, 20].map((rot) => (
          <path key={rot} d="M6 110 C 40 90 70 100 92 120 C 64 108 38 108 6 116Z" fill="#1E8A47" transform={`rotate(${rot + 90} 6 110)`} />
        ))}
      </g>
    </g>
  );
}

function Cloud({ className, style }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={style} aria-hidden="true">
      <path d="M20 50 a18 18 0 0 1 4-35 a24 24 0 0 1 44-6 a20 20 0 0 1 32 16 a14 14 0 0 1 0 25Z" fill="#fff" />
    </svg>
  );
}

// Falling leaves with stable pseudo-random positions.
function FallingLeaves({ count = 10 }) {
  const leaves = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      left: (i * 37 + 11) % 100,
      size: 18 + ((i * 13) % 18),
      duration: 10 + ((i * 7) % 9),
      delay: -((i * 5) % 14),
      drift: ((i % 2 ? 1 : -1) * (40 + ((i * 17) % 80))),
      color: ['#56DB3A', '#2E9A1C', '#FFD54A', '#F68B2F'][i % 4],
    })),
    [count],
  );
  return leaves.map((l, i) => (
    <div
      key={i}
      className="pointer-events-none absolute top-0 animate-fall"
      style={{ left: `${l.left}%`, width: l.size, animationDuration: `${l.duration}s`, animationDelay: `${l.delay}s`, '--leaf-x': `${l.drift}px` }}
    >
      <Leaf color={l.color} />
    </div>
  ));
}

function FlyingBee() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="pointer-events-none absolute top-[22%] left-[8%] w-14 sm:w-20"
      animate={reduce ? undefined : { x: ['0vw', '30vw', '62vw', '30vw', '0vw'], y: [0, -50, 10, 60, 0], scaleX: [1, 1, 1, -1, -1] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }}
    >
      <Bee className="w-full -scale-x-100" />
    </motion.div>
  );
}

// The animated jungle behind the landing hero.
export default function JungleScene({ showMascots = true }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-[#BFEFE4] via-[#E4F8EC] to-cream" />

      <div className="absolute top-10 right-[6%] h-28 w-28 sm:h-40 sm:w-40">
        <div className="absolute inset-0 animate-spin-slow rounded-full bg-[repeating-conic-gradient(#FFD54A55_0deg_12deg,transparent_12deg_30deg)] scale-150" />
        <div className="absolute inset-3 rounded-full bg-sunny shadow-[0_0_60px_#FFD54A]" />
      </div>

      <Cloud className="absolute top-[12%] w-32 animate-drift opacity-90" style={{ animationDelay: '-10s' }} />
      <Cloud className="absolute top-[28%] w-24 animate-drift opacity-70" style={{ animationDuration: '90s', animationDelay: '-50s' }} />
      <Cloud className="absolute top-[6%] w-40 animate-drift opacity-80" style={{ animationDuration: '110s', animationDelay: '-80s' }} />

      <FallingLeaves />
      {showMascots && <FlyingBee />}

      {/* A monkey hanging from a vine in the top-left corner. */}
      {showMascots && (
        <div className="absolute -top-2 left-[3%] hidden origin-top animate-swing md:block">
          <div className="mx-auto h-40 w-1.5 rounded-full bg-jungle-700 lg:h-56" />
          <Leaf className="absolute top-10 -left-4 w-6" color="#2E9A1C" />
          <Leaf className="absolute top-24 left-1 w-5 -scale-x-100" color="#56DB3A" />
          <Monkey className="-mt-3 -ml-9 w-20" />
        </div>
      )}

      <svg viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" className="absolute bottom-0 h-[52%] w-full min-h-[260px]">
        <path d="M0 250 C 240 170 480 215 720 195 C 960 175 1200 225 1440 180 L1440 400 L0 400Z" fill="#9EDDB3" />
        <g transform="translate(0 20)">
          <Tree x={140} scale={0.8} color="#4FB873" delay={-1} />
          <Palm x={740} scale={0.8} delay={-2} />
          <Tree x={1010} scale={0.75} color="#4FB873" delay={-3} />
          <Palm x={1300} scale={0.85} delay={-0.5} />
        </g>
        <path d="M0 300 C 300 240 600 300 900 262 C 1150 232 1300 282 1440 250 L1440 400 L0 400Z" fill="#3FA35F" />
        <g transform="translate(0 90)">
          <Tree x={40} scale={0.9} color="#1E8A47" delay={-2.5} />
          <Tree x={1400} scale={1} color="#1E8A47" delay={-1.5} />
        </g>
        <path d="M0 345 C 360 312 720 352 1080 322 C 1260 306 1380 332 1440 322 L1440 400 L0 400Z" fill="#0B5A2E" />
        {[120, 330, 610, 880, 1150, 1370].map((x, i) => (
          <g key={x} className="origin-fill-bottom animate-sway" style={{ animationDelay: `${-i}s`, animationDuration: '3s' }}>
            <path d={`M${x} 350 q-6 -26 -16 -34 M${x} 350 q0 -30 0 -40 M${x} 350 q6 -26 16 -34`} stroke="#136B38" strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </svg>

      {showMascots && (
        <>
          <Lion className="absolute bottom-[5%] left-[6%] w-20 animate-bob sm:w-28 lg:w-32" />
          <Elephant className="absolute right-[5%] bottom-[4%] w-20 animate-bob sm:w-28 lg:w-32" style={{ animationDelay: '-1.2s' }} />
        </>
      )}
    </div>
  );
}

export { FallingLeaves, Cloud };
