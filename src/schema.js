const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const makeDir = require('make-dir');

import Table from './table';
import { tablesFromDatabase } from './table-utils';
import { quote, quoteIfNeeded, unquoteList, unquote } from './util';

export default class Schema {
  constructor(json) {
    Object.defineProperty(this, 'tables', {
      value: new Map()
    });

    if (json !== undefined) {
      this.loadJSON(json);
    }
  }

  async save(file) {
    await makeDir(path.basedir(file), '0755');
    return promisify(fs.writeFile)(file, JSON.stringify(this, undefined, '\t'));
  }

  async loadFromDatabase(db) {
    this.tables = await tablesFromDatabase(db);
  }

  async load(file) {
    this.loadJSON(JSON.parse(await promisify(fs.readFile)(file)));
  }

  loadJSON(object) {
    for (const i in object.tables) {
      const t = object.tables[i];
      this.tables.set(i, new Table(i, t.attributes, t.constraints));
    }
  }

  get ddlHash() {
    const hash = crypto.createHash('sha1');
    this.tables.forEach(t => hash.update(t.ddl));
    return hash.digest('hex');
  }

  toJSON() {
    return {
      tables: this.tables
    };
  }
}
