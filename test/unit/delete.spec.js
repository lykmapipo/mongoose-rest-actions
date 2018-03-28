'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;

const rootPath = path.join(__dirname, '..', '..');
const libsPath = path.join(rootPath, 'lib');
const del = require(path.join(libsPath, 'delete'));

describe('delete plugin', function () {

  const DeletableSchema = new Schema({
    name: { type: String }
  });

  DeletableSchema.methods.beforeDelete = function (done) {
    done();
  };

  DeletableSchema.methods.afterDelete = function (done) {
    done();
  };

  DeletableSchema.plugin(del);

  const Deletable = mongoose.model('Deletable', DeletableSchema);

  describe('export', function () {
    it('should be a function', function () {
      expect(del).to.be.a('function');
    });

    it('should have name del', function () {
      expect(del.name).to.be.equal('deletePlugin');
    });

    it('should have length of 1', function () {
      expect(del.length).to.be.equal(1);
    });
  });

  describe('instance#del', function () {

    const deletable = new Deletable();

    let remove;
    let del;
    let beforeDelete;
    let afterDelete;

    beforeEach(function () {
      remove =
        sinon.mock(deletable).expects('remove').yields(null,
          deletable);
      del = sinon.spy(deletable, 'del');
      beforeDelete = sinon.spy(deletable, 'beforeDelete');
      afterDelete = sinon.spy(deletable, 'afterDelete');
    });

    afterEach(function () {
      remove.restore();
      del.restore();
      beforeDelete.restore();
      afterDelete.restore();
    });

    it('should be able to delete(remove)', function (done) {
      deletable.del(function (error, deleted) {

        expect(beforeDelete).to.have.been.called;
        expect(beforeDelete).to.have.been.calledOnce;

        expect(remove).to.have.been.called;
        expect(remove).to.have.been.calledOnce;

        expect(del).to.have.been.called;
        expect(del).to.have.been.calledOnce;

        expect(afterDelete).to.have.been.called;
        expect(afterDelete).to.have.been.calledOnce;

        done(error, deleted);

      });

    });

  });


  describe('static#del', function () {

    const deletable = new Deletable();
    const _id = deletable._id;

    let del;

    beforeEach(function () {
      del =
        sinon.mock(Deletable).expects('del').yields(null,
          deletable);
    });

    afterEach(function () {
      del.restore();
    });

    it('should be able to delete(remove)', function (done) {
      Deletable
        .del(_id, function (error, deleted) {

          expect(del).to.have.been.called;
          expect(del).to.have.been.calledOnce;
          expect(del).to.have.been.calledWith(_id);

          done(error, deleted);

        });

    });

  });

});