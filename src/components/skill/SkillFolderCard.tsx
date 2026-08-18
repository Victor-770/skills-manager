import { FolderOpen, Link2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { formatPathForDisplay } from "@/lib/path";
import { cn } from "@/lib/utils";

interface SkillFolderCardProps {
  name: string;
  path: string;
  skillCount: number;
  linkedAgentCount?: number;
  readOnlyAgentCount?: number;
  isSymlink?: boolean;
  previewNames?: string[];
  onOpen: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  isDeleting?: boolean;
  className?: string;
}

export function SkillFolderCard({
  name,
  path,
  skillCount,
  linkedAgentCount = 0,
  readOnlyAgentCount = 0,
  isSymlink = false,
  previewNames = [],
  onOpen,
  onDelete,
  deleteLabel,
  isDeleting = false,
  className,
}: SkillFolderCardProps) {
  const { t } = useTranslation();
  const preview = previewNames.slice(0, 3).join(", ");

  return (
    <div className={cn("rounded-xl ring-1 ring-border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 space-y-2 rounded-lg text-left cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          onClick={onOpen}
          aria-label={t("skillFolder.openFolderLabel", { name })}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            <h3 className="truncate font-medium">{name}</h3>
            {isSymlink && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Link2 className="size-3" />
                {t("central.bundleSymlink")}
              </span>
            )}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {formatPathForDisplay(path)}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{t("skillFolder.skillCount", { count: skillCount })}</span>
            {linkedAgentCount > 0 && (
              <span>{t("skillFolder.platformCount", { count: linkedAgentCount })}</span>
            )}
            {readOnlyAgentCount > 0 && (
              <span>{t("skillFolder.sharedCount", { count: readOnlyAgentCount })}</span>
            )}
          </div>
          {preview && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {t("skillFolder.preview", { names: preview })}
            </p>
          )}
        </button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={deleteLabel}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
