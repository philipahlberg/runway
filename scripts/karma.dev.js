module.exports = (config) => {
  config.set({
    basePath: '../',
    frameworks: [
      'mocha',
      'chai'
    ],
    files: [
      { pattern: 'test/dist/index.js', type: 'module' }
    ],
    browsers: [
      'ChromeHeadless'
    ],
    reporters: [
      'dots'
    ],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,
    singleRun: false,
    // https://github.com/karma-runner/karma/pull/2834#issuecomment-376854730
    customContextFile: 'test/context.html',
    customDebugFile: 'test/debug.html'
  });
};