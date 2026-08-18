import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AgentWithStatus, CollectionBatchInstallResult } from "@/types";
import { isInstallTargetAgent } from "@/lib/agents";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CollectionInstallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName: string;
  skillCount: number;
  agents: AgentWithStatus[];
  onInstall: (agentIds: string[]) => Promise<CollectionBatchInstallResult>;
}

// ─── CollectionInstallDialog ──────────────────────────────────────────────────

export function CollectionInstallDialog({
  open,
  onOpenChange,
  collectionName,
  skillCount,
  agents,
  onInstall,
}: CollectionInstallDialogProps) {
  const { t } = useTranslation();
  const targetAgents = agents.filter(isInstallTargetAgent);

  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CollectionBatchInstallResult | null>(null);

  // Reset when dialog opens.
  useEffect(() => {
    if (open) {
      // Default: select all detected agents.
      const initial = new Set<string>(
        targetAgents.filter((a) => a.is_detected).map((a) => a.id)
      );
      setSelectedAgentIds(initial);
      setError(null);
      setResult(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleToggle(agentId: string, checked: boolean) {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(agentId);
      else next.delete(agentId);
      return next;
    });
  }

  async function handleInstall() {
    const agentIds = Array.from(selectedAgentIds);
    if (agentIds.length === 0) {
      setError(t("batchInstall.selectPlatform"));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const installResult = await onInstall(agentIds);
      setResult(installResult);
      if (installResult.failed.length === 0) {
        // All succeeded — close dialog.
        onOpenChange(false);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("batchInstall.title", { name: collectionName })}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <DialogBody className="space-y-5">
          <DialogDescription>
            {t("batchInstall.desc", { count: skillCount })}
          </DialogDescription>

          {/* Platform checkboxes */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2" role="group" aria-label={t("batchInstall.selectPlatforms")}>
            {targetAgents.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground">
                {t("batchInstall.noPlatforms")}
              </p>
            ) : (
              targetAgents.map((agent) => {
                const isChecked = selectedAgentIds.has(agent.id);
                return (
                  <div key={agent.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleToggle(agent.id, !!checked)
                      }
                      aria-label={agent.display_name}
                    />
                    <span
                      className="text-sm text-foreground flex-1 cursor-pointer select-none truncate"
                      onClick={() => handleToggle(agent.id, !isChecked)}
                    >
                      {agent.display_name}
                    </span>
                    {!agent.is_detected && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {t("batchInstall.notDetected")}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Result summary if partial failure */}
          {result && result.failed.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t("batchInstall.succeeded", {
                  succeeded: result.succeeded.length,
                  failed: result.failed.length,
                })}
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {result.failed.map((f) => (
                  <li key={f.agent_id} className="text-destructive">
                    {f.agent_id}: {f.error}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-2"
              >
                {t("batchInstall.close")}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </DialogBody>

        {!result && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("batchInstall.cancel")}
            </Button>
            <Button
              onClick={handleInstall}
              disabled={isLoading || selectedAgentIds.size === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("batchInstall.installing")}
                </>
              ) : (
                t("batchInstall.install", { count: selectedAgentIds.size })
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
