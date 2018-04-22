'use strict';

/*** dependencies */
const _ = require('lodash');


/**
 * @name isInstance
 * @description check if object is model instance
 * @param  {Object}  value valid object
 * @return {Boolean} whether object is valid model instance
 * @since 0.6.1
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
 * @param  {Object}  value valid object
 * @return {Object}
 * @since 0.6.1
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