import { useId } from 'react';

// Original jungle mascots drawn as inline SVG. Eyes blink via CSS.
const INK = '#1F2A24';

function Eyes({ left, right, y, r = 4.5 }) {
  return (
    <g className="origin-fill-center animate-blink">
      {[left, right].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.15} fill={INK} />
          <circle cx={x + r * 0.35} cy={y - r * 0.45} r={r * 0.35} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

export function Lion({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" {...props}>
      <g fill="#F68B2F">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <circle key={i} cx={60 + Math.cos(a) * 40} cy={62 + Math.sin(a) * 40} r="17" />;
        })}
        <circle cx="60" cy="62" r="44" />
      </g>
      <circle cx="60" cy="62" r="37" fill="#E8741F" />
      <circle cx="35" cy="38" r="10" fill="#FFD54A" />
      <circle cx="85" cy="38" r="10" fill="#FFD54A" />
      <circle cx="35" cy="38" r="5" fill="#F6A55B" />
      <circle cx="85" cy="38" r="5" fill="#F6A55B" />
      <circle cx="60" cy="64" r="32" fill="#FFD54A" />
      <ellipse cx="60" cy="79" rx="16" ry="11" fill="#FFF1C1" />
      <Eyes left={48} right={72} y={60} />
      <circle cx="41" cy="72" r="5" fill="#F68B2F" opacity="0.35" />
      <circle cx="79" cy="72" r="5" fill="#F68B2F" opacity="0.35" />
      <path d="M53 71 Q60 67 67 71 Q60 79 53 71Z" fill="#7A3E12" />
      <path d="M60 76v4 M60 80q-5 4-9 0 M60 80q5 4 9 0" stroke="#7A3E12" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Elephant({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" {...props}>
      <ellipse cx="24" cy="56" rx="22" ry="28" fill="#7FB7D9" />
      <ellipse cx="96" cy="56" rx="22" ry="28" fill="#7FB7D9" />
      <ellipse cx="26" cy="57" rx="12" ry="17" fill="#F6B7C6" />
      <ellipse cx="94" cy="57" rx="12" ry="17" fill="#F6B7C6" />
      <circle cx="60" cy="54" r="32" fill="#9CCBE8" />
      <path d="M50 66 C48 86 52 100 66 104 C75 106 79 99 74 96 C66 96 62 88 66 66 Z" fill="#9CCBE8" />
      <path d="M55 92 q6 2 10 0 M53 84 q6 2 11 0" stroke="#7FB7D9" strokeWidth="2" fill="none" strokeLinecap="round" />
      <Eyes left={47} right={73} y={50} />
      <circle cx="40" cy="64" r="5" fill="#F6B7C6" opacity="0.7" />
      <circle cx="80" cy="64" r="5" fill="#F6B7C6" opacity="0.7" />
      <path d="M55 24 q5 -9 10 0" stroke="#7FB7D9" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Monkey({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true" {...props}>
      <circle cx="22" cy="60" r="13" fill="#9A5B34" />
      <circle cx="98" cy="60" r="13" fill="#9A5B34" />
      <circle cx="22" cy="60" r="7" fill="#F2C9A0" />
      <circle cx="98" cy="60" r="7" fill="#F2C9A0" />
      <circle cx="60" cy="58" r="37" fill="#9A5B34" />
      <path d="M53 23 q7 -12 14 0" fill="#9A5B34" />
      <circle cx="48" cy="56" r="14" fill="#F2C9A0" />
      <circle cx="72" cy="56" r="14" fill="#F2C9A0" />
      <ellipse cx="60" cy="76" rx="23" ry="17" fill="#F2C9A0" />
      <Eyes left={48} right={72} y={56} />
      <ellipse cx="56" cy="71" rx="2" ry="1.5" fill="#7A4424" />
      <ellipse cx="64" cy="71" rx="2" ry="1.5" fill="#7A4424" />
      <path d="M49 79 Q60 90 71 79" stroke="#7A4424" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Owl({ className = '', cap = true, ...props }) {
  return (
    <svg viewBox="0 0 120 124" className={className} aria-hidden="true" {...props}>
      <path d="M26 44 L28 20 L46 34Z" fill="#7A5133" />
      <path d="M94 44 L92 20 L74 34Z" fill="#7A5133" />
      <ellipse cx="22" cy="80" rx="10" ry="24" fill="#6E4A2E" transform="rotate(14 22 80)" />
      <ellipse cx="98" cy="80" rx="10" ry="24" fill="#6E4A2E" transform="rotate(-14 98 80)" />
      <ellipse cx="60" cy="74" rx="38" ry="44" fill="#8B5E3C" />
      <ellipse cx="60" cy="94" rx="24" ry="22" fill="#F3DDB4" />
      <path d="M50 88 l4 4 4-4 M62 88 l4 4 4-4 M56 98 l4 4 4-4" stroke="#C9A877" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="62" r="15" fill="#FFF8E5" />
      <circle cx="76" cy="62" r="15" fill="#FFF8E5" />
      <Eyes left={44} right={76} y={62} r={6.5} />
      <path d="M55 72 L65 72 L60 81Z" fill="#F68B2F" />
      <path d="M50 118 v4 M56 118 v4 M64 118 v4 M70 118 v4" stroke="#F68B2F" strokeWidth="3" strokeLinecap="round" />
      {cap && (
        <g>
          <rect x="45" y="22" width="30" height="11" rx="3" fill={INK} />
          <path d="M28 22 L60 10 L92 22 L60 34Z" fill={INK} />
          <path d="M60 22 L86 26 L88 40" stroke="#FFD54A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="88" cy="42" r="3.5" fill="#FFD54A" />
        </g>
      )}
    </svg>
  );
}

export function Bee({ className = '', ...props }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden="true" {...props}>
      <g className="origin-fill-bottom animate-flap">
        <ellipse cx="42" cy="20" rx="13" ry="17" fill="#fff" opacity="0.85" stroke="#BEE7F0" strokeWidth="2" />
        <ellipse cx="60" cy="22" rx="11" ry="15" fill="#fff" opacity="0.85" stroke="#BEE7F0" strokeWidth="2" />
      </g>
      <clipPath id={clip}>
        <ellipse cx="50" cy="48" rx="30" ry="22" />
      </clipPath>
      <ellipse cx="50" cy="48" rx="30" ry="22" fill="#FFD54A" />
      <g clipPath={`url(#${clip})`} fill={INK}>
        <rect x="44" y="20" width="8" height="60" />
        <rect x="60" y="20" width="8" height="60" />
        <rect x="75" y="20" width="10" height="60" />
      </g>
      <path d="M79 44 L92 48 L79 53Z" fill={INK} />
      <path d="M30 30 Q24 16 16 15" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="15" r="3.5" fill={INK} />
      <circle cx="32" cy="44" r="4" fill={INK} />
      <circle cx="33.5" cy="42.5" r="1.3" fill="#fff" />
      <path d="M27 53 Q32 58 37 53" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="25" cy="50" r="3" fill="#F68B2F" opacity="0.5" />
    </svg>
  );
}

export function Leaf({ className = '', color = '#56DB3A', ...props }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" {...props}>
      <path d="M6 34 C6 14 18 4 36 4 C36 22 26 34 6 34Z" fill={color} />
      <path d="M8 32 C16 24 24 16 32 8" stroke="rgb(0 0 0 / 0.18)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const AVATAR_COMPONENTS = { lion: Lion, elephant: Elephant, monkey: Monkey, owl: Owl };

export function Avatar({ name = 'lion', className = '', ...props }) {
  const Component = AVATAR_COMPONENTS[name] ?? Lion;
  return <Component className={className} {...(name === 'owl' ? { cap: false } : {})} {...props} />;
}
