export type SkillListViewMode = "all" | "folders";

export interface SkillFolderGroup<TSkill> {
  name: string;
  relativePath: string;
  path: string;
  skillCount: number;
  linkedAgentCount: number;
  readOnlyAgentCount: number;
  skills: TSkill[];
}

export interface SplitSkillsByTopLevelOptions<TSkill> {
  skills: TSkill[];
  rootPath: string;
  getDirPaths: (skill: TSkill) => string | null | undefined | Array<string | null | undefined>;
  getLinkedAgentIds?: (skill: TSkill) => readonly string[] | null | undefined;
  getReadOnlyAgentIds?: (skill: TSkill) => readonly string[] | null | undefined;
}

export function normalizeFsPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function dirnameFromSkillFile(filePath: string): string {
  const normalized = normalizeFsPath(filePath);
  if (normalized.toLowerCase().endsWith("/skill.md")) {
    return normalized.slice(0, -"/SKILL.md".length);
  }
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash >= 0 ? normalized.slice(0, lastSlash) : normalized;
}

export function getRelativePathUnderRoot(path: string, rootPath: string): string | null {
  const normalizedRoot = normalizeFsPath(rootPath);
  const normalizedPath = normalizeFsPath(path);
  if (!normalizedRoot || !normalizedPath) return null;
  if (normalizedPath === normalizedRoot) return "";
  const prefix = `${normalizedRoot}/`;
  if (!normalizedPath.startsWith(prefix)) return null;
  return normalizedPath.slice(prefix.length);
}

function candidatePaths(value: string | null | undefined | Array<string | null | undefined>) {
  return Array.isArray(value) ? value : [value];
}

function uniqueCount(values: Iterable<string>) {
  return new Set(values).size;
}

export function splitSkillsByTopLevel<TSkill>({
  skills,
  rootPath,
  getDirPaths,
  getLinkedAgentIds,
  getReadOnlyAgentIds,
}: SplitSkillsByTopLevelOptions<TSkill>) {
  const rootSkills: TSkill[] = [];
  const groups = new Map<string, SkillFolderGroup<TSkill>>();

  for (const skill of skills) {
    let relativePath: string | null = null;
    for (const path of candidatePaths(getDirPaths(skill))) {
      if (!path) continue;
      relativePath = getRelativePathUnderRoot(path, rootPath);
      if (relativePath !== null) break;
    }

    const parts = relativePath?.split("/").filter(Boolean) ?? [];
    if (parts.length <= 1) {
      rootSkills.push(skill);
      continue;
    }

    const folderName = parts[0];
    const group =
      groups.get(folderName) ??
      {
        name: folderName,
        relativePath: folderName,
        path: `${normalizeFsPath(rootPath)}/${folderName}`,
        skillCount: 0,
        linkedAgentCount: 0,
        readOnlyAgentCount: 0,
        skills: [],
      };

    group.skills.push(skill);
    group.skillCount = group.skills.length;
    group.linkedAgentCount = uniqueCount(
      group.skills.flatMap((item) => [...(getLinkedAgentIds?.(item) ?? [])])
    );
    group.readOnlyAgentCount = uniqueCount(
      group.skills.flatMap((item) => [...(getReadOnlyAgentIds?.(item) ?? [])])
    );
    groups.set(folderName, group);
  }

  return {
    rootSkills,
    groups: [...groups.values()].sort((a, b) =>
      a.relativePath.localeCompare(b.relativePath, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    ),
  };
}

export function skillListViewModeStorageKey(scope: string): string {
  return `skills-manage.skillListViewMode.${scope}`;
}

export function readStoredSkillListViewMode(scope: string): SkillListViewMode {
  if (typeof window === "undefined") return "all";
  return window.localStorage.getItem(skillListViewModeStorageKey(scope)) === "folders"
    ? "folders"
    : "all";
}

export function writeStoredSkillListViewMode(scope: string, mode: SkillListViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(skillListViewModeStorageKey(scope), mode);
}
