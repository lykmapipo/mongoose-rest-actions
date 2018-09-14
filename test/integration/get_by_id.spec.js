'use strict';

//dependencies
const path = require('path');
const _ = require('lodash');
const async = require('async');
const faker = require('faker');
const chai = require('chai');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const expect = chai.expect;
const actions = require(path.join(__dirname, '..', '..'));

describe('integration#getById', () => {

  mongoose.plugin(actions);

  const modelName = 'GetByIdIntegration';
  const User = mongoose.model(modelName, new Schema({
    name: { type: String, searchable: true, index: true, fake: true },
    age: { type: Number, index: true },
    year: { type: Number, index: true },
    mother: { type: ObjectId, ref: modelName, index: true, autoset: true },
    father: { type: ObjectId, ref: modelName, index: true, autoset: true }
  }));

  let father = { name: faker.name.firstName(), age: 58, year: 1960 };
  let mother = { name: faker.name.firstName(), age: 48, year: 1970 };
  let kids = _.map(_.range(1, 3), (age) => {
    return { name: faker.name.firstName(), age: age, year: 1980 + age };
  });

  before((done) => {
    mongoose.connect('mongodb://localhost/mongoose-rest-actions', done);
  });

  before((done) => {
    User.deleteMany(done);
  });

  //seed user
  before((done) => {
    async.waterfall([
      (next) => {
        async.parallel({
          mother: (next) => {
            User.create(mother, next);
          },
          father: (next) => {
            User.create(father, next);
          }
        }, next);
      },
      (parents, next) => {
        mother = parents.mother;
        father = parents.father;
        User
          .create(
            _.map(kids, (kid) => {
              return _.merge({}, kid, parents);
            }),
            (error, created) => {
              kids = created;
              next(error, created);
            });
      }
    ], done);

  });


  it('should be able to get by object id', (done) => {

    User
      .getById(father._id, (error, found) => {
        expect(error).to.not.exist;
        expect(found).to.exist;
        expect(found._id).to.eql(found._id);
        done(error, found);
      });

  });

  it('should be able to get by options', (done) => {

    const kid = kids[0];
    const options = {
      _id: kid._id,
      select: 'name',
      populate: [{ path: 'mother', select: 'name' }]
    };

    User
      .getById(options, (error, found) => {
        expect(error).to.not.exist;
        expect(found).to.exist;
        expect(found._id).to.eql(kid._id);
        expect(found.age).to.not.exist;
        expect(found.year).to.not.exist;
        expect(found.father).to.not.exist;
        expect(found.mother).to.exist;
        expect(found.mother._id).to.be.eql(mother._id);
        done(error, found);
      });

  });


  after((done) => {
    User.deleteMany(done);
  });

});