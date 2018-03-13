const webpack = require('./webpack.prod.js');

module.exports = (config) => {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: ['../test/index.js'],
    preprocessors: {
      '../test/index.js': ['webpack']
    },
    browsers: ['Chrome', 'Firefox', 'Edge'],
    reporters: ['progress'],
    port: 1234,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: false,
    singleRun: true,
    webpack,
    webpackMiddleware: {
      noInfo: true
    }
  });
};