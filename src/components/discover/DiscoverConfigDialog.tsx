import { Radar, Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useDiscoverStore } from "@/stores/discoverStore";
import { usePlatformStore } from "@/stores/platformStore";
import { ScanRoot } from "@/types";
import { describeSkillsPattern } from "@/lib/path";
import { isEnabledInstallTargetAgent } from "@/lib/agents";

const OBSIDIAN_VAULT_PATTERNS = [
  ".skills/<skill>/SKILL.md",
  ".agents/skills/<skill>/SKILL.md",
  ".claude/skills/<skill>/SKILL.md",
];

// ─── DiscoverConfigDialog ────────────────────────────────────────────────────

interface DiscoverConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscoverConfigDialog({ open, onOpenChange }: DiscoverConfigDialogProps) {
  const { t } = useTranslation();

  const scanRoots = useDiscoverStore((s) => s.scanRoots);
  const isLoadingRoots = useDiscoverStore((s) => s.isLoadingRoots);
  const loadScanRoots = useDiscoverStore((s) => s.loadScanRoots);
  const setScanRootEnabled = useDiscoverStore((s) => s.setScanRootEnabled);
  const startScan = useDiscoverStore((s) => s.startScan);

  const agents = usePlatformStore((s) => s.agents);

  // Load roots when dialog opens.
  const handleOpenChange = (open: boolean) => {
    if (open) {
      loadScanRoots();
    }
    onOpenChange(open);
  };

  // Get platform skill directory patterns for display.
  const platformPatterns = agents
    .filter(isEnabledInstallTargetAgent)
    .map((a) => ({
      name: a.display_name,
      pattern: describeSkillsPattern(a.global_skills_dir),
    }));

  const enabledCount = scanRoots.filter((r) => r.enabled && r.exists).length;

  function handleStartScan() {
    // Close the dialog IMMEDIATELY so the user can see the ProgressView
    // with the Stop button. The scan runs asynchronously in the background;
    // errors are captured in the store's error state.
    onOpenChange(false);
    startScan();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radar className="size-5" />
            {t("discover.title")}
          </DialogTitle>
          <DialogDescription>{t("discover.desc")}</DialogDescription>
        </DialogHeader>

        <div
          data-slot="dialog-body"
          className="min-w-0 max-h-none space-y-4 overflow-visible px-0 py-2"
        >
          {/* Scan Roots */}
          <div className="min-w-0 overflow-x-hidden">
            <h3 className="text-sm font-medium mb-2">{t("discover.scanRoots")}</h3>
            <p className="text-xs text-muted-foreground mb-2">
              {t("discover.scanRootsDesc")}
            </p>

            {isLoadingRoots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("common.loading")}</span>
              </div>
            ) : scanRoots.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                No candidate directories found.
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto overflow-x-hidden">
                {scanRoots.map((root) => (
                  <ScanRootRow
                    key={root.path}
                    root={root}
                    onToggle={(enabled) =>
                      setScanRootEnabled(root.path, enabled)
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Platform Patterns */}
          <div className="min-w-0 overflow-x-hidden">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">
              {t("discover.lookingFor")}
            </h3>
            <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-x-hidden">
              {platformPatterns.slice(0, 6).map((p) => (
                <span
                  key={p.name}
                  title={p.pattern}
                  className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                >
                  {p.pattern}
                </span>
              ))}
              {platformPatterns.length > 6 && (
                <span className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  +{platformPatterns.length - 6}
                </span>
              )}
            </div>
            <div className="mt-2 min-w-0 overflow-x-hidden rounded-md bg-muted/40 px-2.5 py-2">
              <p className="text-xs font-medium text-foreground">
                {t("discover.obsidianPatternsTitle")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("discover.obsidianPatternsDesc")}
              </p>
              <div className="flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-x-hidden mt-1.5">
                {OBSIDIAN_VAULT_PATTERNS.map((pattern) => (
                  <span
                    key={pattern}
                    title={pattern}
                    className="min-w-0 max-w-full break-all whitespace-normal text-xs px-2 py-0.5 rounded bg-background/70 text-muted-foreground font-mono ring-1 ring-border/60"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Warning if no roots enabled */}
          {enabledCount === 0 && !isLoadingRoots && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-md p-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{t("discover.noRootsEnabled")}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleStartScan}
            disabled={enabledCount === 0}
          >
            <Radar className="size-4 mr-1" />
            {t("discover.startScan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ScanRootRow ──────────────────────────────────────────────────────────────

function ScanRootRow({
  root,
  onToggle,
}: {
  root: ScanRoot;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 overflow-hidden rounded px-2 py-1.5 hover:bg-hover-bg/20 cursor-pointer">
      <Checkbox
        checked={root.enabled}
        onCheckedChange={(checked) => onToggle(!!checked)}
        disabled={!root.exists}
        aria-label={root.path}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <span
          title={root.path}
          className={`block w-full truncate text-sm font-mono ${!root.exists ? "text-muted-foreground line-through" : ""}`}
        >
          {root.path}
        </span>
      </div>
      <span
        title={root.label}
        className="min-w-0 max-w-[38%] shrink truncate text-right text-xs text-muted-foreground"
      >
        {root.label}
      </span>
    </div>
  );
}
