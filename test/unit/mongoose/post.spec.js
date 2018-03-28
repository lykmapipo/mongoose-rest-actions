'use strict';


//dependencies
const path = require('path');
const faker = require('faker');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;

const rootPath = path.join(__dirname, '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const pluginsPath = path.join(libsPath, 'mongoose');
const post = require(path.join(pluginsPath, 'post'));

describe.only('post plugin', function () {

  const PostableSchema = new Schema({
    name: { type: String }
  });

  PostableSchema.methods.beforePost = function (done) {
    done();
  };

  PostableSchema.methods.afterPost = function (done) {
    done();
  };

  PostableSchema.plugin(post);

  const Postable = mongoose.model('Postable', PostableSchema);

  describe('export', function () {
    it('should be a function', function () {
      expect(post).to.be.a('function');
    });

    it('should have name post', function () {
      expect(post.name).to.be.equal('postPlugin');
    });

    it('should have length of 1', function () {
      expect(post.length).to.be.equal(1);
    });
  });

  describe('instance#post', function () {

    const postable = new Postable({ name: faker.name.firstName() });

    let save;
    let post;
    let beforePost;
    let afterPost;

    beforeEach(function () {
      save =
        sinon.mock(postable).expects('save').yields(null, postable);
      post = sinon.spy(postable, 'post');
      beforePost = sinon.spy(postable, 'beforePost');
      afterPost = sinon.spy(postable, 'afterPost');
    });

    afterEach(function () {
      save.restore();
      post.restore();
      beforePost.restore();
      afterPost.restore();
    });

    it('should be able to post(save)', function (done) {
      postable.post(function (error, created) {

        expect(beforePost).to.have.been.called;
        expect(beforePost).to.have.been.calledOnce;

        expect(post).to.have.been.called;
        expect(post).to.have.been.calledOnce;


        expect(afterPost).to.have.been.called;
        expect(afterPost).to.have.been.calledOnce;

        done(error, created);

      });

    });

  });


  describe('static#post', function () {

    const body = { name: faker.name.firstName() };
    const postable = new Postable(body);

    let post;

    beforeEach(function () {
      post =
        sinon.mock(Postable).expects('post').yields(null, postable);
    });

    afterEach(function () {
      post.restore();
    });

    it('should be able to post(save)', function (done) {
      Postable
        .post(body, function (error, created) {

          expect(post).to.have.been.called;
          expect(post).to.have.been.calledOnce;
          expect(post).to.have.been.calledWith(body);

          done(error, created);

        });

    });

  });

});