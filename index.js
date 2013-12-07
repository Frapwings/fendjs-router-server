/**
 * Import(s)
 */

var Router = require('fendjs-router');

/**
 * Export(s)
 */

exports = module.exports = ServerRouter;


function ServerRouter () {
  Router.call(this);
}


/**
 * Inherit from `Router.prototype`.
 */

ServerRouter.prototype.__proto__ = Router.prototype;
