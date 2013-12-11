'use strict';

/**
 * Import(s)
 */

var expect = require('expect.js');
var ServerRouter = require(process.env.FENDJS_ROUTER_SERVER ? '../lib-cov/' : '../');
var request = require('supertest');
var connect = require('connect');

/**
 * Test(s)
 */

describe('fendjs-router-server', function () {
  var app;
  var router;

  beforeEach(function (done) {
    router = new ServerRouter();
    app = connect();
    app.use(router.middleware);
    done();
  });

  describe('routing', function () {
    describe('static', function () {
      describe('/foo', function () {
        it('should dispatch', function (done) {
          router.route('get', '/foo', function (next) {
            this.res.end('foo');
          });

          request(app)
            .get('/foo')
            .expect('foo', done);
        });
      });
    });

    describe(':name', function () {
      it('should denote a capture group', function (done) {
        router.route('get', '/user/:user', function (next){
          this.res.end(this.params.user);
        });

        request(app)
          .get('/user/kazupon')
          .expect('kazupon', done);
      });

      it('should match a single segment only', function (done) {
        router.route('get', '/user/:user', function (next) {
          this.res.end(this.params.user);
        });

        request(app)
          .get('/user/kazupon/edit')
          .expect(404, done);
      });

      it('should allow several capture groups', function (done) {
        router.route('get', '/user/:user/:op', function (next) {
          this.res.end(this.params.op + 'ing ' + this.params.user);
        });

        request(app)
          .get('/user/kazupon/edit')
          .expect('editing kazupon', done);
      });

      it('should allow literal "."', function (done) {
        router.route('get', '/api/users/:from..:to', function () {
          var from = this.params.from;
          var to = this.params.to;
          this.res.end('users from ' + from + ' to ' + to);
        });

        request(app)
          .get('/api/users/1..50')
          .expect('users from 1 to 50', done);
      });
    });

    describe(':name?', function () {
      it('should denote an optional capture group', function (done) {
        router.route('get', '/user/:user/:op?', function () {
          var op = this.params.op || 'view';
          this.res.end(op + 'ing ' + this.params.user);
        });

        request(app)
          .get('/user/kazupon')
          .expect('viewing kazupon', done);
      });

      it('should populate the capture group', function (done) {
        router.route('get', '/user/:user/:op?', function () {
          var op = this.params.op || 'view';
          this.res.end(op + 'ing ' + this.params.user);
        });

        request(app)
          .get('/user/kazupon/edit')
          .expect('editing kazupon', done);
      });
    });

    describe('.:name', function () {
      it('should denote a format', function (done) {
        router.route('get', '/:name.:format', function () {
          this.res.end(this.params.name + ' as ' + this.params.format);
        });

        request(app)
          .get('/foo.json')
          .expect('foo as json', function () {
            request(app)
              .get('/foo')
              .expect(404, done);
          });
      });
    });

    describe('.:name?', function () {
      it('should denote an optional format', function (done) {
        router.route('get', '/:name.:format?', function () {
          this.res.end(this.params.name + ' as ' + (this.params.format || 'html'));
        });

        request(app)
        .get('/foo')
        .expect('foo as html', function () {
          request(app)
            .get('/foo.json')
            .expect('foo as json', done);
        });
      });
    });

    describe('regex', function () {
      it('should match the pathname only', function (done) {
        router.route('get', /^\/user\/[0-9]+$/, function () {
          this.res.end('user');
        });

        request(app)
          .get('/user/12?foo=bar')
          .expect('user', done);
      });

      it('should populate this.params with the captures', function (done) {
        router.route('get', /^\/user\/([0-9]+)\/(view|edit)?$/, function () {
          var id = this.params.shift()
          var op = this.params.shift();
          this.res.end(op + 'ing user ' + id);
        });

        request(app)
          .get('/user/10/edit')
          .expect('editing user 10', done);
      });

      it('should allow escaped', function (done) {
        router.route('get', '/user/\\d+', function () {
          this.res.end('woot');
        });

        request(app)
          .get('/user/10')
          .end(function (err, res) {
            expect(res.statusCode).to.be(200);
            request(app)
              .get('/user/kazupon')
              .expect(404, done);
        });
      });
    });

    describe('*', function () {
      it('should denote a greedy capture group', function (done) {
        router.route('get', '/user/*.json', function () {
          this.res.end(this.params[0]);
        });

        request(app)
          .get('/user/kazupon.json')
          .expect('kazupon', done);
      });

      it('should work with several', function (done) {
        router.route('get', '/api/*.*', function () {
          var resource = this.params.shift()
          var format = this.params.shift();
          this.res.end(resource + ' as ' + format);
        });

        request(app)
          .get('/api/users/foo.bar.json')
          .expect('users/foo.bar as json', done);
      });

      it('should work cross-segment', function (done) {
        router.route('get', '/api*', function () {
          this.res.end(this.params[0]);
        });

        request(app)
          .get('/api')
          .expect('', function () {
            request(app)
              .get('/api/hey')
              .expect('/hey', done);
          });
      });

      it('should allow naming', function (done) {
        router.route('get', '/api/:resource(*)', function () {
          this.res.end(this.params.resource);
        });

        request(app)
          .get('/api/users/0.json')
          .expect('users/0.json', done);
      });

      it('should not be greedy immediately after param', function (done) {
        router.route('get', '/user/:user*', function () {
          this.res.end(this.params.user);
        });

        request(app)
          .get('/user/122')
          .expect('122', done);
      });

      it('should eat everything after /', function (done) {
        router.route('get', '/user/:user*', function () {
          this.res.end(this.params.user);
        });

        request(app)
          .get('/user/122/aaa')
          .expect('122', done);
      });

      it('should span multiple segments', function (done) {
        router.route('get', '/file/*', function () {
          this.res.end(this.params[0]);
        });

        request(app)
          .get('/file/javascripts/jquery.js')
          .expect('javascripts/jquery.js', done);
      });

      it('should be optional', function (done) {
        router.route('get', '/file/*', function () {
          this.res.end(this.params[0]);
        });

        request(app)
          .get('/file/')
          .expect('', done);
      });

      it('should require a preceeding /', function (done) {
        router.route('get', '/file/*', function () {
          this.res.end(this.params[0]);
        });

        request(app)
          .get('/file')
          .expect(404, done);
      });
    });

    describe('sensitivity', function () {
      it('should be disabled by default', function (done) {
        router.route('get', '/user', function () {
          this.res.end('kazupon');
        });

        request(app)
          .get('/USER')
          .expect('kazupon', done);
      });

      describe('when "case sensitive routing" is enabled', function () {
        beforeEach(function (done) {
          router = new ServerRouter({ sensitive: true });
          app = connect();
          app.use(router.middleware);
          done();
        });

        it('should match identical casing', function (done) {
          router.route('get', '/uSer', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/uSer')
            .expect('kazupon', done);
        });

        it('should not match otherwise', function (done) {
          router.route('get', '/uSer', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/user')
            .expect(404, done);
        });
      });
    });

    describe('strict', function () {
      it('should be optional by default', function (done) {
        router.route('get','/user', function () {
          this.res.end('kazupon');
        });

        request(app)
          .get('/user/')
          .expect('kazupon', done);
      })

      describe('when "strict routing" is enabled', function(){
        beforeEach(function (done) {
          router = new ServerRouter({ strict: true });
          app = connect();
          app.use(router.middleware);
          done();
        });

        it('should match trailing slashes', function (done) {
          router.route('get', '/user/', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/user/')
            .expect('kazupon', done);
        })

        it('should match no slashes', function (done) {
          router.route('get', '/user', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/user')
            .expect('kazupon', done);
        })

        it('should fail when omitting the trailing slash', function (done) {
          router.route('get', '/user/', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/user')
            .expect(404, done);
        })

        it('should fail when adding the trailing slash', function (done) {
          router.route('get', '/user', function () {
            this.res.end('kazupon');
          });

          request(app)
            .get('/user/')
            .expect(404, done);
        });
      });
    });

    describe('next() called', function () {
      it('should continue lookup', function (done) {
        var calls = [];

        router.route('get', '/foo/:bar?', function (next) {
          calls.push('/foo/:bar?');
          next();
        });
        router.route('get', '/bar', function () {
          expect(0).to.be(1);
        });
        router.route('get', '/foo', function (next) {
          calls.push('/foo');
          next();
        });
        router.route('get', '/foo', function (next) {
          calls.push('/foo 2');
          this.res.end('done');
        });

        request(app)
          .get('/foo')
          .expect('done', function () {
            expect(calls).to.eql(['/foo/:bar?', '/foo', '/foo 2']);
            done();
          });
      });
    });

    describe('next(err) called', function () {
      it('should break out of ServerRouter', function (done) {
        var calls = [];

        router.route('get', '/foo/:bar?', function (next) {
          calls.push('/foo/:bar?');
          next();
        });

        router.route('get', '/bar', function () {
          expect(0).to.be(1);
        });

        router.route('get','/foo', function (next) {
          calls.push('/foo');
          next(new Error('fail'));
        });

        router.route('get', '/foo', function (next) {
          expect(0).to.be(1);
        });

        app.use(function (err, req, res, next) {
          res.end(err.message);
        })

        request(app)
          .get('/foo')
          .expect('fail', function () {
            expect(calls).to.eql(['/foo/:bar?', '/foo']);
            done();
          });
      });
    });
  });
});
