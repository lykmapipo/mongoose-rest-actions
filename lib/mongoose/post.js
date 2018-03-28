'use strict';


//dependencies
const _ = require('lodash');
const async = require('async');


/**
 * @name postPlugin
 * @function postPlugin
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
 * const expess = require('express');
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

  /**
   * @name post
   * @function post
   * @description persist current model instance. more business logics can
   *              be implemented using beforePost and afterPost model instance 
   *              methods
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} saved instance or error found on save
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @private
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
       * @name beforePost
       * @function beforePost
       * @description perform pre(save/post) logics
       * @param  {Function} next a callback to invoke after beforePost
       * @return {instance|error}
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
       * @name doPost
       * @function doPost
       * @description persist model instance
       * @param  {Function} next a callback to invoke after save
       * @return {instance|error}
       * @private
       */
      function doPost(instance, next) {
        instance.save(function afterSave(error, saved) {
          next(error, saved);
        });
      },

      /**
       * @name afterPost
       * @function afterPost
       * @description perform after(save/post) logics
       * @param  {Function} next a callback to invoke after afterSave
       * @return {instance|error}
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

    ], function onSave(error, saved) {
      if (error) {
        error.status = 400;
      }
      done(error, saved);
    });

  };


  /**
   * @name post
   * @function post
   * @description persist(save) provided model
   * @param {Object} body model details to save
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} saved instance or error found on save
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User.post({},function(error, saved){
   *     ...
   *   });
   */
  schema.statics.post = function post(body, done) {
    //ensure body data
    const model = _.merge({}, body);

    //instantiate model
    const instance = new this(model);

    //persist model
    instance.post(done);

  };

};