import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useOfferings } from '../lib/useOfferings';
import { checkGameResults, determinePickOutcome } from '../lib/resolveFromResults';
import EntryCard from '../components/EntryCard';
import PickCard from '../components/PickCard';
import SportFilterChips, { type SportFilter } from '../components/SportFilterChips';
import PeriodNav from '../components/PeriodNav';
import { getPeriodDays } from '../lib/weekUtils';
import { etDayKey } from '../lib/timeFormat';
import { PicksTooltip } from '../components/HowToPlay';

export default function HomePage() {
  const { activePick, resolvePick, resetDemo } = useGameStore();
  const { offerings, loading } = useOfferings();
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');

  /*
   * Day first, league second.
   *
   * The two filters compose, and the order they compose in is what makes the
   * board readable: pick a day, then narrow that day to a league. So the
   * league chips list only the leagues playing on the selected day — offering
   * an MLB chip on a day with no baseball produces an empty board and looks
   * like a bug.
   */
  const [selectedDay, setSelectedDay] = useState<string>(() => etDayKey(new Date()));

  const offeringsByDay = useMemo(() => {
    const map: Record<string, typeof offerings> = {};
    for (const o of offerings) {
      if (!o.startTimeISO) continue;
      // ET, not local: a 10pm ET Sunday game is still Sunday's game for a
      // viewer on the west coast, where local time would file it under Sunday
      // too — but a 1am ET Monday kickoff must not land on Sunday's tab.
      const k = etDayKey(o.startTimeISO);
      (map[k] ??= []).push(o);
    }
    return map;
  }, [offerings]);

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of getPeriodDays()) counts[d.key] = offeringsByDay[d.key]?.length ?? 0;
    return counts;
  }, [offeringsByDay]);

  const dayOfferings = useMemo(() => offeringsByDay[selectedDay] ?? [], [offeringsByDay, selectedDay]);

  const availableLeagues = useMemo(() => {
    return [...new Set(dayOfferings.map(o => o.league))];
  }, [dayOfferings]);

  // Reset the league filter when switching to a day that does not have it.
  useEffect(() => {
    if (sportFilter !== 'all' && !availableLeagues.includes(sportFilter)) setSportFilter('all');
  }, [availableLeagues, sportFilter]);

  const filteredOfferings = useMemo(() => {
    if (sportFilter === 'all') return dayOfferings;
    return dayOfferings.filter(o => o.league === sportFilter);
  }, [sportFilter, dayOfferings]);

  /*
   * Client-side result polling — local prototype only.
   *
   * When Firebase is on, the scheduled Cloud Function resolves picks. Polling
   * here as well means two resolvers racing on the same pick, and the store's
   * own guard is the only thing stopping the win being counted twice.
   */
  useEffect(() => {
    if (import.meta.env.VITE_USE_FIREBASE === 'true') return;
    if (!activePick) return;

    const offering = offerings.find((o) => o.id === activePick.offeringId);
    if (!offering) return;

    let cancelled = false;

    const pollForResult = async () => {
      while (!cancelled) {
        const results = await checkGameResults(offering.sport);
        const outcome = determinePickOutcome(offering, activePick.side, results);

        if (outcome !== 'pending') {
          if (!cancelled) {
            resolvePick(outcome === 'won');
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    };

    pollForResult();

    return () => { cancelled = true; };
  }, [activePick, resolvePick, offerings]);

  return (
    <div className="space-y-5">
      {/* Entry Card — stats + reward progress */}
      <EntryCard />


      {/* First-pick tooltip */}
      <PicksTooltip />

      {/* Period nav — day picker for the week */}
      <PeriodNav selected={selectedDay} onSelect={setSelectedDay} counts={dayCounts} />

      {/* League filter, scoped to the selected day */}
      <SportFilterChips active={sportFilter} onChange={setSportFilter} availableLeagues={availableLeagues} />

      <div className="flex items-center justify-between">
        <h2 className="text-[16px] leading-[24px] font-bold uppercase font-title" style={{ color: 'var(--color-theme-text-secondary)' }}>
          {selectedDay === etDayKey(new Date()) ? "Today's Picks" : 'Picks'}
        </h2>
        <span className="text-xs" style={{ color: 'var(--color-theme-text-muted)' }}>{filteredOfferings.length} available</span>
      </div>

      {/* Loading state */}
      {loading && offerings.length === 0 && (
        <p className="text-center text-sm" style={{ color: 'var(--color-theme-text-muted)' }}>
          Loading today's matchups...
        </p>
      )}

      {/* Offering cards.
          Phone-only: always one card per row. The old `sm:grid-cols-2` split
          the slate into two columns at 640px, which also fed narrower widths
          into PickCard's container queries and dropped team names to
          abbreviations. */}
      {filteredOfferings.length > 0 ? (
        <div className="grid gap-3">
          {filteredOfferings.map((offering, i) => (
            <PickCard key={offering.id} offering={offering} index={i} />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-10 rounded-xl border"
          style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
        >
          <p className="text-[14px] leading-[20px] font-body" style={{ color: 'var(--color-theme-text-muted)' }}>
            No picks available for this day yet.
          </p>
          <p className="text-[12px] leading-[16px] font-body mt-1" style={{ color: 'var(--color-theme-text-disabled)' }}>
            Lines are usually posted closer to game day.
          </p>
        </div>
      )}

      {/* Reset Demo */}
      <div className="pt-4 text-center">
        <button
          onClick={resetDemo}
          className="text-xs transition-colors underline"
          style={{ color: 'var(--color-theme-text-muted)' }}
        >
          Reset Demo
        </button>
      </div>
    </div>
  );
}
