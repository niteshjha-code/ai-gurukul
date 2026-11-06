import { motion } from 'motion/react';
import { Avatar } from './Mascots';
import { AVATARS } from '../data/catalog';

export default function AvatarPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="label">Pick your jungle buddy</legend>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {AVATARS.map((a) => {
          const selected = value === a.id;
          return (
            <motion.button
              type="button"
              key={a.id}
              onClick={() => onChange(a.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.92 }}
              aria-pressed={selected}
              aria-label={a.name}
              className={`relative flex flex-col items-center rounded-2xl p-2 transition ${selected ? 'bg-sunny/30 ring-3 ring-sunny' : 'bg-mint ring-1 ring-jungle-800/10 hover:bg-white'}`}
            >
              <motion.div animate={selected ? { rotate: [0, -10, 10, 0], scale: [1, 1.12, 1] } : {}} transition={{ duration: 0.5 }}>
                <Avatar name={a.id} className="w-14 sm:w-16" />
              </motion.div>
              <span className="mt-1 text-[11px] font-bold text-jungle-800 sm:text-xs">{a.name.split(' ')[0]}</span>
              {selected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-leaf text-xs font-black text-jungle-900">
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}
