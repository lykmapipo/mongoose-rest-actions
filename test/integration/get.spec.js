'use strict';

/* dependencies */
const _ = require('lodash');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { ObjectId } = require('@lykmapipo/mongoose-common');
const {
  create,
  clear,
  createTestModel
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe('get', () => {

  const Guardian = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    age: { type: Number, min: 30, fake: true },
  }, actions);

  const Child = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    age: { type: Number, min: 3, fake: true },
    father: { type: ObjectId, ref: Guardian.modelName }
  }, actions);

  let father = Guardian.fake();
  let children = _.map(Child.fake(32), child => {
    child.father = father;
    return child;
  });

  before(done => clear(Guardian, Child, done));

  before(done => create(father, done));

  before(done => create(...children, done));

  it('should work with no options using `get` static method', done => {
    Child.get((error, results) => {
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
      expect(_.maxBy(results.data, 'updatedAt').updatedAt)
        .to.be.at.most(results.lastModified);
      done(error, results);
    });
  });

  it('should work with page and limit using `get` static method', done => {
    const options = { page: 1, limit: 20 };
    Child.get(options, (error, results) => {
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
      expect(_.maxBy(results.data, 'updatedAt').updatedAt)
        .to.be.at.most(results.lastModified);
      done(error, results);
    });
  });

  it('should work with search using `get` static method', done => {
    const options = { filter: { q: children[0].name } };
    Child.get(options, (error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      expect(results.data).to.exist;
      expect(results.data).to.have.length.at.least(1);
      expect(results.total).to.exist;
      expect(results.total).to.be.at.least(1);
      expect(results.limit).to.exist;
      expect(results.limit).to.be.equal(10);
      expect(results.skip).to.exist;
      expect(results.skip).to.be.equal(0);
      expect(results.page).to.exist;
      expect(results.page).to.be.equal(1);
      expect(results.pages).to.exist;
      expect(results.pages).to.be.equal(1);
      expect(results.lastModified).to.exist;
      expect(_.maxBy(results.data, 'updatedAt').updatedAt)
        .to.be.at.most(results.lastModified);
      done(error, results);
    });
  });

  it('should work with filter using `get` static method', done => {
    const options = { filter: { age: children[0].age } };
    Child.get(options, (error, results) => {
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
      expect(_.maxBy(results.data, 'updatedAt').updatedAt)
        .to.be.at.most(results.lastModified);
      done(error, results);
    });
  });

  it('should work with filter and search using `get` static method', done => {
    const options = {
      filter: {
        q: children[0].name,
        age: { $eq: children[0].age }
      }
    };
    Child.get(options, (error, results) => {
      expect(error).to.not.exist;
      expect(results).to.exist;
      expect(results.data).to.exist;
      expect(results.data).to.have.length.at.least(1);
      expect(results.total).to.exist;
      expect(results.total).to.be.at.least(1);
      expect(results.limit).to.exist;
      expect(results.limit).to.be.equal(10);
      expect(results.skip).to.exist;
      expect(results.skip).to.be.equal(0);
      expect(results.page).to.exist;
      expect(results.page).to.be.equal(1);
      expect(results.pages).to.exist;
      expect(results.pages).to.be.equal(1);
      expect(results.lastModified).to.exist;
      expect(_.maxBy(results.data, 'updatedAt').updatedAt)
        .to.be.at.most(results.lastModified);
      done(error, results);
    });
  });

  it('should fail using `get` static method with invalid projections', done => {
    const options = { select: { name: 1, age: 0 } };
    Child.get(options, (error, results) => {
      expect(error).to.exist;
      expect(results).to.not.exist;
      expect(error.status).to.be.equal(400);
      expect(error.name).to.be.equal('MongoError');
      expect(error.message)
        .to.be.equal(
          'Projection cannot have a mix of inclusion and exclusion.'
        );
      done();
    });
  });

  it('should work with headers using `fresh` static method', done => {
    const lastModified = _.maxBy(children, 'updatedAt').updatedAt;
    const options = { headers: { ifModifiedSince: lastModified } };
    Child.fresh(options, (error, results) => {
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
      expect(results.pages).to.be.equal(0);
      expect(results.lastModified).to.exist;
      expect(results.lastModified).to.be.eql(lastModified);
      done(error, results);
    });
  });

  after(done => clear(Guardian, Child, done));

});
