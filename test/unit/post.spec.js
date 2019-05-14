import {
  sinon,
  expect,
  createTestModel,
  mockInstance,
} from '@lykmapipo/mongoose-test-helpers';
import post from '../../src/post';

describe('post', () => {
  it('should work using `post` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePost = doneCb => doneCb();
        schema.methods.afterPost = doneCb => doneCb();
      },
      post
    );
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
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.methods.beforePost = doneCb => doneCb();
        schema.methods.afterPost = doneCb => doneCb();
      },
      post
    );
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
