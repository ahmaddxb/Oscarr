import Database from 'better-sqlite3';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { getDataRoot } from '../utils/dataPath.js';

/** The plugin id of the official support plugin. The legacy export is written into that
 *  plugin's data dir so the plugin reads it via `ctx.getPluginDataDir()` — no symlink/cwd
 *  gymnastics. Hardcoded because this bridge only matters for upgrades from pre-0.8 cores
 *  where the support module shipped in-tree; it's not a generic dispatch point. */
const SUPPORT_PLUGIN_ID = 'arediss__oscarr-plugin-support';

interface LegacyTicketRow {
  id: number;
  userId: number;
  subject: string;
  status: string;
  createdAt: string;
  closedAt: string | null;
}

interface LegacyMessageRow {
  id: number;
  ticketId: number;
  userId: number;
  content: string;
  createdAt: string;
}

/** Pre-drop export of legacy SupportTicket / TicketMessage rows. Runs at boot before Prisma's
 *  drop migration. Reads via raw SQL and writes the export into the plugin's data dir, where
 *  the plugin imports it on first launch and then deletes the file. Idempotent — no-op if
 *  the tables are already gone; overwrites the export file otherwise. */
export function exportLegacySupportData(dbPath: string): void {
  let db: Database.Database;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });
  } catch {
    return;
  }

  try {
    // Check both tables exist before doing anything. SQLite stores schema in sqlite_master.
    const hasTickets = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='SupportTicket'")
      .get();
    const hasMessages = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='TicketMessage'")
      .get();
    if (!hasTickets || !hasMessages) return;

    const tickets = db.prepare(
      'SELECT id, userId, subject, status, createdAt, closedAt FROM SupportTicket ORDER BY id ASC',
    ).all() as LegacyTicketRow[];

    const messages = db.prepare(
      'SELECT id, ticketId, userId, content, createdAt FROM TicketMessage ORDER BY id ASC',
    ).all() as LegacyMessageRow[];

    if (tickets.length === 0 && messages.length === 0) return;

    const pluginDir = join(getDataRoot(), 'plugins', SUPPORT_PLUGIN_ID);
    mkdirSync(pluginDir, { recursive: true });
    const exportPath = join(pluginDir, 'legacy-import.json');
    writeFileSync(exportPath, JSON.stringify({
      exportedAt: new Date().toISOString(),
      tickets,
      messages,
    }, null, 2), 'utf-8');

    // eslint-disable-next-line no-console
    console.log(`[support-legacy-export] wrote ${tickets.length} tickets + ${messages.length} messages to ${exportPath}`);
  } finally {
    try { db.close(); } catch { /* idempotent */ }
  }
}

/** Resolve the file:// DATABASE_URL to an absolute filesystem path the same way Prisma does. */
export function getOscarrDbPath(prismaDir: string): string {
  const url = process.env.DATABASE_URL || 'file:../data/oscarr.db';
  const relative = url.replace('file:', '');
  return join(prismaDir, relative);
}

/** Convenience: resolve path + export. Caller passes the prisma dir to avoid a circular
 *  import on paths.ts. */
export function runLegacySupportExport(): void {
  // Late-resolve to avoid a circular import path through utils/paths.
  const prismaDir = dirname(getDataRoot()) + '/prisma';
  const dbPath = getOscarrDbPath(prismaDir);
  if (!existsSync(dbPath)) return;
  exportLegacySupportData(dbPath);
}
