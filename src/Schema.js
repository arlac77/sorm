/* jslint node: true, esnext: true */

'use strict';

const crypto = require('crypto'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  async = require('async');

import Table from './Table';

import {
  quote, quoteIfNeeded, unquoteList, unquote
}
from './util';


export class Schema {
  constructor() {
    Object.defineProperty(this, 'tables', {
      value: new Map()
    });
  }

  save(file) {
    return new Promise((fullfill, reject) =>
      mkdirp(path.basedir(file), '0755',
        error => fs.writeFile(file, JSON.stringify(this, undefined, '\t')))
    );
  }

  loadFromDatabase(db) {
    tables_from_db(db, (error, tables) => {
      if (error) {
        callback(error);
        return;
      }
      this.tables = tables;

      if (!this.versions) {
        this.versions = {};
        this.versions[this.schemaHash] = {
          tag: 1
        };
      }

      callback(error, this);
    });
  }

  load(file) {
    return new Promise((fullfill, reject) => {
      fs.readFile(file, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        this.loadJSON(JSON.parse(data));
        fullfill(this);
      });
    });
  }

  loadJSON(object) {
    const tables = {};

    for (const i in object.tables) {
      const t = object.tables[i];
      this.tables.put(i, new Table(i, t.attributes, t.constraints));
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
