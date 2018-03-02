const { resolve } = require('path');
const Webpack = require('webpack');

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
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || 
    //      config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
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