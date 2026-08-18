import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { usePlatformStore } from "../stores/platformStore";
import type { DiscoveredProject, DiscoveredSkill, ObsidianVault } from "../types";
import {
  OBSIDIAN_CROSS_AREA_FIXTURE,
  obsidianCrossAreaProjects,
} from "./fixtures/obsidianCrossAreaFixture";

// Mock the platformStore to avoid real Tauri invocations
vi.mock("../stores/platformStore", () => ({
  usePlatformStore: vi.fn(),
}));

// Mock the collectionStore
vi.mock("../stores/collectionStore", () => ({
  useCollectionStore: vi.fn(),
}));

// Mock the discoverStore
vi.mock("../stores/discoverStore", () => ({
  useDiscoverStore: vi.fn(),
}));

vi.mock("../stores/obsidianStore", () => ({
  useObsidianStore: vi.fn(),
}));

import { useCollectionStore } from "../stores/collectionStore";
import { useDiscoverStore } from "../stores/discoverStore";
import { useObsidianStore } from "../stores/obsidianStore";

const mockAgents = [
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

const defaultStoreState = {
  agents: mockAgents,
  skillsByAgent: {
    "claude-code": 5,
    cursor: 3,
    central: 10,
  },
  isLoading: false,
  isRefreshing: false,
  error: null,
  initialize: vi.fn(),
  rescan: vi.fn(),
  refreshCounts: vi.fn(),
};

type SidebarPlatformState = Omit<typeof defaultStoreState, "skillsByAgent"> & {
  skillsByAgent: Record<string, number>;
};

const defaultCollectionState = {
  collections: [],
  currentDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  loadCollections: vi.fn(),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
  loadCollectionDetail: vi.fn(),
  addSkillToCollection: vi.fn(),
  removeSkillFromCollection: vi.fn(),
  batchInstallCollection: vi.fn(),
  exportCollection: vi.fn(),
  importCollection: vi.fn(),
  refreshCounts: vi.fn(),
};

const defaultDiscoverState = {
  totalSkillsFound: 0,
  discoveredProjects: [],
  loadDiscoveredSkills: vi.fn(),
};

const defaultObsidianState = {
  vaults: [],
  skillsByVault: {},
  isLoadingVaults: false,
  loadingSkillsByVault: {},
  error: null,
  loadVaults: vi.fn(),
  getVaultSkills: vi.fn(),
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-path">{location.pathname}</div>;
}

function createDiscoveredSkill(
  overrides: Partial<DiscoveredSkill> & Pick<DiscoveredSkill, "id" | "project_path" | "project_name">
): DiscoveredSkill {
  const platformId = overrides.platform_id ?? "obsidian";
  const platformName = overrides.platform_name ?? "Obsidian";
  const dirPath = overrides.dir_path ?? `${overrides.project_path}/.agents/skills/${overrides.id}`;
  return {
    name: overrides.name ?? overrides.id,
    description: overrides.description,
    file_path: overrides.file_path ?? `${dirPath}/SKILL.md`,
    dir_path: dirPath,
    is_already_central: overrides.is_already_central ?? false,
    ...overrides,
    platform_id: platformId,
    platform_name: platformName,
  };
}

function createDiscoveredProject(
  projectPath: string,
  projectName: string,
  skills: DiscoveredSkill[]
): DiscoveredProject {
  return {
    project_path: projectPath,
    project_name: projectName,
    skills,
  };
}

function renderSidebar(
  initialPath = "/central",
  options: {
    discoverProjects?: DiscoveredProject[];
    obsidianVaults?: ObsidianVault[];
    platformState?: SidebarPlatformState;
  } = {}
) {
  const discoveredProjects = options.discoverProjects ?? defaultDiscoverState.discoveredProjects;
  const obsidianVaults = options.obsidianVaults ?? discoveredProjects
    .filter((project) => project.skills.some((skill) => skill.platform_id === "obsidian"))
    .map((project) => ({
      id: project.project_path,
      name: project.project_name,
      path: project.project_path,
      skill_count: new Set(project.skills
        .filter((skill) => skill.platform_id === "obsidian")
        .map((skill) => skill.id || skill.dir_path || skill.file_path)).size,
    }));
  vi.mocked(usePlatformStore).mockReturnValue(defaultStoreState);
  if (options.platformState) {
    vi.mocked(usePlatformStore).mockReturnValue(options.platformState);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
    selector({
      ...defaultDiscoverState,
      discoveredProjects,
      totalSkillsFound: discoveredProjects.reduce((sum, project) => sum + project.skills.length, 0),
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useObsidianStore).mockImplementation((selector: any) =>
    selector({
      ...defaultObsidianState,
      vaults: obsidianVaults,
    })
  );
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage?.clear?.();
    // Default: collection store returns empty state.
    vi.mocked(useCollectionStore).mockImplementation((selector) =>
      selector(defaultCollectionState)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
      selector(defaultDiscoverState)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useObsidianStore).mockImplementation((selector: any) =>
      selector(defaultObsidianState)
    );
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders expanded sidebar by default", () => {
    const { container } = renderSidebar();
    const nav = container.querySelector("nav");
    expect(nav?.className).toContain("w-52");
  });

  it("renders platform agents as icon buttons", () => {
    renderSidebar();
    // Should show platform agents as buttons with title tooltips (not the central one)
    expect(screen.getByRole("button", { name: /Claude Code/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cursor/ })).toBeInTheDocument();
  });

  it("renders Central Skills icon button", () => {
    renderSidebar();
    expect(screen.getByRole("button", { name: /中央技能库/ })).toBeInTheDocument();
  });

  it("renders Collections icon button", () => {
    renderSidebar();
    // Use exact string match to avoid also matching "导入技能集"
    expect(screen.getByRole("button", { name: "技能集合" })).toBeInTheDocument();
  });

  it("new/import collection buttons are on the list page, not sidebar", () => {
    renderSidebar();
    expect(screen.queryByRole("button", { name: /新建技能集/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /导入技能集/i })).not.toBeInTheDocument();
  });

  it("does not render Settings (moved to TopBar)", () => {
    renderSidebar();
    // Settings button no longer exists in sidebar
    expect(screen.queryByRole("button", { name: /设置/ })).not.toBeInTheDocument();
  });

  it("does not render legacy section headers", () => {
    renderSidebar();
    // No "By Tool" header
    expect(screen.queryByText("按工具")).not.toBeInTheDocument();
    // No "+新建" text button
    expect(screen.queryByText("+ 新建")).not.toBeInTheDocument();
  });

  // ── Loading State ─────────────────────────────────────────────────────────

  it("shows loading spinner when isLoading is true", () => {
    vi.mocked(usePlatformStore).mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
    });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    // Should show a spinner (Loader2 with animate-spin)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("hides platform buttons when loading", () => {
    vi.mocked(usePlatformStore).mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
    });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: /Claude Code/ })).not.toBeInTheDocument();
  });

  // ── Active Route Highlighting ─────────────────────────────────────────────

  it("highlights active platform route in sidebar", () => {
    renderSidebar("/platform/claude-code");
    const claudeButton = screen.getByRole("button", { name: /Claude Code/ });
    expect(claudeButton.className).toContain("bg-hover-bg");
  });

  it("highlights Central Skills when on /central", () => {
    renderSidebar("/central");
    const centralButton = screen.getByRole("button", { name: /中央技能库/ });
    expect(centralButton.className).toContain("bg-hover-bg");
  });

  it("does not highlight Settings in sidebar (moved to TopBar)", () => {
    renderSidebar("/settings");
    // No settings button in sidebar anymore
    expect(screen.queryByRole("button", { name: /设置/ })).not.toBeInTheDocument();
  });

  // ── Empty States ──────────────────────────────────────────────────────────

  it("shows no platform buttons when only central agent exists", () => {
    vi.mocked(usePlatformStore).mockReturnValue({
      ...defaultStoreState,
      agents: [
        {
          id: "central",
          display_name: "Central Skills",
          category: "central",
          global_skills_dir: "~/.agents/skills/",
          is_detected: true,
          is_builtin: true,
          is_enabled: true,
        },
      ],
    });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: /Claude Code/ })).not.toBeInTheDocument();
  });

  it("hides agents with zero skills by default", () => {
    vi.mocked(usePlatformStore).mockReturnValue({
      ...defaultStoreState,
      skillsByAgent: {
        "claude-code": 0,
        cursor: 3,
        central: 10,
      },
    });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.queryByRole("button", { name: /Claude Code/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cursor/ })).toBeInTheDocument();
  });

  it("shows hidden agents after clicking toggle", () => {
    vi.mocked(usePlatformStore).mockReturnValue({
      ...defaultStoreState,
      skillsByAgent: {
        "claude-code": 0,
        cursor: 3,
        central: 10,
      },
    });
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: "显示所有平台" }));
    expect(screen.getByRole("button", { name: /Claude Code/ })).toBeInTheDocument();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it("platform buttons are clickable", () => {
    renderSidebar();
    const claudeButton = screen.getByRole("button", { name: /Claude Code/ });
    expect(claudeButton).not.toBeDisabled();
    fireEvent.click(claudeButton);
  });

  it("Central Skills button is clickable", () => {
    renderSidebar();
    const centralButton = screen.getByRole("button", { name: /中央技能库/ });
    expect(centralButton).not.toBeDisabled();
    fireEvent.click(centralButton);
  });

  // ── Collections ───────────────────────────────────────────────────────────

  it("collections button navigates to /collections list page", () => {
    vi.mocked(useCollectionStore).mockImplementation((selector) =>
      selector({
        ...defaultCollectionState,
        collections: [
          { id: "col-1", name: "Frontend", created_at: "2026-04-09T00:00:00Z", updated_at: "2026-04-09T00:00:00Z" },
          { id: "col-2", name: "Backend", created_at: "2026-04-09T00:00:00Z", updated_at: "2026-04-09T00:00:00Z" },
        ],
      })
    );
    renderSidebar();
    expect(screen.getByRole("button", { name: "技能集合" })).toBeInTheDocument();
  });

  it("highlights active collection route", () => {
    vi.mocked(useCollectionStore).mockImplementation((selector) =>
      selector({
        ...defaultCollectionState,
        collections: [
          { id: "col-1", name: "Frontend", created_at: "2026-04-09T00:00:00Z", updated_at: "2026-04-09T00:00:00Z" },
        ],
      })
    );
    vi.mocked(usePlatformStore).mockReturnValue(defaultStoreState);
    render(
      <MemoryRouter initialEntries={["/collections"]}>
        <Sidebar />
      </MemoryRouter>
    );
    // The collections icon button should be highlighted (exact match)
    const colButton = screen.getByRole("button", { name: "技能集合" });
    expect(colButton.className).toContain("bg-hover-bg");
  });

  // ── Discover ─────────────────────────────────────────────────────────────

  it("renders Discover entry in sidebar", () => {
    renderSidebar();
    expect(screen.getByRole("button", { name: "项目技能库" })).toBeInTheDocument();
  });

  it("renders show all platforms toggle", () => {
    renderSidebar();
    expect(screen.getByRole("button", { name: "显示所有平台" })).toBeInTheDocument();
  });

  it("renders Obsidian as a separate category with one deduped row per populated vault", () => {
    const alphaPath = "/vaults/Alpha";
    const zetaPath = "/vaults/Zeta";
    const ordinaryPath = "/workspace/app";
    const discoverProjects = [
      createDiscoveredProject(zetaPath, "Zeta", [
        createDiscoveredSkill({ id: "daily-notes", project_path: zetaPath, project_name: "Zeta" }),
        createDiscoveredSkill({ id: "daily-notes", project_path: zetaPath, project_name: "Zeta" }),
      ]),
      createDiscoveredProject(ordinaryPath, "App", [
        createDiscoveredSkill({
          id: "claude-local",
          project_path: ordinaryPath,
          project_name: "App",
          platform_id: "claude-code",
          platform_name: "Claude Code",
        }),
      ]),
      createDiscoveredProject(alphaPath, "Alpha", [
        createDiscoveredSkill({ id: "alpha-one", project_path: alphaPath, project_name: "Alpha" }),
        createDiscoveredSkill({ id: "alpha-two", project_path: alphaPath, project_name: "Alpha" }),
      ]),
    ];

    const { container } = renderSidebar("/central", { discoverProjects });

    expect(screen.getByText("Obsidian")).toBeInTheDocument();
    const alphaButton = screen.getByRole("button", { name: /Alpha/ });
    const zetaButton = screen.getByRole("button", { name: /Zeta/ });
    expect(within(alphaButton).getByText("2")).toBeInTheDocument();
    expect(within(zetaButton).getByText("1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /App/ })).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain("/platform/obsidian");
  });

  it("uses the correlated make-money fixture for the Obsidian sidebar row and route", () => {
    renderSidebar("/central", {
      discoverProjects: obsidianCrossAreaProjects,
    });

    const vaultButton = screen.getByRole("button", {
      name: new RegExp(OBSIDIAN_CROSS_AREA_FIXTURE.vaultName),
    });
    expect(vaultButton).toHaveAttribute(
      "title",
      expect.stringContaining(OBSIDIAN_CROSS_AREA_FIXTURE.vaultPath)
    );
    expect(within(vaultButton).getByText("1")).toBeInTheDocument();

    fireEvent.click(vaultButton);

    expect(screen.getByTestId("location-path")).toHaveTextContent(
      `/obsidian/${encodeURIComponent(OBSIDIAN_CROSS_AREA_FIXTURE.vaultPath)}`
    );
  });

  it("hides the Obsidian category when no vault projects contain Obsidian skills", () => {
    const ordinaryPath = "/workspace/app";
    renderSidebar("/central", {
      obsidianVaults: [],
      discoverProjects: [
        createDiscoveredProject(ordinaryPath, "App", [
          createDiscoveredSkill({
            id: "claude-local",
            project_path: ordinaryPath,
            project_name: "App",
            platform_id: "claude-code",
            platform_name: "Claude Code",
          }),
        ]),
      ],
    });

    expect(screen.queryByText("Obsidian")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /App/ })).not.toBeInTheDocument();
  });

  it("renders Obsidian vaults from the vault store instead of discovered projects", () => {
    renderSidebar("/central", {
      discoverProjects: [
        createDiscoveredProject("/wrong/0412", "0412", [
          createDiscoveredSkill({ id: "wrong", project_path: "/wrong/0412", project_name: "0412" }),
        ]),
      ],
      obsidianVaults: [
        { id: "happy", name: "happy-geek", path: "/vaults/happy-geek", skill_count: 3 },
        { id: "money", name: "make-money", path: "/vaults/make-money", skill_count: 2 },
        { id: "wiz", name: "wiznote-bak", path: "/vaults/wiznote-bak", skill_count: 1 },
      ],
    });

    expect(screen.getByRole("button", { name: /happy-geek/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /make-money/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wiznote-bak/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /0412/ })).not.toBeInTheDocument();
  });

  it("hides zero-skill Obsidian vaults from the vault store", () => {
    renderSidebar("/central", {
      obsidianVaults: [
        { id: "happy", name: "happy-geek", path: "/vaults/happy-geek", skill_count: 0 },
        { id: "money", name: "make-money", path: "/vaults/make-money", skill_count: 2 },
        { id: "wiz", name: "wiznote-bak", path: "/vaults/wiznote-bak", skill_count: 0 },
      ],
    });

    expect(screen.getByRole("button", { name: /make-money/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /happy-geek/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /wiznote-bak/ })).not.toBeInTheDocument();
  });

  it("navigates vault rows to the Obsidian route with exactly one encoded vault id", () => {
    const vaultPath =
      "/Users/happypeet/Library/Mobile Documents/iCloud~md~obsidian/Documents/make money 100% #notes?中文";
    renderSidebar("/central", {
      discoverProjects: [
        createDiscoveredProject(vaultPath, "make money", [
          createDiscoveredSkill({ id: "vault-skill", project_path: vaultPath, project_name: "make money" }),
        ]),
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: /make money/ }));

    expect(screen.getByTestId("location-path")).toHaveTextContent(
      `/obsidian/${encodeURIComponent(vaultPath)}`
    );
  });

  it("marks the active vault row by id and keeps collapsed rows accessible", () => {
    const activePath = "/vaults/current";
    const otherPath = "/vaults/other";
    renderSidebar(`/obsidian/${encodeURIComponent(activePath)}`, {
      discoverProjects: [
        createDiscoveredProject(activePath, "Current", [
          createDiscoveredSkill({ id: "current-skill", project_path: activePath, project_name: "Current" }),
        ]),
        createDiscoveredProject(otherPath, "Other", [
          createDiscoveredSkill({ id: "other-skill", project_path: otherPath, project_name: "Other" }),
        ]),
      ],
    });

    const activeButton = screen.getByRole("button", { name: /Current/ });
    const otherButton = screen.getByRole("button", { name: /Other/ });
    expect(activeButton).toHaveAttribute("aria-current", "page");
    expect(otherButton).not.toHaveAttribute("aria-current");

    fireEvent.click(screen.getByRole("button", { name: /折叠侧边栏/i }));
    const collapsedVaultButton = screen.getByRole("button", { name: /Other/ });
    expect(collapsedVaultButton).toHaveAttribute("title", expect.stringContaining(otherPath));
    fireEvent.click(collapsedVaultButton);
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      `/obsidian/${encodeURIComponent(otherPath)}`
    );
  });

  it("keeps populated Obsidian vault rows visible when show-all-platforms toggles normal agents", () => {
    const vaultPath = "/vaults/toggle-proof";
    renderSidebar("/central", {
      platformState: {
        ...defaultStoreState,
        skillsByAgent: {
          "claude-code": 0,
          cursor: 3,
          central: 10,
        },
      },
      discoverProjects: [
        createDiscoveredProject(vaultPath, "Toggle Proof", [
          createDiscoveredSkill({ id: "vault-skill", project_path: vaultPath, project_name: "Toggle Proof" }),
        ]),
      ],
    });

    expect(screen.getByRole("button", { name: /Toggle Proof/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Claude Code/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "显示所有平台" }));

    expect(screen.getByRole("button", { name: /Toggle Proof/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Claude Code/ })).toBeInTheDocument();
  });

  it("disambiguates duplicate vault names by full path and highlights only the selected path", () => {
    const firstPath = "/Users/alice/Documents/Notes";
    const secondPath = "/Users/bob/Documents/Notes";
    renderSidebar(`/obsidian/${encodeURIComponent(secondPath)}`, {
      discoverProjects: [
        createDiscoveredProject(firstPath, "Notes", [
          createDiscoveredSkill({ id: "first-skill", project_path: firstPath, project_name: "Notes" }),
        ]),
        createDiscoveredProject(secondPath, "Notes", [
          createDiscoveredSkill({ id: "second-skill", project_path: secondPath, project_name: "Notes" }),
        ]),
      ],
    });

    const noteButtons = screen.getAllByRole("button", { name: /Notes/ });
    expect(noteButtons).toHaveLength(2);
    expect(noteButtons[0]).toHaveAttribute("title", expect.stringContaining(firstPath));
    expect(noteButtons[1]).toHaveAttribute("title", expect.stringContaining(secondPath));
    expect(noteButtons[0]).not.toHaveAttribute("aria-current");
    expect(noteButtons[1]).toHaveAttribute("aria-current", "page");

    fireEvent.click(noteButtons[0]);
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      `/obsidian/${encodeURIComponent(firstPath)}`
    );
    fireEvent.click(noteButtons[1]);
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      `/obsidian/${encodeURIComponent(secondPath)}`
    );
  });

  it("places the Obsidian section before ordinary platform categories and the show-all toggle", () => {
    const vaultPath = "/vaults/ordered";
    renderSidebar("/central", {
      platformState: {
        ...defaultStoreState,
        agents: [
          ...mockAgents,
          {
            id: "openclaw",
            display_name: "OpenClaw",
            category: "lobster",
            global_skills_dir: "~/.openclaw/skills/",
            is_detected: true,
            is_builtin: true,
            is_enabled: true,
          },
        ],
        skillsByAgent: {
          ...defaultStoreState.skillsByAgent,
          openclaw: 1,
        } as Record<string, number>,
      },
      discoverProjects: [
        createDiscoveredProject(vaultPath, "Ordered", [
          createDiscoveredSkill({ id: "ordered-skill", project_path: vaultPath, project_name: "Ordered" }),
        ]),
      ],
    });

    const discoverButton = screen.getByRole("button", { name: "项目技能库" });
    const obsidianHeading = screen.getByText("Obsidian");
    const lobsterHeading = screen.getByText("龙虾类");
    const codingHeading = screen.getByText("编程类");
    const toggle = screen.getByRole("button", { name: "显示所有平台" });

    expect(discoverButton.compareDocumentPosition(obsidianHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(obsidianHeading.compareDocumentPosition(lobsterHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(lobsterHeading.compareDocumentPosition(codingHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(codingHeading.compareDocumentPosition(toggle)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  // ── Collapse Toggle ───────────────────────────────────────────────────────

  it("renders collapse toggle button", () => {
    renderSidebar();
    // Default is expanded, so the button label is "collapse"
    expect(screen.getByRole("button", { name: /折叠侧边栏/i })).toBeInTheDocument();
  });
});
