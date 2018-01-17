'use strict';


//dependencies
const path = require('path');
const expect = require('chai').expect;
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const index = require(path.join(middlewaresPath, 'index'));

describe('index', function() {

  it('should be a function', function() {
    expect(index).to.be.a('function');
  });

});