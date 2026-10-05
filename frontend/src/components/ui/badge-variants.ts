export const badgeVariants = {
  default: 'bg-[#f6f5f4] text-[#31302e] border-[#e6e6e6]',
  success: 'bg-[#eefbf1] text-[#0f762a] border-[#c8f2d1]',
  warning: 'bg-[#ffe8d4] text-[#793400] border-[#ffd4af]',
  danger: 'bg-[#fde0ec] text-[#e03131] border-[#f9c0d6]',
  info: 'bg-[#e6e0f5] text-[#5645d4] border-[#d6b6f6]',
  purple: 'bg-[#e6e0f5] text-[#391c57] border-[#d6b6f6]',
  'purple-solid': 'bg-[#5645d4] text-white border-[#4534b3]',
  online: 'bg-[#eefbf1] text-[#0f762a] border-[#c8f2d1] font-mono tracking-tight',
  offline: 'bg-[#fde0ec] text-[#e03131] border-[#f9c0d6] font-mono tracking-tight',
  mono: 'bg-[#f6f5f4] text-[#31302e] border-[#e6e6e6] font-mono tracking-tight',
  tactical: 'bg-[#f6f5f4] text-[#5645d4] border-[#e6e6e6] font-mono tracking-[0.125px] text-[10px] uppercase font-semibold',
} as const;

export type BadgeVariant = keyof typeof badgeVariants;




