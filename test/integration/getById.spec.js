'use strict';

/* dependencies */
const { include } = require('@lykmapipo/include');
const { ObjectId } = require('@lykmapipo/mongoose-common');
const {
  expect,
  create,
  clear,
  createTestModel
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe('getById', () => {

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

  it('should work with `ObjectId` using `getById` static method', done => {
    Guardian.getById(father._id, (error, found) => {
      expect(error).to.not.exist;
      expect(found).to.exist;
      expect(found._id).to.exist.and.be.eql(father._id);
      expect(found.name).to.equal(father.name);
      expect(found.email).to.equal(father.email);
      expect(found.createdAt).to.exist;
      expect(found.updatedAt).to.exist;
      done(error, found);
    });
  });

  it('should work with `ObjectId` using `getById` static method', done => {
    Child.getById(child._id, (error, found) => {
      expect(error).to.not.exist;
      expect(found).to.exist;
      expect(found._id).to.exist.and.be.eql(child._id);
      expect(found.name).to.equal(child.name);
      expect(found.email).to.equal(child.email);
      expect(found.createdAt).to.exist;
      expect(found.updatedAt).to.exist;
      done(error, found);
    });
  });

  it('should fail using `getById` static method if instance not exist',
    done => {
      const guardian = Guardian.fake();
      Guardian.getById(guardian._id, error => {
        expect(error).to.exist;
        expect(error.name).to.be.equal('DocumentNotFoundError');
        expect(error.status).to.exist.and.be.equal(400);
        done();
      });
    });

  it('should work with options using `getById` static method', done => {
    const options = {
      _id: child._id,
      select: 'name',
      populate: [{ path: 'father', select: 'name' }]
    };
    Child.getById(options, (error, found) => {
      expect(error).to.not.exist;
      expect(found).to.exist;
      expect(found._id).to.exist.and.be.eql(child._id);
      expect(found.name).to.equal(child.name);
      expect(found.email).to.not.exist;
      expect(found.createdAt).not.exist;
      expect(found.updatedAt).not.exist;
      expect(found.father).to.exist;
      expect(found.father._id).to.exist.and.be.eql(father._id);
      expect(found.father.name).to.exist.and.to.equal(father.name);
      expect(found.father.email).to.not.exist;
      done(error, found);
    });
  });

  it('should work with filter options using `getById` static method', done => {
    const options = {
      _id: child._id,
      filter: { name: child.name },
      select: 'name',
      populate: [{ path: 'father', select: 'name' }]
    };
    Child.getById(options, (error, found) => {
      expect(error).to.not.exist;
      expect(found).to.exist;
      expect(found._id).to.exist.and.be.eql(child._id);
      expect(found.name).to.equal(child.name);
      expect(found.email).to.not.exist;
      expect(found.createdAt).not.exist;
      expect(found.updatedAt).not.exist;
      expect(found.father).to.exist;
      expect(found.father._id).to.exist.and.be.eql(father._id);
      expect(found.father.name).to.exist.and.to.equal(father.name);
      expect(found.father.email).to.not.exist;
      done(error, found);
    });
  });

  after(done => clear(Guardian, Child, done));

});
