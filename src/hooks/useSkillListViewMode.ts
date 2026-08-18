import { useCallback, useState } from "react";
import {
  readStoredSkillListViewMode,
  SkillListViewMode,
  writeStoredSkillListViewMode,
} from "@/lib/skillFolders";

export function useSkillListViewMode(scope: string) {
  const [mode, setModeState] = useState<SkillListViewMode>(() =>
    readStoredSkillListViewMode(scope)
  );

  const setMode = useCallback(
    (nextMode: SkillListViewMode) => {
      setModeState(nextMode);
      writeStoredSkillListViewMode(scope, nextMode);
    },
    [scope]
  );

  return [mode, setMode] as const;
}
