import { useEffect, useMemo, useState } from "react";
import { CopyPlus, Folder, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { useDiscoverStore } from "@/stores/discoverStore";
import { CopyProjectSkillsPlan, DiscoveredProject } from "@/types";
import { isTauriRuntime } from "@/lib/tauri";
import { cn } from "@/lib/utils";

// ─── CopySkillsDialog ──────────────────────────────────────────────────────────
//
// Copies all discovered skills of the current project into another discovered
// project. The backend previews the plan (which target locations already exist),
// the user picks how to handle conflicts (overwrite / skip), then the copy runs.

interface CopySkillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The project whose skills are being copied. */
  sourceProject: DiscoveredProject;
  /** All discovered projects, including the source. The source is excluded for selection. */
  projects: DiscoveredProject[];
  /** Called after a successful copy so the parent can refresh counts. */
  onComplete?: () => void;
}

export function CopySkillsDialog({
  open,
  onOpenChange,
  sourceProject,
  projects,
  onComplete,
}: CopySkillsDialogProps) {
  const { t } = useTranslation();

  const previewCopyProjectSkills = useDiscoverStore(
    (s) => s.previewCopyProjectSkills
  );
  const executeCopyProjectSkills = useDiscoverStore(
    (s) => s.executeCopyProjectSkills
  );

  const targetCandidates = useMemo(
    () => projects.filter((p) => p.project_path !== sourceProject.project_path),
    [projects, sourceProject.project_path]
  );

  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [plan, setPlan] = useState<CopyProjectSkillsPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Reset transient state whenever the dialog (re)opens.
  useEffect(() => {
    if (!open) return;
    setTargetPath(
      targetCandidates[0] ? targetCandidates[0].project_path : null
    );
    setPlan(null);
    setPlanError(null);
    setExecutionError(null);
    setOverwrite(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load the copy plan whenever the target changes.
  useEffect(() => {
    if (!open || !targetPath || !isTauriRuntime()) return;
    let cancelled = false;
    setIsLoadingPlan(true);
    setPlan(null);
    setPlanError(null);
    previewCopyProjectSkills(sourceProject.project_path, targetPath)
      .then((result) => {
        if (cancelled) return;
        setPlan(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setPlanError(String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPlan(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, targetPath, sourceProject.project_path, previewCopyProjectSkills]);

  const conflictItems = useMemo(
    () => (plan ? plan.skills.filter((s) => s.conflict) : []),
    [plan]
  );

  async function handleExecute() {
    if (!targetPath) return;
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const result = await executeCopyProjectSkills(
        sourceProject.project_path,
        targetPath,
        overwrite
      );
      toast.success(
        t("discover.copySuccess", {
          copied: result.copied,
          overwritten: result.overwritten,
        })
      );
      onComplete?.();
    } catch (err) {
      setExecutionError(String(err));
    } finally {
      setIsExecuting(false);
    }
  }

  const desktopOnly = !isTauriRuntime();
  const canExecute =
    !!plan && plan.total_count > 0 && !isLoadingPlan && !desktopOnly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-0 overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CopyPlus className="size-5" />
            {t("discover.copyToProject")}
          </DialogTitle>
          <DialogDescription>
            {t("discover.copyToProjectDesc", {
              source: sourceProject.project_name,
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {desktopOnly ? (
            <p className="text-sm text-muted-foreground">
              {t("discover.copyDesktopOnly")}
            </p>
          ) : targetCandidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("discover.copyNoTargets")}
            </p>
          ) : (
            <>
              {/* Target project selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("discover.copySelectTarget")}
                </p>
                <RadioGroup
                  value={targetPath ?? ""}
                  onValueChange={(value) =>
                    setTargetPath(typeof value === "string" ? value : null)
                  }
                  className="max-h-44 overflow-y-auto rounded-md border border-border/60 p-1.5"
                >
                  {targetCandidates.map((project) => (
                    <label
                      key={project.project_path}
                      className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-hover-bg/20"
                      title={project.project_path}
                    >
                      <RadioItem value={project.project_path} />
                      <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">
                          {project.project_name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground font-mono">
                          {project.project_path}
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                        {project.skills.length}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Plan */}
              {isLoadingPlan ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 justify-center">
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("common.loading")}</span>
                </div>
              ) : planError ? (
                <p className="text-xs text-destructive" role="alert">
                  {planError}
                </p>
              ) : plan ? (
                <>
                  {plan.total_count === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("discover.copyNoSkills")}
                    </p>
                  ) : (
                    <>
                      <div
                        className={cn(
                          "rounded-md px-2.5 py-2 text-xs",
                          plan.conflict_count > 0
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        <p>
                          {t("discover.copyPlanSummary", {
                            total: plan.total_count,
                            target: plan.target_project_name,
                          })}
                        </p>
                        {plan.conflict_count > 0 && (
                          <p className="mt-0.5">
                            {t("discover.copyConflictSummary", {
                              conflicts: plan.conflict_count,
                            })}
                          </p>
                        )}
                      </div>

                      {conflictItems.length > 0 && (
                        <div className="space-y-2">
                          <div className="max-h-36 overflow-y-auto space-y-1 rounded-md border border-border/60 p-2">
                            {conflictItems.map((item) => (
                              <div
                                key={item.relative_path}
                                className="flex items-start gap-1.5 text-xs"
                              >
                                <TriangleAlert className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                                <div className="min-w-0">
                                  <span className="font-medium break-all">
                                    {item.dir_name}
                                  </span>
                                  <span className="text-muted-foreground block truncate font-mono">
                                    {item.relative_path}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t("discover.copyConflictMode")}
                            </p>
                            <RadioGroup
                              value={overwrite ? "overwrite" : "skip"}
                              onValueChange={(value) =>
                                setOverwrite(value === "overwrite")
                              }
                            >
                              <label className="flex items-center gap-2.5 cursor-pointer">
                                <RadioItem value="skip" />
                                <span className="text-sm">
                                  {t("discover.copyModeSkip")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("discover.copyModeSkipDesc")}
                                </span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer">
                                <RadioItem value="overwrite" />
                                <span className="text-sm">
                                  {t("discover.copyModeOverwrite")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t("discover.copyModeOverwriteDesc")}
                                </span>
                              </label>
                            </RadioGroup>
                          </div>
                        </div>
                      )}
                      {executionError && (
                        <p
                          className="text-xs text-destructive"
                          role="alert"
                        >
                          {executionError}
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExecuting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleExecute}
            disabled={!canExecute || isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                {t("discover.copyExecuting")}
              </>
            ) : (
              <>
                <CopyPlus className="size-4 mr-1" />
                {t("discover.copyExecute")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}