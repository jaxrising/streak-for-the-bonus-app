import { useSyncExternalStore } from 'react';
import { resolveLogo } from '../data/offlineLeagueLogos';

export type SportFilter = 'all' | string;

interface SportFilterChipsProps {
  active: SportFilter;
  onChange: (filter: SportFilter) => void;
  availableLeagues: string[];
}

const leagueLogos: Record<string, { light: string; dark: string }> = {
  NFL: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nfl.png',
  },
  NBA: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nba.png',
  },
  NHL: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/nhl.png',
  },
  MLB: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/mlb.png',
  },
  WNBA: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/wnba.png',
  },
  EPL: {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/23.png',
  },
  'Champions League': {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/2.png',
  },
  MLS: {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/19.png',
  },
  'Liga MX': {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/22.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/22.png',
  },
  'La Liga': {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/15.png',
  },
  'Serie A': {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/12.png',
  },
  Bundesliga: {
    light: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png',
    dark: 'https://a.espncdn.com/i/leaguelogos/soccer/500-dark/10.png',
  },
  WWE: {
    light: 'https://a.espncdn.com/i/teamlogos/leagues/500/wwe.png',
    dark: 'https://a.espncdn.com/i/teamlogos/leagues/500-dark/wwe.png',
  },
  PGA: {
    light: 'https://a.espncdn.com/i/espn/misc_logos/500/pga_tour.png',
    dark: 'https://a.espncdn.com/i/espn/misc_logos/500-dark/pga_tour.png',
  },
};

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export default function SportFilterChips({ active, onChange, availableLeagues }: SportFilterChipsProps) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme);

  // Edge-to-edge scroller. The negative margin must match the content
  // column's horizontal padding exactly — Layout uses px-[10px], so -mx-4
  // (16px) overshot by 6px a side and gave the whole page a 6px horizontal
  // scroll on a 390px phone. The row scrolls internally either way, so the
  // symptom was just a page that drifted sideways under the thumb.
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-[10px] px-[10px]">
      {/* All Events pill */}
      <button
        onClick={() => onChange('all')}
        className="shrink-0 flex items-center gap-1.5 h-8 rounded-full px-3 transition-all text-[12px] leading-[14px] tracking-[0.02em] font-bold font-title uppercase whitespace-nowrap"
        style={{
          backgroundColor: active === 'all' ? 'var(--color-theme-text)' : 'transparent',
          color: active === 'all' ? 'var(--color-theme-bg)' : 'var(--color-theme-text-secondary)',
          border: active === 'all' ? '1px solid var(--color-theme-text)' : '1px solid var(--color-theme-border-hover)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        ALL EVENTS
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Vertical divider */}
      <div className="shrink-0 w-px h-5" style={{ backgroundColor: 'var(--color-theme-border-hover)' }} />

      {/* League chips */}
      {availableLeagues.map((league) => {
        const isActive = active === league;
        const logo = leagueLogos[league];
        const src = logo ? resolveLogo(theme === 'dark' ? logo.dark : logo.light) : undefined;

        return (
          <button
            key={league}
            onClick={() => onChange(league)}
            className="shrink-0 flex items-center gap-1.5 h-8 rounded-full pl-1.5 pr-3 transition-all text-[12px] leading-[14px] tracking-[0.02em] font-bold font-title uppercase whitespace-nowrap"
            style={{
              backgroundColor: isActive ? 'var(--color-theme-text)' : 'transparent',
              color: isActive ? 'var(--color-theme-bg)' : 'var(--color-theme-text-secondary)',
              border: isActive ? '1px solid var(--color-theme-text)' : '1px solid var(--color-theme-border-hover)',
            }}
          >
            {src && <img src={src} alt={league} className="w-6 h-6 rounded-full object-contain" />}
            {league}
          </button>
        );
      })}
    </div>
  );
}
