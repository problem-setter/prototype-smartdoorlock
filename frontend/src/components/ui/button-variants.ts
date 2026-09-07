export const buttonVariants = {
  variant: {
    default: 'bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700 shadow-sm border border-sky-400/40 focus-visible:ring-sky-400/50',
    destructive: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-sm border border-rose-400/40 focus-visible:ring-rose-400/50',
    outline: 'border border-white/12 bg-slate-900/80 text-slate-200 hover:bg-slate-800/90 hover:text-white hover:border-white/25 active:bg-slate-850 shadow-sm backdrop-blur-md focus-visible:ring-sky-400/40',
    secondary: 'bg-slate-800/95 text-slate-100 border border-slate-700/90 hover:bg-slate-700 hover:border-slate-600 active:bg-slate-800 shadow-sm focus-visible:ring-slate-400/40',
    ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800 focus-visible:ring-slate-400/40',
    link: 'text-sky-400 underline-offset-4 hover:underline hover:text-sky-300 focus-visible:ring-sky-400/50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 shadow-sm border border-emerald-400/40 focus-visible:ring-emerald-400/50',
    purple: 'bg-purple-700 text-white hover:bg-purple-600 active:bg-purple-800 shadow-sm border border-purple-400/40 focus-visible:ring-purple-400/50',
    tactical: 'bg-[#0c111d] text-sky-300 border border-sky-500/40 hover:bg-sky-950/60 hover:border-sky-400/70 active:bg-sky-950 shadow-sm focus-visible:ring-sky-400/50',
  },
  size: {
    default: 'h-9 px-3.5 sm:px-4 py-2 text-xs sm:text-sm gap-2',
    sm: 'h-8 px-2.5 sm:px-3 py-1.5 text-xs gap-1.5',
    lg: 'h-11 px-5 sm:px-6 py-3 text-sm gap-2.5 font-bold',
    icon: 'h-9 w-9 p-0',
    'icon-sm': 'h-8 w-8 p-0',
  },
} as const;

export type ButtonVariant = keyof typeof buttonVariants.variant;
export type ButtonSize = keyof typeof buttonVariants.size;



