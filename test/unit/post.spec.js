'use strict';


/* dependencies */
const { include } = require('@lykmapipo/include');
const {
  sinon,
  expect,
  createTestModel,
  mockInstance
} = require('@lykmapipo/mongoose-test-helpers');
const faker = require('@lykmapipo/mongoose-faker');
const post = include(__dirname, '..', '..', 'lib', 'post');


describe('post', () => {

  it('should work using `post` static method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforePost = done => done();
      schema.methods.afterPost = done => done();
    }, post, faker);
    const user = User.fake();

    const mock = mockInstance(user);

    const save = mock.expects('save').yields(null, user);
    const beforePost = sinon.spy(user, 'beforePost');
    const afterPost = sinon.spy(user, 'afterPost');

    User.post(user, (error, created) => {
      mock.verify();
      mock.restore();

      expect(save).to.have.been.calledOnce;
      expect(beforePost).to.have.been.calledOnce;
      expect(afterPost).to.have.been.calledOnce;

      done(error, created);
    });
  });

  it('should work using `post` instance method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforePost = done => done();
      schema.methods.afterPost = done => done();
    }, post, faker);
    const user = User.fake();

    const mock = mockInstance(user);

    const save = mock.expects('save').yields(null, user);
    const beforePost = sinon.spy(user, 'beforePost');
    const afterPost = sinon.spy(user, 'afterPost');

    user.post((error, created) => {
      mock.verify();
      mock.restore();

      expect(save).to.have.been.calledOnce;
      expect(beforePost).to.have.been.calledOnce;
      expect(afterPost).to.have.been.calledOnce;

      done(error, created);
    });
  });

});
