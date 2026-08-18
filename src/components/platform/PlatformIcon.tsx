import { cn } from "@/lib/utils";

// Real app icons extracted from /Applications/*.app
import autoclawIcon from "@/assets/autoclaw.png";
import workbuddyIcon from "@/assets/workbuddy.png";
import cursorIcon from "@/assets/cursor.png";
import windsurfIcon from "@/assets/windsurf.png";
import traeIcon from "@/assets/trae.png";
import qclawIcon from "@/assets/qclaw.png";
import codebuddyIcon from "@/assets/codebuddy.png";
import kiroIcon from "@/assets/kiro.png";
import qoderIcon from "@/assets/qoder.png";
import factoryDroidIcon from "@/assets/factory-droid.png";
import codexIcon from "@/assets/codex.png";
import easyclawIcon from "@/assets/easyclaw.png";
import openclawIcon from "@/assets/openclaw.png";
import hermesIcon from "@/assets/hermes.png";

// Lobehub real product icons (Mono variants — use currentColor)
import GithubCopilotIcon from "@lobehub/icons/es/GithubCopilot/components/Mono";
import GeminiCliIcon from "@lobehub/icons/es/GeminiCLI/components/Mono";
import JunieIcon from "@lobehub/icons/es/Junie/components/Mono";
import QwenIcon from "@lobehub/icons/es/Qwen/components/Mono";
import OpenCodeIcon from "@lobehub/icons/es/OpenCode/components/Mono";
import KiloCodeIcon from "@lobehub/icons/es/KiloCode/components/Mono";
import AmpIcon from "@lobehub/icons/es/Amp/components/Mono";
import AntigravityIcon from "@lobehub/icons/es/Antigravity/components/Mono";
import ClineIcon from "@lobehub/icons/es/Cline/components/Mono";
import KimiIcon from "@lobehub/icons/es/Kimi/components/Mono";
import IBMIcon from "@lobehub/icons/es/IBM/components/Mono";
import CodeGeeXIcon from "@lobehub/icons/es/CodeGeeX/components/Mono";
import CommandAIcon from "@lobehub/icons/es/CommandA/components/Mono";
import SnowflakeIcon from "@lobehub/icons/es/Snowflake/components/Mono";
import GooseIcon from "@lobehub/icons/es/Goose/components/Mono";
import MCPJamIcon from "@lobehub/icons/es/MCP/components/Mono";
import MistralIcon from "@lobehub/icons/es/Mistral/components/Mono";
import ZenMuxIcon from "@lobehub/icons/es/ZenMux/components/Mono";
import OpenHandsIcon from "@lobehub/icons/es/OpenHands/components/Mono";
import RooCodeIcon from "@lobehub/icons/es/RooCode/components/Mono";
import ZencoderIcon from "@lobehub/icons/es/Zencoder/components/Mono";

// ─── Platform Icon ────────────────────────────────────────────────────────────
//
// Uses real app PNGs for platforms with local /Applications/*.app installs.
// Falls back to @lobehub/icons Mono variants, then custom SVGs.

const APP_ICONS: Record<string, { src: string; alt: string }> = {
  "autoclaw": { src: autoclawIcon, alt: "AutoClaw" },
  "workbuddy": { src: workbuddyIcon, alt: "WorkBuddy" },
  "cursor": { src: cursorIcon, alt: "Cursor" },
  "windsurf": { src: windsurfIcon, alt: "Windsurf" },
  "trae": { src: traeIcon, alt: "Trae" },
  "trae-cn": { src: traeIcon, alt: "Trae CN" },
  "qclaw": { src: qclawIcon, alt: "QClaw" },
  "codebuddy": { src: codebuddyIcon, alt: "CodeBuddy" },
  "kiro": { src: kiroIcon, alt: "Kiro" },
  "qoder": { src: qoderIcon, alt: "Qoder" },
  "factory-droid": { src: factoryDroidIcon, alt: "Factory Droid" },
  "codex": { src: codexIcon, alt: "Codex CLI" },
  "easyclaw": { src: easyclawIcon, alt: "EasyClaw" },
  "openclaw": { src: openclawIcon, alt: "OpenClaw" },
  "hermes": { src: hermesIcon, alt: "Hermes" },
};

type LobeIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const LOBEHUB_ICONS: Record<string, React.ComponentType<LobeIconProps>> = {
  "copilot": GithubCopilotIcon,
  "gemini-cli": GeminiCliIcon,
  "junie": JunieIcon,
  "qwen": QwenIcon,
  "opencode": OpenCodeIcon,
  "kilocode": KiloCodeIcon,
  "amp": AmpIcon,
  "antigravity": AntigravityIcon,
  "cline": ClineIcon,
  "kimi-code-cli": KimiIcon,
  "bob": IBMIcon,
  "codemaker": CodeGeeXIcon,
  "command-code": CommandAIcon,
  "cortex": SnowflakeIcon,
  "goose": GooseIcon,
  "mcpjam": MCPJamIcon,
  "mistral-vibe": MistralIcon,
  "mux": ZenMuxIcon,
  "openhands": OpenHandsIcon,
  "roo": RooCodeIcon,
  "zencoder": ZencoderIcon,
};

const MONOGRAM_ICONS: Record<string, string> = {
  "aider-desk": "AD",
  "codearts-agent": "CA",
  "codestudio": "CS",
  "continue": "CT",
  "crush": "CR",
  "devin": "DV",
  "forgecode": "FG",
  "iflow-cli": "IF",
  "kode": "KD",
  "pi": "PI",
  "rovodev": "RV",
  "tabnine-cli": "TN",
  "neovate": "NV",
  "pochi": "PC",
  "adal": "AL",
};

interface PlatformIconProps {
  agentId: string;
  className?: string;
  /** Icon size in pixels (default: 16). */
  size?: number;
}

export function PlatformIcon({ agentId, className, size = 16 }: PlatformIconProps) {
  // Use real app icon PNG if available
  const appIcon = APP_ICONS[agentId];
  if (appIcon) {
    return (
      <img
        src={appIcon.src}
        width={size}
        height={size}
        alt={appIcon.alt}
        className={cn("shrink-0 rounded-sm", className)}
        aria-hidden
      />
    );
  }

  // Use lobehub real product icon if available
  const LobeIcon = LOBEHUB_ICONS[agentId];
  if (LobeIcon) {
    return <LobeIcon size={size} className={cn("shrink-0", className)} aria-hidden />;
  }

  // Fall back to custom SVGs for remaining platforms
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "currentColor",
    className: cn("shrink-0", className),
    "aria-hidden": true as const,
    role: "img" as const,
  };

  const monogram = MONOGRAM_ICONS[agentId];
  if (monogram) {
    return (
      <svg {...svgProps}>
        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.18" />
        <path d="M4.5 4.2h7l1.3 3.8-1.3 3.8h-7L3.2 8z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
        <text
          x="8"
          y="8.45"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="4.2"
          fontWeight="700"
          fill="currentColor"
        >
          {monogram}
        </text>
      </svg>
    );
  }

  switch (agentId) {
    case "claude-code":
      // Claude Code — local override avoids a wrong upstream SVG title.
      return (
        <svg {...svgProps} viewBox="0 0 24 24" fillRule="evenodd">
          <path
            clipRule="evenodd"
            d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z"
          />
        </svg>
      );

    case "augment":
      // Augment — arrow/growth symbol (upward arrow with bar)
      return (
        <svg {...svgProps}>
          <path d="M8 2l4 4H9v5H7V6H4z" />
          <rect x="3" y="12.5" width="10" height="1.5" rx="0.5" />
        </svg>
      );

    case "ob1":
      // OB1 — circle with '1'
      return (
        <svg {...svgProps}>
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 5.5h1.5v5H7V7l-.8.5-.4-1z" />
        </svg>
      );

    case "aider":
      // Aider — terminal/command line icon
      return (
        <svg {...svgProps}>
          <rect x="2" y="2.5" width="12" height="11" rx="1.5" fill="currentColor" opacity="0.15" />
          <path d="M2 2.5h12a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H2a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 2 2.5zm1 2v7h10v-7H3zm1 1.5L6 7.5 4 9V7.5z" fillRule="evenodd" />
          <rect x="7" y="8" width="3.5" height="1" rx="0.3" opacity="0.5" />
        </svg>
      );

    case "deep-agents":
      // Deep Agents — stacked nodes
      return (
        <svg {...svgProps}>
          <circle cx="5" cy="5" r="2.2" />
          <circle cx="11" cy="5" r="2.2" opacity="0.7" />
          <circle cx="8" cy="11" r="2.2" opacity="0.85" />
          <path d="M6.7 5h2.6M6.1 6.7l1.1 2M9.9 6.7l-1.1 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case "dexto":
      // Dexto — D-shaped terminal mark
      return (
        <svg {...svgProps}>
          <path d="M3 2.5h4.4c3.3 0 5.6 2.1 5.6 5.5s-2.3 5.5-5.6 5.5H3zM5.2 4.6v6.8h2.1c2 0 3.4-1.3 3.4-3.4S9.3 4.6 7.3 4.6z" />
          <path d="M6.1 6.3 8 8l-1.9 1.7V8.5L6.8 8l-.7-.5z" fill="currentColor" opacity="0.55" />
        </svg>
      );

    case "firebender":
      // Firebender — flame mark
      return (
        <svg {...svgProps}>
          <path d="M8.8 1.7c.4 2.1 2.7 3.2 2.7 6.1 0 3-2.2 5.1-5 5.1-2.4 0-4.2-1.7-4.2-4.1 0-1.9 1-3.2 2.3-4.4-.1 1.4.5 2.3 1.4 2.8.2-2.3 1.4-4.1 2.8-5.5z" />
          <path d="M8 12.9c1.2-.5 2-1.5 2-2.8 0-1.2-.7-2.1-1.5-3-.1 1.2-.8 2-1.6 2.6-.5-.4-.8-.9-.9-1.5-.6.7-.9 1.4-.9 2.2 0 1.4 1.1 2.4 2.9 2.5z" fill="currentColor" opacity="0.45" />
        </svg>
      );

    case "warp":
      // Warp — speed rails
      return (
        <svg {...svgProps}>
          <path d="M2 4.2h8.8c1.2 0 2.2 1 2.2 2.2S12 8.6 10.8 8.6H5.2c-.5 0-.9.4-.9.9s.4.9.9.9H14v2H5.2C3.6 12.4 2.3 11.1 2.3 9.5s1.3-2.9 2.9-2.9h5.6c.3 0 .5-.2.5-.5s-.2-.5-.5-.5H2z" />
          <path d="M1 6.6h2.4v2H1zM12.6 6.6H15v2h-2.4z" opacity="0.5" />
        </svg>
      );

    case "central":
      // Central Skills — 3-D cube / package
      return (
        <svg {...svgProps}>
          <path d="M8 1.5 14 4.8v6.4L8 14.5 2 11.2V4.8zm0 1.9L4.3 5.4 8 7.8l3.7-2.5zM3.5 6.7v3.7L7.2 12V8.2zm5.3 5.3L12.5 10.4V6.7L8.8 8.2z" />
        </svg>
      );

    case "obsidian":
      // Obsidian — faceted vault crystal (source-only category, not install target)
      return (
        <svg {...svgProps}>
          <path d="M8 1.4 13.2 5 12 12.4 8 14.6 4 12.4 2.8 5z" fill="currentColor" opacity="0.16" />
          <path d="M8 1.4 13.2 5 8.9 6.7zM8 1.4 2.8 5 7.1 6.7zM2.8 5 4 12.4 7.1 6.7zM13.2 5 12 12.4 8.9 6.7zM4 12.4 8 14.6 7.1 6.7zM12 12.4 8 14.6 8.9 6.7z" />
          <path d="M7.1 6.7h1.8L8 14.6z" opacity="0.7" />
        </svg>
      );

    default:
      // Generic terminal / code icon — used for unknown platforms
      return (
        <svg {...svgProps}>
          <rect x="2" y="3" width="12" height="10" rx="1.5" fill="currentColor" opacity="0.15" />
          <path d="M2 3h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 14 13H2a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 2 3zm1 2v6h10V5H3zm1 1.5 2 1.5L4 10v-1.5l.8-.5L4 8V6.5zm3.5 3.5h3v1h-3z" />
        </svg>
      );
  }
}
