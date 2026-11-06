import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import StoryCard from '../components/StoryCard';
import { Elephant } from '../components/Mascots';
import { EmptyState, ErrorNote, PageLoader } from '../components/ui';
import { useToast } from '../components/Toast';
import { SUBJECTS } from '../data/catalog';

export default function Library() {
  const { toast } = useToast();
  const [stories, setStories] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('all');

  useEffect(() => {
    api('/stories').then((d) => setStories(d.stories)).catch((err) => setError(err.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (stories ?? []).filter((s) =>
      (subject === 'all' || s.subject === subject) &&
      (!q || s.title.toLowerCase().includes(q) || s.topic.toLowerCase().includes(q)));
  }, [stories, query, subject]);

  const remove = async (story) => {
    if (!window.confirm(`Delete "${story.title}"? This also removes its quiz scores.`)) return;
    try {
      await api(`/stories/${story.id}`, { method: 'DELETE' });
      setStories((list) => list.filter((s) => s.id !== story.id));
      toast({ title: 'Story deleted', emoji: '🗑️', tone: 'mango' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !stories) return <ErrorNote>{error}</ErrorNote>;
  if (!stories) return <PageLoader label="Dusting off your bookshelf..." />;

  const used = new Set(stories.map((s) => s.subject));

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-lagoon-dark">My library</p>
          <h1 className="text-3xl font-bold text-jungle-900 sm:text-4xl">Your story collection</h1>
          <p className="text-muted">{stories.length} {stories.length === 1 ? 'story' : 'stories'} so far. Keep going!</p>
        </div>
        <Link to="/create" className="btn-primary self-start sm:self-auto"><Sparkles size={18} /> New story</Link>
      </div>

      {stories.length === 0 ? (
        <div className="mt-8">
          <EmptyState mascot={<Elephant />} title="Your bookshelf is empty" action={<Link to="/create" className="btn-primary">Create a story</Link>}>
            Every story you create is saved here so you can read it again and replay its quiz.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block lg:w-80">
              <span className="sr-only">Search stories</span>
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={18} />
              <input className="input pl-11" placeholder="Search your stories..." value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              {[{ id: 'all', name: 'All', emoji: '🌈' }, ...SUBJECTS.filter((s) => used.has(s.id))].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold whitespace-nowrap transition ${subject === s.id ? 'text-white' : 'bg-white text-jungle-800 ring-1 ring-jungle-800/10'}`}
                >
                  {subject === s.id && <motion.span layoutId="lib-filter" className="absolute inset-0 rounded-full bg-jungle-800" />}
                  <span className="relative">{s.emoji} {s.name}</span>
                </button>
              ))}
            </div>
          </div>
          <ErrorNote>{error}</ErrorNote>
          <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((s, i) => <StoryCard key={s.id} story={s} index={i} onDelete={remove} />)}
            </AnimatePresence>
          </motion.div>
          {filtered.length === 0 && <p className="mt-10 text-center font-bold text-muted">No stories match that search. 🔍</p>}
        </>
      )}
    </div>
  );
}
