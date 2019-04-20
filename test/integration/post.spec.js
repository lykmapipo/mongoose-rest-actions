'use strict';

/* dependencies */
const _ = require('lodash');
const { waterfall } = require('async');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { ObjectId } = require('@lykmapipo/mongoose-common');
const {
  create,
  clear,
  createTestModel
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe('post', () => {

  const Guardian = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() }
  }, actions);

  const Child = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    father: { type: ObjectId, ref: Guardian.modelName }
  }, actions);

  let father = Guardian.fake();

  before(done => clear(Guardian, Child, done));

  before(done => create(father, done));

  it('should work using `post` static method', done => {
    const guardian = Guardian.fake();
    Guardian.post(guardian.toObject(), (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist.and.be.eql(guardian._id);
      expect(created.name).to.equal(guardian.name);
      expect(created.email).to.equal(guardian.email);
      expect(created.createdAt).to.exist;
      expect(created.updatedAt).to.exist;
      done(error, created);
    });
  });

  it('should work with instance using `post` static method', done => {
    const guardian = Guardian.fake();
    Guardian.post(guardian, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist.and.be.eql(guardian._id);
      expect(created.name).to.equal(guardian.name);
      expect(created.email).to.equal(guardian.email);
      expect(created.createdAt).to.exist;
      expect(created.updatedAt).to.exist;
      done(error, created);
    });
  });

  it('should work with refs using `post` static method', done => {
    const child = Child.fake();
    child.father = father;
    Child.post(child, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist.and.be.eql(child._id);
      expect(created.name).to.equal(child.name);
      expect(created.email).to.equal(child.email);
      expect(created.createdAt).to.exist;
      expect(created.updatedAt).to.exist;
      expect(created.father).to.exist;
      expect(created.father._id).to.exist.and.be.eql(father._id);
      expect(created.father.name).to.equal(father.name);
      expect(created.father.email).to.equal(father.email);
      done(error, created);
    });
  });

  it('should work using `post` instance method', done => {
    const guardian = Guardian.fake();
    guardian.post((error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist.and.be.eql(guardian._id);
      expect(created.name).to.equal(guardian.name);
      expect(created.email).to.equal(guardian.email);
      expect(created.createdAt).to.exist;
      expect(created.updatedAt).to.exist;
      done(error, created);
    });
  });

  it('should work with refs using `post` instance method', done => {
    const child = Child.fake();
    child.father = father;
    child.post((error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist.and.be.eql(child._id);
      expect(created.name).to.equal(child.name);
      expect(created.email).to.equal(child.email);
      expect(created.createdAt).to.exist;
      expect(created.updatedAt).to.exist;
      expect(created.father).to.exist;
      expect(created.father._id).to.exist.and.be.eql(father._id);
      expect(created.father.name).to.equal(father.name);
      expect(created.father.email).to.equal(father.email);
      done(error, created);
    });
  });

  it('should beautify unique error using `post` static method', done => {
    const guardian = _.pick(Guardian.fake(), 'name', 'email');

    waterfall([
      next => Guardian.post(guardian, error => next(error)),
      next => Guardian.post(guardian, error => next(error)),
    ], error => {
      expect(error).to.exist;
      expect(error.status).to.exist;
      expect(error.name).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.message).to.exist;
      expect(error.errors).to.exist;
      expect(error.errors.email).to.exist;
      expect(error.errors.email.kind).to.exist;
      expect(error.errors.email.kind).to.be.equal('unique');
      expect(error.errors.email.value).to.be.equal(guardian.email);
      done();
    });
  });

  it('should beautify unique error using `post` instance method', done => {
    const guardian = _.pick(Guardian.fake(), 'name', 'email');

    waterfall([
      next => new Guardian(guardian).post(error => next(error)),
      next => new Guardian(guardian).post(error => next(error)),
    ], error => {
      expect(error).to.exist;
      expect(error.status).to.exist;
      expect(error.name).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error.message).to.exist;
      expect(error.errors).to.exist;
      expect(error.errors.email).to.exist;
      expect(error.errors.email.kind).to.exist;
      expect(error.errors.email.kind).to.be.equal('unique');
      expect(error.errors.email.value).to.be.equal(guardian.email);
      done();
    });
  });

  before(done => clear(Guardian, Child, done));

});
