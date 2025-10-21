import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center font-medium transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-future-primary/50',
        'disabled:pointer-events-none disabled:opacity-40',
        {
          'bg-future-primary hover:bg-future-primary/90 text-white shadow-lg hover:shadow-glow': variant === 'primary',
          'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white': variant === 'secondary',
          'hover:bg-white/5 text-white/70 hover:text-white': variant === 'ghost',
        },
        {
          'h-8 px-3 text-xs rounded-lg': size === 'sm',
          'h-10 px-5 text-sm rounded-xl': size === 'md',
          'h-12 px-7 text-base rounded-xl': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


