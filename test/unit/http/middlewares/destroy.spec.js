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
const destroy = require(path.join(middlewaresPath, 'destroy'));


describe('destroy', function () {

  describe('export', function () {

    it('should be a function', function () {
      expect(destroy).to.be.a('function');
    });

    it('should have name destroy', function () {
      expect(destroy.name).to.be.equal('destroy');
    });

    it('should have length of 1', function () {
      expect(destroy.length).to.be.equal(1);
    });

  });

  describe('configure', function () {

    it('should throw `Missing Model` if not exists', function () {
      expect(() => { destroy(); }).to.throw('Missing Model');
    });

    it('should throw `Missing Model` if not exists', function () {
      const model = {};
      expect(() => { destroy({ model: model }); })
        .to.throw('Missing Remove Model Action');
    });

  });


  describe('Model.findByIdAndRemove', function () {

    //prepare schema
    const RemovableSchema = new Schema({
      type: { type: String }
    });
    const modelName = 'Removable' + faker.random.uuid();
    const Removable = mongoose.model(modelName, RemovableSchema);
    const removable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocked findByIdAndRemove
    let remove;


    beforeEach(function () {
      remove = sinon.mock(Removable)
        .expects('findByIdAndRemove')
        .yields(null, removable);
    });

    afterEach(function () {
      remove.restore();
    });

    it('should be able to remove', function (done) {

      function setup(request, response, next) {
        request.params = _.merge(request.params, { id: removable._id });
        next();
      }

      run(setup, destroy({ model: Removable }),
        function (error, request, response) {
          expect(remove).to.have.been.called;
          expect(remove).to.have.been.calledOnce;
          expect(remove).to.have.been.calledWith(removable._id);
          done(error, response);
        });

    });

  });

  describe('Model.findByIdAndDestroy', function () {

    //prepare schema
    const RemovableSchema = new Schema({
      type: { type: String }
    });
    RemovableSchema.statics.findByIdAndDestroy = function (id, done) {
      return this.findByIdAndRemove(id, done);
    };
    const modelName = 'Removable' + faker.random.uuid();
    const Removable = mongoose.model(modelName, RemovableSchema);
    const removable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocked findByIdAndDestroy
    let remove;


    beforeEach(function () {
      remove = sinon.mock(Removable)
        .expects('findByIdAndDestroy')
        .yields(null, removable);
    });

    afterEach(function () {
      remove.restore();
    });

    it('should be able to remove', function (done) {

      function setup(request, response, next) {
        request.params = _.merge(request.params, { id: removable._id });
        next();
      }

      run(setup, destroy({ model: Removable }),
        function (error, request, response) {
          expect(remove).to.have.been.called;
          expect(remove).to.have.been.calledOnce;
          expect(remove).to.have.been.calledWith(removable._id);
          done(error, response);
        });

    });

  });

});