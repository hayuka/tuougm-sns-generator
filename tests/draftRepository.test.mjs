import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

// Node 24 strips TypeScript; resolve the app's bundler-style imports without adding test dependencies.
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('.') && context.parentURL) {
    const url = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(url)) return next(url.href, context);
  }
  return next(specifier, context);
} });
const { createDraftRepository } = await import('../src/posts/draftRepository.ts');
const { createDraft, validateDraft } = await import('../src/posts/draft.ts');
const v1 = 'sns-generator:draft:v1:tuougm';
const v2 = 'sns-generator:drafts:v2:tuougm';
function setup() {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  return { data, storage, repo: createDraftRepository(() => storage) };
}
function idea(brandId = 'tuougm', theme = 'アイデア') {
  return { ...createDraft(brandId), theme, platforms: [] };
}
function legacy() {
  const { revision, ...draft } = { ...idea(), platforms: ['instagram'], bodies: { instagram: '本文', threads: '保持する本文', facebook: '', x: '' } };
  return JSON.stringify({ version: 1, draft });
}
test('theme-only saves, whitespace fails, IDs and all hidden bodies are retained', () => {
  const { repo } = setup();
  assert.deepEqual(validateDraft(idea()), []);
  assert.ok(validateDraft(idea('tuougm', '  ')).length);
  assert.throws(() => repo.create(idea('tuougm', '  ')));
  const first = repo.create({ ...idea(), bodies: { instagram: '', threads: '非選択本文', facebook: '', x: '' } });
  const second = repo.create(idea('tuougm', '別投稿'));
  const updated = repo.update({ ...first, theme: '更新', createdAt: new Date().toISOString() }, first.revision);
  assert.equal(updated.id, first.id);
  assert.equal(updated.createdAt, first.createdAt);
  assert.equal(updated.revision, 2);
  assert.equal(updated.bodies.threads, '非選択本文');
  assert.deepEqual(repo.get('tuougm', second.id), second);
  assert.equal(repo.list('tuougm').length, 2);
  assert.equal(repo.get('re', first.id), null);
  repo.create(idea('re'));
  assert.equal(repo.list('re').length, 1);
  assert.equal(repo.list('tuougm').length, 2);
});
test('duplicate creation, stale update/delete, missing update and resurrection are rejected', () => {
  const { repo, data } = setup();
  const first = repo.create(idea());
  assert.throws(() => repo.create(first), /上書き/);
  const updated = repo.update({ ...first, theme: '最新' }, 1);
  const raw = data.get(v2);
  assert.throws(() => repo.update(first, 1), /上書き/);
  assert.throws(() => repo.delete('tuougm', first.id, 1), /上書き/);
  assert.equal(data.get(v2), raw);
  repo.delete('tuougm', updated.id, updated.revision);
  assert.throws(() => repo.update(updated, updated.revision), /存在/);
  assert.equal(repo.list('tuougm').length, 0);
});
test('v1 migration is lossless, repeatable, preserves source and never resurrects deleted data', () => {
  const { repo, data } = setup();
  const raw = legacy(); data.set(v1, raw);
  const old = JSON.parse(raw).draft;
  const first = repo.list('tuougm')[0];
  const { revision, ...rest } = first;
  assert.deepEqual(rest, old);
  assert.equal(revision, 1);
  assert.equal(data.get(v1), raw);
  assert.deepEqual(repo.list('tuougm'), [first]);
  repo.delete('tuougm', first.id, 1);
  assert.deepEqual(repo.list('tuougm'), []);
  assert.equal(data.get(v1), raw);
  assert.ok(data.has(v2));
});
test('corrupt JSON/schema, unknown version, foreign brands, duplicate IDs and invalid revisions are preserved', () => {
  const cases = ['{invalid', JSON.stringify({ version: 99 }), JSON.stringify({ version: 2, brandId: 're', posts: [], legacySource: null })];
  const saved = { ...idea(), revision: 1 };
  for (const posts of [[saved, saved], [{ ...saved, revision: 0 }], [{ ...saved, brandId: 're' }], [{ ...saved, bodies: {} }]]) {
    cases.push(JSON.stringify({ version: 2, brandId: 'tuougm', posts, legacySource: null }));
  }
  for (const raw of cases) {
    const { repo, data } = setup(); data.set(v2, raw);
    assert.throws(() => repo.list('tuougm'));
    assert.throws(() => repo.create(idea()));
    assert.equal(data.get(v2), raw);
  }
  for (const raw of ['{invalid', JSON.stringify({ version: 1, draft: idea('re') })]) {
    const { repo, data } = setup(); data.set(v1, raw);
    assert.throws(() => repo.list('tuougm'));
    assert.equal(data.get(v1), raw); assert.ok(!data.has(v2));
  }
});
test('quota and denied reads do not replace persisted data; failed migration leaves v1 intact', () => {
  const { repo, data, storage } = setup();
  const first = repo.create(idea()); const before = data.get(v2);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => repo.update({ ...first, theme: '変更' }, 1));
  assert.throws(() => repo.delete('tuougm', first.id, 1));
  assert.equal(data.get(v2), before);
  data.delete(v2); data.set(v1, legacy()); const old = data.get(v1);
  assert.throws(() => repo.list('tuougm'));
  assert.equal(data.get(v1), old); assert.ok(!data.has(v2));
  storage.getItem = () => { throw new Error('SecurityError'); };
  assert.throws(() => repo.list('tuougm'));
});
test('old-client v1 changes are a safe conflict, not a silent merge', () => {
  const { repo, data } = setup(); data.set(v1, legacy());
  repo.list('tuougm'); const before = data.get(v2);
  data.set(v1, legacy());
  assert.throws(() => repo.list('tuougm'), /上書き/);
  assert.throws(() => repo.create(idea()), /上書き/);
  assert.equal(data.get(v2), before);
});
test('readback mismatch reports failure; deterministic updated order', () => {
  const { repo, data, storage } = setup();
  const a = { ...idea(), revision: 1, updatedAt: '2020-01-01T00:00:00Z' };
  const b = { ...idea(), revision: 1, updatedAt: '2021-01-01T00:00:00Z' };
  data.set(v2, JSON.stringify({ version: 2, brandId: 'tuougm', legacySource: null, posts: [a, b] }));
  assert.deepEqual(repo.list('tuougm').map(p => p.id), [b.id, a.id]);
  storage.setItem = () => {};
  assert.throws(() => repo.create(idea()), /上書き/);
  assert.equal(repo.list('tuougm').length, 2);
});
