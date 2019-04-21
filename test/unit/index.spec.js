'use strict';


/* dependencies */
const { include } = require('@lykmapipo/include');
const { Schema } = require('@lykmapipo/mongoose-common');
const {
  expect,
  createTestModel,
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe('index', () => {

  const User = createTestModel({
    name: { type: String, fake: f => f.name.findName() },
    address: { type: String, hide: true, fake: f => f.address.streetAddress() },
    password: { type: String, fake: f => f.internet.password() }
  }, actions);

  it('should be able to generate fake instance', () => {
    expect(User.fake).to.exist;
    expect(User.fake).to.be.a('function');

    const user = User.fake();
    expect(user).to.exist;
    expect(user.name).to.exist;
    expect(user.password).to.exist;
  });

  it('should be able to hide default properties', () => {
    let user = User.fake();
    user = user.toJSON();

    expect(user).to.exist;
    expect(user.name).to.exist;
    expect(user.password).to.not.exist;
  });

  it('should be able to hide default properties', () => {
    let user = User.fake();
    user = user.toObject();

    expect(user).to.exist;
    expect(user.name).to.exist;
    expect(user.password).to.not.exist;
  });

  it('should be able to hide base on field options', () => {
    let user = User.fake();
    user = user.toJSON();

    expect(user).to.exist;
    expect(user.name).to.exist;
    expect(user.address).to.not.exist;
  });

  it('should be able to hide base on field options', () => {
    let user = User.fake();
    user = user.toObject();

    expect(user).to.exist;
    expect(user.name).to.exist;
    expect(user.address).to.not.exist;
  });

  it('should add path shortcut to get schema field', () => {
    expect(User.path).to.exist;
    expect(User.path).to.be.a('function');
    expect(User.path.name).to.be.equal('path');
    expect(User.path.length).to.be.equal(1);
  });

  it('should be able to get path', () => {
    const name = User.path('name');
    expect(name).to.exist;
    expect(name).to.be.instanceof(Schema.Types.String);
  });

});
