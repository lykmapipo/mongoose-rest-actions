'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const async = require('async');
const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = chai.expect;
const actions = require(path.join(__dirname, '..', '..'));

describe('integration#get', function () {

  mongoose.plugin(actions);

  const modelName = 'GetableIntegration';
  const User = mongoose.model(modelName, new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }, { timestamps: { createdAt: 'getCreatedAt', updatedAt: 'getUpdatedAt' } }));

  const father = { name: faker.name.firstName(), age: 58, year: 1960 };
  const mother = { name: faker.name.firstName(), age: 48, year: 1970 };
  const kids = _.map(_.range(1, 31), (age) => {
    return { name: faker.name.firstName(), age: age, year: 1980 + age };
  });

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-rest-actions', done);
  });

  before(function (done) {
    User.remove(done);
  });

  //seed userh
  before(function (done) {
    async.waterfall([
      function (next) {
        async.parallel({
          mother: function (next) {
            User.create(mother, next);
          },
          father: function (next) {
            User.create(father, next);
          }
        }, next);
      },
      function (parents, next) {
        User
          .create(
            _.map(kids, (kid) => { return _.merge({}, kid, parents); }),
            next
          );
      }
    ], done);

  });


  it('should be able to get without options', function (done) {

    User
      .get(function (error, results) {
        expect(error).to.not.exist;
        expect(results).to.exist;
        expect(results.data).to.exist;
        expect(results.data).to.have.length(10);
        expect(results.total).to.exist;
        expect(results.total).to.be.equal(32);
        expect(results.limit).to.exist;
        expect(results.limit).to.be.equal(10);
        expect(results.skip).to.exist;
        expect(results.skip).to.be.equal(0);
        expect(results.page).to.exist;
        expect(results.page).to.be.equal(1);
        expect(results.pages).to.exist;
        expect(results.pages).to.be.equal(4);
        expect(results.lastModified).to.exist;
        expect(_.maxBy(results.data, 'getUpdatedAt').getUpdatedAt)
          .to.be.at.most(results.lastModified);
        done(error, results);
      });

  });

  it('should be able to get with options', function (done) {

    const options = { page: 1, limit: 20 };
    User
      .get(options, function (error, results) {
        expect(error).to.not.exist;
        expect(results).to.exist;
        expect(results.data).to.exist;
        expect(results.data).to.have.length(20);
        expect(results.total).to.exist;
        expect(results.total).to.be.equal(32);
        expect(results.limit).to.exist;
        expect(results.limit).to.be.equal(20);
        expect(results.skip).to.exist;
        expect(results.skip).to.be.equal(0);
        expect(results.page).to.exist;
        expect(results.page).to.be.equal(1);
        expect(results.pages).to.exist;
        expect(results.pages).to.be.equal(2);
        expect(results.lastModified).to.exist;
        expect(_.maxBy(results.data, 'getUpdatedAt').getUpdatedAt)
          .to.be.at.most(results.lastModified);
        done(error, results);
      });

  });


  it('should be able to search with options', function (done) {

    const options = { filter: { q: father.name } };
    User
      .get(options, function (error, results) {
        expect(error).to.not.exist;
        expect(results).to.exist;
        expect(results.data).to.exist;
        expect(results.data).to.have.length(1);
        expect(results.total).to.exist;
        expect(results.total).to.be.equal(1);
        expect(results.limit).to.exist;
        expect(results.limit).to.be.equal(10);
        expect(results.skip).to.exist;
        expect(results.skip).to.be.equal(0);
        expect(results.page).to.exist;
        expect(results.page).to.be.equal(1);
        expect(results.pages).to.exist;
        expect(results.pages).to.be.equal(1);
        expect(results.lastModified).to.exist;
        expect(_.maxBy(results.data, 'getUpdatedAt').getUpdatedAt)
          .to.be.at.most(results.lastModified);
        done(error, results);
      });

  });


  it('should parse filter options', function (done) {
    const options = { filter: { age: 10 } };
    User
      .get(options, function (error, results) {
        expect(error).to.not.exist;
        expect(results).to.exist;
        expect(results.data).to.exist;
        expect(results.data).to.have.length(1);
        expect(results.total).to.exist;
        expect(results.total).to.be.equal(1);
        expect(results.limit).to.exist;
        expect(results.limit).to.be.equal(10);
        expect(results.skip).to.exist;
        expect(results.skip).to.be.equal(0);
        expect(results.page).to.exist;
        expect(results.page).to.be.equal(1);
        expect(results.pages).to.exist;
        expect(results.pages).to.be.equal(1);
        expect(results.lastModified).to.exist;
        expect(_.maxBy(results.data, 'getUpdatedAt').getUpdatedAt)
          .to.be.at.most(results.lastModified);
        done(error, results);
      });

  });

  describe('headers', function () {
    let lastModified;

    beforeEach(function (done) {
      User
        .findOne({}, { getUpdatedAt: 1 })
        .sort({ getUpdatedAt: -1 })
        .exec(function (error, latest) {
          lastModified = latest;
          done(error, latest);
        });
    });

    it('should be able to get only latest modified', function (done) {

      const options =
        ({ headers: { ifModifiedSince: lastModified.getUpdatedAt } });

      User
        .get(options, function (error, results) {
          expect(error).to.not.exist;
          expect(results).to.exist;
          expect(results.data).to.exist;
          expect(results.data).to.have.length(0);
          expect(results.total).to.exist;
          expect(results.total).to.be.equal(0);
          expect(results.limit).to.exist;
          expect(results.limit).to.be.equal(10);
          expect(results.skip).to.exist;
          expect(results.skip).to.be.equal(0);
          expect(results.page).to.exist;
          expect(results.page).to.be.equal(1);
          expect(results.pages).to.exist;
          expect(results.pages).to.be.equal(1);
          expect(results.lastModified).to.exist;
          expect(results.lastModified)
            .to.be.eql(lastModified.getUpdatedAt);
          done(error, results);
        });

    });

  });


  after(function (done) {
    User.remove(done);
  });

});