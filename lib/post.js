'use strict';


/* dependencies */
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');


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
 * const mongoose = require('mongoose');
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
 *   //obtain user
 *   const body = request.body;
 *
 *   //create user
 *   User
 *     .post(body, function(error, created){
 *       ...handle error or reply
 *     });
 * });
 *
 */
module.exports = exports = function postPlugin(schema /*, schemaOptns*/ ) {

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

    async.waterfall([


        /**
         * @function
         * @name beforePost
         * @description perform pre(save/post) logics
         * @param {Function} next a callback to invoke after beforePost
         * @returns {instance|error}
         * @private
         */
        function beforePost(next) {
          //obtain before hooks
          const before =
            (this.beforePost || this.prePost ||
              this.beforeSave || this.preSave);

          //run hook(s)
          if (_.isFunction(before)) {
            before.call(this, function (error, instance) {
              next(error, instance || this);
            }.bind(this));
          }
          //no hook
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
          //obtain after hooks
          const after =
            (instance.afterPost || instance.postPost ||
              instance.afterSave || instance.postSave);

          //run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, function (error, instanced) {
              next(error, instanced || instance);
            });
          }
          //no hook
          else {
            next(null, instance);
          }

        }
      ],


      /**
       * @function
       * @name onSave
       * @param {Object} error error object when fails to post
       * @param {Object} saved model instance
       * @private
       */
      function onSave(error, saved) {
        if (error) {
          error.status = 400;
        }
        done(error, saved);
      });

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

    //ensure body data
    const model = utils.merge(body);

    //instantiate model
    const instance = new this(model);

    //persist model
    instance.post(done);

  };

};