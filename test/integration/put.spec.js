import _ from 'lodash';
import { ObjectId } from '@lykmapipo/mongoose-common';
import {
  expect,
  create,
  clear,
  createTestModel,
} from '@lykmapipo/mongoose-test-helpers';
import actions from '../../src';

describe('put', () => {
  const Guardian = createTestModel(
    {
      email: { type: String, unique: true, fake: f => f.internet.email() },
    },
    actions
  );

  const Child = createTestModel(
    {
      email: { type: String, unique: true, fake: f => f.internet.email() },
      father: { type: ObjectId, ref: Guardian.modelName },
    },
    actions
  );

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

  //
  // statics
  //
  it('should fail if no updated document exists', done => {
    const fake = Guardian.fake();
    Guardian.put(fake._id, {}, error => {
      expect(error).to.exist;
      expect(error.name).to.eql('DocumentNotFoundError');
      expect(error.status).to.exist.and.be.equal(400);
      done();
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
      // expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work with instance as updates', done => {
    const updates = father.fakeOnly('name');
    Guardian.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      // expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work with non populated refs when updates', done => {
    const updates = _.pick(Child.fake(), 'name');
    Child.put(child._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.createdAt).to.exist.and.be.eql(child.createdAt);
      expect(updated.updatedAt).to.exist.and.be.above(child.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      expect(updated.father).to.exist;
      done(error, updated);
    });
  });

  it('should work with populated refs when updates', done => {
    const updates = child.fakeOnly('name');
    Child.put(child._id, updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.createdAt).to.exist.and.be.eql(child.createdAt);
      // expect(updated.updatedAt).to.exist.and.be.above(child.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      expect(updated.father).to.exist;
      expect(updated.father._id).to.exist.and.be.eql(father._id);
      expect(updated.father.name).to.equal(father.name);
      done(error, updated);
    });
  });

  it('should work with populated refs when updates', done => {
    const updates = child.fakeOnly('name');
    Child.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.createdAt).to.exist.and.be.eql(child.createdAt);
      // expect(updated.updatedAt).to.exist.and.be.above(child.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      expect(updated.father).to.exist;
      expect(updated.father._id).to.exist.and.be.eql(father._id);
      expect(updated.father.name).to.equal(father.name);
      done(error, updated);
    });
  });

  //
  // instances
  //
  it('should work on instance with updates', done => {
    const updates = _.pick(Guardian.fake(), 'name');
    father.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(father._id);
      expect(updated.createdAt).to.exist.and.be.eql(father.createdAt);
      // expect(updated.updatedAt).to.exist.and.be.above(father.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      done(error, updated);
    });
  });

  it('should work on instance with refs with updates', done => {
    const updates = _.pick(Child.fake(), 'name');
    child.put(updates, (error, updated) => {
      expect(error).to.not.exist;
      expect(updated).to.exist;
      expect(updated._id).to.exist.and.be.eql(child._id);
      expect(updated.createdAt).to.exist.and.be.eql(child.createdAt);
      // expect(updated.updatedAt).to.exist.and.be.above(child.updatedAt);
      expect(updated.name).to.be.eql(updates.name);
      expect(updated.father).to.exist;
      expect(updated.father._id).to.exist.and.be.eql(father._id);
      expect(updated.father.name).to.equal(father.name);
      done(error, updated);
    });
  });

  after(done => clear(Guardian, Child, done));
});
