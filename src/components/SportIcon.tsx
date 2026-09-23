import { useSyncExternalStore } from 'react';
import { resolveLogo } from '../data/offlineLeagueLogos';

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

export default function SportIcon({ league, className = '' }: { league: string; className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme);
  const logo = leagueLogos[league];
  if (!logo) return null;
  const src = resolveLogo(theme === 'dark' ? logo.dark : logo.light);
  return <img src={src} alt={league} className={`w-5 h-5 object-contain ${className}`} />;
}
