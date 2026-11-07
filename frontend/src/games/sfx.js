// Tiny sound effects made with the browser's built-in Web Audio API: no files and no network.

const KEY = 'gurukul_sfx';
let ctx = null;
let muted = (() => {
  try { return window.localStorage.getItem(KEY) === 'off'; } catch { return false; }
})();
const listeners = new Set();

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try { window.localStorage.setItem(KEY, value ? 'off' : 'on'); } catch { /* storage unavailable */ }
  listeners.forEach((fn) => fn(value));
}

export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// [frequency Hz, start offset s, length s, wave, volume]
const SOUNDS = {
  flip: [[540, 0, 0.07, 'triangle', 0.12]],
  pop: [[720, 0, 0.07, 'sine', 0.14]],
  correct: [[660, 0, 0.1, 'sine', 0.16], [990, 0.09, 0.18, 'sine', 0.16]],
  wrong: [[260, 0, 0.14, 'triangle', 0.16], [190, 0.12, 0.22, 'triangle', 0.16]],
  combo: [[784, 0, 0.08, 'sine', 0.14], [988, 0.07, 0.08, 'sine', 0.14], [1319, 0.14, 0.16, 'sine', 0.14]],
  win: [[523, 0, 0.14, 'sine', 0.16], [659, 0.13, 0.14, 'sine', 0.16], [784, 0.26, 0.14, 'sine', 0.16], [1047, 0.39, 0.34, 'sine', 0.18]],
  tick: [[1200, 0, 0.03, 'square', 0.04]],
};

export function play(name) {
  if (muted || !SOUNDS[name]) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    for (const [freq, offset, length, wave, volume] of SOUNDS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + offset;
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + length + 0.02);
    }
  } catch { /* audio not available: games work silently */ }
}
