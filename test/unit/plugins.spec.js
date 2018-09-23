'use strict';


//dependencies
const path = require('path');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const expect = require('chai').expect;
const actions = require(path.join(__dirname, '..', '..'));


describe('unit#plugins', () => {

  const PlugableSchema = new Schema({
    name: { type: String, fake: { generator: 'name', type: 'firstName' } },
    password: { type: String, fake: { generator: 'internet', type: 'password' } }
  }, { timestamps: true });
  PlugableSchema.plugin(actions);
  const Plugable = mongoose.model('Plugable', PlugableSchema);

  describe('hidden', () => {

    it('should be able to hide defaults', () => {
      const plugable = Plugable.fake();
      expect(plugable).to.exist;
      expect(plugable.name).to.exist;
      expect(plugable.password).to.exist;

      const object = plugable.toObject();
      expect(object).to.exist;
      expect(object.name).to.exist;
      expect(object.password).to.not.exist;

      const json = plugable.toJSON();
      expect(json).to.exist;
      expect(json.name).to.exist;
      expect(json.password).to.not.exist;
    });

  });


});