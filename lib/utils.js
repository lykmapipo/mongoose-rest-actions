'use strict';



//global dependencies(or imports)
const _ = require('lodash');
const copyError = require('utils-copy-error');



/**
 * @name reply
 * @param  {Object} _options valid options for destroy action
 * @param  {Error} _error model destroy error
 * @param  {Object} _results model destroy results
 * @return {Object} response object to be used to compose http response
 * @version 0.1.0
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com> 
 * @author lally elias<https://github.com/lykmapipo>
 * @private
 */
exports.reply = function reply(_options, _error, _results) {

  //1.1...normalize arguments
  const options = _.merge({}, _options);
  let error = _.isError(_error) ? copyError(_error) : _.cloneDeep(_error);
  let results = _.cloneDeep(_results);

  //1.2...ensure error
  if (error && !_.isError(error)) {
    error = results;
    results = undefined;
  }

  //1.3...prepare response
  let response = {};

  //2...handle error response
  if (error && _.isError) {

    //2.1...ensure status
    error.status = error.status || 500;

    //2.2...prepare error response
    //see http://jsonapi.org/format/#errors-processing
    response.status = error.status || 500;
    response.code = error.code || 500;
    response.title = error.name || error.message;
    response.description = error.message || error.name;

    //include error stacktrace if not production
    if (!options.production) {
      response.error = error;
    }

  }

  //3..handle success response

  //3.1...handle response with content
  //see http://jsonapi.org/format/#crud-deleting-responses-200
  if (options.supportContent && !options.background && results) {
    response.success = true;
    response.status = options.status || 200;
    response.data = results;
  }

  //3.2..handle response run in background
  //see http://jsonapi.org/format/#crud-deleting-responses-202
  else if (options.background && !results) {
    response.status = options.status || 202;
    response.data = undefined;
  }

  //3.2...handle response with no content
  //see http://jsonapi.org/format/#crud-deleting-responses-204 
  else {
    response.status = 204;
    response.data = undefined;
  }

  //return response
  return response;

};