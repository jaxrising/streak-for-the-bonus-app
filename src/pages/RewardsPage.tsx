import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { winsRewardTiers, streakRewardTiers, rewardTiers, getUnlockedRewards } from '../data/rewards';
import { getWeekEndCountdown, formatCountdown } from '../lib/weekUtils';
import RewardProgressBar from '../components/RewardProgressBar';
import RewardTierCard from '../components/RewardTierCard';
import AccountLinkCard from '../components/AccountLinkCard';
import { ALL_TIERS } from '../lib/rewardCadence';

function DKCrownLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9.5 8.5L3 7L6 13L3 21H21L18 13L21 7L14.5 8.5L12 2Z" />
      <circle cx="12" cy="15" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

interface MiniPipsProps {
  current: number;
  threshold: number;
  color: string;
}

function MiniPips({ current, threshold, color }: MiniPipsProps) {
  const pips = Array.from({ length: threshold }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {pips.map((pip) => {
        const filled = pip <= current;
        return (
          <div
            key={pip}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: filled ? color : 'transparent',
              border: `1.5px solid ${filled ? color : 'var(--color-theme-border-hover)'}`,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

export default function RewardsPage() {
  const weeklyWins = useGameStore((s) => s.weeklyWins);
  const weeklyStreak = useGameStore((s) => s.weeklyStreak);
  const espnLinked = useGameStore((s) => s.espnLinked);
  const dkLinked = useGameStore((s) => s.dkLinked);
  const linkESPN = useGameStore((s) => s.linkESPN);
  const linkDK = useGameStore((s) => s.linkDK);

  const { unlocked, totalBonusBets } = getUnlockedRewards(weeklyWins, weeklyStreak);

  const [countdown, setCountdown] = useState(() => getWeekEndCountdown());

  useEffect(() => {
    const id = setInterval(() => setCountdown(getWeekEndCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  const earnedStreakTiers = streakRewardTiers.filter((t) => weeklyStreak >= t.threshold);
  const earnedWinsTiers = winsRewardTiers.filter((t) => weeklyWins >= t.threshold);
  const accountLinked = espnLinked && dkLinked;

  const awardBonusBet = useGameStore((s) => s.awardBonusBet);

  return (
    <div className="space-y-5">
      <h2 className="text-[20px] leading-[26px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>Rewards</h2>

      {/*
        Manual trigger for the reward moment.
 
        Judging a celebration means seeing it more than once, and the real
        trigger needs three to seven winning picks. This replays the beat
        without touching streak, wins or history — see lib/rewardCadence.ts,
        which also supports ?buzz for an automatic cadence.
 
        Prototype affordance. It does not belong in anything shipped.
      */}
      <div
        className="border rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
      >
        <p
          className="text-[11px] leading-[14px] tracking-[0.08em] uppercase font-title font-bold mb-1"
          style={{ color: 'var(--color-theme-text-tertiary)' }}
        >
          Preview the reward moment
        </p>
        <p className="text-[12px] leading-[16px] font-body mb-3" style={{ color: 'var(--color-theme-text-muted)' }}>
          Prototype only — fires the celebration without changing your record.
          Add <code>?buzz</code> to the URL to loop it.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_TIERS.map((t) => (
            <button
              key={t.id}
              onClick={() => awardBonusBet(t)}
              className="cta-pill"
              style={{ height: 32 }}
            >
              {t.prize}
            </button>
          ))}
        </div>
      </div>

      {/* Bonus Bets Summary — with prominent link CTA at the top when unlinked */}
      <div
        className="border rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
      >
        {!accountLinked && (
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-streak) 8%, transparent)', border: '1px solid var(--color-streak)' }}
          >
            <div>
              <p className="text-[13px] leading-[18px] font-bold font-title" style={{ color: 'var(--color-streak)' }}>
                Link your DraftKings account
              </p>
              <p className="text-[11px] leading-[14px] font-body mt-0.5" style={{ color: 'var(--color-theme-text-secondary)' }}>
                Required to claim any Bonus Bets you earn
              </p>
            </div>
            <button
              onClick={() => { if (!espnLinked) linkESPN(); else linkDK(); }}
              className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold font-title"
              style={{ backgroundColor: 'var(--color-streak)', color: '#000000' }}
            >
              LINK NOW
            </button>
          </div>
        )}

        <div className="text-center">
          <div className="text-[12px] leading-[14px] tracking-[0.02em] uppercase font-title mb-2" style={{ color: 'var(--color-theme-text-tertiary)' }}>
            Bonus Bets Available
          </div>
          <div className="text-[40px] leading-[44px] font-display font-black tabular-nums" style={{ color: totalBonusBets > 0 ? 'var(--color-earned)' : 'var(--color-theme-text)' }}>
            ${totalBonusBets}
          </div>
          <div className="text-[12px] leading-[14px] tracking-[0.02em] font-body mt-2" style={{ color: 'var(--color-theme-text-muted)' }}>
            {countdown.expired ? 'Week expired' : `EXPIRES in ${formatCountdown(countdown)}`}
          </div>
        </div>
      </div>

      {/* Coming Your Way — earned tiers with award countdown infographics */}
      {unlocked.length > 0 && (
        <div>
          <h3 className="text-[16px] leading-[24px] font-bold uppercase font-title mb-3" style={{ color: 'var(--color-theme-text-secondary)' }}>
            Coming Your Way
          </h3>
          <div className="space-y-2">
            {earnedStreakTiers.map((tier) => (
              <div
                key={tier.id}
                className="border rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[14px] leading-[20px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>
                      {tier.prize}
                    </div>
                    <div className="text-[11px] leading-[14px] font-body mt-0.5" style={{ color: 'var(--color-theme-text-tertiary)' }}>
                      {tier.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DKCrownLogo size={16} />
                    <span className="text-[11px] font-bold font-title" style={{ color: 'var(--color-earned)' }}>EARNED</span>
                  </div>
                </div>
                <MiniPips current={weeklyStreak} threshold={tier.threshold} color="var(--color-streak)" />
                <p className="text-[11px] leading-[14px] font-body mt-2" style={{ color: 'var(--color-theme-text-muted)' }}>
                  {countdown.expired ? 'Being processed' : `AWARDED in ${formatCountdown(countdown)}`}
                </p>
              </div>
            ))}
            {earnedWinsTiers.map((tier) => (
              <div
                key={tier.id}
                className="border rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[14px] leading-[20px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>
                      {tier.prize}
                    </div>
                    <div className="text-[11px] leading-[14px] font-body mt-0.5" style={{ color: 'var(--color-theme-text-tertiary)' }}>
                      {tier.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DKCrownLogo size={16} />
                    <span className="text-[11px] font-bold font-title" style={{ color: 'var(--color-earned)' }}>EARNED</span>
                  </div>
                </div>
                <MiniPips current={weeklyWins} threshold={tier.threshold} color="var(--color-wins)" />
                <p className="text-[11px] leading-[14px] font-body mt-2" style={{ color: 'var(--color-theme-text-muted)' }}>
                  {countdown.expired ? 'Being processed' : `AWARDED in ${formatCountdown(countdown)}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Progress Bars */}
      <div>
        <h3 className="text-[16px] leading-[24px] font-bold uppercase font-title mb-3" style={{ color: 'var(--color-theme-text-secondary)' }}>
          Progress
        </h3>
        <div className="space-y-3">
          <RewardProgressBar type="streak" currentValue={weeklyStreak} tiers={streakRewardTiers} label="Streak Progress" />
          <RewardProgressBar type="wins" currentValue={weeklyWins} tiers={winsRewardTiers} label="Wins Progress" />
        </div>
      </div>

      {/* All Reward Tiers */}
      <div>
        <h3 className="text-[16px] leading-[24px] font-bold uppercase font-title mb-3" style={{ color: 'var(--color-theme-text-secondary)' }}>
          All Rewards
        </h3>
        <div className="space-y-3">
          {rewardTiers.map((tier, i) => (
            <RewardTierCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>
      </div>

      {/* Account Linking */}
      <div>
        <h3 className="text-[16px] leading-[24px] font-bold uppercase font-title mb-3" style={{ color: 'var(--color-theme-text-secondary)' }}>
          Linked Accounts
        </h3>
        <div className="space-y-3">
          <AccountLinkCard platform="ESPN" linked={espnLinked} onLink={linkESPN} />
          <AccountLinkCard platform="DraftKings" linked={dkLinked} onLink={linkDK} disabled={!espnLinked} />
        </div>
      </div>

      <div
        className="border rounded-xl p-4 text-center"
        style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-theme-text-tertiary)' }}>
          Rewards powered by <span className="text-status-success font-medium">DraftKings</span>.
          Link your account to claim prizes.
        </p>
      </div>
    </div>
  );
}
