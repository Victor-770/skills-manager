import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { UnifiedSkillCard } from "../components/skill/UnifiedSkillCard";
import type { AgentWithStatus } from "../types";

const agents: AgentWithStatus[] = [
  {
    id: "claude-code",
    display_name: "Claude Code",
    category: "coding",
    global_skills_dir: "/Users/test/.claude/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "cursor",
    display_name: "Cursor",
    category: "coding",
    global_skills_dir: "/Users/test/.cursor/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "trae",
    display_name: "Trae",
    category: "coding",
    global_skills_dir: "/Users/test/.trae/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "windsurf",
    display_name: "Windsurf",
    category: "coding",
    global_skills_dir: "/Users/test/.codeium/windsurf/memories",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "codex",
    display_name: "Codex CLI",
    category: "coding",
    global_skills_dir: "/Users/test/.codex/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "qwen",
    display_name: "Qwen Code",
    category: "coding",
    global_skills_dir: "/Users/test/.qwen/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "gemini-cli",
    display_name: "Gemini CLI",
    category: "coding",
    global_skills_dir: "/Users/test/.gemini/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "copilot",
    display_name: "GitHub Copilot",
    category: "coding",
    global_skills_dir: "/Users/test/.copilot/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "opencode",
    display_name: "OpenCode",
    category: "coding",
    global_skills_dir: "/Users/test/.opencode/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "openclaw",
    display_name: "OpenClaw",
    category: "lobster",
    global_skills_dir: "/Users/test/.openclaw/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "kiro",
    display_name: "Kiro",
    category: "lobster",
    global_skills_dir: "/Users/test/.kiro/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
];

function renderCard(linkedAgents: string[], readOnlyAgents: string[] = []) {
  const onToggle = vi.fn();
  const onManagePlatforms = vi.fn();
  render(
    <UnifiedSkillCard
      name="demo-skill"
      description="Demo skill"
      platformIcons={{
        agents,
        linkedAgents,
        readOnlyAgents,
        skillId: "demo-skill",
        onToggle,
        togglingAgentId: null,
        onManage: onManagePlatforms,
      }}
    />
  );
  return { onToggle, onManagePlatforms };
}

describe("UnifiedSkillCard platform toggles", () => {
  it("renders all lobster toggles and only featured coding toggles on the card", () => {
    renderCard(["cursor", "openclaw"]);

    expect(screen.getByText("龙虾类")).toBeInTheDocument();
    expect(screen.getByText("编程类")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "管理 demo-skill 的平台安装" })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "切换 demo-skill 在 OpenClaw 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 demo-skill 在 Kiro 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 demo-skill 在 Claude Code 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 demo-skill 在 Cursor 的链接状态" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换 demo-skill 在 Trae 的链接状态" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "切换 demo-skill 在 Gemini CLI 的链接状态" })
    ).not.toBeInTheDocument();
  });

  it("toggles featured coding platforms directly from the card", () => {
    const { onToggle } = renderCard([]);

    const button = screen.getByRole("button", {
      name: "切换 demo-skill 在 Cursor 的链接状态",
    });

    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith("demo-skill", "cursor");
  });

  it("keeps read-only direct toggles disabled while showing installed state", () => {
    renderCard(["cursor"], ["claude-code"]);

    const button = screen.getByRole("button", {
      name: "切换 demo-skill 在 Claude Code 的链接状态",
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("opens the platform manager for hidden coding platforms", () => {
    const { onManagePlatforms } = renderCard(["cursor"]);

    fireEvent.click(screen.getByRole("button", { name: "管理 demo-skill 的平台安装" }));

    expect(onManagePlatforms).toHaveBeenCalledTimes(1);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });
});
