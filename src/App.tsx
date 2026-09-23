import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import LoginScreen from './components/LoginScreen';
import { useAuthStore, initAuth } from './store/authStore';
import { useGameStore } from './store/gameStore';

const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

/*
 * BrowserRouter needs a server that rewrites unknown paths back to
 * index.html. On a plain static host — a shared build, an artifact, anything
 * opened without a dev server — /leaderboard is simply a 404 and the app dies
 * on the first tab tap.
 *
 * HashRouter keeps routing in the fragment, so every tab works on any host.
 * Opt in with VITE_HASH_ROUTER=true; normal dev and deploy builds are
 * unaffected.
 */
const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;
const routerBase = import.meta.env.VITE_HASH_ROUTER === 'true' ? undefined : import.meta.env.BASE_URL;

type Theme = 'dark' | 'light';

export default function App() {
  const [theme] = useState<Theme>(() => {
    try {
      const v = localStorage.getItem('streak-theme');
      if (v === 'light' || v === 'dark') return v;
    } catch {}
    return 'dark';
  });

  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (USE_FIREBASE) {
      initAuth();
    }
  }, []);

  useEffect(() => {
    if (USE_FIREBASE && user) {
      useGameStore.getState().setUser(user.uid);
    } else if (USE_FIREBASE && !user && initialized) {
      useGameStore.getState().setUser(null);
    }
  }, [user, initialized]);

  if (USE_FIREBASE && loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#101113' }}
      >
        <div className="w-8 h-8 border-2 border-[#05A569] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (USE_FIREBASE && (!user || !user.username)) {
    return <LoginScreen />;
  }

  return (
    <Router basename={routerBase}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
}
