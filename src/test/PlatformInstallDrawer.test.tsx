import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PlatformInstallDrawer } from "../components/central/PlatformInstallDrawer";
import type { AgentWithStatus, SkillWithLinks } from "../types";

const agents: AgentWithStatus[] = [
  {
    id: "claude-code",
    display_name: "Claude Code",
    category: "coding",
    global_skills_dir: "~/.claude/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "cursor",
    display_name: "Cursor",
    category: "coding",
    global_skills_dir: "~/.cursor/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "openclaw",
    display_name: "OpenClaw",
    category: "lobster",
    global_skills_dir: "~/.openclaw/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
  {
    id: "central",
    display_name: "Central Skills",
    category: "central",
    global_skills_dir: "~/.agents/skills",
    is_detected: true,
    is_builtin: true,
    is_enabled: true,
  },
];

const skill: SkillWithLinks = {
  id: "demo-skill",
  name: "demo-skill",
  description: "Demo skill",
  file_path: "~/.agents/skills/demo-skill/SKILL.md",
  canonical_path: "~/.agents/skills/demo-skill",
  is_central: true,
  scanned_at: "2026-04-29T00:00:00Z",
  linked_agents: ["claude-code"],
  read_only_agents: ["cursor"],
};

describe("PlatformInstallDrawer", () => {
  it("renders a right drawer with platform status rows", () => {
    render(
      <PlatformInstallDrawer
        open
        skill={skill}
        agents={agents}
        togglingAgentId={null}
        onOpenChange={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: /管理 demo-skill 的平台安装/i })).toBeInTheDocument();
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Cursor")).toBeInTheDocument();
    expect(screen.queryByText("Central Skills")).not.toBeInTheDocument();
    expect(screen.getAllByText("已安装").length).toBeGreaterThan(0);
    expect(screen.getByText("共享只读")).toBeInTheDocument();
  });

  it("toggles installable platforms and disables shared read-only rows", () => {
    const onToggle = vi.fn();
    render(
      <PlatformInstallDrawer
        open
        skill={skill}
        agents={agents}
        togglingAgentId={null}
        onOpenChange={vi.fn()}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "从 Claude Code 卸载 demo-skill" }));
    expect(onToggle).toHaveBeenCalledWith("demo-skill", "claude-code");

    expect(screen.getByRole("button", { name: "Cursor 通过共享目录可用" })).toBeDisabled();
  });

  it("filters platforms by search text", () => {
    render(
      <PlatformInstallDrawer
        open
        skill={skill}
        agents={agents}
        togglingAgentId={null}
        onOpenChange={vi.fn()}
        onToggle={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "龙虾类" }));
    fireEvent.change(screen.getByPlaceholderText("搜索平台..."), {
      target: { value: "open" },
    });

    expect(screen.getByText("OpenClaw")).toBeInTheDocument();
    expect(screen.queryByText("Claude Code")).not.toBeInTheDocument();
  });
});
