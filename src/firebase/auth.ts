import {
  signInAnonymously,
  updateProfile,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from './config';
import { getOrCreateUser } from './collections';

const googleProvider = new GoogleAuthProvider();

/**
 * Anonymous sign-in — the default for the prototype.
 *
 * Google popup and email/password both mint real accounts with real email
 * addresses. On a publicly reachable demo of an unreleased game that is a
 * pile of personal data collected for no product reason, and it is the kind
 * of thing that is far easier not to start than to clean up later.
 *
 * Anonymous auth gives a stable uid, which is all the app actually needs:
 * picks, streak, leaderboard position and Firestore rules are all keyed on
 * uid, never on email. The display name is whatever the player types and is
 * not verified — it is a label on a leaderboard, not an identity.
 *
 * The named sign-in paths below are left intact for when this becomes a real
 * product and accounts need to survive a reinstall.
 */
export async function signInAnon(displayName: string) {
  const result = await signInAnonymously(auth);
  const name = displayName.trim() || 'Player';
  // Keeps the Firebase user object consistent with the profile document, so
  // anything reading `user.displayName` does not have to special-case guests.
  await updateProfile(result.user, { displayName: name });
  await getOrCreateUser(result.user.uid, name, '');
  return result.user;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  await getOrCreateUser(
    result.user.uid,
    result.user.displayName ?? 'Player',
    result.user.email ?? '',
  );
  return result.user;
}

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await getOrCreateUser(
    result.user.uid,
    result.user.displayName ?? email.split('@')[0],
    email,
  );
  return result.user;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await getOrCreateUser(result.user.uid, displayName, email);
  return result.user;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
