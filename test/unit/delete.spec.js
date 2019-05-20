'use strict';


/* dependencies */
const { include } = require('@lykmapipo/include');
const {
  sinon,
  expect,
  createTestModel,
  mockModel,
  mockInstance
} = require('@lykmapipo/mongoose-test-helpers');
const del = include(__dirname, '..', '..', 'lib', 'delete');


describe('delete', () => {

  it('should work using `del` static method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforeDelete = done => done();
      schema.methods.afterDelete = done => done();
    }, del);
    const user = User.fake();

    const Mock = mockModel(User);
    const mock = mockInstance(user);

    const findById = Mock.expects('findById');
    const exec = findById.chain('exec').yields(null, user);
    const remove = mock.expects('remove').yields(null, user);
    const beforeDelete = sinon.spy(user, 'beforeDelete');
    const afterDelete = sinon.spy(user, 'afterDelete');

    User.del(user._id, (error, deleted) => {
      Mock.verify();
      Mock.restore();

      mock.verify();
      mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(exec).to.have.been.calledOnce;
      expect(remove).to.have.been.calledOnce;
      expect(beforeDelete).to.have.been.calledOnce;
      expect(afterDelete).to.have.been.calledOnce;

      done(error, deleted);
    });
  });

  it('should work using `del` static method with filter', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforeDelete = done => done();
      schema.methods.afterDelete = done => done();
    }, del);
    const user = User.fake();

    const Mock = mockModel(User);
    const mock = mockInstance(user);

    const findById = Mock.expects('findById');
    const where = findById.chain('where');
    const exec = findById.chain('exec').yields(null, user);
    const remove = mock.expects('remove').yields(null, user);
    const beforeDelete = sinon.spy(user, 'beforeDelete');
    const afterDelete = sinon.spy(user, 'afterDelete');

    const options = { _id: user._id, filter: { name: user.name } };
    User.del(options, (error, deleted) => {
      Mock.verify();
      Mock.restore();

      mock.verify();
      mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(where).to.have.been.calledOnce;
      expect(where).to.have.been.calledWith(options.filter);
      expect(exec).to.have.been.calledOnce;
      expect(remove).to.have.been.calledOnce;
      expect(beforeDelete).to.have.been.calledOnce;
      expect(afterDelete).to.have.been.calledOnce;

      done(error, deleted);
    });
  });

  it('should work using `del` instance method', done => {

    const User = createTestModel({}, schema => {
      schema.methods.beforeDelete = done => done();
      schema.methods.afterDelete = done => done();
    }, del);
    const user = User.fake();

    const mock = mockInstance(user);

    const remove = mock.expects('remove').yields(null, user);
    const beforeDelete = sinon.spy(user, 'beforeDelete');
    const afterDelete = sinon.spy(user, 'afterDelete');

    user.del((error, deleted) => {
      mock.verify();
      mock.restore();

      expect(remove).to.have.been.calledOnce;
      expect(beforeDelete).to.have.been.calledOnce;
      expect(afterDelete).to.have.been.calledOnce;

      done(error, deleted);
    });
  });

});
