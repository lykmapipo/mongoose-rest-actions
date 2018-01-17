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
const destroy = require(path.join(middlewaresPath, 'destroy'));



describe.only('destroy', function() {

  describe('export', function() {

    it('should be a function', function() {
      expect(destroy).to.be.a('function');
    });

    it('should have name destroy', function() {
      expect(destroy.name).to.be.equal('destroy');
    });

    it('should have length of 1', function() {
      expect(destroy.length).to.be.equal(1);
    });

  });

  describe('configure', function() {

    it('should throw `Missing Model` if not exists', function() {
      expect(() => { destroy(); }).to.throw('Missing Model');
    });

    it('should throw `Missing Model` if not exists', function() {
      const model = {};
      expect(() => { destroy({ model: model }); })
        .to.throw('Missing Remove Model Action');
    });

  });

  describe('Use Model.findByIdAndDestroy', function() {

  });


  describe('Use Model.findByIdAndRemove', function() {

    //prepare schema
    const Removable = mongoose.model('Removable', new Schema({
      name: { type: String }
    }));

    //mock remove
    const _id = new mongoose.Types.ObjectId();
    const remove = sinon.mock(Removable)
      .expects('findByIdAndRemove')
      .yields(null, { _id: _id, name: 'Name' });

    it('should be able to remove', function(done) {

      function setup(request, response, next) {
        request.params = _.merge(request.params, { id: _id });
        next();
      }

      run(setup, destroy({ model: Removable }),
        function(error, request, response) {
          expect(remove).to.have.been.called;
          expect(remove).to.have.been.calledOnce;
          expect(remove).to.have.been.calledWith(_id);
          // expect(remove).to.have.always.returned({ _id: 1, name: 'Name' });
          done(error, response);
        });

    });

  });

});