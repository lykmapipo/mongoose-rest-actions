'use strict';

/* dependencies */
const _ = require('lodash');
const { include } = require('@lykmapipo/include');
const { ObjectId } = require('@lykmapipo/mongoose-common');
const {
  expect,
  create,
  clear,
  createTestModel
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe('patch', () => {

  const Guardian = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() }
  }, actions);

  const Child = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    father: { type: ObjectId, ref: Guardian.modelName }
  }, actions);

  let father = Guardian.fake();
  let child = Child.fake();
  child.father = father;

  before(done => clear(Guardian, Child, done));

  before(done => create(father, done));

  before(done => create(child, done));

  it('should work using `patch` static method', done => {
    const updates = _.pick(Guardian.fake(), 'name');

    Guardian.patch(father._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(father.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      done(error, updated);
    });
  });

  it('should work with object using `patch` static method', done => {
    const updates = father.fakeOnly('name').toObject();

    Guardian.patch(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(father.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      done(error, updated);
    });
  });

  it('should work with instance using `patch` static method', done => {
    const updates = father.fakeOnly('name');
    Guardian.patch(father._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(father.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      done(error, updated);
    });
  });

  it('should work with instance using `patch` static method', done => {
    const updates = father.fakeOnly('name');
    Guardian.patch(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(father.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      done(error, updated);
    });
  });

  it('should work with refs using `patch` static method', done => {
    const updates = _.pick(Child.fake(), 'name');
    Child.patch(child._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(child.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      expect(updated.father).to.exist;
      done(error, updated);
    });
  });

  it.skip('should work with refs using `patch` static method', done => {
    const updates = Child.fake('name');
    Child.patch(child._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(child.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      expect(updated.father).to.exist;
      expect(updated.father._id).to.exist.and.be.eql(father._id);
      expect(updated.father.name).to.equal(father.name);
      expect(updated.father.email).to.equal(father.email);
      done(error, updated);
    });
  });

  it('should work using `patch` instance method', done => {
    const updates = _.pick(Guardian.fake(), 'name');

    father.patch(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(father.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      done(error, updated);
    });
  });

  it('should work with refs using `patch` instance method', done => {
    const updates = _.pick(Child.fake(), 'name');

    child.patch(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(child.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      expect(updated.father).to.exist;
      expect(updated.father._id).to.exist.and.be.eql(father._id);
      expect(updated.father.name).to.equal(father.name);
      expect(updated.father.email).to.equal(father.email);
      done(error, updated);
    });
  });

  after(done => clear(Guardian, Child, done));

});
