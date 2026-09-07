export const badgeVariants = {
  default: 'bg-slate-800/90 text-slate-300 border-white/10 shadow-xs',
  success: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.18)]',
  warning: 'bg-amber-950/70 text-amber-300 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.18)]',
  danger: 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_14px_rgba(244,63,94,0.22)]',
  info: 'bg-sky-950/70 text-sky-300 border-sky-500/35 shadow-[0_0_12px_rgba(14,165,233,0.18)]',
  purple: 'bg-purple-950/70 text-purple-300 border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.18)]',
  online: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-mono tracking-tight',
  offline: 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)] font-mono tracking-tight',
  mono: 'bg-slate-950/90 text-slate-300 border-white/12 font-mono tracking-tight shadow-xs',
  tactical: 'bg-sky-950/80 text-sky-300 border-sky-400/40 font-mono tracking-wider text-[10px] uppercase shadow-[0_0_10px_rgba(14,165,233,0.2)]',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;


