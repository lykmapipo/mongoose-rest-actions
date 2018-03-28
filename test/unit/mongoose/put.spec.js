'use strict';


//dependencies
const path = require('path');
const faker = require('faker');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;

const rootPath = path.join(__dirname, '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const pluginsPath = path.join(libsPath, 'mongoose');
const put = require(path.join(pluginsPath, 'put'));

describe('put plugin', function () {

  const PutableSchema = new Schema({
    name: { type: String }
  });

  PutableSchema.methods.beforePut = function (updates, done) {
    done();
  };

  PutableSchema.methods.afterPut = function (updates, done) {
    done();
  };

  PutableSchema.plugin(put);

  const Putable = mongoose.model('Putable', PutableSchema);

  describe('export', function () {
    it('should be a function', function () {
      expect(put).to.be.a('function');
    });

    it('should have name put', function () {
      expect(put.name).to.be.equal('putPlugin');
    });

    it('should have length of 1', function () {
      expect(put.length).to.be.equal(1);
    });
  });

  describe('instance#put', function () {

    const updates = { name: faker.name.firstName() };
    const putable = new Putable({ name: faker.name.firstName() });

    let save;
    let put;
    let beforePut;
    let afterPut;

    beforeEach(function () {
      save =
        sinon.mock(putable).expects('save').yields(null, putable);
      put = sinon.spy(putable, 'put');
      beforePut = sinon.spy(putable, 'beforePut');
      afterPut = sinon.spy(putable, 'afterPut');
    });

    afterEach(function () {
      save.restore();
      put.restore();
      beforePut.restore();
      afterPut.restore();
    });

    it('should be able to put(update)', function (done) {
      putable.put(updates, function (error, updated) {

        expect(beforePut).to.have.been.called;
        expect(beforePut).to.have.been.calledOnce;
        expect(beforePut).to.have.been.calledWith(updates);

        expect(save).to.have.been.called;
        expect(save).to.have.been.calledOnce;

        expect(put).to.have.been.called;
        expect(put).to.have.been.calledOnce;
        expect(put).to.have.been.calledWith(updates);


        expect(afterPut).to.have.been.called;
        expect(afterPut).to.have.been.calledOnce;
        expect(afterPut).to.have.been.calledWith(updates);

        done(error, updated);

      });

    });

  });


  describe('static#put', function () {

    const updates = {
      _id: new mongoose.Types.ObjectId(),
      name: faker.name.firstName()
    };
    const putable = new Putable(updates);

    let put;

    beforeEach(function () {
      put =
        sinon.mock(Putable).expects('put').yields(null, putable);
    });

    afterEach(function () {
      put.restore();
    });

    it('should be able to put(update)', function (done) {
      Putable
        .put(updates, function (error, updated) {

          expect(put).to.have.been.called;
          expect(put).to.have.been.calledOnce;
          expect(put).to.have.been.calledWith(updates);

          done(error, updated);

        });

    });

  });

});