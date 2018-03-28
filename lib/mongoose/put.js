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
 * const plugin = require('mongoose-rest-actions').plugin;
 * mongoose.plugin(plugin);
 *
 * const expess = require('express');
 * const middlewares = require('mongoose-rest-actions').middlewares;
 * const app = express();
 * app.use(middlewares());
 *
 * ....
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
 *       if(error){
 *         next(error);
 *       }
 *       else{
 *         response.status(200);
 *         response.json(updated);
 *       }
 *     });
 * });
 * 
 */
module.exports = exports = function putPlugin(schema /*, schemaOptns*/ ) {

  //normalize schema options
  // const schemaOptions = _.merge({}, schemaOptns);

  //TODO get only fillable(un protected) schema path from body

  /**
   * @name put
   * @function put
   * @description update and persist current model instance. 
   *              More business logics can be implemented using 
   *              beforeUpdate(beforePut) and afterUpdate(afterPut).
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
   *  done();
   * };
   *
   * UserSchema.methods.afterPut = function (done) {
   *  ...called after put(does not touch mongoose hooks)
   *  done();
   * };
   * 
   * const User = mongoose.model('User', UserSchema);
   *
   * user.put(updates, function(error, updated){
   *     ....
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
       * @description call perform pre(save/put) logics
       * @param  {Function} next a callback to invoke after beforePut
       * @return {instance|error}
       * @private
       */
      function beforePut(next) {
        //obtain before hooks
        const before = (this.beforeUpdate || this.beforePut);

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
       * @description call perform after(save/put) logics
       * @param  {Function} next a callback to invoke after afterSave
       * @return {instance|error}
       * @private
       */
      function afterPut(instance, next) {
        //obtain after hooks
        const after = (instance.afterUpdate || instance.afterPut);

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
   *       ....
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