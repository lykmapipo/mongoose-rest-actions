'use strict';


//dependencies
const _ = require('lodash');
const async = require('async');


/**
 * @name patchPlugin
 * @function patchPlugin
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
 * const expess = require('express');
 * const app = express();
 *
 * ...
 * 
 * app.patch('/users/:id', function(request, response, next){
 *   
 *   //obtain user
 *   const updates = request.body;
 *
 *   //obtain id
 *   updates._id = request.params.id;
 *
 *   //patch user
 *   User
 *     .patch(updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 * 
 */
module.exports = exports = function patchPlugin(schema /*, schemaOptns*/ ) {

  /**
   * @name patch
   * @function patch
   * @description update and persist current model instance. more business 
   *              logics can be implemented using beforePatch and afterPatch 
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
   *     ....
   *  });
   */
  schema.methods.patch = function patch(updates, done) {

    //normalize arguments
    const body = _.isFunction(updates) ? {} : _.merge({}, updates);
    const cb = _.isFunction(updates) ? updates : done;

    //remove unused
    delete body._id;

    async.waterfall([

      /**
       * @name beforePatch
       * @function beforePatch
       * @description perform pre(save/patch) logics
       * @param  {Function} next a callback to invoke after beforePatch
       * @return {instance|error}
       * @private
       */
      function beforePatch(next) {
        //obtain before hooks
        const before =
          (this.beforePatch || this.prePatch ||
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
       * @name doPatch
       * @function doPatch
       * @description update and persist model instance
       * @param  {Function} next a callback to invoke after save
       * @return {instance|error}
       * @private
       */
      function doPatch(instance, next) {
        //update & persist instance
        if (body && !_.isEmpty(body)) {
          instance.set(body);
        }
        instance.save(function afterSave(error, saved) {
          next(error, saved);
        });
      },

      /**
       * @name afterPatch
       * @function afterPatch
       * @description perform after(save/patch) logics
       * @param  {Function} next a callback to invoke after afterSave
       * @return {instance|error}
       * @private
       */
      function afterPatch(instance, next) {
        //obtain after hooks
        const after =
          (instance.afterPatch || instance.postPatch ||
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

    ], function onPatch(error, patched) {
      if (error) {
        error.status = 400;
      }
      cb(error, patched);
    });

  };


  /**
   * @name patch
   * @function patch
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
   *   .patch({_id: ..., name: ...}, function(error, updated){
   *       ....
   *   });
   */
  schema.statics.patch = function patch(body, done) {
    //ensure body data
    const model = _.merge({}, body);

    //ensure id
    if (!model._id) {
      let error = new Error('Missing Instance Id');
      error.status = 400;
      done(error);
    }

    //continue with patch
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
          //do patch
          else {
            //prepare body
            delete model._id;
            instance.patch(model, next);
          }
        }

      ], done);
    }

  };

};