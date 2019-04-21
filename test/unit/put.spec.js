'use strict';


//dependencies
const path = require('path');
const faker = require('faker');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { sinon, expect } = require('@lykmapipo/mongoose-test-helpers');

const rootPath = path.join(__dirname, '..', '..');
const libsPath = path.join(rootPath, 'lib');
const put = require(path.join(libsPath, 'put'));

describe('unit#put', () => {

  const PutableSchema = new Schema({
    name: {
      type: String
    }
  });

  PutableSchema.methods.beforePut = (updates, done) => {
    done();
  };

  PutableSchema.methods.afterPut = (updates, done) => {
    done();
  };

  PutableSchema.plugin(put);

  const Putable = mongoose.model('Putable', PutableSchema);

  describe('export', () => {
    it('should be a function', () => {
      expect(put).to.be.a('function');
    });

    it('should have name put', () => {
      expect(put.name).to.be.equal('putPlugin');
    });

    it('should have length of 1', () => {
      expect(put.length).to.be.equal(1);
    });
  });

  describe('instance#put', () => {

    const updates = {
      name: faker.name.firstName()
    };
    const putable = new Putable({
      name: faker.name.firstName()
    });

    let save;
    let put;
    let beforePut;
    let afterPut;

    beforeEach(() => {
      save =
        sinon.mock(putable).expects('save').yields(null, putable);
      put = sinon.spy(putable, 'put');
      beforePut = sinon.spy(putable, 'beforePut');
      afterPut = sinon.spy(putable, 'afterPut');
    });

    afterEach(() => {
      put.restore();
      beforePut.restore();
      afterPut.restore();
      sinon.restore();
    });

    it('should be able to put(update)', (done) => {
      putable.put(updates, (error, updated) => {

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


  describe('static#put', () => {

    const updates = {
      _id: new mongoose.Types.ObjectId(),
      name: faker.name.firstName()
    };
    const putable = new Putable(updates);

    let put;

    beforeEach(() => {
      put =
        sinon.mock(Putable).expects('put').yields(null, putable);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should be able to put(update)', (done) => {
      Putable
        .put(updates, (error, updated) => {

          expect(put).to.have.been.called;
          expect(put).to.have.been.calledOnce;
          expect(put).to.have.been.calledWith(updates);

          done(error, updated);

        });

    });

  });

});
