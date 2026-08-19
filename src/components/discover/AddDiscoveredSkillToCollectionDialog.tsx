import { useEffect, useMemo, useState } from "react";
import { Layers, Loader2, Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useCollectionStore } from "@/stores/collectionStore";
import { useDiscoverStore } from "@/stores/discoverStore";
import { Collection, DiscoveredSkill } from "@/types";
import { isTauriRuntime } from "@/lib/tauri";
import { CollectionEditor } from "@/components/collection/CollectionEditor";

// ─── AddDiscoveredSkillToCollectionDialog ─────────────────────────────────────
//
// Adds discovered (project) skill(s) into one or more collections without
// copying to the central library. Supports both single-skill and batch modes.

interface AddDiscoveredSkillToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single discovered skill (for individual card action). */
  skill?: DiscoveredSkill | null;
  /** Multiple discovered skills (for batch selection action). */
  skills?: DiscoveredSkill[];
  /** Called after a successful add so the parent can refresh counts and state. */
  onComplete?: () => void;
}

export function AddDiscoveredSkillToCollectionDialog({
  open,
  onOpenChange,
  skill,
  skills,
  onComplete,
}: AddDiscoveredSkillToCollectionDialogProps) {
  const { t } = useTranslation();

  const collections = useCollectionStore((s) => s.collections);
  const isLoadingCollections = useCollectionStore((s) => s.isLoading);
  const loadCollections = useCollectionStore((s) => s.loadCollections);
  const batchAddDiscoveredSkillsToCollections = useDiscoverStore(
    (s) => s.batchAddDiscoveredSkillsToCollections
  );

  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [lastClickedCollectionId, setLastClickedCollectionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Normalize target skills list
  const targetSkills = useMemo(() => {
    if (skills && skills.length > 0) return skills;
    if (skill) return [skill];
    return [];
  }, [skill, skills]);

  const isBatch = targetSkills.length > 1;

  // Load collections when dialog opens and reset selections
  useEffect(() => {
    if (!open) return;
    loadCollections();
    setSelectedCollectionIds(new Set());
    setLastClickedCollectionId(null);
    setExecutionError(null);
  }, [open, loadCollections]);

  function handleToggleCollection(collectionId: string, event?: React.MouseEvent) {
    if (event?.shiftKey && lastClickedCollectionId) {
      const lastIdx = collections.findIndex((c) => c.id === lastClickedCollectionId);
      const currentIdx = collections.findIndex((c) => c.id === collectionId);
      if (lastIdx !== -1 && currentIdx !== -1) {
        const start = Math.min(lastIdx, currentIdx);
        const end = Math.max(lastIdx, currentIdx);
        const rangeIds = collections.slice(start, end + 1).map((c) => c.id);
        setSelectedCollectionIds((prev) => {
          const next = new Set(prev);
          for (const id of rangeIds) {
            next.add(id);
          }
          return next;
        });
        return;
      }
    }

    setLastClickedCollectionId(collectionId);
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) next.delete(collectionId);
      else next.add(collectionId);
      return next;
    });
  }

  async function handleExecute() {
    if (selectedCollectionIds.size === 0 || targetSkills.length === 0) return;
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const colIds = Array.from(selectedCollectionIds);
      const skillIds = targetSkills.map((s) => s.id);
      await batchAddDiscoveredSkillsToCollections(colIds, skillIds);

      if (isBatch) {
        toast.success(
          t("discover.batchAddCollectionSuccess", {
            count: targetSkills.length,
            defaultValue: `已将 ${targetSkills.length} 个技能加入技能集`,
          })
        );
      } else {
        const colNames = colIds
          .map((id) => collections.find((c) => c.id === id)?.name ?? id)
          .join(", ");
        toast.success(
          t("discover.addCollectionSuccess", {
            skill: targetSkills[0].name,
            collection: colNames,
          })
        );
      }

      onComplete?.();
      onOpenChange(false);
    } catch (err) {
      setExecutionError(String(err));
    } finally {
      setIsExecuting(false);
    }
  }

  const desktopOnly = !isTauriRuntime();
  const canExecute = selectedCollectionIds.size > 0 && targetSkills.length > 0 && !desktopOnly;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="min-w-0 overflow-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="size-5" />
              {isBatch
                ? t("discover.batchAddCollectionTitle", { defaultValue: "批量加入技能集" })
                : t("discover.addCollection")}
            </DialogTitle>
            <DialogDescription>
              {isBatch
                ? t("discover.batchAddCollectionDesc", {
                    count: targetSkills.length,
                    defaultValue: `将选中的 ${targetSkills.length} 个技能加入技能集`,
                  })
                : t("discover.addCollectionDesc", {
                    skill: targetSkills[0]?.name ?? "",
                    defaultValue: `将「${targetSkills[0]?.name ?? ""}」加入技能集`,
                  })}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {desktopOnly ? (
              <p className="text-sm text-muted-foreground">
                {t("discover.copyDesktopOnly")}
              </p>
            ) : isLoadingCollections ? (
              <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin" />
                {t("common.loading")}
              </div>
            ) : collections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("collectionPicker.noCollections")}
              </p>
            ) : (
              <div
                className="max-h-60 overflow-y-auto space-y-1 rounded-md border border-border/60 p-2"
                role="group"
                aria-label={t("collectionPicker.selectCollections")}
              >
                {collections.map((collection: Collection) => {
                  const isChecked = selectedCollectionIds.has(collection.id);
                  return (
                    <div
                      key={collection.id}
                      className="flex items-start gap-2.5 px-2 py-1.5 rounded hover:bg-hover-bg/20 cursor-pointer select-none"
                      onClick={(e) => handleToggleCollection(collection.id, e)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCollection(collection.id, e);
                        }}
                        aria-label={collection.name}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{collection.name}</div>
                        {collection.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {collection.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create new collection button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setIsCreateOpen(true)}
              disabled={isExecuting}
            >
              <Plus className="size-3.5" />
              {t("collectionPicker.createNew")}
            </Button>

            {executionError && (
              <p className="text-xs text-destructive" role="alert">
                {executionError}
              </p>
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
                  {t("discover.addCollectionExecuting")}
                </>
              ) : selectedCollectionIds.size > 0 ? (
                <>
                  <Layers className="size-4 mr-1" />
                  {t("collectionPicker.addCount", { count: selectedCollectionIds.size })}
                </>
              ) : (
                <>
                  <Layers className="size-4 mr-1" />
                  {t("discover.addCollectionExecute")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create collection dialog */}
      <CollectionEditor
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) loadCollections();
        }}
        collection={null}
      />
    </>
  );
}