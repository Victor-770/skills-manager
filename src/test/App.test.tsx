import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";

// Mock platformStore to prevent real Tauri invoke calls during tests
vi.mock("../stores/platformStore", () => ({
  usePlatformStore: vi.fn().mockImplementation((selector?: unknown) => {
    const state = {
      agents: [],
      skillsByAgent: {},
      isLoading: false,
      error: null,
      initialize: vi.fn(),
      rescan: vi.fn(),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
}));

// Mock collectionStore to prevent real Tauri invoke calls during tests
vi.mock("../stores/collectionStore", () => ({
  useCollectionStore: vi.fn().mockImplementation((selector?: unknown) => {
    const state = {
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
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
}));

// Mock centralSkillsStore to prevent async state updates that cause act() warnings
vi.mock("../stores/centralSkillsStore", () => ({
  useCentralSkillsStore: vi.fn().mockImplementation((selector?: unknown) => {
    const state = {
      skills: [],
      agents: [],
      isLoading: false,
      isInstalling: false,
      error: null,
      loadCentralSkills: vi.fn().mockResolvedValue(undefined),
      installSkill: vi.fn(),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
}));

vi.mock("../stores/discoverStore", () => ({
  useDiscoverStore: vi.fn().mockImplementation((selector?: unknown) => {
    const state = {
      totalSkillsFound: 0,
      discoveredProjects: [],
      loadDiscoveredSkills: vi.fn().mockResolvedValue(undefined),
      rescanFromDisk: vi.fn().mockResolvedValue(undefined),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
}));

vi.mock("../stores/obsidianStore", () => ({
  useObsidianStore: vi.fn().mockImplementation((selector?: unknown) => {
    const state = {
      vaults: [],
      skillsByVault: {},
      isLoadingVaults: false,
      loadingSkillsByVault: {},
      error: null,
      loadVaults: vi.fn().mockResolvedValue(undefined),
      getVaultSkills: vi.fn().mockResolvedValue(undefined),
    };
    if (typeof selector === "function") {
      return selector(state);
    }
    return state;
  }),
}));

describe("App", () => {
  it("renders the app shell with top bar", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/central"]}>
          <App />
        </MemoryRouter>
      );
    });
    // TopBar shows the app name
    expect(screen.getByText("skills-manage")).toBeInTheDocument();
  });

  it("renders sidebar with icon-only navigation", async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={["/central"]}>
          <App />
        </MemoryRouter>
      );
    });
    // "中央技能库" appears as icon button tooltip in sidebar + possibly in main content header
    expect(screen.getAllByText("中央技能库").length).toBeGreaterThanOrEqual(1);
    // Icon-only sidebar has no "By Tool" section header
    expect(screen.queryByText("按工具")).not.toBeInTheDocument();
  });
});
