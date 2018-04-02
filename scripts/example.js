const Koa = require('koa');
const serve = require('koa-static');
const fs = require('fs');
const server = new Koa();

server.use(serve('example'));
server.use(serve('dist'));

server.use(async (ctx) => {
  if (!/\./.test(ctx.path) && ctx.accepts('html')) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream('./examples/index.html');
  }
});

server.listen(1234, () => {
  console.log('Server is listening on http://localhost:1234');
});