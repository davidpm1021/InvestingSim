/**
 * localStorage data-version guard. The persisted state (holding transactions,
 * account transactions, etc.) is only meaningful against the asset catalog and
 * account model it was created with. Bump CURRENT_DATA_VERSION whenever a change
 * (e.g. replacing the asset catalog) makes old persisted data invalid; stale data
 * is cleared on load so a returning user starts fresh instead of seeing holdings
 * silently vanish while their cash still reflects the old trades.
 *
 * Version history:
 *   2 — brokerage-sim redesign: new 7-asset catalog (HRVS/GPL/STRL/TSMX/TSME/
 *       TDF70/TBMX), Savings + Cash Settlement Account model.
 */
export const CURRENT_DATA_VERSION = 2;

const VERSION_KEY = 'investing_sim__data_version';
const APP_KEY_PREFIX = 'investing_sim__';

/** Run before bootstrap, before any service reads localStorage. */
export function migrateLocalStorage(): void {
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored === String(CURRENT_DATA_VERSION)) {
      return;
    }

    // Stale or pre-versioning data: clear every app key.
    const staleKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(APP_KEY_PREFIX)) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach(key => localStorage.removeItem(key));
    if (staleKeys.length > 0) {
      console.warn(`InvestingSim: cleared ${staleKeys.length} stale localStorage key(s) from data version ${stored ?? 'unversioned'}.`);
    }

    localStorage.setItem(VERSION_KEY, String(CURRENT_DATA_VERSION));
  } catch (error) {
    console.error('Error migrating localStorage data version:', error);
  }
}
