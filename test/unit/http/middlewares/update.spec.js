'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;
const run = require('express-unit');
const faker = require('faker');
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const update = require(path.join(middlewaresPath, 'update'));


describe('update', function() {

  describe('export', function() {

    it('should be a function', function() {
      expect(update).to.be.a('function');
    });

    it('should have name update', function() {
      expect(update.name).to.be.equal('update');
    });

    it('should have length of 1', function() {
      expect(update.length).to.be.equal(1);
    });

  });

  describe('configure', function() {

    it('should throw `Missing Model` if not exists', function() {
      expect(() => { update(); }).to.throw('Missing Model');
    });

    it('should throw `Missing Model` if not exists', function() {
      const model = {};
      expect(() => { update({ model: model }); })
        .to.throw('Missing Remove Model Action');
    });

  });


  describe('Model.findByIdAndUpdate', function() {

    //prepare schema
    const EditableSchema = new Schema({
      type: { type: String }
    });
    const modelName = 'Editable' + faker.random.uuid();
    const Editable = mongoose.model(modelName, EditableSchema);
    const editable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocked findByIdAndUpdate
    let findByIdAndUpdate;


    beforeEach(function() {
      findByIdAndUpdate = sinon.mock(Editable)
        .expects('findByIdAndUpdate')
        .yields(null, editable);
    });

    afterEach(function() {
      findByIdAndUpdate.restore();
    });

    it('should be able to create', function(done) {

      function setup(request, response, next) {
        request.body = _.merge(request.body, editable);
        request.params = _.merge(request.params, { id: editable._id });
        next();
      }

      run(setup, update({ model: Editable }),
        function(error, request, response) {
          expect(findByIdAndUpdate).to.have.been.called;
          expect(findByIdAndUpdate).to.have.been.calledOnce;
          expect(findByIdAndUpdate)
            .to.have.been.calledWith(editable._id, editable);
          done(error, response);
        });

    });

  });

  describe('Model.edit', function() {

    //prepare schema
    const EditableSchema = new Schema({
      type: { type: String }
    });
    EditableSchema.statics.edit = function() {
      return this.findByIdAndUpdate.apply(this, arguments);
    };
    const modelName = 'Editable' + faker.random.uuid();
    const Editable = mongoose.model(modelName, EditableSchema);
    const editable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocke edit
    let edit;


    beforeEach(function() {
      edit = sinon.mock(Editable)
        .expects('edit')
        .yields(null, editable);
    });

    afterEach(function() {
      edit.restore();
    });

    it('should be able to create', function(done) {

      function setup(request, response, next) {
        request.body = _.merge(request.body, editable);
        request.params = _.merge(request.params, { id: editable._id });
        next();
      }

      run(setup, update({ model: Editable }),
        function(error, request, response) {
          expect(edit).to.have.been.called;
          expect(edit).to.have.been.calledOnce;
          expect(edit)
            .to.have.been.calledWith(editable._id, editable);
          done(error, response);
        });

    });

  });

});