'use strict';


/* dependencies */
const _ = require('lodash');
const { include } = require('@lykmapipo/include');
const {
  sinon,
  expect,
  createTestModel,
  mockModel,
  mockInstance
} = require('@lykmapipo/mongoose-test-helpers');
const faker = require('@lykmapipo/mongoose-faker');
const put = include(__dirname, '..', '..', 'lib', 'put');


describe('put', () => {

  it('should work using `put` static method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforePut = (updates, done) => done();
      schema.methods.afterPut = (updates, done) => done();
    }, put, faker);
    const user = User.fake();

    const Mock = mockModel(User);
    const mock = mockInstance(user);

    const findById = Mock.expects('findById').yields(null, user);
    const save = mock.expects('save').yields(null, user);
    const beforePut = sinon.spy(user, 'beforePut');
    const afterPut = sinon.spy(user, 'afterPut');

    const updates = _.pick(User.fake(), 'name');
    User.put(user._id, updates, (error, updated) => {
      Mock.verify();
      Mock.restore();

      mock.verify();
      mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(save).to.have.been.calledOnce;
      expect(beforePut).to.have.been.calledOnce;
      expect(afterPut).to.have.been.calledOnce;

      done(error, updated);
    });
  });

  it('should work using `put` instance method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforePut = (updates, done) => done();
      schema.methods.afterPut = (updates, done) => done();
    }, put, faker);
    const user = User.fake();

    const mock = mockInstance(user);

    const save = mock.expects('save').yields(null, user);
    const beforePut = sinon.spy(user, 'beforePut');
    const afterPut = sinon.spy(user, 'afterPut');

    const updates = _.pick(User.fake(), 'name');
    user.put(updates, (error, updated) => {
      mock.verify();
      mock.restore();

      expect(save).to.have.been.calledOnce;
      expect(beforePut).to.have.been.calledOnce;
      expect(afterPut).to.have.been.calledOnce;

      done(error, updated);
    });
  });

});
