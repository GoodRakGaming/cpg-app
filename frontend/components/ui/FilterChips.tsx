interface FilterChipsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-control px-3.5 py-2 text-sm font-semibold transition-colors ${
            option.value === value
              ? 'bg-accent text-white'
              : 'border border-line bg-surface-1 text-text hover:bg-surface-0'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
