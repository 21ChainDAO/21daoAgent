// webpack-health-plugin.js
// Webpack plugin that tracks compilation state and health metrics

class WebpackHealthPlugin {
  constructor() {
    this.status = {
      state: 'idle',           // idle, compiling, success, failed
      errors: [],
      warnings: [],
      lastCompileTime: null,
      lastSuccessTime: null,
      compileDuration: 0,
      totalCompiles: 0,
      firstCompileTime: null,
    };
  }

  apply(compiler) {
    const pluginName = 'WebpackHealthPlugin';

    // Hook: Compilation started
    compiler.hooks.compile.tap(pluginName, () => {
      const now = Date.now();
      this.status.state = 'compiling';
      this.status.lastCompileTime = now;

      if (!this.status.firstCompileTime) {
        this.status.firstCompileTime = now;
      }
    });

    // Hook: Compilation completed
    compiler.hooks.done.tap(pluginName, (stats) => {
      const info = stats.toJson({
        all: false,
        errors: true,
        warnings: true,
      });

      this.status.totalCompiles++;
      this.status.compileDuration = Date.now() - this.status.lastCompileTime;

      if (stats.hasErrors()) {
        this.status.state = 'failed';
        this.status.errors = info.errors.map(err => ({
          message: err.message || String(err),
          stack: err.stack,
          moduleName: err.moduleName,
          loc: err.loc,
        }));
      } else {
        this.status.state = 'success';
        this.status.lastSuccessTime = Date.now();
        this.status.errors = [];
      }

      if (stats.hasWarnings()) {
        this.status.warnings = info.warnings.map(warn => ({
          message: warn.message || String(warn),
          moduleName: warn.moduleName,
          loc: warn.loc,
        }));
      } else {
        this.status.warnings = [];
      }
    });

    // Hook: Compilation failed
    compiler.hooks.failed.tap(pluginName, (error) => {
      this.status.state = 'failed';
      this.status.errors = [{
        message: error.message,
        stack: error.stack,
      }];
      this.status.compileDuration = Date.now() - this.status.lastCompileTime;
    });

    // Hook: Invalid (file changed, recompiling)
    compiler.hooks.invalid.tap(pluginName, () => {
      this.status.state = 'compiling';
    });
  }

  getStatus() {
    return {
      ...this.status,
      // Add computed fields
      isHealthy: this.status.state === 'success',
      errorCount: this.status.errors.length,
      warningCount: this.status.warnings.length,
      hasCompiled: this.status.totalCompiles > 0,
    };
  }

  // Get simplified status for quick checks
  getSimpleStatus() {
    return {
      state: this.status.state,
      isHealthy: this.status.state === 'success',
      errorCount: this.status.errors.length,
      warningCount: this.status.warnings.length,
    };
  }

  // Reset statistics (useful for testing)
  reset() {
    this.status = {
      state: 'idle',
      errors: [],
      warnings: [],
      lastCompileTime: null,
      lastSuccessTime: null,
      compileDuration: 0,
      totalCompiles: 0,
      firstCompileTime: null,
    };
  }
}

module.exports = WebpackHealthPlugin;
