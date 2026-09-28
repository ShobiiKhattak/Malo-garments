/*
 * Generates ids in the same style the frontend's localStorage version used
 * (e.g. "usr-abc123xy"), so data looks consistent whichever mode created it.
 */
export const generateId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
