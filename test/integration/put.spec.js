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

describe('integration#put', () => {

  const modelName = 'PutableIntegration';
  const UserSchema = new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  });
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


  it('should be able to update', (done) => {
    const updates = { name: faker.name.findName() };
    User
      .put(father._id, updates, (error, updated) => {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.not.be.equal(father.name);
        done(error, updated);
      });
  });


  it('should be able to update an instance', (done) => {
    const updates = father.fakeOnly('name');
    User
      .put(updates, (error, updated) => {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.be.equal(father.name);
        done(error, updated);
      });
  });

  it('should be able to update an instance', (done) => {
    const updates = father.fakeOnly('name');
    User
      .put(updates._id, updates, (error, updated) => {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.be.equal(father.name);
        done(error, updated);
      });
  });


  it('should be able to update', (done) => {
    const updates = { _id: father._id, name: faker.name.findName() };
    User
      .put(updates, (error, updated) => {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(updates._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.not.be.equal(father.name);
        done(error, updated);
      });
  });

  after((done) => {
    User.deleteMany(done);
  });

});