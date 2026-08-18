import { useTranslation } from "react-i18next";

import {
  SkillFolderDrawer,
  type SkillFolderDrawerSkill,
} from "@/components/skill/SkillFolderDrawer";
import type { AgentWithStatus, CentralSkillBundleDetail, SkillWithLinks } from "@/types";

interface CentralBundleDrawerProps {
  open: boolean;
  detail: CentralSkillBundleDetail | null;
  agents: AgentWithStatus[];
  loadingPath: string | null;
  onOpenChange: (open: boolean) => void;
  onInstallationsChange?: () => void | Promise<void>;
}

function skillPath(skill: SkillWithLinks): string {
  return skill.canonical_path ?? skill.file_path;
}

export function CentralBundleDrawer({
  open,
  detail,
  agents,
  loadingPath,
  onOpenChange,
  onInstallationsChange,
}: CentralBundleDrawerProps) {
  const { t } = useTranslation();
  const skills: SkillFolderDrawerSkill[] =
    detail?.skills.map((skill) => ({
      key: skill.id,
      id: skill.id,
      name: skill.name,
      description: skill.description,
      path: skillPath(skill),
      relativePath: skill.file_path.split(`${detail.bundle.relativePath}/`).pop() ?? skill.name,
      linkedAgentIds: skill.linked_agents,
      readOnlyAgentIds: skill.read_only_agents ?? [],
    })) ?? [];

  return (
    <SkillFolderDrawer
      open={open}
      title={detail?.bundle.name ?? loadingPath ?? t("centralBundleDrawer.titleFallback")}
      path={detail?.bundle.path ?? undefined}
      isSymlink={detail?.bundle.isSymlink}
      skills={skills}
      agents={agents}
      loading={!detail}
      meta={
        detail
          ? t("central.bundleMeta", {
              count: detail.bundle.skillCount,
              linked: detail.bundle.linkedAgentCount,
            })
          : null
      }
      onOpenChange={onOpenChange}
      onInstallationsChange={onInstallationsChange}
    />
  );
}
