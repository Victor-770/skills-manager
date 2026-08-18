import { ReactNode, useEffect, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { FolderOpen, Link2, Search, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformIcon } from "@/components/platform/PlatformIcon";
import { SkillDetailView } from "@/components/skill/SkillDetailView";
import type { AgentWithStatus } from "@/types";
import { buildSearchText, normalizeSearchQuery } from "@/lib/search";
import { formatPathForDisplay } from "@/lib/path";
import { cn } from "@/lib/utils";

export interface SkillFolderDrawerSkill {
  key: string;
  id: string;
  name: string;
  description?: string;
  path?: string;
  relativePath?: string;
  agentId?: string | null;
  rowId?: string | null;
  linkedAgentIds?: string[];
  readOnlyAgentIds?: string[];
  sourceLabel?: string;
  isReadOnly?: boolean;
}

interface SkillFolderDrawerProps {
  open: boolean;
  title: string;
  path?: string;
  isSymlink?: boolean;
  skills: SkillFolderDrawerSkill[];
  agents?: AgentWithStatus[];
  loading?: boolean;
  meta?: ReactNode;
  onOpenChange: (open: boolean) => void;
  onInstallationsChange?: () => void | Promise<void>;
}

export function SkillFolderDrawer({
  open,
  title,
  path,
  isSymlink = false,
  skills,
  agents = [],
  loading = false,
  meta,
  onOpenChange,
  onInstallationsChange,
}: SkillFolderDrawerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const titleId = "skill-folder-drawer-title";

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedKey((current) =>
      current && skills.some((skill) => skill.key === current)
        ? current
        : (skills[0]?.key ?? null)
    );
  }, [open, skills]);

  const normalizedQuery = normalizeSearchQuery(query);
  const filteredSkills = useMemo(() => {
    if (!normalizedQuery) return skills;
    return skills.filter((skill) =>
      buildSearchText([skill.name, skill.description, skill.path, skill.relativePath]).includes(
        normalizedQuery
      )
    );
  }, [normalizedQuery, skills]);
  const selectedSkill =
    skills.find((skill) => skill.key === selectedKey) ?? filteredSkills[0] ?? skills[0] ?? null;
  const linkedAgentNamesById = new Map(agents.map((agent) => [agent.id, agent.display_name]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal keepMounted={false}>
        <DialogOverlay className="bg-black/20" />
        <DialogPrimitive.Popup
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-screen flex-col bg-background shadow-2xl ring-1 ring-border outline-none",
            "md:w-[min(1120px,94vw)]"
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderOpen className="size-4 shrink-0 text-primary" />
                    <DialogTitle id={titleId} className="truncate">
                      {title}
                    </DialogTitle>
                    {isSymlink && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Link2 className="size-3" />
                        {t("central.bundleSymlink")}
                      </span>
                    )}
                  </div>
                  <DialogDescription className="truncate text-xs">
                    {path ? formatPathForDisplay(path) : t("centralBundleDrawer.loading")}
                  </DialogDescription>
                </div>
                <DialogClose
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("common.close")}
                    />
                  }
                >
                  <XIcon />
                </DialogClose>
              </div>
              {meta && <div className="mt-3">{meta}</div>}
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
                <div className="shrink-0 space-y-3 p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={t("skillFolder.searchPlaceholder")}
                      className="h-9 bg-muted/40 pl-8"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("skillFolder.skillCount", { count: skills.length })}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-0">
                  {loading ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      {t("centralBundleDrawer.loading")}
                    </div>
                  ) : filteredSkills.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      {t("skillFolder.noSkills")}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSkills.map((skill) => {
                        const linkedIds = skill.linkedAgentIds ?? [];
                        const readOnlyIds = skill.readOnlyAgentIds ?? [];
                        const platformIds = [...linkedIds, ...readOnlyIds];
                        const isSelected = selectedSkill?.key === skill.key;

                        return (
                          <button
                            key={skill.key}
                            type="button"
                            onClick={() => setSelectedKey(skill.key)}
                            className={cn(
                              "w-full rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                              isSelected
                                ? "border-primary/35 bg-primary/5"
                                : "border-border bg-card hover:bg-accent/30"
                            )}
                            aria-label={t("skillFolder.viewSkillLabel", { name: skill.name })}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{skill.name}</div>
                                {skill.description && (
                                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                    {skill.description}
                                  </div>
                                )}
                              </div>
                              {skill.isReadOnly && (
                                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {t("platform.readOnly")}
                                </span>
                              )}
                            </div>
                            {(skill.relativePath || skill.path) && (
                              <div className="mt-2 truncate font-mono text-[11px] text-muted-foreground">
                                {skill.relativePath ?? formatPathForDisplay(skill.path ?? "")}
                              </div>
                            )}
                            {platformIds.length > 0 ? (
                              <div className="mt-2 flex flex-wrap items-center gap-1">
                                {platformIds.slice(0, 8).map((agentId) => (
                                  <span
                                    key={`${skill.key}-${agentId}`}
                                    title={linkedAgentNamesById.get(agentId) ?? agentId}
                                    className="inline-flex size-5 items-center justify-center rounded-md bg-muted"
                                  >
                                    <PlatformIcon
                                      agentId={agentId}
                                      size={14}
                                      className={cn(
                                        "size-3.5",
                                        readOnlyIds.includes(agentId)
                                          ? "text-muted-foreground/50"
                                          : "text-primary"
                                      )}
                                    />
                                  </span>
                                ))}
                                {platformIds.length > 8 && (
                                  <span className="text-[11px] text-muted-foreground">
                                    +{platformIds.length - 8}
                                  </span>
                                )}
                              </div>
                            ) : skill.sourceLabel ? (
                              <div className="mt-2 text-[11px] text-muted-foreground">
                                {skill.sourceLabel}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </aside>

              <div className="min-h-0">
                {selectedSkill ? (
                  <SkillDetailView
                    skillId={selectedSkill.id}
                    agentId={selectedSkill.agentId ?? undefined}
                    rowId={selectedSkill.rowId ?? undefined}
                    variant="drawer"
                    leading={null}
                    onInstallationsChange={onInstallationsChange}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                    {t("skillFolder.noSkills")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
