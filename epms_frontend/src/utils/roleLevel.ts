export const ROLE_LEVEL_RANKS: Record<string, number[]> = {
  ADMIN:    [1, 2, 3],
  HR:       [4, 5, 6, 7],
  MANAGER:  [4, 5, 6],
  EMPLOYEE: [6, 7, 8, 9],
};

export const getLevelsForRole = <T extends { levelRank: number }>(
  roleName: string,
  levels: T[]
): T[] =>
  levels.filter(l =>
    (ROLE_LEVEL_RANKS[roleName.toUpperCase()] ?? []).includes(l.levelRank)
  );
