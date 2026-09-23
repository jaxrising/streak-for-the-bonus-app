import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HowToPlayButton } from './HowToPlay';
import SubmitPickBar from './SubmitPickBar';
import AchievementToast from './AchievementToast';
import InfoToast from './InfoToast';
import BonusBetAward from './BonusBetAward';
import { useRewardCadence } from '../lib/rewardCadence';

const tabs = [
  { to: '/', label: 'HOME' },
  { to: '/groups', label: 'GROUPS' },
  { to: '/leaderboard', label: 'LEADERS' },
  { to: '/rewards', label: 'REWARDS' },
];

/*
 * Wordmark only — the ESPN mark that sat above it is cropped out.
 *
 * Derived from `Streak Logo.png` (571x136), which is a two-line lockup: the
 * ESPN mark occupies y 0-39 on its own narrow plate, the wordmark y 40-135.
 * Cutting at y=40 and trimming transparent margins gives 556x96.
 *
 * The original asset is untouched — the hero used to use it and something
 * else may again. This is a second file, not an edit.
 *
 * Side effect worth knowing: dropping the ESPN line lets the wordmark use the
 * full 30px of header height instead of sharing it, so it reads considerably
 * larger at the same header size.
 */
const logoSrc = new URL('../assets/Streak Wordmark.png', import.meta.url).href;

const legalLinks = [
  { label: 'Official Rules', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Interest-Based Ads', href: '#' },
];

function BackArrowIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 4L7 12L15 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Layout() {
  const navigate = useNavigate();

  // No-op unless ?buzz is in the URL. See lib/rewardCadence.ts.
  useRewardCadence();

  const handleBack = () => {
    // Streak is standalone, so there may be no in-app history to pop —
    // fall back to the game's own home rather than leaving the user stuck.
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div
      className="app-shell relative min-h-screen"
      style={{ backgroundColor: 'var(--color-theme-bg)', color: 'var(--color-theme-text)' }}
    >
      {/*
        Title bar + tabs, sticky as one unit.

        Replaces the two stacked ESPN chrome bars (global nav, then a second
        Streak/season/All Games bar). Those were 88px of shell before any game
        content, and the tab bar underneath needed a hardcoded sticky offset to
        clear them — which then had to change per breakpoint.

        Keeping the tabs inside the same sticky element removes the offset
        entirely: there is no magic number left to get wrong.
      */}
      {/*
        True black, not the old #101113 ESPN nav grey. The wordmark art sits
        on a solid #000 plate, so on #101113 it read as a faintly darker
        parallelogram floating behind the type. Matching the header to the
        plate makes it disappear.
      */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: '#000000' }}>
        {/*
          Three-slot row. Back arrow and info icon are both 24px glyphs in
          44px hit targets, and the wordmark is absolutely centred rather than
          flex-centred so it stays on the screen's true centre line even though
          the two side slots have different widths.
        */}
        <div className="relative flex items-center justify-between h-[56px] px-4">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="flex items-center justify-center w-[44px] h-[44px] -ml-[10px] text-white"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <BackArrowIcon size={24} />
          </button>

          <img
            src={logoSrc}
            alt="Streak for the Bonus"
            className="absolute left-1/2 -translate-x-1/2 h-[30px] max-w-[200px] object-contain pointer-events-none"
          />

          <HowToPlayButton />
        </div>

        <nav className="w-full" style={{ backgroundColor: '#1B1C1D' }}>
          <div className="flex">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className="flex-1 relative flex items-center justify-center h-[44px] text-[12px] leading-[14px] tracking-[0.02em] font-body font-medium transition-colors"
                style={({ isActive }) => ({
                  color: isActive ? '#05A569' : 'rgba(255,255,255,0.6)',
                })}
              >
                {({ isActive }) => (
                  <>
                    <span>{tab.label}</span>
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[4px] rounded-t-sm"
                        style={{ backgroundColor: '#05A569' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      {/*
        Single-column content, phone-only.

        Bottom padding clears the fixed 56px submit bar plus the iOS home
        indicator, so the last pick card is never trapped underneath it.
      */}
      <div
        className="px-[10px] py-[10px]"
        style={{ paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        <main className="min-w-0">
          <Outlet />
        </main>

        {/*
          The one piece of sidebar content kept. About the Game, Related Games
          and the house ad were chrome and are gone. These four are not: this
          product links a DraftKings account and hands out bonus bets, so
          Official Rules / Privacy / Terms should be removed by someone who
          owns that call, not as a side effect of a layout pass.
        */}
        <footer className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-theme-border)' }}>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[12px] leading-[16px] font-body"
                style={{ color: 'var(--color-theme-text-tertiary)' }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-[11px] leading-[14px] font-body mt-3" style={{ color: 'var(--color-theme-text-muted)' }}>
            &copy; 2026 ESPN Enterprises, LLC. All rights reserved.
          </p>
        </footer>
      </div>

      <AchievementToast />
      <InfoToast />
      <BonusBetAward />
      <SubmitPickBar />
    </div>
  );
}
