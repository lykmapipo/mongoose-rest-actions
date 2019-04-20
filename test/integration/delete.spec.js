'use strict';

/* dependencies */
const path = require('path');
const { expect } = require('chai');
const { model, Schema } = require('@lykmapipo/mongoose-common');
const { clear } = require('@lykmapipo/mongoose-test-helpers');
const actions = require(path.join(__dirname, '..', '..'));

describe('Delete Action', () => {

  const UserSchema = new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true, fake: true },
    year: { type: Number, index: true, fake: true }
  }, { timestamps: true });
  UserSchema.plugin(actions);
  const User = model(UserSchema);

  let father = User.fake();

  before(done => clear(User, done));

  before(done => {
    father.save((error, created) => {
      father = created;
      done(error, created);
    });
  });

  it('should delete existing', done => {
    User.del(father._id, (error, deleted) => {
      console.log(deleted);
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(father._id);
      done(error, deleted);
    });
  });

  after(done => clear(User, done));

});
