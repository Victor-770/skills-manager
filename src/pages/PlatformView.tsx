import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Search, Blocks, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { usePlatformStore } from "@/stores/platformStore";
import { useSkillStore } from "@/stores/skillStore";
import { useCentralSkillsStore } from "@/stores/centralSkillsStore";
import { Input } from "@/components/ui/input";
import { UnifiedSkillCard } from "@/components/skill/UnifiedSkillCard";
import { SkillDetailDrawer } from "@/components/skill/SkillDetailDrawer";
import {
  SkillFolderDrawer,
  type SkillFolderDrawerSkill,
} from "@/components/skill/SkillFolderDrawer";
import { SkillFolderCard } from "@/components/skill/SkillFolderCard";
import { SkillListModeToggle } from "@/components/skill/SkillListModeToggle";
import { PlatformIcon } from "@/components/platform/PlatformIcon";
import { InstallDialog } from "@/components/central/InstallDialog";
import { useSkillListViewMode } from "@/hooks/useSkillListViewMode";
import { formatPathForDisplay } from "@/lib/path";
import { splitSkillsByTopLevel } from "@/lib/skillFolders";
import { cn } from "@/lib/utils";
import { ScannedSkill, SkillWithLinks } from "@/types";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
      <div className="p-4 rounded-full bg-muted/60">
        <Blocks className="size-12 text-muted-foreground opacity-60" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

type ClaudeSourceFilter = "all" | "user" | "plugin";

// ─── PlatformView ─────────────────────────────────────────────────────────────

export function PlatformView() {
  const { agentId } = useParams<{ agentId: string }>();
  const { t, i18n } = useTranslation();
  const agents = usePlatformStore((state) => state.agents);
  const scanGeneration = usePlatformStore((state) => state.scanGeneration ?? 0);

  const skillsByAgent = useSkillStore((state) => state.skillsByAgent);
  const loadingByAgent = useSkillStore((state) => state.loadingByAgent);
  const pendingSkillActionKeys = useSkillStore((state) => state.pendingSkillActionKeys);
  const getSkillsByAgent = useSkillStore((state) => state.getSkillsByAgent);
  const uninstallSkillFromAgent = useSkillStore((state) => state.uninstallSkillFromAgent);

  const centralSkills = useCentralSkillsStore((state) => state.skills);
  const centralAgents = useCentralSkillsStore((state) => state.agents);
  const loadCentralSkills = useCentralSkillsStore((state) => state.loadCentralSkills);
  const installSkill = useCentralSkillsStore((state) => state.installSkill);
  const refreshCounts = usePlatformStore((state) => state.refreshCounts);

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ClaudeSourceFilter>("all");
  const [viewMode, setViewMode] = useSkillListViewMode("platform");
  const [installTargetSkill, setInstallTargetSkill] = useState<SkillWithLinks | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [drawerSkill, setDrawerSkill] = useState<ScannedSkill | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [folderDrawerGroupPath, setFolderDrawerGroupPath] = useState<string | null>(null);
  const [isFolderDrawerOpen, setIsFolderDrawerOpen] = useState(false);
  const [returnFocusRowKey, setReturnFocusRowKey] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const detailButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function getSkillRowKey(skill: ScannedSkill) {
    return skill.row_id ?? skill.id;
  }

  const agent = agents.find((a) => a.id === agentId);
  const isClaudePage = agent?.id === "claude-code";

  // Load skills for this agent when the route changes or a fresh scan completes.
  useEffect(() => {
    if (agentId) {
      getSkillsByAgent(agentId);
    }
  }, [agentId, getSkillsByAgent, scanGeneration]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop = 0;
  }, [agentId]);

  useEffect(() => {
    setSourceFilter("all");
  }, [agentId]);

  // Ensure central skills are loaded so we can resolve SkillWithLinks for InstallDialog.
  useEffect(() => {
    if (centralSkills.length === 0) {
      loadCentralSkills();
    }
  }, [centralSkills.length, loadCentralSkills]);

  function handleInstallClick(skillId: string) {
    const target = centralSkills.find((s) => s.id === skillId);
    if (!target) {
      toast.error(t("central.installError", { error: t("platform.notFound") }));
      return;
    }
    setInstallTargetSkill(target);
    setIsDialogOpen(true);
  }

  async function handleInstall(skillId: string, agentIds: string[], method: string) {
    try {
      const result = await installSkill(skillId, agentIds, method);
      await refreshCounts();
      if (agentId) {
        await getSkillsByAgent(agentId);
      }
      if (result.failed.length > 0) {
        const failedNames = result.failed.map((f) => f.agent_id).join(", ");
        toast.error(t("central.installPartialFail", { platforms: failedNames }));
      }
    } catch (err) {
      toast.error(t("central.installError", { error: String(err) }));
    }
  }

  async function handleUninstall(skillId: string) {
    if (!agentId) return;
    try {
      await uninstallSkillFromAgent(skillId, agentId);
      await refreshCounts();
    } catch (err) {
      toast.error(t("detail.uninstallError", { error: String(err) }));
    }
  }

  const isLoading = agentId ? (loadingByAgent[agentId] ?? false) : false;

  // Memoize skills to avoid changing dependency reference on every render
  const skills = useMemo(
    () => (agentId ? (skillsByAgent[agentId] ?? []) : []),
    [agentId, skillsByAgent]
  );

  const sourceFilteredSkills = useMemo(() => {
    if (!isClaudePage || sourceFilter === "all") {
      return skills;
    }
    return skills.filter((skill) => skill.source_kind === sourceFilter);
  }, [isClaudePage, skills, sourceFilter]);

  const platformFolderSplit = useMemo(
    () =>
      splitSkillsByTopLevel({
        skills: sourceFilteredSkills,
        rootPath: agent?.global_skills_dir ?? "",
        getDirPaths: (skill) => skill.dir_path,
      }),
    [agent?.global_skills_dir, sourceFilteredSkills]
  );
  const platformFolderGroupsByPath = useMemo(
    () =>
      new Map(
        platformFolderSplit.groups.map((group) => [
          group.relativePath,
          group,
        ])
      ),
    [platformFolderSplit.groups]
  );
  const visibleSkills =
    viewMode === "folders" ? platformFolderSplit.rootSkills : sourceFilteredSkills;

  const sourceCounts = useMemo(() => {
    const counts: Record<ClaudeSourceFilter, number> = {
      all: skills.length,
      user: 0,
      plugin: 0,
    };

    for (const skill of skills) {
      if (skill.source_kind === "user") {
        counts.user += 1;
      } else if (skill.source_kind === "plugin") {
        counts.plugin += 1;
      }
    }

    return counts;
  }, [skills]);

  // Filter skills by search query using useMemo
  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return visibleSkills;
    const q = searchQuery.toLowerCase();
    return visibleSkills.filter(
      (skill) =>
        skill.id.toLowerCase().includes(q) ||
        skill.name.toLowerCase().includes(q) ||
        skill.description?.toLowerCase().includes(q)
    );
  }, [visibleSkills, searchQuery]);

  const filteredFolderGroups = useMemo(() => {
    if (viewMode !== "folders") return [];
    if (!searchQuery.trim()) return platformFolderSplit.groups;
    const q = searchQuery.toLowerCase();
    return platformFolderSplit.groups.filter(
      (group) =>
        group.name.toLowerCase().includes(q) ||
        group.path.toLowerCase().includes(q) ||
        group.skills.some(
          (skill) =>
            skill.id.toLowerCase().includes(q) ||
            skill.name.toLowerCase().includes(q) ||
            skill.description?.toLowerCase().includes(q)
        )
    );
  }, [platformFolderSplit.groups, searchQuery, viewMode]);

  useEffect(() => {
    if (!drawerSkill) return;

    const rowKey = getSkillRowKey(drawerSkill);
    const refreshedSkill = skills.find((skill) => getSkillRowKey(skill) === rowKey);

    if (!refreshedSkill) {
      setIsDrawerOpen(false);
      setDrawerSkill(null);
      return;
    }

    if (refreshedSkill !== drawerSkill) {
      setDrawerSkill(refreshedSkill);
    }
  }, [drawerSkill, skills]);

  function setDetailButtonRef(rowKey: string, node: HTMLButtonElement | null) {
    if (node) {
      detailButtonRefs.current[rowKey] = node;
      return;
    }
    delete detailButtonRefs.current[rowKey];
  }

  function handleOpenDrawer(skill: ScannedSkill) {
    setReturnFocusRowKey(getSkillRowKey(skill));
    setDrawerSkill(skill);
    setIsDrawerOpen(true);
  }

  function handleOpenFolderDrawer(relativePath: string) {
    setFolderDrawerGroupPath(relativePath);
    setIsFolderDrawerOpen(true);
  }

  const folderDrawerGroup = folderDrawerGroupPath
    ? platformFolderGroupsByPath.get(folderDrawerGroupPath)
    : null;
  const folderDrawerSkills = useMemo<SkillFolderDrawerSkill[]>(
    () =>
      (folderDrawerGroup?.skills ?? []).map((skill) => ({
        key: getSkillRowKey(skill),
        id: skill.id,
        name: skill.name,
        description: skill.description,
        path: skill.dir_path,
        relativePath: skill.dir_path.replace(`${folderDrawerGroup?.path ?? ""}/`, ""),
        agentId,
        rowId: skill.row_id ?? null,
        sourceLabel:
          skill.source_kind === "user"
            ? t("platform.originUser")
            : skill.source_kind === "plugin"
              ? t("platform.originPlugin")
              : skill.link_type,
        isReadOnly: skill.is_read_only ?? false,
      })),
    [agentId, folderDrawerGroup, t]
  );

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t("platform.notFound")}
      </div>
    );
  }

  const sourceTabs: { id: ClaudeSourceFilter; label: string; count: number }[] = [
    {
      id: "all",
      label: t("platform.sourceFilter.all", {
        defaultValue: i18n.language.startsWith("zh") ? "全部" : "All",
      }),
      count: sourceCounts.all,
    },
    {
      id: "user",
      label: t("platform.sourceFilter.user", {
        defaultValue: i18n.language.startsWith("zh") ? "用户来源" : "User source",
      }),
      count: sourceCounts.user,
    },
    {
      id: "plugin",
      label: t("platform.sourceFilter.plugin", {
        defaultValue: i18n.language.startsWith("zh") ? "插件来源" : "Plugin source",
      }),
      count: sourceCounts.plugin,
    },
  ];
  const activeSourceLabel = sourceTabs.find((tab) => tab.id === sourceFilter)?.label ?? sourceTabs[0].label;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <PlatformIcon agentId={agent.id} className="size-6 text-primary/70" size={24} />
          <h1 className="text-xl font-semibold">{agent.display_name}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatPathForDisplay(agent.global_skills_dir)}
        </p>
      </div>

      {isClaudePage && (
        <div
          role="tablist"
          aria-label={t("platform.sourceFilterTabsLabel", {
            defaultValue: i18n.language.startsWith("zh") ? "Claude 来源筛选" : "Claude source filters",
          })}
          className="flex items-center gap-1 px-6 py-3 border-b border-border"
        >
          {sourceTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={sourceFilter === tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                sourceFilter === tab.id
                  ? "bg-primary/15 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/40"
              )}
            >
              <span>{tab.label}</span>
              <span className="text-xs opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("platform.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-muted/40"
            />
          </div>
          <SkillListModeToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <EmptyState message={t("platform.loading")} />
        ) : skills.length === 0 ? (
          <EmptyState
            message={t("platform.noSkills", { name: agent.display_name })}
          />
        ) : sourceFilteredSkills.length === 0 ? (
          <EmptyState
            message={t("platform.noSourceSkills", {
              name: agent.display_name,
              source: activeSourceLabel,
              defaultValue: i18n.language.startsWith("zh")
                ? `${agent.display_name} 下暂无${activeSourceLabel}技能`
                : `No ${activeSourceLabel} skills installed for ${agent.display_name}`,
            })}
          />
        ) : filteredSkills.length === 0 && filteredFolderGroups.length === 0 ? (
          <EmptyState
            message={t("platform.noMatch", { query: searchQuery })}
          />
        ) : (
          <div className="space-y-6">
            {viewMode === "folders" && filteredFolderGroups.length > 0 && (
              <section className="space-y-3" aria-label={t("skillFolder.foldersTitle")}>
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">{t("skillFolder.foldersTitle")}</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredFolderGroups.map((group) => (
                    <SkillFolderCard
                      key={group.relativePath}
                      name={group.name}
                      path={group.path}
                      skillCount={group.skillCount}
                      previewNames={group.skills.map((skill) => skill.name)}
                      onOpen={() => handleOpenFolderDrawer(group.relativePath)}
                    />
                  ))}
                </div>
              </section>
            )}

            {filteredSkills.length > 0 && (
              <section className="space-y-3">
                {viewMode === "folders" && (
                  <div className="flex items-center gap-2">
                    <Blocks className="size-4 text-primary" />
                    <h2 className="text-sm font-semibold">{t("skillFolder.topLevelSkills")}</h2>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredSkills.map((skill) => (
                    <UnifiedSkillCard
                      key={getSkillRowKey(skill)}
                      name={skill.name}
                      description={skill.description}
                      sourceType={skill.link_type as "symlink" | "copy" | "native"}
                      originKind={skill.source_kind ?? null}
                      isReadOnly={skill.is_read_only ?? false}
                      isLoading={
                        agentId
                          ? (pendingSkillActionKeys[`${agentId}::${skill.id}`] ?? false)
                          : false
                      }
                      onDetail={() => handleOpenDrawer(skill)}
                      onInstallTo={
                        skill.is_read_only
                          ? undefined
                          : () => handleInstallClick(skill.id)
                      }
                      onUninstallFromPlatform={
                        skill.is_read_only
                          ? undefined
                          : () => handleUninstall(skill.id)
                      }
                      uninstallFromLabel={t("platform.uninstallFromLabel", {
                        skill: skill.name,
                        platform: agent.display_name,
                        defaultValue: i18n.language.startsWith("zh")
                          ? `从 ${agent.display_name} 卸载 ${skill.name}`
                          : `Uninstall ${skill.name} from ${agent.display_name}`,
                      })}
                      detailButtonRef={(node) => setDetailButtonRef(getSkillRowKey(skill), node)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Install Dialog */}
      <InstallDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        skill={installTargetSkill}
        agents={centralAgents}
        onInstall={handleInstall}
      />

      <SkillDetailDrawer
        open={isDrawerOpen}
        skillId={drawerSkill?.id ?? null}
        agentId={agentId ?? null}
        rowId={drawerSkill?.row_id ?? null}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setDrawerSkill(null);
          }
        }}
        returnFocusRef={
          returnFocusRowKey
            ? {
                current: detailButtonRefs.current[returnFocusRowKey] ?? null,
              }
            : undefined
        }
      />

      <SkillFolderDrawer
        open={isFolderDrawerOpen}
        title={folderDrawerGroup?.name ?? folderDrawerGroupPath ?? t("skillFolder.foldersTitle")}
        path={folderDrawerGroup?.path}
        skills={folderDrawerSkills}
        loading={false}
        onOpenChange={(open) => {
          setIsFolderDrawerOpen(open);
          if (!open) {
            setFolderDrawerGroupPath(null);
          }
        }}
        onInstallationsChange={async () => {
          await Promise.all([
            refreshCounts(),
            agentId ? getSkillsByAgent(agentId) : Promise.resolve(),
          ]);
        }}
      />
    </div>
  );
}
