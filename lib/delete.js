'use strict';


/* dependencies */
const _ = require('lodash');
const { waterfall } = require('async');


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
 *   //obtain id
 *   const _id = request.params.id;
 *
 *   //delete user
 *   User
 *     .del(_id, function(error, deleted){
 *       ...handle error or reply
 *     });
 * });
 *
 */
module.exports = exports = function deletePlugin(schema /*, schemaOptns*/ ) {

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
  schema.methods.del = function del(options, done) {
    // normalize arguments
    const defaults = { soft: false };
    done = _.isFunction(options) ? options : done;
    options = _.isFunction(options) ? defaults : _.merge(defaults, options);

    waterfall([

        /**
         * @name beforeDelete
         * @function beforeDelete
         * @description perform pre delete logics
         * @param {Function} next a callback to invoke after beforeDelete
         * @returns {instance|error}
         * @private
         */
        function beforeDelete(next) {
          //obtain before hooks
          const before = (this.beforeDelete || this.preDelete);

          //run hook(s)
          if (_.isFunction(before)) {
            before.call(this, function (error, instance) {
              next(error, instance || this);
            }.bind(this));
          }
          //no hook
          else {
            //TODO use undefined
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
          //TODO throw error if already deleted
          // soft delete
          const { soft } = options;
          if (soft) {
            const updates = { deletedAt: new Date() };
            instance.patch(updates, next);
          }
          // hard deletes
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
          //obtain after hooks
          const after = (instance.afterDelete || instance.postDelete);

          //run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, function (error, instanced) {
              next(error, instanced || instance);
            });
          }
          //no hook
          else {
            //TODO use undefined
            next(null, instance);
          }

        }

      ],

      /**
       * @function
       * @name onDelete
       * @description perform on delete logics
       * @param {Object} error error object when fails to delete
       * @param {Object} deleted model instance
       * @private
       */
      function onceDelete(error, deleted) {
        if (error) {
          error.status = (error.status || 400);
        }
        done(error, deleted);
      });

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
  schema.statics.del = function del(options, done) {
    // normalize arguments
    const defaults = { soft: false };
    options = _.isPlainObject(options) ? options : { _id: options };
    options = _.merge(defaults, options);

    const { _id, soft } = options;

    //ensure id
    if (!_id) {
      let error = new Error('Missing Instance Id');
      error.status = 400;
      return done(error);
    }

    //continue with delete
    waterfall([

      function findExisting(next) {
        this.findById(_id).orFail().exec(next); //TODO use getById
      }.bind(this),

      function afterFindExisting(instance, next) {
        instance.del({ soft }, next);
      }

    ], function onceDelete(error, patched) {
      if (error) {
        error.status = (error.status || 400);
      }
      done(error, patched);
    });

  };

};
