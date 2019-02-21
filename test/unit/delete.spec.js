'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;
const del = require(path.join(__dirname, '..', '..', 'lib', 'delete'));


describe('unit#delete', () => {

  const DeletableSchema = new Schema({
    name: {
      type: String
    }
  }, {
    timestamps: true
  });

  DeletableSchema.methods.beforeDelete = (done) => {
    done();
  };

  DeletableSchema.methods.afterDelete = (done) => {
    done();
  };

  DeletableSchema.plugin(del);
  const Deletable = mongoose.model('Deletable', DeletableSchema);

  describe('export', () => {

    it('should be a function', () => {
      expect(del).to.be.a('function');
    });

    it('should have name del', () => {
      expect(del.name).to.be.equal('deletePlugin');
    });

    it('should have length of 1', () => {
      expect(del.length).to.be.equal(1);
    });

  });

  describe('instance#del', () => {

    const deletable = new Deletable();

    let remove;
    let del;
    let beforeDelete;
    let afterDelete;

    beforeEach(() => {
      remove = sinon.mock(deletable).expects('remove')
        .yields(null, deletable);
      del = sinon.spy(deletable, 'del');
      beforeDelete = sinon.spy(deletable, 'beforeDelete');
      afterDelete = sinon.spy(deletable, 'afterDelete');
    });

    afterEach(() => {
      sinon.restore();
      del.restore();
      beforeDelete.restore();
      afterDelete.restore();
    });

    it('should be able to delete(remove)', (done) => {
      deletable.del((error, deleted) => {

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


  describe('static#del', () => {

    const deletable = new Deletable();
    const _id = deletable._id;


    let del;

    beforeEach(() => {
      del =
        sinon.mock(Deletable).expects('del').yields(null, deletable);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should be able to delete(remove)', (done) => {
      Deletable.del(_id, (error, deleted) => {
        expect(del).to.have.been.called;
        expect(del).to.have.been.calledOnce;
        expect(del).to.have.been.calledWith(_id);
        done(error, deleted);
      });
    });

  });

});
