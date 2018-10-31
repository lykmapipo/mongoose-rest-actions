'use strict';

/* dependencies */
const _ = require('lodash');
const mongoose = require('mongoose-valid8');


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


/**
 * @name isUniqueError
 * @function isUniqueError
 * @description Check if the given error is a unique error.
 * @param {Object} error valid error object to test.
 * @return {Boolean} true if and only if it is an unique error.
 * @returns {Object}
 * @version 0.1.0
 * @since 0.19.0
 */
exports.isUniqueError = function isUniqueError(error) {
  return (
    error &&
    (error.name === 'BulkWriteError' || error.name === 'MongoError') &&
    (error.code === 11000 || error.code === 11001)
  );
};


/**
 * @name handleUniqueError
 * @function handleUniqueError
 * @description Handle mongodb unique error and transform to mongoose error
 * @param {Schema} schema valid mongoose schema
 * @version 0.1.0
 * @since 0.19.0
 */
exports.handleUniqueError = function handleUniqueError(schema) {

  const normalizeUniqueError = function (error, doc, next) {

    // reference values
    const values = (doc || this);

    // continue if is not unique error
    if (!exports.isUniqueError(error)) {
      return next(error);
    }

    // obtain unique index path
    let path = error.message.match(/index: (.+) dup key:/)[1];
    path = path.split('$').pop();

    // handle compaund unique index
    path = path.split('_');
    path = _.filter(path, function (pathName) {
      return !_.isEmpty(schema.path(pathName));
    });

    //build mongoose error
    if (!_.isEmpty(path)) {
      const errors = {};
      _.forEach(path, function (pathName) {
        const props = {
          type: 'unique',
          path: pathName,
          value: _.get(values, pathName),
          message: 'Path `{PATH}` ({VALUE}) is not unique.',
          reason: error.message
        };
        errors[pathName] = new mongoose.Error.ValidatorError(props);
      });

      error = new mongoose.Error.ValidationError();
      error.errors = errors;
    }

    next(error);

  };

  schema.post('save', normalizeUniqueError);
  schema.post('update', normalizeUniqueError);
  schema.post('findOneAndUpdate', normalizeUniqueError);
  schema.post('insertMany', normalizeUniqueError);

};