'use strict';


process.env.NODE_ENV = 'test';


/* dependencies */
const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost/mongoose-rest-actions';


/* clean and restore database */
const wipe = (done) => {
  if (mongoose.connection && mongoose.connection.dropDatabase) {
    mongoose.connection.dropDatabase(done);
  } else {
    done();
  }
};


/* setup database */
before((done) => {
  const options = { useNewUrlParser: true };
  mongoose.connect(MONGODB_URI, options, done);
});


/* clear database */
before(wipe);


/* clear database */
after(wipe);