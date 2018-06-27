# mongoose-rest-actions

[![Build Status](https://travis-ci.org/lykmapipo/mongoose-rest-actions.svg?branch=master)](https://travis-ci.org/lykmapipo/mongoose-rest-actions)
[![Dependency Status](https://img.shields.io/david/lykmapipo/mongoose-rest-actions.svg?style=flat)](https://david-dm.org/lykmapipo/mongoose-rest-actions)
[![npm version](https://badge.fury.io/js/mongoose-rest-actions.svg)](https://badge.fury.io/js/mongoose-rest-actions)

[mongoose](https://github.com/Automattic/mongoose) rest actions on top of [expressjs](https://github.com/strongloop/express/)

*Note: You may install [express-mquery](https://github.com/lykmapipo/express-mquery) to have http query parameter parsed to valid mongoose query criteria*

## Installation
```sh
$ npm install --save mongoose mongoose-rest-actions express-mquery
```

## Usage
```js
const express = require('express');
const mquery = require('express-mquery');
const mongoose = require('mongoose');
const actions = require('mongoose-rest-actions');
mongoose.plugin(actions);

//... register & load mongoose models

mongoose.connect('<url>');


const app = express();
app.use(mquery({limit: 10, maxLimit: 50}));
const User = mongoose.model('User');

app.get('/users', function(request, response, next) {

  cost options = request.mquery;

  User
    .get(options, function(error, results) {
      ...handle error or reply
    });

});


app.post('/users', function(request, response, next) {

  cost body = request.body;

  User
    .post(body, function(error, user) {
      ...handle error or reply
    });

});


app.get('/users/:id', function(request, response, next) {

  cost _id = request.params.id;

  User
    .getById(_id, function(error, user) {
      ...handle error or reply
    });

});


app.put('/users/:id', function(request, response, next) {

  let updates = request.body;
  const _id = request.params.id;

  User
    .put(_id, updates, function(error, user) {
      ...handle error or reply
    });

});


app.patch('/users/:id', function(request, response, next) {

  let updates = request.body;
  const _id = request.params.id;

  User
    .patch(_id, updates, function(error, user) {
      ...handle error or reply
    });

});


app.delete('/users/:id', function(request, response, next) {

  const _id = request.params.id;

  User
    .del(_id, function(error, user) {
      ...handle error or reply
    });

});

...

```


## Testing
* Clone this repository

* Install all development dependencies
```sh
$ npm install
```

* Then run test
```sh
$ npm test
```


## Contribute
It will be nice, if you open an issue first so that we can know what is going on, then, fork this repo and push in your ideas. Do not forget to add a bit of test(s) of what value you adding.


## Licence
The MIT License (MIT)

Copyright (c) 2018 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 