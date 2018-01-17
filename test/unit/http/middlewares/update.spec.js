'use strict';


//dependencies
const path = require('path');
const expect = require('chai').expect;
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const update = require(path.join(middlewaresPath, 'update'));

describe('update', function() {

  it('should be a function', function() {
    expect(update).to.be.a('function');
  });

});