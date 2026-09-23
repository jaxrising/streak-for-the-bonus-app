import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthChange } from '../firebase/auth';
import { getOrCreateUser, type UserProfile } from '../firebase/collections';
import { db } from '../firebase/config';
import { useGameStore } from './gameStore';

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

        // Restore today's active pick
        try {
          const pickSnap = await getDoc(doc(db, 'users', firebaseUser.uid, 'activePick', 'current'));
          if (pickSnap.exists()) {
            const data = pickSnap.data();
            const today = new Date().toISOString().split('T')[0];
            if (data.date === today) {
              useGameStore.setState({
                submitted: true,
                submittedPick: {
                  offeringId: data.offeringId,
                  side: data.side,
                  chosenOption: data.chosenOption,
                },
              });
            }
          }
        } catch {
          // Non-critical — pick just won't persist
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
