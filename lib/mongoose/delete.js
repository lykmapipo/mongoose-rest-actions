'use strict';


//dependencies
const _ = require('lodash');
const async = require('async');


/**
 * @name deletePlugin
 * @function deletePlugin
 * @description mongoose schema plugin to support http delete verb
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid delete plugin options
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
 * app.delete('/users/:id', function(request, response, next){
 *   
 *   //obtain id
 *   const _id = request.params.id;
 *
 *   //delete user
 *   User
 *     .del(_id, function(error, deleted){
 *       if(error){
 *         next(error);
 *       }
 *       else{
 *         response.status(200);
 *         response.json(deleted);
 *       }
 *     });
 * });
 * 
 */
module.exports = exports = function deletePlugin(schema /*, schemaOptns*/ ) {

  //normalize schema options
  // const schemaOptions = _.merge({}, schemaOptns);


  /**
   * @name del
   * @function del
   * @description delete model instance. 
   *              More business logics can be implemented using 
   *              beforeDelete and afterDelete.
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} deleted instance or error found on delete
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
   * UserSchema.methods.beforeDelete = function (done) {
   *  ...called before delete(does not touch mongoose hooks)
   *  done();
   * };
   *
   * UserSchema.methods.afterDelete = function (done) {
   *  ...called after delete(does not touch mongoose hooks)
   *  done();
   * };
   * 
   * const User = mongoose.model('User', UserSchema);
   *
   * user.del(_id, function(error, deleted){
   *     ....
   *  });
   */
  schema.methods.del = function del(done) {

    async.waterfall([

      /**
       * @name beforeDelete
       * @function beforeDelete
       * @description call perform pre delete logics
       * @param  {Function} next a callback to invoke after beforeDelete
       * @return {instance|error}
       * @private
       */
      function beforeDelete(next) {
        //obtain before hooks
        const before = this.beforeDelete;

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
       * @name doDelete
       * @function doDelete
       * @description delete(remove) model instance
       * @param  {Function} next a callback to invoke after delete
       * @return {instance|error}
       * @private
       */
      function doDelete(instance, next) {
        instance.remove(function afterRemove(error, deleted) {
          next(error, deleted);
        });
      },

      /**
       * @name afterDelete
       * @function afterDelete
       * @description call perform after delete logics
       * @param  {Function} next a callback to invoke after afterDelete
       * @return {instance|error}
       * @private
       */
      function afterDelete(instance, next) {
        //obtain after hooks
        const after = instance.afterDelete;

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

    ], function onDelete(error, deleted) {
      if (error) {
        error.status = 400;
      }
      done(error, deleted);
    });

  };


  /**
   * @name del
   * @function del
   * @description delete(remove) existing model instance
   * @param {ObjectId|String} _id valid existing model object id
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} deleted instance or error found on save
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .del(_id, function(error, deleted){
   *       ....
   *   });
   */
  schema.statics.del = function del(_id, done) {


    //ensure id
    if (!_id) {
      let error = new Error('Missing Instance Id');
      error.status = 400;
      done(error);
    }

    //continue with delete
    else {
      async.waterfall([

        function findExisting(next) {
          this.findById(_id, next);
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
            instance.del(next);
          }
        }

      ], done);
    }

  };

};