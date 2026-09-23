import { useState } from 'react';
import { signInAnon } from '../firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store/authStore';

/*
 * Anonymous sign-in, one step: pick a display name and play.
 *
 * Replaces an email flow that signed everyone in with a SHARED PASSWORD
 * hardcoded in this file. That string shipped in the client bundle, so it was
 * readable by anyone who opened devtools, and the @disney.com check in front
 * of it was a client-side string comparison — no more of a gate than a sign
 * on a door. Together they created real Firebase Auth accounts holding real
 * work email addresses, secured by a secret that was not secret.
 *
 * Anonymous auth drops all of that and loses nothing the app uses: picks,
 * streak, leaderboard and every Firestore rule key on uid, never on email.
 * The display name is a label, not an identity.
 *
 * If access needs restricting later, that belongs in Firebase Auth settings
 * or an allowlist the client cannot read — not in a constant beside it.
 */
const logoSrc = new URL('../assets/Streak Logo.png', import.meta.url).href;

export default function LoginScreen() {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or less.');
      return;
    }

    setLoading(true);
    try {
      // First visit: mint an anonymous uid. Returning visitor: reuse theirs.
      const uid = user?.uid ?? (await signInAnon(trimmed)).uid;

      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { displayName: trimmed, hasSeenHowToPlay: false }, { merge: true });

      // Update auth store so App.tsx gates pass
      useAuthStore.getState().setUser({
        uid,
        email: user?.email ?? '',
        username: trimmed,
        hasSeenHowToPlay: false,
      });
    } catch (err) {
      console.error('[LoginScreen] Failed to save username:', err);
      const code = (err as { code?: string }).code ?? (err as Error).message ?? 'unknown';
      setError(`Failed to save username. (${code})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#101113' }}
    >
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <img
          src={logoSrc}
          alt="Streak for the Bonus"
          className="h-[80px] w-[240px] object-contain mb-8"
        />

                  <form onSubmit={handleUsernameSubmit} className="w-full flex flex-col gap-4">
            <p className="text-[14px] leading-[20px] font-body text-white/80 text-center">
              Choose a display name to start playing.
            </p>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
              autoFocus
              required
              maxLength={20}
              className="w-full h-[48px] rounded-lg px-4 text-[14px] font-body text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-[#05A569]"
              style={{ backgroundColor: '#252627', border: '1px solid #3A3B3C' }}
            />

            {error && (
              <p className="text-[12px] leading-[16px] font-body text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-lg text-[14px] font-title font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#05A569', color: '#101113' }}
            >
              {loading ? 'Saving...' : 'Start Playing'}
            </button>
          </form>

        <p className="mt-8 text-[11px] leading-[14px] font-body text-white/40 text-center">
          Internal prototype. No account required — your display name is not verified.
        </p>
      </div>
    </div>
  );
}
