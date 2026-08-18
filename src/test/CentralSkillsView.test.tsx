import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CentralSkillsView } from "../pages/CentralSkillsView";
import {
  AgentWithStatus,
  CentralSkillBundle,
  CentralSkillBundleDetail,
  SkillWithLinks,
} from "../types";

// Mock stores
vi.mock("../stores/centralSkillsStore", () => ({
  useCentralSkillsStore: vi.fn(),
}));

vi.mock("../stores/platformStore", () => ({
  usePlatformStore: vi.fn(),
}));

vi.mock("../stores/skillStore", () => ({
  useSkillStore: vi.fn(),
}));

vi.mock("../stores/marketplaceStore", () => ({
  useMarketplaceStore: vi.fn(),
}));

vi.mock("../components/skill/SkillDetailDrawer", () => ({
  SkillDetailDrawer: ({
    open,
    skillId,
    onOpenChange,
    returnFocusRef,
  }: {
    open: boolean;
    skillId: string | null;
    onOpenChange: (open: boolean) => void;
    returnFocusRef?: { current: HTMLElement | null };
  }) =>
    open ? (
      <div data-testid="skill-detail-drawer">
        <div>drawer-skill:{skillId}</div>
        <button
          onClick={() => {
            onOpenChange(false);
            returnFocusRef?.current?.focus();
          }}
        >
          Close drawer
        </button>
      </div>
    ) : null,
}));

vi.mock("../components/skill/SkillDetailView", () => ({
  SkillDetailView: ({
    skillId,
    agentId,
    rowId,
  }: {
    skillId?: string;
    agentId?: string | null;
    rowId?: string | null;
  }) => (
    <div data-testid="folder-skill-detail">
      <div>folder-detail-skill:{skillId ?? "none"}</div>
      <div>folder-detail-agent:{agentId ?? "none"}</div>
      <div>folder-detail-row:{rowId ?? "none"}</div>
    </div>
  ),
}));

import { useCentralSkillsStore } from "../stores/centralSkillsStore";
import { usePlatformStore } from "../stores/platformStore";
import { useSkillStore } from "../stores/skillStore";
import { useMarketplaceStore } from "../stores/marketplaceStore";
import * as tauriBridge from "@/lib/tauri";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAgents: AgentWithStatus[] = [
  {
    id: "claude-code",
    display_name: "Claude Code",
    category: "coding",
    global_skills_dir: "/Users/test/.claude/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "cursor",
    display_name: "Cursor",
    category: "coding",
    global_skills_dir: "/Users/test/.cursor/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "trae",
    display_name: "Trae",
    category: "coding",
    global_skills_dir: "/Users/test/.trae/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "openclaw",
    display_name: "OpenClaw",
    category: "lobster",
    global_skills_dir: "/Users/test/.openclaw/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "central",
    display_name: "Central Skills",
    category: "central",
    global_skills_dir: "/Users/test/.agents/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
];

const mockSkills: SkillWithLinks[] = [
  {
    id: "frontend-design",
    name: "frontend-design",
    description: "Build distinctive, production-grade frontend interfaces",
    file_path: "~/.agents/skills/frontend-design/SKILL.md",
    canonical_path: "~/.agents/skills/frontend-design",
    is_central: true,
    scanned_at: "2026-04-09T00:00:00Z",
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-12T00:00:00Z",
    linked_agents: ["claude-code"],
  },
  {
    id: "code-reviewer",
    name: "code-reviewer",
    description: "Review code changes and identify high-confidence, actionable bugs",
    file_path: "~/.agents/skills/code-reviewer/SKILL.md",
    canonical_path: "~/.agents/skills/code-reviewer",
    is_central: true,
    scanned_at: "2026-04-09T00:00:00Z",
    created_at: "2026-04-08T00:00:00Z",
    updated_at: "2026-04-20T00:00:00Z",
    linked_agents: [],
  },
];

const mockBundles: CentralSkillBundle[] = [
  {
    name: "Superpowers",
    relativePath: "Superpowers",
    path: "/Users/test/.agents/skills/Superpowers",
    isSymlink: false,
    skillCount: 2,
    linkedAgentCount: 1,
    readOnlyAgentCount: 0,
  },
];

const mockBundleDetail: CentralSkillBundleDetail = {
  bundle: mockBundles[0],
  skills: [
    {
      id: "using-superpowers",
      name: "using-superpowers",
      description: "Use Superpowers workflows",
      file_path: "/Users/test/.agents/skills/Superpowers/using-superpowers/SKILL.md",
      canonical_path: "/Users/test/.agents/skills/Superpowers/using-superpowers",
      is_central: true,
      scanned_at: "2026-04-09T00:00:00Z",
      linked_agents: ["claude-code"],
      read_only_agents: [],
    },
    {
      id: "writing-plans",
      name: "writing-plans",
      description: "Write implementation plans",
      file_path: "/Users/test/.agents/skills/Superpowers/writing-plans/SKILL.md",
      canonical_path: "/Users/test/.agents/skills/Superpowers/writing-plans",
      is_central: true,
      scanned_at: "2026-04-09T00:00:00Z",
      linked_agents: ["cursor"],
      read_only_agents: ["openclaw"],
    },
  ],
};

const mockLoadCentralSkills = vi.fn();
const mockLoadCentralBundles = vi.fn();
const mockLoadCentralBundleDetail = vi.fn();
const mockClearCentralBundleDetail = vi.fn();
const mockInstallSkill = vi.fn();
const mockTogglePlatformLink = vi.fn();
const mockDeleteCentralSkill = vi.fn();
const mockPreviewDeleteCentralBundle = vi.fn();
const mockDeleteCentralBundle = vi.fn();
const mockRescan = vi.fn();
const mockGetSkillsByAgent = vi.fn();
const mockPreviewGitHubRepoImport = vi.fn();
const mockImportGitHubRepoSkills = vi.fn();
const mockResetGitHubImport = vi.fn();
const mockUseCentralSkillsStore = vi.mocked(useCentralSkillsStore);
const mockUsePlatformStore = vi.mocked(usePlatformStore);
const mockUseSkillStore = vi.mocked(useSkillStore);
const mockUseMarketplaceStore = vi.mocked(useMarketplaceStore);

function buildCentralStoreState(overrides = {}) {
  return {
    skills: mockSkills,
    agents: mockAgents,
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
    loadCentralSkills: mockLoadCentralSkills,
    loadCentralBundles: mockLoadCentralBundles,
    loadCentralBundleDetail: mockLoadCentralBundleDetail,
    clearCentralBundleDetail: mockClearCentralBundleDetail,
    installSkill: mockInstallSkill,
    togglePlatformLink: mockTogglePlatformLink,
    deleteCentralSkill: mockDeleteCentralSkill,
    previewDeleteCentralBundle: mockPreviewDeleteCentralBundle,
    deleteCentralBundle: mockDeleteCentralBundle,
    clearBundleDeletePreview: vi.fn(),
    ...overrides,
  };
}

function buildPlatformStoreState(overrides = {}) {
  return {
    agents: mockAgents,
    skillsByAgent: {},
    isLoading: false,
    isRefreshing: false,
    error: null,
    initialize: vi.fn(),
    rescan: mockRescan,
    refreshCounts: mockRescan,
    ...overrides,
  };
}

function buildSkillStoreState(overrides = {}) {
  return {
    skillsByAgent: {},
    loadingByAgent: {},
    error: null,
    getSkillsByAgent: mockGetSkillsByAgent,
    ...overrides,
  };
}

function renderCentralSkillsView(centralOverrides = {}) {
  mockUseCentralSkillsStore.mockImplementation((selector?: unknown) => {
    const state = buildCentralStoreState(centralOverrides);
    if (typeof selector === "function") return selector(state);
    return state;
  });
  mockUsePlatformStore.mockImplementation((selector?: unknown) => {
    const state = buildPlatformStoreState();
    if (typeof selector === "function") return selector(state);
    return state;
  });
  mockUseSkillStore.mockImplementation((selector?: unknown) => {
    const state = buildSkillStoreState();
    if (typeof selector === "function") return selector(state);
    return state;
  });
  mockUseMarketplaceStore.mockImplementation((selector?: unknown) => {
    const state = {
      githubImport: {
        isPreviewLoading: false,
        isImporting: false,
        preview: null,
        importResult: null,
        previewedRepoUrl: null,
        error: null,
      },
      previewGitHubRepoImport: mockPreviewGitHubRepoImport,
      importGitHubRepoSkills: mockImportGitHubRepoSkills,
      resetGitHubImport: mockResetGitHubImport,
    };
    if (typeof selector === "function") return selector(state);
    return state;
  });

  return render(
    <MemoryRouter>
      <CentralSkillsView />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CentralSkillsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  // ── Header ────────────────────────────────────────────────────────────────

  it("shows page title in header", () => {
    renderCentralSkillsView();
    expect(screen.getByText("中央技能库")).toBeInTheDocument();
  });

  it("shows the central skills directory path", () => {
    renderCentralSkillsView();
    expect(screen.getByText("/Users/test/.agents/skills/")).toBeInTheDocument();
  });

  it("shows a refresh button", () => {
    renderCentralSkillsView();
    expect(
      screen.getByRole("button", { name: /刷新中央技能库/i })
    ).toBeInTheDocument();
  });

  it("shows the shared github import launcher", () => {
    renderCentralSkillsView();
    expect(screen.getByRole("button", { name: /从 GitHub 导入/i })).toBeInTheDocument();
  });

  it("shows a search input", () => {
    renderCentralSkillsView();
    expect(
      screen.getByPlaceholderText(/搜索中央技能库/i)
    ).toBeInTheDocument();
  });

  it("shows explicit sort field and direction controls", () => {
    renderCentralSkillsView();

    expect(screen.getByRole("group", { name: "排序字段" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "名称" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "创建时间" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "修改时间" })).toBeInTheDocument();

    expect(screen.getByRole("group", { name: "排序方向" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "正排" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "倒排" })).toBeInTheDocument();
  });

  // ── Skills List ───────────────────────────────────────────────────────────

  it("renders all central skills", () => {
    renderCentralSkillsView();
    expect(screen.getByText("frontend-design")).toBeInTheDocument();
    expect(screen.getByText("code-reviewer")).toBeInTheDocument();
  });

  it("defaults to all-skills mode without showing folder cards", () => {
    const nestedSkill = mockBundleDetail.skills[0];
    renderCentralSkillsView({
      bundles: mockBundles,
      skills: [...mockSkills, nestedSkill],
    });

    expect(screen.queryByText("套件 / 文件夹")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /查看 using-superpowers 的详情/i })
    ).toBeInTheDocument();
  });

  it("shows folders and only top-level skills in folders mode", () => {
    window.localStorage.setItem("skills-manage.skillListViewMode.central", "folders");
    const nestedSkill = mockBundleDetail.skills[0];
    renderCentralSkillsView({
      bundles: mockBundles,
      skills: [...mockSkills, nestedSkill],
    });

    expect(screen.getByText("套件 / 文件夹")).toBeInTheDocument();
    expect(screen.getByText("Superpowers")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /查看 frontend-design 的详情/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /查看 using-superpowers 的详情/i })
    ).not.toBeInTheDocument();
  });

  it("sorts by modified time and reverses direction explicitly", async () => {
    renderCentralSkillsView();

    fireEvent.click(screen.getByRole("button", { name: "修改时间" }));

    await waitFor(() => {
      const detailButtons = screen.getAllByRole("button", {
        name: /查看 .* 的详情/i,
      });
      expect(detailButtons[0]).toHaveTextContent("frontend-design");
      expect(detailButtons[1]).toHaveTextContent("code-reviewer");
    });

    fireEvent.click(screen.getByRole("button", { name: "倒排" }));

    await waitFor(() => {
      const detailButtons = screen.getAllByRole("button", {
        name: /查看 .* 的详情/i,
      });
      expect(detailButtons[0]).toHaveTextContent("code-reviewer");
      expect(detailButtons[1]).toHaveTextContent("frontend-design");
    });
  });

  it("renders skill descriptions", () => {
    renderCentralSkillsView();
    expect(
      screen.getByText(/Build distinctive, production-grade frontend interfaces/)
    ).toBeInTheDocument();
  });

  it("shows Install to... button for each skill", () => {
    renderCentralSkillsView();
    const installButtons = screen.getAllByRole("button", {
      name: /将 .* 安装到平台/i,
    });
    expect(installButtons).toHaveLength(2);
  });

  it("deletes an unlinked central skill after inline confirmation", async () => {
    mockDeleteCentralSkill.mockResolvedValue({
      skillId: "code-reviewer",
      removedCanonicalPath: "/Users/test/.agents/skills/code-reviewer",
      uninstalledAgents: [],
      skippedReadOnlyAgents: [],
    });

    renderCentralSkillsView();

    fireEvent.click(
      screen.getByRole("button", {
        name: /从中央技能库删除 code-reviewer/i,
      })
    );
    fireEvent.click(screen.getByRole("button", { name: /确认删除/i }));

    await waitFor(() => {
      expect(mockDeleteCentralSkill).toHaveBeenCalledWith("code-reviewer", {
        cascadeUninstall: false,
      });
      expect(mockRescan).toHaveBeenCalledTimes(1);
    });
  });

  it("requires explicit cascade confirmation before deleting a linked central skill", async () => {
    mockDeleteCentralSkill.mockResolvedValue({
      skillId: "frontend-design",
      removedCanonicalPath: "/Users/test/.agents/skills/frontend-design",
      uninstalledAgents: ["claude-code"],
      skippedReadOnlyAgents: [],
    });

    renderCentralSkillsView();

    fireEvent.click(
      screen.getByRole("button", {
        name: /从中央技能库删除 frontend-design/i,
      })
    );

    expect(
      await screen.findByRole("dialog", { name: /删除 frontend-design/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Claude Code/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /同时卸载并删除/i }));

    await waitFor(() => {
      expect(mockDeleteCentralSkill).toHaveBeenCalledWith("frontend-design", {
        cascadeUninstall: true,
      });
    });
  });

  it("renders central skill bundles above the skill list", () => {
    window.localStorage.setItem("skills-manage.skillListViewMode.central", "folders");
    renderCentralSkillsView({ bundles: mockBundles });

    expect(screen.getByText("套件 / 文件夹")).toBeInTheDocument();
    expect(screen.getByText("Superpowers")).toBeInTheDocument();
    expect(screen.getByText(/2 个技能/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /删除套件 Superpowers/i })
    ).toBeInTheDocument();
  });

  it("opens a bundle detail drawer showing skills and platform links", async () => {
    window.localStorage.setItem("skills-manage.skillListViewMode.central", "folders");
    mockLoadCentralBundleDetail.mockResolvedValue(mockBundleDetail);
    renderCentralSkillsView({
      bundles: mockBundles,
      bundleDetail: mockBundleDetail,
    });

    fireEvent.click(
      screen.getByRole("button", { name: /打开目录 Superpowers/i })
    );

    expect(mockLoadCentralBundleDetail).toHaveBeenCalledWith("Superpowers");
    expect(
      await screen.findByRole("dialog", { name: /Superpowers/ })
    ).toBeInTheDocument();
    expect(screen.getByText("using-superpowers")).toBeInTheDocument();
    expect(screen.getByText("writing-plans")).toBeInTheDocument();
    expect(screen.getByText("folder-detail-skill:using-superpowers")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /writing-plans/i }));

    expect(screen.getByText("folder-detail-skill:writing-plans")).toBeInTheDocument();
  });

  it("keeps bundle delete icon from opening the detail drawer", async () => {
    window.localStorage.setItem("skills-manage.skillListViewMode.central", "folders");
    mockPreviewDeleteCentralBundle.mockResolvedValue({
      bundle: mockBundles[0],
      skills: mockBundleDetail.skills,
      affectedAgents: ["claude-code", "cursor"],
      skippedReadOnlyAgents: ["openclaw"],
    });
    renderCentralSkillsView({ bundles: mockBundles });

    fireEvent.click(screen.getByRole("button", { name: /删除套件 Superpowers/i }));

    expect(
      await screen.findByRole("dialog", { name: /删除套件 Superpowers/i })
    ).toBeInTheDocument();
    expect(mockPreviewDeleteCentralBundle).toHaveBeenCalledWith("Superpowers");
    expect(mockLoadCentralBundleDetail).not.toHaveBeenCalled();
  });

  it("previews and deletes a central skill bundle after danger confirmation", async () => {
    window.localStorage.setItem("skills-manage.skillListViewMode.central", "folders");
    mockPreviewDeleteCentralBundle.mockResolvedValue({
      bundle: mockBundles[0],
      skills: [
        {
          id: "using-superpowers",
          name: "using-superpowers",
          file_path: "/Users/test/.agents/skills/Superpowers/using-superpowers/SKILL.md",
          canonical_path: "/Users/test/.agents/skills/Superpowers/using-superpowers",
          is_central: true,
          scanned_at: "2026-04-09T00:00:00Z",
          linked_agents: ["claude-code"],
          read_only_agents: [],
        },
      ],
      affectedAgents: ["claude-code"],
      skippedReadOnlyAgents: [],
    });
    mockDeleteCentralBundle.mockResolvedValue({
      relativePath: "Superpowers",
      removedBundlePath: "/Users/test/.agents/skills/Superpowers",
      removedKind: "directory",
      removedSkillIds: ["using-superpowers"],
      uninstalledAgents: ["claude-code"],
      skippedReadOnlyAgents: [],
    });

    mockUseCentralSkillsStore.mockImplementation((selector?: unknown) => {
      const state = buildCentralStoreState({
        bundles: mockBundles,
        bundleDeletePreview: {
          bundle: mockBundles[0],
          skills: [
            {
              id: "using-superpowers",
              name: "using-superpowers",
              file_path: "/Users/test/.agents/skills/Superpowers/using-superpowers/SKILL.md",
              canonical_path: "/Users/test/.agents/skills/Superpowers/using-superpowers",
              is_central: true,
              scanned_at: "2026-04-09T00:00:00Z",
              linked_agents: ["claude-code"],
              read_only_agents: [],
            },
          ],
          affectedAgents: ["claude-code"],
          skippedReadOnlyAgents: [],
        },
      });
      if (typeof selector === "function") return selector(state);
      return state;
    });
    mockUsePlatformStore.mockImplementation((selector?: unknown) => {
      const state = buildPlatformStoreState();
      if (typeof selector === "function") return selector(state);
      return state;
    });
    mockUseSkillStore.mockImplementation((selector?: unknown) => {
      const state = buildSkillStoreState();
      if (typeof selector === "function") return selector(state);
      return state;
    });
    mockUseMarketplaceStore.mockImplementation((selector?: unknown) => {
      const state = {
        githubImport: {
          isPreviewLoading: false,
          isImporting: false,
          preview: null,
          importResult: null,
          previewedRepoUrl: null,
          error: null,
        },
        previewGitHubRepoImport: mockPreviewGitHubRepoImport,
        importGitHubRepoSkills: mockImportGitHubRepoSkills,
        resetGitHubImport: mockResetGitHubImport,
      };
      if (typeof selector === "function") return selector(state);
      return state;
    });

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /删除套件 Superpowers/i }));

    expect(mockPreviewDeleteCentralBundle).toHaveBeenCalledWith("Superpowers");
    expect(
      await screen.findByRole("dialog", { name: /删除套件 Superpowers/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/using-superpowers/)).toBeInTheDocument();
    expect(screen.getByText(/Claude Code/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /删除套件并卸载/i }));

    await waitFor(() => {
      expect(mockDeleteCentralBundle).toHaveBeenCalledWith("Superpowers", {
        cascadeUninstall: true,
      });
      expect(mockRescan).toHaveBeenCalledTimes(1);
    });
  });

  it("renders browser fixture skill card on the localhost validation surface without Tauri", async () => {
    const isTauriSpy = vi.spyOn(tauriBridge, "isTauriRuntime").mockReturnValue(false);
    mockUseCentralSkillsStore.mockRestore();
    mockUsePlatformStore.mockRestore();

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    expect(await screen.findByRole("button", { name: /查看 fixture-central-skill 的详情/i })).toBeInTheDocument();

    isTauriSpy.mockRestore();
  });

  it("skill name is a clickable button for detail navigation", () => {
    renderCentralSkillsView();
    // The skill name itself is the detail link (no separate [详情] button).
    const detailBtns = screen.getAllByRole("button", {
      name: /查看 frontend-design 的详情/i,
    });
    expect(detailBtns.length).toBeGreaterThanOrEqual(1);
  });

  // ── Per-platform link status ──────────────────────────────────────────────

  it("shows lobster toggles and featured coding toggles on central cards", () => {
    renderCentralSkillsView();

    expect(screen.getAllByText("龙虾类").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("编程类").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("button", { name: /管理 .* 的平台安装/i })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "切换 frontend-design 在 Claude Code 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 frontend-design 在 Cursor 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 frontend-design 在 OpenClaw 的链接状态" })).toBeInTheDocument();
  });

  it("toggles featured coding platforms directly from the card", async () => {
    mockTogglePlatformLink.mockResolvedValue(undefined);
    renderCentralSkillsView();

    fireEvent.click(screen.getByRole("button", { name: "切换 frontend-design 在 Cursor 的链接状态" }));

    await waitFor(() => {
      expect(mockTogglePlatformLink).toHaveBeenCalledWith("frontend-design", "cursor");
      expect(mockRescan).toHaveBeenCalledTimes(1);
    });
  });

  it("opens the platform manager drawer and toggles a platform", async () => {
    mockTogglePlatformLink.mockResolvedValue(undefined);
    renderCentralSkillsView();

    fireEvent.click(screen.getByRole("button", { name: "管理 frontend-design 的平台安装" }));

    expect(
      await screen.findByRole("dialog", { name: /管理 frontend-design 的平台安装/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "编程类" }));
    fireEvent.click(screen.getByRole("button", { name: "安装 frontend-design 到 Cursor" }));

    await waitFor(() => {
      expect(mockTogglePlatformLink).toHaveBeenCalledWith("frontend-design", "cursor");
      expect(mockRescan).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the full install dialog available from the platform drawer", async () => {
    renderCentralSkillsView();

    fireEvent.click(screen.getByRole("button", { name: "管理 frontend-design 的平台安装" }));
    fireEvent.click(await screen.findByRole("button", { name: "打开完整安装面板" }));

    expect(await screen.findByRole("dialog", { name: /安装 frontend-design/i })).toBeInTheDocument();
  });

  // ── Empty State ───────────────────────────────────────────────────────────

  it("shows first-visit empty state when no skills exist", () => {
    mockUseCentralSkillsStore.mockImplementation((selector?: unknown) => {
      const state = buildCentralStoreState({ skills: [] });
      if (typeof selector === "function") return selector(state);
      return state;
    });

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/欢迎使用 skills-manage/)
    ).toBeInTheDocument();
    // Should show guidance about creating a skill
    expect(
      screen.getAllByText(/agents\/skills/).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("shows loading state", () => {
    mockUseCentralSkillsStore.mockImplementation((selector?: unknown) => {
      const state = buildCentralStoreState({ isLoading: true, skills: [] });
      if (typeof selector === "function") return selector(state);
      return state;
    });

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    expect(screen.getByText("正在加载技能...")).toBeInTheDocument();
  });

  // ── Search / Filter ───────────────────────────────────────────────────────

  it("filters skills by name when searching", async () => {
    renderCentralSkillsView();
    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "frontend" } });

    await waitFor(() => {
      expect(screen.getByText("frontend-design")).toBeInTheDocument();
      expect(screen.queryByText("code-reviewer")).not.toBeInTheDocument();
    });
  });

  it("keeps filtered search results in the central card grid", async () => {
    renderCentralSkillsView();
    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "frontend" } });

    const resultButton = await screen.findByText("frontend-design");

    let current: HTMLElement | null = resultButton;
    let gridContainer: HTMLElement | null = null;
    while (current) {
      if (
        current.classList.contains("grid") &&
        current.classList.contains("grid-cols-1") &&
        current.className.includes("lg:grid-cols-2") &&
        current.classList.contains("gap-4")
      ) {
        gridContainer = current;
        break;
      }
      current = current.parentElement;
    }

    expect(gridContainer).not.toBeNull();
  });

  it("filters skills by description when searching", async () => {
    renderCentralSkillsView();
    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "actionable" } });

    await waitFor(() => {
      expect(screen.getByText("code-reviewer")).toBeInTheDocument();
      expect(screen.queryByText("frontend-design")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when search has no results", async () => {
    renderCentralSkillsView();
    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "zzz-nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/没有匹配的技能/)).toBeInTheDocument();
    });
  });

  it("restores all skills when search is cleared", async () => {
    renderCentralSkillsView();
    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "frontend" } });
    fireEvent.change(searchInput, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("frontend-design")).toBeInTheDocument();
      expect(screen.getByText("code-reviewer")).toBeInTheDocument();
    });
  });

  // ── Load on Mount ─────────────────────────────────────────────────────────

  it("calls loadCentralSkills on mount", () => {
    renderCentralSkillsView();
    expect(mockLoadCentralSkills).toHaveBeenCalledTimes(1);
  });

  // ── Refresh Button ────────────────────────────────────────────────────────

  it("calls rescan then loadCentralSkills when refresh button is clicked", async () => {
    renderCentralSkillsView();
    const refreshBtn = screen.getByRole("button", {
      name: /刷新中央技能库/i,
    });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      // rescan is called once (only on refresh, not on mount)
      expect(mockRescan).toHaveBeenCalledTimes(1);
      // loadCentralSkills is called twice: once on mount, once on refresh
      expect(mockLoadCentralSkills).toHaveBeenCalledTimes(2);
    });
  });

  // ── Install Dialog ────────────────────────────────────────────────────────

  it("opens install dialog when 'Install to...' is clicked", async () => {
    renderCentralSkillsView();
    const installBtn = screen.getAllByRole("button", {
      name: /将 .* 安装到平台/i,
    })[0];
    fireEvent.click(installBtn);

    // Dialog should open (skill name should appear in dialog title)
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("opens the skill detail drawer without navigating away", async () => {
    renderCentralSkillsView();

    fireEvent.click(screen.getByRole("button", { name: /查看 frontend-design 的详情/i }));

    await waitFor(() => {
      expect(screen.getByTestId("skill-detail-drawer")).toBeInTheDocument();
    });
    expect(screen.getByText("drawer-skill:frontend-design")).toBeInTheDocument();
  });

  it("offers post-import platform installation for imported skills", async () => {
    mockUseMarketplaceStore.mockImplementation((selector?: unknown) => {
      const state = {
        githubImport: {
          isPreviewLoading: false,
          isImporting: false,
          preview: null,
          importResult: {
            repo: {
              owner: "dorukardahan",
              repo: "twitterapi-io-skill",
              branch: "main",
              normalizedUrl: "https://github.com/dorukardahan/twitterapi-io-skill",
            },
            importedSkills: [
              {
                sourcePath: "twitterapi-io-skill/SKILL.md",
                originalSkillId: "frontend-design",
                importedSkillId: "frontend-design",
                skillName: "frontend-design",
                targetDirectory: "/Users/test/.agents/skills/frontend-design",
                resolution: "overwrite",
              },
            ],
            skippedSkills: [],
          },
          previewedRepoUrl: "https://github.com/dorukardahan/twitterapi-io-skill",
          error: null,
        },
        previewGitHubRepoImport: mockPreviewGitHubRepoImport,
        importGitHubRepoSkills: mockImportGitHubRepoSkills,
        resetGitHubImport: mockResetGitHubImport,
      };
      if (typeof selector === "function") return selector(state);
      return state;
    });

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /从 GitHub 导入/i }));

    expect(await screen.findByRole("button", { name: /安装到平台/i })).toBeInTheDocument();
  });

  it("shows the redesigned github confirm summary in the shared wizard", async () => {
    mockUseMarketplaceStore.mockImplementation((selector?: unknown) => {
      const state = {
        githubImport: {
          isPreviewLoading: false,
          isImporting: false,
          preview: {
            repo: {
              owner: "anthropics",
              repo: "skills",
              branch: "main",
              normalizedUrl: "https://github.com/anthropics/skills",
            },
            skills: [
              {
                sourcePath: "skills/first/SKILL.md",
                skillId: "frontend-design",
                skillName: "frontend-design",
                description: "First imported skill",
                rootDirectory: "skills",
                skillDirectoryName: "first",
                downloadUrl: "https://example.com/first",
                conflict: {
                  existingSkillId: "frontend-design",
                  existingName: "frontend-design",
                  existingCanonicalPath: "/Users/test/.agents/skills/frontend-design",
                  proposedSkillId: "frontend-design",
                  proposedName: "frontend-design",
                },
              },
            ],
            importResult: null,
            previewedRepoUrl: "https://github.com/anthropics/skills",
            error: null,
          },
          previewGitHubRepoImport: mockPreviewGitHubRepoImport,
          importGitHubRepoSkills: mockImportGitHubRepoSkills,
          resetGitHubImport: mockResetGitHubImport,
        },
        previewGitHubRepoImport: mockPreviewGitHubRepoImport,
        importGitHubRepoSkills: mockImportGitHubRepoSkills,
        resetGitHubImport: mockResetGitHubImport,
      };
      if (typeof selector === "function") return selector(state);
      return state;
    });

    render(
      <MemoryRouter>
        <CentralSkillsView />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /从 GitHub 导入/i }));
    fireEvent.click(screen.getByRole("button", { name: /检查导入内容/i }));

    expect(await screen.findByTestId("github-import-confirm-summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /返回预览修改/i })).toBeInTheDocument();
  });

  it("preserves search and scroll state when closing the drawer and restores focus", async () => {
    renderCentralSkillsView();

    const searchInput = screen.getByPlaceholderText(/搜索中央技能库/i);
    fireEvent.change(searchInput, { target: { value: "frontend" } });

    const scroller = searchInput.closest(".flex.flex-col.h-full")?.querySelector(".flex-1.overflow-auto.p-6");
    expect(scroller).not.toBeNull();
    if (!scroller) return;
    (scroller as HTMLDivElement).scrollTop = 240;

    const trigger = screen.getByRole("button", { name: /查看 frontend-design 的详情/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId("skill-detail-drawer")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /close drawer/i }));

    await waitFor(() => {
      expect(screen.queryByTestId("skill-detail-drawer")).not.toBeInTheDocument();
    });

    expect(searchInput).toHaveValue("frontend");
    expect((scroller as HTMLDivElement).scrollTop).toBe(240);
    expect(trigger).toHaveFocus();
  });
});
