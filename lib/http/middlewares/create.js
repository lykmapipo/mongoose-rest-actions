'use strict';


//TODO Obtain properties
//TODO Pre load all ref
//TODO If its ref find by its id or create new one
//TODO Return partial populated(use mongoose-autopopulate)
//TODO Cache created model

//global dependencies(or imports)
const path = require('path');
const _ = require('lodash');
let mongoose = require('mongoose');


//local dependencies(or imports)
const reply = require(path.join(__dirname, '..', '..', 'utils')).reply;


//local constants
const defaults = {

  //if to handle error and reply
  handleError: false,

  //if create performed in background
  background: false,

  //if delete should return response body
  supportContent: true,

  //if wrapping response in object envelope is allowed
  envelope: false,

  //if to dump whole error
  production: (process.ENV === 'production')

};



/**
 * @name create
 * @description factory for create middleware for mongoose rest actions
 *              and resources.
 * @param  {Object} optns create factory options
 * @param  {Object} [optns.mongoose] valid instance of mongoose
 * @return {Function}     http middleware to be used for creating single 
 *                        resource
 * @version 0.1.0 
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com> 
 * @author lally elias<https://github.com/lykmapipo>
 * @public
 * @see {@link http://jsonapi.org/format/#crud-creating} 
 * 
 * @example
 * 
 * 1. As standalone middleware
 * const create = require('mongoose-rest-actions').create();
 * app.post('/users', create);
 *
 * 
 * 2. With resource router from rest actions
 * const resource = require('mongoose-rest-actions').resource;
 * app.use(resource({model: 'User'}));
 * 
 */
function create(optns) {

  //1...ensure options
  const options = _.merge({}, defaults, optns);

  //1.1...reset dependencies
  mongoose = (options.mongoose || mongoose);

  //1.2...obtain required options
  const isModelInstance = (options.model && !_.isString(options.model));

  //Note!: we dont check for actual mongoose model instance to allow
  //anything that has implemented the store contract to
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
  //Note!: If model implement store it will be used than
  //direct mongoose model create static method
  const store = (Model.store || Model.create);
  if (!store && !_.isFunction(store)) {
    let error = new Error('Missing Remove Model Action');
    error.status = 500;
    throw error;
  }


  //2...implement middleware
  function middleware(request, response, next) {

    //2.1.0...obtain request body
    const body = _.merge({}, request.body);

    //2.1.1...create resource(s)
    store(body, function afterShow(error, results) {

      //2.2...handle error or not results
      if (error || !results) {
        //TODO notify error
        //TODO notify no results

        //ensure status
        error.status = error.status || 500;

        //handle error
        if (options.handleError) {

          //prepare error response
          const data = reply(options, error);

          //return response
          response.status(data.status).json(data);

        }

        //continue to error handler middleware
        else {
          next(error);
        }

      }


      //handle results
      else {
        //TODO notify response

        //prepare response status
        const _options = _.merge({}, options, { status: 201 });
        const data = reply(_options, results);

        //return response
        response.status(data.status);

        //TODO set Location header

        //reply with data
        if (data.data) {
          //check for enveloped response support
          const _data = options.envelope ? data : data.data;
          response.json(_data);
        }

        //reply with no data
        else {
          response.json();
        }

      }

    });

  }

  return middleware;

}



exports = module.exports = create;