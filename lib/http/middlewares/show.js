'use strict';


//TODO populate  ref
//TODO fields or select
//TODO expose sub schema
//TODO expose sub resources
//TODO support envelope with model name


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

  //if delete should return response body
  supportContent: true,

  //if wrapping response in object envelope is allowed
  envelope: false,

  //if to dump whole error
  production: (process.ENV === 'production')

};



/**
 * @name destroy
 * @description factory to create show middleware for mongoose rest actions
 *              and resources.
 * @param  {Object} optns show factory options
 * @param  {Object} [optns.mongoose] valid instance of mongoose
 * @return {Function}     http middleware to be used for accessing single 
 *                        resource
 * @version 0.1.0 
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com> 
 * @author lally elias<https://github.com/lykmapipo>
 * @public
 * @see {@link http://jsonapi.org/format/#fetching-resources} 
 * 
 * @example
 * 
 * 1. As standalone middleware
 * const remove = require('mongoose-rest-actions').show();
 * app.get('/users/:id', show);
 *
 * 
 * 2. With resource router from rest actions
 * const resource = require('mongoose-rest-actions').resource;
 * app.use(resource({model: 'User'}));
 * 
 */
function show(optns) {

  //1...ensure options
  const options = _.merge({}, defaults, optns);

  //1.1...reset dependencies
  mongoose = (options.mongoose || mongoose);

  //1.2...obtain required options
  const isModelInstance = (options.model && !_.isString(options.model));

  //Note!: we dont check for actual mongoose model instance to allow
  //anything that has implemented the show contract to
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
  //Note!: If model implement show it will be used than
  //direct mongoose model findById static method
  const get = (Model.show || Model.findById);
  if (!get && !_.isFunction(get)) {
    let error = new Error('Missing Remove Model Action');
    error.status = 500;
    throw error;
  }


  //2...implement middleware
  function middleware(request, response, next) {

    //2.1.0...obtain request params and query parameters
    const params = _.merge({}, request.params);
    const query = _.merge({}, request.query);

    //2.1.2...obtain resource _id
    const _id = (params.id || params._id) || (query.id || query._id);

    //TODO pass additional options on show or findById
    //2.1.3...show resource(s)
    get(_id, function afterShow(error, results) {

      //2.2...handle error or not results
      if (error || !results) {
        //TODO notify error
        //TODO notify no results

        //ensure content exists
        if (!error && !results) {
          error = new Error('Not Found');
          error.status = 404;
        }

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
        const data = reply(options, results);

        //return response
        response.status(data.status);

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



exports = module.exports = show;