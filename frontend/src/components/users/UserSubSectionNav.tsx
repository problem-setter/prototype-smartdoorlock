import React from "react";
import { Users, Clock, Fingerprint, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserSubSection = "directory" | "requests" | "biometrics" | "lifecycle";

interface SubSectionMeta {
  id: UserSubSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  highlightBadge?: boolean;
  highlightColor?: string;
}

interface UserSubSectionNavProps {
  activeSection: UserSubSection;
  onSectionChange: (section: UserSubSection) => void;
  counts: {
    directory: number;
    requests: number;
    biometrics: number;
    lifecycle: number;
  };
}

export const UserSubSectionNav: React.FC<UserSubSectionNavProps> = ({
  activeSection,
  onSectionChange,
  counts,
}) => {
  const sections: SubSectionMeta[] = [
    {
      id: "directory",
      label: "Direktori Sivitas",
      shortLabel: "Direktori",
      description: "Daftar sivitas terverifikasi & profil akses",
      icon: <Users className="h-4 w-4 shrink-0" />,
      count: counts.directory,
    },
    {
      id: "requests",
      label: "Permohonan Akses",
      shortLabel: "Permohonan",
      description: "Antrean registrasi & persetujuan akses",
      icon: <Clock className="h-4 w-4 shrink-0" />,
      count: counts.requests,
      highlightBadge: counts.requests > 0,
      highlightColor: "danger",
    },
    {
      id: "biometrics",
      label: "Biometrik DY50",
      shortLabel: "Biometrik",
      description: "Alokasi template sidik jari hardware",
      icon: <Fingerprint className="h-4 w-4 shrink-0" />,
      count: counts.biometrics,
    },
    {
      id: "lifecycle",
      label: "Masa Berlaku Akses",
      shortLabel: "Masa Berlaku",
      description: "Siklus durasi temporal & perpanjangan",
      icon: <CalendarClock className="h-4 w-4 shrink-0" />,
      count: counts.lifecycle,
      highlightBadge: counts.lifecycle > 0,
      highlightColor: "danger",
    },
  ];

  return (
    <nav
      aria-label="Navigasi Sub-Halaman Manajemen Pengguna"
      className="w-full bg-white rounded-xl border border-[#e5e3df] p-1.5 sm:p-2 shadow-2xs font-sans"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-1.5" role="tablist">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const hasAttention = Boolean(section.highlightBadge && section.count > 0);

          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "flex flex-col items-start p-2 sm:p-2.5 md:p-3 rounded-lg text-left transition-all duration-150 cursor-pointer relative group border select-none",
                isActive
                  ? "bg-[#fafaf9] border-[#5645d4] shadow-xs ring-1 ring-[#5645d4]/20"
                  : "bg-transparent border-transparent hover:bg-[#f6f5f4] hover:border-[#ede9e4]"
              )}
            >
              {/* Top row: Icon + Title + Badge */}
              <div className="flex items-center justify-between w-full gap-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 aspect-square rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isActive
                          ? "bg-[#5645d4] text-white border-[#5645d4]"
                          : "bg-[#f6f5f4] text-[#5d5b54] border-[#e5e3df] group-hover:text-[#1a1a1a]"
                      )}
                    >
                      {section.icon}
                    </div>
                    {/* Glowing notification ping dot on top corner */}
                    {hasAttention && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e03131] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e03131] ring-2 ring-white" />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "font-semibold text-xs sm:text-[13px] truncate",
                      isActive ? "text-[#1a1a1a]" : "text-[#5d5b54] group-hover:text-[#1a1a1a]"
                    )}
                  >
                    <span className="hidden xl:inline">{section.label}</span>
                    <span className="xl:hidden">{section.shortLabel}</span>
                  </span>
                </div>

                {/* Badge Count with Notification Accent */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-full border tabular-nums shrink-0 transition-colors flex items-center gap-1",
                      isActive
                        ? "bg-white text-[#5645d4] border-[#5645d4]/30 shadow-xs"
                        : hasAttention
                        ? "bg-[#fdf2f2] text-[#e03131] border-[#e03131]/30 font-bold shadow-2xs"
                        : "bg-[#f6f5f4] text-[#787671] border-[#e5e3df]"
                    )}
                  >
                    {hasAttention && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e03131] shrink-0" />
                    )}
                    <span>{section.count}</span>
                  </span>
                </div>
              </div>

              {/* Subtitle helper description */}
              <p className="text-[11px] text-[#787671] mt-1.5 line-clamp-1 hidden md:block">
                {section.description}
              </p>

              {/* Bottom active pill indicator */}
              {isActive && (
                <div className="w-full h-0.5 bg-[#5645d4] rounded-full mt-2 hidden sm:block" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
