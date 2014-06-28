/**
 * Module Dependencies
 */

var fs = require('fs');
var path = require('path');
var dirname = path.dirname;
var req = require('./require');
var write = require('co-write');
var mkdirp = require('mkdirp');
var sourcemap = require('./sourcemap');
var reqpath = require.resolve('./require');
var fmt = require('util').format;

/**
 * Expose `pack`
 */

module.exports = pack;

/**
 * Initialize `pack`
 *
 * @param {String} path
 * @param {Object} opts
 * @return {Function}
 * @api public
 */

function pack(path, opts) {
  var first = true;
  var ended = false;
  var entries = [];
  var ids = {};
  var uid = 0;
  var stream;

  // write?
  if ('string' != typeof path) {
    opts = path || {};
    path = null;
  }

  // opts
  opts = opts || {};
  var debug = opts.debug || false;

  // enable sourcemaps if debug is true
  var sm = debug ? sourcemap() : false;

  /**
   * Write javascript from `json` to `path`
   *
   * @param {Object} json
   * @param {Number} more
   * @api public
   */

  return function *pack(json, end) {
    if (ended) return;

    if (first && path) {
      // make the directory
      yield mkdir(dirname(path));

      // create the stream
      stream = fs.createWriteStream(path);
    }

    if (json.entry) entries.push(json);

    var id = json.id;
    var json = remap(json);
    var deps = JSON.stringify(json.deps || {});
    var src = wrap(json.src);
    var str = fmt('%d: [%s, %s', json.id, src, deps);

    // expose by name
    str += json.name
      ? fmt(', "%s"]', json.name)
      : ']';

    if (first) {
      str = req + '({\n' + str;
      if (sm) sm.file(reqpath, req);
    }

    str += (end) ? '}, {}, ' + JSON.stringify(entry()) + ')\n' : ',\n\n';

    // add file to sourcemap
    if (sm) sm.file(id, json.src, str);

    if (end && sm) {
      str += sm.end();
    }

    // write to file
    if (path) yield write(stream, str);

    // end
    if (end && path) stream.end();

    first = false;

    return str;
  }

  /**
   * Remap JSON file paths to uids
   *
   * @param {Object} json
   * @return {Object}
   * @api private
   */

  function remap(json) {
    json.id = id(json.id);

    for (var req in json.deps) {
      json.deps[req] = id(json.deps[req]);
    }

    return json;
  }

  /**
   * Get or set the uid
   *
   * @param {String} file
   * @return {Number}
   * @api private
   */

  function id(file) {
    return ids[file] = ids[file] || ++uid;
  }

  /**
   * Add the entries
   *
   * @return {String}
   * @api private
   */

  function entry() {
    return entries.reduce(function(ret, e){
      if (ret[e.id]) return ret;
      ret[e.id] = e.global || '';
      return ret;
    }, {});
  }
}

/**
 * Wrap the source in a function
 *
 * @param {String} src
 * @return {String}
 * @api private
 */

function wrap(src) {
  var out = 'function(require, module, exports) {\n\n'
  out += src;
  out += '\n}';
  return out;
}

/**
 * mkdir -p
 *
 * @param {String} path
 * @return {Function} fn
 * @api private
 */

function mkdir(path) {
  return function(fn) {
    mkdirp(path, fn);
  };
}