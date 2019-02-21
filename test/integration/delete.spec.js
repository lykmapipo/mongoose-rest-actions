'use strict';

//dependencies
const path = require('path');
const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const { model } = require('@lykmapipo/mongoose-common');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = chai.expect;
const actions = require(path.join(__dirname, '..', '..'));

describe('integration#delete', () => {

  const modelName = 'DeletableIntegration';
  const UserSchema = new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }, { timestamps: true });
  UserSchema.plugin(actions);
  const User = model(modelName, UserSchema);

  let father = { name: faker.name.firstName(), age: 58, year: 1960 };

  before((done) => {
    User.deleteMany(done);
  });

  //seed user
  before((done) => {
    User.create(father, (error, created) => {
      father = created;
      done(error, created);
    });
  });


  it('should be able to delete', (done) => {
    User.del(father._id, (error, deleted) => {
      expect(error).to.not.exist;
      expect(deleted).to.exist;
      expect(deleted._id).to.eql(father._id);
      done(error, deleted);
    });
  });

  after((done) => {
    User.deleteMany(done);
  });

});