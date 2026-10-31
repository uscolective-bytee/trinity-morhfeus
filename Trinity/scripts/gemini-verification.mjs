import {readFile} from 'node:fs/promises';

// A provider's SUCCESS flag is insufficient: verify its artifact independently.
export async function verifyGeminiArtifact(result, artifactPath, expected) {
  if (result.status !== 'SUCCESS') throw new Error('Gemini did not finish successfully.');
  if (result.denied_actions?.length) throw new Error('Gemini had denied tool actions.');
  let artifact;
  try { artifact = JSON.parse(await readFile(artifactPath, 'utf8')); }
  catch { throw new Error('Gemini did not create a valid verification artifact.'); }
  for (const field of ['nonce', 'version', 'deployment_tag']) {
    if (artifact[field] !== expected[field]) throw new Error(`Gemini artifact mismatch: ${field}`);
  }
  return {verified: true, version: artifact.version, deployment_tag: artifact.deployment_tag};
}
