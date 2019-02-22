'use strict';


//dependencies
const path = require('path');
const faker = require('faker');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const sinon = require('sinon');
const expect = require('chai').expect;

const rootPath = path.join(__dirname, '..', '..');
const libsPath = path.join(rootPath, 'lib');
const post = require(path.join(libsPath, 'post'));

describe('unit#post', () => {

  const PostableSchema = new Schema({
    name: {
      type: String
    }
  });

  PostableSchema.methods.beforePost = (done) => {
    done();
  };

  PostableSchema.methods.afterPost = (done) => {
    done();
  };

  PostableSchema.plugin(post);

  const Postable = mongoose.model('Postable', PostableSchema);

  describe('export', () => {
    it('should be a function', () => {
      expect(post).to.be.a('function');
    });

    it('should have name post', () => {
      expect(post.name).to.be.equal('postPlugin');
    });

    it('should have length of 1', () => {
      expect(post.length).to.be.equal(1);
    });
  });

  describe('instance#post', () => {

    const postable = new Postable({
      name: faker.name.firstName()
    });

    let save;
    let post;
    let beforePost;
    let afterPost;

    beforeEach(() => {
      save =
        sinon.mock(postable).expects('save').yields(null, postable);
      post = sinon.spy(postable, 'post');
      beforePost = sinon.spy(postable, 'beforePost');
      afterPost = sinon.spy(postable, 'afterPost');
    });

    afterEach(() => {
      post.restore();
      beforePost.restore();
      afterPost.restore();
      sinon.restore();
    });

    it('should be able to post(save)', (done) => {
      postable.post((error, created) => {

        expect(beforePost).to.have.been.called;
        expect(beforePost).to.have.been.calledOnce;

        expect(save).to.have.been.called;
        expect(save).to.have.been.calledOnce;

        expect(post).to.have.been.called;
        expect(post).to.have.been.calledOnce;

        expect(afterPost).to.have.been.called;
        expect(afterPost).to.have.been.calledOnce;

        done(error, created);

      });

    });

  });


  describe('static#post', () => {

    const body = {
      name: faker.name.firstName()
    };
    const postable = new Postable(body);

    let post;

    beforeEach(() => {
      post =
        sinon.mock(Postable).expects('post').yields(null, postable);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should be able to post(save)', (done) => {
      Postable
        .post(body, (error, created) => {

          expect(post).to.have.been.called;
          expect(post).to.have.been.calledOnce;
          expect(post).to.have.been.calledWith(body);

          done(error, created);

        });

    });

  });

});
