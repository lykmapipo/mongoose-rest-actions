'use strict';

//dependencies
const path = require('path');
const async = require('async');
const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = chai.expect;
const actions = require(path.join(__dirname, '..', '..'));

describe('integration#post', () => {

  mongoose.plugin(actions);

  const modelName = 'PostableIntegration';
  const schema = new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  });
  schema.index({ name: 1, age: -1 }, { unique: true });
  const User = mongoose.model(modelName, schema);

  before((done) => {
    User.deleteMany(done);
  });

  it('should be able to post', (done) => {

    const father = { name: faker.name.firstName(), age: 58, year: 1960 };

    User
      .post(father, (error, created) => {
        expect(error).to.not.exist;
        expect(created).to.exist;
        expect(created._id).to.exist;
        expect(created.name).to.equal(father.name);
        expect(created.age).to.equal(father.age);
        expect(created.year).to.equal(father.year);
        done(error, created);
      });

  });

  it('should be able to post instance', (done) => {

    const father = User.fake();

    User
      .post(father, (error, created) => {
        expect(error).to.not.exist;
        expect(created).to.exist;
        expect(created._id).to.exist;
        expect(created.name).to.equal(father.name);
        expect(created.age).to.equal(father.age);
        expect(created.year).to.equal(father.year);
        done(error, created);
      });

  });

  it('should beautify unique error message', (done) => {

    const father = { name: faker.name.firstName(), age: 58, year: 1960 };

    // wait index
    // User.on('index', () => {

    async.waterfall([
      //...take 1
      (next) => {
        User.post(father, next);
      },

      //...take 2
      (saved, next) => {
        User.post(father, next);
      }
    ], (error, result) => {
      expect(error).to.exist;
      expect(error.status).to.exist;
      expect(error.name).to.exist;
      expect(error.name).to.be.equal('ValidationError');
      expect(error._message).to.exist;
      expect(error.errors).to.exist;
      expect(error.errors.name).to.exist;
      expect(error.errors.name.kind).to.exist;
      expect(error.errors.name.kind).to.be.equal('unique');
      done(null, result);

    });

    // });

  });

  after((done) => {
    User.deleteMany(done);
  });

});