import {
  sinon,
  expect,
  createTestModel,
  mockModel,
  mockInstance,
} from '@lykmapipo/mongoose-test-helpers';
import del from '../../src/delete';

describe('delete', () => {
  it('should work using `del` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforeDelete = doneCb => doneCb();
        schema.methods.afterDelete = doneCb => doneCb();
      },
      del
    );
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

  it('should work using `del` instance method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforeDelete = doneCb => doneCb();
        schema.methods.afterDelete = doneCb => doneCb();
      },
      del
    );
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
