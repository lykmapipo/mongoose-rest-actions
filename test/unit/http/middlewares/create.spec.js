'use strict';


//dependencies
const path = require('path');
const expect = require('chai').expect;
const rootPath = path.join(__dirname, '..', '..', '..', '..');
const libsPath = path.join(rootPath, 'lib');
const middlewaresPath = path.join(libsPath, 'http', 'middlewares');
const create = require(path.join(middlewaresPath, 'create'));


describe('create', function() {

  it('should be a function', function() {
    expect(create).to.be.a('function');
  });

});