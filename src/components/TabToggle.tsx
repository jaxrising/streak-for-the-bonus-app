interface TabToggleProps {
  options: [string, string];
  active: number;
  onChange: (index: number) => void;
}

export default function TabToggle({ options, active, onChange }: TabToggleProps) {
  return (
    <div className="flex gap-[6px]">
      {options.map((label, i) => (
        <button
          key={label}
          onClick={() => onChange(i)}
          className={`cta-pill flex-1 ${active === i ? 'cta-pill-active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
