'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;
const get = require(path.join(__dirname, '..', '..', 'lib', 'get'));

describe('unit#get', () => {

  const GetableSchema = new Schema({
    name: { type: String }
  });

  GetableSchema.statics.beforeGet = (done) => {
    done();
  };

  GetableSchema.statics.afterGet = (options, results, done) => {
    done();
  };

  GetableSchema.plugin(get);
  const Getable = mongoose.model('Getable', GetableSchema);

  describe('export', () => {

    it('should be a function', () => {
      expect(get).to.be.a('function');
    });

    it('should have name get', () => {
      expect(get.name).to.be.equal('getPlugin');
    });

    it('should have length of 1', () => {
      expect(get.length).to.be.equal(2);
    });

  });


  describe('static#getById', () => {

    const getetable = new Getable();
    const _id = getetable._id;
    let get;

    beforeEach(() => {
      get = sinon.mock(Getable)
        .expects('getById').yields(null, getetable);
    });

    afterEach(() => {
      get.restore();
    });

    it('should be able to getById', (done) => {
      Getable
        .getById(_id, (error, found) => {
          expect(get).to.have.been.called;
          expect(get).to.have.been.calledOnce;
          expect(get).to.have.been.calledWith(_id);
          done(error, found);
        });
    });

  });


  describe('static#get', () => {

    const options =
      ({ page: 1, limit: 10, filter: { name: { $regex: /^a/ } } });
    const results = ({
      data: [new Getable(), new Getable()],
      total: 100,
      size: 10,
      limit: 10,
      skip: 0,
      page: 1,
      pages: 10
    });
    let get;
    let afterGet;

    beforeEach(() => {
      get =
        sinon.mock(Getable).expects('_get').yields(null, results);
      afterGet = sinon.spy(Getable, 'afterGet');
    });

    afterEach(() => {
      get.restore();
      afterGet.restore();
    });

    it('should be able to get', (done) => {
      Getable
        .get(options, (error, got) => {
          expect(get).to.have.been.called;
          expect(get).to.have.been.calledOnce;
          expect(get).to.have.been.calledWith(options);
          expect(afterGet).to.have.been.called;
          expect(afterGet).to.have.been.calledOnce;
          expect(afterGet)
            .to.have.been.calledWith(options, results);
          done(error, got);
        });
    });

  });

});