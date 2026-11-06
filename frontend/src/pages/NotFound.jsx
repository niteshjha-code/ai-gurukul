import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monkey } from '../components/Mascots';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-4 text-center">
      <div>
        <motion.div className="mx-auto w-40" animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <Monkey />
        </motion.div>
        <h1 className="mt-6 text-6xl font-bold text-jungle-900">404</h1>
        <p className="mt-2 font-display text-2xl text-jungle-800">Oops! This path is lost in the jungle.</p>
        <Link to={user ? '/dashboard' : '/'} className="btn-primary mt-8">Take me home</Link>
      </div>
    </main>
  );
}
