import _ from 'lodash';
import { waterfall, parallel } from 'async';

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

export default getPlugin;
