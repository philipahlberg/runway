// polyfill nescessary for <router-link> in ff/edge
require('@webcomponents/custom-elements');
// require all modules ending in 'spec' from the
// current directory and all subdirectories
const testsContext = require.context('.', true, /spec$/);
testsContext.keys().forEach(testsContext);