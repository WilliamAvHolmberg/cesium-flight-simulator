interface ControlButtonProps {
  keys: string[];
  description: string;
}

export function ControlButton({ keys, description }: ControlButtonProps) {
  return (
    <div className="flex items-center justify-between gap-3 group">
      <div className="flex gap-1.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="px-2 py-1 text-[10px] font-medium text-white bg-white/5 border border-white/10 rounded-lg group-hover:bg-white/10 group-hover:border-white/20 transition-all"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span className="text-xs text-white/60 group-hover:text-white/90 transition-colors">{description}</span>
    </div>
  );
}


