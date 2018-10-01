'use strict';

/* dependencies */
const _ = require('lodash');


/**
 * @function
 * @name isInstance
 * @description check if object is model instance
 * @param {Object}  value valid object
 * @returns {Boolean} whether object is valid model instance
 * @version 0.6.1
 * @since 0.1.0
 */
exports.isInstance = function isInstance(value) {
  if (value) {
    const _isInstance =
      _.isFunction(_.get(value, 'toObject', undefined));
    return _isInstance;
  }
  return false;
};


/**
 * @name merge
 * @description copy and return object
 * @param {Object}  value valid object
 * @returns {Object}
 * @version 0.6.1
 * @since 0.1.0
 */
exports.merge = function merge(value) {
  if (value) {
    return (
      exports.isInstance(value) ?
      _.merge({}, value.toObject()) :
      _.merge({}, value)
    );
  }

  return {};
};


/**
 * @name path
 * @description obtain schema path
 * @param {Object}  value valid object
 * @returns {Object}
 * @version 0.1.0
 * @since 0.18.0
 */
exports.path = function _path(schema, pathName) {
  let _path;

  if (schema && pathName) {
    _path = schema.path(pathName);
  }

  return _path;
};