import test from 'node:test';
import assert from 'node:assert/strict';
import {proposeTransfer, confirmTransfer, getFinanceAuditLedger, SPENDING_CAPS} from '../src/finance-gateway.js';
import {runTool} from '../src/tools.js';

function createMockEnv(initialData = {}) {
  const store = {
    proposals: new Map(Object.entries(initialData.proposals || {})),
    ledger: [...(initialData.ledger || [])],
    secrets: new Map(Object.entries(initialData.secrets || {}))
  };

  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            this._args = args;
            return this;
          },
          async run() {
            if (sql.includes('INSERT INTO ops_finance_proposals')) {
              const [id, owner_id, amount_cents, recipient, provider, note, requires_push, confirmation_code, signature_hash, expires_at] = this._args;
              store.proposals.set(id, {
                id, owner_id, amount_cents, currency: 'EUR', recipient, provider, note, status: 'pending',
                requires_push_confirmation: requires_push, confirmation_code, signature_hash, expires_at
              });
              return {success: true};
            }
            if (sql.includes("UPDATE ops_finance_proposals SET status='completed'")) {
              const id = this._args[0];
              const p = store.proposals.get(id);
              if (p) p.status = 'completed';
              return {success: true};
            }
            if (sql.includes("UPDATE ops_finance_proposals SET status='aborted_missing_credentials'")) {
              const id = this._args[0];
              const p = store.proposals.get(id);
              if (p) p.status = 'aborted_missing_credentials';
              return {success: true};
            }
            if (sql.includes('INSERT INTO ops_finance_audit_ledger')) {
              const [id, proposal_id, owner_id, amount_cents, recipient, provider, status, provider_tx_id, prev_entry_hash, entry_hash, timestamp, receipt_json] = this._args;
              store.ledger.push({
                id, proposal_id, owner_id, amount_cents, recipient, provider, status, provider_tx_id, prev_entry_hash, entry_hash, timestamp, receipt_json
              });
              return {success: true};
            }
            return {success: true};
          },
          async first() {
            if (sql.includes('SELECT SUM(amount_cents)')) {
              const total = store.ledger.filter(l => l.status === 'completed').reduce((sum, l) => sum + l.amount_cents, 0);
              return {total};
            }
            if (sql.includes('SELECT * FROM ops_finance_proposals WHERE id=?')) {
              return store.proposals.get(this._args[0]) || null;
            }
            if (sql.includes('SELECT entry_hash FROM ops_finance_audit_ledger')) {
              return store.ledger.at(-1) || null;
            }
            if (sql.includes('ops_plugins')) {
              return {installed: 1, enabled: 1};
            }
            if (sql.includes('ops_secret_vault')) {
              const provider = this._args[1];
              return store.secrets.get(provider) || null;
            }
            return null;
          },
          async all() {
            if (sql.includes('SELECT id, proposal_id, amount_cents')) {
              return {results: store.ledger};
            }
            if (sql.includes('ops_plugins')) {
              return {results: [{id: 'trading', installed: 1, enabled: 1}]};
            }
            return {results: []};
          }
        };
      }
    }
  };

  return {env, store};
}

test('Finance Gateway: Propose transfer validates spending caps and creates proposal', async () => {
  const {env} = createMockEnv();
  const ownerId = 'basterix';

  const proposal = await proposeTransfer(env, ownerId, {
    amount_eur: 25.00,
    recipient: '@basterix_vault',
    provider: 'revolut',
    note: 'Test prevodu'
  });

  assert.ok(proposal.proposal_id.startsWith('fin_'));
  assert.equal(proposal.amount_eur, 25.00);
  assert.equal(proposal.recipient, '@basterix_vault');
  assert.equal(proposal.status, 'pending_confirmation');
  assert.equal(proposal.requires_high_value_push_confirmation, false);
});

test('Finance Gateway: Propose transfer rejects amount exceeding daily limit', async () => {
  const {env} = createMockEnv({
    ledger: [
      {status: 'completed', amount_cents: 18000} // 180 € už minutých dnes
    ]
  });
  const ownerId = 'basterix';

  await assert.rejects(
    proposeTransfer(env, ownerId, {amount_eur: 30.00, recipient: '@test'}),
    /prekročil denný limit 200/
  );
});

test('Finance Gateway: Truth Policy 2.1 — confirmTransfer without live credentials returns exact status without faking completion', async () => {
  const {env, store} = createMockEnv({
    proposals: {
      'fin_12345678': {
        id: 'fin_12345678',
        owner_id: 'basterix',
        amount_cents: 1500,
        currency: 'EUR',
        recipient: '@basterix',
        provider: 'revolut',
        note: '',
        status: 'pending',
        confirmation_code: '456789',
        expires_at: Date.now() + 100000
      }
    }
  });

  const res = await confirmTransfer(env, 'basterix', {
    proposal_id: 'fin_12345678',
    confirmation_token: '456789'
  });

  // Nesmie hlásiť úspech ani generovať falošné ID transakcie
  assert.equal(res.success, false);
  assert.equal(res.status, 'requires_provider_credentials');
  assert.ok(res.entry_hash);
  assert.equal(store.ledger.length, 1);
  assert.equal(store.ledger[0].status, 'rejected_missing_credentials');
});

test('Finance Gateway: Integration with runTool and OWNER_BUSINESS_TOOLS permission', async () => {
  const {env} = createMockEnv();
  const agent = {tools: ['finance_propose_transfer', 'finance_confirm_transfer', 'finance_audit_ledger']};

  // Neoverený používateľ je zablokovaný
  await assert.rejects(
    runTool(env, agent, 'finance_propose_transfer', {amount_eur: 10, recipient: '@target'}),
    /overenému ownerovi/
  );

  // Overený owner úspešne vytvorí návrh
  const proposed = await runTool(env, agent, 'finance_propose_transfer', {
    amount_eur: 15,
    recipient: '@target_vault'
  }, {ownerMode: true, owner: 'basterix'});

  assert.ok(proposed.proposal_id);
  assert.equal(proposed._evidence.effect, 'proposal');
});
