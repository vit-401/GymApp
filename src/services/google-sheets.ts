/**
 * @file Google Sheets API integration — auth + row-level sync.
 *
 * Sheet layout (single sheet):
 *   Columns A-B: Workout sessions (one row per session)
 *     A1: "session_id"   B1: "session_data"
 *     A2+: session ID    B2+: full session JSON
 *
 *   Columns D-G: Config stores (single row)
 *     D1: "exercises"   E1: "program"   F1: "metrics"   G1: "timer"
 *     D2: JSON           E2: JSON        F2: JSON        G2: JSON
 *
 * Sync strategy:
 * - Each session is an individual row, found/updated by ID (no duplicates)
 * - Config stores are single-cell blobs (rarely change)
 * - Auto-pull on connect, auto-push on Complete Day
 * - Token persisted in localStorage with expiry for PWA resilience
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/** All localStorage keys (used by JSON backup) */
export const STORE_KEYS = [
  'gymapp-workouts',
  'gymapp-exercises',
  'gymapp-program',
  'gymapp-metrics',
  'gymapp-timer',
] as const;

/** Config keys synced as blobs in D2:G2 */
const CONFIG_KEYS = ['gymapp-exercises', 'gymapp-program', 'gymapp-metrics', 'gymapp-timer'] as const;
const CONFIG_HEADERS = ['exercises', 'program', 'metrics', 'timer'];
const SESSION_HEADERS = ['session_id', 'session_data'];

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

/** Load token from localStorage with expiry check */
function loadTokenFromStorage(): string | null {
  const raw = localStorage.getItem('gymapp-gsheets-token');
  if (!raw) return null;
  try {
    const { access_token, expires_at } = JSON.parse(raw);
    if (Date.now() > expires_at - 60000) { // 1 min buffer
      localStorage.removeItem('gymapp-gsheets-token');
      return null;
    }
    return access_token as string;
  } catch {
    localStorage.removeItem('gymapp-gsheets-token');
    return null;
  }
}

let accessToken: string | null = loadTokenFromStorage();

/* ── Sheets API helpers ── */

async function sheetsGet(spreadsheetId: string, range: string, token: string) {
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Sheets GET ${range}: ${res.status}`);
  return res.json();
}

async function sheetsPut(spreadsheetId: string, range: string, values: unknown[][], token: string) {
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) throw new Error(`Sheets PUT ${range}: ${res.status}`);
}

async function sheetsAppend(spreadsheetId: string, range: string, values: unknown[][], token: string) {
  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) throw new Error(`Sheets APPEND ${range}: ${res.status}`);
}

/* ── Auth ── */

export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export function initGoogleAuth(clientId: string): void {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SHEETS_SCOPE,
    callback: () => {},
  });
}

export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized.'));
      return;
    }
    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      localStorage.setItem('gymapp-gsheets-token', JSON.stringify({
        access_token: response.access_token,
        expires_at: Date.now() + (response.expires_in * 1000),
      }));
      resolve(response.access_token);
    };
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export function signOut(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  localStorage.removeItem('gymapp-gsheets-token');
}

export function getToken(): string | null {
  if (!accessToken) accessToken = loadTokenFromStorage();
  return accessToken;
}

export function isConnected(): boolean {
  return getToken() !== null;
}

/* ── Sheet operations ── */

/** Write headers to sheet if missing */
export async function ensureHeaders(spreadsheetId: string, token: string): Promise<void> {
  await sheetsPut(spreadsheetId, 'Sheet1!A1:B1', [SESSION_HEADERS], token);
  await sheetsPut(spreadsheetId, 'Sheet1!D1:G1', [CONFIG_HEADERS], token);
}

/** Push config stores (exercises, program, metrics, timer) to D2:G2 */
export async function pushConfig(spreadsheetId: string, token: string): Promise<void> {
  const values = CONFIG_KEYS.map(key => localStorage.getItem(key) ?? '');
  await sheetsPut(spreadsheetId, 'Sheet1!D2:G2', [values], token);
}

/** Push a single session — update existing row by ID or append new row */
export async function pushSession(
  spreadsheetId: string,
  session: { id: string },
  token: string
): Promise<void> {
  // Read existing IDs to find matching row
  let existingIds: string[] = [];
  try {
    const idsRes = await sheetsGet(spreadsheetId, 'Sheet1!A2:A10000', token);
    existingIds = (idsRes.values ?? []).map((r: string[]) => r[0]);
  } catch { /* empty sheet */ }

  const sessionJson = JSON.stringify(session);
  const rowIndex = existingIds.indexOf(session.id);

  if (rowIndex >= 0) {
    const row = rowIndex + 2; // header is row 1, data starts row 2
    await sheetsPut(spreadsheetId, `Sheet1!A${row}:B${row}`, [[session.id, sessionJson]], token);
  } else {
    await sheetsAppend(spreadsheetId, 'Sheet1!A:B', [[session.id, sessionJson]], token);
  }
}

/** Delete a session row from the sheet by session ID */
export async function deleteSessionFromSheet(
  spreadsheetId: string,
  sessionId: string,
  token: string
): Promise<void> {
  // Find row index for this session ID
  let existingIds: string[] = [];
  try {
    const idsRes = await sheetsGet(spreadsheetId, 'Sheet1!A2:A10000', token);
    existingIds = (idsRes.values ?? []).map((r: string[]) => r[0]);
  } catch { return; }

  const rowIndex = existingIds.indexOf(sessionId);
  if (rowIndex < 0) return;

  // Get the sheet's numeric ID (gid) for batchUpdate
  const metaRes = await fetch(`${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Sheets meta: ${metaRes.status}`);
  const meta = await metaRes.json();
  const sheetId = meta.sheets?.[0]?.properties?.sheetId ?? 0;

  // Delete the row (rowIndex is 0-based from row 2, so actual row = rowIndex + 1 in 0-based sheet coords)
  const res = await fetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex + 1, // +1 for header row (0-based)
            endIndex: rowIndex + 2,
          },
        },
      }],
    }),
  });
  if (!res.ok) throw new Error(`Sheets deleteRow: ${res.status}`);
}

/** Push ALL local sessions + config to sheet */
export async function pushAll(spreadsheetId: string, token: string): Promise<number> {
  await ensureHeaders(spreadsheetId, token);
  await pushConfig(spreadsheetId, token);

  const raw = localStorage.getItem('gymapp-workouts');
  if (!raw) return 0;

  const sessions = JSON.parse(raw).state?.sessions ?? [];
  for (const session of sessions) {
    await pushSession(spreadsheetId, session, token);
  }
  return sessions.length as number;
}

/** Pull all data from sheet → localStorage. Returns counts. */
export async function pullAll(
  spreadsheetId: string,
  token: string
): Promise<{ sessions: number; config: number }> {
  let configCount = 0;
  let sessionCount = 0;

  // Pull config stores
  try {
    const configRes = await sheetsGet(spreadsheetId, 'Sheet1!D2:G2', token);
    const configRow = configRes.values?.[0] ?? [];
    CONFIG_KEYS.forEach((key, i) => {
      if (configRow[i]) {
        localStorage.setItem(key, configRow[i]);
        configCount++;
      }
    });
  } catch { /* no config */ }

  // Pull sessions
  try {
    const sessionsRes = await sheetsGet(spreadsheetId, 'Sheet1!A2:B10000', token);
    const rows = sessionsRes.values ?? [];
    const sessions: unknown[] = [];
    for (const row of rows) {
      if (row[1]) {
        try { sessions.push(JSON.parse(row[1])); } catch { /* skip bad row */ }
      }
    }
    sessionCount = sessions.length;

    if (sessions.length > 0) {
      // Preserve currentDayNumber from local state
      let currentDayNumber = 1;
      try {
        const local = localStorage.getItem('gymapp-workouts');
        if (local) currentDayNumber = JSON.parse(local).state?.currentDayNumber ?? 1;
      } catch { /* default */ }

      localStorage.setItem('gymapp-workouts', JSON.stringify({
        state: { sessions, currentDayNumber },
        version: 0,
      }));
    }
  } catch { /* no sessions */ }

  return { sessions: sessionCount, config: configCount };
}

/**
 * Auto-sync after workout completion.
 * Pushes the completed session + config to sheet.
 * Silently skips if not connected.
 */
export async function autoSyncOnComplete(
  session: { id: string }
): Promise<'synced' | 'skipped' | 'error'> {
  const token = getToken();
  const spreadsheetId = localStorage.getItem('gymapp-gsheets-spreadsheet-id');
  if (!token || !spreadsheetId) return 'skipped';

  try {
    await pushSession(spreadsheetId, session, token);
    await pushConfig(spreadsheetId, token);
    return 'synced';
  } catch {
    return 'error';
  }
}
