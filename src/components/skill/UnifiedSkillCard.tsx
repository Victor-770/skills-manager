import {
  PackagePlus,
  Check,
  Link2,
  FolderOpen,
  Folder,
  Globe,
  ArrowUpRight,
  Plus,
  ChevronRight,
  X,
  Loader2,
  Lock,
  Trash2,
  Layers,
} from "lucide-react";
import type { MouseEventHandler, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineConfirmAction } from "@/components/ui/inline-confirm-action";
import { PlatformIcon } from "@/components/platform/PlatformIcon";
import type { AgentWithStatus, ClaudeSourceKind } from "@/types";
import { cn } from "@/lib/utils";
import { isInstallTargetAgent } from "@/lib/agents";

const FEATURED_CODING_AGENT_IDS = [
  "cursor",
  "trae",
  "claude-code",
  "windsurf",
  "codex",
  "qwen",
];

// ─── Platform Toggle Icon (internal) ──────────────────────────────────────────

function PlatformToggleIcon({
  agent,
  skillName,
  isLinked,
  isReadOnly,
  isToggling,
  onToggle,
}: {
  agent: AgentWithStatus;
  skillName: string;
  isLinked: boolean;
  isReadOnly: boolean;
  isToggling: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors cursor-pointer",
        isLinked
          ? "text-primary hover:bg-primary/10"
          : "text-muted-foreground/40 hover:bg-muted/60 hover:text-muted-foreground",
        isReadOnly && "cursor-default hover:bg-transparent",
        isToggling && "animate-pulse pointer-events-none"
      )}
      title={agent.display_name}
      aria-label={t("central.toggleInstallLabel", { platform: agent.display_name, skill: skillName })}
      aria-pressed={isLinked}
      disabled={isToggling || isReadOnly}
      onClick={onToggle}
    >
      <PlatformIcon
        agentId={agent.id}
        className={cn(
          "size-4 shrink-0 transition-all",
          isLinked ? "opacity-100 grayscale-0" : "opacity-40 grayscale"
        )}
        size={16}
      />
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnifiedSkillCardProps {
  /** Core data — always required. */
  name: string;
  description?: string;
  className?: string;

  /** Click the card itself (platform variant navigates to detail). */
  onClick?: () => void;

  // ── discover variant ──
  checkbox?: { checked: boolean; onChange: (e?: React.MouseEvent) => void };
  isCentral?: boolean;
  platformBadge?: { id: string; name: string };
  projectBadge?: string;

  // ── central variant ──
  platformIcons?: {
    agents: AgentWithStatus[];
    linkedAgents: string[];
    readOnlyAgents?: string[];
    skillId: string;
    onToggle: (skillId: string, agentId: string) => void;
    onManage?: () => void;
    togglingAgentId: string | null;
  };

  // ── platform variant ──
  sourceType?: "symlink" | "copy" | "native";
  originKind?: ClaudeSourceKind | null;
  isReadOnly?: boolean;

  // ── marketplace variant ──
  isInstalled?: boolean;
  tags?: { key: string; label: string }[];
  publisher?: string;

  // ── actions (pass only the ones relevant to the context) ──
  onDetail?: MouseEventHandler<HTMLButtonElement>;
  onInstallTo?: () => void;
  onInstallToCentral?: () => void;
  onInstallToPlatform?: () => void;
  onUninstallFromPlatform?: () => void;
  uninstallFromLabel?: string;
  onDeleteFromCentral?: () => void;
  deleteFromCentralLabel?: string;
  deleteFromCentralRequiresDialog?: boolean;
  /** Discover variant: add this project skill into a collection. */
  onAddToCollection?: () => void;
  addToCollectionLabel?: string;
  /** Discover variant: permanently delete the project skill (Shift+Delete). */
  onPermanentDelete?: () => void;
  permanentDeleteLabel?: string;
  onInstall?: () => void;
  onRemove?: () => void;
  isLoading?: boolean;
  detailButtonRef?: Ref<HTMLButtonElement>;
}

// ─── UnifiedSkillCard ─────────────────────────────────────────────────────────

export function UnifiedSkillCard(props: UnifiedSkillCardProps) {
  const { t } = useTranslation();
  const {
    name,
    description,
    className,
    onClick,
    checkbox,
    isCentral,
    platformBadge,
    projectBadge,
    platformIcons,
    sourceType,
    originKind,
    isReadOnly,
    isInstalled,
    tags,
    publisher,
    onDetail,
    onInstallTo,
    onInstallToCentral,
    onInstallToPlatform,
    onUninstallFromPlatform,
    uninstallFromLabel,
    onDeleteFromCentral,
    deleteFromCentralLabel,
    deleteFromCentralRequiresDialog,
    onAddToCollection,
    addToCollectionLabel,
    onPermanentDelete,
    permanentDeleteLabel,
    onInstall,
    onRemove,
    isLoading,
    detailButtonRef,
  } = props;

  // Determine variant features
  const hasCheckbox = !!checkbox;
  const hasPlatformIcons = !!platformIcons;
  const hasActions = !!(
    onDetail ||
    onInstallTo ||
    onInstallToCentral ||
    onInstallToPlatform ||
    onUninstallFromPlatform ||
    onDeleteFromCentral ||
    onAddToCollection ||
    onPermanentDelete ||
    onInstall ||
    onRemove
  );

  // Show all Lobster platforms, but only the highest-frequency Coding platforms.
  const targetPlatformAgents = platformIcons?.agents.filter(isInstallTargetAgent) ?? [];
  const lobsterAgents = targetPlatformAgents.filter((agent) => agent.category === "lobster");
  const codingAgents = targetPlatformAgents.filter((agent) => agent.category !== "lobster");
  const linkedAgentIds = new Set(platformIcons?.linkedAgents ?? []);
  const readOnlyAgentIds = new Set(platformIcons?.readOnlyAgents ?? []);
  const featuredCodingAgents = FEATURED_CODING_AGENT_IDS
    .map((agentId) => codingAgents.find((agent) => agent.id === agentId))
    .filter((agent): agent is AgentWithStatus => !!agent);
  const featuredCodingAgentIds = new Set(featuredCodingAgents.map((agent) => agent.id));
  const hiddenCodingCount = codingAgents.filter((agent) => !featuredCodingAgentIds.has(agent.id)).length;

  // ── Platform variant: clickable card style ──
  if (onClick && !hasActions && !hasCheckbox && !hasPlatformIcons) {
    return (
      <button
        role="button"
        onClick={onClick}
        className={cn(
          "w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl",
          className
        )}
        aria-label={t("platform.searchSkillLabel", { name })}
      >
        <div className="h-full flex flex-col rounded-xl bg-card ring-1 ring-border shadow-sm p-3 gap-3 transition-all hover:ring-primary/25 hover:bg-accent/30 cursor-pointer">
          <div className="flex flex-1 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-medium text-sm text-foreground truncate">{name}</div>
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
              )}
              {sourceType && <SourceIndicator sourceType={sourceType} />}
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>
        </div>
      </button>
    );
  }

  // ── Default card style (central, discover, marketplace) ──
  return (
    <div
      className={cn(
        "rounded-xl bg-card ring-1 ring-border shadow-sm p-3 flex flex-col transition-colors",
        hasCheckbox && "cursor-pointer select-none",
        checkbox?.checked && "ring-primary/40 bg-primary/5",
        isLoading && "opacity-50",
        className
      )}
      onClick={hasCheckbox ? (e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, [role='button'], [data-ignore-card-click]")) {
          return;
        }
        checkbox.onChange(e);
      } : undefined}
    >
      <div className="flex items-start gap-2.5">
        {/* Optional checkbox (discover) */}
        {hasCheckbox && (
          <div className="pt-0.5">
            <Checkbox
              checked={checkbox.checked}
              onCheckedChange={() => {}}
              onClick={(e) => {
                e.stopPropagation();
                checkbox.onChange(e);
              }}
              aria-label={t("discover.selectSkill")}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Row 1: Name + icon actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Skill name — clickable if onDetail provided */}
            {onDetail ? (
              <button
                ref={detailButtonRef}
                className="font-medium text-sm text-foreground truncate hover:text-primary hover:underline text-left min-w-0 flex-1"
                onClick={onDetail}
                aria-label={t("central.viewDetailsLabel", { name })}
              >
                {name}
              </button>
            ) : (
              <h3 className="text-sm font-medium truncate min-w-0 flex-1">{name}</h3>
            )}

            {/* Icon action buttons */}
            {hasActions && (
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Install To... (central / platform / collection / marketplace) */}
                {onInstallTo && (
                  <button
                    onClick={onInstallTo}
                    disabled={isLoading}
                    title={t("central.installTo")}
                    aria-label={t("central.installLabel", { name })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-default"
                  >
                    <PackagePlus className="size-4" />
                  </button>
                )}

                {/* Install to Central (discover) */}
                {onInstallToCentral && !isCentral && (
                  <button
                    onClick={onInstallToCentral}
                    disabled={isLoading}
                    title={t("discover.installToCentral")}
                    aria-label={t("discover.installToCentral")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-default"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}
                  </button>
                )}

                {/* Install to Platform (discover) */}
                {onInstallToPlatform && (
                  <button
                    onClick={onInstallToPlatform}
                    disabled={isLoading}
                    title={t("discover.installToPlatform")}
                    aria-label={t("discover.installToPlatform")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-default"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  </button>
                )}

                {/* Add to Collection (discover) */}
                {onAddToCollection && (
                  <button
                    onClick={onAddToCollection}
                    disabled={isLoading}
                    title={addToCollectionLabel ?? t("discover.addCollection")}
                    aria-label={addToCollectionLabel ?? t("discover.addCollection")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-default"
                  >
                    <Layers className="size-4" />
                  </button>
                )}

                {onUninstallFromPlatform && (
                  <InlineConfirmAction
                    onConfirm={onUninstallFromPlatform}
                    isLoading={isLoading}
                    idleTitle={uninstallFromLabel ?? t("common.uninstall")}
                    idleAriaLabel={uninstallFromLabel ?? t("common.uninstall")}
                    confirmLabel={t("common.confirmDelete")}
                    icon={<X className="size-4" />}
                  />
                )}

                {onDeleteFromCentral &&
                  (deleteFromCentralRequiresDialog ? (
                    <button
                      onClick={onDeleteFromCentral}
                      disabled={isLoading}
                      title={deleteFromCentralLabel ?? t("common.delete")}
                      aria-label={deleteFromCentralLabel ?? t("common.delete")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-default"
                    >
                      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </button>
                  ) : (
                    <InlineConfirmAction
                      onConfirm={onDeleteFromCentral}
                      isLoading={isLoading}
                      idleTitle={deleteFromCentralLabel ?? t("common.delete")}
                      idleAriaLabel={deleteFromCentralLabel ?? t("common.delete")}
                      confirmLabel={t("common.confirmDelete")}
                      icon={<Trash2 className="size-4" />}
                    />
                  ))}

                {/* Permanent delete (discover) */}
                {onPermanentDelete && (
                  <InlineConfirmAction
                    onConfirm={onPermanentDelete}
                    isLoading={isLoading}
                    idleTitle={permanentDeleteLabel ?? t("discover.permanentDelete")}
                    idleAriaLabel={permanentDeleteLabel ?? t("discover.permanentDelete")}
                    confirmLabel={t("common.confirmDelete")}
                    icon={<Trash2 className="size-4" />}
                  />
                )}

                {/* Marketplace installed indicator (disabled Check icon) */}
                {onInstall && isInstalled && (
                  <button
                    disabled
                    title={t("marketplace.installed")}
                    aria-label={t("marketplace.installed")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary cursor-default"
                  >
                    <Check className="size-4" />
                  </button>
                )}

                {/* Remove (collection) */}
                {onRemove && (
                  <InlineConfirmAction
                    onConfirm={onRemove}
                    isLoading={isLoading}
                    idleTitle={t("collection.removeSkillLabel", { name })}
                    idleAriaLabel={t("collection.removeSkillLabel", { name })}
                    confirmLabel={t("common.confirmDelete")}
                    icon={<X className="size-4" />}
                  />
                )}
              </div>
            )}
          </div>

          {/* Row 2: Description — full width, not compressed by actions */}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          )}

          {/* Row 3: Info badges */}
          <div className="flex flex-wrap items-center gap-1.5 empty:hidden">
            {originKind && <SourceOriginBadge originKind={originKind} />}
            {isReadOnly && <ReadOnlyBadge />}

            {/* Source indicator (platform) */}
            {sourceType && <SourceIndicator sourceType={sourceType} />}

            {/* "Already in Central" badge */}
            {isCentral && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                <Globe className="size-3" />
                {t("discover.alreadyCentral")}
              </span>
            )}

            {/* Platform badge (discover) */}
            {platformBadge && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <PlatformIcon agentId={platformBadge.id} className="size-3" />
                {platformBadge.name}
              </span>
            )}

            {/* Project badge (discover) */}
            {projectBadge && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Folder className="size-3" />
                {projectBadge}
              </span>
            )}

            {/* Publisher (marketplace recommended) */}
            {publisher && (
              <span className="text-[10px] text-muted-foreground truncate">{publisher}</span>
            )}

            {/* Tags (marketplace recommended) */}
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-1">
                {tags.slice(0, 2).map((tag) => (
                  <span key={tag.key} className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded">
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Platform toggles (central) */}
          {hasPlatformIcons && (lobsterAgents.length > 0 || codingAgents.length > 0) && (
            <div className="mt-auto space-y-1 pt-1">
              {lobsterAgents.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {t("sidebar.categoryLobster")}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                    {lobsterAgents.map((agent) => {
                      const isReadOnlyAgent = readOnlyAgentIds.has(agent.id);
                      return (
                        <PlatformToggleIcon
                          key={agent.id}
                          agent={agent}
                          skillName={name}
                          isLinked={linkedAgentIds.has(agent.id) || isReadOnlyAgent}
                          isReadOnly={isReadOnlyAgent}
                          isToggling={platformIcons.togglingAgentId === agent.id}
                          onToggle={() => platformIcons.onToggle(platformIcons.skillId, agent.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {codingAgents.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {t("sidebar.categoryCoding")}
                  </span>
                  <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
                    {featuredCodingAgents.map((agent) => {
                      const isReadOnlyAgent = readOnlyAgentIds.has(agent.id);
                      return (
                        <PlatformToggleIcon
                          key={agent.id}
                          agent={agent}
                          skillName={name}
                          isLinked={linkedAgentIds.has(agent.id) || isReadOnlyAgent}
                          isReadOnly={isReadOnlyAgent}
                          isToggling={platformIcons.togglingAgentId === agent.id}
                          onToggle={() => platformIcons.onToggle(platformIcons.skillId, agent.id)}
                        />
                      );
                    })}
                    {hiddenCodingCount > 0 && (
                      <span className="ml-0.5 rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{hiddenCodingCount}
                      </span>
                    )}
                  </div>
                  {platformIcons.onManage && (
                    <button
                      type="button"
                      onClick={platformIcons.onManage}
                      className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t("central.managePlatformsLabel", { skill: name })}
                    >
                      {t("central.managePlatforms")}
                    </button>
                  )}
                </div>
              )}
              {codingAgents.length === 0 && platformIcons.onManage && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={platformIcons.onManage}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t("central.managePlatformsLabel", { skill: name })}
                  >
                    {t("central.managePlatforms")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Source Indicator (internal) ──────────────────────────────────────────────

function SourceIndicator({ sourceType }: { sourceType: string }) {
  const { t, i18n } = useTranslation();
  const isSymlink = sourceType === "symlink";
  const isNative = sourceType === "native";
  const primaryLabel = isSymlink ? t("platform.sourceCentral") : t("platform.sourceStandalone");
  const secondaryLabel = isSymlink
    ? t("platform.sourceSymlinkLabel")
    : isNative
      ? t("platform.sourceNativeLabel", {
          defaultValue: i18n.language.startsWith("zh") ? "原生" : "native",
        })
      : t("platform.sourceCopyLabel");

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isSymlink ? "text-primary/80" : "text-muted-foreground"
      )}
    >
      {isSymlink ? <Link2 className="size-3 shrink-0" /> : <FolderOpen className="size-3 shrink-0" />}
      <div className="inline-flex items-center gap-1">
        <span>{primaryLabel}</span>
        <span aria-hidden="true" className="h-px w-3 shrink-0 rounded-full bg-current opacity-40" />
        <span className="sr-only"> - </span>
        <span>{secondaryLabel}</span>
      </div>
    </div>
  );
}

function SourceOriginBadge({ originKind }: { originKind: ClaudeSourceKind }) {
  const { t, i18n } = useTranslation();
  const isPlugin = originKind === "plugin";
  const isCompatibility = originKind === "compatibility";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
        isPlugin
          ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
          : isCompatibility
            ? "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300"
          : "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-300"
      )}
    >
      {isPlugin
        ? t("platform.originPlugin", {
            defaultValue: i18n.language.startsWith("zh") ? "插件来源" : "Plugin source",
          })
        : isCompatibility
          ? t("platform.originCompatibility", {
              defaultValue: i18n.language.startsWith("zh") ? "兼容来源" : "Compatibility source",
            })
        : t("platform.originUser", {
            defaultValue: i18n.language.startsWith("zh") ? "用户来源" : "User source",
          })}
    </span>
  );
}

function ReadOnlyBadge() {
  const { t, i18n } = useTranslation();

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/70">
      <Lock className="size-3 shrink-0" />
      {t("platform.readOnly", {
        defaultValue: i18n.language.startsWith("zh") ? "只读" : "Read-only",
      })}
    </span>
  );
}
