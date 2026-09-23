export interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

function wrap(props: IconProps, defaults: { size: number }) {
  return {
    width: props.size ?? defaults.size,
    height: props.size ?? defaults.size,
    className: props.className,
  };
}

type IconComponent = (props: IconProps) => React.ReactNode;

const iconMap: Record<string, IconComponent> = {
  'fire-flame': FireFlameIcon,
  'star': StarIcon,
  'people-group': PeopleGroupIcon,
  'trophy': TrophyIcon,
  'coin': CoinIcon,
  'bolt': BoltIcon,
  'diamond': DiamondIcon,
  'olympic-medal': OlympicMedalIcon,
  'crystal-ball': CrystalBallIcon,
  'score': ScoreIcon,
  'leaderboard-rank': LeaderboardRankIcon,
  'tv': TVIcon,
  'sports-betting': SportsBettingIcon,
};

export function Icon({ name, ...rest }: IconProps & { name: string }) {
  const Comp = iconMap[name];
  if (!Comp) return <span>{name}</span>;
  return <>{Comp(rest)}</>;
}

export function FireFlameIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 17.5 22.86" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M7 0l1.03.41c2.86 1.14 4.47 3.98 4.47 7.7v.69l1.87-1.87.5.76c1 1.49 2.63 4.16 2.63 6.91 0 4.98-3.9 8.25-8.75 8.25S0 19.58 0 14.61c0-3.3 1.93-5.37 3.64-7.2l.06-.06C5.47 5.45 7 3.77 7 1.11V0zm2.39 12.23l.1.3c.47 1.4 1.05 2.13 1.53 2.73l.05.06c.25.31.49.61.66.97.17.36.27.78.27 1.31 0 1.8-1.45 3.25-3.25 3.25S5.5 19.4 5.5 17.61c0-1.77 1.07-3.68 3.62-5.21l.27-.17z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function StarIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.71 3.32a.75.75 0 00-1.43 0L9 10.4H1.55a.75.75 0 00-.44 1.36l6.02 4.38-2.3 7.08a.75.75 0 001.15.84L12 19.68l6.02 4.38a.75.75 0 001.16-.84l-2.3-7.08 6.02-4.38a.75.75 0 00-.44-1.36H15.02L12.71 3.32z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function PeopleGroupIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 4.5c-1.89 0-3.3 1.75-2.9 3.6l.29 1.3A3.25 3.25 0 0012 11.5a3.25 3.25 0 002.61-1.6l.28-1.3c.41-1.85-1-3.6-2.89-3.6zm-1.43 3.28c-.2-.91.49-1.78 1.43-1.78s1.63.87 1.43 1.78l-.28 1.3a1.75 1.75 0 01-1.15.92 1.75 1.75 0 01-1.15-.92l-.28-1.3z" fill={color || 'currentColor'} />
      <path d="M3.87 13.75a2.63 2.63 0 00-1.19.36c-.27.18-.44.49-.44.82v2.32H.75v-2.32c0-.83.42-1.6 1.1-2.07A4.12 4.12 0 013.88 12.25h2.25c.62 0 1.24.16 1.78.46a4.87 4.87 0 011.47-.46h4.26c.68 0 1.36.16 1.97.46.54-.3 1.15-.46 1.77-.46h2.25c.72 0 1.42.21 2.02.61.69.46 1.1 1.24 1.1 2.07v2.32h-1.5v-2.32c0-.33-.16-.64-.44-.82a2.63 2.63 0 00-1.18-.36h-2.25c-.19 0-.38.03-.56.07.28.46.43.99.43 1.54v2.89h-1.5v-2.89c0-.55-.31-1.06-.81-1.3a3.37 3.37 0 00-1.38-.31H9.87c-.46 0-.9.11-1.31.31-.5.25-.81.75-.81 1.3v2.89h-1.5v-2.89c0-.55.16-1.08.43-1.54a2.6 2.6 0 00-.56-.07H3.87z" fill={color || 'currentColor'} />
      <path fillRule="evenodd" clipRule="evenodd" d="M16.5 8.36a2.5 2.5 0 015 0l-.23 1.07a2.5 2.5 0 01-4.54 0L16.5 8.36zm2.5-1.11c-.68 0-1.18.63-1.04 1.29l.23 1.07c.08.38.42.64.81.64s.72-.26.8-.64l.24-1.07c.14-.66-.36-1.29-1.04-1.29z" fill={color || 'currentColor'} />
      <path fillRule="evenodd" clipRule="evenodd" d="M5 5.25a2.5 2.5 0 00-2.5 3.11l.23 1.07a2.5 2.5 0 004.54 0l.23-1.07A2.5 2.5 0 005 5.25zm-1.04 2.79c-.14-.66.36-1.29 1.04-1.29.68 0 1.18.63 1.04 1.29l-.24 1.07c-.08.38-.41.64-.8.64s-.73-.26-.81-.64l-.23-1.07z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function TrophyIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M18.25 3.75H5.75V5.75H1.25v.75c0 1.63.39 2.96 1.09 4.03a5.96 5.96 0 002.74 2.39c.88.45 1.85.75 2.83.95a6.85 6.85 0 002.56 2.1 4.68 4.68 0 01-1.35 2.35c-.36.33-.73.59-1 .76-.14.08-.25.15-.33.19l-.08.04-.03.01-.43.2V19.25h9.5v-1.73l-.44-.2-.01-.01-.02-.01-.08-.04a7.2 7.2 0 01-.33-.19 6.38 6.38 0 01-1-.76 4.68 4.68 0 01-1.36-2.35 6.85 6.85 0 002.56-2.1c.98-.2 1.95-.5 2.83-.95a5.96 5.96 0 002.74-2.39 6.48 6.48 0 001.09-4.03V5.75h-4.5V3.75zm-2.39 8.3c.65-1.49 1.03-3.2 1.12-4.8h3v.25c-.1 1.01-.4 1.82-.82 2.47-.52.8-1.26 1.41-2.16 1.86-.36.18-.74.33-1.14.47v-.25zm-9.34 0c-.38-.13-.76-.28-1.11-.47-.9-.45-1.64-1.06-2.16-1.86a5 5 0 01-.82-2.47v-.25h2.99c.09 1.6.47 3.31 1.12 4.8l-.02.25z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function CoinIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 4.25c-2.72 0-5.22.58-7.07 1.55C3.12 6.75 1.75 8.2 1.75 10v4c0 1.8 1.37 3.25 3.18 4.2C6.78 19.17 9.28 19.75 12 19.75s5.22-.58 7.07-1.55c1.81-.95 3.18-2.4 3.18-4.2v-4c0-1.57-.95-2.87-2.43-3.82a9.7 9.7 0 00-.6-.38C17.22 4.83 14.72 4.25 12 4.25zM3.25 14v-.96a5.9 5.9 0 001.93 1.16l.07.03v2.27c-1.19-.78-1.75-1.67-1.75-2.5zm3.5 3.27c.74.3 1.58.54 2.5.71v-2.48a12 12 0 01-2.5-.63v2.4zm3.75 1.16c.49.04.98.07 1.5.07s1.01-.03 1.5-.07v-2.5c-.49.04-.99.07-1.5.07s-1.01-.03-1.5-.07v2.5zm4.75-.45v-2.48c.92-.17 1.76-.41 2.5-.71v2.4c-.75.34-1.6.59-2.5.79zm4.5-3.23c-.48.44-1.06.83-1.68 1.16v-2.27l.07-.03c.84-.3 1.49-.78 1.93-1.16-.02.97-.56 1.83-1.55 2.5l1.23-.2z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function BoltIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.7 1.25H13l-11.25 13.5h8.25l-1 8H10.7L21.95 9.25h-8.25l1-8z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function DiamondIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill={color || 'currentColor'}>
        <path d="M10.04 3.25l-2 6h5.92l-2-6h-1.92z" />
        <path d="M8.46 3.25l-2 6H1.54l3-6h3.92z" />
        <path d="M1.67 10.75l8.61 9.48L6.5 10.75H1.67z" />
        <path d="M13.72 20.23l8.61-9.48h-4.83l-3.78 9.48z" />
        <path d="M22.46 9.25l-3-6h-3.92l2 6h4.92z" />
        <path d="M12 20.48L8.11 10.75h7.78L12 20.48z" />
      </g>
    </svg>
  );
}

export function OlympicMedalIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 10.06a4.69 4.69 0 100 9.38 4.69 4.69 0 000-9.38zm-3.31 4.69a3.31 3.31 0 116.63 0 3.31 3.31 0 01-6.63 0z" fill={color || 'currentColor'} />
      <path fillRule="evenodd" clipRule="evenodd" d="M21 3h-1.68l-2.51 5.02a8.3 8.3 0 00-1.18-.7L17.43 3h-1.68l-1.54 3.07L12 3l-2.21 3.07L8.25 3H6.57l1.8 4.32a8.3 8.3 0 00-1.18.7L4.68 3H3l3.02 6.03A8.25 8.25 0 1021 3zM12 8a6.75 6.75 0 100 13.5A6.75 6.75 0 0012 8z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function CrystalBallIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.76 8.42l-.59 1.76-1.76.59v.47l1.76.59.59 1.76h.47l.59-1.76 1.76-.59v-.47l-1.76-.59-.59-1.76h-.47z" fill={color || 'currentColor'} />
      <path d="M10.26 6.42l-.34 1-.99.34v.47l1 .34.33 1h.47l.34-1 1-.34v-.47l-1-.34-.34-1h-.47z" fill={color || 'currentColor'} />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 3.25a8.75 8.75 0 00-5.13 15.84L5.25 21.25v1.5h13.5v-1.5l-1.62-2.16A8.75 8.75 0 0012 3.25zM4.75 12a7.25 7.25 0 1114.5 0 7.25 7.25 0 01-8.37 7.16l-.38-.06-.22.3-1.4 1.85h5.74L13.5 19.4l-.22-.3-.38.06A7.25 7.25 0 014.75 12z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function ScoreIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill={color || 'currentColor'}>
        <path d="M16 11l.0001 1.125h1.5V11H16z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M16.25 5H7.75V3.25h-1.5V5H2.25v15.5h19.5V5h-4V3.25h-1.5V5zM9.5 10.87L7.79 16H6.21L7.87 11H6.5v.375H5V9.5h4.5v2.37zM12.75 10.25v1.5h-1.5v-1.5h1.5zm0 3.5v1.5h-1.5v-1.5h1.5zM17.5 13.63h-1.75a1.13 1.13 0 01-1.13-1.13l-.0002-1.625a1.125 1.125 0 011.13-1.125l2 .0001c.69 0 1.25.56 1.25 1.25v4c0 .69-.56 1.25-1.25 1.25h-2A1.25 1.25 0 0114.5 15.25l.0003-.625h1.5l-.0001.375h1.5V13.63z" />
      </g>
    </svg>
  );
}

export function LeaderboardRankIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill={color || 'currentColor'}>
        <path d="M11.27 3.25h1.5V8.25h1.25V9.75H10.02V8.25h1.25V5.75H10.02V4.25h.25c.55 0 1-.45 1-1z" />
        <path d="M2.75 6a1.25 1.25 0 011.25-1.25h2c.69 0 1.25.56 1.25 1.25v1.08c0 .46-.25.88-.65 1.1L4.25 9.44V9.75h2.63v1.5H2.75V9.3c0-.46.25-.88.65-1.1L5.75 6.93V6.25h-1.5v.375h-1.5V6z" />
        <path d="M18 5.75c-.69 0-1.25.56-1.25 1.25v.625h1.5V7.25h1.5v2H18v1.5h1.5v1h-1.5v-.375h-1.5v.625c0 .69.56 1.25 1.25 1.25h2c.69 0 1.25-.56 1.25-1.25v-1c0-.37-.12-.73-.31-1 .19-.27.31-.63.31-1v-1c0-.69-.56-1.25-1.25-1.25H18z" />
        <path d="M8.25 11.75H15.75V14.25h6V19.75H18.25v-4H15.75V19.75h-1.5V13.25H9.75V19.75h-1.5V14.75H3.75V19.75h-1.5V13.25h6V11.75z" />
      </g>
    </svg>
  );
}

export function TVIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2.25 3.25h19.5v15.5h-6v2h-7.5v-2h-6V3.25zm18 12.75V4.75H3.75v11.25h16.5z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function PersonIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 19.5 19.5" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M0 9.75C0 4.365 4.365 0 9.75 0s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S0 15.135 0 9.75zm6.95-2.022c-.39-1.787.97-3.478 2.8-3.478s3.19 1.691 2.8 3.478l-.337 1.54A2.75 2.75 0 019.75 11.25a2.75 2.75 0 01-2.463-1.983l-.337-1.539zm8.302 5.934c.46.23.863.539 1.195.906A8.22 8.22 0 019.75 18a8.22 8.22 0 01-6.697-3.431c.333-.367.736-.676 1.195-.906A6.44 6.44 0 017.055 13h5.39c.975 0 1.936.227 2.808.663z" fill={color || 'currentColor'} />
    </svg>
  );
}

export function SportsBettingIcon({ size = 24, className, color }: IconProps) {
  return (
    <svg {...wrap({ size, className }, { size: 24 })} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill={color || 'currentColor'}>
        <path fillRule="evenodd" clipRule="evenodd" d="M8.5 1.5V3h3a2 2 0 012 2v1h-2V5h-3v2.5h3a2 2 0 012 2v2.5a2 2 0 01-2 2h-3V15.5h-2V14H3.5a2 2 0 01-2-2v-1h2v1h3V9.5h-3a2 2 0 01-2-2V5a2 2 0 012-2h3V1.5h2zM3.5 5h3v2.5h-3V5zM8.5 12V9.5h3V12h-3z" />
        <path d="M18 3.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M13.76 13.76a5.87 5.87 0 017.66.23l.48.48.1.48a8.43 8.43 0 01-1.77 8.16l-.001.001a8.43 8.43 0 01-7.66 1.77l-.48-.1-.48-.48a5.87 5.87 0 01-.23-7.66l.001-.001a5.87 5.87 0 012.36-2.85zM16.03 19.03l3-3-1.06-1.06-3 3 1.06 1.06z" />
      </g>
    </svg>
  );
}
