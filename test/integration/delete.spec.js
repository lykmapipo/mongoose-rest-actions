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

describe('integration#delete', () => {

  mongoose.plugin(actions);

  const modelName = 'DeletableIntegration';
  const User = mongoose.model(modelName, new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }, { timestamps: true }));

  let father = { name: faker.name.firstName(), age: 58, year: 1960 };

  before((done) => {
    mongoose.connect('mongodb://localhost/mongoose-rest-actions', done);
  });

  before((done) => {
    User.remove(done);
  });

  //seed user
  before((done) => {
    User.create(father, (error, created) => {
      father = created;
      done(error, created);
    });
  });


  it('should be able to delete', (done) => {
    User
      .del(father._id, (error, deleted) => {
        expect(error).to.not.exist;
        expect(deleted).to.exist;
        expect(deleted._id).to.eql(father._id);
        done(error, deleted);
      });

  });

  after((done) => {
    User.remove(done);
  });

});