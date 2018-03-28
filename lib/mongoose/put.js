'use strict';


//dependencies
const _ = require('lodash');
const async = require('async');


/**
 * @name putPlugin
 * @function putPlugin
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
 * const expess = require('express');
 * const app = express();
 *
 * ...
 * 
 * app.put('/users/:id', function(request, response, next){
 *   
 *   //obtain user
 *   const updates = request.body;
 *
 *   //obtain id
 *   updates._id = request.params.id;
 *
 *   //put user
 *   User
 *     .put(updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 * 
 */
module.exports = exports = function putPlugin(schema /*, schemaOptns*/ ) {

  /**
   * @name put
   * @function put
   * @description update and persist current model instance. more business 
   *              logics can be implemented using beforePut and afterPut 
   *              model instance methods
   * @param  {Object} updates updates to apply on model instance
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} updated instance or error found on save
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

    //normalize arguments
    const body = _.isFunction(updates) ? {} : _.merge({}, updates);
    const cb = _.isFunction(updates) ? updates : done;

    //remove unused
    delete body._id;

    async.waterfall([

      /**
       * @name beforePut
       * @function beforePut
       * @description perform pre(save/put) logics
       * @param  {Function} next a callback to invoke after beforePut
       * @return {instance|error}
       * @private
       */
      function beforePut(next) {
        //obtain before hooks
        const before =
          (this.beforePut || this.prePut ||
            this.beforeUpdate || this.preUpdate);

        //run hook(s)
        if (_.isFunction(before)) {
          before.call(this, body, function (error, instance) {
            next(error, instance || this);
          }.bind(this));
        }
        //no hook
        else {
          next(null, this);
        }

      }.bind(this),


      /**
       * @name doPut
       * @function doPut
       * @description update and persist model instance
       * @param  {Function} next a callback to invoke after save
       * @return {instance|error}
       * @private
       */
      function doPut(instance, next) {
        //update & persist instance
        if (body && !_.isEmpty(body)) {
          instance.set(body);
        }
        instance.save(function afterSave(error, saved) {
          next(error, saved);
        });
      },

      /**
       * @name afterPut
       * @function afterPut
       * @description perform after(save/put) logics
       * @param  {Function} next a callback to invoke after afterSave
       * @return {instance|error}
       * @private
       */
      function afterPut(instance, next) {
        //obtain after hooks
        const after =
          (instance.afterPut || instance.postPut ||
            instance.afterUpdate || instance.postUpdate);

        //run hook(s)
        if (_.isFunction(after)) {
          after.call(instance, body, function (error, instanced) {
            next(error, instanced || instance);
          });
        }
        //no hook
        else {
          next(null, instance);
        }

      }

    ], function onPut(error, puted) {
      if (error) {
        error.status = 400;
      }
      cb(error, puted);
    });

  };


  /**
   * @name put
   * @function put
   * @description update & persist(save) provided model
   * @param {Object} body model details to save
   * @param {ObjectId|String} body._id valid existing model object id
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} saved instance or error found on save
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .put({_id: ..., name: ...}, function(error, updated){
   *       ...
   *   });
   */
  schema.statics.put = function put(body, done) {
    //ensure body data
    const model = _.merge({}, body);

    //ensure id
    if (!model._id) {
      let error = new Error('Missing Instance Id');
      error.status = 400;
      done(error);
    }

    //continue with put
    else {
      async.waterfall([

        function findExisting(next) {
          this.findById(model._id, next);
        }.bind(this),

        function afterFindExisting(instance, next) {
          //ensure instance
          if (!instance) {
            let error = new Error('Not Found');
            error.status = 404;
            next(error);
          }
          //do put
          else {
            //prepare body
            delete model._id;
            instance.put(model, next);
          }
        }

      ], done);
    }

  };

};