module.exports = (config) => {
  config.set({
    basePath: '.',
    frameworks: [
      'mocha',
      'chai'
    ],
    files: [
      { pattern: 'test/dist/index.js', type: 'module' }
    ],
    browsers: [
      'ChromeHeadless',
      'FirefoxHeadless'
    ],
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
    },
    reporters: [
      'dots'
    ],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    singleRun: true
  });
};