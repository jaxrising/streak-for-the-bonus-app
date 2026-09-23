import { useState } from 'react';
import { TVIcon, SportsBettingIcon } from './icons';

interface AccountLinkCardProps {
  platform: 'ESPN' | 'DraftKings';
  linked: boolean;
  onLink: () => void;
  disabled?: boolean;
}

export default function AccountLinkCard({ platform, linked, onLink, disabled }: AccountLinkCardProps) {
  const [loading, setLoading] = useState(false);

  const isESPN = platform === 'ESPN';

  const handleLink = () => {
    if (linked || loading || disabled) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLink();
    }, 1500);
  };

  return (
    <div
      className={`border rounded-xl p-5 transition-all ${disabled ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: 'var(--color-theme-surface)',
        borderColor: linked
          ? isESPN
            ? 'rgba(245, 24, 37, 0.3)'
            : 'rgba(45, 204, 48, 0.3)'
          : 'var(--color-theme-border)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div style={{ color: 'var(--color-theme-text)' }}>{isESPN ? <TVIcon size={32} /> : <SportsBettingIcon size={32} />}</div>
        <div>
          <h3 className="text-[18px] leading-[24px] font-bold font-title" style={{ color: 'var(--color-theme-text)' }}>{platform}</h3>
          <p className="text-xs" style={{ color: 'var(--color-theme-text-tertiary)' }}>
            {isESPN ? 'Connect your ESPN account' : 'Link your DraftKings account'}
          </p>
        </div>
      </div>

      {linked ? (
        <div className={`flex items-center gap-2 text-[14px] leading-[20px] font-bold font-title ${isESPN ? 'text-espn-red' : 'text-status-success'}`}>
          <span>✓</span> Connected
        </div>
      ) : (
        <button
          onClick={handleLink}
          disabled={loading || disabled}
          className={`cta-pill w-full ${
            loading
              ? 'cursor-wait opacity-50'
              : disabled
              ? 'cursor-not-allowed opacity-40'
              : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-theme-border)', borderTopColor: 'var(--color-theme-text)' }} />
              Connecting...
            </span>
          ) : disabled ? (
            `Link ESPN first`
          ) : (
            `Connect ${platform}`
          )}
        </button>
      )}
    </div>
  );
}
