'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const faker = require('faker');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;
const run = require('express-unit');
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const create = require(path.join(middlewaresPath, 'create'));


describe('create', function () {

  describe('export', function () {

    it('should be a function', function () {
      expect(create).to.be.a('function');
    });

    it('should have name create', function () {
      expect(create.name).to.be.equal('create');
    });

    it('should have length of 1', function () {
      expect(create.length).to.be.equal(1);
    });

  });

  describe('configure', function () {

    it('should throw `Missing Model` if not exists', function () {
      expect(() => { create(); }).to.throw('Missing Model');
    });

    it('should throw `Missing Model` if not exists', function () {
      const model = {};
      expect(() => { create({ model: model }); })
        .to.throw('Missing Remove Model Action');
    });

  });


  describe('Model.create', function () {

    //prepare schema
    const CreatableSchema = new Schema({
      type: { type: String }
    });
    const modelName = 'Creatable' + faker.random.uuid();
    const Creatable = mongoose.model(modelName, CreatableSchema);
    const creatable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocked create
    let _create;


    beforeEach(function () {
      _create = sinon.mock(Creatable)
        .expects('create')
        .yields(null, creatable);
    });

    afterEach(function () {
      _create.restore();
    });

    it('should be able to create', function (done) {

      function setup(request, response, next) {
        request.body = _.merge(request.body, creatable);
        next();
      }

      run(setup, create({ model: Creatable }),
        function (error, request, response) {
          expect(_create).to.have.been.called;
          expect(_create).to.have.been.calledOnce;
          expect(_create).to.have.been.calledWith(creatable);
          done(error, response);
        });

    });

  });

  describe('Model.store', function () {

    //prepare schema
    const CreatableSchema = new Schema({
      type: { type: String }
    });
    CreatableSchema.statics.store = function (object, done) {
      return this.create(object, done);
    };
    const modelName = 'Creatable' + faker.random.uuid();
    const Creatable = mongoose.model(modelName, CreatableSchema);
    const creatable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocke store
    let store;


    beforeEach(function () {
      store = sinon.mock(Creatable)
        .expects('store')
        .yields(null, creatable);
    });

    afterEach(function () {
      store.restore();
    });

    it('should be able to create', function (done) {

      function setup(request, response, next) {
        request.body = _.merge(request.body, creatable);
        next();
      }

      run(setup, create({ model: Creatable }),
        function (error, request, response) {
          expect(store).to.have.been.called;
          expect(store).to.have.been.calledOnce;
          expect(store).to.have.been.calledWith(creatable);
          done(error, response);
        });

    });

  });

});