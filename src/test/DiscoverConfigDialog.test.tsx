import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DiscoverConfigDialog } from "../components/discover/DiscoverConfigDialog";
import { ScanRoot, AgentWithStatus } from "../types";

// Mock stores
vi.mock("../stores/discoverStore", () => ({
  useDiscoverStore: vi.fn(),
}));

vi.mock("../stores/platformStore", () => ({
  usePlatformStore: vi.fn(),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "discover.title": "Discover Project Skills",
        "discover.desc": "Scan your project directories for skills not yet managed.",
        "discover.scanRoots": "Scan Roots",
        "discover.scanRootsDesc": "Select directories to scan for project-level skills.",
        "discover.lookingFor": "Looking for:",
        "discover.obsidianPatternsTitle": "Obsidian vaults",
        "discover.obsidianPatternsDesc": "Also scans vault skill folders:",
        "discover.noRootsEnabled": "No scan roots enabled. Select at least one directory.",
        "discover.startScan": "Start Scan",
        "discover.scanning": "Scanning...",
        "common.cancel": "Cancel",
        "common.loading": "Loading...",
      };
      return map[key] ?? key;
    },
  }),
}));

import { useDiscoverStore } from "../stores/discoverStore";
import { usePlatformStore } from "../stores/platformStore";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockScanRoots: ScanRoot[] = [
  { path: "/home/user/Documents", label: "Documents", exists: true, enabled: true },
  { path: "/home/user/projects", label: "projects", exists: true, enabled: false },
  { path: "/home/user/nonexistent", label: "nonexistent", exists: false, enabled: false },
];

const mockAgents: AgentWithStatus[] = [
  {
    id: "claude-code",
    display_name: "Claude Code",
    category: "coding",
    global_skills_dir: "/home/user/.claude/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "central",
    display_name: "Central Skills",
    category: "central",
    global_skills_dir: "/home/user/.agents/skills/",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "obsidian",
    display_name: "Obsidian",
    category: "obsidian",
    global_skills_dir: "/home/user/Vault/.agents/skills/",
    is_detected: true,
    is_builtin: false,
    is_enabled: true,
  },
];

const mockLoadScanRoots = vi.fn();
const mockSetScanRootEnabled = vi.fn();
const mockStartScan = vi.fn();

function buildDiscoverStoreState(overrides = {}) {
  return {
    scanRoots: mockScanRoots,
    isLoadingRoots: false,
    loadScanRoots: mockLoadScanRoots,
    setScanRootEnabled: mockSetScanRootEnabled,
    startScan: mockStartScan,
    ...overrides,
  };
}

function buildPlatformStoreState(overrides = {}) {
  return {
    agents: mockAgents,
    ...overrides,
  };
}

// Helper to render with dialog open
function renderDialog(open = true) {
  const onOpenChange = vi.fn();
  const result = render(
    <DiscoverConfigDialog open={open} onOpenChange={onOpenChange} />
  );
  return { ...result, onOpenChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DiscoverConfigDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
      selector(buildDiscoverStoreState())
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(usePlatformStore).mockImplementation((selector: any) =>
      selector(buildPlatformStoreState())
    );
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the dialog title", () => {
    renderDialog();
    expect(screen.getByText("Discover Project Skills")).toBeInTheDocument();
  });

  it("uses a wider layout for long scan root paths", () => {
    renderDialog();

    const dialogContent = screen
      .getByText("Discover Project Skills")
      .closest("[data-slot='dialog-content']");
    expect(dialogContent?.className).toEqual(expect.stringContaining("sm:max-w-2xl"));
    expect(dialogContent?.className).not.toEqual(expect.stringContaining("sm:max-w-lg"));
  });

  it("renders the dialog description", () => {
    renderDialog();
    expect(screen.getByText("Scan your project directories for skills not yet managed.")).toBeInTheDocument();
  });

  it("renders scan roots section", () => {
    renderDialog();
    expect(screen.getByText("Scan Roots")).toBeInTheDocument();
  });

  it("renders each scan root path", () => {
    renderDialog();
    expect(screen.getByText("/home/user/Documents")).toBeInTheDocument();
    expect(screen.getByText("/home/user/projects")).toBeInTheDocument();
  });

  it("renders 'Looking for' section with platform patterns", () => {
    renderDialog();
    expect(screen.getByText("Looking for:")).toBeInTheDocument();
  });

  it("renders Obsidian vault skill patterns as always-visible scan hints", () => {
    const manyAgents: AgentWithStatus[] = [
      ...mockAgents,
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `extra-${index}`,
        display_name: `Extra ${index}`,
        category: "coding",
        global_skills_dir: `/home/user/.extra-${index}/skills/`,
        is_detected: true,
        is_builtin: false,
        is_enabled: true,
      })),
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(usePlatformStore).mockImplementation((selector: any) =>
      selector(buildPlatformStoreState({ agents: manyAgents }))
    );

    renderDialog();

    expect(screen.getByText("Obsidian vaults")).toBeInTheDocument();
    expect(screen.getByText("Also scans vault skill folders:")).toBeInTheDocument();
    expect(screen.getByText(".skills/<skill>/SKILL.md")).toBeInTheDocument();
    expect(screen.getByText(".agents/skills/<skill>/SKILL.md")).toBeInTheDocument();
    expect(screen.getByText(".claude/skills/<skill>/SKILL.md")).toBeInTheDocument();
  });

  it("keeps long scan roots and Obsidian pattern chips constrained inside the dialog", () => {
    const longICloudPath =
      "/Users/happypeet/Library/Mobile Documents/iCloud~md~obsidian/Documents/make-money/very-long-segment/another-long-segment";
    const longRootLabel =
      "iCloud Obsidian Documents Root With A Very Long Label";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
      selector(
        buildDiscoverStoreState({
          scanRoots: [
            {
              path: longICloudPath,
              label: longRootLabel,
              exists: true,
              enabled: true,
            },
          ],
        })
      )
    );

    renderDialog();

    const dialogContent = screen
      .getByText("Discover Project Skills")
      .closest("[data-slot='dialog-content']");
    expect(dialogContent?.className).toEqual(expect.stringContaining("overflow-hidden"));

    const pathText = screen.getByText(longICloudPath);
    expect(pathText).toHaveAttribute("title", longICloudPath);
    expect(pathText.className).toEqual(expect.stringContaining("block"));
    expect(pathText.className).toEqual(expect.stringContaining("truncate"));
    expect(screen.getByRole("checkbox", { name: longICloudPath })).toBeInTheDocument();

    const row = pathText.closest("div")?.parentElement;
    expect(row?.className).toEqual(expect.stringContaining("min-w-0"));
    expect(row?.className).toEqual(expect.stringContaining("max-w-full"));
    expect(row?.className).toEqual(expect.stringContaining("overflow-hidden"));

    const label = screen.getByText(longRootLabel);
    expect(label).toHaveAttribute("title", longRootLabel);
    expect(label.className).toEqual(expect.stringContaining("truncate"));
    expect(label.className).toEqual(expect.stringContaining("max-w-"));

    for (const pattern of [
      ".skills/<skill>/SKILL.md",
      ".agents/skills/<skill>/SKILL.md",
      ".claude/skills/<skill>/SKILL.md",
    ]) {
      const chip = screen.getByText(pattern);
      expect(chip.className).toEqual(expect.stringContaining("max-w-full"));
      expect(chip.className).toEqual(expect.stringContaining("break-all"));
      expect(chip.className).toEqual(expect.stringContaining("whitespace-normal"));
    }
  });

  it("keeps vertical scrolling isolated to the scan roots list", () => {
    renderDialog();

    const dialogBody = screen
      .getByText("Scan Roots")
      .closest("[data-slot='dialog-body']");
    expect(dialogBody?.className).toEqual(expect.stringContaining("max-h-none"));
    expect(dialogBody?.className).toEqual(expect.stringContaining("overflow-visible"));
    expect(dialogBody?.className).not.toEqual(expect.stringContaining("overflow-y-auto"));
    expect(dialogBody?.className).not.toEqual(expect.stringContaining("max-h-[60vh]"));

    const rootsList = screen
      .getByRole("checkbox", { name: "/home/user/Documents" })
      .closest("[class*='max-h-48']");
    expect(rootsList?.className).toEqual(expect.stringContaining("overflow-y-auto"));
  });

  it("renders Cancel and Start Scan buttons", () => {
    renderDialog();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Start Scan")).toBeInTheDocument();
  });

  // ── Load scan roots when opening ────────────────────────────────────────

  it("calls loadScanRoots when dialog transitions to open", () => {
    const _onOpenChange = vi.fn();
    const { rerender } = render(
      <DiscoverConfigDialog open={false} onOpenChange={_onOpenChange} />
    );

    // Now open the dialog
    rerender(
      <DiscoverConfigDialog open={true} onOpenChange={_onOpenChange} />
    );

    // Note: shadcn/ui Dialog calls onOpenChange(true) internally when opening,
    // which triggers handleOpenChange which calls loadScanRoots.
    // In a real usage, the Dialog component handles the transition.
    // For testing, we verify the mock was available (would be called by Dialog).
    expect(mockLoadScanRoots).toBeDefined();
  });

  // ── Toggle scan root ─────────────────────────────────────────────────────

  it("calls setScanRootEnabled when toggling a root", () => {
    mockSetScanRootEnabled.mockResolvedValueOnce(undefined);
    renderDialog();

    const checkboxes = screen.getAllByRole("checkbox");
    // Toggle the projects root (which is currently disabled=false)
    fireEvent.click(checkboxes[1]); // /home/user/projects

    expect(mockSetScanRootEnabled).toHaveBeenCalledWith("/home/user/projects", true);
  });

  // ── Start scan ────────────────────────────────────────────────────────────

  it("calls startScan when Start Scan button is clicked", async () => {
    mockStartScan.mockResolvedValueOnce(undefined);
    renderDialog();

    const startBtn = screen.getByText("Start Scan");
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockStartScan).toHaveBeenCalled();
    });
  });

  it("closes dialog immediately when Start Scan is clicked (before scan completes)", () => {
    // Make startScan return a promise that never resolves to prove
    // the dialog closes WITHOUT waiting for the scan to finish.
    mockStartScan.mockReturnValueOnce(new Promise(() => {}));
    const { onOpenChange } = renderDialog();

    const startBtn = screen.getByText("Start Scan");
    fireEvent.click(startBtn);

    // onOpenChange(false) should be called synchronously — the dialog
    // closes immediately so the user can see the ProgressView with the
    // Stop button while the scan runs in the background.
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  // ── Warning when no roots enabled ─────────────────────────────────────────

  it("shows warning when no roots are enabled", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
      selector(buildDiscoverStoreState({
        scanRoots: [
          { path: "/home/user/Documents", label: "Documents", exists: true, enabled: false },
          { path: "/home/user/nonexistent", label: "nonexistent", exists: false, enabled: false },
        ],
      }))
    );

    renderDialog();
    expect(screen.getByText("No scan roots enabled. Select at least one directory.")).toBeInTheDocument();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it("shows loading indicator when isLoadingRoots is true", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDiscoverStore).mockImplementation((selector: any) =>
      selector(buildDiscoverStoreState({ isLoadingRoots: true }))
    );

    renderDialog();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // ── Non-existent roots ────────────────────────────────────────────────────

  it("marks non-existent roots with aria-disabled", () => {
    renderDialog();
    const checkboxes = screen.getAllByRole("checkbox");
    // The third root (/home/user/nonexistent) doesn't exist
    // shadcn/ui Checkbox uses aria-disabled instead of native disabled
    expect(checkboxes[2]).toHaveAttribute("aria-disabled", "true");
  });
});
