import {
  sinon,
  expect,
  createTestModel,
  mockModel,
} from '@lykmapipo/mongoose-test-helpers';
import searchable from 'mongoose-regex-search';
import get from '../../src';

describe('get', () => {
  it('should work using `getById` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.statics.beforeGetById = doneCb => doneCb();
        schema.statics.afterGetById = (instance, doneCb) => doneCb();
      },
      get
    );
    const user = User.fake();

    const Mock = mockModel(User);
    const findById = Mock.expects('findById');
    const exec = findById.chain('exec').yields(null, user);
    const beforeGetById = sinon.spy(User, 'beforeGetById');
    const afterGetById = sinon.spy(User, 'afterGetById');

    User.getById(user._id, (error, found) => {
      Mock.verify();
      Mock.restore();

      expect(findById).to.have.been.calledOnce;
      expect(findById).to.have.been.calledWith(user._id);
      expect(exec).to.have.been.calledOnce;
      expect(beforeGetById).to.have.been.calledOnce;
      expect(afterGetById).to.have.been.calledOnce;

      done(error, found);
    });
  });

  it('should work using `get` static method', done => {
    const User = createTestModel(
      {},
      Schema => {
        const schema = Schema;
        schema.statics.beforeGet = (options, doneCb) => doneCb();
        schema.statics.afterGet = (options, results, doneCb) => doneCb();
      },
      searchable,
      get
    );

    const options = { page: 1, limit: 10 };
    const results = {
      data: [User.fake()],
      total: 100,
      size: 1,
      limit: 10,
      skip: 0,
      page: 1,
      pages: 10,
      lastModified: new Date(),
    };

    const Mock = mockModel(User);
    const beforeGet = sinon.spy(User, 'beforeGet');
    const afterGet = sinon.spy(User, 'afterGet');
    const find = Mock.expects('getHelperFn').yields(null, results);

    User.get(options, (error, found) => {
      Mock.verify();

      Mock.restore();
      expect(find).to.have.been.calledOnce;
      expect(beforeGet).to.have.been.calledOnce;
      expect(afterGet).to.have.been.calledOnce;

      done(error, found);
    });
  });
});
