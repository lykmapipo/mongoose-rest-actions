'use strict';

/* dependencies */
const async = require('async');
const { expect } = require('chai');
const { include } = require('@lykmapipo/include');
const { ObjectId } = require('@lykmapipo/mongoose-common');
const {
  clear,
  createTestModel
} = require('@lykmapipo/mongoose-test-helpers');
const actions = include(__dirname, '..', '..');

describe.only('post', () => {

  const Guardian = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() }
  }, actions);

  const Child = createTestModel({
    email: { type: String, unique: true, fake: f => f.internet.email() },
    mother: {
      type: ObjectId,
      ref: Guardian.modelName,
      fake: () => Guardian.fake()
    }
  }, actions);

  before(done => clear(Guardian, Child, done));

  it('should work using `post` static method', done => {
    const father = Guardian.fake();
    Guardian.post(father, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist;
      expect(created.name).to.equal(father.name);
      expect(created.age).to.equal(father.age);
      expect(created.year).to.equal(father.year);
      done(error, created);
    });
  });

  it.skip('should work using `post` static method', done => {
    const child = Child.fake();
    Child.post(child, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist;
      expect(created.name).to.equal(child.name);
      expect(created.age).to.equal(child.age);
      expect(created.year).to.equal(child.year);
      done(error, created);
    });
  });

  it.skip('should be able to post instance', done => {
    const father = Guardian.fake();

    Guardian.post(father, (error, created) => {
      expect(error).to.not.exist;
      expect(created).to.exist;
      expect(created._id).to.exist;
      expect(created.name).to.equal(father.name);
      expect(created.age).to.equal(father.age);
      done(error, created);
    });
  });

  it.skip('should beautify unique error message', done => {
    const father = Guardian.fake();

    // wait index
    // Guardian.on('index', () => {

    async.waterfall([
      //...take 1
      (next) => {
        Guardian.post(father, next);
      },

      //...take 2
      (saved, next) => {
        Guardian.post(father, next);
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

  before(done => clear(Guardian, Child, done));

});
