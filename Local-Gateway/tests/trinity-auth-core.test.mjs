import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOT_REGISTRY,
  inspectWindowsSession,
  verifyTrinityIdentity,
  executePrivileged
} from '../src/trinity-auth-core.mjs';

const REAL_SID_SAMPLE = 'S-1-5-21-3544301928-1829384756-2938475610-1001';

test('Local-Gateway Auth Core: overí autentickú Windows reláciu (so skutočným SID) + odmietne podvrhnutý čistý text a syntetický SID', async () => {
  // 1. Skutočný Windows SID + osTokenVerified: true prejde
  const winSession = inspectWindowsSession({
    username: 'saboi',
    domain: 'BASTERIX-PC',
    sid: REAL_SID_SAMPLE,
    osTokenVerified: true
  });
  assert.equal(winSession.authenticated, true);
  assert.equal(winSession.role, 'BASTERIX_ROOT');
  assert.ok(winSession.sessionToken);

  // 2. Syntetický SID (S-1-5-21-BASTERIX-1001) musí byť ZABLOKOVANÝ
  const fakeSidSession = inspectWindowsSession({
    username: 'saboi',
    domain: 'BASTERIX-PC',
    sid: 'S-1-5-21-BASTERIX-1001',
    osTokenVerified: true
  });
  assert.equal(fakeSidSession.authenticated, false);
  assert.equal(fakeSidSession.reason, 'INVALID_OR_SYNTHETIC_WINDOWS_SID');

  // 3. Čistý textový email bez verifiedGoogleToken === true musí byť ZABLOKOVANÝ
  const unverifiedEmail = verifyTrinityIdentity({ email: 'saboivan2008@gmail.com' });
  assert.equal(unverifiedEmail.isRoot, false);
  assert.equal(unverifiedEmail.channel, 'SPOOFED_UNVERIFIED_GOOGLE_INPUT');

  // 4. Overený Google účet (verifiedGoogleToken: true) prejde
  for (const email of ROOT_REGISTRY.google_accounts) {
    const v = verifyTrinityIdentity({ email, verifiedGoogleToken: true });
    assert.equal(v.isRoot, true);
    assert.equal(v.channel, 'GOOGLE_ACCOUNT');
  }

  // 5. Overené telefónne čísla (verifiedWebhookSignature: true) prejdú
  for (const phone of ['0949009722', '+421 949 009 722', '0949515777', '+421 949 515 777']) {
    const v = verifyTrinityIdentity({ phone, verifiedWebhookSignature: true });
    assert.equal(v.isRoot, true);
    assert.equal(v.channel, 'TELECOM_CHANNEL');
  }

  const ok = await executePrivileged(
    { email: 'cadjavadvocecka013@gmail.com', verifiedGoogleToken: true },
    { action: 'OPEN_APP', target: 'whatsapp' },
    () => 'EXECUTED_IMMEDIATELY'
  );
  assert.equal(ok, 'EXECUTED_IMMEDIATELY');

  await assert.rejects(
    () => executePrivileged({ email: 'saboivan2008@gmail.com', verifiedGoogleToken: false, checkLocalWindows: false }, { action: 'EXECUTE_CMD' }, () => 'NO'),
    /ACCESS DENIED.*UNVERIFIED_GOOGLE_OAUTH_TOKEN/
  );
});
