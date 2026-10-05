export const buttonVariants = {
  variant: {
    default: 'bg-[#5645d4] text-white hover:bg-[#4534b3] active:bg-[#3a2a99] rounded-md font-medium transition-colors focus-visible:ring-[#5645d4]/40 shadow-xs',
    dark: 'bg-[#000000] text-white hover:bg-[#1a1a1a] active:bg-[#37352f] rounded-md font-medium transition-colors shadow-notion-1 focus-visible:ring-[#000000]/40',
    destructive: 'bg-[#dd5b00] text-white hover:bg-[#c44f00] active:bg-[#aa4400] rounded-md font-medium transition-colors focus-visible:ring-[#dd5b00]/40 shadow-xs',
    outline: 'border border-[#e6e6e6] bg-white text-[#31302e] hover:bg-[#f6f5f4] hover:text-[#000000] active:bg-[#eceae8] rounded-md transition-colors shadow-notion-1 focus-visible:ring-[#5645d4]/30',
    secondary: 'bg-white text-[#000000] border border-[#e6e6e6] hover:bg-[#f6f5f4] active:bg-[#eceae8] rounded-md transition-colors shadow-notion-1 font-medium focus-visible:ring-[#5645d4]/30',
    utility: 'bg-white text-[#000000] border border-[#e6e6e6] hover:bg-[#f6f5f4] active:bg-[#eceae8] rounded-md transition-colors font-medium text-xs sm:text-sm focus-visible:ring-[#5645d4]/30',
    ghost: 'text-[#31302e] hover:text-[#000000] hover:bg-[#f6f5f4] active:bg-[#eceae8] rounded-md transition-colors focus-visible:ring-[#5645d4]/30',
    link: 'text-[#0075de] underline-offset-4 hover:underline hover:text-[#005bab] focus-visible:ring-[#5645d4]/40',
    success: 'bg-[#0f762a] text-white hover:bg-[#0c5e21] active:bg-[#094719] rounded-md font-medium transition-colors focus-visible:ring-[#0f762a]/40 shadow-xs',
    purple: 'bg-[#5645d4] text-white hover:bg-[#4534b3] active:bg-[#3a2a99] rounded-md font-medium transition-colors focus-visible:ring-[#5645d4]/40 shadow-xs',
    tactical: 'bg-[#f6f5f4] text-[#5645d4] border border-[#e6e6e6] hover:bg-[#e6e0f5] active:bg-[#d6b6f6]/30 rounded-md transition-colors font-medium focus-visible:ring-[#5645d4]/30',
  },
  size: {
    default: 'h-9 px-4 py-2 text-xs sm:text-sm gap-2',
    sm: 'h-8 px-3 py-1 text-xs gap-1.5',
    lg: 'h-11 px-6 py-2.5 text-sm sm:text-base gap-2.5 font-semibold',
    icon: 'h-9 w-9 p-0',
    'icon-sm': 'h-8 w-8 p-0',
  },
} as const;

export type ButtonVariant = keyof typeof buttonVariants.variant;
export type ButtonSize = keyof typeof buttonVariants.size;





