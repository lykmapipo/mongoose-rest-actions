'use strict';


//dependencies
const path = require('path');
const expect = require('chai').expect;
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const show = require(path.join(middlewaresPath, 'show'));

describe('show', function() {

  it('should be a function', function() {
    expect(show).to.be.a('function');
  });

});