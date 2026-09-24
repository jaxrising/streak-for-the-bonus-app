import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthChange } from '../firebase/auth';
import { getOrCreateUser, type UserProfile } from '../firebase/collections';
import { db } from '../firebase/config';
import { useGameStore } from './gameStore';
import { etDayKey } from '../lib/timeFormat';

export interface AuthUser {
  uid: string;
  email: string;
  username: string | null;
  hasSeenHowToPlay: boolean;
}

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));

let unsubscribe: (() => void) | null = null;

export function initAuth() {
  if (unsubscribe) return;

  unsubscribe = onAuthChange(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await getOrCreateUser(
          firebaseUser.uid,
          firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Player',
          firebaseUser.email ?? '',
        );

        const hasUsername = profile.displayName && profile.displayName !== firebaseUser.email?.split('@')[0];

        useAuthStore.setState({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: hasUsername ? profile.displayName : null,
            hasSeenHowToPlay: profile.hasSeenHowToPlay === true,
          },
          profile,
          loading: false,
          initialized: true,
        });

        // Restore every window submitted today — one doc per offeringId,
        // not a single 'current' doc, since several can be active the same
        // day (see gameStore.submitPick).
        try {
          const today = etDayKey(new Date());
          const snap = await getDocs(
            query(collection(db, 'users', firebaseUser.uid, 'activePick'), where('date', '==', today))
          );
          if (!snap.empty) {
            const submittedPicks: Record<string, { side: 'A' | 'B'; chosenOption: string }> = {};
            let mostRecent: { offeringId: string; side: 'A' | 'B'; chosenOption: string; startedAt: number } | null = null;
            for (const d of snap.docs) {
              const data = d.data();
              submittedPicks[data.offeringId] = { side: data.side, chosenOption: data.chosenOption };
              if (!mostRecent || data.startedAt > mostRecent.startedAt) {
                mostRecent = {
                  offeringId: data.offeringId,
                  side: data.side,
                  chosenOption: data.chosenOption,
                  startedAt: data.startedAt,
                };
              }
            }
            useGameStore.setState({
              submittedPicks,
              submittedPick: mostRecent
                ? { offeringId: mostRecent.offeringId, side: mostRecent.side, chosenOption: mostRecent.chosenOption }
                : null,
            });
          }
        } catch {
          // Non-critical — picks just won't persist across a reload
        }
      } catch {
        useAuthStore.setState({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            username: null,
            hasSeenHowToPlay: false,
          },
          profile: null,
          loading: false,
          initialized: true,
        });
      }
    } else {
      useAuthStore.setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    }
  });
}
