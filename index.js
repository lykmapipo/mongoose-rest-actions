'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');

//common plugins
const mongooseSearch = require('mongoose-regex-search');
const mongooseExist = require('mongoose-exists');
const mongooseAutoset = require('mongoose-autoset');


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
 *  updates._id = request.params.id;
 *
 *  User
 *    .put(updates, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.patch('/users/:id', function(request, response, next) {
 *
 *  let updates = request.body;
 *  updates._id = request.params.id;
 *
 *  User
 *    .patch(updates, function(error, user) {
 *      ...handle error or reply
 *    });
 *
 * });
 *
 *
 * app.delet('/users/:id', function(request, response, next) {
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
  const schemaOptions = _.merge({}, schemaOptns);

  //common plugins
  mongooseSearch(schema, schemaOptions);
  mongooseExist(schema, schemaOptions);
  mongooseAutoset(schema, schemaOptions);

  //rest actions plugin
  del(schema, schemaOptions);
  get(schema, schemaOptions);
  patch(schema, schemaOptions);
  post(schema, schemaOptions);
  put(schema, schemaOptions);

};