'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;

const rootPath = path.join(__dirname, '..', '..');
const libsPath = path.join(rootPath, 'lib');
const get = require(path.join(libsPath, 'get'));

describe('unit#get', function () {

  const GetableSchema = new Schema({
    name: { type: String }
  });

  GetableSchema.plugin(get);

  const Getable = mongoose.model('Getable', GetableSchema);

  describe('export', function () {
    it('should be a function', function () {
      expect(get).to.be.a('function');
    });

    it('should have name get', function () {
      expect(get.name).to.be.equal('getPlugin');
    });

    it('should have length of 1', function () {
      expect(get.length).to.be.equal(1);
    });
  });


  describe('static#getById', function () {

    const getetable = new Getable();
    const _id = getetable._id;
    let get;

    beforeEach(function () {
      get = sinon.mock(Getable)
        .expects('getById').yields(null, getetable);
    });

    afterEach(function () {
      get.restore();
    });

    it('should be able to getById', function (done) {
      Getable
        .getById(_id, function (error, found) {

          expect(get).to.have.been.called;
          expect(get).to.have.been.calledOnce;
          expect(get).to.have.been.calledWith(_id);

          done(error, found);

        });

    });

  });


  describe('static#get', function () {

    const options = { page: 1, limit: 10, filter: { name: { $regex: /^a/ } } };
    let get;

    beforeEach(function () {
      get =
        sinon.mock(Getable).expects('get').yields(null, {
          data: [new Getable(), new Getable()],
          total: 100,
          size: 10,
          limit: 10,
          skip: 0,
          page: 1,
          pages: 10
        });
    });

    afterEach(function () {
      get.restore();
    });

    it('should be able to getete(remove)', function (done) {
      Getable
        .get(options, function (error, geteted) {

          expect(get).to.have.been.called;
          expect(get).to.have.been.calledOnce;
          expect(get).to.have.been.calledWith(options);

          done(error, geteted);

        });

    });

  });

});