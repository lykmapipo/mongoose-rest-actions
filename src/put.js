import _ from 'lodash';
import { waterfall } from 'async';
import { mergeObjects } from '@lykmapipo/common';
import { copyInstance, isInstance } from '@lykmapipo/mongoose-common';

const updatesFor = (id, updates) => {
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
    const body = _.isFunction(updates) ? {} : updatesFor(null, updates);
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

export default putPlugin;
