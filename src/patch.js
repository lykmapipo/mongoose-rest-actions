import _ from 'lodash';
import { waterfall } from 'async';
import { mergeObjects } from '@lykmapipo/common';
import { copyInstance, isInstance } from '@lykmapipo/mongoose-common';

const updatesFor = (id, updates) => {
  //  ignore self instance updates
  // eslint-disable-next-line
  if (isInstance(updates) && updates._id === id) {
    return updates;
  }
  //  compute updates
  const changes = mergeObjects(copyInstance(updates), { _id: id });
  return changes;
};

/**
 * @function
 * @name patchPlugin
 * @namespace
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
 * const express = require('express');
 * const app = express();
 *
 * ...
 *
 * app.patch('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   updates._id = request.params.id;
 *
 *   // patch user
 *   User
 *     .patch(updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 * or
 *
 * app.patch('/users/:id', function(request, response, next){
 *
 *   // obtain user
 *   const updates = request.body;
 *
 *   // obtain id
 *   const _id = request.params.id;
 *
 *   // patch user
 *   User
 *     .patch(_id, updates, function(error, updated){
 *       ...handle error or reply
 *     });
 * });
 *
 */
function patchPlugin(Schema) {
  const schema = Schema;
  /*
   *----------------------------------------------------------------------------
   * Instances
   *----------------------------------------------------------------------------
   */

  /**
   * @name patch
   * @function patch
   * @description update and persist current model instance. more business
   *              logics can be implemented using beforePatch and afterPatch
   *              model instance methods
   * @param {Object} updates updates to apply on model instance
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @instance
   * @memberof patchPlugin
   * @public
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
   *     ...
   *  });
   */
  schema.methods.patch = function patch(updates, done) {
    // normalize arguments
    const body = _.isFunction(updates) ? {} : updatesFor(null, updates);
    const cb = _.isFunction(updates) ? updates : done;

    // remove unused
    delete body._id; // eslint-disable-line
    delete body.updatedAt;

    waterfall(
      [
        /**
         * @function
         * @name beforePatch
         * @description perform pre(save/patch) logics
         * @param {Function} next a callback to invoke after beforePatch
         * @returns {instance|error}
         * @private
         */
        function beforePatch(next) {
          // obtain before hooks
          const before =
            this.beforePatch ||
            this.prePatch ||
            this.beforeUpdate ||
            this.preUpdate;

          // run hook(s)
          if (_.isFunction(before)) {
            before.call(
              this,
              body,
              function onBeforePatch(error, instance) {
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
         * @function
         * @name doPatch
         * @description update and persist model instance
         * @param {Function} next a callback to invoke after save
         * @returns {instance|error}
         * @private
         */
        function doPatch(model, next) {
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
         * @function
         * @name afterPatch
         * @description perform after(save/patch) logics
         * @param {Function} next a callback to invoke after afterSave
         * @returns {instance|error}
         * @private
         */
        function afterPatch(instance, next) {
          // obtain after hooks
          const after =
            instance.afterPatch ||
            instance.postPatch ||
            instance.afterUpdate ||
            instance.postUpdate;

          // run hook(s)
          if (_.isFunction(after)) {
            after.call(instance, body, function onAfterPatch(error, instanced) {
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
       * @name onPatch
       * @description perform on patch logics
       * @param {Object} error error object when fails to patch
       * @param {Object} patched model instance
       * @private
       */
      function oncePatch(err, patched) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, patched);
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
   * @name patch
   * @description update & persist(save) provided model
   * @param {ObjectId|String} [id] valid instance object id
   * @param {Object} updates model details to save
   * @param {ObjectId|String} updates._id valid existing model object id
   * @param {Function} done a callback to invoke on success or failure
   * @returns {instance|error} updated instance or error
   * @version 0.1.0
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com>
   * @static
   * @memberof patchPlugin
   * @public
   * @example
   * const User = mongoose.model('User');
   *
   * User
   *   .patch({_id: ..., name: ...}, function(error, updated){
   *       ...
   *   });
   */
  schema.statics.patch = function patch(id, updates, done) {
    // ref
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

    // continue with patch
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
            model.patch({ updatedAt: new Date() }, next);
          }
          //  handle updates
          else {
            delete model._id; // eslint-disable-line
            delete model.id;
            instance.patch(model, next);
          }
        },
      ],
      function oncePatch(err, updated) {
        const error = err;
        if (error) {
          error.status = error.status || 400;
        }
        cb(error, updated);
      }
    );
  };
}

export default patchPlugin;
