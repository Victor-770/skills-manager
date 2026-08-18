import { useTranslation } from "react-i18next";

import type { SkillListViewMode } from "@/lib/skillFolders";
import { cn } from "@/lib/utils";

interface SkillListModeToggleProps {
  value: SkillListViewMode;
  onChange: (value: SkillListViewMode) => void;
}

export function SkillListModeToggle({ value, onChange }: SkillListModeToggleProps) {
  const { t } = useTranslation();
  const options: Array<{ value: SkillListViewMode; label: string }> = [
    { value: "all", label: t("skillList.viewModeAll") },
    { value: "folders", label: t("skillList.viewModeFolders") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("skillList.viewModeLabel")}</span>
      <div
        role="group"
        aria-label={t("skillList.viewModeLabel")}
        className="flex rounded-xl bg-muted/40 p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              value === option.value
                ? "bg-background/95 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
