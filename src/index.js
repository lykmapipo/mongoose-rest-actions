import _ from 'lodash';
import '@lykmapipo/mongoose-common';

// common plugins
import fake from '@lykmapipo/mongoose-faker';
import search from 'mongoose-regex-search';
import autopopulate from 'mongoose-autopopulate';
import hide from 'mongoose-hidden';
import exist from 'mongoose-exists';
import taggable from '@lykmapipo/mongoose-taggable';
import aggregatable from '@lykmapipo/mongoose-aggregatable';

/* import rest plugins */
import del from './delete';
import get from './get';
import patch from './patch';
import post from './post';
import put from './put';

// constants
const defaultHidden = {
  defaultHidden: {
    password: true,
    __v: true,
    __t: true,
  },
  virtuals: {
    id: 'hideJSON',
    runInBackgroundQueue: 'hide',
    runInBackgroundOptions: 'hide',
  },
};

/**
 * @module mongoose-rest-actions
 * @name restActions
 * @function restActions
 * @description mongoose schema plugins to support http verb(s)
 * @param {Schema} schema valid mongoose schema
 * @param {Object} [schemaOptns] valid delete plugin options
 * @param {String} [schemaOptns.root] a field name to use to hold results.
 * default to `data`
 *
 * @author lally elias<lallyelias87@gmail.com>
 * @version 0.18.0
 * @since 0.1.0
 * @example
 *
 * const { Schema } = require('mongoose');
 * const actions = require('mongoose-rest-actions');
 *
 * const User = new Schema({
 *   name: { type: String }
 * });
 * User.plugin(actions);
 *
 */
function restActions(Schema, schemaOptns) {
  const schema = Schema;
  /* @todo refactor and simplify */

  // ignore if already plugged-in
  if (schema.statics.get) {
    return;
  }

  // normalize options
  const schemaOptions = _.merge(
    {},
    {
      root: 'data',
    },
    schemaOptns
  );

  // ensure indexed timestamps fields
  // currently mongoose does not index them
  // see https:// github.com/Automattic/mongoose/blob/master/lib/schema.js#L1002
  const hasTimeStamps = _.get(schema, 'options.timestamps', false);
  if (hasTimeStamps) {
    // obtain timestamps paths
    const createdAtField = _.isBoolean(hasTimeStamps)
      ? 'createdAt'
      : hasTimeStamps.createdAt;
    schema.statics.CREATED_AT_FIELD = createdAtField;

    const updatedAtField = _.isBoolean(hasTimeStamps)
      ? 'updatedAt'
      : hasTimeStamps.updatedAt;
    schema.statics.UPDATED_AT_FIELD = updatedAtField;

    // ensure index on create timestamp path if not exists
    if (schema.paths[createdAtField]) {
      schema.paths[createdAtField].options.index = true;
      schema.index({
        [createdAtField]: 1,
      });
    }

    // ensure index on update timestamp path if not exists
    if (schema.paths[updatedAtField]) {
      schema.paths[updatedAtField].options.index = true;
      schema.index({
        [updatedAtField]: 1,
      });
    }
  }

  // extend schema with deletedAt timestamp
  schema.add({
    deletedAt: {
      type: Date,
      index: true,
    },
  });

  // rest actions plugin
  get(schema, schemaOptions);
  post(schema, schemaOptions);
  put(schema, schemaOptions);
  patch(schema, schemaOptions);
  del(schema, schemaOptions);

  // lastly common plugins
  fake(schema, schemaOptions);
  exist(schema, schemaOptions);
  taggable(schema, schemaOptions);
  search(schema, schemaOptions);
  autopopulate(schema, schemaOptions);
  aggregatable(schema, schemaOptions);
  hide(defaultHidden)(schema, schemaOptions);
}

export default restActions;
