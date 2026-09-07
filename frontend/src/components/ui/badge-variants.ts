export const badgeVariants = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  success: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
  warning: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
  danger: 'bg-rose-950/50 text-rose-300 border-rose-800/40',
  info: 'bg-sky-950/50 text-sky-300 border-sky-800/40',
  purple: 'bg-purple-950/50 text-purple-300 border-purple-800/40',
  online: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
  offline: 'bg-rose-950/50 text-rose-300 border-rose-800/40',
  mono: 'bg-slate-950 text-slate-300 border-slate-800 font-mono',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;
