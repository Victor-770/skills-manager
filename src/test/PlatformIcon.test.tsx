import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PlatformIcon } from "../components/platform/PlatformIcon";

// ─── All known platform agent IDs ─────────────────────────────────────────────

const ORIGINAL_PLATFORM_IDS = [
  "claude-code",
  "codex",
  "cursor",
  "gemini-cli",
  "trae",
  "factory-droid",
  "openclaw",
  "qclaw",
  "easyclaw",
  "workbuddy",
  "central",
];

const NEW_PLATFORM_IDS = [
  "junie",
  "qwen",
  "trae-cn",
  "windsurf",
  "qoder",
  "augment",
  "opencode",
  "kilocode",
  "ob1",
  "amp",
  "antigravity",
  "cline",
  "deep-agents",
  "dexto",
  "firebender",
  "kimi-code-cli",
  "kiro",
  "codebuddy",
  "hermes",
  "autoclaw",
  "copilot",
  "warp",
  "aider",
  "aider-desk",
  "bob",
  "codearts-agent",
  "codemaker",
  "codestudio",
  "command-code",
  "continue",
  "cortex",
  "crush",
  "devin",
  "forgecode",
  "goose",
  "iflow-cli",
  "kode",
  "mcpjam",
  "mistral-vibe",
  "mux",
  "openhands",
  "pi",
  "rovodev",
  "roo",
  "tabnine-cli",
  "zencoder",
  "neovate",
  "pochi",
  "adal",
  "obsidian",
];

const ALL_PLATFORM_IDS = [...ORIGINAL_PLATFORM_IDS, ...NEW_PLATFORM_IDS];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PlatformIcon", () => {
  // ── Rendering — original platforms ────────────────────────────────────────

  it("renders an SVG element for claude-code", () => {
    const { container } = render(<PlatformIcon agentId="claude-code" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("does not expose Antigravity metadata for claude-code", () => {
    const { container } = render(<PlatformIcon agentId="claude-code" />);
    expect(container.textContent).not.toContain("Antigravity");
  });

  it("uses a 24px viewBox for claude-code to avoid clipping", () => {
    const { container } = render(<PlatformIcon agentId="claude-code" />);
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("renders an img element for codex", () => {
    const { container } = render(<PlatformIcon agentId="codex" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for cursor", () => {
    const { container } = render(<PlatformIcon agentId="cursor" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an SVG element for gemini-cli", () => {
    const { container } = render(<PlatformIcon agentId="gemini-cli" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an img element for trae", () => {
    const { container } = render(<PlatformIcon agentId="trae" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for factory-droid", () => {
    const { container } = render(<PlatformIcon agentId="factory-droid" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for openclaw", () => {
    const { container } = render(<PlatformIcon agentId="openclaw" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for qclaw", () => {
    const { container } = render(<PlatformIcon agentId="qclaw" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for easyclaw", () => {
    const { container } = render(<PlatformIcon agentId="easyclaw" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for workbuddy", () => {
    const { container } = render(<PlatformIcon agentId="workbuddy" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an SVG element for central", () => {
    const { container } = render(<PlatformIcon agentId="central" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  // ── Rendering — new platform icons ────────────────────────────────────────

  it("renders an SVG element for junie", () => {
    const { container } = render(<PlatformIcon agentId="junie" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for qwen", () => {
    const { container } = render(<PlatformIcon agentId="qwen" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an img element for trae-cn", () => {
    const { container } = render(<PlatformIcon agentId="trae-cn" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for windsurf", () => {
    const { container } = render(<PlatformIcon agentId="windsurf" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for qoder", () => {
    const { container } = render(<PlatformIcon agentId="qoder" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an SVG element for augment", () => {
    const { container } = render(<PlatformIcon agentId="augment" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for opencode", () => {
    const { container } = render(<PlatformIcon agentId="opencode" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for kilocode", () => {
    const { container } = render(<PlatformIcon agentId="kilocode" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for ob1", () => {
    const { container } = render(<PlatformIcon agentId="ob1" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for amp", () => {
    const { container } = render(<PlatformIcon agentId="amp" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders SVG elements for universal .agents platforms", () => {
    for (const agentId of [
      "antigravity",
      "cline",
      "deep-agents",
      "dexto",
      "firebender",
      "kimi-code-cli",
      "warp",
    ]) {
      const { container } = render(<PlatformIcon agentId={agentId} />);
      expect(container.querySelector("svg"), agentId).toBeInTheDocument();
    }
  });

  it("renders an img element for kiro", () => {
    const { container } = render(<PlatformIcon agentId="kiro" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for codebuddy", () => {
    const { container } = render(<PlatformIcon agentId="codebuddy" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for hermes", () => {
    const { container } = render(<PlatformIcon agentId="hermes" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an img element for autoclaw", () => {
    const { container } = render(<PlatformIcon agentId="autoclaw" />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders an SVG element for copilot", () => {
    const { container } = render(<PlatformIcon agentId="copilot" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an SVG element for aider", () => {
    const { container } = render(<PlatformIcon agentId="aider" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders SVG elements for the 39 platform directory additions", () => {
    for (const agentId of [
      "aider-desk",
      "bob",
      "codearts-agent",
      "codemaker",
      "codestudio",
      "command-code",
      "continue",
      "cortex",
      "crush",
      "devin",
      "forgecode",
      "goose",
      "iflow-cli",
      "kode",
      "mcpjam",
      "mistral-vibe",
      "mux",
      "openhands",
      "pi",
      "rovodev",
      "roo",
      "tabnine-cli",
      "zencoder",
      "neovate",
      "pochi",
      "adal",
    ]) {
      const { container } = render(<PlatformIcon agentId={agentId} />);
      expect(container.querySelector("svg"), agentId).toBeInTheDocument();
    }
  });

  // ── Uniqueness — each platform renders a distinct SVG ─────────────────────

  it("renders unique SVG content for each platform (no two are identical)", () => {
    const svgContents = new Map<string, string>();
    // Platforms that use <img> (real app PNGs) instead of SVG
    const imgPlatforms = new Set(["autoclaw", "workbuddy", "cursor", "windsurf", "trae", "trae-cn", "qclaw", "codebuddy", "kiro", "qoder", "factory-droid", "codex", "easyclaw", "openclaw", "hermes"]);

    for (const id of ALL_PLATFORM_IDS) {
      const { container } = render(<PlatformIcon agentId={id} />);
      if (imgPlatforms.has(id)) continue;
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      const inner = svg?.innerHTML ?? "";
      expect(svgContents.has(inner), `Duplicate SVG for ${id}`).toBe(false);
      svgContents.set(inner, id);
    }
  });

  // ── Fallback ──────────────────────────────────────────────────────────────

  it("renders fallback icon for unknown agentId", () => {
    const { container } = render(<PlatformIcon agentId="unknown-platform-xyz" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a dedicated decorative SVG icon for obsidian", () => {
    const { container: obsidianContainer } = render(<PlatformIcon agentId="obsidian" />);
    const { container: fallbackContainer } = render(<PlatformIcon agentId="unknown-platform-xyz" />);

    const obsidianSvg = obsidianContainer.querySelector("svg");
    const fallbackSvg = fallbackContainer.querySelector("svg");

    expect(obsidianSvg).toBeInTheDocument();
    expect(obsidianSvg).toHaveAttribute("aria-hidden", "true");
    expect(obsidianSvg?.innerHTML).not.toEqual(fallbackSvg?.innerHTML);
  });

  it("renders fallback icon for empty agentId", () => {
    const { container } = render(<PlatformIcon agentId="" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  // ── Size ──────────────────────────────────────────────────────────────────

  it("renders with default size 16", () => {
    const { container } = render(<PlatformIcon agentId="claude-code" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
  });

  it("renders with custom size", () => {
    const { container } = render(<PlatformIcon agentId="augment" size={20} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it("has aria-hidden attribute", () => {
    const { container } = render(<PlatformIcon agentId="claude-code" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("applies currentColor fill", () => {
    const { container } = render(<PlatformIcon agentId="gemini-cli" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("fill")).toBe("currentColor");
  });

  // ── className ─────────────────────────────────────────────────────────────

  it("applies custom className", () => {
    const { container } = render(
      <PlatformIcon agentId="augment" className="text-primary size-4" />
    );
    const svg = container.querySelector("svg");
    // SVG elements in JSDOM use getAttribute('class') rather than .className string
    const classAttr = svg?.getAttribute("class") ?? "";
    expect(classAttr).toContain("text-primary");
    expect(classAttr).toContain("size-4");
  });

  it("always includes shrink-0 class", () => {
    const { container } = render(<PlatformIcon agentId="central" />);
    const svg = container.querySelector("svg");
    const classAttr = svg?.getAttribute("class") ?? "";
    expect(classAttr).toContain("shrink-0");
  });
});
