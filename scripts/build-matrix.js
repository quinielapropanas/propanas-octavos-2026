#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
// FIFA Matrix Builder — robust generator with validation
//
// 1. Parses raw data from FIFA-raw-data.txt
// 2. Repairs known typos (extra H, missing L)
// 3. Validates all entries against the 495-combination space
// 4. Reports: matched, repaired, missing, invalid
// 5. Generates fifa-matrix.ts with all parseable entries
//    and stubs for missing ones
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ─── Combinatorics: generate all C(12,8) = 495 keys ──────

function generateAllCombinations() {
  const groups = 'ABCDEFGHIJKL'.split('');
  const result = [];
  const k = 8;

  function combine(start, current) {
    if (current.length === k) {
      result.push(current.slice().sort().join(''));
      return;
    }
    for (let i = start; i < groups.length; i++) {
      current.push(groups[i]);
      combine(i + 1, current);
      current.pop();
    }
  }
  combine(0, []);
  return result;
}

// ─── Parse raw data with error tolerance ─────────────────

function parseRaw(raw) {
  const parsed = [];
  const errors = [];
  const repairs = [];

  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const parts = line.split(';').map(s => s.trim());
    const rawKey = parts[0];
    const assignments = parts.slice(1).map(s => s.replace(/^3/, ''));

    if (assignments.length !== 8) {
      errors.push({ line, reason: `Expected 8 assignments, got ${assignments.length}` });
      continue;
    }

    const assignmentSet = new Set(assignments);
    if (assignmentSet.size !== 8) {
      errors.push({ line, reason: `Duplicate assignment: ${assignments.join(',')}` });
      continue;
    }

    // Try original key
    let normalizedKey = rawKey.split('').sort().join('');

    // Attempt repairs for mismatched keys
    if (rawKey.length !== 8) {
      // Strategy: the assignments tell us the TRUE key (assigned teams = qualifying groups)
      const correctKey = Array.from(assignmentSet).sort().join('');
      if (correctKey.length === 8) {
        repairs.push({
          line,
          originalKey: rawKey,
          repairedKey: correctKey,
          reason: `Key had ${rawKey.length} chars; inferred from assignments`,
        });
        normalizedKey = correctKey;
      } else {
        errors.push({ line, reason: `Cannot repair: key ${rawKey.length} chars, derived ${correctKey}` });
        continue;
      }
    }

    // Validate: assignments must match the key (they represent the qualifying groups)
    const keyLetters = new Set(normalizedKey.split(''));
    const misaligned = assignments.filter(a => !keyLetters.has(a));
    if (misaligned.length > 0) {
      // Attempt key repair from assignments (same as above)
      const correctKey = Array.from(assignmentSet).sort().join('');
      if (correctKey.length === 8 && correctKey !== normalizedKey) {
        repairs.push({
          line,
          originalKey: normalizedKey,
          repairedKey: correctKey,
          reason: `Assignments ${misaligned} not in key; repaired`,
        });
        normalizedKey = correctKey;
      } else {
        errors.push({
          line,
          reason: `Assignments ${misaligned.join(',')} not in key ${normalizedKey}`,
        });
        continue;
      }
    }

    parsed.push({ key: normalizedKey, assignments });
  }

  return { parsed, errors, repairs };
}

// ─── Deduplicate (keeping first occurrence) ──────────────

function dedupe(entries) {
  const seen = new Map();
  const duplicates = [];
  for (const e of entries) {
    if (seen.has(e.key)) {
      duplicates.push({
        key: e.key,
        firstAssignments: seen.get(e.key).assignments,
        duplicateAssignments: e.assignments,
      });
    } else {
      seen.set(e.key, e);
    }
  }
  return { unique: Array.from(seen.values()), duplicates };
}

// ─── Generate TypeScript output ──────────────────────────

const SLOT_ORDER = ['R32-07', 'R32-13', 'R32-09', 'R32-02', 'R32-10', 'R32-05', 'R32-15', 'R32-08'];

function generateTS(completeMatrix, missing) {
  const lines = [];
  lines.push('// ═══════════════════════════════════════════════════════════');
  lines.push('// FIFA Third-Place Matrix — AUTO-GENERATED');
  lines.push('//');
  lines.push('// Source: FIFA Regulations 2026, Annex C');
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push(`// Entries: ${Object.keys(completeMatrix).length} / 495`);
  if (missing.length > 0) {
    lines.push(`// WARNING: ${missing.length} combinations missing — see MISSING_COMBINATIONS`);
  }
  lines.push('//');
  lines.push('// For each of the 495 possible combinations of 8 best thirds');
  lines.push('// (C(12,8)), this table specifies which group\'s third-place team');
  lines.push('// goes into each of the 8 R32 slots that receive a 3rd-placer.');
  lines.push('// ═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`/** The 8 R32 slots that receive a third-placed team, in canonical order */`);
  lines.push(`export const SLOT_ORDER = ['${SLOT_ORDER.join("','")}'] as const;`);
  lines.push('');
  lines.push(`/** Complete matrix: key = sorted 8-letter qualifying groups, value = 8 group letters (one per SLOT_ORDER position) */`);
  lines.push('const MATRIX: Readonly<Record<string, readonly string[]>> = Object.freeze({');
  const keys = Object.keys(completeMatrix).sort();
  for (const key of keys) {
    const vals = completeMatrix[key];
    lines.push(`  '${key}': ['${vals.join("','")}'],`);
  }
  lines.push('});');
  lines.push('');

  if (missing.length > 0) {
    lines.push(`/**`);
    lines.push(` * Combinations missing from the matrix.`);
    lines.push(` * These ${missing.length} entries must be filled in from`);
    lines.push(` * FIFA Regulations 2026, Annex C before the tournament reaches`);
    lines.push(` * the knockout stage, or the bracket resolver will throw for`);
    lines.push(` * affected participants.`);
    lines.push(` */`);
    lines.push(`export const MISSING_COMBINATIONS: ReadonlyArray<string> = Object.freeze([`);
    for (const k of missing) {
      lines.push(`  '${k}',`);
    }
    lines.push(']);');
    lines.push('');
  } else {
    lines.push('export const MISSING_COMBINATIONS: ReadonlyArray<string> = Object.freeze([]);');
    lines.push('');
  }

  lines.push('/**');
  lines.push(' * Look up the third-place assignment for a given combination.');
  lines.push(' *');
  lines.push(' * @param combinationKey - Any 8-letter string with the qualifying groups (A-L).');
  lines.push(' *                          Case-insensitive. Order-insensitive (will be sorted).');
  lines.push(' * @returns Map of R32 slot → group letter (whose 3rd-place team goes there),');
  lines.push(' *          or null if the combination is not in the matrix (shouldn\'t happen');
  lines.push(' *          with complete data and valid inputs).');
  lines.push(' */');
  lines.push('export function lookupFIFAMatrix(combinationKey: string): Record<string, string> | null {');
  lines.push('  if (!combinationKey || combinationKey.length !== 8) return null;');
  lines.push('  const key = combinationKey.toUpperCase().split(\'\').sort().join(\'\');');
  lines.push('  // Validate characters are A-L');
  lines.push('  if (!/^[A-L]{8}$/.test(key)) return null;');
  lines.push('  // Validate no duplicate letters');
  lines.push('  if (new Set(key).size !== 8) return null;');
  lines.push('');
  lines.push('  const row = MATRIX[key];');
  lines.push('  if (!row) return null;');
  lines.push('');
  lines.push('  const result: Record<string, string> = {};');
  lines.push('  for (let i = 0; i < SLOT_ORDER.length; i++) {');
  lines.push('    result[SLOT_ORDER[i]] = row[i];');
  lines.push('  }');
  lines.push('  return result;');
  lines.push('}');
  lines.push('');
  lines.push('/**');
  lines.push(' * Runtime completeness check.');
  lines.push(' * Returns { complete, count, missing } — use in health checks.');
  lines.push(' */');
  lines.push('export function validateMatrixCompleteness() {');
  lines.push('  const count = Object.keys(MATRIX).length;');
  lines.push('  return {');
  lines.push('    complete: count === 495 && MISSING_COMBINATIONS.length === 0,');
  lines.push('    count,');
  lines.push('    expected: 495,');
  lines.push('    missing: MISSING_COMBINATIONS,');
  lines.push('  };');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────

const RAW_PATH = path.join(__dirname, 'FIFA-raw-data.txt');
const OUT_PATH = path.join(__dirname, '..', 'lib', 'domain', 'tournament', 'fifa-matrix.ts');

if (!fs.existsSync(RAW_PATH)) {
  console.error(`Raw data file not found: ${RAW_PATH}`);
  process.exit(1);
}

const raw = fs.readFileSync(RAW_PATH, 'utf-8');

console.log('═══ Parsing raw data ═══');
const { parsed, errors, repairs } = parseRaw(raw);
console.log(`  Parsed entries:   ${parsed.length}`);
console.log(`  Repaired:         ${repairs.length}`);
console.log(`  Invalid (dropped):${errors.length}`);

if (repairs.length > 0) {
  console.log('\n  Repairs made:');
  for (const r of repairs) {
    console.log(`    ${r.originalKey} → ${r.repairedKey} (${r.reason})`);
  }
}

if (errors.length > 0) {
  console.log('\n  Errors dropped:');
  for (const e of errors) {
    console.log(`    ${e.reason}: ${e.line.slice(0, 60)}...`);
  }
}

console.log('\n═══ Deduplicating ═══');
const { unique, duplicates } = dedupe(parsed);
console.log(`  Unique entries:   ${unique.length}`);
console.log(`  Duplicates found: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\n  Duplicate keys (kept first occurrence):');
  for (const d of duplicates) {
    console.log(`    ${d.key}: [${d.firstAssignments.join(',')}] vs [${d.duplicateAssignments.join(',')}]`);
  }
}

console.log('\n═══ Completeness check ═══');
const allCombos = generateAllCombinations();
console.log(`  Expected total:   ${allCombos.length}`);
const haveSet = new Set(unique.map(e => e.key));
const missing = allCombos.filter(k => !haveSet.has(k));
console.log(`  Have:             ${unique.length}`);
console.log(`  Missing:          ${missing.length}`);
console.log(`  Completeness:     ${((unique.length / 495) * 100).toFixed(1)}%`);

if (missing.length > 0) {
  console.log('\n  Missing combinations:');
  for (const k of missing) console.log(`    ${k}`);
}

console.log('\n═══ Generating TypeScript ═══');
const completeMatrix = {};
for (const e of unique) completeMatrix[e.key] = e.assignments;

const ts = generateTS(completeMatrix, missing);

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, ts, 'utf-8');
console.log(`  Wrote: ${OUT_PATH}`);
console.log(`  Lines: ${ts.split('\n').length}`);
console.log(`  Bytes: ${ts.length}`);

console.log('\n═══ Summary ═══');
console.log(`  ${unique.length}/495 entries (${((unique.length / 495) * 100).toFixed(1)}% complete)`);
if (missing.length === 0) {
  console.log('  ✓ MATRIX COMPLETE');
} else {
  console.log(`  ⚠ ${missing.length} combinations need manual entry from FIFA Regulations Annex C`);
}
