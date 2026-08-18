import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Search, Blocks } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { UnifiedSkillCard } from "@/components/skill/UnifiedSkillCard";
import { SkillDetailDrawer } from "@/components/skill/SkillDetailDrawer";
import { InstallDialog } from "@/components/central/InstallDialog";
import { PlatformIcon } from "@/components/platform/PlatformIcon";
import { useObsidianStore } from "@/stores/obsidianStore";
import { useDiscoverStore } from "@/stores/discoverStore";
import { usePlatformStore } from "@/stores/platformStore";
import { isEnabledInstallTargetAgent } from "@/lib/agents";
import { buildSearchText, normalizeSearchQuery } from "@/lib/search";
import { DiscoveredSkill, SkillWithLinks } from "@/types";

const OBSIDIAN_PLATFORM_ID = "obsidian";

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

export function ObsidianVaultView() {
  const { vaultId } = useParams<{ vaultId: string }>();
  const decodedVaultId = vaultId ? decodeURIComponent(vaultId) : "";
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const detailButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const vaults = useObsidianStore((s) => s.vaults);
  const skillsByVault = useObsidianStore((s) => s.skillsByVault);
  const isLoadingVaults = useObsidianStore((s) => s.isLoadingVaults);
  const loadingSkillsByVault = useObsidianStore((s) => s.loadingSkillsByVault);
  const loadVaults = useObsidianStore((s) => s.loadVaults);
  const getVaultSkills = useObsidianStore((s) => s.getVaultSkills);

  const importToCentral = useDiscoverStore((s) => s.importToCentral);
  const importToPlatform = useDiscoverStore((s) => s.importToPlatform);
  const refreshDiscoverCounts = useDiscoverStore((s) => s.refreshCounts);

  const agents = usePlatformStore((s) => s.agents);
  const refreshCounts = usePlatformStore((s) => s.refreshCounts);

  const [searchQuery, setSearchQuery] = useState("");
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [installTargetSkill, setInstallTargetSkill] = useState<DiscoveredSkill | null>(null);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [drawerSkill, setDrawerSkill] = useState<DiscoveredSkill | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadVaults();
  }, [loadVaults]);

  useEffect(() => {
    if (decodedVaultId) {
      getVaultSkills(decodedVaultId);
    }
  }, [decodedVaultId, getVaultSkills]);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop = 0;
  }, [decodedVaultId, searchQuery]);

  const vault = useMemo(
    () => vaults.find((item) => item.id === decodedVaultId) ?? null,
    [decodedVaultId, vaults]
  );
  const skills = useMemo(
    () => (decodedVaultId ? (skillsByVault[decodedVaultId] ?? []) : []),
    [decodedVaultId, skillsByVault]
  );
  const isLoadingSkills = decodedVaultId ? (loadingSkillsByVault[decodedVaultId] ?? false) : false;
  const normalizedSearch = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);
  const filteredSkills = useMemo(() => {
    if (!normalizedSearch) return skills;
    return skills.filter((skill) =>
      buildSearchText([skill.id, skill.name, skill.description]).includes(normalizedSearch)
    );
  }, [normalizedSearch, skills]);
  const platformAgents = useMemo(
    () => agents.filter(isEnabledInstallTargetAgent),
    [agents]
  );

  function setDetailButtonRef(skillId: string, node: HTMLButtonElement | null) {
    if (node) {
      detailButtonRefs.current[skillId] = node;
      return;
    }
    delete detailButtonRefs.current[skillId];
  }

  const handleInstallToCentral = useCallback(
    async (skillId: string) => {
      setImportingIds((prev) => new Set(prev).add(skillId));
      try {
        await importToCentral(skillId);
        await Promise.all([
          refreshCounts(),
          refreshDiscoverCounts(),
          getVaultSkills(decodedVaultId),
          loadVaults(),
        ]);
        toast.success(t("discover.importSuccess"));
      } catch (err) {
        toast.error(t("discover.importError", { error: String(err) }));
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(skillId);
          return next;
        });
      }
    },
    [decodedVaultId, getVaultSkills, importToCentral, loadVaults, refreshCounts, refreshDiscoverCounts, t]
  );

  const handleInstallFromDialog = useCallback(
    async (_skillId: string, agentIds: string[], method: "symlink" | "copy") => {
      if (!installTargetSkill) return;
      const targetId = installTargetSkill.id;
      setImportingIds((prev) => new Set(prev).add(targetId));
      try {
        for (const agentId of agentIds) {
          await importToPlatform(targetId, agentId, method);
        }
        await Promise.all([refreshCounts(), refreshDiscoverCounts()]);
        toast.success(t("discover.importSuccess"));
      } catch (err) {
        toast.error(t("discover.importError", { error: String(err) }));
      } finally {
        setImportingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        setIsInstallDialogOpen(false);
        setInstallTargetSkill(null);
      }
    },
    [importToPlatform, installTargetSkill, refreshCounts, refreshDiscoverCounts, t]
  );

  if (!decodedVaultId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        {t("platform.notFound")}
      </div>
    );
  }

  const isLoading = isLoadingVaults || isLoadingSkills;
  const title = vault?.name ?? t("sidebar.categoryObsidian");
  const path = vault?.path ?? "";

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <PlatformIcon agentId={OBSIDIAN_PLATFORM_ID} className="size-6 text-primary/70" size={24} />
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        {path && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate" title={path}>
            {path}
          </p>
        )}
      </div>

      <div className="px-6 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("platform.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-muted/40"
          />
        </div>
      </div>

      <div ref={contentRef} className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <EmptyState message={t("platform.loading")} />
        ) : !vault ? (
          <EmptyState message={t("platform.notFound")} />
        ) : skills.length === 0 ? (
          <EmptyState message={t("platform.noSkills", { name: vault.name })} />
        ) : filteredSkills.length === 0 ? (
          <EmptyState message={t("platform.noMatch", { query: searchQuery })} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSkills.map((skill) => (
              <UnifiedSkillCard
                key={skill.id}
                name={skill.name}
                description={skill.description}
                isCentral={skill.is_already_central}
                platformBadge={{ id: skill.platform_id, name: skill.platform_name }}
                projectBadge={skill.project_name}
                onDetail={() => {
                  setDrawerSkill(skill);
                  setIsDrawerOpen(true);
                }}
                detailButtonRef={(node) => setDetailButtonRef(skill.id, node)}
                onInstallToCentral={() => handleInstallToCentral(skill.id)}
                onInstallToPlatform={() => {
                  setInstallTargetSkill(skill);
                  setIsInstallDialogOpen(true);
                }}
                isLoading={importingIds.has(skill.id)}
              />
            ))}
          </div>
        )}
      </div>

      {installTargetSkill && (
        <InstallDialog
          open={isInstallDialogOpen}
          onOpenChange={(open) => {
            setIsInstallDialogOpen(open);
            if (!open) setInstallTargetSkill(null);
          }}
          skill={{
            id: installTargetSkill.id,
            name: installTargetSkill.name,
            description: installTargetSkill.description,
            file_path: installTargetSkill.file_path,
            is_central: false,
            linked_agents: [],
            scanned_at: new Date().toISOString(),
          } as SkillWithLinks}
          agents={platformAgents}
          onInstall={handleInstallFromDialog}
        />
      )}

      <SkillDetailDrawer
        open={isDrawerOpen}
        skillId={null}
        filePath={drawerSkill?.file_path ?? null}
        discoverMetadata={
          drawerSkill
            ? {
                name: drawerSkill.name,
                description: drawerSkill.description,
                platformName: drawerSkill.platform_name,
                projectName: drawerSkill.project_name,
                filePath: drawerSkill.file_path,
                dirPath: drawerSkill.dir_path,
                isAlreadyCentral: drawerSkill.is_already_central,
              }
            : null
        }
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setDrawerSkill(null);
        }}
        returnFocusRef={
          drawerSkill
            ? {
                current: detailButtonRefs.current[drawerSkill.id] ?? null,
              }
            : undefined
        }
      />
    </div>
  );
}
