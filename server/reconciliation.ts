import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { db } from './db';
import { assets, reconReports, auditEvents } from '@shared/schema';

async function readExpectedList(filePath?: string) {
  if (!filePath) return null;
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const records = csvParse(content, { columns: true, skip_empty_lines: true });
  // Expect CSV with assetId or serial columns
  return records;
}

function diffAssets(expected: any[], current: any[]) {
  const expectedMap = new Map();
  for (const e of expected) {
    // prefer assetId, fallback to serial
    const key = e.assetId || e.serial;
    if (key) expectedMap.set(String(key), e);
  }

  const currentMap = new Map();
  for (const c of current) {
    currentMap.set(String(c.assetId || c.serial || c.id), c);
  }

  const diffs: any[] = [];

  // missing in DB
  for (const [k, e] of expectedMap.entries()) {
    if (!currentMap.has(k)) diffs.push({ type: 'missing_in_db', key: k, expected: e });
  }

  // unexpected in DB
  for (const [k, c] of currentMap.entries()) {
    if (!expectedMap.has(k)) diffs.push({ type: 'unexpected_in_db', key: k, current: c });
  }

  return diffs;
}

export async function runOnce(file?: string) {
  // load current assets
  const current = await db.select().from(assets);

  // If a file path was passed use it, otherwise check for a default CSV under ./data/expected_inventory.csv
  let expectedFile = file;
  if (!expectedFile) {
    const defaultPath = path.resolve(process.cwd(), 'data', 'expected_inventory.csv');
    if (fs.existsSync(defaultPath)) expectedFile = defaultPath;
  }

  const expected = expectedFile ? await readExpectedList(expectedFile) : null;

  const diffs = expected ? diffAssets(expected, current) : [];

  const report = {
    runAt: new Date(),
    diff: JSON.stringify(diffs),
    status: diffs.length ? 'anomalies' : 'ok',
  };

  await db.insert(reconReports).values({ runAt: report.runAt, diff: report.diff, status: report.status });

  for (const d of diffs) {
    await db.insert(auditEvents).values({ eventType: 'recon_diff', payload: JSON.stringify(d) });
  }

  console.log('Reconciliation finished. Diffs:', diffs.length);
}

// Note: `runOnce` is exported for programmatic use. To run from CLI use
// `npm run reconciliation -- --once` which will import this file as a script.
