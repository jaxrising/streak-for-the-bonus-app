export { auth, db } from './config';
export { signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, onAuthChange } from './auth';
export {
  getOrCreateUser,
  recordPick,
  getPickPercentages,
  subscribeLeaderboard,
  resolvePick,
  type UserProfile,
  type PickDocument,
  type LeaderboardEntry,
} from './collections';
