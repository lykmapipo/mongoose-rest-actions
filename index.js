'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');

//common plugins
const fake = require('@lykmapipo/mongoose-faker');
const search = require('mongoose-regex-search');
const exist = require('mongoose-exists');
const autoset = require('mongoose-autoset');
const beautifyUnique = require('mongoose-beautiful-unique-validation');


//rest actions plugin
const del = require(path.join(__dirname, 'lib', 'delete'));
const get = require(path.join(__dirname, 'lib', 'get'));
const patch = require(path.join(__dirname, 'lib', 'patch'));
const post = require(path.join(__dirname, 'lib', 'post'));
const put = require(path.join(__dirname, 'lib', 'put'));


/**
 * @module mongoose-rest-actions
 * @name restActions
 * @function restActions
 * @description mongoose schema plugins to support http verb(s)
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid delete plugin options
 * @param {String} [schemaOptns.root] a field name to use to hold results.
 *                                    default to `data`
 * @version 0.1.0 
 * @since 0.1.0
 * @author lally elias<lallyelias87@gmail.com> 
 * @example
 * 
 * const express = require('express');
 * const mongoose = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 * mongoose.plugin(actions);
 *
 * //... register & load mongoose models
 *
 * mongoose.connect('<url>');
 *
 *
 * const app = express();
 * const User = mongoose.model('User');
 *
 * app.get('/users', function(request, response, next) {
 *
 *  cost options = { page: request.query.page };
 *
 *  User
 *    .get(options, function(error, results) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.post('/users', function(request, response, next) {
 *
 *  cost body = request.body;
 *
 *  User
 *    .post(body, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.get('/users/:id', function(request, response, next) {
 *
 *  cost _id = request.params.id;
 *
 *  User
 *    .getById(_id, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.put('/users/:id', function(request, response, next) {
 *
 *  let updates = request.body;
 *  const _id = request.params.id;
 *
 *  User
 *    .put(_id, updates, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.patch('/users/:id', function(request, response, next) {
 *
 *  let updates = request.body;
 *  const _id = request.params.id;
 *
 *  User
 *    .patch(_id, updates, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.delete('/users/:id', function(request, response, next) {
 *
 *  const _id = request.params.id;
 *
 *  User
 *    .del(_id, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *...
 * 
 */
module.exports = exports = function restActions(schema, schemaOptns) {

  //normalize options
  const schemaOptions = _.merge({}, { root: 'data' }, schemaOptns);

  //ensure indexed timestamps fields
  //currently mongoose does not index them
  //see https://github.com/Automattic/mongoose/blob/master/lib/schema.js#L758
  const hasTimeStamps = _.get(schema, 'options.timestamps', false);
  if (hasTimeStamps) {

    //obtain timestamps paths
    const createdAtField =
      (_.isBoolean(hasTimeStamps) ? 'createdAt' : hasTimeStamps.createdAt);

    const updatedAtField =
      (_.isBoolean(hasTimeStamps) ? 'updatedAt' : hasTimeStamps.updatedAt);


    //ensure index on create timestamp path if not exists
    if (schema.paths[createdAtField]) {
      schema.paths[createdAtField].options.index = true;
      schema.index({
        [createdAtField]: 1
      });
    }

    //ensure index on update timestamp path if not exists
    if (schema.paths[updatedAtField]) {
      schema.paths[updatedAtField].options.index = true;
      schema.index({
        [updatedAtField]: 1
      });
    }

  }


  //common plugins
  fake(schema, schemaOptions);
  search(schema, schemaOptions);
  exist(schema, schemaOptions);
  autoset(schema, schemaOptions);
  beautifyUnique(schema, schemaOptions);

  //rest actions plugin
  del(schema, schemaOptions);
  get(schema, schemaOptions);
  patch(schema, schemaOptions);
  post(schema, schemaOptions);
  put(schema, schemaOptions);

};