const { resolve } = require('path');

const webpack = {
  mode: 'development',
  resolve: {
    alias: {
      'lib': resolve('./dist/index.js')
    }
  },
  devtool: 'inline-source-map'
}

module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai'],
    files: [
      'test/index.js'
    ],
    preprocessors: {
      'test/index.js': ['webpack', 'sourcemap']
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    webpack,
    webpackMiddleware: {
      noInfo: true
    }
  });
};