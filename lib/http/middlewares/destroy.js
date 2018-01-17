'use strict';


//TODO remove single
//TODO remove many
//TODO remove related
//TODO restrict removing related if constraints does not allow
//TODO clear cached content
//TODO allow soft delete
//TODO allow permenent delete
//TODO allow relations to be cleared
//TODO find and destroy
//TODO support additional query options
//TODO support background delete


//global dependencies(or imports)
const _ = require('lodash');
let mongoose = require('mongoose');


//local constants
const defaults = {

  //if soft delete allowed
  soft: false,

  //if to handle error and reply
  handleError: false,

  //if delete performed in background
  background: false,

  //if delete should return response body
  supportContent: false,

  //if wrapping response in object envelope is allowed
  envelope: true,

  //if to dump whole error
  production: false

};



/**
 * @name destroy
 * @description factory to create remove middleware for mongoose rest actions
 *              and resources.
 * @param  {Object} optns remove factory options
 * @param  {Object} [optns.mongoose] valid instance of mongoose
 * @param  {Object} [optns.soft] whether to use soft delete than permanently
 *                               delete
 * @return {Function}     http middleware to be used for destroying resource(s)
 * @version 0.1.0 
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com> 
 * @author lally elias<https://github.com/lykmapipo>
 * @public
 * @see {@link http://jsonapi.org/format/#crud-deleting} 
 * 
 * @example
 * 
 * 1. As standalone middleware
 * const remove = require('mongoose-rest-actions').remove();
 * app.delete('/users', remove);
 *
 * 
 * 2. With resource router from rest actions
 * const resource = require('mongoose-rest-actions').resource;
 * app.use(resource({model: 'User'}));
 * 
 */
function destroy(optns) {

  //1...ensure options
  const options = _.merge({}, defaults, optns);

  //1.1...reset dependencies
  mongoose = (options.mongoose || mongoose);

  //1.2...obtain required options
  const isModelInstance = (options.model && !_.isString(options.model));

  //Note!: we dont check for actual mongoose model instance to allow
  //anything that has implemented the remove contract to
  //be a candidate of Model
  //1.2.1...obtain model
  let Model;
  try {
    Model =
      (isModelInstance ? options.model : mongoose.model(options.model));
  } catch (error) {} //no ops

  if (!Model) {
    let error = new Error('Missing Model');
    error.status = 500;
    throw error;
  }

  //1.2.2...obtain model action
  //Note!: If model impement findByIdAndDestroy it will be used than
  //direct mongoose model remove static method
  const destroy = (Model.findByIdAndDestroy || Model.findByIdAndRemove);
  if (!destroy && !_.isFunction(destroy)) {
    let error = new Error('Missing Remove Model Action');
    error.status = 500;
    throw error;
  }


  //2...implement middleware
  function _destroy(request, response, next) {

    //2.1.0...obtain request params and query parameters
    const params = _.merge({}, request.params);
    const query = _.merge({}, request.query);

    //2.1.2...obtain resource _id
    const _id = (params.id || params._id) || (query.id || query._id);

    //TODO improve criterias

    //2.1.3...use destroy resource(s)
    destroy(_id, function afterDestroy(error, results) {
      //TODO refactor to error middleware
      //2.2...handle error
      if (error) {
        //ensure status
        error.status = error.status || 500;

        //TODO notify error
        if (options.handleError) {

          //prepare error response
          const _response = {};
          _response.status = error.status || 500;
          _response.code = error.code || 500;
          _response.title = error.name || error.message;
          _response.description = error.message || error.name;

          //include error stacktrace if not production
          if (!options.production) {
            _response.error = error;
          }

          //return response
          response.status(_response.status).json(_response);

        } else {
          next(error);
        }

      }


      //TODO refactor response middleware
      //handle results
      else {
        //TODO notify response

        //prepare response status
        let status = options.supportContent ? 200 : 204;
        status = options.background ? 202 : status;
        results = options.supportContent ? results : undefined;

        //return response
        response.status(status).json(results);

      }

    });

  }

  return _destroy;

}



exports = module.exports = destroy;