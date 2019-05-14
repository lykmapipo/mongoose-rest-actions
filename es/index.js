import _ from 'lodash';
import { isInstance, copyInstance } from '@lykmapipo/mongoose-common';
import fake from '@lykmapipo/mongoose-faker';
import search from 'mongoose-regex-search';
import autopopulate from 'mongoose-autopopulate';
import hide from 'mongoose-hidden';
import exist from 'mongoose-exists';
import taggable from '@lykmapipo/mongoose-taggable';
import aggregatable from '@lykmapipo/mongoose-aggregatable';
import async, { waterfall, parallel } from 'async';
import { mergeObjects } from '@lykmapipo/common';

/**
 * @module mongoose-rest-actions
 * @function
 * @name deletePlugin
 * @namespace
 * @description mongoose schema plugin to support http delete verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid delete plugin options
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com>
 * @example
 *
 * const mongoose = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * const express = require('express');
 * const app = express();
 *
 * ...
 *
 * app.delete('/users/:id', function(request, response, next){
 *
 *   // obtain id
 *   const _id = request.params.id;
 *
 *   // delete user
 *   User
 *     .del(_id, function(error, deleted){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function deletePlugin(Schema) {
  const schema = Schema;
  /*
   *----------------------------------------------------------------------------
   * Instance
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name del
   * @description delete model instance. more business logics can be
   *              implemented using beforeDelete and afterDelete model
   *              instance methods
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} deleted instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @instance
   * @memberof deletePlugin
   * @public
   * @example
   *
   * const UserSchema = new Schema({
   *  name: { type: String }
   * });
   *
   * UserSchema.methods.beforeDelete = function (done) {
   *  ...called before delete(does not touch mongoose hooks)
   *  ...do any checkup if delete is allowed
   *  ...log, post to analytics etc
   *  ...throw error and delete wont happen i.e done(error)
   *  ...once through call done()
   *  done();
   * };
   *
   * UserSchema.methods.afterDelete = function (done) {
   *  ...called after delete(does not touch mongoose hooks)
   *  ...delete any cached instance
   *  ...delete any related instances
   *  ...log, post to analytics, initiate background job etc
   *  ...instance is already deleted(any throws wont stop it)
   *  ...once through call done()
   *  done();
   * };
   *
   * const User = mongoose.model('User', UserSchema);
   *
   * const user = ...find user
   * user.del(function(error, deleted){
   *     ...
   *  });
   */
  schema.methods.del = function del(optns, callback) {
    //  normalize arguments
    const defaults = { soft: false };
    const done = _.isFunction(optns) ? optns : callback;
    const options = _.isFunction(optns) ? defaults : _.merge(defaults, optns);

    waterfall(
      [
        /**
         * @name beforeDelete
         * @function beforeDelete
         * @description perform pre delete logics
         * @param {Function} next a callback to invoke after beforeDelete
         * @returns {instance|error}
         * @private
         */
        function beforeDelete(next) {
          // obtain before hooks
          const before = this.beforeDelete || this.preDelete;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(
              this,
              function onBeforeDelete(error, instance) {
                next(error, instance || this);
              }.bind(this)
            );
          }
          // no hook
          else {
            // TODO use undefined
            next(null, this);
          }
        }.bind(this),

        /**
         * @name doDelete
         * @function doDelete
         * @description delete(remove) model instance
         * @param {Function} next a callback to invoke after delete
         * @returns {instance|error}
         * @private
         */
        function doDelete(instance, next) {
          // TODO throw error if already deleted
          //  soft delete
          const { soft } = options;
          if (soft) {
            const updates = { deletedAt: new Date() };
            instance.patch(updates, next);
          }
          //  hard deletes
          else {
            instance.remove(function afterRemove(error, deleted) {
              next(error, deleted);
            });
          }
        },

        /**
         * @name afterDelete
         * @function afterDelete
         * @description perform after delete logics
         * @param {Function} next a callback to invoke after afterDelete
         * @returns {instance|error}
         * @private
         */
        function afterDelete(instance, next) {
          // obtain after hooks
          const after = instance.afterDelete || instance.postDelete;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, function onAfterDelete(error, instanced) {
              next(error, instanced || instance);
            });
          }
          // no hook
          else {
            // TODO use undefined
            next(null, instance);
          }
        },
      ],

      /**
       * @function
       * @name onDelete
       * @description perform on delete logics
       * @param {Object} error error object when fails to delete
       * @param {Object} deleted model instance
       * @private
       */
      function onceDelete(err, deleted) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        done(error, deleted);
      }
    );
  };

  /*
   *----------------------------------------------------------------------------
   * Statics
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name del
   * @description delete(remove) existing model instance
   * @param {ObjectId|String} _id valid existing model object id
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} deleted instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof deletePlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .del(_id, function(error, deleted){
   *       ...
   *   });
   */
  schema.statics.del = function del(optns, done) {
    //  normalize arguments
    const defaults = { soft: false };
    let options = _.isPlainObject(optns) ? optns : { _id: optns };
    options = _.merge(defaults, options);

    const { _id, soft } = options;

    // ensure id
    if (!_id) {
      const error = new Error('Missing Instance Id');
      error.status = 400;
      done(error);
    }

    // continue with delete
    waterfall(
      [
        function findExisting(next) {
          this.findById(_id)
            .orFail()
            .exec(next); // TODO use getById
        }.bind(this),

        function afterFindExisting(instance, next) {
          instance.del({ soft }, next);
        },
      ],
      function onceDelete(err, patched) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        done(error, patched);
      }
    );
  };
}

/* default get options */
const defaults = {
  filter: {},
  paginate: {
    limit: 10,
    skip: 0,
    page: 1,
  },
  populate: [],
  select: {},
  sort: {},
};

/**
 * @module mongoose-rest-actions
 * @function
 * @name getPlugin
 * @namespace
 * @description mongoose schema plugin to support http get verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid get plugin options
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com>
 * @example
 *
 * const mongoose = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * const expess = require('express');
 * const app = express();
 *
 * ...
 *
 * app.get('/users', function(request, response, next){
 *
 *   // prepare options
 *   const options = { page: request.query.page, limit: request.query.limit}
 *
 *   // get users
 *   User
 *     .get(options, function(error, results){
 *       ...handle error or reply
 *     });
 * });
 *
 * app.get('/users/:id', function(request, response, next){
 *
 *   // obtain id
 *   const _id = request.params.id;
 *
 *   // get user
 *   User
 *     .getById(_id, function(error, user){
 *       ...handle error or reply
 *     });
 * });
 *
 * or
 *
 * app.get('/users/:id', function(request, response, next){
 *
 *   // obtain id
 *   const options = {_id : request.params.id, select: 'name -age'};
 *
 *   // get user
 *   User
 *     .getById(options, function(error, user){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function getPlugin(Schema, schemaOptns) {
  const schema = Schema;
  // normalize options
  const schemaOptions = _.merge(
    {},
    {
      root: 'data',
    },
    schemaOptns
  );

  /*
   *----------------------------------------------------------------------------
   * Statics
   *----------------------------------------------------------------------------
   */

  /**
   * @name getById
   * @function getById
   * @description find existing model instance by its id
   * @param {Object|ObjectId|String} [optns={}] valid existing model object id
   *                                            of getById options
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} found instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof getPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * const options = {_id: ..id, select: 'name -age'};
   * User
   *   .getById(options, function(error, found){
   *       ...
   *   });
   */
  schema.statics.getById = function getById(optns, done) {
    // normalize options
    let options = _.isFunction(optns) ? {} : optns;
    const cb = _.isFunction(optns) ? optns : done;
    options = _.isPlainObject(options)
      ? options
      : {
          _id: options,
        };
    options._id = options._id || options.id; // eslint-disable-line
    const optionsId = options._id; // eslint-disable-line
    delete options.id;

    // ensure id
    if (!optionsId) {
      const error = new Error('Missing Instance Id');
      error.status = 400;
      cb(error);
    }

    // continue with retrieving data
    waterfall(
      [
        /**
         * @function
         * @name beforeGetById
         * @description perform pre getById logics
         * @param {Function} next a callback to invoke after beforeGetById
         * @returns {null|undefined|error}
         * @private
         */
        function beforeGetById(next) {
          // obtain before hooks
          const before = this.beforeGetById || this.preGetById;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(this, function onBeforeGetById(error) {
              next(error);
            });
          }
          // no hook
          else {
            next();
          }
        }.bind(this),

        /**
         * @function
         * @name doGetById
         * @description obtain instance by id
         * @param {Function} next a callback to invoke after getById
         * @returns {instance|error}
         * @private
         */
        function doGetById(next) {
          // prepare find query
          const findQuery = this.findById(optionsId);

          // if select
          if (options.select) {
            findQuery.select(options.select);
          }

          // if populate
          if (options.populate) {
            const populate = _.compact([].concat(options.populate));
            _.forEach(populate, populateOption => {
              findQuery.populate(populateOption);
            });
          }

          findQuery.orFail().exec(next); // TODO get cached
        }.bind(this),

        /**
         * @function
         * @name afterGetById
         * @description perform after getById logics
         * @param {Function} next a callback to invoke after afterGetById
         * @returns {instance|error}
         * @private
         */
        function afterGetById(instance, next) {
          // obtain after hooks
          const after = this.afterGetById || this.postGetById;

          // run hook(s)
          if (_.isFunction(after)) {
            after
              .call(this, instance, function onAfterGetById(error, instanced) {
                next(error, instanced || instance);
              })
              .bind(this);
          }
          // no hook
          else {
            next(null, instance);
          }
        }.bind(this),
      ],
      function onceGetById(err, found) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, found);
      }
    );
  };

  /**
   * @function
   * @name getHelperFn
   * @description count and find existing model(s) based on specified options
   * @param {Object} [optns={}]
   * @param {Object|String} [optns.filter] valid mongoose query criteria
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Object|String} [optns.sort] valid mongoose query sort criteria
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param {Object} [optns.paginate={}] paging options
   * @param {Number} [optns.paginate.skip=0] valid query skip option
   * @param {Number} [optns.paginate.page=1]
   * @param {Number} [optns.paginate.limit=10] valid query limit option
   * @param {Object} [optns.headers={}] header for conditional get
   * @param {Date} [optns.headers.ifModifiedSince] if modified since option
   * @returns {Object} results
   * @returns {Object[]} [results.data] array of documents
   * @returns {Number} [results.total] total number of documents in collection
   * that match a query
   * @returns {Number} [results.size]  length of current page documents
   * @returns {Number} [results.limit] limit that was used
   * @returns {Number} [results.skip] skip that was used
   * @returns {Number} [results.page] page that was used
   * @returns {Number} [results.pages] total number of pages that match a query
   * @param {Function} done a callback to invoke on success or failure
   * @returns {Object|error} results or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof getPlugin
   * @private
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .getHelperFn(function(error, deleted){
   *       ...
   *   });
   *
   * or
   *
   * User
   *   .getHelperFn({page: 1}, function(error, deleted){
   *       ...
   *   });
   */
  schema.statics.getHelperFn = function getHelperFn(optns, done) {
    // normalize options & callback
    const cb = _.isFunction(optns) ? optns : done;

    let options = _.isFunction(optns) ? {} : optns;
    options = _.merge({}, defaults, options);
    options = _.merge({}, options.paginate, options);
    delete options.paginate;

    // obtain query criteria
    let filter = options.query || options.criteria || options.filter;

    // obtain limit
    let limit = options.limit || 10;
    limit = limit > 0 ? limit : 10;

    // obtain skip
    let skip = options.skip || options.offset || 0;
    skip = skip > 0 ? skip : 0;

    // obtain page
    const page = options.page || options.page;

    const populate = _.compact([].concat(options.populate));
    const select = options.select || {};
    const sort = options.sort || {};
    const headers = options.headers || {};

    // extend headers with if-modified-since condition
    const { UPDATED_AT_FIELD } = this;
    if (headers.ifModifiedSince) {
      const ifModifiedSince = new Date(headers.ifModifiedSince);
      filter = _.merge({}, filter, {
        [UPDATED_AT_FIELD]: {
          $gt: ifModifiedSince,
        },
      });
    }

    // initialize queries
    const { q } = filter;
    const conditions = _.omit(filter, 'q');
    const findQuery = this.search(q, conditions);
    const countQuery = this.search(q, conditions).setOptions({
      autopopulate: false,
    });
    const lastModifiedQuery = this.findOne(
      {},
      {
        [UPDATED_AT_FIELD]: 1,
      },
      {
        autopopulate: false,
      }
    ) // dont populate
      .sort({
        [UPDATED_AT_FIELD]: -1,
      });

    if (page && page > 0) {
      skip = (page - 1) * limit;
    }

    if (select) {
      findQuery.select(select);
    }

    if (sort) {
      findQuery.sort(sort);
    }

    if (skip) {
      findQuery.skip(skip);
    }

    if (limit) {
      findQuery.limit(limit);
    }

    if (populate) {
      _.forEach(populate, populateOption => {
        findQuery.populate(populateOption);
      });
    }

    parallel(
      {
        count: function countMatched(next) {
          countQuery.countDocuments().exec(next); // TODO get cached
        },

        data: function paginateMatched(next) {
          findQuery.exec(next); // TODO get cached
        },

        lastModified: function findLatestModified(next) {
          lastModifiedQuery.exec(next);
        },
      },
      function next(err, results) {
        const error = err;
        let mergedResults;

        if (!error && results) {
          // prepare results
          const defaultsResults = {
            data: [],
            total: 0,
            size: 0,
            pages: 0,
            lastModified: undefined,
          };
          mergedResults = _.merge({}, defaultsResults, results);

          // obtain latest modified date
          const lastModified = mergedResults.lastModified
            ? mergedResults.lastModified[UPDATED_AT_FIELD]
            : undefined;

          // compute pages
          const pages = Math.ceil(mergedResults.count / limit);

          // refine results
          mergedResults = {
            [schemaOptions.root]: results.data,
            total: results.count,
            size: results.data.length,
            limit,
            skip,
            page,
            pages,
            lastModified,
            hasMore: page > pages,
          };
        }

        // ensure error status
        if (error) {
          error.status = error.status || 400;
          mergedResults = undefined;
        }

        cb(error, mergedResults); // TODO cache
      }
    );
  };

  /**
   * @function
   * @name get
   * @description count and find existing model(s) based on specified options
   * @param {Object} [optns={}]
   * @param {Object|String} [optns.filter] valid mongoose query criteria
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Object|String} [optns.sort] valid mongoose query sort criteria
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param {Object} [optns.paginate={}] paging options
   * @param {Number} [optns.paginate.skip=0] valid query skip option
   * @param {Number} [optns.paginate.page=1]
   * @param {Number} [optns.paginate.limit=10] valid query limit option
   * @returns {Object} results
   * @returns {Object[]} [results.data] array of documents
   * @returns {Number} [results.total] total number of documents in collection
   * that match a query
   * @returns {Number} [results.size]  length of current page documents
   * @returns {Number} [results.limit] limit that was used
   * @returns {Number} [results.skip] skip that was used
   * @returns {Number} [results.page] page that was used
   * @returns {Number} [results.pages] total number of pages that match a query
   * @param {Function} done a callback to invoke on success or failure
   * @returns {Object|error} results or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof getPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .get(function(error, deleted){
   *       ...
   *   });
   *
   * or
   *
   * User
   *   .get({page: 1}, function(error, deleted){
   *       ...
   *   });
   */
  schema.statics.get = function get(optns, done) {
    // normalize options & callback
    const cb = _.isFunction(optns) ? optns : done;

    // normalize options
    const options = _.isFunction(optns) ? {} : optns;
    delete options.headers;

    waterfall(
      [
        /**
         * @function
         * @name beforeGet
         * @description perform pre get logics
         * @param {Function} next a callback to invoke after beforeGet
         * @returns {null|undefined|error}
         * @private
         */
        function beforeGet(next) {
          // obtain before hooks
          const before = this.beforeGet || this.preGet;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(this, options, function onBeforeGet(error) {
              next(error);
            });
          }
          // no hook
          else {
            next();
          }
        }.bind(this),

        /**
         * @function
         * @name doGet
         * @description query data
         * @param {Function} next a callback to invoke after query data(get)
         * @returns {instance|error}
         * @private
         */
        function doGet(next) {
          this.getHelperFn(options, next);
        }.bind(this),

        /**
         * @function
         * @name afterGet
         * @description perform after query data logics
         * @param {Function} next a callback to invoke after doGet
         * @returns {context|error}
         * @private
         */
        function afterGet(results, next) {
          // obtain hooks
          const after = this.afterGet || this.postGet;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(this, options, results, function onAfterGet(
              error,
              resulted
            ) {
              next(error, resulted || results);
            });
          }
          // no hook
          else {
            next(null, results);
          }
        }.bind(this),
      ],
      function onceGet(err, got) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, got);
      }
    );
  };

  /**
   * @function
   * @name fresh
   * @description count and find existing model(s) based on specified options
   * @param {Object} [optns={}]
   * @param {Object|String} [optns.filter] valid mongoose query criteria
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Object|String} [optns.sort] valid mongoose query sort criteria
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param {Object} [optns.paginate={}] paging options
   * @param {Number} [optns.paginate.skip=0] valid query skip option
   * @param {Number} [optns.paginate.page=1]
   * @param {Number} [optns.paginate.limit=10] valid query limit option
   * @param {Object} [optns.headers={}] header for conditional get
   * @param {Date} [optns.headers.ifModifiedSince] if modified since option
   * @returns {Object} results
   * @returns {Object[]} [results.data] array of documents
   * @returns {Number} [results.total] total number of documents in collection
   * that match a query
   * @returns {Number} [results.size]  length of current page documents
   * @returns {Number} [results.limit] limit that was used
   * @returns {Number} [results.skip] skip that was used
   * @returns {Number} [results.page] page that was used
   * @returns {Number} [results.pages] total number of pages that match a query
   * @param {Function} done a callback to invoke on success or failure
   * @returns {Object|error} results or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof getPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .fresh(function(error, deleted){
   *       ...
   *   });
   *
   * or
   *
   * User
   *   .fresh({page: 1}, function(error, deleted){
   *       ...
   *   });
   */
  schema.statics.fresh = function fresh(...args) {
    // query
    this.getHelperFn(...args);
  };
}

const updatesFor = (id, updates) => {
  //  ignore self instance updates
  // eslint-disable-next-line
  if (isInstance(updates) && updates._id === id) {
    return updates;
  }
  //  compute updates
  const changes = mergeObjects(copyInstance(updates), { _id: id });
  return changes;
};

/**
 * @function
 * @name patchPlugin
 * @namespace
 * @description mongoose schema plugin to support http patch verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid patch plugin options
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com>
 * @example
 *
 * const mongoose = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * const express = require('express');
 * const app = express();
 *
 * ...
 *
 * app.patch('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   updates._id = request.params.id;
 *
 *   // patch user
 *   User
 *     .patch(updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 * or
 *
 * app.patch('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   const _id = request.params.id;
 *
 *   // patch user
 *   User
 *     .patch(_id, updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function patchPlugin(Schema) {
  const schema = Schema;
  /*
   *----------------------------------------------------------------------------
   * Instances
   *----------------------------------------------------------------------------
   */

  /**
   * @name patch
   * @function patch
   * @description update and persist current model instance. more business
   *              logics can be implemented using beforePatch and afterPatch
   *              model instance methods
   * @param {Object} updates updates to apply on model instance
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @instance
   * @memberof patchPlugin
   * @public
   * @example
   *
   * const UserSchema = new Schema({
   *  name: { type: String }
   * });
   *
   * UserSchema.methods.beforePatch = function (done) {
   *  ...called before patch(does not touch mongoose hooks)
   *  ...do any checkup if patch is allowed
   *  ...log, post to analytics etc
   *  ...throw error and patch wont happen i.e done(error)
   *  ...once through call done()
   *  done();
   * };
   *
   * UserSchema.methods.afterPatch = function (done) {
   *  ...called after patch(does not touch mongoose hooks)
   *  ...update any cached instance
   *  ...update any related instances
   *  ...log, post to analytics, initiate background job etc
   *  ...instance is already patched(any throws wont stop it)
   *  ...once through call done()
   *  done();
   * };
   *
   * const User = mongoose.model('User', UserSchema);
   *
   * const user = ...find user
   * user.patch(updates, function(error, updated){
   *     ...
   *  });
   */
  schema.methods.patch = function patch(updates, done) {
    // normalize arguments
    const body = _.isFunction(updates) ? {} : updatesFor(null, updates);
    const cb = _.isFunction(updates) ? updates : done;

    // remove unused
    delete body._id; // eslint-disable-line
    delete body.updatedAt;

    waterfall(
      [
        /**
         * @function
         * @name beforePatch
         * @description perform pre(save/patch) logics
         * @param {Function} next a callback to invoke after beforePatch
         * @returns {instance|error}
         * @private
         */
        function beforePatch(next) {
          // obtain before hooks
          const before =
            this.beforePatch ||
            this.prePatch ||
            this.beforeUpdate ||
            this.preUpdate;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(
              this,
              body,
              function onBeforePatch(error, instance) {
                next(error, instance || this);
              }.bind(this)
            );
          }
          // no hook
          else {
            next(null, this);
          }
        }.bind(this),

        /**
         * @function
         * @name doPatch
         * @description update and persist model instance
         * @param {Function} next a callback to invoke after save
         * @returns {instance|error}
         * @private
         */
        function doPatch(model, next) {
          const instance = model;
          // update & persist instance
          if (body && !_.isEmpty(body)) {
            instance.set(body);
          }
          instance.updatedAt = new Date();
          instance.save(function afterSave(error, saved) {
            next(error, saved);
          });
        },

        /**
         * @function
         * @name afterPatch
         * @description perform after(save/patch) logics
         * @param {Function} next a callback to invoke after afterSave
         * @returns {instance|error}
         * @private
         */
        function afterPatch(instance, next) {
          // obtain after hooks
          const after =
            instance.afterPatch ||
            instance.postPatch ||
            instance.afterUpdate ||
            instance.postUpdate;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, body, function onAfterPatch(error, instanced) {
              next(error, instanced || instance);
            });
          }
          // no hook
          else {
            next(null, instance);
          }
        },
      ],

      /**
       * @function
       * @name onPatch
       * @description perform on patch logics
       * @param {Object} error error object when fails to patch
       * @param {Object} patched model instance
       * @private
       */
      function oncePatch(err, patched) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, patched);
      }
    );
  };

  /*
   *----------------------------------------------------------------------------
   * Statics
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name patch
   * @description update & persist(save) provided model
   * @param {ObjectId|String} [id] valid instance object id
   * @param {Object} updates model details to save
   * @param {ObjectId|String} updates._id valid existing model object id
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof patchPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .patch({_id: ..., name: ...}, function(error, updated){
   *       ...
   *   });
   */
  schema.statics.patch = function patch(id, updates, done) {
    // ref
    const Model = this;

    // normalize arguments
    let model = updates;
    let cb = done;

    // handle 3 args
    if (arguments.length === 3) {
      model = updatesFor(id, updates);
      cb = done;
    }

    // handle 2 args
    else if (arguments.length === 2) {
      model = updatesFor(_.get(id, '_id'), id);
      cb = updates;
    }

    // handle 1 args
    else {
      cb = id;
      const error = new Error('Illegal Arguments');
      error.status = 400;
      cb(error);
    }

    // ensure id
    model._id = model._id || model.id; // eslint-disable-line
    const modelId = model._id; // eslint-disable-line
    if (!modelId) {
      const error = new Error('Missing Instance Id');
      error.status = 400;
      cb(error);
    }

    // continue with patch
    waterfall(
      [
        function findExisting(next) {
          if (isInstance(model)) {
            next(null, model);
          } else {
            Model.findById(modelId)
              .orFail()
              .exec(next);
          }
        },

        function afterFindExisting(instance, next) {
          //  handle instance
          if (isInstance(model)) {
            model.patch({ updatedAt: new Date() }, next);
          }
          //  handle updates
          else {
            delete model._id; // eslint-disable-line
            delete model.id;
            instance.patch(model, next);
          }
        },
      ],
      function oncePatch(err, updated) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, updated);
      }
    );
  };
}

/**
 * @function
 * @name postPlugin
 * @namespace
 * @description mongoose schema plugin to support http post verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid post plugin options
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com>
 * @example
 *
 * const mongoose from 'mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * const express = require('express');
 * const app = express();
 *
 * ...
 *
 * app.post('/users', function(request, response, next){
 *
 *   // obtain user
 *   const body = request.body;
 *
 *   // create user
 *   User
 *     .post(body, function(error, created){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function postPlugin(Schema) {
  const schema = Schema;
  /*
   *----------------------------------------------------------------------------
   * Instances
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name post
   * @description persist current model instance. more business logics can
   *              be implemented using beforePost and afterPost model instance
   *              methods
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} saved instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @instance
   * @memberof postPlugin
   * @public
   * @example
   *
   * const UserSchema = new Schema({
   *  name: { type: String }
   * });
   *
   * UserSchema.methods.beforePost = function (done) {
   *  ...called before post(does not touch mongoose hooks)
   *  ...do any checkup if post is allowed
   *  ...log, post to analytics etc
   *  ...throw error and post wont happen i.e done(error)
   *  ...once through call done()
   *  done();
   * };
   *
   * UserSchema.methods.afterPost = function (done) {
   *  ...called after post(does not touch mongoose hooks)
   *  ...update any cached instance
   *  ...update any related instances
   *  ...log, post to analytics, initiate background job etc
   *  ...instance is already posted(any throws wont stop it)
   *  ...once through call done()
   *  done();
   * };
   *
   * const User = mongoose.model('User', UserSchema);
   *
   * const user = ...find user
   * user.post(function(error, saved){
   *     ...
   *   });
   */
  schema.methods.post = function post(done) {
    async.waterfall(
      [
        /**
         * @function
         * @name beforePost
         * @description perform pre(save/post) logics
         * @param {Function} next a callback to invoke after beforePost
         * @returns {instance|error}
         * @private
         */
        function beforePost(next) {
          // obtain before hooks
          const before =
            this.beforePost || this.prePost || this.beforeSave || this.preSave;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(
              this,
              function onBeforePost(error, instance) {
                next(error, instance || this);
              }.bind(this)
            );
          }
          // no hook
          else {
            next(null, this);
          }
        }.bind(this),

        /**
         * @function
         * @name doPost
         * @description persist model instance
         * @param {Function} next a callback to invoke after save
         * @returns {instance|error}
         * @private
         */
        function doPost(instance, next) {
          instance.save(function afterSave(error, saved) {
            next(error, saved);
          });
        },

        /**
         * @function
         * @name afterPost
         * @description perform after(save/post) logics
         * @param {Function} next a callback to invoke after afterSave
         * @returns {instance|error}
         * @private
         */
        function afterPost(instance, next) {
          // obtain after hooks
          const after =
            instance.afterPost ||
            instance.postPost ||
            instance.afterSave ||
            instance.postSave;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, function onAfterPost(error, instanced) {
              next(error, instanced || instance);
            });
          }
          // no hook
          else {
            next(null, instance);
          }
        },
      ],

      /**
       * @function
       * @name onSave
       * @param {Object} error error object when fails to post
       * @param {Object} saved model instance
       * @private
       */
      function oncePost(err, saved) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        done(error, saved);
      }
    );
  };

  /*
   *----------------------------------------------------------------------------
   * Statics
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name post
   * @description persist(save) provided model
   * @param {Object} body model details to save
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} saved instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof postPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User.post({}, function(error, saved){
   *     ...
   *   });
   */
  schema.statics.post = function post(body, done) {
    // instantiate model
    const instance = isInstance(body) ? body : new this(copyInstance(body));

    // persist model
    instance.post(done);
  };
}

const updatesFor$1 = (id, updates) => {
  // ignore self instance updates
  // eslint-disable-next-line
  if (isInstance(updates) && updates._id === id) {
    return updates;
  }
  // compute updates
  const changes = mergeObjects(copyInstance(updates), { _id: id });
  return changes;
};

/**
 * @function
 * @name putPlugin
 * @namespace
 * @description mongoose schema plugin to support http put verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid put plugin options
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com>
 * @example
 *
 * const mongoose = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * const express = require('express');
 * const app = express();
 *
 * ...
 *
 * app.put('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   updates._id = request.params.id;
 *
 *   // put user
 *   User
 *     .put(updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 * or
 *
 * app.put('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   const _id = request.params.id;
 *
 *   // put user
 *   User
 *     .put(_id, updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function putPlugin(Schema) {
  const schema = Schema;

  /*
   *----------------------------------------------------------------------------
   * Instances
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name put
   * @description update and persist current model instance. more business
   *              logics can be implemented using beforePut and afterPut
   *              model instance methods
   * @param {Object} updates updates to apply on model instance
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @instance
   * @memberof putPlugin
   * @public
   * @example
   *
   * const UserSchema = new Schema({
   *  name: { type: String }
   * });
   *
   * UserSchema.methods.beforePut = function (done) {
   *  ...called before put(does not touch mongoose hooks)
   *  ...do any checkup if put is allowed
   *  ...log, post to analytics etc
   *  ...throw error and put wont happen i.e done(error)
   *  ...once through call done()
   *  done();
   * };
   *
   * UserSchema.methods.afterPut = function (done) {
   *  ...called after put(does not touch mongoose hooks)
   *  ...delete any cached instance
   *  ...delete any related instances
   *  ...log, post to analytics, initiate background job etc
   *  ...instance is already updated(any throws wont stop it)
   *  ...once through call done()
   *  done();
   * };
   *
   * const User = mongoose.model('User', UserSchema);
   *
   * const user = ...find user
   * user.put(updates, function(error, updated){
   *     ...
   *  });
   */
  schema.methods.put = function put(updates, done) {
    // normalize arguments
    const body = _.isFunction(updates) ? {} : updatesFor$1(null, updates);
    const cb = _.isFunction(updates) ? updates : done;

    // remove unused
    delete body._id; // eslint-disable-line
    delete body.updatedAt;

    waterfall(
      [
        /**
         * @name beforePut
         * @function beforePut
         * @description perform pre(save/put) logics
         * @param {Function} next a callback to invoke after beforePut
         * @returns {instance|error}
         * @private
         */
        function beforePut(next) {
          // obtain before hooks
          const before =
            this.beforePut ||
            this.prePut ||
            this.beforeUpdate ||
            this.preUpdate;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(
              this,
              body,
              function onBeforePut(error, instance) {
                next(error, instance || this);
              }.bind(this)
            );
          }
          // no hook
          else {
            next(null, this);
          }
        }.bind(this),

        /**
         * @name doPut
         * @function doPut
         * @description update and persist model instance
         * @param {Function} next a callback to invoke after save
         * @returns {instance|error}
         * @private
         */
        function doPut(model, next) {
          const instance = model;
          // update & persist instance
          if (body && !_.isEmpty(body)) {
            instance.set(body);
          }
          instance.updatedAt = new Date();
          instance.save(function afterSave(error, saved) {
            next(error, saved);
          });
        },

        /**
         * @name afterPut
         * @function afterPut
         * @description perform after(save/put) logics
         * @param {Function} next a callback to invoke after afterSave
         * @returns {instance|error}
         * @private
         */
        function afterPut(instance, next) {
          // obtain after hooks
          const after =
            instance.afterPut ||
            instance.postPut ||
            instance.afterUpdate ||
            instance.postUpdate;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, body, function onAfterPut(error, instanced) {
              next(error, instanced || instance);
            });
          }
          // no hook
          else {
            next(null, instance);
          }
        },
      ],

      /**
       * @function
       * @name onPut
       * @description perform on put logics
       * @param {Object} error error object when fails to put
       * @param {Object} puted model instance
       * @private
       */
      function oncePut(err, puted) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, puted);
      }
    );
  };

  /*
   *----------------------------------------------------------------------------
   * Statics
   *----------------------------------------------------------------------------
   */

  /**
   * @function
   * @name put
   * @description update & persist(save) provided model
   * @param {ObjectId|String} [id] valid instance object id
   * @param {Object} updates model details to save
   * @param {ObjectId|String} updates._id valid existing model object id
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.2.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof putPlugin
   * @public
   * @example
   *
   * const User = mongoose.model('User');
   * User.put(id, updates, (error, updated) => { ... });
   * User.put({_id: ..., name: ...}, (error, updated) => { ... });
   *
   */
  schema.statics.put = function put(id, updates, done) {
    //  ref
    const Model = this;

    // normalize arguments
    let model = updates;
    let cb = done;

    // handle 3 args
    if (arguments.length === 3) {
      model = updatesFor$1(id, updates);
      cb = done;
    }

    // handle 2 args
    else if (arguments.length === 2) {
      model = updatesFor$1(_.get(id, '_id'), id);
      cb = updates;
    }

    // handle 1 args
    else {
      cb = id;
      const error = new Error('Illegal Arguments');
      error.status = 400;
      cb(error);
    }

    // ensure id
    model._id = model._id || model.id; // eslint-disable-line
    const modelId = model._id; // eslint-disable-line
    if (!modelId) {
      const error = new Error('Missing Instance Id');
      error.status = 400;
      cb(error);
    }

    // continue with put
    waterfall(
      [
        function findExisting(next) {
          if (isInstance(model)) {
            next(null, model);
          } else {
            Model.findById(modelId)
              .orFail()
              .exec(next);
          }
        },

        function afterFindExisting(instance, next) {
          //  handle instance
          if (isInstance(model)) {
            model.put({ updatedAt: new Date() }, next);
          }
          //  handle updates
          else {
            delete model._id; // eslint-disable-line
            delete model.id;
            instance.put(model, next);
          }
        },
      ],
      function oncePut(err, updated) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, updated);
      }
    );
  };
}

// constants
const defaultHidden = {
  defaultHidden: {
    password: true,
    __v: true,
    __t: true,
  },
  virtuals: {
    id: 'hideJSON',
    runInBackgroundQueue: 'hide',
    runInBackgroundOptions: 'hide',
  },
};

/**
 * @module mongoose-rest-actions
 * @name restActions
 * @function restActions
 * @description mongoose schema plugins to support http verb(s)
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid delete plugin options
 * @param {String} [schemaOptns.root] a field name to use to hold results.
 * default to `data`
 *
 * @author lally elias<lallyelias87@gmail.com>
 * @version 0.18.0
 * @since 0.1.0
 * @example
 *
 * const { Schema } = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 *
 * const User = new Schema({
 *   name: { type: String }
 * });
 * User.plugin(actions);
 *
 */
function restActions(Schema, schemaOptns) {
  const schema = Schema;
  /* @todo refactor and simplify */

  // ignore if already plugged-in
  if (schema.statics.get) {
    return;
  }

  // normalize options
  const schemaOptions = _.merge(
    {},
    {
      root: 'data',
    },
    schemaOptns
  );

  // ensure indexed timestamps fields
  // currently mongoose does not index them
  // see https:// github.com/Automattic/mongoose/blob/master/lib/schema.js#L1002
  const hasTimeStamps = _.get(schema, 'options.timestamps', false);
  if (hasTimeStamps) {
    // obtain timestamps paths
    const createdAtField = _.isBoolean(hasTimeStamps)
      ? 'createdAt'
      : hasTimeStamps.createdAt;
    schema.statics.CREATED_AT_FIELD = createdAtField;

    const updatedAtField = _.isBoolean(hasTimeStamps)
      ? 'updatedAt'
      : hasTimeStamps.updatedAt;
    schema.statics.UPDATED_AT_FIELD = updatedAtField;

    // ensure index on create timestamp path if not exists
    if (schema.paths[createdAtField]) {
      schema.paths[createdAtField].options.index = true;
      schema.index({
        [createdAtField]: 1,
      });
    }

    // ensure index on update timestamp path if not exists
    if (schema.paths[updatedAtField]) {
      schema.paths[updatedAtField].options.index = true;
      schema.index({
        [updatedAtField]: 1,
      });
    }
  }

  // extend schema with deletedAt timestamp
  schema.add({
    deletedAt: {
      type: Date,
      index: true,
    },
  });

  // rest actions plugin
  getPlugin(schema, schemaOptions);
  postPlugin(schema, schemaOptions);
  putPlugin(schema, schemaOptions);
  patchPlugin(schema, schemaOptions);
  deletePlugin(schema, schemaOptions);

  // lastly common plugins
  fake(schema, schemaOptions);
  exist(schema, schemaOptions);
  taggable(schema, schemaOptions);
  search(schema, schemaOptions);
  autopopulate(schema, schemaOptions);
  aggregatable(schema, schemaOptions);
  hide(defaultHidden)(schema, schemaOptions);
}

export default restActions;
