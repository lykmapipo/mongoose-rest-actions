'use strict';


/* dependencies */
const { include } = require('@lykmapipo/include');
const {
  sinon,
  expect,
  createTestModel,
  mockModel
} = require('@lykmapipo/mongoose-test-helpers');
const faker = require('@lykmapipo/mongoose-faker');
const searchable = require('mongoose-regex-search');
const get = include(__dirname, '..', '..', 'lib', 'get');


describe('get', () => {

  it('should work using `getById` static method', done => {

    const User = createTestModel({}, get, faker);
    const user = User.fake();

    const Mock = mockModel(User);
    const findById = Mock.expects('findById');
    const exec = findById.chain('exec').yields(null, user);

    User.getById(user._id, (error, found) => {
      Mock.verify();
      Mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(exec).to.have.been.calledOnce;

      done(error, found);
    });
  });

  it('should work using `get` static method', done => {

    const User = createTestModel({}, schema => {
      schema.statics.afterGet = (options, results, done) => done();
    }, searchable, get, faker);

    const options = { page: 1, limit: 10 };
    const results = {
      data: [User.fake()],
      total: 100,
      size: 1,
      limit: 10,
      skip: 0,
      page: 1,
      pages: 10,
      lastModified: new Date()
    };

    const Mock = mockModel(User);
    const afterGet = sinon.spy(User, 'afterGet');
    const find = Mock.expects('_get').yields(null, results);


    User.get(options, (error, found) => {
      Mock.verify();
      Mock.restore();

      expect(find).to.have.been.calledOnce;
      expect(afterGet).to.have.been.calledOnce;

      done(error, found);
    });
  });

});
