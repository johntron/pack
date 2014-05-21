
/**
 * Expose `outer`.
 */

module.exports = (function(){
  return '(' + outer.toString() + ')';
})();

/**
 * Require `name` or `id`.
 * 
 * @param {String|Number} id
 * @return {Function}
 * @api private
 */

function outer(modules, cache, entry){
  var prev;

  /**
   * Get the previous require only
   * if it's ours, this prevents `require.js` errors.
   * 
   * TODO: is this really necessary ?
   */

  if ('function' == typeof require && require.duo) {
    prev = require;
  }

  /**
   * Require `name`.
   * 
   * @param {String} name
   * @param {Boolean} jumped
   * @api public
   */

  function require(name, jumped){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    var req = 'function' == typeof require && require;
    if (!jumped && req) return req(name, true);
    if (prev) return prev(name, true);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `name` and cache it.
   * 
   * @param {String} name
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(name, require){
    var m = cache[name] = { exports: {} };
    modules[name][0].call(m.exports, function(x){
      var id = modules[name][1][x];
      return require(id ? id : x);
    }, m, m.exports, outer, modules, cache, entry);
    return cache[name].exports;
  }

  /**
   * Require all entries.
   * 
   * @api private
   */

  for (var i = 0, e; e = entry[i++];) require(e);

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
}
