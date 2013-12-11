# fendjs-router-server

[![Build Status](https://travis-ci.org/Frapwings/fendjs-router-server.png?branch=master)](https://travis-ci.org/Frapwings/fendjs-router-server) [![Coverage Status](https://coveralls.io/repos/Frapwings/fendjs-router-server/badge.png)](https://coveralls.io/r/Frapwings/fendjs-router-server) [![NPM version](https://badge.fury.io/js/fendjs-router-server.png)](http://badge.fury.io/js/fendjs-router-server) [![Dependency Status](https://david-dm.org/Frapwings/fendjs-router-server.png)](https://david-dm.org/Frapwings/fendjs-router-server)

Fend.js router for server

# Installation

```
$ npm install fendjs-router-server
```

# Example

```js
var connect = require('connect');
var http = require('http');
var ServerRouter = require('fendjs-router-server');

var router = new ServerRouter();
router.route('get', '/', function () {
  this.res.end('home');
});
router.router('get', '/users/:name', function () {
  this.res.end('foo');
});

var app = connect()
  .use(router.middleware)

http.createServer(app).listen(3000);
```

# API

## ServerRouter(options)

Initialize a new `ServerRouter` with the given `options`.

## ServerRouter#middleware

Return connect middleware.

# Testing

```
$ npm install
$ make test
```

# License

[MIT license](http://www.opensource.org/licenses/mit-license.php).

See the `LICENSE`.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/Frapwings/fendjs-router-server/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

