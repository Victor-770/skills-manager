import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AgentWithStatus,
  CentralSkillBundle,
  CentralSkillBundleDetail,
  CentralSkillBundleDeletePreview,
  SkillWithLinks,
} from "../types";
import * as tauriBridge from "@/lib/tauri";

// Mock Tauri core before importing the store
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { useCentralSkillsStore } from "../stores/centralSkillsStore";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSkills: SkillWithLinks[] = [
  {
    id: "frontend-design",
    name: "frontend-design",
    description: "Build distinctive frontend UIs",
    file_path: "~/.agents/skills/frontend-design/SKILL.md",
    canonical_path: "~/.agents/skills/frontend-design",
    is_central: true,
    scanned_at: "2026-04-09T00:00:00Z",
    linked_agents: ["claude-code", "cursor"],
  },
  {
    id: "code-reviewer",
    name: "code-reviewer",
    description: "Review code changes and identify bugs",
    file_path: "~/.agents/skills/code-reviewer/SKILL.md",
    canonical_path: "~/.agents/skills/code-reviewer",
    is_central: true,
    scanned_at: "2026-04-09T00:00:00Z",
    linked_agents: [],
  },
];

const mockAgents: AgentWithStatus[] = [
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

const mockBundles: CentralSkillBundle[] = [
  {
    name: "Superpowers",
    relativePath: "Superpowers",
    path: "~/.agents/skills/Superpowers",
    isSymlink: false,
    skillCount: 2,
    linkedAgentCount: 1,
    readOnlyAgentCount: 0,
  },
];

const mockBundlePreview: CentralSkillBundleDeletePreview = {
  bundle: mockBundles[0],
  skills: [
    {
      id: "using-superpowers",
      name: "using-superpowers",
      file_path: "~/.agents/skills/Superpowers/using-superpowers/SKILL.md",
      canonical_path: "~/.agents/skills/Superpowers/using-superpowers",
      is_central: true,
      scanned_at: "2026-04-09T00:00:00Z",
      linked_agents: ["claude-code"],
      read_only_agents: [],
    },
  ],
  affectedAgents: ["claude-code"],
  skippedReadOnlyAgents: [],
};

const mockBundleDetail: CentralSkillBundleDetail = {
  bundle: mockBundles[0],
  skills: [
    {
      id: "using-superpowers",
      name: "using-superpowers",
      description: "Use Superpowers workflows",
      file_path: "~/.agents/skills/Superpowers/using-superpowers/SKILL.md",
      canonical_path: "~/.agents/skills/Superpowers/using-superpowers",
      is_central: true,
      scanned_at: "2026-04-09T00:00:00Z",
      linked_agents: ["claude-code"],
      read_only_agents: [],
    },
    {
      id: "writing-plans",
      name: "writing-plans",
      description: "Write implementation plans",
      file_path: "~/.agents/skills/Superpowers/writing-plans/SKILL.md",
      canonical_path: "~/.agents/skills/Superpowers/writing-plans",
      is_central: true,
      scanned_at: "2026-04-09T00:00:00Z",
      linked_agents: [],
      read_only_agents: ["cursor"],
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("centralSkillsStore", () => {
  beforeEach(() => {
    useCentralSkillsStore.setState({
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
    });
    vi.clearAllMocks();
  });

  // ── Initial State ─────────────────────────────────────────────────────────

  it("has correct initial state", () => {
    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual([]);
    expect(state.agents).toEqual([]);
    expect(state.bundles).toEqual([]);
    expect(state.bundleDetail).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isLoadingBundles).toBe(false);
    expect(state.loadingBundleDetailPath).toBeNull();
    expect(state.isInstalling).toBe(false);
    expect(state.togglingAgentId).toBeNull();
    expect(state.deletingSkillId).toBeNull();
    expect(state.deletingBundlePath).toBeNull();
    expect(state.error).toBeNull();
  });

  // ── loadCentralSkills ─────────────────────────────────────────────────────

  it("calls get_central_skills and get_agents on loadCentralSkills", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockSkills) // get_central_skills
      .mockResolvedValueOnce(mockAgents); // get_agents

    await useCentralSkillsStore.getState().loadCentralSkills();

    expect(invoke).toHaveBeenCalledWith("get_central_skills");
    expect(invoke).toHaveBeenCalledWith("get_agents");
  });

  it("populates skills and agents after successful loadCentralSkills", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce(mockSkills)
      .mockResolvedValueOnce(mockAgents);

    await useCentralSkillsStore.getState().loadCentralSkills();

    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual(mockSkills);
    expect(state.agents).toEqual(mockAgents);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sets error when loadCentralSkills fails", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("DB error"));

    await useCentralSkillsStore.getState().loadCentralSkills();

    const state = useCentralSkillsStore.getState();
    expect(state.error).toContain("DB error");
    expect(state.isLoading).toBe(false);
  });

  // ── loadCentralBundles ───────────────────────────────────────────────────

  it("calls get_central_skill_bundles and stores bundles", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(mockBundles);

    await useCentralSkillsStore.getState().loadCentralBundles();

    expect(invoke).toHaveBeenCalledWith("get_central_skill_bundles");
    expect(useCentralSkillsStore.getState().bundles).toEqual(mockBundles);
    expect(useCentralSkillsStore.getState().isLoadingBundles).toBe(false);
  });

  it("previews central bundle deletion", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(mockBundlePreview);

    const preview = await useCentralSkillsStore
      .getState()
      .previewDeleteCentralBundle("Superpowers");

    expect(invoke).toHaveBeenCalledWith("preview_delete_central_skill_bundle", {
      relativePath: "Superpowers",
    });
    expect(preview).toEqual(mockBundlePreview);
    expect(useCentralSkillsStore.getState().bundleDeletePreview).toEqual(mockBundlePreview);
  });

  it("loads central bundle detail with skills and links", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(mockBundleDetail);

    const detail = await useCentralSkillsStore
      .getState()
      .loadCentralBundleDetail("Superpowers");

    expect(invoke).toHaveBeenCalledWith("get_central_skill_bundle_detail", {
      relativePath: "Superpowers",
    });
    expect(detail).toEqual(mockBundleDetail);
    expect(useCentralSkillsStore.getState().bundleDetail).toEqual(mockBundleDetail);
    expect(useCentralSkillsStore.getState().loadingBundleDetailPath).toBeNull();
  });

  it("sets error when loading central bundle detail fails", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("detail failed"));

    await expect(
      useCentralSkillsStore.getState().loadCentralBundleDetail("Superpowers")
    ).rejects.toThrow("detail failed");

    expect(useCentralSkillsStore.getState().error).toContain("detail failed");
    expect(useCentralSkillsStore.getState().bundleDetail).toBeNull();
    expect(useCentralSkillsStore.getState().loadingBundleDetailPath).toBeNull();
  });

  it("deletes a central bundle then refreshes skills and bundles", async () => {
    const result = {
      relativePath: "Superpowers",
      removedBundlePath: "/Users/test/.agents/skills/Superpowers",
      removedKind: "directory",
      removedSkillIds: ["using-superpowers"],
      uninstalledAgents: ["claude-code"],
      skippedReadOnlyAgents: [],
    };
    vi.mocked(invoke)
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce(mockSkills)
      .mockResolvedValueOnce([]);

    const deleteResult = await useCentralSkillsStore
      .getState()
      .deleteCentralBundle("Superpowers", { cascadeUninstall: true });

    expect(invoke).toHaveBeenCalledWith("delete_central_skill_bundle", {
      relativePath: "Superpowers",
      options: { cascadeUninstall: true },
    });
    expect(invoke).toHaveBeenCalledWith("get_central_skills");
    expect(invoke).toHaveBeenCalledWith("get_central_skill_bundles");
    expect(deleteResult).toEqual(result);
    expect(useCentralSkillsStore.getState().bundles).toEqual([]);
    expect(useCentralSkillsStore.getState().deletingBundlePath).toBeNull();
  });

  it("returns deterministic browser fixture data when Tauri runtime is unavailable", async () => {
    const isTauriSpy = vi.spyOn(tauriBridge, "isTauriRuntime").mockReturnValue(false);

    await useCentralSkillsStore.getState().loadCentralSkills();

    expect(invoke).not.toHaveBeenCalled();
    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual([
      expect.objectContaining({
        id: "fixture-central-skill",
        linked_agents: ["claude-code"],
      }),
    ]);
    expect(state.agents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "claude-code" }),
        expect.objectContaining({ id: "central" }),
      ])
    );

    isTauriSpy.mockRestore();
  });

  // ── installSkill ──────────────────────────────────────────────────────────

  it("calls batch_install_to_agents then refreshes skills", async () => {
    const batchResult = { succeeded: ["cursor"], failed: [] };
    const updatedSkills = [
      { ...mockSkills[0], linked_agents: ["claude-code", "cursor", "gemini-cli"] },
      mockSkills[1],
    ];

    vi.mocked(invoke)
      .mockResolvedValueOnce(batchResult) // batch_install_to_agents
      .mockResolvedValueOnce(updatedSkills); // get_central_skills (refresh)

    await useCentralSkillsStore
      .getState()
      .installSkill("frontend-design", ["cursor"], "symlink");

    expect(invoke).toHaveBeenCalledWith("batch_install_to_agents", {
      skillId: "frontend-design",
      agentIds: ["cursor"],
      method: "symlink",
    });
    // Refresh call
    expect(invoke).toHaveBeenCalledWith("get_central_skills");

    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual(updatedSkills);
    expect(state.isInstalling).toBe(false);
  });

  it("forwards 'copy' method to batch_install_to_agents", async () => {
    const batchResult = { succeeded: ["cursor"], failed: [] };
    vi.mocked(invoke)
      .mockResolvedValueOnce(batchResult)
      .mockResolvedValueOnce(mockSkills);

    await useCentralSkillsStore
      .getState()
      .installSkill("frontend-design", ["cursor"], "copy");

    expect(invoke).toHaveBeenCalledWith("batch_install_to_agents", {
      skillId: "frontend-design",
      agentIds: ["cursor"],
      method: "copy",
    });
  });

  it("returns the BatchInstallResult from installSkill", async () => {
    const batchResult = { succeeded: ["cursor"], failed: [] };
    vi.mocked(invoke)
      .mockResolvedValueOnce(batchResult)
      .mockResolvedValueOnce(mockSkills);

    const result = await useCentralSkillsStore
      .getState()
      .installSkill("frontend-design", ["cursor"], "symlink");

    expect(result).toEqual(batchResult);
  });

  it("sets error and re-throws when installSkill fails", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("symlink failed"));

    await expect(
      useCentralSkillsStore
        .getState()
        .installSkill("frontend-design", ["cursor"], "symlink")
    ).rejects.toThrow("symlink failed");

    const state = useCentralSkillsStore.getState();
    expect(state.error).toContain("symlink failed");
    expect(state.isInstalling).toBe(false);
  });

  // ── deleteCentralSkill ───────────────────────────────────────────────────

  it("calls delete_central_skill then refreshes central skills", async () => {
    const result = {
      skillId: "code-reviewer",
      removedCanonicalPath: "/Users/test/.agents/skills/code-reviewer",
      uninstalledAgents: [],
      skippedReadOnlyAgents: [],
    };
    const updatedSkills = [mockSkills[0]];
    vi.mocked(invoke)
      .mockResolvedValueOnce(result)
      .mockResolvedValueOnce(updatedSkills);

    const deleteResult = await useCentralSkillsStore
      .getState()
      .deleteCentralSkill("code-reviewer", { cascadeUninstall: false });

    expect(invoke).toHaveBeenCalledWith("delete_central_skill", {
      skillId: "code-reviewer",
      options: { cascadeUninstall: false },
    });
    expect(invoke).toHaveBeenCalledWith("get_central_skills");
    expect(deleteResult).toEqual(result);
    expect(useCentralSkillsStore.getState().skills).toEqual(updatedSkills);
    expect(useCentralSkillsStore.getState().deletingSkillId).toBeNull();
  });

  it("sets error and re-throws when deleteCentralSkill fails", async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error("delete failed"));

    await expect(
      useCentralSkillsStore
        .getState()
        .deleteCentralSkill("code-reviewer", { cascadeUninstall: false })
    ).rejects.toThrow("delete failed");

    const state = useCentralSkillsStore.getState();
    expect(state.error).toContain("delete failed");
    expect(state.deletingSkillId).toBeNull();
  });

  // ── togglePlatformLink ────────────────────────────────────────────────────

  it("calls uninstall when skill is already linked to the agent", async () => {
    // Pre-populate skills so the toggle can check linked_agents
    useCentralSkillsStore.setState({ skills: mockSkills });

    const updatedSkills = [
      { ...mockSkills[0], linked_agents: ["claude-code"] }, // cursor removed
      mockSkills[1],
    ];
    vi.mocked(invoke)
      .mockResolvedValueOnce(undefined) // uninstall_skill_from_agent
      .mockResolvedValueOnce(updatedSkills); // get_central_skills (refresh)

    await useCentralSkillsStore
      .getState()
      .togglePlatformLink("frontend-design", "cursor");

    expect(invoke).toHaveBeenCalledWith("uninstall_skill_from_agent", {
      skillId: "frontend-design",
      agentId: "cursor",
    });
    expect(invoke).toHaveBeenCalledWith("get_central_skills");

    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual(updatedSkills);
    expect(state.togglingAgentId).toBeNull();
  });

  it("calls install when skill is not linked to the agent", async () => {
    useCentralSkillsStore.setState({ skills: mockSkills });

    const updatedSkills = [
      mockSkills[0],
      { ...mockSkills[1], linked_agents: ["claude-code"] }, // added
    ];
    vi.mocked(invoke)
      .mockResolvedValueOnce(undefined) // install_skill_to_agent
      .mockResolvedValueOnce(updatedSkills); // get_central_skills (refresh)

    await useCentralSkillsStore
      .getState()
      .togglePlatformLink("code-reviewer", "claude-code");

    expect(invoke).toHaveBeenCalledWith("install_skill_to_agent", {
      skillId: "code-reviewer",
      agentId: "claude-code",
      method: "auto",
    });

    const state = useCentralSkillsStore.getState();
    expect(state.skills).toEqual(updatedSkills);
    expect(state.togglingAgentId).toBeNull();
  });

  it("does not uninstall read-only compatibility observations", async () => {
    useCentralSkillsStore.setState({
      skills: [
        {
          ...mockSkills[1],
          linked_agents: [],
          read_only_agents: ["factory-droid"],
        },
      ],
    });

    await useCentralSkillsStore
      .getState()
      .togglePlatformLink("code-reviewer", "factory-droid");

    expect(invoke).not.toHaveBeenCalled();
    expect(useCentralSkillsStore.getState().togglingAgentId).toBeNull();
  });

  it("sets error and re-throws when togglePlatformLink fails", async () => {
    useCentralSkillsStore.setState({ skills: mockSkills });

    vi.mocked(invoke).mockRejectedValueOnce(new Error("toggle failed"));

    await expect(
      useCentralSkillsStore
        .getState()
        .togglePlatformLink("frontend-design", "cursor")
    ).rejects.toThrow("toggle failed");

    const state = useCentralSkillsStore.getState();
    expect(state.error).toContain("toggle failed");
    expect(state.togglingAgentId).toBeNull();
  });
});
