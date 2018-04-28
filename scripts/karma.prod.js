const resolver = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript');
const tsc = require('typescript');

const rollup = {
  output: {
    format: 'es'
  },
  plugins: [
    typescript({ typescript: tsc }),
    resolver()
  ]
};

module.exports = (config) => {
  config.set({
    basePath: '../',
    frameworks: ['mocha', 'chai'],
    files: [
      { pattern: 'test/lib.js', type: 'module', watched: false },
      { pattern: 'test/index.js', type: 'module', watched: false }
    ],
    preprocessors: {
      'test/lib.js': ['rollup'],
      'test/index.js': ['rollup']
    },
    rollupPreprocessor: rollup,
    browsers: ['Chrome', 'Edge', 'FirefoxESM'],
    customLaunchers: {
      FirefoxESM: {
        base: 'Firefox',
        prefs: {
          'dom.moduleScripts.enabled': true
        }
      }
    },
    reporters: ['progress'],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    singleRun: true,
    // https://github.com/karma-runner/karma/pull/2834#issuecomment-376854730
    customContextFile: 'test/context.html',
    customDebugFile: 'test/debug.html'
  });
};