export const buttonVariants = {
  variant: {
    default: 'bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 shadow-md shadow-sky-600/25',
    destructive: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-lg shadow-rose-600/30',
    outline: 'border border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
    secondary: 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 active:bg-slate-700/80 shadow-sm',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/60',
    link: 'text-sky-400 underline-offset-4 hover:underline hover:text-sky-300',
    success: 'bg-emerald-700 text-white hover:bg-emerald-600 active:bg-emerald-800 shadow-md shadow-emerald-700/25',
    purple: 'bg-purple-700 text-white hover:bg-purple-600 active:bg-purple-800 shadow-sm shadow-purple-700/20',
  },
  size: {
    default: 'h-9 px-4 py-2 text-xs sm:text-sm',
    sm: 'h-8 px-3 py-1.5 text-xs',
    lg: 'h-11 px-6 py-3 text-sm',
    icon: 'h-9 w-9',
    'icon-sm': 'h-8 w-8',
  },
} as const;

export type ButtonVariant = keyof typeof buttonVariants.variant;
export type ButtonSize = keyof typeof buttonVariants.size;
