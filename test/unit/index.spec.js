'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const expect = require('chai').expect;

const actions = require(path.join(__dirname, '..', '..'));

describe('unit#index', () => {

  const IndexableSchema = new Schema({
    name: {
      type: String,
      fake: { generator: 'name', type: 'findName' }
    },
    address: {
      type: String,
      hide: true,
      fake: {
        generator: 'street',
        type: 'streetAddress'
      }
    },
    password: {
      type: String,
      fake: {
        generator: 'internet',
        type: 'password'
      }
    }
  }, { timestamps: true });

  IndexableSchema.plugin(actions);
  const Indexable = mongoose.model('Indexable', IndexableSchema);

  it('should be able to generate fake instance', () => {
    expect(Indexable.fake).to.exist;
    expect(Indexable.fake).to.be.a('function');

    const index = Indexable.fake();
    expect(index).to.exist;
    expect(index.name).to.exist;
    expect(index.password).to.exist;
  });

  it('should be able to hide default properties', () => {
    let index = Indexable.fake();
    index = index.toJSON();

    expect(index).to.exist;
    expect(index.name).to.exist;
    expect(index.password).to.not.exist;
  });

  it('should be able to hide default properties', () => {
    let index = Indexable.fake();
    index = index.toObject();

    expect(index).to.exist;
    expect(index.name).to.exist;
    expect(index.password).to.not.exist;
  });

  it('should be able to hide base on field options', () => {
    let index = Indexable.fake();
    index = index.toJSON();

    expect(index).to.exist;
    expect(index.name).to.exist;
    expect(index.address).to.not.exist;
  });

  it('should be able to hide base on field options', () => {
    let index = Indexable.fake();
    index = index.toObject();

    expect(index).to.exist;
    expect(index.name).to.exist;
    expect(index.address).to.not.exist;
  });

});