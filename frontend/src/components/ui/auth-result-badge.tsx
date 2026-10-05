import React from "react";
import { AuthResult } from "@/types";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type BadgeSize = "xs" | "sm" | "md" | "lg";
export type BadgeVariant = "pill" | "subtle" | "outline" | "card";

export interface AuthResultBadgeProps {
  result: AuthResult;
  size?: BadgeSize;
  variant?: BadgeVariant;
  showIcon?: boolean;
  showDot?: boolean;
  showTooltip?: boolean;
  pulse?: boolean;
  fixedWidth?: boolean;
  useShortLabel?: boolean;
  interactive?: boolean;
  className?: string;
  customLabel?: string;
  customSubtext?: string;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

export interface StatusConfig {
  label: string;
  shortLabel: string;
  description: string;
  technicalTerm: string;
  textColor: string;
  bgColor: string;
  subtleBgColor: string;
  borderColor: string;
  dotColor: string;
  glowColor: string;
  badgeBg: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  accentColor: string;
}

export const AUTH_STATUS_CONFIG: Record<AuthResult, StatusConfig> = {
  SUCCESS: {
    label: "Berhasil",
    shortLabel: "Sukses",
    description: "Autentikasi terverifikasi & akses solenoid dibuka",
    technicalTerm: "AUTH_VERIFIED_GRANTED",
    textColor: "text-[#0f762a]",
    bgColor: "bg-[#eefbf1]",
    subtleBgColor: "bg-[#eefbf1]",
    borderColor: "border-[#c8f2d1]",
    dotColor: "bg-[#0f762a]",
    glowColor: "rgba(15, 118, 42, 0.25)",
    badgeBg: "bg-[#d2f4d9]",
    icon: CheckCircle2,
    accentColor: "#0f762a",
  },
  FAILED: {
    label: "Gagal",
    shortLabel: "Gagal",
    description: "Sidik jari tidak cocok / verifikasi tidak terdaftar",
    technicalTerm: "AUTH_MISMATCH_REJECTED",
    textColor: "text-[#a82828]",
    bgColor: "bg-[#fdf2f2]",
    subtleBgColor: "bg-[#fdf2f2]",
    borderColor: "border-[#fadad9]",
    dotColor: "bg-[#e03131]",
    glowColor: "rgba(224, 49, 49, 0.25)",
    badgeBg: "bg-[#fadad9]",
    icon: XCircle,
    accentColor: "#e03131",
  },
  DENIED: {
    label: "Ditolak",
    shortLabel: "Ditolak",
    description: "Akses dibatasi atau akun kedaluwarsa/suspended",
    technicalTerm: "PERMISSION_RESTRICTED",
    textColor: "text-[#9a3412]",
    bgColor: "bg-[#fdf3eb]",
    subtleBgColor: "bg-[#fdf3eb]",
    borderColor: "border-[#fbd6b8]",
    dotColor: "bg-[#dd5b00]",
    glowColor: "rgba(221, 91, 0, 0.25)",
    badgeBg: "bg-[#fbd6b8]",
    icon: AlertTriangle,
    accentColor: "#dd5b00",
  },
  SYSTEM: {
    label: "Sistem",
    shortLabel: "Sistem",
    description: "Event telemetri otomatis / sensor pintu MC-38",
    technicalTerm: "NODE_TELEMETRY_EVENT",
    textColor: "text-[#391c57]",
    bgColor: "bg-[#f7f1fd]",
    subtleBgColor: "bg-[#f7f1fd]",
    borderColor: "border-[#ebd8fb]",
    dotColor: "bg-[#5645d4]",
    glowColor: "rgba(86, 69, 212, 0.25)",
    badgeBg: "bg-[#ebd8fb]",
    icon: Cpu,
    accentColor: "#5645d4",
  },
};

const sizeClasses: Record<BadgeSize, {
  container: string;
  icon: string;
  dot: string;
  text: string;
  padding: string;
  fixedWidth: string;
}> = {
  xs: {
    container: "text-[10px] h-5 gap-1",
    icon: "h-3 w-3",
    dot: "h-1.5 w-1.5",
    text: "text-[10px] font-semibold tracking-tight whitespace-nowrap",
    padding: "px-2 py-0.5",
    fixedWidth: "min-w-[68px] justify-center",
  },
  sm: {
    container: "text-[11px] h-6 gap-1.5",
    icon: "h-3.5 w-3.5",
    dot: "h-1.5 w-1.5",
    text: "text-[11px] font-semibold tracking-tight whitespace-nowrap",
    padding: "px-2.5 py-0.5",
    fixedWidth: "min-w-[82px] justify-center",
  },
  md: {
    container: "text-xs h-7 gap-1.5",
    icon: "h-3.5 w-3.5",
    dot: "h-2 w-2",
    text: "text-xs font-semibold tracking-tight whitespace-nowrap",
    padding: "px-3 py-1",
    fixedWidth: "min-w-[92px] justify-center",
  },
  lg: {
    container: "text-sm h-8 gap-2",
    icon: "h-4 w-4",
    dot: "h-2.5 w-2.5",
    text: "text-sm font-semibold tracking-tight whitespace-nowrap",
    padding: "px-3.5 py-1.5",
    fixedWidth: "min-w-[108px] justify-center",
  },
};

const AuthResultBadgeComponent: React.FC<AuthResultBadgeProps> = ({
  result,
  size = "sm",
  variant = "pill",
  showIcon = true,
  showDot = false,
  showTooltip = false,
  pulse = false,
  fixedWidth = false,
  useShortLabel = false,
  interactive = false,
  className,
  customLabel,
  customSubtext,
  onClick,
}) => {
  const config = AUTH_STATUS_CONFIG[result] || AUTH_STATUS_CONFIG.SYSTEM;
  const Icon = config.icon;
  const s = sizeClasses[size];
  const isActionable = interactive || !!onClick;
  const resolvedLabel = customLabel || (useShortLabel ? config.shortLabel : config.label);
  const shouldApplyFixedWidth = fixedWidth && variant !== "card" && !customSubtext;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isActionable && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e);
    }
  };

  // Dedicated Card Variant
  if (variant === "card") {
    return (
      <div
        role={isActionable ? "button" : "status"}
        tabIndex={isActionable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        title={`Status: ${resolvedLabel} (${config.technicalTerm}) - ${config.description}`}
        aria-label={`Status: ${resolvedLabel} (${config.technicalTerm}) - ${config.description}`}
        className={cn(
          "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all duration-150 select-none",
          config.bgColor,
          config.borderColor,
          isActionable && "cursor-pointer hover:shadow-xs hover:border-[#c8c4be] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 active:scale-[0.99]",
          className
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {showDot && (
              <span className="relative flex shrink-0 items-center justify-center">
                {pulse && result !== "SYSTEM" && (
                  <span
                    className={cn(
                      "animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full opacity-60",
                      config.dotColor
                    )}
                  />
                )}
                <span className={cn("relative inline-flex rounded-full shrink-0 h-2 w-2", config.dotColor)} />
              </span>
            )}
            {showIcon && <Icon className={cn("h-4 w-4 shrink-0", config.textColor)} aria-hidden="true" />}
            <span className={cn("font-bold text-xs tracking-tight", config.textColor)}>
              {resolvedLabel}
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#787671] bg-white/70 px-1.5 py-0.5 rounded border border-[#e5e3df]">
            {config.technicalTerm}
          </span>
        </div>
        <p className="text-[11px] text-[#5d5b54] leading-relaxed line-clamp-2">
          {config.description}
        </p>
        {customSubtext && (
          <span className="text-[10px] font-mono text-[#787671] mt-0.5">
            {customSubtext}
          </span>
        )}
      </div>
    );
  }

  // Pill, Subtle, and Outline Variants
  const badgeContent = (
    <span
      role={isActionable ? "button" : "status"}
      tabIndex={isActionable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={`Status: ${resolvedLabel} - ${config.description}`}
      aria-label={`Status: ${resolvedLabel} - ${config.description}`}
      className={cn(
        "inline-flex items-center rounded-full border transition-all duration-150 select-none shrink-0 font-sans shadow-2xs tabular-nums",
        config.bgColor,
        config.borderColor,
        config.textColor,
        s.container,
        s.padding,
        shouldApplyFixedWidth && s.fixedWidth,
        isActionable && "cursor-pointer hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5645d4]/40 focus-visible:ring-offset-1",
        variant === "subtle" && cn("border-transparent", config.subtleBgColor),
        variant === "outline" && "bg-transparent",
        className
      )}
    >
      {/* Animated Live Pulse Beacon */}
      {showDot && (
        <span className="relative flex shrink-0 items-center justify-center" aria-hidden="true">
          {pulse && result !== "SYSTEM" && (
            <span
              className={cn(
                "animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full opacity-60",
                config.dotColor
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full shrink-0",
              s.dot,
              config.dotColor
            )}
          />
        </span>
      )}

      {/* Contextual SVG Icon */}
      {showIcon && (
        <Icon className={cn("shrink-0", s.icon)} aria-hidden="true" />
      )}

      {/* Main Label */}
      <span className={cn(s.text, "leading-none")}>
        {resolvedLabel}
      </span>

      {/* Optional Subtext / Hardware Tag */}
      {customSubtext && (
        <span className="text-[9px] font-mono opacity-70 ml-0.5 truncate hidden sm:inline tabular-nums">
          ({customSubtext})
        </span>
      )}
    </span>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  const tooltipBody = (
    <div className="flex flex-col gap-2 text-left p-0.5 select-text font-sans">
      <div className="flex items-center justify-between gap-2 border-b border-[#f0eeec] pb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className={cn("p-1 rounded-md border", config.bgColor, config.borderColor)}>
            <Icon className={cn("h-3.5 w-3.5", config.textColor)} aria-hidden="true" />
          </span>
          <span className="text-[#000000]">{resolvedLabel}</span>
        </div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#787671] bg-[#f6f5f4] px-1.5 py-0.5 rounded border border-[#e5e3df]">
          {config.technicalTerm}
        </span>
      </div>
      <p className="text-[11px] text-[#5d5b54] font-normal leading-relaxed">
        {config.description}
      </p>
      {customSubtext && (
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#787671] bg-[#fafaf9] px-2 py-1 rounded border border-[#e5e3df]">
          <span className="text-[#5d5b54]">Detail:</span>
          <span className="text-[#000000] font-semibold">{customSubtext}</span>
        </div>
      )}
      <div className="flex items-center justify-between text-[9px] text-[#a4a097] pt-0.5">
        <span>VaultOS Telemetri</span>
        <span className="font-mono text-[#0f762a]">● Aktif</span>
      </div>
    </div>
  );

  return (
    <Tooltip content={tooltipBody} side="top" align="center" interactive={true}>
      {badgeContent}
    </Tooltip>
  );
};

export const AuthResultBadge = React.memo(AuthResultBadgeComponent);
export default AuthResultBadge;
