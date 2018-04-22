'use strict';

//dependencies
const path = require('path');
const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = chai.expect;
const actions = require(path.join(__dirname, '..', '..'));

describe('integration#patch', function () {

  mongoose.plugin(actions);

  const modelName = 'PatchableIntegration';
  const User = mongoose.model(modelName, new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }));

  let father = { name: faker.name.firstName(), age: 58, year: 1960 };

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-rest-actions', done);
  });

  before(function (done) {
    User.remove(done);
  });

  //seed userh
  before(function (done) {
    User.create(father, function (error, created) {
      father = created;
      done(error, created);
    });
  });


  it('should be able to update', function (done) {
    const updates = { name: faker.name.findName() };
    User
      .patch(father._id, updates, function (error, updated) {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.not.be.equal(father.name);
        done(error, updated);
      });
  });

  it('should be able to update an instance', function (done) {
    const updates = father.fakeOnly('name');
    User
      .patch(updates, function (error, updated) {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.be.equal(father.name);
        done(error, updated);
      });
  });

  it('should be able to update an instance', function (done) {
    const updates = father.fakeOnly('name');
    User
      .patch(updates._id, updates, function (error, updated) {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(father._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.be.equal(father.name);
        done(error, updated);
      });
  });

  it('should be able to update', function (done) {
    const updates = { _id: father._id, name: faker.name.findName() };
    User
      .patch(updates, function (error, updated) {
        expect(error).to.not.exist;
        expect(updated).to.exist;
        expect(updated._id).to.eql(updates._id);
        expect(updated.name).to.equal(updates.name);
        expect(updated.name).to.not.be.equal(father.name);
        done(error, updated);
      });
  });

  after(function (done) {
    User.remove(done);
  });

});