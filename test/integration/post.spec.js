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

describe('integration#post', function () {

  mongoose.plugin(actions);

  const modelName = faker.random.uuid();
  const User = mongoose.model(modelName, new Schema({
    name: { type: String, searchable: true, index: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }));


  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-rest-actions', done);
  });

  before(function (done) {
    User.remove(done);
  });

  it('should be able to post', function (done) {

    let father = { name: faker.name.firstName(), age: 58, year: 1960 };

    User
      .post(father, function (error, created) {
        expect(error).to.not.exist;
        expect(created).to.exist;
        expect(created._id).to.exist;
        expect(created.name).to.equal(father.name);
        expect(created.age).to.equal(father.age);
        expect(created.year).to.equal(father.year);
        done(error, created);
      });

  });

  after(function (done) {
    User.remove(done);
  });

});