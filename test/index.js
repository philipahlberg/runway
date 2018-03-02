// fix karma dynamic import() issues
// see: https://github.com/webpack/webpack/issues/4448
// require('es6-promise/auto');

// require all modules ending in "spec" from the
// current directory and all subdirectories
const testsContext = require.context(".", true, /spec$/);
testsContext.keys().forEach(testsContext);