// health-endpoints.js
// API endpoints for health checks and monitoring

const os = require('os');

const SERVER_START_TIME = Date.now();

/**
 * Setup health check endpoints on the dev server
 * @param {Object} devServer - Webpack dev server instance
 * @param {Object} healthPlugin - Instance of WebpackHealthPlugin
 */
function setupHealthEndpoints(devServer, healthPlugin) {
  if (!devServer || !devServer.app) {
    console.warn('[Health Check] Dev server not available, skipping health endpoints');
    return;
  }

  if (!healthPlugin) {
    console.warn('[Health Check] Health plugin not provided, skipping health endpoints');
    return;
  }

  console.log('[Health Check] Setting up health endpoints...');

  // ====================================================================
  // GET /health - Detailed health status (JSON)
  // ====================================================================
  devServer.app.get("/health", (req, res) => {
    const webpackStatus = healthPlugin.getStatus();
    const uptime = Date.now() - SERVER_START_TIME;
    const memUsage = process.memoryUsage();

    res.json({
      status: webpackStatus.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime / 1000),
        formatted: formatDuration(uptime),
      },
      webpack: {
        state: webpackStatus.state,
        isHealthy: webpackStatus.isHealthy,
        hasCompiled: webpackStatus.hasCompiled,
        errors: webpackStatus.errorCount,
        warnings: webpackStatus.warningCount,
        lastCompileTime: webpackStatus.lastCompileTime
          ? new Date(webpackStatus.lastCompileTime).toISOString()
          : null,
        lastSuccessTime: webpackStatus.lastSuccessTime
          ? new Date(webpackStatus.lastSuccessTime).toISOString()
          : null,
        compileDuration: webpackStatus.compileDuration
          ? `${webpackStatus.compileDuration}ms`
          : null,
        totalCompiles: webpackStatus.totalCompiles,
        firstCompileTime: webpackStatus.firstCompileTime
          ? new Date(webpackStatus.firstCompileTime).toISOString()
          : null,
      },
      server: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        memory: {
          heapUsed: formatBytes(memUsage.heapUsed),
          heapTotal: formatBytes(memUsage.heapTotal),
          rss: formatBytes(memUsage.rss),
          external: formatBytes(memUsage.external),
        },
        systemMemory: {
          total: formatBytes(os.totalmem()),
          free: formatBytes(os.freemem()),
          used: formatBytes(os.totalmem() - os.freemem()),
        },
      },
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ====================================================================
  // GET /health/simple - Simple text response (OK/COMPILING/ERROR)
  // ====================================================================
  devServer.app.get("/health/simple", (req, res) => {
    const webpackStatus = healthPlugin.getSimpleStatus();

    if (webpackStatus.state === 'success') {
      res.status(200).send('OK');
    } else if (webpackStatus.state === 'compiling') {
      res.status(200).send('COMPILING');
    } else if (webpackStatus.state === 'idle') {
      res.status(200).send('IDLE');
    } else {
      res.status(503).send('ERROR');
    }
  });

  // ====================================================================
  // GET /health/ready - Readiness check (Kubernetes/load balancer)
  // ====================================================================
  devServer.app.get("/health/ready", (req, res) => {
    const webpackStatus = healthPlugin.getSimpleStatus();

    if (webpackStatus.state === 'success') {
      res.status(200).json({
        ready: true,
        state: webpackStatus.state,
      });
    } else {
      res.status(503).json({
        ready: false,
        state: webpackStatus.state,
        reason: webpackStatus.state === 'compiling'
          ? 'Compilation in progress'
          : 'Compilation failed',
      });
    }
  });

  // ====================================================================
  // GET /health/live - Liveness check (Kubernetes)
  // ====================================================================
  devServer.app.get("/health/live", (req, res) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
    });
  });

  // ====================================================================
  // GET /health/errors - Get current errors and warnings
  // ====================================================================
  devServer.app.get("/health/errors", (req, res) => {
    const webpackStatus = healthPlugin.getStatus();

    res.json({
      errorCount: webpackStatus.errorCount,
      warningCount: webpackStatus.warningCount,
      errors: webpackStatus.errors,
      warnings: webpackStatus.warnings,
      state: webpackStatus.state,
    });
  });

  // ====================================================================
  // GET /health/stats - Compilation statistics
  // ====================================================================
  devServer.app.get("/health/stats", (req, res) => {
    const webpackStatus = healthPlugin.getStatus();
    const uptime = Date.now() - SERVER_START_TIME;

    res.json({
      totalCompiles: webpackStatus.totalCompiles,
      averageCompileTime: webpackStatus.totalCompiles > 0
        ? `${Math.round(uptime / webpackStatus.totalCompiles)}ms`
        : null,
      lastCompileDuration: webpackStatus.compileDuration
        ? `${webpackStatus.compileDuration}ms`
        : null,
      firstCompileTime: webpackStatus.firstCompileTime
        ? new Date(webpackStatus.firstCompileTime).toISOString()
        : null,
      serverUptime: formatDuration(uptime),
    });
  });

  console.log('[Health Check] ✓ Health endpoints ready:');
  console.log('  • GET /health         - Detailed status');
  console.log('  • GET /health/simple  - Simple OK/ERROR');
  console.log('  • GET /health/ready   - Readiness check');
  console.log('  • GET /health/live    - Liveness check');
  console.log('  • GET /health/errors  - Error details');
  console.log('  • GET /health/stats   - Statistics');
}

// ====================================================================
// Helper Functions
// ====================================================================

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string}
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = setupHealthEndpoints;
