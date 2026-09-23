import { useGameStore } from '../store/gameStore';
import AccountLinkCard from '../components/AccountLinkCard';

export default function LinkAccountPage() {
  const { espnLinked, dkLinked, linkESPN, linkDK } = useGameStore();

  const bothLinked = espnLinked && dkLinked;

  return (
    <div className="space-y-5">
      <h2 className="text-[20px] leading-[26px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>Link Accounts</h2>
      <p className="text-sm" style={{ color: 'var(--color-theme-text-tertiary)' }}>
        Connect your ESPN and DraftKings accounts to unlock rewards and claim prizes.
      </p>

      {/* Step indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: espnLinked ? 'var(--color-earned)' : 'var(--color-theme-text-tertiary)' }}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: espnLinked ? 'var(--color-earned)' : 'var(--color-theme-surface-alt)',
              color: espnLinked ? '#fff' : 'var(--color-theme-text-tertiary)',
            }}
          >
            {espnLinked ? '✓' : '1'}
          </div>
          ESPN
        </div>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-theme-border)' }} />
        <div className="flex items-center gap-2 text-sm" style={{ color: dkLinked ? 'var(--color-earned)' : 'var(--color-theme-text-tertiary)' }}>
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: dkLinked ? 'var(--color-earned)' : 'var(--color-theme-surface-alt)',
              color: dkLinked ? '#fff' : 'var(--color-theme-text-tertiary)',
            }}
          >
            {dkLinked ? '✓' : '2'}
          </div>
          DraftKings
        </div>
      </div>

      <div className="space-y-4">
        <AccountLinkCard platform="ESPN" linked={espnLinked} onLink={linkESPN} />
        <AccountLinkCard platform="DraftKings" linked={dkLinked} onLink={linkDK} disabled={!espnLinked} />
      </div>

      {bothLinked && (
        <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-5 text-center animate-confetti-pop">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-[18px] leading-[24px] font-bold font-title text-status-success">All Set!</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-theme-text-tertiary)' }}>
            Your accounts are linked. Rewards will be automatically credited to your DraftKings account.
          </p>
        </div>
      )}
    </div>
  );
}
