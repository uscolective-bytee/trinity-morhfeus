// Trinity Workspace Script: runtime-diagnostics.mjs
// Inspects Node runtime, memory, platform, environment and system info.

import os from 'node:os';
import process from 'node:process';

const diagnostics = {
  service: 'Trinity Runtime Diagnostics',
  timestamp: new Date().toISOString(),
  runtime: {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime_seconds: Math.round(process.uptime()),
    cwd: process.cwd()
  },
  system: {
    hostname: os.hostname(),
    os_type: os.type(),
    os_release: os.release(),
    total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
    free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
    cpu_cores: os.cpus().length,
    cpu_model: os.cpus()[0]?.model || 'Unknown'
  },
  process_memory: {
    rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  },
  status: 'healthy'
};

console.log(JSON.stringify(diagnostics, null, 2));
