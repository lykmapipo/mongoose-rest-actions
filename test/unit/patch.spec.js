import _ from 'lodash';
import {
  sinon,
  expect,
  createTestModel,
  mockModel,
  mockInstance,
} from '@lykmapipo/mongoose-test-helpers';
import patch from '../../src/patch';

describe('patch', () => {
  it('should work using `patch` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePatch = (updates, doneCb) => doneCb();
        schema.methods.afterPatch = (updates, doneCb) => doneCb();
      },
      patch
    );
    const user = User.fake();

    const Mock = mockModel(User);
    const mock = mockInstance(user);

    const findById = Mock.expects('findById');
    const exec = findById.chain('exec').yields(null, user);
    const save = mock.expects('save').yields(null, user);
    const beforePatch = sinon.spy(user, 'beforePatch');
    const afterPatch = sinon.spy(user, 'afterPatch');

    const updates = _.pick(User.fake(), 'name');
    User.patch(user._id, updates, (error, updated) => {
      Mock.verify();
      Mock.restore();

      mock.verify();
      mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(exec).to.have.been.calledOnce;
      expect(save).to.have.been.calledOnce;
      expect(beforePatch).to.have.been.calledOnce;
      expect(afterPatch).to.have.been.calledOnce;

      done(error, updated);
    });
  });

  it('should work using `patch` instance method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePatch = (updates, doneCb) => doneCb();
        schema.methods.afterPatch = (updates, doneCb) => doneCb();
      },
      patch
    );
    const user = User.fake();

    const mock = mockInstance(user);

    const save = mock.expects('save').yields(null, user);
    const beforePatch = sinon.spy(user, 'beforePatch');
    const afterPatch = sinon.spy(user, 'afterPatch');

    const updates = _.pick(User.fake(), 'name');
    user.patch(updates, (error, updated) => {
      mock.verify();
      mock.restore();

      expect(save).to.have.been.calledOnce;
      expect(beforePatch).to.have.been.calledOnce;
      expect(afterPatch).to.have.been.calledOnce;

      done(error, updated);
    });
  });
});
