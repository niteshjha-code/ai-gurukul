import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpenCheck, Lightbulb, ListOrdered, RotateCcw, SendHorizontal } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Owl } from '../components/Mascots';
import { RichText } from '../components/ui';
import { useToast } from '../components/Toast';
import { SUBJECTS } from '../data/catalog';

const MODES = [
  { id: 'hint', label: 'Hint', icon: Lightbulb, follow: 'Give me another hint' },
  { id: 'steps', label: 'Steps', icon: ListOrdered, follow: 'Show me the steps' },
  { id: 'explain', label: 'Explain', icon: BookOpenCheck, follow: 'Explain the idea' },
];

const STARTERS = ['What is 3/4 + 1/8?', 'Why do we have seasons?', 'What is a noun?', 'How do I find the area of a rectangle?'];

function Typing() {
  return (
    <div className="flex gap-1.5 px-1 py-2" aria-label="Guru Owl is typing">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-2.5 w-2.5 rounded-full bg-jungle-700" animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

export default function Homework() {
  const { user } = useAuth();
  const { reward } = useToast();
  const [subject, setSubject] = useState('math');
  const [mode, setMode] = useState('hint');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // { role, content, error? }
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api('/homework/recent').then((d) => setRecent(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (messages.length === 0 && !busy) return; // don't jump the page on first load
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  const ask = async (question, askMode = mode) => {
    const text = question.trim();
    if (!text || busy) return;
    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const d = await api('/homework/ask', { method: 'POST', body: { question: text, subject, mode: askMode, history } });
      setMessages((m) => [...m, { role: 'assistant', content: d.answer }]);
      setRecent((r) => [{ id: Date.now(), question: text, subject }, ...r].slice(0, 10));
      reward(d);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const lastQuestion = [...messages].reverse().find((m) => m.role === 'user')?.content;
  const showFollowUps = !busy && messages.at(-1)?.role === 'assistant' && !messages.at(-1)?.error;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <div className="card relative overflow-hidden p-5">
          <div className="flex items-center gap-3">
            <div className="w-16 animate-bob"><Owl /></div>
            <div>
              <p className="eyebrow text-mango">Homework help</p>
              <h1 className="text-2xl font-bold text-jungle-900">Ask Guru Owl</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">Guru Owl gives <b>hints first</b>, so you learn to solve it yourself. Need more? Ask for steps!</p>
          <label className="mt-4 block">
            <span className="label">Subject</span>
            <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
          </label>
        </div>
        {recent.length > 0 && (
          <div className="card hidden p-5 lg:block">
            <p className="font-display font-semibold text-jungle-800">Recent questions</p>
            <ul className="mt-2 space-y-1">
              {recent.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <button onClick={() => setInput(r.question)} className="w-full truncate rounded-xl px-2 py-1.5 text-left text-sm text-muted hover:bg-mint hover:text-jungle-800">
                    {r.question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <section className="card flex min-h-[70dvh] flex-col overflow-hidden lg:h-[calc(100dvh-8rem)] lg:min-h-[560px]">
        <div className="flex items-center justify-between border-b border-jungle-800/5 px-5 py-3">
          <p className="font-display font-semibold text-jungle-800">Chat with Guru Owl</p>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="flex items-center gap-1 text-sm font-bold text-jungle-700 hover:underline"><RotateCcw size={14} /> New question</button>
          )}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-8 text-center">
              <div className="w-28 animate-float"><Owl /></div>
              <p className="mt-3 font-display text-2xl font-semibold text-jungle-800">Hoo-hoo! What are you stuck on?</p>
              <p className="text-muted">Type your homework question, or try one of these:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <motion.button key={s} whileHover={{ y: -3 }} onClick={() => setInput(s)} className="rounded-full bg-mint px-4 py-2 text-sm font-bold text-jungle-800 ring-1 ring-jungle-800/10 hover:bg-cream">
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-10 shrink-0">{m.role === 'user' ? <Avatar name={user.avatar} /> : <Owl />}</div>
                <div className={`max-w-[85%] rounded-3xl px-4 py-3 sm:max-w-[75%] ${m.role === 'user' ? 'rounded-br-md bg-jungle-800 text-white' : m.error ? 'rounded-bl-md bg-mango/15 font-bold text-mango-dark' : 'rounded-bl-md bg-mint text-ink'}`}>
                  {m.role === 'assistant' && !m.error ? <RichText text={m.content} /> : <p className="whitespace-pre-wrap">{m.content}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && (
            <div className="flex items-end gap-2">
              <div className="w-10 shrink-0"><Owl /></div>
              <div className="rounded-3xl rounded-bl-md bg-mint px-4 py-2"><Typing /></div>
            </div>
          )}
          {showFollowUps && lastQuestion && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2 pl-12">
              {MODES.map((md) => (
                <button key={md.id} onClick={() => ask(`${md.follow} for: ${lastQuestion}`, md.id)} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-jungle-800 ring-1 ring-jungle-800/15 hover:bg-cream">
                  <md.icon size={14} /> {md.follow}
                </button>
              ))}
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="border-t border-jungle-800/5 bg-white p-3 sm:p-4">
          <div className="mb-2 flex gap-1">
            {MODES.map((md) => (
              <button type="button" key={md.id} onClick={() => setMode(md.id)} aria-pressed={mode === md.id} className="relative rounded-full px-3 py-1.5 text-sm font-bold">
                {mode === md.id && <motion.span layoutId="hw-mode" className="absolute inset-0 rounded-full bg-sunny" />}
                <span className="relative flex items-center gap-1 text-jungle-900"><md.icon size={14} /> {md.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              rows={1}
              maxLength={1000}
              placeholder="Type your question..."
              className="input max-h-40 min-h-[52px] resize-none [field-sizing:content]"
              aria-label="Your homework question"
            />
            <motion.button whileTap={{ scale: 0.9 }} disabled={busy || !input.trim()} className="btn-primary h-[52px] w-[52px] shrink-0 p-0" aria-label="Send">
              <SendHorizontal size={22} />
            </motion.button>
          </div>
        </form>
      </section>
    </div>
  );
}
