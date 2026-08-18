export interface ScrollRestorationState {
  key: string;
  scrollTop: number;
}

const scrollState = new Map<string, number>();

export function saveScrollPosition(key: string, scrollTop: number) {
  scrollState.set(key, scrollTop);
}

export function readScrollPosition(key: string): number | null {
  const value = scrollState.get(key);
  return typeof value === "number" ? value : null;
}

export function consumeScrollPosition(key: string): number | null {
  const value = readScrollPosition(key);
  if (value !== null) {
    scrollState.delete(key);
  }
  return value;
}

export function clearScrollPosition(key: string) {
  scrollState.delete(key);
}

export function createScrollRestorationState(key: string, scrollTop: number): ScrollRestorationState {
  return { key, scrollTop };
}

// ─── Return-to-scope context ─────────────────────────────────────────────────
//
// Tracks additional, non-scroll restoration context (e.g. the selected
// collection id) for a given scope. Complements the scroll map above so the
// list view can also recover its selection context when returning from a
// skill detail, not just its scroll offset. Keyed by a short scope name
// (e.g. "collections") so different pages can coexist without clashing.

const returnContext = new Map<string, Record<string, unknown>>();

export function saveReturnContext(scope: string, context: Record<string, unknown>) {
  returnContext.set(scope, context);
}

export function readReturnContext(scope: string): Record<string, unknown> | null {
  const value = returnContext.get(scope);
  return value ?? null;
}

export function consumeReturnContext(scope: string): Record<string, unknown> | null {
  const value = readReturnContext(scope);
  if (value !== null) {
    returnContext.delete(scope);
  }
  return value;
}

export function clearReturnContext(scope: string) {
  returnContext.delete(scope);
}
