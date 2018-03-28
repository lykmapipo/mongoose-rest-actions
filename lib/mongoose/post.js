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
 * const plugin = require('mongoose-rest-actions').plugin;
 * mongoose.plugin(plugin);
 *
 * const expess = require('express');
 * const middlewares = require('mongoose-rest-actions').middlewares;
 * const app = express();
 * app.use(middlewares());
 *
 * ....
 * app.post('/users', function(request, response, next){
 * 	 
 * 	 //obtain user
 * 	 const body = request.body;
 *
 * 	 //create user
 *   User
 *     .post(body, function(error, created){
 *       if(error){
 *         next(error);
 *       }
 *       else{
 *         response.status(201);
 *         response.json(created);
 *       }
 *     });
 * });
 * 
 */
module.exports = exports = function postPlugin(schema /*, schemaOptns*/ ) {

  //normalize schema options
  // const schemaOptions = _.merge({}, schemaOptns);

  //TODO get only fillable schema path from body

  /**
   * @name post
   * @function post
   * @description persist current model instance. More business logics can
   *              be implemented using beforeSave(beforePost) and afterSave(afterPost).
   * @param  {Function} done a callback to invoke on success or failure
   * @return {instance|error} saved instance or error found on save
   * @version 0.1.0 
   * @since 0.1.0
   * @author lally elias<lallyelias87@gmail.com> 
   * @private
   * @example
   * const User = mongoose.model('User');
   *
   * const user = new User({...});
   * user.post(function(error, saved){
   * 	   ....
   *  	});
   */
  schema.methods.post = function post(done) {

    async.waterfall([

      /**
       * @name beforeSave
       * @function beforeSave
       * @description call perform pre(save/post) logics
       * @param  {Function} next a callback to invoke after beforePost
       * @return {instance|error}
       * @private
       */
      function beforePost(next) {
        //obtain before hooks
        const before = (this.beforeSave || this.beforePost);

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
       * @name doSave
       * @function doSave
       * @description persist model instance
       * @param  {Function} next a callback to invoke after save
       * @return {instance|error}
       * @private
       */
      function doSave(instance, next) {
        instance.save(function afterSave(error, saved) {
          next(error, saved);
        });
      },

      /**
       * @name beforeSave
       * @function beforeSave
       * @description call perform after(save/post) logics
       * @param  {Function} next a callback to invoke after afterSave
       * @return {instance|error}
       * @private
       */
      function afterPost(instance, next) {
        //obtain after hooks
        const after = (instance.afterSave || instance.afterPost);

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
   * 	   ....
   *  	});
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