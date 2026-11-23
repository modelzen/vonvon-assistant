#!/usr/bin/env node
import { cp, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const agentsSkillsDir = join(root, '.agents', 'skills');
const claudeSkillsDir = join(root, '.claude', 'skills');
const agentsDoc = join(root, 'AGENTS.md');
const claudeDoc = join(root, 'CLAUDE.md');
const manifestPath = join(root, 'vonvon-bot.json');
const MAX_SKILL_BYTES = 128 * 1024;
const checkOnly = process.argv.includes('--check');

function scalar(value) {
  return value.trim().replace(/^(['"])([\s\S]*)\1$/u, '$2');
}

async function listFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(err => {
    if (err.code === 'ENOENT') return [];
    throw err;
  });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full, base)));
    } else if (entry.isFile()) {
      files.push(relative(base, full));
    }
  }
  return files.sort();
}

async function validateSkills(dir) {
  const errors = [];
  const entries = await readdir(dir, { withFileTypes: true });
  const skillDirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();
  if (skillDirs.length === 0) {
    errors.push(`No skills found in ${relative(root, dir)}`);
    return { errors, skillDirs };
  }
  for (const skillName of skillDirs) {
    const file = join(dir, skillName, 'SKILL.md');
    let info;
    try {
      info = await stat(file);
    } catch {
      errors.push(`Missing SKILL.md in ${relative(root, join(dir, skillName))}`);
      continue;
    }
    if (info.size > MAX_SKILL_BYTES) {
      errors.push(`${relative(root, file)} exceeds 128 KB limit (${info.size} bytes)`);
    }
    const content = await readFile(file, 'utf8');
    // Match the exact frontmatter parser in vonvon-bot's packages/daemon/src/agent/group-skills.ts
    const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u)?.[1];
    if (!frontmatter) {
      errors.push(`${relative(root, file)} is missing valid YAML frontmatter`);
      continue;
    }
    const parsedName = scalar(frontmatter.match(/^name:\s*(.+)$/mu)?.[1] ?? '');
    const rawDesc = frontmatter.match(/^description:\s*(.+)$/mu)?.[1] ?? '';
    const parsedDesc = /^[>|][-+]?\s*$/u.test(rawDesc)
      ? (frontmatter.match(/^description:[^\n]*\n((?:[ \t]+[^\n]*(?:\n|$))*)/mu)?.[1] ?? '').trim().replace(/\s+/gu, ' ')
      : scalar(rawDesc);
    if (!parsedName) errors.push(`${relative(root, file)} is missing frontmatter 'name'`);
    if (parsedName && parsedName !== skillName) {
      errors.push(`${relative(root, file)} frontmatter name '${parsedName}' does not match directory '${skillName}'`);
    }
    if (!parsedDesc) errors.push(`${relative(root, file)} is missing frontmatter 'description'`);
  }
  return { errors, skillDirs };
}

async function validateManifest(skillDirs) {
  const errors = [];
  let raw;
  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch {
    return ['Missing vonvon-bot.json'];
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    return [`Invalid JSON in vonvon-bot.json: ${err.message}`];
  }
  if (manifest.schemaVersion !== 1) errors.push('vonvon-bot.json: schemaVersion must be 1');
  for (const field of ['id', 'kind', 'name', 'summary']) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim()) {
      errors.push(`vonvon-bot.json: missing non-empty '${field}'`);
    }
  }
  if (manifest.files && typeof manifest.files === 'object') {
    for (const [key, relPath] of Object.entries(manifest.files)) {
      if (typeof relPath !== 'string' || !relPath.trim()) {
        errors.push(`vonvon-bot.json: files.${key} must be a non-empty path`);
        continue;
      }
      const exists = await stat(join(root, relPath)).then(s => s.isFile()).catch(() => false);
      if (!exists) errors.push(`vonvon-bot.json: files.${key} target not found (${relPath})`);
    }
  }
  if (!Array.isArray(manifest.skills)) {
    errors.push('vonvon-bot.json: skills must be an array');
  } else {
    const declared = manifest.skills.map(s => s?.name).filter(Boolean).sort();
    const expected = [...skillDirs].sort();
    if (JSON.stringify(declared) !== JSON.stringify(expected)) {
      errors.push(`vonvon-bot.json: skills [${declared.join(', ')}] do not match .agents/skills [${expected.join(', ')}]`);
    }
  }
  return errors;
}

async function compareDirs(src, dst) {
  const diffs = [];
  const srcFiles = await listFiles(src);
  const dstFiles = await listFiles(dst);
  const srcSet = new Set(srcFiles);
  const dstSet = new Set(dstFiles);

  for (const rel of srcFiles) {
    if (!dstSet.has(rel)) {
      diffs.push(`Missing in ${relative(root, dst)}: ${rel}`);
      continue;
    }
    const [a, b] = await Promise.all([readFile(join(src, rel)), readFile(join(dst, rel))]);
    if (!a.equals(b)) diffs.push(`Content differs: ${rel}`);
  }
  for (const rel of dstFiles) {
    if (!srcSet.has(rel)) diffs.push(`Extra file in ${relative(root, dst)}: ${rel}`);
  }
  return diffs;
}

async function main() {
  const { errors: skillErrors, skillDirs } = await validateSkills(agentsSkillsDir);
  const manifestErrors = await validateManifest(skillDirs);
  const validationErrors = [...skillErrors, ...manifestErrors];
  if (validationErrors.length) {
    for (const err of validationErrors) console.error(`[ERROR] ${err}`);
    process.exit(1);
  }

  if (checkOnly) {
    const diffs = await compareDirs(agentsSkillsDir, claudeSkillsDir);
    const [aDoc, cDoc] = await Promise.all([
      readFile(agentsDoc).catch(() => null),
      readFile(claudeDoc).catch(() => null),
    ]);
    if (!aDoc || !cDoc || !aDoc.equals(cDoc)) {
      diffs.push('AGENTS.md and CLAUDE.md are out of sync');
    }
    if (diffs.length) {
      for (const diff of diffs) console.error(`[DIFF] ${diff}`);
      console.error('Run `node scripts/sync-skills.mjs` to synchronize.');
      process.exit(1);
    }
    console.log('OK: vonvon-bot.json valid, skills frontmatter valid, .agents/skills == .claude/skills, AGENTS.md == CLAUDE.md.');
    return;
  }

  await rm(claudeSkillsDir, { recursive: true, force: true });
  await mkdir(dirname(claudeSkillsDir), { recursive: true });
  await cp(agentsSkillsDir, claudeSkillsDir, { recursive: true });
  await cp(agentsDoc, claudeDoc);
  console.log('Synced .agents/skills -> .claude/skills and AGENTS.md -> CLAUDE.md.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
