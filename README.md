# mongoose-rest-actions(WIP)

[![Build Status](https://travis-ci.org/lykmapipo/mongoose-rest-actions.svg?branch=master)](https://travis-ci.org/lykmapipo/mongoose-rest-actions)
[![Dependency Status](https://img.shields.io/david/lykmapipo/mongoose-rest-actions.svg?style=flat)](https://david-dm.org/lykmapipo/mongoose-rest-actions)
[![npm version](https://badge.fury.io/js/mongoose-rest-actions.svg)](https://badge.fury.io/js/mongoose-rest-actions)

[mongoose](https://github.com/Automattic/mongoose) rest actions on top of [expressjs](https://github.com/strongloop/express/)


## Installation
```sh
$ npm install --save mongoose-rest-actions
```

## Usage
```js
const express = require('express');
const mongoose = require('mongoose');
const actions = require('mongoose-rest-actions');

//load mongoose models
mongoose.connect(<url>);


const app = express();
const employees = actions({
	mongoose: mongoose, //optional
	mount: '/v1', //default to app package.json version
	model: 'Employee', //model instance
	update:{
		protected: ['ssn'],
		populate: 'employer'
	},
	delete:{
		soft: true //default to remove
	},
	create:{
		upsert: true,
		protect
	}
});
app.use(employees);


....


const Employee = new Schema({
	employer:{
		type: ObjectId,
		ref: 'Employer',
		protected: false,
		upsert: true, //{finder: 'eid'}
		autoset: true,
		autpopulate: true
		aggregate: true
	}
});


```

## TODO
- [ ] mocha test suite
- [ ] expose `/aggregates` endpoint
- [ ] expose `/frames` endpoint
- [ ] support scopes and policies/permissions
- [ ] support route versioning (v1.0.0) or ?version=1.0.1 or X-HTTP-Version : 1.0.0
- [ ] support modified content only
- [ ] support caching(only if model have cache strategy)
- [ ] support sub resources(array of refs or reference refs)
- [ ] provide schema details
- [ ] log request
- [ ] add rate limit
- [ ] Add response time header
- [ ] support background operation


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


## References
- [http://jsonapi.org/](http://jsonapi.org/)
- [unit-testing-express-middleware-behavior-in-ecmascript-2015](https://medium.com/@morrissinger/unit-testing-express-middleware-behavior-in-ecmascript-2015-f1641ebb8040)
- [express-unit](https://github.com/thebearingedge/express-unit)


## Licence
The MIT License (MIT)

Copyright (c) 2018 lykmapipo & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 