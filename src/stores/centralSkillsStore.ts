import { create } from "zustand";
import { invoke, isTauriRuntime } from "@/lib/tauri";
import {
  AgentWithStatus,
  BatchInstallResult,
  CentralSkillBundle,
  CentralSkillBundleDetail,
  CentralSkillBundleDeletePreview,
  DeleteCentralSkillOptions,
  DeleteCentralSkillBundleOptions,
  DeleteCentralSkillBundleResult,
  DeleteCentralSkillResult,
  SkillWithLinks,
} from "@/types";

export const BROWSER_FIXTURE_AGENTS: AgentWithStatus[] = [
  {
    id: "claude-code",
    display_name: "Claude Code",
    category: "coding",
    global_skills_dir: "~/.claude/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "cursor",
    display_name: "Cursor",
    category: "coding",
    global_skills_dir: "~/.cursor/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "central",
    display_name: "Central Skills",
    category: "central",
    global_skills_dir: "~/.agents/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
];

export const BROWSER_FIXTURE_SKILLS: SkillWithLinks[] = [
  {
    id: "fixture-central-skill",
    name: "fixture-central-skill",
    description: "Browser validation fixture for Central and drawer entry flows.",
    file_path: "~/.agents/skills/fixture-central-skill/SKILL.md",
    canonical_path: "~/.agents/skills/fixture-central-skill",
    is_central: true,
    source: "browser-fixture",
    scanned_at: "2026-04-17T00:00:00.000Z",
    created_at: "2026-04-17T00:00:00.000Z",
    updated_at: "2026-04-17T00:00:00.000Z",
    linked_agents: ["claude-code"],
    read_only_agents: [],
  },
];

export const BROWSER_FIXTURE_BUNDLES: CentralSkillBundle[] = [];

// ─── State ────────────────────────────────────────────────────────────────────

interface CentralSkillsState {
  skills: SkillWithLinks[];
  agents: AgentWithStatus[];
  bundles: CentralSkillBundle[];
  bundleDetail: CentralSkillBundleDetail | null;
  bundleDeletePreview: CentralSkillBundleDeletePreview | null;
  isLoading: boolean;
  isLoadingBundles: boolean;
  loadingBundleDetailPath: string | null;
  isInstalling: boolean;
  deletingSkillId: string | null;
  deletingBundlePath: string | null;
  /** Agent ID currently being toggled (null = idle). */
  togglingAgentId: string | null;
  error: string | null;

  // Actions
  loadCentralSkills: () => Promise<void>;
  loadCentralBundles: () => Promise<void>;
  loadCentralBundleDetail: (relativePath: string) => Promise<CentralSkillBundleDetail>;
  clearCentralBundleDetail: () => void;
  installSkill: (
    skillId: string,
    agentIds: string[],
    method: string
  ) => Promise<BatchInstallResult>;
  deleteCentralSkill: (
    skillId: string,
    options: DeleteCentralSkillOptions
  ) => Promise<DeleteCentralSkillResult>;
  previewDeleteCentralBundle: (
    relativePath: string
  ) => Promise<CentralSkillBundleDeletePreview>;
  deleteCentralBundle: (
    relativePath: string,
    options: DeleteCentralSkillBundleOptions
  ) => Promise<DeleteCentralSkillBundleResult>;
  clearBundleDeletePreview: () => void;
  togglePlatformLink: (skillId: string, agentId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCentralSkillsStore = create<CentralSkillsState>((set, get) => ({
  skills: [],
  agents: [],
  bundles: [],
  bundleDetail: null,
  bundleDeletePreview: null,
  isLoading: false,
  isLoadingBundles: false,
  loadingBundleDetailPath: null,
  isInstalling: false,
  deletingSkillId: null,
  deletingBundlePath: null,
  togglingAgentId: null,
  error: null,

  /**
   * Load all Central Skills with per-platform link status, along with the
   * list of all registered agents. Called when navigating to /central.
   */
  loadCentralSkills: async () => {
    set({ isLoading: true, error: null });
    if (!isTauriRuntime()) {
      set({
        skills: BROWSER_FIXTURE_SKILLS,
        agents: BROWSER_FIXTURE_AGENTS,
        bundles: BROWSER_FIXTURE_BUNDLES,
        isLoading: false,
      });
      return;
    }
    try {
      const [skills, agents] = await Promise.all([
        invoke<SkillWithLinks[]>("get_central_skills"),
        invoke<AgentWithStatus[]>("get_agents"),
      ]);
      set({ skills: skills ?? [], agents: agents ?? [], isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  loadCentralBundles: async () => {
    set({ isLoadingBundles: true, error: null });
    if (!isTauriRuntime()) {
      set({ bundles: BROWSER_FIXTURE_BUNDLES, isLoadingBundles: false });
      return;
    }
    try {
      const bundles = await invoke<CentralSkillBundle[]>("get_central_skill_bundles");
      set({ bundles: bundles ?? [], isLoadingBundles: false });
    } catch (err) {
      set({ error: String(err), isLoadingBundles: false });
    }
  },

  loadCentralBundleDetail: async (relativePath) => {
    set({ loadingBundleDetailPath: relativePath, error: null });
    if (!isTauriRuntime()) {
      const bundle =
        get().bundles.find((candidate) => candidate.relativePath === relativePath) ?? {
          name: relativePath,
          relativePath,
          path: `~/.agents/skills/${relativePath}`,
          isSymlink: false,
          skillCount: 0,
          linkedAgentCount: 0,
          readOnlyAgentCount: 0,
        };
      const detail: CentralSkillBundleDetail = {
        bundle,
        skills: [],
      };
      set({ bundleDetail: detail, loadingBundleDetailPath: null });
      return detail;
    }
    try {
      const detail = await invoke<CentralSkillBundleDetail>(
        "get_central_skill_bundle_detail",
        { relativePath }
      );
      set({ bundleDetail: detail, loadingBundleDetailPath: null });
      return detail;
    } catch (err) {
      set({ error: String(err), bundleDetail: null, loadingBundleDetailPath: null });
      throw err;
    }
  },

  clearCentralBundleDetail: () => {
    set({ bundleDetail: null, loadingBundleDetailPath: null });
  },

  /**
   * Install a skill to one or more agents. Refreshes the skill list after
   * a successful (or partial) install so link status icons update.
   */
  installSkill: async (skillId, agentIds, method) => {
    set({ isInstalling: true, error: null });
    try {
      const result = await invoke<BatchInstallResult>("batch_install_to_agents", {
        skillId,
        agentIds,
        method,
      });

      // Refresh central skills to get updated link status.
      const skills = await invoke<SkillWithLinks[]>("get_central_skills");
      set({ skills, isInstalling: false });

      return result;
    } catch (err) {
      set({ error: String(err), isInstalling: false });
      throw err;
    }
  },

  /**
   * Delete a skill from the Central Skills root.
   * By default the backend refuses linked skills; callers must explicitly pass
   * cascadeUninstall=true after showing the broader-impact confirmation.
   */
  deleteCentralSkill: async (skillId, options) => {
    set({ deletingSkillId: skillId, error: null });
    if (!isTauriRuntime()) {
      const result: DeleteCentralSkillResult = {
        skillId,
        removedCanonicalPath: `~/.agents/skills/${skillId}`,
        uninstalledAgents: [],
        skippedReadOnlyAgents: [],
      };
      set((state) => ({
        skills: state.skills.filter((skill) => skill.id !== skillId),
        deletingSkillId: null,
      }));
      return result;
    }
    try {
      const result = await invoke<DeleteCentralSkillResult>("delete_central_skill", {
        skillId,
        options,
      });

      const skills = await invoke<SkillWithLinks[]>("get_central_skills");
      set({ skills, deletingSkillId: null });

      return result;
    } catch (err) {
      set({ error: String(err), deletingSkillId: null });
      throw err;
    }
  },

  previewDeleteCentralBundle: async (relativePath) => {
    set({ error: null, bundleDeletePreview: null });
    if (!isTauriRuntime()) {
      const bundle =
        get().bundles.find((candidate) => candidate.relativePath === relativePath) ?? {
          name: relativePath,
          relativePath,
          path: `~/.agents/skills/${relativePath}`,
          isSymlink: false,
          skillCount: 0,
          linkedAgentCount: 0,
          readOnlyAgentCount: 0,
        };
      const preview: CentralSkillBundleDeletePreview = {
        bundle,
        skills: [],
        affectedAgents: [],
        skippedReadOnlyAgents: [],
      };
      set({ bundleDeletePreview: preview });
      return preview;
    }
    try {
      const preview = await invoke<CentralSkillBundleDeletePreview>(
        "preview_delete_central_skill_bundle",
        { relativePath }
      );
      set({ bundleDeletePreview: preview });
      return preview;
    } catch (err) {
      set({ error: String(err), bundleDeletePreview: null });
      throw err;
    }
  },

  deleteCentralBundle: async (relativePath, options) => {
    set({ deletingBundlePath: relativePath, error: null });
    if (!isTauriRuntime()) {
      const result: DeleteCentralSkillBundleResult = {
        relativePath,
        removedBundlePath: `~/.agents/skills/${relativePath}`,
        removedKind: "directory",
        removedSkillIds: [],
        uninstalledAgents: [],
        skippedReadOnlyAgents: [],
      };
      set((state) => ({
        bundles: state.bundles.filter((bundle) => bundle.relativePath !== relativePath),
        bundleDeletePreview: null,
        deletingBundlePath: null,
      }));
      return result;
    }
    try {
      const result = await invoke<DeleteCentralSkillBundleResult>(
        "delete_central_skill_bundle",
        { relativePath, options }
      );
      const [skills, bundles] = await Promise.all([
        invoke<SkillWithLinks[]>("get_central_skills"),
        invoke<CentralSkillBundle[]>("get_central_skill_bundles"),
      ]);
      set({
        skills,
        bundles,
        bundleDeletePreview: null,
        deletingBundlePath: null,
      });
      return result;
    } catch (err) {
      set({ error: String(err), deletingBundlePath: null });
      throw err;
    }
  },

  clearBundleDeletePreview: () => {
    set({ bundleDeletePreview: null });
  },

  /**
   * Toggle a single platform link for a skill.
   * If linked, uninstalls; if not linked, installs via the backend default method.
   * Refreshes the skill list afterward so linked_agents updates.
   */
  togglePlatformLink: async (skillId, agentId) => {
    set({ togglingAgentId: agentId, error: null });
    try {
      const skill = get().skills.find((s) => s.id === skillId);
      const isLinked = skill?.linked_agents.includes(agentId) ?? false;
      const isReadOnly = skill?.read_only_agents?.includes(agentId) ?? false;

      if (isReadOnly) {
        set({ togglingAgentId: null });
        return;
      }

      if (isLinked) {
        await invoke("uninstall_skill_from_agent", { skillId, agentId });
      } else {
        await invoke("install_skill_to_agent", { skillId, agentId, method: "auto" });
      }

      const skills = await invoke<SkillWithLinks[]>("get_central_skills");
      set({ skills, togglingAgentId: null });
    } catch (err) {
      set({ error: String(err), togglingAgentId: null });
      throw err;
    }
  },
}));
