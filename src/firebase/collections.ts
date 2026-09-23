import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db, firebaseEnabled } from './config';
import type { Offering, PickSide } from '../types';

// --- Collection references ---

/*
 * Built lazily.
 *
 * These were module-scope `collection(db, …)` calls, which run the moment
 * anything imports this file — and gameStore imports it dynamically on every
 * pick. With Firebase switched off that meant calling collection() with a
 * null db and throwing before React mounted.
 *
 * A getter defers the call to the point of use, and every use is already
 * behind a USE_FIREBASE check, so with Firebase off these are simply never
 * evaluated.
 */
function col(name: string) {
  if (!firebaseEnabled) {
    throw new Error(
      `[firebase] collection("${name}") requested while Firebase is disabled. ` +
        'Set VITE_USE_FIREBASE=true and provide credentials, or guard this call site.'
    );
  }
  return collection(db, name);
}

export const usersCol = { get ref() { return col('users'); } };
export const picksCol = { get ref() { return col('picks'); } };
export const leaderboardCol = { get ref() { return col('leaderboard'); } };
export const offeringsCol = { get ref() { return col('offerings'); } };

// --- User profile ---

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  weeklyStreak: number;
  weeklyWins: number;
  allTimeWins: number;
  weeklyPicks: number;
  allTimePicks: number;
  hasSeenHowToPlay: boolean;
  createdAt: unknown;
  lastPickAt: unknown;
}

export async function getOrCreateUser(uid: string, displayName: string, email: string): Promise<UserProfile> {
  const ref = doc(usersCol.ref, uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const profile: UserProfile = {
    uid,
    displayName,
    email,
    weeklyStreak: 0,
    weeklyWins: 0,
    allTimeWins: 0,
    weeklyPicks: 0,
    allTimePicks: 0,
    hasSeenHowToPlay: false,
    createdAt: serverTimestamp(),
    lastPickAt: null,
  };

  await setDoc(ref, profile);
  return profile;
}

// --- Picks ---

export interface PickDocument {
  uid: string;
  offeringId: string;
  side: PickSide;
  chosenOption: string;
  odds: string;
  status: 'pending' | 'won' | 'lost';
  createdAt: unknown;
  resolvedAt: unknown | null;
}

/**
 * Persist the question alongside the answer.
 *
 * The Cloud Function grades picks server-side, and it cannot do that from a
 * pick document alone: there is no line on it to settle a total against and
 * no player or stat to settle a prop against. So the offering — including
 * its `resolution` block — is written once, keyed by offering id, the first
 * time anyone picks it.
 *
 * Deliberately fire-and-forget and non-fatal: a pick must never fail to
 * record because the offering upsert did. Worst case the function skips that
 * pick and logs it, which is recoverable; a lost pick is not.
 */
async function ensureOffering(offering: Offering) {
  try {
    await setDoc(
      doc(offeringsCol.ref, offering.id),
      {
        kind: offering.kind ?? 'spread',
        sport: offering.sport,
        league: offering.league,
        question: offering.question,
        optionA: offering.optionA,
        optionB: offering.optionB,
        startTimeISO: offering.startTimeISO ?? null,
        resolution: offering.resolution ?? null,
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[firebase] offering upsert failed; pick still recorded', err);
  }
}

export async function recordPick(
  uid: string,
  offeringId: string,
  side: PickSide,
  chosenOption: string,
  odds: string,
  offering?: Offering,
) {
  if (offering) await ensureOffering(offering);

  const pickId = `${uid}_${offeringId}`;
  const ref = doc(picksCol.ref, pickId);

  const pickDoc: PickDocument = {
    uid,
    offeringId,
    side,
    chosenOption,
    odds,
    status: 'pending',
    createdAt: serverTimestamp(),
    resolvedAt: null,
  };

  await setDoc(ref, pickDoc);

  const userRef = doc(usersCol.ref, uid);
  await updateDoc(userRef, {
    weeklyPicks: increment(1),
    allTimePicks: increment(1),
    lastPickAt: serverTimestamp(),
  });

  return pickId;
}

// --- Pick percentage (global) ---

export async function getPickPercentages(offeringId: string): Promise<{ pctA: number; pctB: number }> {
  const q = query(picksCol.ref, where('offeringId', '==', offeringId));

  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(q, (snap) => {
      unsubscribe();
      let countA = 0;
      let countB = 0;
      snap.forEach((doc) => {
        const data = doc.data() as DocumentData;
        if (data.side === 'A') countA++;
        else countB++;
      });
      const total = countA + countB;
      if (total === 0) {
        resolve({ pctA: 50, pctB: 50 });
      } else {
        resolve({
          pctA: Math.round((countA / total) * 100),
          pctB: Math.round((countB / total) * 100),
        });
      }
    });
  });
}

// --- Leaderboard (real-time) ---

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  weeklyStreak: number;
  weeklyWins: number;
  allTimeWins: number;
  weeklyPicks: number;
  allTimePicks: number;
}

export function subscribeLeaderboard(
  sortField: 'weeklyStreak' | 'weeklyWins' | 'allTimeWins',
  count: number,
  callback: (entries: LeaderboardEntry[]) => void,
) {
  const q = query(
    usersCol.ref,
    orderBy(sortField, 'desc'),
    limit(count),
  );

  return onSnapshot(q, (snap) => {
    const entries: LeaderboardEntry[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as DocumentData;
      entries.push({
        uid: doc.id,
        displayName: data.displayName,
        weeklyStreak: data.weeklyStreak ?? 0,
        weeklyWins: data.weeklyWins ?? 0,
        allTimeWins: data.allTimeWins ?? 0,
        weeklyPicks: data.weeklyPicks ?? 0,
        allTimePicks: data.allTimePicks ?? 0,
      });
    });
    callback(entries);
  });
}

// --- Resolve pick (client-side for demo, server-side in production) ---

export async function resolvePick(uid: string, offeringId: string, won: boolean) {
  const pickId = `${uid}_${offeringId}`;
  const pickRef = doc(picksCol.ref, pickId);
  const userRef = doc(usersCol.ref, uid);

  await updateDoc(pickRef, {
    status: won ? 'won' : 'lost',
    resolvedAt: serverTimestamp(),
  });

  if (won) {
    await updateDoc(userRef, {
      weeklyWins: increment(1),
      allTimeWins: increment(1),
      weeklyStreak: increment(1),
    });
  } else {
    await updateDoc(userRef, {
      weeklyStreak: 0,
    });
  }
}
