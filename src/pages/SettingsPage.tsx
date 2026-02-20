/**
 * @file Settings page — app configuration, data export, and danger zone.
 *
 * Business context:
 * - Rest Timer: configure the default rest timer duration (in seconds).
 * - Program Link: quick navigation to the program configuration page.
 * - Export Workouts: formats all completed sessions as plain text for clipboard copy.
 * - Backup & Restore: JSON import/export of all localStorage store data.
 * - Google Sheets Sync: manual push/pull to a user's Google Sheet for cloud backup.
 * - Danger Zone: destructive actions (clear all workouts, clear all metrics) with confirmation dialogs.
 *
 * Route: /settings
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import { useTimerStore } from '@/stores/timer.store';
import { useWorkoutStore } from '@/features/workout/stores/workout.store';
import { useProgramStore } from '@/features/program/stores/program.store';
import { useExercisesStore } from '@/features/exercises/stores/exercises.store';
import { useMetricsStore } from '@/features/metrics/stores/metrics.store';
import { formatSessionText } from '@/features/workout/utils/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Trash2, Download, Clock, Cog, Upload, HardDrive, Cloud, CloudOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  STORE_KEYS,
  loadGisScript,
  initGoogleAuth,
  signIn,
  signOut,
  isConnected,
  getToken,
  ensureHeaders,
  pullAll,
  pushAll,
} from '@/services/google-sheets';

export function SettingsPage() {
  /* Timer settings */
  const defaultDuration = useTimerStore((s) => s.defaultDuration);
  const setDefaultDuration = useTimerStore((s) => s.setDefaultDuration);

  /* Data stores for export and danger zone */
  const sessions = useWorkoutStore((s) => s.sessions);
  const clearSessions = useWorkoutStore((s) => s.clearSessions);
  const days = useProgramStore((s) => s.days);
  const getExerciseById = useExercisesStore((s) => s.getExerciseById);
  const clearMetrics = useMetricsStore((s) => s.clearMetrics);

  /* Local UI state */
  const [timerInput, setTimerInput] = useState(String(defaultDuration));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const exportRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* JSON backup state */
  const [importStatus, setImportStatus] = useState<string | null>(null);

  /* Google Sheets state */
  const [clientId, setClientId] = useState(() => localStorage.getItem('gymapp-gsheets-client-id') ?? '');
  const [spreadsheetId, setSpreadsheetId] = useState(() => localStorage.getItem('gymapp-gsheets-spreadsheet-id') ?? '');
  const [gsConnected, setGsConnected] = useState(() => isConnected());
  const [gsStatus, setGsStatus] = useState<string | null>(null);
  const [gsLoading, setGsLoading] = useState(false);

  /** Filter and sort completed sessions for export (oldest first for chronological reading) */
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.completed).sort((a, b) => a.date.localeCompare(b.date)),
    [sessions]
  );

  /** Generate formatted export text — all completed sessions separated by horizontal rules */
  const exportText = useMemo(() => {
    if (completedSessions.length === 0) return '';

    return completedSessions
      .map((session) => {
        const programDay = days.find((d) => d.dayNumber === session.dayNumber) ?? {
          dayNumber: session.dayNumber,
          label: session.dayLabel,
          slots: [],
        };
        return formatSessionText(session, programDay, getExerciseById);
      })
      .join('\n\n---\n\n');
  }, [completedSessions, days, getExerciseById]);

  /** Select all export text for manual copy fallback */
  const selectExportText = useCallback(() => {
    const el = exportRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  /** Multi-strategy clipboard copy (same approach as WorkoutDayView) */
  const handleCopy = async () => {
    if (!exportText) return;
    setCopyError(null);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportText);
      } else {
        throw new Error('Clipboard API not available');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = exportText;
        textarea.readOnly = true;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        selectExportText();
        setCopyError('Copy failed. Text selected — tap Copy.');
      }
    }
  };

  /** Save the timer duration input to the store */
  const handleSaveTimer = () => {
    const val = parseInt(timerInput, 10);
    if (!isNaN(val) && val > 0) {
      setDefaultDuration(val);
    }
  };

  /* ── JSON Backup Handlers ── */

  /** Export all store data as a downloadable JSON file */
  const handleExportJson = () => {
    const backup: Record<string, unknown> = {};
    for (const key of STORE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          backup[key] = JSON.parse(raw);
        } catch {
          backup[key] = raw;
        }
      }
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Import JSON backup from file — validates keys, writes to localStorage, reloads */
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (typeof data !== 'object' || data === null) {
          setImportStatus('Invalid backup file format.');
          return;
        }

        const validKeys = new Set<string>(STORE_KEYS);
        let restored = 0;
        for (const [key, value] of Object.entries(data)) {
          if (validKeys.has(key)) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            restored++;
          }
        }

        if (restored === 0) {
          setImportStatus('No valid store keys found in backup.');
          return;
        }

        setImportStatus(`Restored ${restored} store(s). Reloading...`);
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        setImportStatus('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  /* ── Google Sheets Handlers ── */

  /** Connect to Google via OAuth popup, then auto-pull from sheet */
  const handleGsConnect = async () => {
    if (!clientId.trim() || !spreadsheetId.trim()) {
      setGsStatus('Enter both Client ID and Spreadsheet ID first.');
      return;
    }
    setGsLoading(true);
    setGsStatus(null);
    try {
      localStorage.setItem('gymapp-gsheets-client-id', clientId.trim());
      localStorage.setItem('gymapp-gsheets-spreadsheet-id', spreadsheetId.trim());

      await loadGisScript();
      initGoogleAuth(clientId.trim());
      const token = await signIn();
      setGsConnected(true);

      // Auto-pull on connect
      setGsStatus('Connected. Pulling data...');
      await ensureHeaders(spreadsheetId.trim(), token);
      const { sessions: sCnt } = await pullAll(spreadsheetId.trim(), token);

      if (sCnt > 0) {
        setGsStatus(`Pulled ${sCnt} session(s). Reloading...`);
        setTimeout(() => window.location.reload(), 800);
      } else {
        // Sheet is empty — push local data to initialize it
        setGsStatus('Sheet empty. Pushing local data...');
        const pushed = await pushAll(spreadsheetId.trim(), token);
        setGsStatus(`Pushed ${pushed} session(s) to sheet. Connected.`);
      }
    } catch (err) {
      setGsStatus(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGsLoading(false);
    }
  };

  /** Disconnect Google account */
  const handleGsDisconnect = () => {
    signOut();
    setGsConnected(false);
    setGsStatus('Disconnected.');
  };

  /** Push ALL local data to Google Sheet */
  const handleGsPush = async () => {
    const token = getToken();
    if (!token) {
      setGsStatus('Not connected. Click Connect first.');
      return;
    }
    setGsLoading(true);
    setGsStatus('Pushing all data...');
    try {
      const count = await pushAll(spreadsheetId.trim(), token);
      setGsStatus(`Pushed ${count} session(s) + config.`);
    } catch (err) {
      setGsStatus(`Push failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGsLoading(false);
    }
  };

  /** Pull all data from Google Sheet */
  const handleGsPull = async () => {
    const token = getToken();
    if (!token) {
      setGsStatus('Not connected. Click Connect first.');
      return;
    }
    setGsLoading(true);
    setGsStatus('Pulling data...');
    try {
      const { sessions: sCnt, config: cCnt } = await pullAll(spreadsheetId.trim(), token);
      if (sCnt === 0 && cCnt === 0) {
        setGsStatus('No data found in sheet.');
      } else {
        setGsStatus(`Pulled ${sCnt} session(s), ${cCnt} config(s). Reloading...`);
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      setGsStatus(`Pull failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* ── Rest Timer configuration ── */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Rest Timer</h3>
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            value={timerInput}
            onChange={(e) => setTimerInput(e.target.value)}
            min={10}
            max={600}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground self-center">seconds</span>
          <Button size="sm" onClick={handleSaveTimer}>
            Save
          </Button>
        </div>
      </div>

      {/* ── Program configuration link ── */}
      <Link to="/program" className="block">
        <div className="bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Workout Program</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure your 7-day split and assign exercises
          </p>
        </div>
      </Link>

      {/* ── Backup & Restore (JSON) ── */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Backup & Restore</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleExportJson}>
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportJson}
          />
        </div>
        {importStatus && (
          <p className="text-xs text-muted-foreground mt-2">{importStatus}</p>
        )}
      </div>

      {/* ── Google Sheets Sync ── */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          {gsConnected ? (
            <Cloud className="h-4 w-4 text-success" />
          ) : (
            <CloudOff className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold">Google Sheets Sync</h3>
          {gsConnected && (
            <span className="ml-auto text-[10px] font-medium text-success bg-success/15 px-1.5 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="OAuth Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Spreadsheet ID"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            className="text-xs"
          />
          <div className="flex gap-2">
            {!gsConnected ? (
              <Button size="sm" className="flex-1" onClick={handleGsConnect} disabled={gsLoading}>
                {gsLoading ? 'Connecting...' : 'Connect'}
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleGsPush} disabled={gsLoading}>
                  {gsLoading ? '...' : 'Push to Sheets'}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={handleGsPull} disabled={gsLoading}>
                  {gsLoading ? '...' : 'Pull from Sheets'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleGsDisconnect} disabled={gsLoading}>
                  Disconnect
                </Button>
              </>
            )}
          </div>
          {gsStatus && (
            <p className="text-xs text-muted-foreground">{gsStatus}</p>
          )}
        </div>
      </div>

      {/* ── Export completed workouts ── */}
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Export Workouts</h3>
        </div>

        {completedSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No completed workouts to export.</p>
        ) : (
          <>
            <pre
              ref={exportRef}
              className="text-xs bg-background rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap mb-3 text-muted-foreground"
              onClick={selectExportText}
            >
              {exportText}
            </pre>
            {copyError && (
              <div className="mb-2 text-xs text-destructive">{copyError}</div>
            )}
            <div className="flex gap-2">
              <Button
                variant={copied ? 'success' : 'outline'}
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={selectExportText} className="flex-1">
                Select Text
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── Danger Zone: destructive data operations ── */}
      <div className="bg-card rounded-xl border border-destructive/30 p-4">
        <h3 className="text-sm font-semibold text-destructive mb-3">Danger Zone</h3>
        <div className="flex flex-col gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete ALL workout sessions? This cannot be undone.')) {
                clearSessions();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All Workouts
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete ALL body metrics? This cannot be undone.')) {
                clearMetrics();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear All Metrics
          </Button>
        </div>
      </div>
    </div>
  );
}
