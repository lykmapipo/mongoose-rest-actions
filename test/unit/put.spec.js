import _ from 'lodash';
import {
  sinon,
  expect,
  createTestModel,
  mockModel,
  mockInstance,
} from '@lykmapipo/mongoose-test-helpers';
import put from '../../src/put';

describe('put', () => {
  it('should work using `put` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePut = (updates, doneCb) => doneCb();
        schema.methods.afterPut = (updates, doneCb) => doneCb();
      },
      put
    );
    const user = User.fake();

    const Mock = mockModel(User);
    const mock = mockInstance(user);

    const findById = Mock.expects('findById');
    const exec = findById.chain('exec').yields(null, user);
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
      expect(exec).to.have.been.calledOnce;
      expect(save).to.have.been.calledOnce;
      expect(beforePut).to.have.been.calledOnce;
      expect(afterPut).to.have.been.calledOnce;

      done(error, updated);
    });
  });

  it('should work using `put` instance method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePut = (updates, doneCb) => doneCb();
        schema.methods.afterPut = (updates, doneCb) => doneCb();
      },
      put
    );
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
