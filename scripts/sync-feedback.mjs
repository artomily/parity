#!/usr/bin/env node
// Syncs tester feedback (Google Sheet → docs/feedback/responses.csv) into FEEDBACK.md,
// USERS.md (first 50 wallets) and LAUNCH_USERS.md (the rest).
//
//   npm run feedback:sync            # use the local CSV
//   npm run feedback:sync -- --fetch # pull the sheet first (sheet must be link-viewable)
import { readFileSync, writeFileSync } from 'node:fs';

const SHEET_ID = '1F6iwAxAkxY0_KSK1Jo51GBfj4jb83xkct_0ZwKkPBno';
const GID = '1940241653';
const CSV = 'docs/feedback/responses.csv';
const LEVEL5_TARGET = 50;
const LEVEL6_TARGET = 20;
const date = process.env.FEEDBACK_DATE ?? new Date().toISOString().slice(0, 10);

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Map headers by keyword so both the exported sheet and a Google Form response sheet work.
function toResponses(rows) {
  const header = rows[0].map((h) => h.toLowerCase());
  const col = (...keys) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  const idx = {
    wallet: col('wallet'),
    completed: col('complete'),
    stuck: col('stuck', 'confus'),
    change: col('change'),
    ease: col('easy'),
  };
  if (Object.values(idx).some((i) => i < 0)) throw new Error(`Unrecognised CSV header: ${rows[0]}`);
  const seen = new Set();
  return rows.slice(1)
    .map((r) => ({
      wallet: r[idx.wallet]?.trim(),
      completed: r[idx.completed]?.trim(),
      stuck: r[idx.stuck]?.trim(),
      change: r[idx.change]?.trim(),
      ease: Number(r[idx.ease]),
    }))
    .filter((r) => /^mn_addr_preprod1[0-9a-z]+$/.test(r.wallet ?? '') && !seen.has(r.wallet) && seen.add(r.wallet));
}

// Order matters: first matching theme wins for each "one thing you'd change" answer.
const THEMES = [
  { name: 'Transaction status & progress visibility', re: /transaction|status|progress|result|history|activity|real time/i,
    fix: 'Transaction stepper (Building proof → Approve in Lace → Submitted → Confirmed) with the full tx id', commit: '9239cba' },
  { name: 'Loading / waiting-state clarity', re: /loading|waiting|wait/i,
    fix: 'Waiting message for each step that explains what is happening, how long it usually takes and the time elapsed', commit: 'c179197' },
  { name: 'Confirmation & success feedback', re: /confirm|success|completion|submitted|final|notification|feedback/i,
    fix: 'Explicit "Confirmed on Midnight Preprod" banner that says what changed and what to do next, with a copyable tx id', commit: 'c78669d' },
  { name: 'Wallet connection state', re: /wallet|connect/i,
    fix: 'Persistent connected-wallet badge in the header plus step-by-step Lace connection instructions' },
  { name: 'Onboarding, guidance & wording', re: /onboard|guide|explan|instruction|context|tooltip|wording|term|call to action|next-step|first screen|new users|quick-start|examples/i,
    fix: 'Inline tooltips for Midnight terms, a clear call to action after each step, quick-start copy on the first screen' },
  { name: 'Errors & recovery', re: /error|retry|fail/i,
    fix: 'Human-readable error messages with a retry button' },
  { name: 'Speed & number of steps', re: /fast|shorter|steps|screens|compact/i,
    fix: 'Collapse redundant confirmation screens' },
  { name: 'Visual polish & mobile', re: /mobile|button|label|visual|cleaner|prominent|navigation|animation/i,
    fix: 'Descriptive button labels, stronger visual hierarchy, mobile spacing fixes' },
  { name: 'No change needed', re: /no (major )?changes needed/i, fix: null },
];
const themeOf = (r) => THEMES.find((t) => t.re.test(r.change)) ?? THEMES.at(-1);

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
const short = (w) => `\`${w.slice(0, 22)}…${w.slice(-6)}\``;

function between(file, tag, body) {
  const text = readFileSync(file, 'utf8');
  const re = new RegExp(`(<!-- ${tag}:start -->)[\\s\\S]*?(<!-- ${tag}:end -->)`);
  if (!re.test(text)) throw new Error(`${file}: missing <!-- ${tag}:start/end --> markers`);
  writeFileSync(file, text.replace(re, `$1\n${body.trim()}\n$2`));
}

function usersTable(list, offset, target) {
  const rows = list.map((r, i) => `| ${String(offset + i + 1).padEnd(2)} | \`${r.wallet}\` |`);
  return ['| #  | Wallet Address |', '|----|----------------|', ...rows, '',
    `Current count: ${list.length} / ${target}`].join('\n');
}

async function main() {
  if (process.argv.includes('--fetch')) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    const res = await fetch(url, { redirect: 'follow' });
    const body = await res.text();
    if (!res.ok || body.trimStart().startsWith('<')) {
      throw new Error(`Could not export the sheet (HTTP ${res.status}). Share it as "Anyone with the link: Viewer", or download it as CSV to ${CSV}.`);
    }
    writeFileSync(CSV, body.endsWith('\n') ? body : body + '\n');
    console.log(`Fetched sheet → ${CSV}`);
  }

  const responses = toResponses(parseCsv(readFileSync(CSV, 'utf8')));
  const n = responses.length;
  const full = responses.filter((r) => /^yes/i.test(r.completed)).length;
  const partly = responses.filter((r) => /^partly/i.test(r.completed)).length;
  const avg = (responses.reduce((a, r) => a + r.ease, 0) / n).toFixed(2);
  const dist = [5, 4, 3, 2, 1].map((s) => `${s}★ ${responses.filter((r) => r.ease === s).length}`).join(' · ');
  const pct = (x) => `${Math.round((x / n) * 100)}%`;

  between('docs/FEEDBACK.md', 'feedback:log', [
    `_${n} responses ([responses.csv](feedback/responses.csv))._`,
    '',
    '| # | Wallet | Completed | Stuck / Confused | One Change | Ease | Date |',
    '|---|--------|-----------|------------------|------------|------|------|',
    ...responses.map((r, i) =>
      `| ${i + 1} | ${short(r.wallet)} | ${esc(r.completed)} | ${esc(r.stuck)} | ${esc(r.change)} | ${r.ease} | ${date} |`),
  ].join('\n'));

  const stuck = responses.filter((r) => !/^yes/i.test(r.completed));
  const grouped = THEMES.map((t) => ({ ...t, hits: responses.filter((r) => themeOf(r) === t) }))
    .filter((t) => t.hits.length).sort((a, b) => b.hits.length - a.hits.length);

  between('docs/FEEDBACK.md', 'feedback:themes', [
    '| Metric | Value |', '|--------|-------|',
    `| Responses | ${n} |`,
    `| Completed the whole flow | ${full} (${pct(full)}) |`,
    `| Completed partly | ${partly} (${pct(partly)}) |`,
    `| Average ease (1–5) | ${avg} |`,
    `| Ease distribution | ${dist} |`,
    '',
    '**Requested changes, grouped by theme:**',
    '',
    '| Theme | Testers | Example requests |', '|-------|---------|------------------|',
    ...grouped.map((t) => `| ${t.name} | ${t.hits.length} | ${[...new Set(t.hits.map((h) => h.change))].slice(0, 3).map(esc).join('; ')} |`),
    '',
    `**Where the ${stuck.length} partial completions got stuck:**`,
    '',
    ...stuck.map((r) => `- ${esc(r.stuck)} (ease ${r.ease})`),
  ].join('\n'));

  between('docs/FEEDBACK.md', 'feedback:level6', [
    '| Change | User Feedback That Triggered It | Status |', '|--------|--------------------------------|--------|',
    ...grouped.filter((t) => t.fix).slice(0, 5).map((t) =>
      `| ${t.fix} | ${t.hits.length} testers — e.g. "${esc(t.hits[0].change)}" | ${t.commit ? `Done (${t.commit})` : 'Planned'} |`),
  ].join('\n'));

  between('docs/FEEDBACK.md', 'feedback:changed', [
    '| Change | Reason | Commit |', '|--------|--------|--------|',
    ...grouped.filter((t) => t.commit).map((t) =>
      `| ${t.fix} | ${t.hits.length} testers asked for ${t.name.toLowerCase()} | ${t.commit} |`),
  ].join('\n'));

  between('USERS.md', 'users', usersTable(responses.slice(0, LEVEL5_TARGET), 0, LEVEL5_TARGET));
  between('LAUNCH_USERS.md', 'users', usersTable(responses.slice(LEVEL5_TARGET), 0, LEVEL6_TARGET));

  console.log(`Synced ${n} responses: ${Math.min(n, LEVEL5_TARGET)} → USERS.md, ${Math.max(0, n - LEVEL5_TARGET)} → LAUNCH_USERS.md`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
