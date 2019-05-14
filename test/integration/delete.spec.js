import {
  expect,
  clear,
  create,
  createTestModel,
} from '@lykmapipo/mongoose-test-helpers';
import actions from '../../src';

describe('delete', () => {
  const User = createTestModel({}, actions);
  const father = User.fake();
  const mother = User.fake();
  const aunt = User.fake();
  const child = User.fake();

  before(done => clear(User, done));

  before(done => create(father, mother, aunt, child, done));

  it('should work using `del` static method', done => {
    User.del(father._id, (error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(father._id);
      done(error, deleted);
    });
  });

  it('should work using `del` instance method', done => {
    mother.del((error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(mother._id);
      done(error, deleted);
    });
  });

  it('should fail using `del` static method if instance not exist', done => {
    const user = User.fake();
    User.del(user._id, error => {
      expect(error).to.exist;
      done();
    });
  });

  it('should work using `del` instance method if instance not exist', done => {
    const user = User.fake();
    user.del(error => {
      expect(error).to.not.exist;
      done();
    });
  });

  it('should soft delete using `del` instance method', done => {
    child.del({ soft: true }, (error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(child._id);
      expect(deleted.deletedAt).to.exist;
      done(error, deleted);
    });
  });

  it('should soft delete using `del` static method', done => {
    const options = { _id: aunt._id, soft: true };
    User.del(options, (error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(aunt._id);
      expect(deleted.deletedAt).to.exist;
      done(error, deleted);
    });
  });

  after(done => clear(User, done));
});
