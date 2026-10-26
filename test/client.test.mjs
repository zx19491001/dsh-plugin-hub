import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function readJson(relative) {
  return JSON.parse(read(relative));
}

test('package manifest describes an installable DSH bundle', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.name, '@local/dsh-plugin-hub');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.equal(pkg.dsh.client.immediately, true);
  assert.ok(Array.isArray(pkg.dsh.client.inject));
  assert.equal(pkg.exports['./client'], './client.js');
  assert.equal(pkg.exports['./icon'], './icon.svg');
  assert.equal(pkg.exports['./locale/*.json'], './locale/*.json');
});

test('every runtime file listed in package.json exists', () => {
  const { files } = readJson('package.json');
  assert.ok(files.includes('client.js'));
  assert.ok(files.includes('index.js'));
  assert.ok(files.includes('cordis.patch.yml'));
  for (const entry of files) {
    if (entry.includes('*')) {
      const dir = entry.split('/')[0];
      const matches = fs.readdirSync(path.join(root, dir));
      assert.ok(matches.length > 0, `${entry} matched no files`);
      continue;
    }
    assert.ok(fs.existsSync(path.join(root, entry)), `${entry} is missing`);
  }
});

test('bundle patch inserts the plugin row with the package name', () => {
  const patch = read('cordis.patch.yml');
  assert.match(patch, /id:\s*plugin-hub/);
  assert.match(patch, /name:\s*'@local\/dsh-plugin-hub'/);
});

test('host half exports apply()', () => {
  const host = read('index.js');
  assert.match(host, /export function apply\(\)/);
});

test('client bundle parses and registers both slot halves', () => {
  const source = read('client.js');
  assert.doesNotThrow(() => new Function(source), 'client.js must be valid JavaScript');
  assert.match(source, /__ModuleLoader__\.load\(\{/);
  assert.match(source, /id: '@local\/dsh-plugin-hub'/);
  assert.match(source, /const PANEL_ID = 'plugin-hub'/);
  assert.match(source, /name: 'sidebar\.panellist',\s*\n\s*id: PANEL_ID/);
  assert.match(source, /ctx\.slots\.inject\('sidebar\.panellist'/);
  assert.match(source, /ctx\.slots\.inject\('main'/);
  assert.match(source, /ctx\.slots\.register\(\{ name: 'main', key: PANEL_ID \}/);
});

test('client bundle avoids document-level mutation', () => {
  const source = read('client.js');
  assert.doesNotMatch(source, /document\.body/);
  assert.doesNotMatch(source, /appendChild\(/);
  assert.doesNotMatch(source, /eval\(/);
});

test('every GitHub URL in the client points at this repository', () => {
  const source = read('client.js');
  const pkg = readJson('package.json');
  const expected = pkg.repository.replace(/^github:/, '');
  const urls = source.match(/https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?/g) || [];
  assert.ok(urls.length > 0, 'the client must link to its GitHub repository');
  for (const url of urls) {
    assert.ok(
      url === `https://github.com/${expected}` || url === `https://github.com/${expected}.git`,
      `unexpected GitHub URL: ${url}`,
    );
  }
});

test('locale resources carry plugin manager metadata', () => {
  for (const locale of ['zh', 'en']) {
    const dict = readJson(`locale/${locale}.json`);
    assert.ok(dict.meta && typeof dict.meta.title === 'string' && dict.meta.title.trim().length > 0);
    assert.ok(typeof dict.meta.description === 'string' && dict.meta.description.trim().length > 0);
    assert.notEqual(dict.meta.title, '@local/dsh-plugin-hub');
  }
});

test('icon is a valid, small SVG', () => {
  const file = path.join(root, 'icon.svg');
  assert.ok(fs.existsSync(file));
  const stat = fs.statSync(file);
  assert.ok(stat.size > 0 && stat.size <= 256 * 1024, 'icon must be at most 256 KiB');
  const svg = fs.readFileSync(file, 'utf8');
  assert.match(svg, /^<svg[\s>]/);
  assert.match(svg, /<\/svg>\s*$/);
  assert.match(svg, /viewBox="0 0 64 64"/);
});

test('client can resolve versions and build download URLs', () => {
  const source = read('client.js');
  assert.match(source, /function archiveUrl\(key, ref\)/);
  assert.match(source, /kind === 'tag' \? 'tags' : 'heads'/);
  assert.match(source, /'\/archive\/refs\/' \+ section \+ '\//);
  assert.match(source, /function encodeRef\(name\)/);
  assert.match(source, /https:\/\/raw\.githubusercontent\.com\//);
  assert.match(source, /function readRefs\(owner, repo, signal\)/);
  assert.match(source, /'\/branches\?per_page=100'/);
  assert.match(source, /'\/tags\?per_page=100'/);
});

test('client offers the github install spec', () => {
  const source = read('client.js');
  assert.match(source, /'github:' \+ key/);
  assert.match(source, /'github:' \+ quickRepo/);
  assert.match(source, /githubConnectionTimeoutMs/);
});

test('install action is guarded and uses the host plugin manager', () => {
  const source = read('client.js');
  assert.match(source, /const manager = resolveManager\(ctx\)/);
  assert.match(source, /function resolveManager\(ctx\)/);
  assert.match(source, /function readRemote\(ctx\)/);
  assert.match(source, /const manager = resolveManager\(ctx\)/);
  assert.match(source, /const canInstall = Boolean\(manager\)/);
  assert.match(source, /manager\.installBundle\('github:' \+ key, \{ requestId: requestId \}\)/);
  assert.match(source, /manager\.cancelInstall\(state\.requestId\)/);
  assert.match(source, /if \(!canInstall\) return null/);
  assert.doesNotMatch(source, /window\.confirm\(/);
});

test('README explains how to install from GitHub', () => {
  const readme = read('README.md');
  assert.match(readme, /github\.com\/zx19491001\/dsh-plugin-hub/);
  assert.match(readme, /plugin_manager/);
  assert.match(readme, /install_bundle/);
});
