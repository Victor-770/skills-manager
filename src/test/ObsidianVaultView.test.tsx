import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ObsidianVaultView } from "../pages/ObsidianVaultView";
import { DiscoveredSkill, ObsidianVault } from "../types";

vi.mock("../stores/obsidianStore", () => ({
  useObsidianStore: vi.fn(),
}));

vi.mock("../stores/discoverStore", () => ({
  useDiscoverStore: vi.fn(),
}));

vi.mock("../stores/platformStore", () => ({
  usePlatformStore: vi.fn(),
}));

vi.mock("../components/skill/SkillDetailDrawer", () => ({
  SkillDetailDrawer: ({
    open,
    filePath,
  }: {
    open: boolean;
    filePath?: string | null;
  }) =>
    open ? (
      <div data-testid="skill-detail-drawer">
        <div>drawer-file:{filePath ?? "none"}</div>
      </div>
    ) : null,
}));

import { useObsidianStore } from "../stores/obsidianStore";
import { useDiscoverStore } from "../stores/discoverStore";
import { usePlatformStore } from "../stores/platformStore";

const mockVault: ObsidianVault = {
  id: "make-money",
  name: "make-money",
  path: "/Users/test/Library/Mobile Documents/com~apple~CloudDocs/make-money",
  skill_count: 2,
};

const mockSkills: DiscoveredSkill[] = [
  {
    id: "obsidian__make__money-researcher",
    name: "money-researcher",
    description: "Research money workflows",
    file_path: `${mockVault.path}/.agents/skills/money-researcher/SKILL.md`,
    dir_path: `${mockVault.path}/.agents/skills/money-researcher`,
    platform_id: "obsidian",
    platform_name: "Obsidian",
    project_path: mockVault.path,
    project_name: mockVault.name,
    is_already_central: false,
  },
  {
    id: "obsidian__make__daily-review",
    name: "daily-review",
    description: "Daily review notes",
    file_path: `${mockVault.path}/.agents/skills/daily-review/SKILL.md`,
    dir_path: `${mockVault.path}/.agents/skills/daily-review`,
    platform_id: "obsidian",
    platform_name: "Obsidian",
    project_path: mockVault.path,
    project_name: mockVault.name,
    is_already_central: true,
  },
];

const mockLoadVaults = vi.fn();
const mockGetVaultSkills = vi.fn();
const mockImportToCentral = vi.fn();
const mockImportToPlatform = vi.fn();
const mockRefreshDiscoverCounts = vi.fn();
const mockRefreshCounts = vi.fn();

function installStoreMocks() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useObsidianStore).mockImplementation((selector: any) =>
    selector({
      vaults: [mockVault],
      skillsByVault: { [mockVault.id]: mockSkills },
      isLoadingVaults: false,
      loadingSkillsByVault: { [mockVault.id]: false },
      error: null,
      loadVaults: mockLoadVaults,
      getVaultSkills: mockGetVaultSkills,
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
    selector({
      importToCentral: mockImportToCentral,
      importToPlatform: mockImportToPlatform,
      refreshCounts: mockRefreshDiscoverCounts,
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(usePlatformStore).mockImplementation((selector: any) =>
    selector({
      agents: [],
      refreshCounts: mockRefreshCounts,
    })
  );
}

function renderView(vaultId = mockVault.id) {
  return render(
    <MemoryRouter initialEntries={[`/obsidian/${encodeURIComponent(vaultId)}`]}>
      <Routes>
        <Route path="/obsidian/:vaultId" element={<ObsidianVaultView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ObsidianVaultView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installStoreMocks();
  });

  it("renders a platform-like Obsidian vault header and skill cards", () => {
    renderView();

    expect(screen.getByRole("heading", { name: "make-money" })).toBeInTheDocument();
    expect(screen.getByText(mockVault.path)).toBeInTheDocument();
    expect(screen.getByText("money-researcher")).toBeInTheDocument();
    expect(screen.getByText("daily-review")).toBeInTheDocument();
    expect(mockLoadVaults).toHaveBeenCalled();
    expect(mockGetVaultSkills).toHaveBeenCalledWith("make-money");
  });

  it("filters skills using the platform-style search bar", () => {
    renderView();

    fireEvent.change(screen.getByPlaceholderText("搜索技能..."), {
      target: { value: "money" },
    });

    expect(screen.getByText("money-researcher")).toBeInTheDocument();
    expect(screen.queryByText("daily-review")).not.toBeInTheDocument();
  });

  it("opens skill details from the source file path", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: /money-researcher/ }));

    expect(screen.getByTestId("skill-detail-drawer")).toHaveTextContent(
      `drawer-file:${mockSkills[0].file_path}`
    );
  });
});
