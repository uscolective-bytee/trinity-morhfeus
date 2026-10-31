// Trinity Workspace Script: network-health.mjs
// Probes Trinity cloud endpoints and local daemons.

const targets = [
  { name: 'Cloudflare Production', url: 'https://auru.space/health' },
  { name: 'Cloudflare Development', url: 'https://auru.dev/health' },
  { name: 'Local Gateway Bridge', url: 'http://127.0.0.1:8791/health' },
  { name: 'Local Desktop Server', url: 'http://127.0.0.1:8795/health' }
];

async function checkTarget(target) {
  const start = Date.now();
  try {
    const res = await fetch(target.url, {
      headers: { 'User-Agent': 'Trinity-NetworkHealth/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    const duration_ms = Date.now() - start;
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return {
      name: target.name,
      url: target.url,
      status: res.status,
      ok: res.ok,
      duration_ms,
      service: data?.service || null,
      environment: data?.environment || null
    };
  } catch (err) {
    return {
      name: target.name,
      url: target.url,
      ok: false,
      error: err.message,
      duration_ms: Date.now() - start
    };
  }
}

async function run() {
  const results = await Promise.all(targets.map(checkTarget));
  const summary = {
    service: 'Trinity Network Prober',
    timestamp: new Date().toISOString(),
    total_probed: results.length,
    healthy_count: results.filter(r => r.ok).length,
    targets: results
  };
  console.log(JSON.stringify(summary, null, 2));
}

run();
