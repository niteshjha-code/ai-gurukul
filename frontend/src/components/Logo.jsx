import { Link } from 'react-router-dom';
import { Owl } from './Mascots';

export default function Logo({ to = '/', light = false, className = '' }) {
  return (
    <Link to={to} className={`group flex items-center gap-2 ${className}`} aria-label="AI Gurukul home">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-jungle-800 shadow-[0_4px_0_var(--color-jungle-950)] transition group-hover:-rotate-6">
        <Owl className="w-8" />
      </span>
      <span className={`font-display text-xl leading-none font-bold sm:text-2xl ${light ? 'text-white' : 'text-jungle-800'}`}>
        AI <span className="text-mango">Gurukul</span>
      </span>
    </Link>
  );
}
