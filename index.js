/**
 * Import(s)
 */

var Router = require('fendjs-router');
var debug = require('debug')('fendjs-router-server:index');
var parse = require('url').parse;

/**
 * Export(s)
 */

exports = module.exports = ServerRouter;

/**
 * Initialize a new `ServerRouter` with the given `options`.
 *
 * @param {Object} options
 * @api public
 */

function ServerRouter (options) {
  Router.call(this, options);
  var self = this;
  this.middleware = function router (req, res, next) {
    self.dispatch(req, res, next);
  };
}

/**
 * Inherit from `Router.prototype`.
 */

ServerRouter.prototype.__proto__ = Router.prototype;

/**
 * Dispatch route.
 *
 * @return {ServerRouter}
 * @api private
 */

ServerRouter.prototype.dispatch = function () {
  var self = this;
  var req = arguments[0];
  var res = arguments[1];
  var next = arguments[2];

  debug('dispatching %s %s (%s)', req.method, req.url, req.originalUrl);

  // route dispatch
  (function pass(i, err){
    var ret;
    var route;
    var params;

    // match next route
    function nextRoute (err) {
      pass(req._route_index + 1, err);
    }

    // match route
    ret = self.matchRequest(req, i);

    // no route
    if (!ret.route || !ret.params) return next(err);
    debug('matched %s %s', ret.method, ret.route.path);

    i = 0;
    route = ret.route;
    params = ret.params;
    callbacks(err);

    // invoke route callbacks
    function callbacks (err) {
      var fn = route.callbacks[i++];
      try {
        var context = { req: req, res: res, params: params };
        if ('route' == err) {
          nextRoute();
        } else if (err && fn) {
          if (fn.length < 2) return callbacks(err);
          fn.call(context, err, callbacks);
        } else if (fn) {
          if (fn.length < 2) return fn.call(context, callbacks);
          callbacks();
        } else {
          nextRoute(err);
        }
      } catch (err) {
        callbacks(err);
      }
    }
  })(0);
};

/**
 * Attempt to match a route for `req`
 * with optional starting index of `i`
 * defaulting to 0.
 * 
 * @param {IncomingMessage} req
 * @param {Number} i
 * @return {Route}
 * @api private
 */

ServerRouter.prototype.matchRequest = function (req, i, head) {
  var method = req.method.toLowerCase();
  var url = parseUrl(req);
  var path = url.pathname;
  var routes = this.routes;
  var i = i || 0;
  var params;
  var route;
  var ret = { method: method };

  // routes for this method
  if (routes = routes[method]) {
    // matching routes
    for (var len = routes.length; i < len; ++i) {
      route = routes[i];
      params = route.match(path);
      debug('route match:', route, params);
      if (false !== params) {
        req._route_index = i;
        ret.route = route;
        ret.params = params;
        return ret;
      }
    }
  }

  return ret;
};

function parseUrl (req) {
  var parsed = req._parsedUrl;
  if (parsed && parsed.href == req.url) {
    return parsed;
  } else {
    parsed = parse(req.url);
    if (parsed.auth && !parsed.protocol && ~parsed.href.indexOf('//')) {
      parsed = parse(req.url.replace(/@/g, '%40'));
    }
    return req._parsedUrl = parsed;
  }
}
