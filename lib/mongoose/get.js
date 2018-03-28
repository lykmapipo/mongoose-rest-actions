'use strict';


//dependencies
const _ = require('lodash');
const async = require('async');


//default get options
const defaults = {
  filter: {},
  paginate: { limit: 10, skip: 0, page: 1 },
  populate: [],
  select: {},
  sort: {}
};


/**
 * @module mongoose-rest-actions
 * @name getPlugin
 * @function getPlugin
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
 *   //prepare options
 *   const options = {page: request.query.page, limit: request.query.limit}
 *
 *   //get users
 *   User
 *     .get(options, function(error, results){
 *       ...handle error or reply
 *     });
 * });
 * 
 * app.get('/users/:id', function(request, response, next){
 *   
 *   //obtain id
 *   const _id = request.params.id;
 *
 *   //get user
 *   User
 *     .getById(_id, function(error, user){
 *       ...handle error or reply
 *     });
 * });
 * 
 */
module.exports = exports = function getPlugin(schema /*, schemaOptns*/ ) {

  /**
   * @name getById
   * @function getById
   * @description find existing model instance by its id
   * @param {Object|ObjectId|String} [optns={}] valid existing model object id 
   *                                            of getById options
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} found instance or error
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * const options = {_id: ..id, select: 'name, -age'};
   * User
   *   .getById(options, function(error, found){
   *       ...
   *   });
   */
  schema.statics.getById = function getById(optns, done) {

    //normalize options
    let options = _.isFunction(optns) ? {} : optns;
    const cb = _.isFunction(optns) ? optns : done;
    options = _.isPlainObject(options) ? options : { _id: options };
    options._id = options._id || options.id;
    delete options.id;

    //ensure id
    if (!options._id) {
      let error = new Error('Missing Instance Id');
      error.status = 400;
      cb(error);
    }

    //continue with delete
    else {
      async.waterfall([

        function findExisting(next) {

          //prepare find query
          const findQuery = this.findById(options._id);

          //if select
          if (options.select) {
            findQuery.select(options.select);
          }

          //if populate
          if (options.populate) {
            const populate = _.compact([].concat(options.populate));
            _.forEach(populate, function (populateOption) {
              findQuery.populate(populateOption);
            });
          }

          findQuery.exec(next);

        }.bind(this),

        function afterFindExisting(instance, next) {
          //ensure instance
          if (!instance) {
            let error = new Error('Not Found');
            error.status = 404;
            next(error);
          }
          //do patch
          else {
            next(null, instance);
          }
        }

      ], cb);
    }

  };


  /**
   * @name get
   * @function get
   * @description count and find existing model(s) based on specified options
   * @param {Object} [optns={}]
   * @param {Object|String} [optns.filter] valid mongoose query criteria
   * @param {Object|String} [optns.select] valid mongoose query projections
   * @param {Object|String} [optns.sort] valid mongoose query sort criteria
   * @param {Array} [optns.populate] valid mongoose query population options
   * @param {Number} [optns.paginate.skip=0] valid query skip option
   * @param {Number} [optns.paginate.page=1] 
   * @param {Number} [optns.paginate.limit=10] valid query limit option
   * @returns {Object} results
   * @returns {Object[]} [results.data] array of documents
   * @returns {Number} [results.total] total number of documents in collection that match a query
   * @returns {Number} [results.size]  length of current page documents
   * @returns {Number} [results.limit] limit that was used
   * @returns {Number} [results.skip] skip that was used
   * @returns {Number} [results.page] page that was used
   * @returns {Number} [results.pages] total number of pages that match a query
   * @param  {Function} done a callback to invoke on success or failure
   * @return {Object|error} results or error
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
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

    //normalize options & callback
    const cb = _.isFunction(optns) ? optns : done;

    let options = _.isFunction(optns) ? {} : optns;
    options = _.merge({}, defaults, options);
    options = _.merge({}, options.paginate, options);
    delete options.paginate;

    //obtain query criteria
    let filter = (options.query || options.criteria || options.filter);

    //obtain limit
    let limit = (options.limit || options.limit || 10);
    limit = limit > 0 ? limit : 10;

    //obtain skip
    let skip = (options.skip || options.skip || options.offset || 0);
    skip = skip > 0 ? skip : 0;

    //obtain page
    let page = (options.page || options.page);

    let populate = _.compact([].concat(options.populate));
    let select = (options.select || {});
    let sort = (options.sort || {});


    //initialize query
    let findQuery = this.find();
    let countQuery = this.find();

    //try build search query
    const canSearch = (_.isFunction(this.search) && _.isString(filter.q));
    if (canSearch) {
      findQuery = this.search(filter.q);
      countQuery = this.search(filter.q);
    }
    delete filter.q;

    //add criteria
    filter = this.where(filter).cast(this);
    findQuery.where(filter);
    countQuery.where(filter);

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
      _.forEach(populate, function (populateOption) {
        findQuery.populate(populateOption);
      });
    }

    async.parallel({

      count: function countMatched(next) {
        countQuery.count().exec(next);
      },

      data: function paginateMatched(next) {
        findQuery.exec(next);
      }

    }, function (error, results) {

      if (results) {
        results = _.merge({}, {
          data: results.data,
          total: results.count,
          size: results.data.length,
          limit: limit,
          skip: skip,
          page: page,
          pages: Math.ceil(results.count / limit) || 1
        });
      }

      cb(error, results);

    });

  };

};