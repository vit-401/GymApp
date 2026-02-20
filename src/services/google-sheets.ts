/**
 * @file Google Sheets API integration — auth + read/write helpers.
 *
 * Uses Google Identity Services (GIS) for OAuth and direct REST calls
 * to the Sheets API v4. Zero npm dependencies — GIS loaded via script tag.
 *
 * Data layout in Google Sheet:
 * - Row 1 = headers: workouts | exercises | program | metrics | timer
 * - Row 2 = JSON data per store (one cell per store)
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const STORE_KEYS = [
  'gymapp-workouts',
  'gymapp-exercises',
  'gymapp-program',
  'gymapp-metrics',
  'gymapp-timer',
] as const;

const COLUMN_HEADERS = ['workouts', 'exercises', 'program', 'metrics', 'timer'];

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

/** Dynamically load the GIS script tag if not already present */
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

/** Initialize the OAuth token client with the given Client ID */
export function initGoogleAuth(clientId: string): void {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SHEETS_SCOPE,
    callback: () => {}, // overridden in signIn
  });
}

/** Trigger the Google OAuth popup and resolve with access token */
export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized. Call initGoogleAuth first.'));
      return;
    }
    tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      accessToken = response.access_token;
      resolve(response.access_token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/** Revoke access token */
export function signOut(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {});
    accessToken = null;
  }
}

/** Get current access token (null if not signed in) */
export function getToken(): string | null {
  return accessToken;
}

/** Read a single cell value from the sheet (column by store key index, row 2) */
export async function readStore(
  spreadsheetId: string,
  storeKey: string,
  token: string
): Promise<string | null> {
  const colIndex = STORE_KEYS.indexOf(storeKey as typeof STORE_KEYS[number]);
  if (colIndex === -1) return null;

  const colLetter = String.fromCharCode(65 + colIndex); // A-E
  const range = `Sheet1!${colLetter}2`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Sheets read failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.values?.[0]?.[0] ?? null;
}

/** Write a single cell value to the sheet (column by store key index, row 2) */
export async function writeStore(
  spreadsheetId: string,
  storeKey: string,
  value: string,
  token: string
): Promise<void> {
  const colIndex = STORE_KEYS.indexOf(storeKey as typeof STORE_KEYS[number]);
  if (colIndex === -1) return;

  const colLetter = String.fromCharCode(65 + colIndex);
  const range = `Sheet1!${colLetter}2`;

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [[value]] }),
    }
  );

  if (!res.ok) {
    throw new Error(`Sheets write failed: ${res.status} ${res.statusText}`);
  }
}

/** Ensure headers exist in row 1 */
export async function ensureHeaders(
  spreadsheetId: string,
  token: string
): Promise<void> {
  const range = 'Sheet1!A1:E1';

  const res = await fetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [COLUMN_HEADERS] }),
    }
  );

  if (!res.ok) {
    throw new Error(`Sheets header write failed: ${res.status} ${res.statusText}`);
  }
}
