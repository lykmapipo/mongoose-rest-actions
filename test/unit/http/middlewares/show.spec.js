'use strict';


//dependencies
const path = require('path');
const _ = require('lodash');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;
const run = require('express-unit');
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const show = require(path.join(middlewaresPath, 'show'));


describe('show', function () {

  describe('export', function () {

    it('should be a function', function () {
      expect(show).to.be.a('function');
    });

    it('should have name show', function () {
      expect(show.name).to.be.equal('show');
    });

    it('should have length of 1', function () {
      expect(show.length).to.be.equal(1);
    });

  });

  describe('configure', function () {

    it('should throw `Missing Model` if not exists', function () {
      expect(() => { show(); }).to.throw('Missing Model');
    });

    it('should throw `Missing Model` if not exists', function () {
      const model = {};
      expect(() => { show({ model: model }); })
        .to.throw('Missing Remove Model Action');
    });

  });


  describe('Model.findById', function () {

    //prepare schema
    const ShowableSchema = new Schema({
      type: { type: String }
    });
    const modelName = 'Showable' + Date.now();
    const Showable = mongoose.model(modelName, ShowableSchema);
    const showable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocked findById
    let findById;


    beforeEach(function () {
      findById = sinon.mock(Showable)
        .expects('findById')
        .yields(null, showable);
    });

    afterEach(function () {
      findById.restore();
    });

    it('should be able to show', function (done) {

      function setup(request, response, next) {
        request.params = _.merge(request.params, { id: showable._id });
        next();
      }

      run(setup, show({ model: Showable }),
        function (error, request, response) {
          expect(findById).to.have.been.called;
          expect(findById).to.have.been.calledOnce;
          expect(findById).to.have.been.calledWith(showable._id);
          done(error, response);
        });

    });

  });

  describe('Model.show', function () {

    //prepare schema
    const ShowableSchema = new Schema({
      type: { type: String }
    });
    ShowableSchema.statics.show = function (id, done) {
      return this.findById(id, done);
    };
    const modelName = 'Showable' + Date.now();
    const Showable = mongoose.model(modelName, ShowableSchema);
    const showable = {
      _id: new mongoose.Types.ObjectId(),
      type: 'Document'
    };

    //mocke show
    let _show;


    beforeEach(function () {
      _show = sinon.mock(Showable)
        .expects('show')
        .yields(null, showable);
    });

    afterEach(function () {
      _show.restore();
    });

    it('should be able to show', function (done) {

      function setup(request, response, next) {
        request.params = _.merge(request.params, { id: showable._id });
        next();
      }

      run(setup, show({ model: Showable }),
        function (error, request, response) {
          expect(_show).to.have.been.called;
          expect(_show).to.have.been.calledOnce;
          expect(_show).to.have.been.calledWith(showable._id);
          done(error, response);
        });

    });

  });

});