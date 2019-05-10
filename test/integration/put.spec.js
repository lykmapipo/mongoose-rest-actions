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

describe.only('static put', () => {

  const Guardian = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() }
  }, actions);

  const Child = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    father: { type: ObjectId, ref: Guardian.modelName }
  }, actions);

  let father;
  let child;

  beforeEach(done => clear(Guardian, Child, done));

  beforeEach(done => {
    father = Guardian.fake();
    child = Child.fake();
    child.father = father;

    create(father, child, (error, created) => {
      father = _.first(created);
      child = _.last(created);
      done(error, created);
    });
  });

  it('should work with id and object as updates', done => {
    const updates = _.pick(Guardian.fake(), 'name');
    Guardian.put(father._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work with object as updates', done => {
    const updates = father.fakeOnly('name').toObject();
    Guardian.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work with id and instance as updates', done => {
    const updates = father.fakeOnly('name');
    Guardian.put(father._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it.only('should work with instance as updates', done => {
    const updates = father.fakeOnly('name');
    Guardian.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work with refs when updates', done => {
    const updates = _.pick(Child.fake(), 'name');
    Child.put(child._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.name).to.equal(updates.name);
      expect(updated.email).to.equal(child.email);
      expect(updated.createdAt).to.exist;
      expect(updated.updatedAt).to.exist;
      expect(updated.father).to.exist;
      expect(updated.father.name).to.exist;
      console.log('updated', updated);
      child = updated;
      done(error, updated);
    });
  });

  it('should work with refs using `put` static method', done => {
    const updates = Child.fake('name');
    Child.put(child._id, updates, (error, updated) => {
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
      child = updated;
      done(error, updated);
    });
  });

  after(done => clear(Guardian, Child, done));

});
