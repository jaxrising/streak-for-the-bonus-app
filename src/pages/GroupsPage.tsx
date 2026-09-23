import { useState, useMemo } from 'react';
import { PeopleGroupIcon } from '../components/icons';
import { leaderboardUsers } from '../data/leaderboard';
import { useGameStore } from '../store/gameStore';
import LeaderboardTable from '../components/LeaderboardTable';

type TimeFrame = 'daily' | 'weekly' | 'allTime';

export default function GroupsPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const { weeklyStreak, weeklyWins, allTimeWins } = useGameStore();

  const groupUsers = useMemo(() => {
    const updated = leaderboardUsers.map((u) =>
      u.isCurrentUser
        ? { ...u, weeklyStreak, weeklyWins, allTimeWins }
        : u
    );
    return updated.filter((_, i) => i % 2 === 0 || updated[i].isCurrentUser);
  }, [weeklyStreak, weeklyWins, allTimeWins]);

  return (
    <div className="space-y-5">
      <h2 className="text-[20px] leading-[26px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>Groups</h2>

      {/* My Group leaderboard */}
      <div
        className="border rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-theme-text)' }}><PeopleGroupIcon size={20} /></span>
            <span className="text-[14px] leading-[20px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>My Group</span>
          </div>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
            className="text-[12px] leading-[14px] tracking-[0.02em] font-body font-medium rounded-full pl-[15px] pr-[30px] py-1.5 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-theme-surface)',
              color: 'var(--color-theme-text)',
              border: '1px solid var(--color-theme-border)',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="allTime">All-Time</option>
          </select>
        </div>
        <LeaderboardTable users={groupUsers} timeFrame={timeFrame} category="streak" />
      </div>

      {/* Create / Join group CTA */}
      <div
        className="border rounded-xl p-6 text-center"
        style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
      >
        <h3 className="text-[16px] leading-[24px] font-bold font-title mb-2" style={{ color: 'var(--color-theme-text)' }}>
          Create or Join a Group
        </h3>
        <p className="text-[14px] leading-[20px] mb-4" style={{ color: 'var(--color-theme-text-tertiary)' }}>
          Compete with friends, coworkers, and other fans.
        </p>
        <div className="flex gap-2 justify-center">
          <button className="cta-pill">Create Group</button>
          <button className="cta-pill">Join Group</button>
        </div>
      </div>
    </div>
  );
}
