import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {verifyGeminiArtifact} from '../scripts/gemini-verification.mjs';

test('Gemini verification rejects false success, missing artifacts and stale receipts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'trinity-gemini-'));
  const file = join(dir, 'receipt.json');
  const expected = {nonce: 'fresh-run', version: '10.2.0', deployment_tag: 'source-commit'};
  try {
    await assert.rejects(verifyGeminiArtifact({status:'SUCCESS',denied_actions:[{action:'command'}]}, file, expected), /denied/);
    await assert.rejects(verifyGeminiArtifact({status:'SUCCESS'}, file, expected), /artifact/);
    await writeFile(file, JSON.stringify({...expected, nonce:'old-run'}));
    await assert.rejects(verifyGeminiArtifact({status:'SUCCESS'}, file, expected), /nonce/);
    await writeFile(file, JSON.stringify(expected));
    assert.equal((await verifyGeminiArtifact({status:'SUCCESS'}, file, expected)).verified, true);
  } finally { await rm(dir, {recursive:true, force:true}); }
});
