'use strict';

/* dependencies */
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { clear, createTestModel } = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

// init
const User = createTestModel({}, actions);
let user = User.fake();

// describe
describe.only('delete action', () => {

  beforeEach(() => user = User.fake());

  beforeEach(done => clear(User, done));

  beforeEach(done => user.save(done));

  it('should delete using `del` static method', done => {
    User.del(user._id, (error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(user._id);
      done(error, deleted);
    });
  });

  it('should delete using `del` instance method', done => {
    user.del((error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(user._id);
      done(error, deleted);
    });
  });

  it('should fail `del` static method if not exist', done => {
    const user = User.fake();
    User.del(user._id, error => {
      expect(error).to.exist;
      done();
    });
  });

  it.skip('should fail `del` instance method if not exist', done => {
    const user = User.fake();
    user.del(error => {
      expect(error).to.exist;
      done();
    });
  });

  after(done => clear(User, done));

});
