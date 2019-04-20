'use strict';


/* dependencies */
const { connect, clear, drop } = require('@lykmapipo/mongoose-test-helpers');


/* setup database */
before(done => connect(done));


/* clear database */
before(done => clear(done));


/* drop database */
after(done => drop(done));
